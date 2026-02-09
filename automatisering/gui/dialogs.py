# gui/dialogs.py
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QTextEdit, QCheckBox, QMessageBox,
    QProgressDialog, QApplication, QLineEdit
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtGui import QPixmap, QFont

class CaptchaDialog(QDialog):
    """Dialoog voor CAPTCHA handling"""
    
    resolved = pyqtSignal()
    cancelled = pyqtSignal()
    
    def __init__(self, screenshot_path: str, parent=None):
        super().__init__(parent)
        self.screenshot_path = screenshot_path
        self.setup_ui()
        
    def setup_ui(self):
        """Stel de gebruikersinterface op"""
        self.setWindowTitle("CAPTCHA Gedetecteerd")
        self.setModal(True)
        self.setFixedSize(600, 500)
        
        layout = QVBoxLayout(self)
        
        # Titel
        title = QLabel("CAPTCHA Blokkade Gedetecteerd")
        title.setStyleSheet("font-size: 16px; font-weight: bold; color: #ff6600;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)
        
        # Instructies
        instructions = QLabel(
            "De website heeft een CAPTCHA of beveiligingscontrole getoond.\n"
            "Los deze handmatig op in de browser en klik daarna op 'Doorgaan'."
        )
        instructions.setWordWrap(True)
        instructions.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(instructions)
        
        # Screenshot
        self.lbl_screenshot = QLabel()
        self.lbl_screenshot.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.lbl_screenshot, 1)
        
        # Laad screenshot
        self.load_screenshot()
        
        # Knoppen
        button_layout = QHBoxLayout()
        
        self.btn_resolve = QPushButton("CAPTCHA Opgelost - Doorgaan")
        self.btn_resolve.setStyleSheet("background-color: #44aa44; color: white; padding: 10px;")
        self.btn_resolve.clicked.connect(self.on_resolve)
        
        self.btn_cancel = QPushButton("Run Stoppen")
        self.btn_cancel.setStyleSheet("background-color: #ff4444; color: white; padding: 10px;")
        self.btn_cancel.clicked.connect(self.on_cancel)
        
        button_layout.addWidget(self.btn_resolve)
        button_layout.addWidget(self.btn_cancel)
        
        layout.addLayout(button_layout)
        
    def load_screenshot(self):
        """Laad en toon screenshot"""
        pixmap = QPixmap(self.screenshot_path)
        if not pixmap.isNull():
            scaled_pixmap = pixmap.scaled(
                550, 300,
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation
            )
            self.lbl_screenshot.setPixmap(scaled_pixmap)
        else:
            self.lbl_screenshot.setText("Kon screenshot niet laden")
            
    def on_resolve(self):
        """Wanneer gebruiker CAPTCHA heeft opgelost"""
        self.resolved.emit()
        self.accept()
        
    def on_cancel(self):
        """Wanneer gebruiker run wil stoppen"""
        self.cancelled.emit()
        self.reject()

class ProgressDialog(QProgressDialog):
    """Aangepaste progress dialog"""
    
    def __init__(self, title: str, label_text: str, parent=None):
        super().__init__(label_text, "Annuleren", 0, 100, parent)
        self.setWindowTitle(title)
        self.setModal(True)
        self.setAutoClose(True)
        self.setAutoReset(True)
        
    def update_progress(self, value: int, text: str = ""):
        """Update progress en optioneel tekst"""
        self.setValue(value)
        if text:
            self.setLabelText(text)
            
class LoginDialog(QDialog):
    """Dialoog voor login credentials"""
    
    credentials_entered = pyqtSignal(str, str)
    
    def __init__(self, username: str = "", parent=None):
        super().__init__(parent)
        self.setup_ui()
        if username:
            self.txt_username.setText(username)
            
    def setup_ui(self):
        """Stel de gebruikersinterface op"""
        self.setWindowTitle("Login Credentials")
        self.setModal(True)
        self.setFixedSize(400, 250)
        
        layout = QVBoxLayout(self)
        
        # Titel
        title = QLabel("Login Gegevens")
        title.setStyleSheet("font-size: 14px; font-weight: bold;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)
        
        # Username
        layout.addWidget(QLabel("Username:"))
        self.txt_username = QLineEdit()
        self.txt_username.setPlaceholderText("student@example.com")
        layout.addWidget(self.txt_username)
        
        # Password
        layout.addWidget(QLabel("Password:"))
        self.txt_password = QLineEdit()
        self.txt_password.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.txt_password)
        
        # Onthouden checkbox
        self.chk_remember = QCheckBox("Onthoud credentials in Windows Credential Manager")
        layout.addWidget(self.chk_remember)
        
        # Knoppen
        button_layout = QHBoxLayout()
        
        self.btn_ok = QPushButton("OK")
        self.btn_ok.clicked.connect(self.on_ok)
        
        self.btn_cancel = QPushButton("Annuleren")
        self.btn_cancel.clicked.connect(self.reject)
        
        button_layout.addWidget(self.btn_ok)
        button_layout.addWidget(self.btn_cancel)
        
        layout.addLayout(button_layout)
        
        # Stel focus in
        self.txt_username.setFocus()
        
    def on_ok(self):
        """Wanneer OK wordt geklikt"""
        username = self.txt_username.text().strip()
        password = self.txt_password.text().strip()
        
        if not username or not password:
            QMessageBox.warning(self, "Waarschuwing", "Voer zowel username als password in")
            return
            
        self.credentials_entered.emit(username, password)
        self.accept()
        
    def get_credentials(self):
        """Haal ingevoerde credentials op"""
        return self.txt_username.text().strip(), self.txt_password.text().strip()
        
    def get_remember(self):
        """Haal 'onthouden' status op"""
        return self.chk_remember.isChecked()