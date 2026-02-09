from fastapi import FastAPI, Request, Response, Depends, HTTPException, status, Form
from fastapi.responses import JSONResponse, RedirectResponse, PlainTextResponse, StreamingResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.templating import Jinja2Templates
from pathlib import Path
from typing import Optional
from datetime import datetime
import mimetypes
import os
from .storage import Store
from .auth import verify_password, create_session_cookie, verify_session, verify_admin, get_local_ip, verify_pin
from .config import ensure_config, save_device_pin
import markdown as md

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=512)

BASE_DIR = Path(__file__).resolve().parents[1]
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

store = Store()
cfg = ensure_config()

def require_session(request: Request):
    token = request.cookies.get("session")
    if not token or not verify_session(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

def admin_or_session(request: Request, secret: str | None) -> bool:
    if secret and verify_admin(secret):
        return True
    try:
        require_session(request)
        return True
    except HTTPException:
        return False

@app.get("/login")
def login_page(request: Request):
    cfg_local = ensure_config()
    has_pin = bool(cfg_local.get("device_pin_hash"))
    return templates.TemplateResponse("login.html", {"request": request, "has_pin": has_pin})

@app.post("/login")
async def login_post(request: Request, password: str = Form(...)):
    if not verify_password(password):
        return templates.TemplateResponse("login.html", {"request": request, "error": "Incorrect password"}, status_code=400)
    token = create_session_cookie()
    secure = request.url.scheme == "https"
    resp = RedirectResponse(url="/", status_code=302)
    resp.set_cookie("session", token, httponly=True, secure=secure, samesite="lax", max_age=90*24*3600)
    return resp

@app.post("/quick_unlock")
async def quick_unlock(request: Request, pin: str = Form(...)):
    if not verify_pin(pin):
        return templates.TemplateResponse("login.html", {"request": request, "error": "Incorrect PIN"}, status_code=400)
    token = create_session_cookie()
    secure = request.url.scheme == "https"
    resp = RedirectResponse(url="/", status_code=302)
    resp.set_cookie("session", token, httponly=True, secure=secure, samesite="lax", max_age=90*24*3600)
    return resp

@app.get("/set_pin")
def set_pin_page(request: Request):
    try:
        require_session(request)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse("set_pin.html", {"request": request})

@app.post("/set_pin")
async def set_pin_post(request: Request, pin: str = Form(...)):
    try:
        require_session(request)
    except HTTPException:
        return RedirectResponse(url="/login")
    save_device_pin(pin)
    return RedirectResponse(url="/", status_code=302)

@app.get("/")
def dashboard(request: Request):
    try:
        require_session(request)
    except HTTPException:
        return RedirectResponse(url="/login")
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/status")
def status_info(request: Request):
    ip = get_local_ip()
    cfg_local = ensure_config()
    has_pin = bool(cfg_local.get("device_pin_hash"))
    return {"ip": ip, "port": cfg["port"], "scheme": request.url.scheme, "has_pin": has_pin}

@app.get("/api/texts")
def list_texts(request: Request):
    require_session(request)
    items = store.list_texts()
    return [{
        "id": i.id,
        "name": i.name,
        "tags": i.tags,
        "created_at": i.created_at.isoformat(),
        "expires_at": i.expires_at.isoformat(),
        "size": len(i.content or "")
    } for i in items]

@app.get("/api/texts/{text_id}")
def get_text(request: Request, text_id: str):
    require_session(request)
    item = store.get_text(text_id)
    if not item:
        raise HTTPException(status_code=404)
    return PlainTextResponse(item.content)

@app.post("/api/texts")
async def add_text(request: Request):
    secret = request.headers.get("X-Admin-Secret")
    if not admin_or_session(request, secret):
        raise HTTPException(status_code=401)
    data = await request.json()
    name = data.get("name")
    content = data.get("content")
    ttl = int(data.get("ttl_minutes", 10))
    tags = data.get("tags") or []
    item = store.add_text(name=name, content=content, ttl_minutes=ttl, tags=tags)
    return {"id": item.id}

@app.get("/api/roots")
def list_roots(request: Request):
    require_session(request)
    items = store.list_roots()
    return [{"id": i.id, "base_path": i.base_path, "is_file": i.is_file, "tags": i.tags, "created_at": i.created_at.isoformat(), "expires_at": i.expires_at.isoformat()} for i in items]

def _safe_join(base: str, rel: str) -> Path:
    base_path = Path(base).resolve()
    target = (base_path / rel).resolve()
    if base_path not in target.parents and target != base_path:
        raise HTTPException(status_code=400)
    return target

@app.get("/api/roots/{root_id}/tree")
def tree(request: Request, root_id: str, path: Optional[str] = None, sort: Optional[str] = "name", order: Optional[str] = "asc"):
    require_session(request)
    root = store.get_root(root_id)
    if not root:
        raise HTTPException(status_code=404)
    base = Path(root.base_path).resolve()
    rel = Path(path) if path else Path(".")
    if root.is_file:
        if rel.as_posix() not in [".", base.name]:
            raise HTTPException(status_code=404)
        entries = [{
            "name": base.name,
            "is_dir": False,
            "path": base.name
        }]
        return {"current": ".", "entries": entries}
    target = _safe_join(str(base), str(rel))
    if not target.exists() or not target.is_dir():
        raise HTTPException(status_code=404)
    entries = []
    children = list(target.iterdir())
    if sort == "name":
        children.sort(key=lambda p: p.name.lower(), reverse=(order=="desc"))
    elif sort == "type":
        children.sort(key=lambda p: (not p.is_dir(), p.name.lower()), reverse=(order=="desc"))
    elif sort == "size":
        try:
            children.sort(key=lambda p: (0 if p.is_dir() else p.stat().st_size), reverse=(order=="desc"))
        except Exception:
            children.sort(key=lambda p: p.name.lower())
    elif sort == "time":
        try:
            children.sort(key=lambda p: p.stat().st_mtime, reverse=(order=="desc"))
        except Exception:
            children.sort(key=lambda p: p.name.lower())
    for child in children:
        entries.append({
            "name": child.name,
            "is_dir": child.is_dir(),
            "path": str(rel / child.name).replace("\\", "/")
        })
    return {"current": str(rel).replace("\\", "/"), "entries": entries}

@app.get("/api/roots/{root_id}/file")
def read_file(request: Request, root_id: str, path: str):
    require_session(request)
    root = store.get_root(root_id)
    if not root:
        raise HTTPException(status_code=404)
    base = Path(root.base_path).resolve()
    if root.is_file:
        target = base
    else:
        target = _safe_join(str(base), path)
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404)
    mime, _ = mimetypes.guess_type(target.name)
    download = request.query_params.get("download")
    if mime and mime.startswith("text/"):
        if download:
            headers = {
                "Content-Disposition": f'attachment; filename="{target.name}"'
            }
            try:
                content = target.read_text(encoding="utf-8", errors="replace")
                return Response(content, media_type="text/plain", headers=headers)
            except Exception:
                def iter_bytes_dl():
                    try:
                        with target.open("rb") as f:
                            while True:
                                chunk = f.read(1024 * 64)
                                if not chunk:
                                    break
                                yield chunk
                    except Exception:
                        return
                return StreamingResponse(iter_bytes_dl(), media_type=mime or "application/octet-stream", headers=headers)
        
        # Determine media type for inline viewing
        media_type = mime
        if mime == "text/html":
            pass # Keep text/html
        elif mime == "text/plain" or mime.endswith("json") or mime.endswith("xml"):
            media_type = "text/plain" # Force plain for code/config to avoid execution if any
        else:
            # For other text types (code), default to text/plain to see source
            media_type = "text/plain"
            
        # Exception: if it is html, we want to serve it as html so iframe can render it
        if mime == "text/html":
            media_type = "text/html"
        try:
            content = target.read_text(encoding="utf-8", errors="replace")
            return Response(content, media_type=media_type)
        except Exception:
            # Fallback to binary streaming as attachment if text read fails (permissions/encoding)
            headers = {"Content-Disposition": f'attachment; filename="{target.name}"'}
            def iter_bytes_fallback():
                try:
                    with target.open("rb") as f:
                        while True:
                            chunk = f.read(1024 * 64)
                            if not chunk:
                                break
                            yield chunk
                except Exception:
                    return
            return StreamingResponse(iter_bytes_fallback(), media_type=mime or "application/octet-stream", headers=headers)
    def iter_bytes():
        try:
            with target.open("rb") as f:
                while True:
                    chunk = f.read(1024 * 64)
                    if not chunk:
                        break
                    yield chunk
        except Exception:
            return
    headers = {}
    if download or not (mime and mime.startswith("text/")):
        headers["Content-Disposition"] = f'attachment; filename="{target.name}"'
    return StreamingResponse(iter_bytes(), media_type=mime or "application/octet-stream", headers=headers)

@app.post("/api/roots")
async def add_root(request: Request):
    secret = request.headers.get("X-Admin-Secret")
    if not admin_or_session(request, secret):
        raise HTTPException(status_code=401)
    data = await request.json()
    base_path = (data.get("base_path") or "").strip().strip('"')
    ttl = int(data.get("ttl_minutes", 10))
    tags = data.get("tags") or []
    item = store.add_root(base_path=base_path, ttl_minutes=ttl, tags=tags)
    return {"id": item.id}

@app.post("/api/texts/{text_id}/extend")
async def extend_text(request: Request, text_id: str):
    secret = request.headers.get("X-Admin-Secret")
    if not admin_or_session(request, secret):
        raise HTTPException(status_code=401)
    data = await request.json()
    minutes = int(data.get("minutes", 10))
    ok = store.extend_text(text_id, minutes)
    if not ok:
        raise HTTPException(status_code=404)
    return {"ok": True}

@app.post("/api/roots/{root_id}/extend")
async def extend_root(request: Request, root_id: str):
    secret = request.headers.get("X-Admin-Secret")
    if not admin_or_session(request, secret):
        raise HTTPException(status_code=401)
    data = await request.json()
    minutes = int(data.get("minutes", 10))
    ok = store.extend_root(root_id, minutes)
    if not ok:
        raise HTTPException(status_code=404)
    return {"ok": True}

@app.delete("/api/texts/{text_id}")
async def purge_text(request: Request, text_id: str):
    secret = request.headers.get("X-Admin-Secret")
    if not admin_or_session(request, secret):
        raise HTTPException(status_code=401)
    ok = store.purge_text(text_id)
    if not ok:
        raise HTTPException(status_code=404)
    return {"ok": True}

@app.delete("/api/roots/{root_id}")
async def purge_root(request: Request, root_id: str):
    secret = request.headers.get("X-Admin-Secret")
    if not admin_or_session(request, secret):
        raise HTTPException(status_code=401)
    ok = store.purge_root(root_id)
    if not ok:
        raise HTTPException(status_code=404)
    return {"ok": True}

@app.get("/api/roots/{root_id}/zip")
def zip_path(request: Request, root_id: str, path: Optional[str] = None):
    require_session(request)
    import tempfile, zipfile
    root = store.get_root(root_id)
    if not root:
        raise HTTPException(status_code=404)
    base = Path(root.base_path).resolve()
    rel = Path(path) if path else Path(".")
    target = _safe_join(str(base), str(rel))
    if not target.exists():
        raise HTTPException(status_code=404)
    tmpdir = Path(tempfile.gettempdir())
    zname = f"acom_{target.name}.zip"
    zpath = tmpdir / zname
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as zf:
        if target.is_file():
            zf.write(target, arcname=target.name)
        else:
            for p in target.rglob("*"):
                if p.is_file():
                    zf.write(p, arcname=str(p.relative_to(target)))
    def iter_bytes():
        with zpath.open("rb") as f:
            while True:
                chunk = f.read(1024 * 64)
                if not chunk:
                    break
                yield chunk
        try:
            zpath.unlink()
        except Exception:
            pass
    headers = {"Content-Disposition": f'attachment; filename="{zname}"'}
    return StreamingResponse(iter_bytes(), media_type="application/zip", headers=headers)

@app.post("/api/render/markdown")
async def render_markdown(request: Request):
    require_session(request)
    data = await request.json()
    content = data.get("content", "")
    html = md.markdown(content, extensions=["extra", "sane_lists"])
    return HTMLResponse(html)
