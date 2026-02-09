#!/usr/bin/env python3
"""
Simple Browser Test - No QML

This is a minimal browser without QML to test if the GUI can open at all.
If this works, the issue is with QML. If this doesn't work, the issue is systemic.

Run with: python test_simple_browser.py
"""

import sys
from PySide6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget, QToolBar, QLineEdit, QPushButton
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtCore import QUrl

class SimpleBrowser(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Simple Browser Test")
        self.setGeometry(100, 100, 1280, 800)
        
        # Central widget
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        
        # Toolbar
        toolbar = QToolBar()
        layout.addWidget(toolbar)
        
        # Back button
        back_btn = QPushButton("← Back")
        back_btn.clicked.connect(lambda: self.web_view.back())
        toolbar.addWidget(back_btn)
        
        # Forward button
        fwd_btn = QPushButton("→ Forward")
        fwd_btn.clicked.connect(lambda: self.web_view.forward())
        toolbar.addWidget(fwd_btn)
        
        # Refresh button
        refresh_btn = QPushButton("⟳ Refresh")
        refresh_btn.clicked.connect(lambda: self.web_view.reload())
        toolbar.addWidget(refresh_btn)
        
        # Address bar
        self.address_bar = QLineEdit()
        self.address_bar.setText("https://example.com")
        self.address_bar.returnPressed.connect(self.navigate)
        toolbar.addWidget(self.address_bar)
        
        # Web view
        self.web_view = QWebEngineView()
        self.web_view.setUrl(QUrl("https://example.com"))
        layout.addWidget(self.web_view)
        
        print("[OK] Simple browser window created")
    
    def navigate(self):
        url = self.address_bar.text()
        if not url.startswith('http'):
            url = 'https://' + url
        self.web_view.setUrl(QUrl(url))

if __name__ == '__main__':
    app = QApplication(sys.argv)
    browser = SimpleBrowser()
    browser.show()
    print("[OK] Window should now be visible")
    sys.exit(app.exec())
