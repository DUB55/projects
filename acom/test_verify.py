import os
import json
import requests
from server.config import ensure_config

BASE = "http://127.0.0.1:8443"

def main():
    s = requests.Session()
    r = s.get(f"{BASE}/login")
    r = s.post(f"{BASE}/login", data={"password": "acom"}, allow_redirects=False)
    print("login_status", r.status_code)
    assert r.status_code == 302
    r = s.get(f"{BASE}/api/status")
    print("status", r.text)
    r = s.get(f"{BASE}/api/texts")
    print("texts", r.text)
    sec = ensure_config()["admin_secret"]
    r = requests.post(f"{BASE}/api/texts", headers={"X-Admin-Secret": sec}, json={"name":"PyTest","content":"abc","ttl_minutes":5}, verify=False)
    print("add_text", r.text)
    r = s.get(f"{BASE}/api/texts")
    print("texts2", r.text)
    texts = r.json()
    t0 = texts[0]["id"]
    r = s.get(f"{BASE}/api/texts/{t0}")
    print("text_content_first20", r.text[:20])
    base = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    r = requests.post(f"{BASE}/api/roots", headers={"X-Admin-Secret": sec}, json={"base_path": base, "ttl_minutes": 5}, verify=False)
    print("add_root", r.text)
    r = s.get(f"{BASE}/api/roots")
    print("roots", r.text)
    roots = r.json()
    rid = roots[0]["id"]
    r = s.get(f"{BASE}/api/roots/{rid}/tree", params={"path": "."})
    print("tree", r.text[:120])
    r = s.get(f"{BASE}/api/roots/{rid}/file", params={"path": "requirements.txt"})
    print("file_first_line", r.text.splitlines()[0])

if __name__ == "__main__":
    main()
