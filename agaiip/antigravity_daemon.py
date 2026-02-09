import threading
import time
import os
from flask import Flask, request, jsonify, session, redirect
import pyautogui
import pyperclip

app = Flask(__name__)
app.secret_key = "change_this_secret"

@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    return resp

@app.route("/", defaults={"path": ""}, methods=["OPTIONS"])
@app.route("/<path:path>", methods=["OPTIONS"])
def cors_options(path):
    return ("", 204)

STATE = "IDLE"
LATEST_RESPONSE = ""
LAST_SEEN_CLIPBOARD = ""
LATEST_MD_CONTENT = ""
LATEST_CHAT_CONTENT = ""
LAST_DELTA = ""
STATE_LOCK = threading.Lock()

MENU_X = 1750
MENU_Y = 120
EXPORT_MD_X = 1720
EXPORT_MD_Y = 180
MD_PATH = os.path.join(os.path.expanduser("~"), "Downloads", "antigravity_latest.md")
DEFOCUS_X = 1600
DEFOCUS_Y = 200
SAVE_BUTTON_X = 1350
SAVE_BUTTON_Y = 950
STABILITY_CYCLES = 3
MIN_LENGTH = 20
MAX_WAIT_SECONDS = 300
USERNAME = "tcookdub5"
PASSWORD = "Wongfeihung99-"
USER_BEGIN_MARKER = "-*-BEGIN-*-"
USER_END_MARKER = "-*-END-*-"

@app.before_request
def check_auth():
    if request.method == "OPTIONS":
        return
    if request.endpoint in ["login_endpoint", "health_endpoint", "static", "cors_options"]:
        return
    # 1. Check session
    if session.get("auth") is True:
        return
    # 2. Check Authorization header (Basic or custom)
    auth = request.authorization
    if auth and auth.username == USERNAME and auth.password == PASSWORD:
        return
    # 3. Check X-API-Key or similar (optional, but Basic Auth is standard)
    # If using fetch with headers: { 'Authorization': 'Basic ' + btoa(user:pass) }
    
    # 4. JSON body check (fallback for some clients)
    if request.is_json:
        data = request.get_json(silent=True) or {}
        if data.get("username") == USERNAME and data.get("password") == PASSWORD:
            return

    return jsonify({"error": "Unauthorized"}), 401

def focus_vscode():
    pyautogui.hotkey("alt", "tab")
    time.sleep(0.2)

def inject_prompt_text(prompt: str):
    pyperclip.copy(prompt or "")
    time.sleep(0.05)
    pyautogui.hotkey("ctrl", "v")
    time.sleep(0.05)
    pyautogui.press("enter")

def capture_full_chat() -> str:
    pyautogui.doubleClick(DEFOCUS_X, DEFOCUS_Y)
    time.sleep(0.05)
    pyautogui.hotkey("ctrl", "a")
    time.sleep(0.05)
    pyautogui.hotkey("ctrl", "c")
    time.sleep(0.05)
    return read_clipboard_safely()

def read_clipboard_safely() -> str:
    for _ in range(5):
        try:
            return pyperclip.paste() or ""
        except Exception:
            time.sleep(0.05)
    return ""

def capture_response_loop():
    global STATE, LATEST_RESPONSE, LAST_SEEN_CLIPBOARD, LATEST_CHAT_CONTENT, LAST_DELTA
    stable = 0
    previous = capture_full_chat()
    start = time.time()
    while stable < STABILITY_CYCLES and (time.time() - start) < MAX_WAIT_SECONDS:
        current = capture_full_chat()
        if len(current) >= MIN_LENGTH and current == previous:
            stable += 1
        else:
            stable = 0
            previous = current
        time.sleep(0.3)
    new_chat = previous if len(previous) >= MIN_LENGTH else read_clipboard_safely()
    delta = compute_delta(LATEST_CHAT_CONTENT, new_chat)
    LATEST_CHAT_CONTENT = new_chat
    LAST_DELTA = delta
    LATEST_RESPONSE = delta
    LAST_SEEN_CLIPBOARD = new_chat
    with STATE_LOCK:
        STATE = "DONE"

def run_generation(prompt: str):
    focus_vscode()
    inject_prompt_text(prompt)
    capture_response_loop()

def export_md():
    global LATEST_MD_CONTENT
    focus_vscode()
    pyautogui.click(MENU_X, MENU_Y)
    time.sleep(0.2)
    pyautogui.click(EXPORT_MD_X, EXPORT_MD_Y)
    time.sleep(0.5)
    pyautogui.click(SAVE_BUTTON_X, SAVE_BUTTON_Y)
    start = time.time()
    while (time.time() - start) < 60:
        if os.path.exists(MD_PATH) and os.path.getsize(MD_PATH) > 0:
            try:
                with open(MD_PATH, "r", encoding="utf-8", errors="ignore") as f:
                    LATEST_MD_CONTENT = f.read()
            except Exception:
                LATEST_MD_CONTENT = ""
            break
        time.sleep(0.5)

def compute_delta(old: str, new: str) -> str:
    i = 0
    limit = min(len(old), len(new))
    while i < limit and old[i] == new[i]:
        i += 1
    return new[i:]

def parse_chat(text: str):
    messages = []
    idx = 0
    while True:
        start = text.find(USER_BEGIN_MARKER, idx)
        if start == -1:
            remaining = text[idx:].strip()
            if remaining:
                messages.append({"type": "ai", "text": remaining})
            break
        end = text.find(USER_END_MARKER, start + len(USER_BEGIN_MARKER))
        if end == -1:
            # marker not closed; treat rest as user
            user_text = text[start + len(USER_BEGIN_MARKER):].strip()
            if user_text:
                messages.append({"type": "user", "text": user_text})
            break
        # AI chunk before user
        ai_chunk = text[idx:start].strip()
        if ai_chunk:
            messages.append({"type": "ai", "text": ai_chunk})
        user_chunk = text[start + len(USER_BEGIN_MARKER):end].strip()
        if user_chunk:
            messages.append({"type": "user", "text": user_chunk})
        idx = end + len(USER_END_MARKER)
    return messages

@app.route("/prompt", methods=["POST"])
def prompt_endpoint():
    global STATE, LATEST_RESPONSE
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "")
    if not isinstance(prompt, str) or not prompt.strip():
        return jsonify({"status": "error", "error": "invalid_prompt"}), 400
    with STATE_LOCK:
        if STATE == "GENERATING":
            return jsonify({"status": "rejected"}), 409
        STATE = "GENERATING"
        LATEST_RESPONSE = ""
    threading.Thread(target=run_generation, args=(prompt,), daemon=True).start()
    return jsonify({"status": "accepted"})

@app.route("/latest", methods=["GET"])
def latest_endpoint():
    global STATE, LATEST_RESPONSE
    with STATE_LOCK:
        status = STATE
        response = LATEST_RESPONSE
        if STATE == "DONE":
            STATE = "IDLE"
    return jsonify({"status": status, "response": response or ""})

@app.route("/health", methods=["GET"])
def health_endpoint():
    return jsonify({"status": "ok"})

def current_config():
    return {
        "menu_x": MENU_X,
        "menu_y": MENU_Y,
        "export_md_x": EXPORT_MD_X,
        "export_md_y": EXPORT_MD_Y,
        "md_path": MD_PATH,
        "defocus_x": DEFOCUS_X,
        "defocus_y": DEFOCUS_Y,
        "save_button_x": SAVE_BUTTON_X,
        "save_button_y": SAVE_BUTTON_Y,
        "stability_cycles": STABILITY_CYCLES,
        "min_length": MIN_LENGTH,
        "max_wait_seconds": MAX_WAIT_SECONDS,
        "username": USERNAME,
        "user_begin_marker": USER_BEGIN_MARKER,
        "user_end_marker": USER_END_MARKER,
    }

@app.route("/status", methods=["GET"])
def status_endpoint():
    with STATE_LOCK:
        s = STATE
    return jsonify({"status": s, "config": current_config()})

@app.route("/config", methods=["POST"])
def config_endpoint():
    global STABILITY_CYCLES, MIN_LENGTH, MAX_WAIT_SECONDS, MENU_X, MENU_Y, EXPORT_MD_X, EXPORT_MD_Y, MD_PATH, USERNAME, PASSWORD, DEFOCUS_X, DEFOCUS_Y, SAVE_BUTTON_X, SAVE_BUTTON_Y, USER_BEGIN_MARKER, USER_END_MARKER
    data = request.get_json(silent=True) or {}
    with STATE_LOCK:
        if "menu_x" in data:
            try:
                MENU_X = int(data["menu_x"])
            except Exception:
                pass
        if "menu_y" in data:
            try:
                MENU_Y = int(data["menu_y"])
            except Exception:
                pass
        if "export_md_x" in data:
            try:
                EXPORT_MD_X = int(data["export_md_x"])
            except Exception:
                pass
        if "export_md_y" in data:
            try:
                EXPORT_MD_Y = int(data["export_md_y"])
            except Exception:
                pass
        if "md_path" in data:
            try:
                MD_PATH = str(data["md_path"])
            except Exception:
                pass
        if "defocus_x" in data:
            try:
                DEFOCUS_X = int(data["defocus_x"])
            except Exception:
                pass
        if "defocus_y" in data:
            try:
                DEFOCUS_Y = int(data["defocus_y"])
            except Exception:
                pass
        if "save_button_x" in data:
            try:
                SAVE_BUTTON_X = int(data["save_button_x"])
            except Exception:
                pass
        if "save_button_y" in data:
            try:
                SAVE_BUTTON_Y = int(data["save_button_y"])
            except Exception:
                pass
        if "stability_cycles" in data:
            try:
                STABILITY_CYCLES = max(1, int(data["stability_cycles"]))
            except Exception:
                pass
        if "min_length" in data:
            try:
                MIN_LENGTH = max(0, int(data["min_length"]))
            except Exception:
                pass
        if "max_wait_seconds" in data:
            try:
                MAX_WAIT_SECONDS = max(1, int(data["max_wait_seconds"]))
            except Exception:
                pass
        if "username" in data:
            try:
                USERNAME = str(data["username"])
            except Exception:
                pass
        if "password" in data:
            try:
                PASSWORD = str(data["password"])
            except Exception:
                pass
        if "user_begin_marker" in data:
            try:
                USER_BEGIN_MARKER = str(data["user_begin_marker"])
            except Exception:
                pass
        if "user_end_marker" in data:
            try:
                USER_END_MARKER = str(data["user_end_marker"])
            except Exception:
                pass
    return jsonify({"status": "updated", "config": current_config()})

@app.route("/export_md", methods=["POST"])
def export_md_endpoint():
    export_md()
    if LATEST_MD_CONTENT:
        return jsonify({"status": "done", "size": len(LATEST_MD_CONTENT)})
    return jsonify({"status": "pending"}), 202

@app.route("/md", methods=["GET"])
def md_endpoint():
    return jsonify({"content": LATEST_MD_CONTENT})

@app.route("/capture_chat", methods=["POST"])
def capture_chat_endpoint():
    global LATEST_CHAT_CONTENT, LAST_DELTA
    text = capture_full_chat()
    delta = compute_delta(LATEST_CHAT_CONTENT, text)
    LATEST_CHAT_CONTENT = text
    LAST_DELTA = delta
    return jsonify({"status": "done", "delta_len": len(delta)})

@app.route("/chat", methods=["GET"])
def chat_endpoint():
    msgs = parse_chat(LATEST_CHAT_CONTENT or "")
    return jsonify({"raw": LATEST_CHAT_CONTENT or "", "delta": LAST_DELTA or "", "messages": msgs})

def is_authed():
    return session.get("auth") is True

@app.route("/login", methods=["GET", "POST"])
def login_endpoint():
    if request.method == "GET":
        return """
        <html><body>
        <form method='post'>
        <input name='username' placeholder='username'/>
        <input name='password' type='password' placeholder='password'/>
        <button type='submit'>Login</button>
        </form>
        </body></html>
        """
    u = request.form.get("username", "")
    p = request.form.get("password", "")
    if u == USERNAME and p == PASSWORD:
        session.permanent = True
        session["auth"] = True
        return redirect("/ui")
    return "Unauthorized", 401

@app.route("/logout", methods=["GET"])
def logout_endpoint():
    session.clear()
    return redirect("/login")

@app.route("/ui", methods=["GET"])
def ui_endpoint():
    if not is_authed():
        return redirect("/login")
    return """
    <html>
    <head>
    <meta charset='utf-8'/>
    </head>
    <body>
    <h3>Antigravity Controller</h3>
    <div>
    <textarea id='prompt' placeholder='prompt' rows='5' cols='60'></textarea>
    <button onclick='sendPrompt()'>Send</button>
    <button onclick='captureChat()'>Capture Chat</button>
    <button onclick='refresh()'>Refresh</button>
    <a href='/logout'>Logout</a>
    </div>
    <pre id='status'></pre>
    <h4>Latest Response</h4>
    <pre id='resp'></pre>
    <h4>Chat (parsed)</h4>
    <div id='chat'></div>
    <script>
    async function sendPrompt(){
      const p = document.getElementById('prompt').value;
      await fetch('/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p})});
    }
    async function captureChat(){
      await fetch('/capture_chat',{method:'POST'});
      await new Promise(r=>setTimeout(r,500));
      refresh();
    }
    async function refresh(){
      const s = await fetch('/status'); const sj = await s.json();
      document.getElementById('status').textContent = JSON.stringify(sj,null,2);
      const l = await fetch('/latest'); const lj = await l.json();
      document.getElementById('resp').textContent = lj.response||'';
      const c = await fetch('/chat'); const cj = await c.json();
      const chatDiv = document.getElementById('chat');
      chatDiv.innerHTML = '';
      (cj.messages||[]).forEach(msg=>{
        const el = document.createElement('pre');
        el.textContent = (msg.type.toUpperCase()+': ')+msg.text;
        chatDiv.appendChild(el);
      });
    }
    document.getElementById('prompt').addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        const ta = document.getElementById('prompt');
        const start = ta.selectionStart, end = ta.selectionEnd;
        ta.value = ta.value.substring(0, start) + "\\n" + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 1;
      }
    });
    refresh();
    </script>
    </body></html>
    """

if __name__ == "__main__":
    print("----------------------------------------------------------------")
    print(f"Antigravity Daemon started on port 5000.")
    print(f"Username: {USERNAME}")
    print(f"Password: {PASSWORD}")
    print("----------------------------------------------------------------")
    
    # Try to start pyngrok if installed
    try:
        from pyngrok import ngrok, conf
        # Check if auth token is needed or if we can run anonymously (often requires sign up now)
        # We'll just try to connect.
        print("Attempting to start ngrok tunnel...")
        # conf.get_default().region = "eu"  # Optional
        public_url = ngrok.connect(5000).public_url
        print(f" -> Ngrok Tunnel Active: {public_url}")
        print(" -> Use this URL in your Vercel frontend as 'Backend Address'.")
    except ImportError:
        print("(!) pyngrok not installed. To access from outside, install it:")
        print("    pip install pyngrok")
        print("    Then re-run this script.")
        print("    OR manually run: ngrok http 5000")
    except Exception as e:
        print(f"(!) Ngrok failed to start: {e}")

    print("----------------------------------------------------------------")
    app.run(host="0.0.0.0", port=5000)
