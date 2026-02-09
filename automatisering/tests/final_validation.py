# tests/final_validation.py
"""
FINAL VALIDATIE SCRIPT
Voer dit script uit om te controleren of de applicatie correct werkt.
"""
import sys
import os
from pathlib import Path
import subprocess
import json
import tempfile

def check_dependencies():
    """Controleer of alle dependencies geïnstalleerd zijn"""
    print("=" * 60)
    print("CONTROLEER DEPENDENCIES")
    print("=" * 60)
    
    required = {
        "PyQt6": "PyQt6",
        "playwright": "playwright",
        "keyring": "keyring",
        "aiohttp": "aiohttp",
        "aiofiles": "aiofiles",
        "cryptography": "cryptography"
    }
    
    all_ok = True
    for name, module in required.items():
        try:
            __import__(module)
            print(f"✓ {name}")
        except ImportError:
            print(f"✗ {name} - NIET GEÏNSTALLEERD")
            all_ok = False
    
    return all_ok

def check_playwright_browsers():
    """Controleer of Playwright browsers geïnstalleerd zijn"""
    print("\n" + "=" * 60)
    print("CONTROLEER PLAYWRIGHT BROWSERS")
    print("=" * 60)
    
    try:
        result = subprocess.run(
            ["python", "-m", "playwright", "chromium", "--version"],
            capture_output=True,
            text=True,
            encoding="utf-8"
        )
        
        if result.returncode == 0:
            print(f"✓ Playwright browsers: {result.stdout.strip()}")
            return True
        else:
            print(f"✗ Playwright browsers niet geïnstalleerd")
            print(f"  Fout: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"✗ Kon Playwright niet controleren: {str(e)}")
        return False

def test_config_manager():
    """Test ConfigManager functionaliteit"""
    print("\n" + "=" * 60)
    print("TEST CONFIG MANAGER")
    print("=" * 60)
    
    try:
        from config.config_manager import ConfigManager, ScraperConfig, LoginConfig
        
        with tempfile.TemporaryDirectory() as tmpdir:
            config_manager = ConfigManager(tmpdir)
            
            # Maak test config
            config = ScraperConfig(
                start_url="https://example.com",
                login=LoginConfig(
                    username_selector="#email",
                    password_selector="#password"
                )
            )
            
            # Test opslaan
            config_path = Path(tmpdir) / "test_config.json"
            config_manager.save_config(config, str(config_path), save_credentials=False)
            
            # Test laden
            loaded_config = config_manager.load_config(str(config_path))
            
            # Verifieer
            assert loaded_config.start_url == config.start_url
            assert loaded_config.login.username_selector == config.login.username_selector
            
            print("✓ ConfigManager: Opslaan en laden werken correct")
            return True
            
    except Exception as e:
        print(f"✗ ConfigManager test mislukt: {str(e)}")
        return False

def test_data_saver():
    """Test DataSaver functionaliteit"""
    print("\n" + "=" * 60)
    print("TEST DATA SAVER")
    print("=" * 60)
    
    try:
        import asyncio
        from storage.saver import DataSaver
        
        with tempfile.TemporaryDirectory() as tmpdir:
            output_config = {
                "output_dir": tmpdir,
                "filename_template": "test_{chapter_index}_{paragraph_index}.txt",
                "manifest_filename": "manifest.json",
                "save_images": False
            }
            
            saver = DataSaver(output_config, "test_run")
            
            # Test tekst opslag
            test_data = {
                "chapter_index": 1,
                "paragraph_index": 1,
                "objectives": "Test",
                "lesson": "Test",
                "url": "http://example.com",
                "timestamp": "2023-01-01T12:00:00Z"
            }
            
            # Run async test
            async def run_test():
                filepath = await saver.save_data(test_data)
                assert Path(filepath).exists()
                
                manifest_path = await saver.save_manifest()
                assert Path(manifest_path).exists()
                
                # Verifieer manifest
                with open(manifest_path, 'r', encoding='utf-8') as f:
                    manifest = json.load(f)
                
                assert manifest["metadata"]["run_id"] == "test_run"
                assert len(manifest["files"]) == 1
            
            asyncio.run(run_test())
            
            print("✓ DataSaver: Tekst opslag en manifest generatie werken correct")
            return True
            
    except Exception as e:
        print(f"✗ DataSaver test mislukt: {str(e)}")
        return False

def test_gui_import():
    """Test of GUI modules kunnen worden geïmporteerd"""
    print("\n" + "=" * 60)
    print("TEST GUI MODULES")
    print("=" * 60)
    
    try:
        # Probeer GUI modules te importeren
        from gui.main_window import MainWindow
        from gui.selector_tester import SelectorTesterDialog
        from gui.widgets import LogTextEdit, ConfigTableWidget
        
        print("✓ Alle GUI modules kunnen worden geïmporteerd")
        return True
        
    except Exception as e:
        print(f"✗ GUI import test mislukt: {str(e)}")
        return False

def test_runner_import():
    """Test of runner modules kunnen worden geïmporteerd"""
    print("\n" + "=" * 60)
    print("TEST RUNNER MODULES")
    print("=" * 60)
    
    try:
        from runner.playwright_runner import BookScrapeRunner
        from runner.navigator import Navigator
        from runner.extractor import Extractor
        
        print("✓ Alle runner modules kunnen worden geïmporteerd")
        return True
        
    except Exception as e:
        print(f"✗ Runner import test mislukt: {str(e)}")
        return False

def run_mock_server_test():
    """Test mock server"""
    print("\n" + "=" * 60)
    print("TEST MOCK SERVER")
    print("=" * 60)
    
    try:
        # Start mock server in subprocess
        server_process = subprocess.Popen(
            [sys.executable, "tests/mock_server.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wacht even om server te starten
        import time
        time.sleep(2)
        
        # Test server met curl of requests
        try:
            import requests
            response = requests.get("http://localhost:8080/login", timeout=5)
            if response.status_code == 200:
                print("✓ Mock server is actief en reageert")
                server_process.terminate()
                return True
            else:
                print(f"✗ Mock server reageert niet correct: HTTP {response.status_code}")
                server_process.terminate()
                return False
                
        except ImportError:
            # Gebruik curl als requests niet beschikbaar is
            result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:8080/login"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0 and result.stdout == "200":
                print("✓ Mock server is actief en reageert")
                server_process.terminate()
                return True
            else:
                print(f"✗ Mock server reageert niet correct")
                server_process.terminate()
                return False
                
    except Exception as e:
        print(f"✗ Mock server test mislukt: {str(e)}")
        return False

def main():
    """Hoofdfunctie voor validatie"""
    print("NOORDHOFF SCRAPER - FINALE VALIDATIE")
    print("=" * 60)
    
    results = []
    
    # Run alle tests
    results.append(("Dependencies", check_dependencies()))
    results.append(("Playwright Browsers", check_playwright_browsers()))
    results.append(("Config Manager", test_config_manager()))
    results.append(("Data Saver", test_data_saver()))
    results.append(("GUI Modules", test_gui_import()))
    results.append(("Runner Modules", test_runner_import()))
    results.append(("Mock Server", run_mock_server_test()))
    
    # Samenvatting
    print("\n" + "=" * 60)
    print("VALIDATIE SAMENVATTING")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, success in results:
        if success:
            print(f"✓ {test_name}: GESLAAGD")
            passed += 1
        else:
            print(f"✗ {test_name}: MISLUKT")
            failed += 1
    
    print(f"\nTotaal: {passed} geslaagd, {failed} mislukt")
    
    if failed == 0:
        print("\n✅ ALLE TESTS GESLAAGD - Applicatie is klaar voor gebruik!")
        return 0
    else:
        print(f"\n❌ {failed} TEST(S) MISLUKT - Controleer de fouten hierboven")
        return 1

if __name__ == "__main__":
    sys.exit(main())