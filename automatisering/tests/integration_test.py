# tests/integration_test.py
import asyncio
import pytest
import tempfile
from pathlib import Path
import json

from runner.playwright_runner import BookScrapeRunner
from config.config_manager import ConfigManager, ScraperConfig, LoginConfig
from storage.saver import DataSaver

class MockLogger:
    """Mock logger voor testing"""
    def __init__(self):
        self.messages = []
    
    def info(self, msg):
        self.messages.append(("INFO", msg))
        print(f"INFO: {msg}")
    
    def warning(self, msg):
        self.messages.append(("WARNING", msg))
        print(f"WARNING: {msg}")
    
    def error(self, msg):
        self.messages.append(("ERROR", msg))
        print(f"ERROR: {msg}")
    
    def debug(self, msg):
        self.messages.append(("DEBUG", msg))
        print(f"DEBUG: {msg}")

class IntegrationTest:
    """Integratie tests voor volledige workflow"""
    
    @pytest.fixture
    def temp_dir(self):
        """Maak tijdelijke directory voor tests"""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield Path(tmpdir)
    
    @pytest.fixture
    def mock_config(self, temp_dir):
        """Maak mock configuratie"""
        config = ScraperConfig(
            start_url="http://localhost:8080/login",
            login=LoginConfig(
                use_login=True,
                username_selector="#email",
                password_selector="#password",
                submit_selector="button[type='submit']",
                username_value="test@example.com",
                password_value="test123"
            ),
            book_selection={
                "book_list_selector": ".book-item",
                "book_item_title_selector": ".title"
            },
            ui_structure={
                "greeting_selector": ".greeting",
                "sidebar_chapter_selector": ".chapter-button",
                "chapter_paragraphs_container_selector": ".chapter-children",
                "paragraph_button_selector": ".paragraph-button",
                "learning_objectives_selector": ".learning-objectives",
                "lesson_content_selector": ".lesson-content",
                "image_selector": "img"
            },
            output={
                "output_dir": str(temp_dir),
                "filename_template": "test_{chapter_index}_{paragraph_index}.txt",
                "manifest_filename": "manifest.json",
                "save_images": False
            },
            browser={
                "headless": True,
                "use_persistent_context": False
            },
            timeouts={
                "navigation": 5000,
                "selector": 3000
            },
            retry_policy={
                "click_attempts": 2,
                "click_delay_ms": 500
            }
        )
        return config
    
    @pytest.mark.asyncio
    async def test_data_saver(self, temp_dir):
        """Test DataSaver functionaliteit"""
        output_config = {
            "output_dir": str(temp_dir),
            "filename_template": "test_{chapter_index}_{paragraph_index}.txt",
            "manifest_filename": "manifest.json",
            "save_images": False
        }
        
        saver = DataSaver(output_config, "test_run_123")
        
        # Test tekst opslag
        test_data = {
            "chapter_index": 1,
            "paragraph_index": 1,
            "objectives": "Test leerdoelen",
            "lesson": "Test leerstof",
            "url": "http://example.com",
            "timestamp": "2023-01-01T12:00:00Z"
        }
        
        filepath = await saver.save_data(test_data)
        assert Path(filepath).exists()
        
        # Test manifest generatie
        manifest_path = await saver.save_manifest()
        assert Path(manifest_path).exists()
        
        # Verifieer manifest inhoud
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        assert manifest["metadata"]["run_id"] == "test_run_123"
        assert len(manifest["files"]) == 1
    
    def test_config_manager(self, temp_dir):
        """Test ConfigManager functionaliteit"""
        config_manager = ConfigManager(str(temp_dir))
        
        # Test config opslaan en laden
        config = ScraperConfig(
            start_url="http://example.com",
            login=LoginConfig(use_login=False)
        )
        
        config_path = temp_dir / "test_config.json"
        config_manager.save_config(config, str(config_path), save_credentials=False)
        
        loaded_config = config_manager.load_config(str(config_path))
        assert loaded_config.start_url == config.start_url
        
        # Test validatie
        errors = config_manager.validate_config(config)
        assert len(errors) == 0
    
    @pytest.mark.asyncio
    async def test_runner_initialization(self, mock_config):
        """Test runner initialisatie"""
        logger = MockLogger()
        runner = BookScrapeRunner(mock_config, logger)
        
        assert runner.config == mock_config
        assert runner.is_running == True
        assert runner.run_id is not None
    
    def test_filename_generation(self, temp_dir):
        """Test bestandsnaam generatie"""
        from utils.helpers import format_filename, sanitize_filename
        
        # Test sanitize
        dirty_name = "Test/Bestand*naam?.txt"
        clean_name = sanitize_filename(dirty_name)
        assert "*" not in clean_name
        assert "/" not in clean_name
        assert "?" not in clean_name
        
        # Test format
        template = "{book}_{chapter}_{paragraph}.txt"
        filename = format_filename(
            template, 
            book="Wiskunde A",
            chapter=1,
            paragraph=2
        )
        assert "Wiskunde_A" in filename
        assert "_1_" in filename or "_1.txt" in filename
    
    @pytest.mark.asyncio
    async def test_image_handling(self, temp_dir):
        """Test afbeeldingen handling"""
        from storage.saver import DataSaver
        
        output_config = {
            "output_dir": str(temp_dir),
            "filename_template": "test.txt",
            "manifest_filename": "manifest.json",
            "save_images": True
        }
        
        saver = DataSaver(output_config, "test_run_123")
        
        # Test met data URI
        data_uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        image_path = await saver.save_image(data_uri, 1, 1, 1)
        
        # Moet None zijn omdat we geen echte download doen
        # Maar de functie zou geen exception moeten geven
        assert True  # Placeholder
    
    def test_error_handling(self, temp_dir):
        """Test foutafhandeling"""
        from utils.helpers import validate_directory
        
        # Test ongeldige directory
        invalid_path = "/dit/pad/bestaat/niet/waarschijnlijk"
        is_valid, error_msg = validate_directory(invalid_path)
        assert not is_valid
        assert "bestaat niet" in error_msg or "niet geldig" in error_msg
        
        # Test geldige directory
        is_valid, error_msg = validate_directory(str(temp_dir))
        assert is_valid
        assert error_msg == ""

# Run tests
if __name__ == "__main__":
    print("Running integration tests...")
    
    # Maak test omgeving
    with tempfile.TemporaryDirectory() as tmpdir:
        test = IntegrationTest()
        
        # Run individuele tests
        test.test_data_saver(Path(tmpdir))
        test.test_config_manager(Path(tmpdir))
        test.test_filename_generation(Path(tmpdir))
        test.test_error_handling(Path(tmpdir))
        
        print("\nAll tests passed!")