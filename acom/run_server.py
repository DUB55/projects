import ssl
import uvicorn
from pathlib import Path
from server.config import ensure_config
from server.auth import get_local_ip

def main():
    cfg = ensure_config()
    port = int(cfg.get("port", 8443))
    cert_dir = Path(__file__).resolve().parent / "cert"
    certfile = cert_dir / "server.pem"
    keyfile = cert_dir / "server.key"
    scheme = "http"
    ssl_certfile = None
    ssl_keyfile = None
    if certfile.exists() and keyfile.exists():
        ssl_certfile = str(certfile)
        ssl_keyfile = str(keyfile)
        scheme = "https"
    ip = get_local_ip()
    print(f"Dashboard URL: {scheme}://{ip}:{port}/")
    if ssl_certfile is None or ssl_keyfile is None:
        print("Note: TLS certificate not found. Running over HTTP.")
        print("To enable HTTPS, place cert/server.pem and cert/server.key here (mkcert recommended).")
    uvicorn.run("server.app:app", host="0.0.0.0", port=port, ssl_certfile=ssl_certfile, ssl_keyfile=ssl_keyfile, log_level="info")

if __name__ == "__main__":
    main()
