# docs/troubleshooting.py
"""
TROUBLESHOOTING GIDS - NOORDHOFF SCRAPER

1. INSTALLATIE PROBLEMEN
----------------------
Probleem: "ModuleNotFoundError: No module named 'PyQt6'"
Oplossing: pip install PyQt6

Probleem: "playwright: command not found"
Oplossing: pip install playwright
          python -m playwright install chromium

Probleem: "No usable version of the Qt platform plugin 'windows'"
Oplossing: Installeer Visual C++ Redistributable:
          https://aka.ms/vs/16/release/vc_redist.x64.exe

2. RUNNER PROBLEMEN
------------------
Probleem: "TimeoutError: Timeout 15000ms exceeded"
Oplossing: 
  - Verhoog timeout in geavanceerde instellingen
  - Controleer internetverbinding
  - Controleer of website bereikbaar is

Probleem: "Element not found" of "Selector not found"
Oplossing:
  - Gebruik Selector Tester om selectors te valideren
  - Update selectors in configuratie
  - Controleer of je ingelogd bent

Probleem: "CAPTCHA detected"
Oplossing:
  - Los CAPTCHA handmatig op in browser
  - Klik op "Doorgaan" in CAPTCHA dialoog
  - Gebruik persistent browser context voor hergebruikte sessies

3. GUI PROBLEMEN
---------------
Probleem: GUI reageert niet tijdens run
Oplossing: Dit is normaal tijdens intensieve scraping
  - Gebruik "Stop Run" om te pauzeren
  - Reduceer aantal parallelle taken

Probleem: "Cannot save to directory"
Oplossing:
  - Controleer schrijfrechten
  - Kies een andere output directory
  - Run applicatie als administrator

4. OUTPUT PROBLEMEN
------------------
Probleem: Geen .txt bestanden gegenereerd
Oplossing:
  - Controleer log bestanden in %APPDATA%\NoordhoffScraper\logs\
  - Controleer of er content werd gevonden
  - Test selectors met Selector Tester

Probleem: Afbeeldingen worden niet opgeslagen
Oplossing:
  - Zet "Afbeeldingen opslaan" aan in configuratie
  - Selecteer een geldige images directory
  - Controleer schrijfrechten voor images directory

5. PERFORMANCE PROBLEMEN
-----------------------
Probleem: Run is erg traag
Oplossing:
  - Gebruik headless mode (geen browser zichtbaar)
  - Verlaag timeouts in geavanceerde instellingen
  - Zet afbeeldingen opslaan uit

Probleem: Browser gebruikt veel geheugen
Oplossing:
  - Restart applicatie na elke run
  - Gebruik geen persistent context
  - Sluit onnodige tabbladen in browser

6. DEBUGGING
-----------
Log bestanden: %APPDATA%\NoordhoffScraper\logs\
Screenshots bij fouten: {output_dir}/runs/{run_id}/screenshots/
Manifest: {output_dir}/runs/{run_id}/manifest.json

Voor debugging:
  1. Test selectors met ingebouwde tester
  2. Controleer log bestanden
  3. Gebruik mock site voor ontwikkeling
  4. Verlaag timeouts voor snellere foutdetectie

7. VEILIGHEID
------------
- Credentials worden opgeslagen in Windows Credential Manager
- Configuratiebestanden bevatten geen plain-text wachtwoorden
- Gebruik altijd HTTPS URLs
- Verwijder credentials na gebruik: GUI -> Login -> "Verwijder opgeslagen credentials"

8. CONTACT
----------
Voor problemen:
  1. Controleer deze troubleshooting guide
  2. Bekijk de log bestanden
  3. Test met mock site
  4. Probeer eenvoudige configuratie eerst

BELANGRIJK: Respecteer altijd de gebruiksvoorwaarden van de website.
"""