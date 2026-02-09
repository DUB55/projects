import socket
from datetime import datetime, timedelta
from typing import Optional
from itsdangerous import TimestampSigner, BadSignature, SignatureExpired
from .config import ensure_config, _pbkdf2
import hashlib

def verify_password(password: str) -> bool:
    cfg = ensure_config()
    salt = bytes.fromhex(cfg["password_salt"])
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000).hex()
    return dk == cfg["password_hash"]

def get_signer() -> TimestampSigner:
    cfg = ensure_config()
    return TimestampSigner(cfg["cookie_secret"])

def create_session_cookie(max_age_days: int = 90) -> str:
    signer = get_signer()
    token = signer.sign("session").decode()
    return token

def verify_session(token: str) -> bool:
    signer = get_signer()
    try:
        signer.unsign(token, max_age=90*24*3600)
        return True
    except SignatureExpired:
        return False
    except BadSignature:
        return False

def verify_admin(secret: Optional[str]) -> bool:
    if not secret:
        return False
    cfg = ensure_config()
    return secret == cfg["admin_secret"]

def verify_pin(pin: str) -> bool:
    cfg = ensure_config()
    salt_hex = cfg.get("device_pin_salt")
    pin_hash = cfg.get("device_pin_hash")
    if not salt_hex or not pin_hash:
        return False
    salt = bytes.fromhex(salt_hex)
    return _pbkdf2(pin, salt) == pin_hash

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return socket.gethostbyname(socket.gethostname())
