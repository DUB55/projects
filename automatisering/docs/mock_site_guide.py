# docs/mock_site_guide.py
"""
MOCK SITE GEBRUIK - ONTWIKKELING EN TESTING

De applicatie bevat een mock Noordhoff site voor ontwikkeling en testing.
Dit stelt je in staat om de applicatie te testen zonder toegang tot een echte Noordhoff site.

HOE TE GEBRUIKEN:
---------------
1. Start de mock server:
   python tests/mock_server.py

2. Configureer de applicatie met:
   Start URL: http://localhost:8080/login
   
3. Test selectors:
   - Username selector: input[name="email"]
   - Password selector: input[name="password"]
   - Submit selector: button[type="submit"]
   - Book list selector: .book-item
   - Book title selector: .book-title

4. Test de volledige workflow:
   - Login met test@example.com / willekeurig wachtwoord
   - Selecteer een boek
   - Scrape hoofdstukken en paragrafen

MOCK SITE ROUTES:
---------------
GET  /login           - Login pagina
POST /login           - Login endpoint (accepteert alles)
GET  /dashboard       - Dashboard met boeken
GET  /book/{id}       - Boek pagina met hoofdstukken
GET  /chapter/{id}    - Hoofdstuk data (JSON)
GET  /content/{id}    - Content data (JSON)

VOOR TESTDOELEINDEN:
-----------------
1. Unit testing: Gebruik mock_site voor geïsoleerde tests
2. Integration testing: Test volledige workflow
3. Selector ontwikkeling: Test en debug selectors
4. Performance testing: Meet scrape snelheid

BELANGRIJK:
----------
- De mock site is alleen voor ontwikkeling en testing
- Gebruik altijd de echte site voor productie runs
- De mock site simuleert de structuur maar niet alle edge cases
"""