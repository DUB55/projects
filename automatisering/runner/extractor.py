# runner/extractor.py
import re
import asyncio
from typing import Dict, List, Optional, Tuple
from playwright.async_api import Page, ElementHandle

class Extractor:
    """Helper class voor het extraheren van content"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Maak tekst schoon: verwijder overbodige whitespace, normaliseer newlines.
        
        Args:
            text: Ruw tekst
            
        Returns:
            Gecleanede tekst
        """
        if not text:
            return ""
            
        # Vervang meerdere whitespace karakters door enkele spatie
        text = re.sub(r'\s+', ' ', text)
        
        # Trim whitespace aan begin en eind
        text = text.strip()
        
        # Normaliseer newlines voor consistentie
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        # Verwijder lege regels aan begin en eind
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        return '\n'.join(lines)
    
    @staticmethod
    def extract_structured_content(text: str) -> Dict[str, List[str]]:
        """
        Extraheer gestructureerde content uit tekst (lijsten, paragrafen, etc.).
        
        Args:
            text: Invoer tekst
            
        Returns:
            Dictionary met gestructureerde content
        """
        if not text:
            return {}
            
        lines = text.split('\n')
        
        result = {
            "paragraphs": [],
            "lists": [],
            "headings": [],
            "tables": []  # Placeholder voor toekomstige table extractie
        }
        
        current_paragraph = []
        current_list = []
        in_list = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Detecteer lijst items
            if re.match(r'^[•\-\*]\s+', line) or re.match(r'^\d+\.\s+', line):
                if not in_list and current_paragraph:
                    # Sla huidige paragraaf op
                    result["paragraphs"].append(' '.join(current_paragraph))
                    current_paragraph = []
                    
                in_list = True
                current_list.append(line)
                
            # Detecteer headings (korte regels, vaak met speciale formatting)
            elif len(line) < 100 and (line.isupper() or re.match(r'^[A-Z][^a-z]*$', line)):
                result["headings"].append(line)
                
            else:
                if in_list and current_list:
                    # Sla huidige lijst op
                    result["lists"].append('\n'.join(current_list))
                    current_list = []
                    
                in_list = False
                current_paragraph.append(line)
                
        # Sla resterende content op
        if current_paragraph:
            result["paragraphs"].append(' '.join(current_paragraph))
        if current_list:
            result["lists"].append('\n'.join(current_list))
            
        return result
    
    @staticmethod
    async def extract_images(page: Page, selector: str = "img") -> List[Dict[str, str]]:
        """
        Extraheer afbeelding informatie van pagina.
        
        Args:
            page: Playwright Page object
            selector: Selector voor afbeeldingen
            
        Returns:
            List van dictionaries met afbeelding informatie
        """
        images = []
        
        try:
            image_elements = await page.query_selector_all(selector)
            
            for idx, img_element in enumerate(image_elements, start=1):
                try:
                    src = await img_element.get_attribute("src")
                    alt = await img_element.get_attribute("alt") or f"image_{idx}"
                    
                    if src and src.strip():
                        images.append({
                            "src": src.strip(),
                            "alt": alt,
                            "index": idx
                        })
                        
                except Exception as e:
                    print(f"Fout bij extraheren afbeelding {idx}: {str(e)}")
                    continue
                    
        except Exception as e:
            print(f"Fout bij zoeken naar afbeeldingen: {str(e)}")
            
        return images
    
    @staticmethod
    def extract_links(text: str, base_url: str = "") -> List[Dict[str, str]]:
        """
        Extraheer links uit tekst.
        
        Args:
            text: Invoer tekst
            base_url: Basis URL voor relatieve links
            
        Returns:
            List van dictionaries met link informatie
        """
        # Eenvoudige regex voor URL detectie
        url_pattern = r'https?://[^\s<>"\']+|www\.[^\s<>"\']+'
        urls = re.findall(url_pattern, text)
        
        links = []
        for idx, url in enumerate(urls, start=1):
            # Maak absolute URL indien nodig
            if not url.startswith(('http://', 'https://')):
                url = f"https://{url}"
                
            links.append({
                "url": url,
                "index": idx
            })
            
        return links
    
    @staticmethod
    def calculate_statistics(text: str) -> Dict[str, int]:
        """
        Bereken statistieken voor tekst.
        
        Args:
            text: Invoer tekst
            
        Returns:
            Dictionary met statistieken
        """
        if not text:
            return {
                "characters": 0,
                "words": 0,
                "sentences": 0,
                "paragraphs": 0,
                "lines": 0
            }
            
        # Tel karakters (zonder whitespace)
        chars = len(text)
        chars_no_ws = len(text.replace(' ', '').replace('\n', '').replace('\t', ''))
        
        # Tel woorden
        words = len(text.split())
        
        # Tel zinnen (eenvoudige benadering)
        sentences = len(re.split(r'[.!?]+', text))
        
        # Tel paragrafen
        paragraphs = len([p for p in text.split('\n\n') if p.strip()])
        
        # Tel regels
        lines = len(text.split('\n'))
        
        return {
            "characters_total": chars,
            "characters_no_whitespace": chars_no_ws,
            "words": words,
            "sentences": sentences,
            "paragraphs": paragraphs,
            "lines": lines
        }
    
    @staticmethod
    async def extract_table_data(page: Page, selector: str) -> Optional[List[List[str]]]:
        """
        Extraheer tabel data.
        
        Args:
            page: Playwright Page object
            selector: Selector voor tabel
            
        Returns:
            2D lijst met tabel data of None bij fout
        """
        try:
            table_element = await page.query_selector(selector)
            if not table_element:
                return None
                
            # Extraheer rij data
            rows = []
            table_rows = await table_element.query_selector_all("tr")
            
            for tr in table_rows:
                row_data = []
                
                # Haal alle cellen op (th en td)
                cells = await tr.query_selector_all("th, td")
                for cell in cells:
                    cell_text = await cell.inner_text()
                    row_data.append(cell_text.strip())
                    
                if row_data:  # Alleen niet-lege rijen toevoegen
                    rows.append(row_data)
                    
            return rows if rows else None
            
        except Exception as e:
            print(f"Tabel extractie fout: {str(e)}")
            return None
    
    @staticmethod
    def detect_content_type(text: str) -> str:
        """
        Detecteer type content op basis van tekst.
        
        Args:
            text: Invoer tekst
            
        Returns:
            Content type: "objectives", "lesson", "exercise", "summary", "unknown"
        """
        if not text:
            return "unknown"
            
        text_lower = text.lower()
        
        # Keywords voor verschillende content types
        objectives_keywords = ["leerdoel", "doelstelling", "doelen", "na dit hoofdstuk", "je leert"]
        exercise_keywords = ["opdracht", "oefening", "vraag", "opgave", "antwoord"]
        summary_keywords = ["samenvatting", "conclusie", "kernpunten", "belangrijkste"]
        
        if any(keyword in text_lower for keyword in objectives_keywords):
            return "objectives"
        elif any(keyword in text_lower for keyword in exercise_keywords):
            return "exercise"
        elif any(keyword in text_lower for keyword in summary_keywords):
            return "summary"
        else:
            return "lesson"