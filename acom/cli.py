import sys
import time
import json
from pathlib import Path
import requests
import pyperclip
from server.config import ensure_config, save_password
from server.auth import get_local_ip

def print_url():
    cfg = ensure_config()
    ip = get_local_ip()
    port = int(cfg.get("port", 8443))
    cert_dir = Path(__file__).resolve().parent / "cert"
    scheme = "https" if (cert_dir / "server.pem").exists() and (cert_dir / "server.key").exists() else "http"
    print(f"Dashboard URL: {scheme}://{ip}:{port}/")

def api_base():
    cfg = ensure_config()
    ip = get_local_ip()
    port = int(cfg.get("port", 8443))
    cert_dir = Path(__file__).resolve().parent / "cert"
    scheme = "https" if (cert_dir / "server.pem").exists() and (cert_dir / "server.key").exists() else "http"
    return f"{scheme}://{ip}:{port}"

def admin_headers():
    cfg = ensure_config()
    return {"X-Admin-Secret": cfg["admin_secret"]}

def share_text():
    name = input("Enter name for the shared text: ").strip()
    print("Enter text content. Finish with a single line containing only 'EOF'.")
    lines = []
    while True:
        line = sys.stdin.readline()
        if line is None or line.strip() == "EOF":
            break
        lines.append(line)
    content = "".join(lines)
    ttl = int(input("TTL minutes (e.g., 5 or 20): ").strip())
    url = api_base() + "/api/texts"
    r = requests.post(url, headers=admin_headers(), json={"name": name, "content": content, "ttl_minutes": ttl}, verify=False)
    if r.status_code == 200:
        print("Shared text added.")
    else:
        print(f"Error: {r.status_code} {r.text}")

def share_clipboard():
    name = input("Enter name for the clipboard text: ").strip()
    content = pyperclip.paste()
    print(f"Clipboard length: {len(content)} characters")
    ttl = int(input("TTL minutes (e.g., 5 or 20): ").strip())
    url = api_base() + "/api/texts"
    r = requests.post(url, headers=admin_headers(), json={"name": name, "content": content, "ttl_minutes": ttl}, verify=False)
    if r.status_code == 200:
        print("Shared clipboard text added.")
    else:
        print(f"Error: {r.status_code} {r.text}")

def share_folder():
    path = input("Enter folder path: ").strip().strip('"')
    ttl = int(input("TTL minutes (e.g., 5 or 20): ").strip())
    url = api_base() + "/api/roots"
    r = requests.post(url, headers=admin_headers(), json={"base_path": path, "ttl_minutes": ttl}, verify=False)
    if r.status_code == 200:
        print("Shared folder added.")
    else:
        print(f"Error: {r.status_code} {r.text}")

def share_file():
    path = input("Enter file path: ").strip().strip('"')
    ttl = int(input("TTL minutes (e.g., 5 or 20): ").strip())
    url = api_base() + "/api/roots"
    r = requests.post(url, headers=admin_headers(), json={"base_path": path, "ttl_minutes": ttl}, verify=False)
    if r.status_code == 200:
        print("Shared file added.")
    else:
        print(f"Error: {r.status_code} {r.text}")

def set_password():
    pw = input("Set new dashboard password: ").strip()
    save_password(pw)
    print("Password updated. You will need to login with the new password.")

def menu():
    print_url()
    while True:
        print("\nMenu:")
        print("  1) Share a folder")
        print("  2) Share a file")
        print("  3) Share clipboard content")
        print("  4) Share typed text (EOF to finish)")
        print("  5) Set dashboard password")
        print("  0) Exit")
        choice = input("Choose an option: ").strip()
        if choice == "1":
            share_folder()
        elif choice == "2":
            share_file()
        elif choice == "3":
            share_clipboard()
        elif choice == "4":
            share_text()
        elif choice == "5":
            set_password()
        elif choice == "0":
            break
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    menu()
