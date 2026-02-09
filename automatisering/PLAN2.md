Dit is een plan en blauwdruk om de applicatie uit te breiden naar een volwaardige "No-Code" scraping tool.

### **Blueprint & Architectuur**

**1. Point-and-Click Engine**
- **Browser-side**: Een JavaScript-laag die in "Selectie Modus" clicks onderschept, de CSS-selector berekent en visuele feedback geeft (hover-effecten).
- **App-side**: Een nieuwe `ScrapeField` Pydantic model in `ConfigManager` die vastlegt welke data (titel, prijs, tekst) van welke selector moet komen.

**2. Visuele Debugger Overlay**
- **Overlay**: Uitbreiding van de bestaande `OVERLAY_JS`.
- **Highlighting**: Gebruik van Playwright's `page.evaluate` om elementen tijdelijk een felle outline te geven vlak voordat een actie (klik/type) plaatsvindt.

**3. Real-time Data Hub**
- **Signalering**: De `BookScrapeRunner` stuurt een `pyqtSignal(dict)` telkens wanneer er een item is gescrapt.
- **Display**: Een `QTableWidget` die dynamisch kolommen aanmaakt op basis van de gescrapte velden.

**4. Preset Store**
- **Opslag**: JSON-bestanden in een nieuwe `/presets` map.
- **UI**: Een dropdown bovenin de app die de `ScraperConfig` direct overschrijft met opgeslagen waarden.

---

### **Todo List voor de AI Builder**

#### **Stap 1: UI & Data Preview (De Basis)**
- [ ] **Tabbed Interface**: Vervang de huidige rechterkolom door een `QTabWidget` met de tabs: `Dashboard`, `Voortgang`, `Live Data` en `Logs`.
- [ ] **Live Table**: Bouw de `Live Data` tab met een `QTableWidget` die automatisch groeit als er data binnenkomt.
- [ ] **Data Signal**: Voeg `data_collected = pyqtSignal(dict)` toe aan de `BookScrapeRunner` en verbind deze met de `Live Table`.

#### **Stap 2: Visuele Debugger (Feedback)**
- [ ] **Highlight JS**: Voeg een functie `window.__logOverlay.highlight(selector)` toe aan de overlay script in `playwright_runner.py`.
- [ ] **Step Execution**: Pas `_execute_step` aan zodat deze de overlay vertelt welke stap nu actief is en het betreffende element highlight.
- [ ] **Auto-scroll**: Zorg dat de browser automatisch naar het gehighlighte element scrollt.

#### **Stap 3: Preset Management (Efficiëntie)**
- [ ] **Storage Logic**: Implementeer `save_preset(name, config)` en `load_preset(name)` in `ConfigManager`.
- [ ] **Preset Toolbar**: Voeg een kleine toolbar toe bovenaan de GUI met een `QComboBox` (dropdown) en een "Save Preset" knop.
- [ ] **Quick Load**: Zorg dat bij het kiezen van een preset alle velden in de UI direct worden bijgewerkt.

#### **Stap 4: Point-and-Click Scraper (De 'Magic')**
- [ ] **Selection Mode**: Voeg een toggle toe: "Start Data Selectie".
- [ ] **Field Manager**: Maak een tabelletje onder de login-stappen waar de gebruiker veldnamen kan opgeven (bijv. "Prijs").
- [ ] **Click Capture**: Update het browser-script om in selectie-modus de CSS-selector terug te sturen naar de app zonder de pagina te navigeren.
- [ ] **Auto-mapping**: Koppel de geklikte selector direct aan het actieve veld in de Field Manager.

---

### **Gedetailleerd Stappenplan (Blueprint)**

| Fase | Onderdeel | Bestand(en) | Impact |
| :--- | :--- | :--- | :--- |
| **1** | **Tabs & Preview** | `main_window.py` | Hoog (UI layout verandert) |
| **2** | **Overlay & Highlighting** | `playwright_runner.py` | Medium (Betere debug ervaring) |
| **3** | **Preset Systeem** | `config_manager.py`, `main_window.py` | Laag (Extra functionaliteit) |
| **4** | **Interactive Selection** | `playwright_runner.py`, `main_window.py` | Hoog (Nieuwe core feature) |