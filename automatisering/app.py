# app.py - COMPLEET GEÜPDATEE VERSIE
import sys
import os
import asyncio
from pathlib import Path
from PyQt6.QtWidgets import QApplication, QMessageBox
from PyQt6.QtCore import QThread, pyqtSignal, QObject
import qasync

from gui.main_window import MainWindow
from utils.logger import Logger

class AsyncRunner(QThread):
    """Thread voor async runner operaties"""
    
    finished = pyqtSignal(object)
    error = pyqtSignal(str)
    
    def __init__(self, coro):
        super().__init__()
        self.coro = coro
        
    def run(self):
        """Voer async coroutine uit in thread"""
        try:
            # Maak nieuwe event loop voor deze thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Voer coroutine uit
            result = loop.run_until_complete(self.coro)
            self.finished.emit(result)
            
        except Exception as e:
            self.error.emit(str(e))
            
        finally:
            asyncio.set_event_loop(None)

def setup_environment():
    """Stel omgeving in voor applicatie"""
    try:
        # Maak noodzakelijke directories
        Path.home().joinpath(".noordhoff-scraper").mkdir(exist_ok=True)
        Path.home().joinpath("AppData", "Local", "NoordhoffScraper").mkdir(parents=True, exist_ok=True)
        
        # Controleer dependencies
        import importlib
        required_modules = [
            "PyQt6",
            "playwright",
            "keyring",
            "aiohttp",
            "aiofiles"
        ]
        
        missing_modules = []
        for module in required_modules:
            try:
                importlib.import_module(module)
            except ImportError:
                missing_modules.append(module)
                
        if missing_modules:
            raise ImportError(f"Ontbrekende modules: {', '.join(missing_modules)}")
            
        return True
        
    except Exception as e:
        print(f"Environment setup fout: {str(e)}")
        return False

def check_playwright_browsers():
    """Controleer of Playwright browsers geïnstalleerd zijn"""
    try:
        from playwright._impl._driver import compute_driver_executable, get_driver_env
        driver_executable = compute_driver_executable()
        if not driver_executable.exists():
            return False
            
        # Controleer of Chromium beschikbaar is
        from playwright._impl._browser_type import BrowserType
        # Dit is een eenvoudige check - in productie zouden we de browsers daadwerkelijk proberen te starten
        return True
        
    except:
        return False

def show_dependency_dialog(app):
    """Toon dialoog voor ontbrekende dependencies"""
    msg_box = QMessageBox()
    msg_box.setWindowTitle("Dependencies Ontbreken")
    msg_box.setIcon(QMessageBox.Icon.Critical)
    msg_box.setText(
        "Niet alle vereiste dependencies zijn geïnstalleerd.\n\n"
        "Voer de volgende commando's uit:\n\n"
        "1. pip install -r requirements.txt\n"
        "2. python -m playwright install chromium\n\n"
        "Wilt u dat ik Playwright browsers nu installeer?"
    )
    
    install_button = msg_box.addButton("Installeren", QMessageBox.ButtonRole.YesRole)
    cancel_button = msg_box.addButton("Annuleren", QMessageBox.ButtonRole.RejectRole)
    
    msg_box.exec()
    
    if msg_box.clickedButton() == install_button:
        # Installeer Playwright browsers
        import subprocess
        import sys
        try:
            result = subprocess.run(
                [sys.executable, "-m", "playwright", "install", "chromium"],
                capture_output=True,
                text=True,
                encoding="utf-8"
            )
            
            if result.returncode == 0:
                QMessageBox.information(
                    None,
                    "Installatie Voltooid",
                    "Playwright browsers zijn succesvol geïnstalleerd."
                )
                return True
            else:
                QMessageBox.critical(
                    None,
                    "Installatie Mislukt",
                    f"Installatie mislukt:\n{result.stderr}"
                )
                return False
                
        except Exception as e:
            QMessageBox.critical(
                None,
                "Fout",
                f"Kon installatie niet uitvoeren:\n{str(e)}"
            )
            return False
            
    return False

def main():
    """Hoofdingangspunt van de applicatie"""
    # Setup omgeving
    if not setup_environment():
        print("Kon omgeving niet instellen")
        return 1
        
    # Maak QApplication
    app = QApplication(sys.argv)
    app.setApplicationName("Noordhoff Scraper")
    app.setOrganizationName("NoordhoffScraper")
    app.setApplicationDisplayName("Noordhoff Scraper v1.0")
    
    # Controleer Playwright browsers
    # check_playwright_browsers() wordt overgeslagen om pop-ups te voorkomen
    
    # Stel event loop in voor async operaties
    try:
        loop = qasync.QEventLoop(app)
        asyncio.set_event_loop(loop)
    except:
        # Fallback voor als qasync niet beschikbaar is
        pass
    
    # Toon main window
    window = MainWindow()
    window.show()
    
    # Toon welkomstbericht (overgeslagen op verzoek van gebruiker)
    
    # Start applicatie
    sys.exit(app.exec())

if __name__ == "__main__":
    main()