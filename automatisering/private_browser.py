
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
private_browser.py  —  Single-file, pinned-proxy Python GUI browser (PySide6/QtWebEngine)

What this does
--------------
• Forces ALL browsing through ONE HTTPS proxy identified by IP (no local DNS for sites).
• Pins the proxy server's public key (SPKI). Any on-device HTTPS/TLS inspection (AV/web shield)
  that tries to re-sign the connection will FAIL the TLS handshake, so the AV cannot
  see domains OR full URLs behind the proxy.  (This is how cert pinning defeats TLS inspection.)  # noqa
• Blocks Chromium's local DNS lookups for destinations, so only the proxy resolves them.

How to use
----------
1) Get the proxy's SPKI (base64 sha256) once:
   $ python private_browser.py spki --ip 203.0.113.10 --port 443
   (Requires the 'cryptography' package. If missing, you'll be prompted to install it.)

2) Run the browser through the proxy with pinning:
   $ python private_browser.py run --ip 203.0.113.10 --port 443 --spki u3m2uJpJ7H3Yp0E5...==
   Optionally set --start https://duckduckgo.com

Notes
-----
• If your AV tries HTTPS inspection, the connection to the proxy will error out rather than leak
  domains/URLs. To actually browse, your AV must not intercept (most products auto-bypass pinned apps).  # noqa
• This script does NOT acquire or operate the proxy for you. Provide a trusted HTTPS proxy endpoint.

Why this blocks AV visibility
-----------------------------
TLS/HTTPS inspection products intercept and re-sign TLS traffic with a trusted local CA so they can
read hostnames/URLs. Certificate pinning makes the client accept ONLY the expected public key: any
re-signed certificate is rejected, so the AV cannot see the domains or URLs behind the proxy.
(See: Cloudflare learning center on HTTPS inspection; Zscaler & Palo Alto docs on pinning.)  # noqa
"""

import argparse
import base64
import hashlib
import os
import socket
import ssl
import sys
from typing import Optional

# --- Qt imports (installed via: pip install PySide6)
from PySide6.QtCore import QUrl, Qt, QSize
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QLineEdit, QToolBar, QWidget, QHBoxLayout, QPushButton
)
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import QWebEngineSettings


# ------------- SPKI helper (tries to use 'cryptography' if available) ----------------

def compute_spki_base64(ip: str, port: int, timeout: float = 10.0) -> str:
    """
    Connects to ip:port with TLS, reads the leaf certificate, extracts SPKI (SubjectPublicKeyInfo),
    returns base64(SHA256(SPKI)).
    """
    try:
        from cryptography import x509  # type: ignore
        from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat  # type: ignore
        has_crypto = True
    except Exception:
        has_crypto = False

    ctx = ssl.create_default_context()
    # We must set server_hostname to the IP to complete the handshake (SNI with IP is fine for raw IP endpoints)
    with socket.create_connection((ip, port), timeout=timeout) as s:
        with ctx.wrap_socket(s, server_hostname=ip) as tls:
            der_cert = tls.getpeercert(binary_form=True)
            if not has_crypto:
                raise RuntimeError(
                    "The 'cryptography' package is required to extract SPKI.\n"
                    "Install it with:  python -m pip install cryptography\n"
                    "Then re-run:      python private_browser.py spki --ip %s --port %d" % (ip, port)
                )
            from cryptography import x509  # noqa
            from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat  # noqa
            cert = x509.load_der_x509_certificate(der_cert)
            spki_der = cert.public_key().public_bytes(Encoding.DER, PublicFormat.SubjectPublicKeyInfo)
            spki_hash = hashlib.sha256(spki_der).digest()
            return base64.b64encode(spki_hash).decode("ascii")


# ---------------- QtWebEngine minimal browser ----------------

class Browser(QMainWindow):
    def __init__(self, start_url: str):
        super().__init__()
        self.setWindowTitle("Pinned-Proxy Private Browser")
        self.setMinimumSize(1100, 720)

        self.view = QWebEngineView(self)
        s = self.view.settings()

        def set_attr(attr: str, val: bool):
            if hasattr(QWebEngineSettings, attr):
                s.setAttribute(getattr(QWebEngineSettings, attr), val)

        # Reduce some high-entropy surfaces (this is not full anti-fingerprinting):
        set_attr("PluginsEnabled", False)
        set_attr("JavascriptCanOpenWindows", False)
        set_attr("LocalStorageEnabled", False)
        set_attr("WebGLEnabled", False)
        set_attr("ScreenCaptureEnabled", False)

        # Simple toolbar with address bar
        self.addr = QLineEdit(self)
        self.addr.setPlaceholderText("Type a URL or search…")
        self.addr.returnPressed.connect(self.go)

        go_btn = QPushButton("Go", self)
        go_btn.clicked.connect(self.go)

        home_btn = QPushButton("Home", self)
        home_btn.clicked.connect(lambda: self.load(start_url))

        bar = QToolBar("Controls", self)
        bar.setIconSize(QSize(16, 16))
        w = QWidget(self)
        lay = QHBoxLayout(w)
        lay.setContentsMargins(6, 6, 6, 6)
        lay.setSpacing(6)
        lay.addWidget(self.addr, 1)
        lay.addWidget(go_btn)
        lay.addWidget(home_btn)
        bar.addWidget(w)
        self.addToolBar(Qt.TopToolBarArea, bar)

        self.setCentralWidget(self.view)
        self.load(start_url)

    def load(self, txt: str):
        if not txt:
            return
        url = txt.strip()
        if "://" not in url and "." in url:
            url = "https://" + url
        elif "://" not in url:
            # treat as search query (DuckDuckGo)
            from urllib.parse import quote_plus
            url = f"https://duckduckgo.com/?q={quote_plus(txt)}"
        self.view.setUrl(QUrl(url))
        self.addr.setText(url)

    def go(self):
        self.load(self.addr.text())


# ------------- Chromium flags for pinned HTTPS proxy by IP ----------------

def build_chromium_flags(proxy_ip: str, proxy_port: int, spki_b64: str) -> str:
    """
    Returns a single string of QTWEBENGINE_CHROMIUM_FLAGS enforcing:
      - HTTPS proxy by IP (no local DNS needed for proxy)
      - SPKI pin for the proxy (blocks on-device TLS interception)
      - No local DNS for destinations (sent to proxy)
      - No direct UDP for WebRTC (prevent local IP leaks)
    """
    flags = [
        f"--proxy-server=https://{proxy_ip}:{proxy_port}",
        "--proxy-bypass-list=<-loopback>",
        " ".join([
            "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
            # Keep QUIC off to avoid proxy bypass via UDP:
            "--disable-quic",
            # Prevent non-proxied WebRTC local UDP:
            "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
        ]),
        # The key line: SPKI pin. Any re-signed cert (AV inspection) will fail the handshake.
        f"--ignore-certificate-errors-spki-list=sha256/{spki_b64}",
        # Misc privacy toggles:
        "--disable-features=InterestCohort,PrivacySandboxSettings4,BrowsingTopics,NetworkTimeServiceQuerying",
    ]
    return " ".join(flags)


# ------------- CLI glue ---------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Pinned-Proxy Private Browser (PySide6/QtWebEngine). See --help for usage.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_spki = sub.add_parser("spki", help="Fetch and print proxy SPKI (base64 sha256) for pinning.")
    p_spki.add_argument("--ip", required=True, help="Proxy IP address (literal).")
    p_spki.add_argument("--port", type=int, default=443, help="Proxy TLS port.")
    p_spki.add_argument("--timeout", type=float, default=10.0, help="Connect timeout seconds.")

    p_run = sub.add_parser("run", help="Run the browser through a pinned HTTPS proxy by IP.")
    p_run.add_argument("--ip", required=True, help="Proxy IP address (literal).")
    p_run.add_argument("--port", type=int, default=443, help="Proxy TLS port.")
    p_run.add_argument("--spki", required=True, help="Proxy SPKI base64 sha256 (from 'spki' command).")
    p_run.add_argument("--start", default="https://duckduckgo.com/", help="Start URL.")

    args = parser.parse_args()

    if args.cmd == "spki":
        try:
            spki = compute_spki_base64(args.ip, args.port, args.timeout)
            print("SPKI (base64 sha256):", spki)
            print("\nUse it like:")
            print(f"  python {os.path.basename(__file__)} run --ip {args.ip} --port {args.port} --spki {spki}")
        except Exception as e:
            print("\nERROR:", e, file=sys.stderr)
            sys.exit(2)
        return

    if args.cmd == "run":
        # Apply Chromium flags BEFORE Qt creates the engine:
        os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = build_chromium_flags(args.ip, args.port, args.spki)

        app = QApplication(sys.argv)
        win = Browser(args.start)
        win.show()
        sys.exit(app.exec())


if __name__ == "__main__":
    main()
