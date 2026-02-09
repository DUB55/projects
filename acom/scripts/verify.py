import os
import sys
import requests

def main():
    base = "http://127.0.0.1:8443"
    s = requests.Session()
    r = s.get(f"{base}/login")
    r = s.post(f"{base}/login", data={"password": "acom"}, allow_redirects=False)
    print("login_status", r.status_code)
    print("status", s.get(f"{base}/api/status").text)
    print("texts_before", s.get(f"{base}/api/texts").text)
    # admin actions
    from server.config import ensure_config
    sec = ensure_config()["admin_secret"]
    r = requests.post(f"{base}/api/texts", headers={"X-Admin-Secret": sec},
                      json={"name": "VerifyText", "content": "Hello iPad", "ttl_minutes": 5})
    print("add_text_status", r.status_code, r.text)
    print("texts_after", s.get(f"{base}/api/texts").text)
    # add root
    folder = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    r = requests.post(f"{base}/api/roots", headers={"X-Admin-Secret": sec},
                      json={"base_path": folder, "ttl_minutes": 5})
    print("add_root_status", r.status_code, r.text)
    rid = r.json()["id"]
    print("tree_dot", s.get(f"{base}/api/roots/{rid}/tree", params={"path": "."}).text[:200])
    print("read_requirements_firstline", s.get(f"{base}/api/roots/{rid}/file", params={"path": "requirements.txt"}).text.splitlines()[0])

if __name__ == "__main__":
    main()
