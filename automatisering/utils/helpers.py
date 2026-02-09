# utils/helpers.py
import re
import unicodedata
from pathlib import Path
import shortuuid
from datetime import datetime
import string

def sanitize_filename(filename: str, max_length: int = 100) -> str:
    """
    Sanitize een bestandsnaam voor veilig opslaan.
    Verwijder of vervang onveilige karakters.
    """
    # Normaliseer unicode naar ASCII
    filename = unicodedata.normalize('NFKD', filename).encode('ascii', 'ignore').decode('ascii')
    
    # Vervang spaties en onveilige karakters
    filename = re.sub(r'[^\w\s-]', '', filename)
    filename = re.sub(r'[-\s]+', '_', filename)
    
    # Verwijder voorloop- en achterloopstreepjes
    filename = filename.strip('-_')
    
    # Beperk de lengte
    if len(filename) > max_length:
        filename = filename[:max_length]
    
    return filename.lower()

def generate_run_id() -> str:
    """
    Genereer een unieke run ID in formaat: YYYYMMDDTHHMMSSZ_shortuuid
    """
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    short_id = shortuuid.uuid()[:8]
    return f"{timestamp}_{short_id}"

def format_filename(template: str, **kwargs) -> str:
    """
    Formatteer een bestandsnaam volgens template.
    
    Beschikbare plaatshouders:
    - {book}: boek titel
    - {chapter_index}: hoofdstuk index
    - {paragraph_index}: paragraaf index
    - {label}: label tekst
    - {timestamp}: huidige timestamp
    - {run_id}: unieke run ID
    """
    # Voeg timestamp toe als die nog niet in kwargs zit
    if 'timestamp' not in kwargs:
        kwargs['timestamp'] = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Voeg run_id toe als die nog niet in kwargs zit
    if 'run_id' not in kwargs:
        kwargs['run_id'] = generate_run_id()
    
    # Sanitize string values
    for key, value in kwargs.items():
        if isinstance(value, str) and key not in ['timestamp', 'run_id']:
            kwargs[key] = sanitize_filename(value)
    
    try:
        return template.format(**kwargs)
    except KeyError as e:
        # Vervang ontbrekende keys met placeholder
        missing_key = str(e).strip("'")
        return template.replace(f"{{{missing_key}}}", "UNKNOWN")

def validate_directory(path: str) -> tuple[bool, str]:
    """
    Valideer of een directory beschrijfbaar is.
    Retourneert (is_valid, error_message)
    """
    try:
        dir_path = Path(path)
        
        # Controleer of het pad absoluut is
        if not dir_path.is_absolute():
            return False, "Pad moet absoluut zijn"
        
        # Controleer of de directory bestaat, zo niet, probeer aan te maken
        if not dir_path.exists():
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
            except Exception as e:
                return False, f"Kan directory niet aanmaken: {str(e)}"
        
        # Controleer of we kunnen schrijven
        test_file = dir_path / ".write_test"
        try:
            test_file.touch()
            test_file.unlink()
        except Exception as e:
            return False, f"Geen schrijfrechten voor directory: {str(e)}"
        
        return True, ""
        
    except Exception as e:
        return False, f"Ongeldig pad: {str(e)}"

def truncate_text(text: str, max_length: int = 500) -> str:
    """
    Truncate tekst voor weergave in UI.
    """
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."

def extract_base_url(url: str) -> str:
    """
    Extraheer base URL van een volledige URL.
    """
    from urllib.parse import urlparse
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"

def parse_indices(indices_str: str) -> list[int]:
    """
    Parseert een string van indices naar een lijst met integers.
    Ondersteunt: "0, 1, 2", "0-5", "0, 2-4, 7"
    """
    if not indices_str or not indices_str.strip():
        return []
        
    indices = set()
    parts = [p.strip() for p in indices_str.split(',')]
    
    for part in parts:
        if '-' in part:
            try:
                start_str, end_str = part.split('-', 1)
                start = int(start_str.strip())
                end = int(end_str.strip())
                # Zorg dat we van laag naar hoog gaan
                if start <= end:
                    indices.update(range(start, end + 1))
                else:
                    indices.update(range(end, start + 1))
            except (ValueError, IndexError):
                continue
        else:
            try:
                indices.add(int(part))
            except ValueError:
                continue
                
    return sorted(list(indices))

def format_indices(indices: list[int]) -> str:
    """
    Converteert een lijst met integers naar een leesbare string.
    Bijv: [0, 1, 2, 4, 5, 7] -> "0-2, 4-5, 7"
    """
    if not indices:
        return ""
        
    indices = sorted(list(set(indices)))
    ranges = []
    if not indices:
        return ""
        
    start = indices[0]
    end = indices[0]
    
    for i in range(1, len(indices)):
        if indices[i] == end + 1:
            end = indices[i]
        else:
            if start == end:
                ranges.append(str(start))
            else:
                ranges.append(f"{start}-{end}")
            start = indices[i]
            end = indices[i]
            
    # Voeg laatste range toe
    if start == end:
        ranges.append(str(start))
    else:
        ranges.append(f"{start}-{end}")
        
    return ", ".join(ranges)