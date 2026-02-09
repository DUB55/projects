# ACOM — Local Share Dashboard

Share text, files, or entire folders from your Windows laptop to your iPhone/iPad over your home/office Wi‑Fi. Runs locally with a single dashboard URL, password-protected, no cloud.

## Features
- One dashboard URL with two tabs: Explorer (folders/files) and Shared Texts
- Password login remembered via a cookie (90 days)
- CLI on laptop to share folders/files/clipboard/typed text, with custom TTLs
- Raw content delivery (no rendering), fast and reliable
- Optional HTTPS with local certificates (mkcert)

## Prerequisites
- Python 3.10+ installed (Windows)
- pip available
- Optional: mkcert for local HTTPS

## Install

```bash
python -m pip install -r "acom/requirements.txt"
```

## Run everything (server + CLI) with one command

```bash
python "acom/start.py"
```

What this does:
- Starts the local FastAPI server in the background
- Prints the dashboard URL, e.g. `http://YOUR_LAN_IP:8443/`
- Opens the interactive CLI menu in the same terminal

Menu options in the CLI:
- Share a folder: provide a folder path and TTL (minutes)
- Share a file: provide a file path and TTL
- Share clipboard content: name + TTL; clipboard is read from Windows
- Share typed text: enter a name, then paste/type; finish the input with a line `EOF`; choose TTL
- Set dashboard password: change the login password

Notes:
- TTL determines how long items remain visible on the dashboard (e.g., 5 or 20 minutes)
- You can share multiple folders/files/texts; they show under the single dashboard URL

## Dashboard UX
- Explorer tab:
  - Shows each shared root (folder or single file)
  - Click a folder to navigate its subdirectories
  - Click a file to view raw content; Copy button copies the file content
  - Binary files download; Copy button is disabled for non-text
- Shared Texts tab:
  - Lists named texts with shared timestamp and expiry
  - Click to view raw content; Copy button copies the entire text

## HTTPS (Optional but Recommended)
1. Create a `cert` folder in `acom` and generate a local certificate:
   ```bash
   mkcert -install
   mkcert -key-file "acom/cert/server.key" -cert-file "acom/cert/server.pem" YOUR_LAN_IP
   ```
2. Install the mkcert root CA on your iPad:
   - Transfer the CA file to iPad, install the profile
   - Enable full trust in Settings → General → About → Certificate Trust Settings
3. Restart the server; it will use HTTPS automatically and print an `https://` URL.

## Configuration
- The app creates `acom/data/config.json` on first run with:
  - `password_hash`, `password_salt`: salted PBKDF2 for the dashboard password
  - `cookie_secret`, `admin_secret`: secrets used for signing and CLI/API admin
  - `port`: default `8443`
- To change the port, edit `acom/data/config.json` and restart the server.

## Firewall
- Ensure Windows Firewall allows inbound on the chosen port (default 8443) for Private network.
- Access is limited to your LAN; no external services are used.

## Troubleshooting
- If iPad can’t reach the URL:
  - Confirm both devices are on the same Wi‑Fi and use the LAN IP
  - Temporarily test with `http://` before enabling HTTPS
  - Check Windows Firewall rule for Private network on the chosen port
- If clipboard sharing fails:
  - Ensure clipboard content is available in Windows before running the CLI option

## Notes on Security
- Local-only; no cloud calls
- Password login with long-lived cookie (valid for 90 days)
- Items expire by TTL but the server continues running until you stop it
- Paths are validated to prevent leaving shared roots
