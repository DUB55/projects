
# find_https_proxy_fast2.py
# Usage:
#   python find_https_proxy_fast2.py
#
# If it prints a working proxy + SPKI, launch your pinned browser:
#   python private_browser.py run --ip <IP> --port <PORT> --spki <SPKI>

import asyncio, ssl, socket, base64, hashlib, json, random
from typing import List, Tuple, Optional, Set
import aiohttp
from cryptography import x509
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

SOURCES = [
    # Proxifly free proxy JSON (updates ~every 5 min)
    "https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/all/data.json",
    # RedScrape free proxy JSON API
    "https://free.redscrape.com/api/proxies?protocol=https&format=json",
    # Add more JSON feeds here if you have them
]

COMMON_TLS_PORTS = [443, 8443, 9443, 5443, 10443, 4433, 6001, 7443]
MAX_CANDIDATES = 3000
CONCURRENCY     = 250
TIMEOUT_S       = 5.5
CONNECT_REQ     = b"CONNECT example.com:443 HTTP/1.1\r\nHost: example.com:443\r\n\r\n"

def spki_b64_from_der(der_cert: bytes) -> str:
    cert = x509.load_der_x509_certificate(der_cert)
    spki_der = cert.public_key().public_bytes(Encoding.DER, PublicFormat.SubjectPublicKeyInfo)
    h = hashlib.sha256(spki_der).digest()
    return base64.b64encode(h).decode()

async def fetch_json(session: aiohttp.ClientSession, url: str):
    try:
        async with session.get(url, timeout=8) as r:
            if r.status != 200: return None
            if "json" not in (r.headers.get("content-type","")): return None
            return await r.json()
    except: return None

async def gather_candidates() -> List[Tuple[str,int]]:
    seen: Set[Tuple[str,int]] = set(); out: List[Tuple[str,int]] = []
    async with aiohttp.ClientSession() as session:
        rs = await asyncio.gather(*[fetch_json(session,u) for u in SOURCES])

    for data in rs:
        if not data: continue
        # Proxifly schema
        if isinstance(data, dict) and "proxies" in data:
            for p in data["proxies"]:
                ip = p.get("ip"); port = p.get("port"); proto = (p.get("protocol") or "").lower()
                if not ip or not port: continue
                base = [int(port)]
                if proto == "https":
                    # also try common TLS listener ports for this IP
                    base += [q for q in COMMON_TLS_PORTS if q != int(port)]
                for prt in base:
                    t = (ip, prt)
                    if t in seen: continue
                    seen.add(t); out.append(t)
        # RedScrape often returns a list
        elif isinstance(data, list):
            for p in data:
                ip = p.get("ip"); port = p.get("port")
                if not ip or not port: continue
                base = [int(port)]
                if int(port) not in COMMON_TLS_PORTS:
                    base += COMMON_TLS_PORTS
                for prt in base:
                    t = (ip, prt)
                    if t in seen: continue
                    seen.add(t); out.append(t)

    random.shuffle(out)
    return out[:MAX_CANDIDATES]

async def probe_one(ip: str, port: int) -> Optional[Tuple[str,int,str]]:
    loop = asyncio.get_running_loop()
    # Resolve + connect
    try:
        infos = await asyncio.wait_for(loop.getaddrinfo(ip, port, type=socket.SOCK_STREAM), timeout=TIMEOUT_S)
        family, socktype, proto, _, addr = infos[0]
        s = socket.socket(family, socktype, proto); s.settimeout(TIMEOUT_S)
        await loop.sock_connect(s, addr)
    except:
        return None
    # TLS to proxy endpoint
    try:
        ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
        tls = ctx.wrap_socket(s, server_hostname=ip, do_handshake_on_connect=False); tls.settimeout(TIMEOUT_S); tls.do_handshake()
        der_cert = tls.getpeercert(True)
    except:
        try: s.close()
        except: pass
        return None
    # CONNECT test
    try:
        tls.sendall(CONNECT_REQ)
        resp = tls.recv(4096)
        ok = (b" 200 " in resp) or (b"connection established" in resp.lower())
        if not ok:
            tls.close(); return None
        spki = spki_b64_from_der(der_cert)
        tls.close()
        return (ip, port, spki)
    except:
        try: tls.close()
        except: pass
        return None

async def main():
    print("Collecting candidates...")
    cands = await gather_candidates()
    print(f"Got {len(cands)} candidates; probing for real HTTPS proxies...\n")

    sem = asyncio.Semaphore(CONCURRENCY)
    found = None

    async def worker(ip, port):
        nonlocal found
        if found: return
        async with sem:
            res = await probe_one(ip, port)
            if res and not found:
                found = res

    await asyncio.gather(*[worker(ip,port) for ip,port in cands], return_exceptions=True)

    if found:
        ip, port, spki = found
        print("FOUND HTTPS PROXY:", ip, port)
        print("SPKI:", spki)
        print("\nLaunch your pinned browser with:\n")
        print(f"  python private_browser.py run --ip {ip} --port {port} --spki {spki}\n")
    else:
        print("No working HTTPS proxies found right now. Try again in a few minutes.")

if __name__ == "__main__":
    asyncio.run(main())
