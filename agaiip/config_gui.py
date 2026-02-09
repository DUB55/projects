import tkinter as tk
import requests
import socket

def post_config(ip, payload):
    try:
        r = requests.post(f"http://{ip}:5000/config", json=payload, timeout=5)
        return r.json()
    except Exception:
        return {"error": "network"}

def get_status(ip):
    try:
        r = requests.get(f"http://{ip}:5000/status", timeout=5)
        return r.json()
    except Exception:
        return {"error": "network"}

def export_md(ip):
    try:
        r = requests.post(f"http://{ip}:5000/export_md", timeout=5)
        return r.json()
    except Exception:
        return {"error": "network"}

def parse_point(s):
    try:
        s = s.strip()
        if not s:
            return None
        if not s.startswith("Point(") or not s.endswith(")"):
            return None
        inner = s[len("Point("):-1]
        parts = inner.split(",")
        x = None
        y = None
        for p in parts:
            p = p.strip()
            if p.startswith("x="):
                x = int(p[2:].strip())
            elif p.startswith("y="):
                y = int(p[2:].strip())
        if x is None or y is None:
            return None
        return (x, y)
    except Exception:
        return None

def build_gui():
    root = tk.Tk()
    root.title("Antigravity Config")
    labels = ["IP", "username", "password", "menu_point", "export_md_point", "defocus_point", "save_button_point", "md_path", "stability_cycles", "min_length", "max_wait_seconds", "user_begin_marker", "user_end_marker"]
    entries = {}
    for i, lbl in enumerate(labels):
        tk.Label(root, text=lbl).grid(row=i, column=0, sticky="w")
        e = tk.Entry(root, width=40)
        e.grid(row=i, column=1)
        entries[lbl] = e
    def detect_ip():
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = "127.0.0.1"
        finally:
            s.close()
        return ip
    entries["IP"].insert(0, detect_ip())
    entries["username"].insert(0, "admin")
    entries["password"].insert(0, "change_me")
    entries["stability_cycles"].insert(0, "3")
    entries["min_length"].insert(0, "20")
    entries["max_wait_seconds"].insert(0, "300")
    entries["user_begin_marker"].insert(0, "-*-BEGIN-*-")
    entries["user_end_marker"].insert(0, "-*-END-*-")
    out = tk.Text(root, height=12, width=60)
    out.grid(row=len(labels), column=0, columnspan=2, pady=8)
    def save():
        ip = entries["IP"].get()
        payload = {}
        v = entries["username"].get()
        if v != "":
            payload["username"] = v
        v = entries["password"].get()
        if v != "":
            payload["password"] = v
        v = entries["md_path"].get()
        if v != "":
            payload["md_path"] = v
        for k in ["stability_cycles","min_length","max_wait_seconds"]:
            v = entries[k].get()
            if v != "":
                payload[k] = int(v)
        for k in ["user_begin_marker","user_end_marker"]:
            v = entries[k].get()
            if v != "":
                payload[k] = v
        mp = parse_point(entries["menu_point"].get())
        if mp:
            payload["menu_x"], payload["menu_y"] = mp
        ep = parse_point(entries["export_md_point"].get())
        if ep:
            payload["export_md_x"], payload["export_md_y"] = ep
        dp = parse_point(entries["defocus_point"].get())
        if dp:
            payload["defocus_x"], payload["defocus_y"] = dp
        sp = parse_point(entries["save_button_point"].get())
        if sp:
            payload["save_button_x"], payload["save_button_y"] = sp
        res = post_config(ip, payload)
        out.delete("1.0", tk.END)
        out.insert(tk.END, str(res))
    def status():
        ip = entries["IP"].get()
        res = get_status(ip)
        out.delete("1.0", tk.END)
        out.insert(tk.END, str(res))
    def gen_curl():
        ip = entries["IP"].get()
        payload = {}
        v = entries["username"].get()
        if v != "":
            payload["username"] = v
        v = entries["password"].get()
        if v != "":
            payload["password"] = v
        v = entries["md_path"].get()
        if v != "":
            payload["md_path"] = v
        for k in ["stability_cycles","min_length","max_wait_seconds","user_begin_marker","user_end_marker"]:
            v = entries[k].get()
            if v != "":
                payload[k] = v if k in ["user_begin_marker","user_end_marker"] else int(v)
        mp = parse_point(entries["menu_point"].get())
        if mp:
            payload["menu_x"], payload["menu_y"] = mp
        ep = parse_point(entries["export_md_point"].get())
        if ep:
            payload["export_md_x"], payload["export_md_y"] = ep
        dp = parse_point(entries["defocus_point"].get())
        if dp:
            payload["defocus_x"], payload["defocus_y"] = dp
        sp = parse_point(entries["save_button_point"].get())
        if sp:
            payload["save_button_x"], payload["save_button_y"] = sp
        import json
        body = json.dumps(payload).replace('"','\\"')
        cmd = f'curl -X POST http://{ip}:5000/config -H "Content-Type: application/json" ^\n   -d "{body}"'
        out.delete("1.0", tk.END)
        out.insert(tk.END, cmd)
    tk.Button(root, text="Save Config", command=save).grid(row=len(labels)+1, column=0, sticky="we", pady=4)
    tk.Button(root, text="Check Status", command=status).grid(row=len(labels)+1, column=1, sticky="we", pady=4)
    tk.Button(root, text="Generate curl", command=gen_curl).grid(row=len(labels)+2, column=0, columnspan=2, sticky="we", pady=4)
    root.mainloop()

if __name__ == "__main__":
    build_gui()
