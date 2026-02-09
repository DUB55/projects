# tests/mock_server.py
import asyncio
from aiohttp import web
import json
from pathlib import Path

class MockNoordhoffServer:
    """Mock server voor het testen van de scraper"""
    
    def __init__(self, host: str = "localhost", port: int = 8080):
        self.host = host
        self.port = port
        self.app = web.Application()
        self.setup_routes()
        
    def setup_routes(self):
        """Stel routes in voor mock server"""
        self.app.router.add_get('/', self.handle_root)
        self.app.router.add_get('/login', self.handle_login_page)
        self.app.router.add_post('/login', self.handle_login)
        self.app.router.add_get('/dashboard', self.handle_dashboard)
        self.app.router.add_get('/book/{book_id}', self.handle_book)
        self.app.router.add_get('/chapter/{chapter_id}', self.handle_chapter)
        self.app.router.add_get('/content/{content_id}', self.handle_content)
        
        # Statische bestanden
        static_path = Path(__file__).parent / "mock_site"
        self.app.router.add_static('/static/', static_path)
        
    async def handle_root(self, request):
        """Handle root redirect naar login"""
        return web.HTTPFound('/login')
        
    async def handle_login_page(self, request):
        """Retourneer login pagina"""
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mock Noordhoff - Login</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .login-form { max-width: 400px; margin: 0 auto; }
                input, button { width: 100%; padding: 10px; margin: 10px 0; }
                .error { color: red; }
            </style>
        </head>
        <body>
            <div class="login-form">
                <h2>Mock Noordhoff Platform</h2>
                <form id="loginForm" action="/login" method="post">
                    <input type="email" name="email" placeholder="E-mail" required>
                    <input type="password" name="password" placeholder="Wachtwoord" required>
                    <button type="submit">Inloggen</button>
                </form>
                <div id="message"></div>
            </div>
        </body>
        </html>
        """
        return web.Response(text=html, content_type='text/html')
        
    async def handle_login(self, request):
        """Handle login POST request"""
        data = await request.post()
        email = data.get('email', '')
        password = data.get('password', '')
        
        # Simpele validatie
        if email and password:
            # Stel cookie in en redirect naar dashboard
            response = web.HTTPFound('/dashboard')
            response.set_cookie('session', 'mock_session_12345')
            return response
        else:
            return web.Response(text='Ongeldige login', status=400)
            
    async def handle_dashboard(self, request):
        """Retourneer dashboard met boekenlijst"""
        # Controleer sessie
        if 'session' not in request.cookies:
            return web.HTTPFound('/login')
            
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mock Noordhoff - Dashboard</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .greeting { color: #333; }
                .book-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
                .book-item { border: 1px solid #ccc; padding: 15px; cursor: pointer; }
                .book-item:hover { background-color: #f0f0f0; }
                .book-title { font-weight: bold; }
            </style>
            <script>
                function selectBook(bookId) {
                    window.location.href = '/book/' + bookId;
                }
            </script>
        </head>
        <body>
            <h1 class="greeting">Welkom, Test Student!</h1>
            <div class="book-grid">
                <div class="book-item" onclick="selectBook(1)">
                    <div class="book-title">Wiskunde A - 4 VWO</div>
                    <div>Hoofdstukken: 8</div>
                </div>
                <div class="book-item" onclick="selectBook(2)">
                    <div class="book-title">Natuurkunde - 5 VWO</div>
                    <div>Hoofdstukken: 10</div>
                </div>
                <div class="book-item" onclick="selectBook(3)">
                    <div class="book-title">Scheikunde - 6 VWO</div>
                    <div>Hoofdstukken: 12</div>
                </div>
            </div>
        </body>
        </html>
        """
        return web.Response(text=html, content_type='text/html')
        
    async def handle_book(self, request):
        """Retourneer boek pagina met hoofdstukken"""
        book_id = request.match_info['book_id']
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Boek {book_id} - Mock Noordhoff</title>
            <style>
                body {{ font-family: Arial, sans-serif; display: flex; }}
                .sidebar {{ width: 250px; padding: 20px; background-color: #f5f5f5; }}
                .content {{ flex: 1; padding: 20px; }}
                .chapter-button {{ padding: 10px; margin: 5px 0; background-color: #e0e0e0; cursor: pointer; }}
                .paragraph-button {{ padding: 8px; margin-left: 20px; background-color: #f0f0f0; cursor: pointer; display: none; }}
                .learning-objectives {{ background-color: #e8f5e8; padding: 15px; margin: 20px 0; }}
                .lesson-content {{ line-height: 1.6; }}
                img {{ max-width: 100%; }}
            </style>
            <script>
                function toggleParagraphs(chapterId) {{
                    var paragraphs = document.getElementById('paragraphs-' + chapterId);
                    if (paragraphs.style.display === 'block') {{
                        paragraphs.style.display = 'none';
                    }} else {{
                        paragraphs.style.display = 'block';
                    }}
                }}
                
                function loadContent(chapter, paragraph) {{
                    // Simuleer content laden
                    document.getElementById('objectives').innerHTML = 
                        '<h3>Leerdoelen voor Hoofdstuk ' + chapter + ', Paragraaf ' + paragraph + '</h3>' +
                        '<ul><li>Je kunt de basisbegrippen uitleggen</li>' +
                        '<li>Je kunt voorbeelden geven</li><li>Je kunt eenvoudige problemen oplossen</li></ul>';
                    
                    document.getElementById('lesson').innerHTML = 
                        '<h2>Leerstof Hoofdstuk ' + chapter + ', Paragraaf ' + paragraph + '</h2>' +
                        '<p>Dit is de leerstof voor deze paragraaf. Hier komt alle theorie en uitleg.</p>' +
                        '<img src="https://via.placeholder.com/400x200.png?text=Diagram+' + chapter + '-' + paragraph + '" alt="Diagram">' +
                        '<p>Extra uitleg en voorbeelden komen hier.</p>' +
                        '<img src="https://via.placeholder.com/400x200.png?text=Voorbeeld+' + chapter + '-' + paragraph + '" alt="Voorbeeld">';
                }}
            </script>
        </head>
        <body>
            <div class="sidebar">
                <h3>Hoofdstukken</h3>
                <div class="chapter-button" onclick="toggleParagraphs(1)">
                    Hoofdstuk 1: Inleiding
                </div>
                <div id="paragraphs-1" class="paragraph-container">
                    <div class="paragraph-button" onclick="loadContent(1, 1)">Paragraaf 1.1</div>
                    <div class="paragraph-button" onclick="loadContent(1, 2)">Paragraaf 1.2</div>
                </div>
                <div class="chapter-button" onclick="toggleParagraphs(2)">
                    Hoofdstuk 2: Theorie
                </div>
                <div id="paragraphs-2" class="paragraph-container">
                    <div class="paragraph-button" onclick="loadContent(2, 1)">Paragraaf 2.1</div>
                </div>
            </div>
            
            <div class="content">
                <div id="objectives" class="learning-objectives">
                    <h3>Leerdoelen</h3>
                    <p>Selecteer een paragraaf om leerdoelen te zien.</p>
                </div>
                
                <div id="lesson" class="lesson-content">
                    <h2>Leerstof</h2>
                    <p>Selecteer een paragraaf om leerstof te zien.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return web.Response(text=html, content_type='text/html')
        
    async def handle_chapter(self, request):
        """Retourneer hoofdstuk content (API endpoint)"""
        chapter_id = request.match_info['chapter_id']
        
        data = {
            "chapter_id": chapter_id,
            "title": f"Hoofdstuk {chapter_id}",
            "paragraphs": [
                {"id": f"{chapter_id}.1", "title": f"Paragraaf {chapter_id}.1"},
                {"id": f"{chapter_id}.2", "title": f"Paragraaf {chapter_id}.2"}
            ]
        }
        
        return web.Response(text=json.dumps(data), content_type='application/json')
        
    async def handle_content(self, request):
        """Retourneer content voor een paragraaf (API endpoint)"""
        content_id = request.match_info['content_id']
        
        data = {
            "content_id": content_id,
            "objectives": [
                "Je kunt de basisbegrippen uitleggen",
                "Je kunt voorbeelden geven",
                "Je kunt eenvoudige problemen oplossen"
            ],
            "lesson": f"Dit is de leerstof voor {content_id}. Hier komt alle theorie en uitleg.",
            "images": [
                f"https://via.placeholder.com/400x200.png?text=Diagram+{content_id}",
                f"https://via.placeholder.com/400x200.png?text=Voorbeeld+{content_id}"
            ]
        }
        
        return web.Response(text=json.dumps(data), content_type='application/json')
        
    async def start(self):
        """Start de mock server"""
        runner = web.AppRunner(self.app)
        await runner.setup()
        
        site = web.TCPSite(runner, self.host, self.port)
        await site.start()
        
        print(f"Mock server gestart op http://{self.host}:{self.port}")
        print("Routes:")
        print("  /login           - Login pagina")
        print("  /dashboard       - Dashboard met boeken")
        print("  /book/{id}       - Boek pagina")
        print("  /static/         - Statische bestanden")
        
        # Blijf runnen
        try:
            while True:
                await asyncio.sleep(3600)
        except KeyboardInterrupt:
            print("\nServer gestopt")
            
async def main():
    """Hoofdfunctie om mock server te starten"""
    server = MockNoordhoffServer()
    await server.start()

if __name__ == "__main__":
    asyncio.run(main())