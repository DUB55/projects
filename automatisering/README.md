# Noordhoff Scraper - Desktop Applicatie

## Overzicht
Een PyQt6 desktop applicatie voor het automatisch doorlopen en exporteren van leerstof vanaf Noordhoff-platforms.

## Vereisten
- Python 3.10+
- Windows 10/11 (64-bit)
- 4GB RAM minimum
- 500MB vrije schijfruimte

## Installatie

### Optie 1: Python Virtual Environment
```bash
# 1. Kloon de repository (overslaan als je de bestanden al hebt)
git clone <repository-url>
cd noordhoff-scraper

# 2. Maak virtuele omgeving
python -m venv venv

# 3. Activeer venv (of gebruik direct de python.exe uit venv zonder activatie)
# Windows (CMD):
venv\Scripts\activate.bat
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Alternatief zonder activatie (werkt ook als scripts geblokkeerd zijn):
# Gebruik .\venv\Scripts\python.exe in plaats van python voor alle commando's

# 4. Installeer dependencies
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# 5. Installeer Playwright browsers
.\venv\Scripts\python.exe -m playwright install chromium

# 6. Start de applicatie
.\venv\Scripts\python.exe app.py