# config/config_manager.py - GEÜPDATEE VERSIE
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from enum import Enum
import jsonschema
from pydantic import BaseModel, ValidationError, Field
import keyring

class ExportFormat(str, Enum):
    TXT = "txt"
    MD = "md"
    PDF = "pdf"
    EPUB = "epub"

class UITheme(str, Enum):
    LIGHT = "light"
    DARK = "dark"

class ScrapeField(BaseModel):
    """Een door de gebruiker gedefinieerd veld voor Point-and-Click scraping"""
    name: str
    selector: str
    action: str = "Tekst" # Tekst, HTML, Link, Afbeelding

class LoginStep(BaseModel):
    """Een enkele stap in het login proces"""
    action: str = Field(..., description="Type actie: click, fill, wait, scrape, loop_books, loop_chapters, loop_paragraphs, end_loop")
    selector: Optional[str] = Field(None, description="CSS selector voor het element")
    x: Optional[int] = Field(None, description="X-coördinaat voor klik")
    y: Optional[int] = Field(None, description="Y-coördinaat voor klik")
    value: Optional[str] = Field(None, description="Waarde om in te vullen (bij fill acties)")
    wait_after_ms: Optional[int] = Field(1000, description="Wacht tijd na actie in milliseconden")
    expected_element: Optional[str] = Field(None, description="Selector om op te wachten na actie")
    indices: Optional[List[int]] = Field(None, description="Lijst van indices om over te lussen (voor loop_ acties)")

class LoginConfig(BaseModel):
    use_login: bool = True
    # Oude velden voor backward compatibility
    username_selector: str = "#email"
    password_selector: str = "#password"
    submit_selector: str = "button[type='submit']"
    username_value: Optional[str] = None
    password_value: Optional[str] = None
    
    # Nieuwe meerstaps login configuratie
    login_steps: List[LoginStep] = Field(default_factory=list)
    
    # School login specifiek
    school_login_button_selector: Optional[str] = Field(None, description="Selector voor 'Inloggen met school' knop")
    school_name_selector: Optional[str] = Field(None, description="Selector voor schoolnaam invoerveld")
    school_name_value: Optional[str] = Field(None, description="Schoolnaam om in te vullen")
    
class BookSelectionConfig(BaseModel):
    book_list_selector: str = ".my-books .book-item"
    book_item_title_selector: str = ".title"
    book_item_click_selector: str = "self"

class UIStructureConfig(BaseModel):
    greeting_selector: str = ".greeting"
    sidebar_chapter_selector: str = ".sidebar .chapter-button"
    chapter_paragraphs_container_selector: str = ".chapter-children"
    paragraph_button_selector: str = ".paragraph-button"
    learning_objectives_selector: str = ".learning-objectives"
    start_assignments_button_selector: str = "button.start-opdrachten"
    assignments_sidebar_item_selector: str = ".assignments .nav-item"
    lesson_content_selector: str = ".lesson-content"
    image_selector: str = ".lesson-content img"

class UIConfig(BaseModel):
    theme: UITheme = UITheme.LIGHT

class OutputConfig(BaseModel):
    output_dir: str = str(Path.home() / "Documents" / "boek-extracts")
    filename_template: str = "{book}_{chapter_index}_{paragraph_index}_{label}.txt"
    manifest_filename: str = "manifest.json"
    save_images: bool = False
    export_format: ExportFormat = ExportFormat.TXT
    download_videos: bool = False

class BrowserConfig(BaseModel):
    headless: bool = False
    use_persistent_context: bool = True
    user_data_dir: str = str(Path.home() / "AppData" / "Local" / "NoordhoffAgentProfile")
    attach_to_existing: bool = False
    cdp_url: str = "http://localhost:9222"
    keep_open_on_error: bool = True
    resume_mode: bool = False
    parallel_mode: bool = False
    use_stealth: bool = True

class TimeoutsConfig(BaseModel):
    navigation: int = 15000
    selector: int = 8000

class RetryPolicyConfig(BaseModel):
    click_attempts: int = 2
    click_delay_ms: int = 500

class TargetConfig(BaseModel):
    """Configuratie voor wat er gescraped moet worden"""
    books: Optional[List[int]] = Field(default_factory=list)
    chapters: Optional[List[int]] = Field(default_factory=list)
    paragraphs: Optional[List[int]] = Field(default_factory=list)

class ScraperConfig(BaseModel):
    start_url: str
    login: LoginConfig = LoginConfig()
    book_selection: BookSelectionConfig = BookSelectionConfig()
    ui_structure: UIStructureConfig = UIStructureConfig()
    ui: UIConfig = UIConfig()
    output: OutputConfig = OutputConfig()
    browser: BrowserConfig = BrowserConfig()
    timeouts: TimeoutsConfig = TimeoutsConfig()
    retry_policy: RetryPolicyConfig = RetryPolicyConfig()
    auto_scrape: bool = False
    custom_fields: List[ScrapeField] = Field(default_factory=list)
    target: TargetConfig = TargetConfig()

class ConfigManager:
    """Beheer configuratiebestanden en credentials"""
    
    SERVICE_NAME = "NoordhoffScraper"
    
    def __init__(self, config_dir: Optional[str] = None):
        if config_dir is None:
            config_dir = str(Path.home() / ".config" / "noordhoff-scraper")
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
    def load_config(self, filepath: str) -> ScraperConfig:
        """Laad configuratie van JSON bestand"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Backward compatibility: converteer oude login naar nieuwe stappen
        data = self._convert_old_login_format(data)
        
        # Haal credentials op uit keyring indien nodig
        if data.get('login', {}).get('username_value'):
            username = data['login']['username_value']
            password = self.get_password(username)
            if password:
                data['login']['password_value'] = password
        
        return ScraperConfig(**data)
    
    def _convert_old_login_format(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Converteer oude login format naar nieuw meerstaps format"""
        login_data = data.get('login', {})
        
        # Als er al login_steps zijn, hoef we niets te doen
        if 'login_steps' in login_data and login_data['login_steps']:
            return data
        
        # Maak stappen aan van oude configuratie
        login_steps = []
        
        # Stap 1: School login knop (als geconfigureerd)
        if login_data.get('school_login_button_selector'):
            login_steps.append({
                "action": "click",
                "selector": login_data['school_login_button_selector'],
                "wait_after_ms": 2000,
                "expected_element": login_data.get('school_name_selector') or login_data.get('username_selector')
            })
        
        # Stap 2: Schoolnaam (als geconfigureerd)
        if login_data.get('school_name_selector') and login_data.get('school_name_value'):
            login_steps.append({
                "action": "fill",
                "selector": login_data['school_name_selector'],
                "value": login_data['school_name_value'],
                "wait_after_ms": 1000
            })
        
        # Stap 3: Username
        if login_data.get('username_selector') and login_data.get('username_value'):
            login_steps.append({
                "action": "fill",
                "selector": login_data['username_selector'],
                "value": login_data['username_value'],
                "wait_after_ms": 1000
            })
        
        # Stap 4: Password
        if login_data.get('password_selector') and login_data.get('password_value'):
            login_steps.append({
                "action": "fill",
                "selector": login_data['password_selector'],
                "value": login_data['password_value'],
                "wait_after_ms": 1000
            })
        
        # Stap 5: Submit
        if login_data.get('submit_selector'):
            login_steps.append({
                "action": "click",
                "selector": login_data['submit_selector'],
                "wait_after_ms": 3000,
                "expected_element": ".greeting"  # Verwacht dashboard na login
            })
        
        # Voeg stappen toe aan configuratie
        if login_steps:
            data['login']['login_steps'] = login_steps
        
        return data
    
    def save_config(self, config: ScraperConfig, filepath: str, save_credentials: bool = False):
        """Sla configuratie op naar JSON bestand"""
        data = config.model_dump()
        
        # Verwijder wachtwoord van opslag
        password = None
        if data['login'].get('password_value'):
            password = data['login']['password_value']
            data['login']['password_value'] = None
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # Sla wachtwoord op in keyring indien gevraagd
        if save_credentials and password and data['login'].get('username_value'):
            self.set_password(data['login']['username_value'], password)
    
    def set_password(self, username: str, password: str):
        """Sla wachtwoord op in Windows Credential Manager"""
        try:
            keyring.set_password(self.SERVICE_NAME, username, password)
        except Exception as e:
            print(f"Waarschuwing: Kon wachtwoord niet opslaan in keyring: {e}")
    
    def get_password(self, username: str) -> Optional[str]:
        """Haal wachtwoord op uit Windows Credential Manager"""
        try:
            return keyring.get_password(self.SERVICE_NAME, username)
        except Exception as e:
            print(f"Waarschuwing: Kon wachtwoord niet ophalen uit keyring: {e}")
            return None
    
    def delete_password(self, username: str):
        """Verwijder wachtwoord uit Windows Credential Manager"""
        try:
            keyring.delete_password(self.SERVICE_NAME, username)
        except Exception as e:
            print(f"Waarschuwing: Kon wachtwoord niet verwijderen uit keyring: {e}")
    
    def validate_config(self, config: ScraperConfig) -> list:
        """Valideer configuratie en retourneer lijst met fouten"""
        errors = []
        try:
            # Pydantic doet al validatie, maar we voegen extra checks toe
            if config.start_url and not config.start_url.startswith(('http://', 'https://')):
                errors.append("Start URL moet beginnen met http:// of https://")
            
            if config.login.use_login:
                # Controleer of er login_steps zijn OF oude velden
                if config.login.login_steps:
                    # Valideer elke stap
                    for i, step in enumerate(config.login.login_steps):
                        # Bepaalde acties vereisen geen selector
                        selector_optional_actions = ["wait", "loop_books", "loop_chapters", "loop_paragraphs", "end_loop", "screenshot", "scroll"]
                        
                        if step.action not in selector_optional_actions:
                            # Voor click acties: selector OF coördinaten vereist
                            if step.action == "click":
                                if not step.selector and (step.x is None or step.y is None):
                                    errors.append(f"Login stap {i+1}: Selector of coördinaten (X, Y) vereist voor click")
                            elif not step.selector:
                                errors.append(f"Login stap {i+1}: Selector is vereist voor {step.action}")
                                
                        if step.action == "fill" and not step.value:
                            errors.append(f"Login stap {i+1}: Waarde is vereist voor fill actie")
                else:
                    # Oude validatie voor backward compatibility
                    if not config.login.username_selector:
                        errors.append("Username selector is vereist wanneer login gebruikt wordt")
                    if not config.login.password_selector:
                        errors.append("Password selector is vereist wanneer login gebruikt wordt")
                    if not config.login.submit_selector:
                        errors.append("Submit selector is vereist wanneer login gebruikt wordt")
            
            if not config.book_selection.book_list_selector:
                errors.append("Book list selector is vereist")
            
            # Valideer output directory
            try:
                output_dir = Path(config.output.output_dir)
                if not output_dir.parent.exists():
                    # We maken de directory niet aan hier, maar waarschuwen wel
                    pass
            except:
                errors.append(f"Output directory is geen geldig pad: {config.output.output_dir}")
            
        except Exception as e:
            errors.append(f"Validatie fout: {str(e)}")
        
        return errors

    def save_preset(self, name: str, config: ScraperConfig):
        """Sla een configuratie preset op"""
        presets_dir = self.config_dir / "presets"
        presets_dir.mkdir(exist_ok=True)
        
        filepath = presets_dir / f"{name}.json"
        self.save_config(config, str(filepath))
        
    def load_preset(self, name: str) -> ScraperConfig:
        """Laad een configuratie preset"""
        filepath = self.config_dir / "presets" / f"{name}.json"
        return self.load_config(str(filepath))
        
    def list_presets(self) -> List[str]:
        """Lijst alle beschikbare presets"""
        presets_dir = self.config_dir / "presets"
        if not presets_dir.exists():
            return []
        return [f.stem for f in presets_dir.glob("*.json")]

    def delete_preset(self, name: str) -> bool:
        """Verwijder een configuratie preset"""
        filepath = self.config_dir / "presets" / f"{name}.json"
        try:
            if filepath.exists():
                filepath.unlink()
                return True
            return False
        except Exception as e:
            print(f"Fout bij verwijderen preset: {e}")
            return False

    def save_last_state(self, config: ScraperConfig):
        """Sla de laatste staat van de tabel op"""
        filepath = self.config_dir / "last_state.json"
        self.save_config(config, str(filepath))
        
    def load_last_state(self) -> Optional[ScraperConfig]:
        """Laad de laatste staat van de tabel"""
        filepath = self.config_dir / "last_state.json"
        if not filepath.exists():
            return None
        try:
            return self.load_config(str(filepath))
        except:
            return None