from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import secrets

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI()
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

rooms = {}

@app.get("/")
def index(request: Request):
    html_path = BASE_DIR / "index.html"
    content = html_path.read_text(encoding="utf-8")
    return HTMLResponse(content)

@app.post("/api/create")
def create_room():
    while True:
        code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        if code not in rooms:
            rooms[code] = {"host": None, "guest": None}
            return {"code": code}

@app.websocket("/ws/{code}")
async def ws_room(websocket: WebSocket, code: str, role: str):
    await websocket.accept()
    room = rooms.get(code)
    if not room:
        await websocket.close()
        return
    if role == "host":
        room["host"] = websocket
    elif role == "guest":
        room["guest"] = websocket
    try:
        while True:
            data = await websocket.receive_json()
            target = None
            if role == "host":
                target = room.get("guest")
            else:
                target = room.get("host")
            if target:
                await target.send_json(data)
    except WebSocketDisconnect:
        if role == "host":
            room["host"] = None
        else:
            room["guest"] = None
        if not room["host"] and not room["guest"]:
            rooms.pop(code, None)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("option-website-only.signaling_server:app", host="0.0.0.0", port=8090, log_level="info")
