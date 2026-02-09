import json
import os
from pathlib import Path
import secrets
import hashlib

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
CONFIG_PATH = DATA_DIR / "config.json"

def _pbkdf2(password: str, salt: bytes) -> str:
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return dk.hex()

def ensure_config() -> dict:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if CONFIG_PATH.exists():
        with CONFIG_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    salt = secrets.token_bytes(16)
    password_hash = _pbkdf2("acom", salt)
    cfg = {
        "password_salt": salt.hex(),
        "password_hash": password_hash,
        "pin_salt": None,
        "pin_hash": None,
        "port": 8443,
        "device_pin_salt": None,
        "device_pin_hash": None,
        "admin_secret": secrets.token_hex(32),
        "port": 8443
    }
    with CONFIG_PATH.open("w", encoding="utf-8") as f:
        json.dump(cfg, f)
    return cfg

def save_password(new_password: str):
    cfg = ensure_config()
    salt = secrets.token_bytes(16)
    cfg["password_salt"] = salt.hex()
    cfg["password_hash"] = _pbkdf2(new_password, salt)

def save_device_pin(pin: str):
    cfg = ensure_config()
    if not pin:
        cfg["device_pin_salt"] = None
        cfg["device_pin_hash"] = None
    else:
        salt = secrets.token_bytes(16)
        cfg["device_pin_salt"] = salt.hex()
        cfg["device_pin_hash"] = _pbkdf2(pin, salt)
    with CONFIG_PATH.open("w", encoding="utf-8") as f:
        json.dump(cfg, f)

def save_pin(new_pin: str):
    cfg = ensure_config()
    if not new_pin:
        cfg["pin_salt"] = None
        cfg["pin_hash"] = None
    else:
        salt = secrets.token_bytes(16)
        cfg["pin_salt"] = salt.hex()
        cfg["pin_hash"] = _pbkdf2(new_pin, salt)
    with CONFIG_PATH.open("w", encoding="utf-8") as f:
        json.dump(cfg, f)
