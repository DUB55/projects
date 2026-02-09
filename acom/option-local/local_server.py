from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path
import tempfile
import zipfile

BASE_DIR = Path(__file__).resolve().parents[1]
APP_DIR = Path(__file__).resolve().parent

app = FastAPI()
templates = Jinja2Templates(directory=str(APP_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")


@app.get("/")
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "project_name": "ACOM"})


@app.get("/download")
def download_acom():
    acom_root = BASE_DIR
    tmpdir = Path(tempfile.gettempdir())
    zname = "acom_project.zip"
    zpath = tmpdir / zname
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in acom_root.rglob("*"):
            if "option-local" in p.parts or "option-website-only" in p.parts:
                continue
            if p.is_file():
                zf.write(p, arcname=str(p.relative_to(acom_root)))

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


if __name__ == "__main__":
    import uvicorn
    print("Local Option Server running at http://127.0.0.1:8080/")
    uvicorn.run("option-local.local_server:app", host="127.0.0.1", port=8080, log_level="info")
