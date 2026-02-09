# storage/saver.py
import json
import asyncio
import aiohttp
import httpx
import aiofiles
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Set
from datetime import datetime
import base64
import hashlib
import glob
from urllib.parse import urljoin, urlparse, urlsplit
import mimetypes

from utils.helpers import sanitize_filename, generate_run_id, truncate_text
from config.config_manager import OutputConfig

class DataSaver:
    """Klasse voor het opslaan van gescrapede data en afbeeldingen"""
    
    def __init__(self, output_config: OutputConfig, run_id: Optional[str] = None):
        """
        Initialiseer DataSaver met output configuratie.
        
        Args:
            output_config: Configuratie voor output (output_dir, filename_template, etc.)
            run_id: Optionele run ID, anders wordt er een gegenereerd
        """
        self.output_config = output_config
        self.run_id = run_id or generate_run_id()
        
        # Data tracking voor manifest
        self.files_data: List[Dict[str, Any]] = []
        self.images_data: List[Dict[str, Any]] = []
        self.completed_items: Set[Tuple[int, int]] = set() # (chapter, paragraph)
        self.metadata: Dict[str, Any] = {
            "run_id": self.run_id,
            "start_time": datetime.now().isoformat(),
            "config_hash": self._compute_config_hash(output_config)
        }
        
        # Setup directory structuur
        self.setup_directories()
        
    def load_existing_progress(self, book_title: str):
        """
        Zoek naar bestaande manifesten voor dit boek en laad wat al is gedaan.
        Dit zorgt ervoor dat we kunnen hervatten waar we gebleven waren.
        """
        self.completed_items.clear()
        
        # Zoek alle manifest bestanden in de runs directory
        runs_dir = Path(self.output_config.output_dir) / "runs"
        if not runs_dir.exists():
            return

        manifest_files = list(runs_dir.glob("**/manifest.json"))
        
        found_count = 0
        for manifest_path in manifest_files:
            try:
                with open(manifest_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Check of dit manifest voor hetzelfde boek is
                    if data.get("metadata", {}).get("book_title") == book_title:
                        for file_info in data.get("files", []):
                            ch = file_info.get("chapter_index")
                            pa = file_info.get("paragraph_index")
                            if ch is not None and pa is not None:
                                self.completed_items.add((ch, pa))
                                found_count += 1
            except Exception as e:
                print(f"Waarschuwing: Kon manifest {manifest_path} niet laden voor resume: {str(e)}")
        
        if found_count > 0:
            print(f"Hervatten: {found_count} reeds geëxporteerde items gevonden voor '{book_title}'")

    def is_completed(self, chapter_index: int, paragraph_index: int) -> bool:
        """Check of een item al is geëxporteerd"""
        return (chapter_index, paragraph_index) in self.completed_items

    def setup_directories(self, book_title: str = "unknown_book"):
        """Stel de directory structuur op voor deze run"""
        # Basis output directory
        self.output_dir = Path(self.output_config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Georganiseerde export directory
        self.export_dir = self.output_dir / "exports" / sanitize_filename(book_title)
        self.export_dir.mkdir(parents=True, exist_ok=True)
        
        # Run directory (voor metadata en screenshots)
        self.run_dir = self.output_dir / "runs" / self.run_id
        self.run_dir.mkdir(parents=True, exist_ok=True)
        
        # Screenshots directory voor debugging
        self.screenshots_dir = self.run_dir / "screenshots"
        self.screenshots_dir.mkdir(exist_ok=True)
        
        # Logs directory
        self.logs_dir = self.run_dir / "logs"
        self.logs_dir.mkdir(exist_ok=True)
        
        # Sla ook de boektitel op in metadata voor latere herkenning
        self.metadata["book_title"] = book_title
        
    def _compute_config_hash(self, config) -> str:
        """Bereken hash van configuratie voor tracking"""
        if hasattr(config, 'model_dump'):
            config_dict = config.model_dump()
        else:
            config_dict = config
        config_str = json.dumps(config_dict, sort_keys=True)
        return hashlib.sha256(config_str.encode()).hexdigest()[:16]
    
    def get_screenshot_path(self, name: str) -> Path:
        """
        Genereer pad voor screenshot.
        
        Args:
            name: Naam voor screenshot (bijv. "captcha", "error", "success")
            
        Returns:
            Path object naar screenshot bestand
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"screenshot_{name}_{timestamp}.png"
        return self.screenshots_dir / filename
        
    async def save_data(self, data: Dict[str, Any]) -> str:
        """
        Sla tekstdata op voor een paragraaf in een georganiseerde mappenstructuur.
        """
        try:
            # Bepaal mappenstructuur: exports/BookTitle/Chapter X/Paragraph Y/
            chapter_name = f"Chapter {data.get('chapter_index', 0)}"
            paragraph_name = f"Paragraph {data.get('paragraph_index', 0)}"
            
            para_dir = self.export_dir / chapter_name / paragraph_name
            para_dir.mkdir(parents=True, exist_ok=True)
            
            # Bestandsnaam voor de tekst
            ext = ".txt"
            if self.output_config.export_format == "md":
                ext = ".md"
            elif self.output_config.export_format == "pdf":
                ext = ".pdf"
            elif self.output_config.export_format == "epub":
                ext = ".epub"
                
            filename = self.output_config.filename_template.format(
                chapter=data.get('chapter_index', 0),
                paragraph=data.get('paragraph_index', 0),
                timestamp=datetime.now().strftime("%H%M%S")
            ) + ext
            
            filepath = para_dir / filename
            temp_filepath = filepath.with_suffix(".tmp")
            
            # Formatteer inhoud volgens blueprint
            content = self._format_content(data)
            
            # Gebruik aiofiles voor asynchrone write naar temp bestand
            async with aiofiles.open(temp_filepath, 'w', encoding='utf-8') as f:
                await f.write(content)
            
            # Rename temp bestand naar definitief bestand (Atomic Save)
            temp_filepath.replace(filepath)
            
            # Track voor manifest (beperk geheugengebruik bij HEEL VEEL data)
            file_info = {
                "path": str(filepath.relative_to(self.output_dir)),
                "chapter_index": data.get('chapter_index', 0),
                "paragraph_index": data.get('paragraph_index', 0),
                "objectives_length": len(data.get("objectives", "")),
                "lesson_length": len(data.get("lesson", "")),
                "timestamp": datetime.now().isoformat(),
                "url": data.get("url", ""),
                "filename": filename
            }
            self.files_data.append(file_info)
            
            # Periodiek manifest opslaan om geheugen te sparen en data veilig te stellen
            if len(self.files_data) % 50 == 0:
                await self.save_manifest()
            
            return str(filepath)
            
        except Exception as e:
            print(f"Fout bij opslaan data: {str(e)}")
            return ""

    def _format_content(self, data: Dict[str, Any]) -> str:
        """Formatteer inhoud volgens het gespecificeerde formaat"""
        export_format = self.output_config.export_format
        
        if export_format == "md":
            return self._format_markdown(data)
        elif export_format == "pdf":
            # Voor PDF genereren we voorlopig een rijke tekst representatie
            # Echte PDF conversie vereist reportlab/weasyprint
            return self._format_text(data)
        elif export_format == "epub":
            # Voor ePub genereren we voorlopig een XHTML-achtige structuur
            return self._format_markdown(data)
        else:
            return self._format_text(data)

    def _format_text(self, data: Dict[str, Any]) -> str:
        """Formatteer als platte tekst"""
        lines = []
        # Header informatie
        if "book" in data:
            lines.append(f"Book: {data['book']}")
        lines.append(f"Chapter: (index: {data['chapter_index']})")
        lines.append(f"Paragraph: (index: {data['paragraph_index']})")
        if "label" in data:
            lines.append(f"Label: {data['label']}")
        lines.append(f"Timestamp: {data.get('timestamp', datetime.now().isoformat())}")
        lines.append("-" * 40)
        lines.append("Leerdoelen:")
        lines.append("")
        lines.append(data.get("objectives", "(Geen leerdoelen gevonden)"))
        lines.append("")
        lines.append("-" * 40)
        lines.append("Leerstof:")
        lines.append("")
        lines.append(data.get("lesson", "(Geen leerstof gevonden)"))
        lines.append("")
        lines.append("-" * 40)
        lines.append(f"Source URL: {data.get('url', '')}")
        lines.append(f"Run ID: {self.run_id}")
        return "\n".join(lines)

    async def save_media(self, url: str, chapter_idx: int, para_idx: int) -> Optional[str]:
        """
        Download en bewaar media (afbeelding/video) voor een specifieke paragraaf.
        """
        try:
            # Bepaal mappenstructuur
            chapter_name = f"Chapter {chapter_idx}"
            paragraph_name = f"Paragraph {para_idx}"
            media_dir = self.export_dir / chapter_name / paragraph_name / "media"
            media_dir.mkdir(parents=True, exist_ok=True)
            
            # Extraheer bestandsnaam uit URL
            parsed_url = urlsplit(url)
            filename = Path(parsed_url.path).name
            if not filename or "." not in filename:
                # Fallback voor URLs zonder duidelijke extensie
                ext = ".mp4" if "video" in url.lower() else ".png"
                filename = f"media_{hashlib.md5(url.encode()).hexdigest()[:8]}{ext}"
            
            filepath = media_dir / filename
            
            # Download via httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=30.0)
                if response.status_code == 200:
                    async with aiofiles.open(filepath, mode='wb') as f:
                        await f.write(response.content)
                    return str(filepath.relative_to(self.output_dir))
                    
            return None
        except Exception as e:
            print(f"Fout bij downloaden media: {str(e)}")
            return None

    def _format_markdown(self, data: Dict[str, Any]) -> str:
        """Formatteer data als Markdown"""
        lines = []
        
        # Titel sectie
        lines.append(f"# {data.get('book_title', 'Noordhoff Export')}")
        lines.append(f"## Chapter {data.get('chapter_index', 0)} - Paragraph {data.get('paragraph_index', 0)}")
        lines.append(f"*URL: {data.get('url', 'N/A')}*")
        lines.append("")
        
        # Leerdoelen
        if data.get("objectives"):
            lines.append("### Leerdoelen")
            lines.append(data.get("objectives", ""))
            lines.append("")
            
        # Leerstof
        if data.get("lesson"):
            lines.append("### Leerstof")
            lines.append(data.get("lesson", ""))
            lines.append("")
            
        # Afbeeldingen referentie
        images = data.get("images", [])
        if images:
            lines.append("### Afbeeldingen")
            for img in images:
                lines.append(f"![Afbeelding]({img})")
            lines.append("")
            
        return "\n".join(lines)

    async def save_image(self, image_url: str, chapter_index: int, 
                        paragraph_index: int, image_index: int) -> Optional[Path]:
        """
        Download en sla een afbeelding op in de georganiseerde paragraaf map.
        """
        if not self.output_config.save_images:
            return None
            
        try:
            # Bepaal map: exports/BookTitle/Chapter X/Paragraph Y/images/
            chapter_name = f"Chapter {chapter_index}"
            paragraph_name = f"Paragraph {paragraph_index}"
            img_dir = self.export_dir / chapter_name / paragraph_name / "images"
            img_dir.mkdir(parents=True, exist_ok=True)
            
            # Genereer bestandsnaam
            filename = self._generate_image_filename(
                chapter_index, paragraph_index, image_index, image_url
            )
            filepath = img_dir / filename
            
            # Download afbeelding
            image_data = await self._download_image(image_url)
            if not image_data:
                return None
            
            async with aiofiles.open(filepath, 'wb') as f:
                await f.write(image_data)
                
            # Track voor manifest
            self.images_data.append({
                "path": str(filepath.relative_to(self.output_dir)),
                "url": image_url,
                "chapter_index": chapter_index,
                "paragraph_index": paragraph_index,
                "image_index": image_index,
                "size_bytes": len(image_data),
                "filename": filename
            })
            
            return filepath
            
        except Exception as e:
            print(f"Fout bij opslaan afbeelding: {str(e)}")
            return None
    
    def _generate_image_filename(self, chapter_index: int, paragraph_index: int,
                                image_index: int, image_url: str) -> str:
        """Genereer bestandsnaam voor afbeelding volgens specificatie"""
        # Haal extensie op uit URL of bepaal via mimetype
        parsed_url = urlparse(image_url)
        path = parsed_url.path
        
        # Probeer extensie uit path te halen
        ext = ".jpg"  # default
        if "." in path:
            potential_ext = Path(path).suffix.lower()
            if len(potential_ext) <= 5:  # Redelijke extensie lengte
                ext = potential_ext
        
        # Genereer basisnaam volgens specificatie
        base_name = f"{self.run_id}__ch{chapter_index}_p{paragraph_index}__img{image_index}"
        
        # Voeg extensie toe
        filename = base_name + ext
        
        # Sanitize
        return sanitize_filename(filename)
    
    async def _download_image(self, url: str) -> Optional[bytes]:
        """Download afbeelding van URL of data URI met retry logica"""
        try:
            # Check voor data URI
            if url.startswith('data:'):
                return self._extract_data_uri(url)

            # Download van HTTP/HTTPS met retry logica
            max_retries = 3
            retry_delay = 2  # seconden

            for attempt in range(max_retries):
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(url, timeout=10) as response:
                            if response.status == 200:
                                return await response.read()
                            elif response.status in [404, 403]:  # Niet gevonden of geen toegang, stop direct
                                print(f"Download fout: Status {response.status} voor {url} (geen retry)")
                                return None
                            else:
                                print(f"Download poging {attempt + 1} mislukt: Status {response.status} voor {url}")
                except Exception as e:
                    print(f"Download poging {attempt + 1} fout voor {url}: {str(e)}")
                
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2  # Exponentiële backoff

            print(f"Download definitief mislukt voor {url} na {max_retries} pogingen")
            return None

        except Exception as e:
            print(f"Download fout voor {url}: {str(e)}")
            return None
    
    def _extract_data_uri(self, data_uri: str) -> Optional[bytes]:
        """Extraheer data uit data URI"""
        try:
            # Data URI format: data:[<mediatype>][;base64],<data>
            if ';base64,' in data_uri:
                # Base64 encoded
                header, data = data_uri.split(';base64,', 1)
                return base64.b64decode(data)
            else:
                # Plain text (zeldzaam voor images)
                header, data = data_uri.split(',', 1)
                return data.encode('utf-8')
        except Exception as e:
            print(f"Data URI parse fout: {str(e)}")
            return None
    
    async def save_manifest(self) -> str:
        """
        Sla manifest.json op met metadata over de run.
        
        Returns:
            Pad naar manifest bestand
        """
        try:
            # Update metadata met eindtijd
            self.metadata["end_time"] = datetime.now().isoformat()
            self.metadata["total_files"] = len(self.files_data)
            self.metadata["total_images"] = len(self.images_data)
            self.metadata["updated_at"] = datetime.now().isoformat()
            
            # Verzamel alle data
            manifest_data = {
                "metadata": self.metadata,
                "files": self.files_data,
                "images": self.images_data
            }
            
            # Genereer manifest pad
            manifest_filename = self.output_config.manifest_filename
            manifest_path = self.run_dir / manifest_filename
            temp_manifest_path = manifest_path.with_suffix(".tmp")
            
            # Schrijf naar temp bestand
            async with aiofiles.open(temp_manifest_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(manifest_data, indent=2, ensure_ascii=False))
            
            # Rename temp naar definitief (Atomic Save)
            temp_manifest_path.replace(manifest_path)
            
            # Ook eenvoudige tekstversie voor debugging
            summary_path = self.run_dir / "run_summary.txt"
            temp_summary_path = summary_path.with_suffix(".tmp")
            summary = self._generate_summary_text(manifest_data)
            async with aiofiles.open(temp_summary_path, 'w', encoding='utf-8') as f:
                await f.write(summary)
            
            # Rename temp naar definitief
            temp_summary_path.replace(summary_path)
            
            return str(manifest_path)
            
        except Exception as e:
            print(f"Fout bij opslaan manifest: {str(e)}")
            # Val terug op eenvoudige opslag
            error_path = self.run_dir / "manifest_error.txt"
            # manifest_data is used in the error message, ensure it's defined
            manifest_data_str = "Could not serialize manifest data"
            try:
                manifest_data_str = json.dumps({"metadata": self.metadata, "files": len(self.files_data)}, indent=2)
            except: pass
            
            error_content = f"FOUT bij opslaan manifest: {str(e)}\n\nManifest data (samenvatting):\n{manifest_data_str}"
            
            try:
                async with aiofiles.open(error_path, 'w', encoding='utf-8') as f:
                    await f.write(error_content)
            except: pass
                
            return str(error_path)
    
    def _generate_summary_text(self, manifest_data: Dict[str, Any]) -> str:
        """Genereer leesbare samenvatting van de run"""
        metadata = manifest_data["metadata"]
        files = manifest_data["files"]
        images = manifest_data["images"]
        
        lines = []
        lines.append("=" * 60)
        lines.append("NOORDHOFF SCRAPER - RUN SAMENVATTING")
        lines.append("=" * 60)
        lines.append("")
        
        # Run informatie
        lines.append("RUN INFORMATIE:")
        lines.append(f"  Run ID:         {metadata.get('run_id', 'N/A')}")
        lines.append(f"  Start tijd:     {metadata.get('start_time', 'N/A')}")
        lines.append(f"  Eind tijd:      {metadata.get('end_time', 'N/A')}")
        lines.append(f"  Config hash:    {metadata.get('config_hash', 'N/A')}")
        lines.append("")
        
        # Statestieken
        lines.append("STATISTIEKEN:")
        lines.append(f"  Bestanden:      {len(files)} tekstbestanden")
        lines.append(f"  Afbeeldingen:   {len(images)} afbeeldingen")
        lines.append("")
        
        # Bestanden lijst
        lines.append("TEXT BESTANDEN:")
        for file in files:
            lines.append(f"  - {file.get('filename', 'unknown')}")
            lines.append(f"    Hoofdstuk: {file.get('chapter_index', '?')}, "
                        f"Paragraaf: {file.get('paragraph_index', '?')}, "
                        f"Grootte: {file.get('objectives_length', 0) + file.get('lesson_length', 0)} karakters")
            if "error" in file:
                lines.append(f"    FOUT: {file['error']}")
        lines.append("")
        
        # Afbeeldingen lijst
        if images:
            lines.append("AFBEELDINGEN:")
            for img in images:
                lines.append(f"  - {img.get('filename', 'unknown')}")
                lines.append(f"    Hoofdstuk: {img.get('chapter_index', '?')}, "
                            f"Paragraaf: {img.get('paragraph_index', '?')}, "
                            f"Index: {img.get('image_index', '?')}")
                lines.append(f"    Grootte: {img.get('size_bytes', 0)} bytes")
        else:
            lines.append("AFBEELDINGEN: Geen afbeeldingen opgeslagen")
        lines.append("")
        
        # Directory informatie
        lines.append("DIRECTORY STRUCTUUR:")
        lines.append(f"  Output root:    {self.output_dir}")
        lines.append(f"  Run directory:  {self.run_dir}")
        lines.append(f"  Export root:    {self.export_dir}")
        lines.append("")
        
        lines.append("=" * 60)
        lines.append("EINDE SAMENVATTING")
        lines.append("=" * 60)
        
        return "\n".join(lines)
    
    def get_file_list(self) -> List[Dict[str, Any]]:
        """Retourneer lijst van opgeslagen bestanden"""
        return self.files_data.copy()
    
    def get_image_list(self) -> List[Dict[str, Any]]:
        """Retourneer lijst van opgeslagen afbeeldingen"""
        return self.images_data.copy()
    
    def get_run_info(self) -> Dict[str, Any]:
        """Retourneer run informatie"""
        return {
            "run_id": self.run_id,
            "run_dir": str(self.run_dir),
            "output_dir": str(self.output_dir),
            "start_time": self.metadata["start_time"],
            "total_files": len(self.files_data),
            "total_images": len(self.images_data)
        }