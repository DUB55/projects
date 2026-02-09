# docs/quick_start.py
"""
SNELSTARTGIDS - NOORDHOFF SCRAPER

STAP 1: INSTALLATIE
------------------
1. Download de nieuwste versie van de applicatie
2. Installeer Python 3.10+ als dat nog niet gedaan is
3. Open terminal/command prompt in de applicatie map
4. Voer uit: pip install -r requirements.txt
5. Voer uit: python -m playwright install chromium

STAP 2: EERSTE RUN
-----------------
1. Start de applicatie: python app.py
2. Vul start URL in (bijv. https://leerling.noordhoff.nl)
3. Configureer login selectors:
   - Username selector: #email (meestal)
   - Password selector: #password (meestal)
   - Submit selector: button[type='submit'] (meestal)
4. Test selectors met "Test Selectors" knop
5. Kies output directory
6. Klik "Start Run"
7. Voer credentials in als gevraagd
8. Selecteer boek uit dropdown
9. Wacht tot run voltooid is

STAP 3: CONFIGURATIE SAVEN
-------------------------
1. Configureer alle selectors en instellingen
2. Klik "Config Opslaan"
3. Kies bestandsnaam (bijv. noordhoff_config.json)
4. Selecteer "Bewaar credentials" indien gewenst
5. Bij volgende keer: "Config Laden" en selecteer bestand

STAP 4: GEAVANCEERDE INSTELLINGEN
--------------------------------
1. Headless mode: Browser niet zichtbaar (sneller)
2. Persistent context: Bewaar login sessie
3. Timeouts: Aanpassen voor trage verbindingen
4. Retry policy: Aantal pogingen bij fouten

STAP 5: OUTPUT STRUCTUUR
-----------------------
Output directory/
├── runs/
│   ├── {run-id}/
│   │   ├── texts/
│   │   │   ├── boek_hoofdstuk_paragraaf.txt
│   │   │   └── ...
│   │   ├── images/ (optioneel)
│   │   ├── screenshots/
│   │   ├── logs/
│   │   └── manifest.json
└── last_config.json

STAP 6: TIPS & TRICKS
--------------------
1. Gebruik altijd de Selector Tester voordat je een run start
2. Sla configuratie op voor hergebruik
3. Gebruik mock site voor ontwikkeling en testing
4. Controleer log bestanden bij problemen
5. Gebruik headless mode voor snellere runs

VOORBEELD CONFIGURATIE:
----------------------
{
  "start_url": "https://leerling.noordhoff.nl/login",
  "login": {
    "use_login": true,
    "username_selector": "#email",
    "password_selector": "#password",
    "submit_selector": "button[type='submit']"
  },
  "book_selection": {
    "book_list_selector": ".my-books .book-item",
    "book_item_title_selector": ".title"
  },
  "output": {
    "output_dir": "C:\\Users\\JouwNaam\\Documents\\noordhoff-extracts",
    "save_images": false
  }
}
"""

