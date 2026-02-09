# Handleiding: Antigravity Remote Controller (Windows 11)

## Vereisten installeren
- Installeer Python 3.x
- Installeer libraries:

```bash
python -m pip install Flask pyautogui pyperclip requests
```

## Scripts starten
- Start de daemon:

```bash
python "c:\Users\Mohammed\OneDrive - St Michaël College\2025-2026\Wiskunde\Uitwerkingen\Projects\Projects\agaiip\antigravity_daemon.py"
```

- Start de configuratie GUI (optioneel):

```bash
python "c:\Users\Mohammed\OneDrive - St Michaël College\2025-2026\Wiskunde\Uitwerkingen\Projects\Projects\agaiip\config_gui.py"
```

## Coördinaten bepalen
- Beweeg je muis naar het doel (menu, export, defocus, save).
- Lees positie:

```bash
python -c "import pyautogui, time; print('Move mouse...'); time.sleep(5); print(pyautogui.position())"
```

- Noteer per punt een regel in dit formaat:
  - Point(x=985, y=508)

## Configuratie via GUI
- IP wordt automatisch gedetecteerd; pas aan indien nodig.
- Vul per veld (menu_point, export_md_point, defocus_point, save_button_point) een regel zoals Point(x=..., y=...); leeg laten mag.
- Stel username/password, markers en tuning (stability_cycles, min_length, max_wait_seconds).
- Klik “Save Config” om te verzenden naar de daemon.
- Klik “Generate curl” om een kant-en-klare configuratie opdrachtregel te kopiëren.

## Configuratie via curl
- Voorbeeld:

```bash
curl -X POST http://<IP>:5000/config -H "Content-Type: application/json" ^
   -d "{\"menu_x\":1750,\"menu_y\":120,\"export_md_x\":1720,\"export_md_y\":180,\"defocus_x\":1600,\"defocus_y\":200,\"save_button_x\":1350,\"save_button_y\":950,\"user_begin_marker\":\"-*-BEGIN-*-\",\"user_end_marker\":\"-*-END-*-\"}"
```

## Web UI gebruiken
- Open: http://<IP>:5000/ui
- Log in met username/password (instelbaar via /config).
- Prompt invoer:
  - Enter voegt een nieuwe regel toe (verstuurt niet).
  - Klik “Send” om te versturen.
- Klik “Capture Chat” na een response:
  - Haalt volledige chat via dubbelklik op defocus_point, Ctrl+A en Ctrl+C
  - Berekent “laatste veranderingen” (delta) ten opzichte van vorige capture
  - Toont delta als “Latest Response”
  - Toont volledige chat als “Chat (parsed)”

## Hoe te gebruiken (stappen)
- Open VS Code met Antigravity zichtbaar.
- Stel coördinaten en markers juist in.
- Verstuur prompt via UI of via iPhone Shortcut.
- Wacht op response.
- Klik “Capture Chat” om de nieuwste toestand op te halen en te tonen.

## Verschillende Wi‑Fi netwerken
- Optie 1: Cloudflare Tunnel

```bash
winget install Cloudflare.Cloudflared
cloudflared tunnel --url http://localhost:5000
```

- Gebruik de gegenereerde https-URL op iPhone en voor webtoegang.

- Optie 2: Tailscale
- Optie 3: Port forwarding + DynDNS (alleen als je weet wat je doet)

## Endpoints
- POST /prompt → start generatie
- GET /latest → status + delta
- POST /capture_chat → forceer ophalen chat
- GET /chat → { raw, delta, messages[] }
- GET /status → state + config
- POST /config → update instellingen
- GET /ui → webinterface (met login)

## Tips
- Zet VS Code en Antigravity op dezelfde monitor, zoom niet wijzigen na calibratie.
- Defocus_point moet het inputveld “losmaken” zodat Ctrl+A de hele chat selecteert.
- Pas markers aan aan jouw prompt-delimiters.
