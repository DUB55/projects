# gui/theme_manager.py
from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QPalette, QColor
from PyQt6.QtCore import Qt

class ThemeManager:
    """Beheert de visuele thema's van de applicatie"""
    
    DARK_STYLESHEET = """
    QMainWindow {
        background-color: #1e1e1e;
        color: #e0e0e0;
    }
    QWidget {
        background-color: #1e1e1e;
        color: #e0e0e0;
    }
    QGroupBox {
        font-weight: bold;
        border: 1px solid #333333;
        border-radius: 6px;
        margin-top: 12px;
        padding-top: 12px;
        color: #4a86e8;
    }
    QGroupBox::title {
        subcontrol-origin: margin;
        left: 10px;
        padding: 0 5px 0 5px;
    }
    QPushButton {
        background-color: #333333;
        color: #e0e0e0;
        border: 1px solid #444444;
        padding: 6px 12px;
        border-radius: 4px;
        font-weight: normal;
    }
    QPushButton:hover {
        background-color: #444444;
        border: 1px solid #555555;
    }
    QPushButton:pressed {
        background-color: #222222;
    }
    QPushButton:disabled {
        background-color: #2a2a2a;
        color: #666666;
        border: 1px solid #333333;
    }
    QPushButton#btn_start {
        background-color: #2d5a27;
        color: #ffffff;
        border: 1px solid #3e7b35;
    }
    QPushButton#btn_start:hover {
        background-color: #3e7b35;
    }
    QPushButton#btn_stop {
        background-color: #7b2d2d;
        color: #ffffff;
        border: 1px solid #a33c3c;
    }
    QPushButton#btn_stop:hover {
        background-color: #a33c3c;
    }
    QLineEdit, QSpinBox, QComboBox {
        padding: 6px;
        border: 1px solid #333333;
        border-radius: 4px;
        background-color: #252526;
        color: #e0e0e0;
    }
    QLineEdit:focus, QSpinBox:focus, QComboBox:focus {
        border: 1px solid #4a86e8;
    }
    QCheckBox {
        spacing: 8px;
        color: #e0e0e0;
    }
    QLabel {
        color: #e0e0e0;
    }
    QTextEdit {
        border: 1px solid #333333;
        border-radius: 4px;
        font-family: 'Consolas', 'Cascadia Code', monospace;
        font-size: 11px;
        background-color: #1e1e1e;
        color: #d4d4d4;
    }
    QTabWidget::pane {
        border: 1px solid #333333;
        top: -1px;
    }
    QTabBar::tab {
        background-color: #2d2d2d;
        color: #969696;
        padding: 8px 16px;
        border: 1px solid #333333;
        border-bottom: none;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        margin-right: 2px;
    }
    QTabBar::tab:selected {
        background-color: #1e1e1e;
        color: #ffffff;
        border-bottom: 2px solid #4a86e8;
    }
    QProgressBar {
        border: 1px solid #333333;
        border-radius: 4px;
        background-color: #252526;
        color: #ffffff;
        text-align: center;
    }
    QProgressBar::chunk {
        background-color: #4a86e8;
        width: 1px;
    }
    QTableWidget, QTreeView {
        background-color: #252526;
        color: #e0e0e0;
        border: 1px solid #333333;
        gridline-color: #333333;
    }
    QHeaderView::section {
        background-color: #2d2d2d;
        color: #e0e0e0;
        padding: 6px;
        border: 1px solid #333333;
    }
    QScrollBar:vertical {
        border: none;
        background: #1e1e1e;
        width: 12px;
        margin: 0px;
    }
    QScrollBar::handle:vertical {
        background: #333333;
        min-height: 20px;
        border-radius: 6px;
        margin: 2px;
    }
    QScrollBar::handle:vertical:hover {
        background: #444444;
    }
    QScrollBar:horizontal {
        border: none;
        background: #1e1e1e;
        height: 12px;
        margin: 0px;
    }
    QScrollBar::handle:horizontal {
        background: #333333;
        min-width: 20px;
        border-radius: 6px;
        margin: 2px;
    }
    QSplitter::handle {
        background-color: #333333;
    }
    """

    LIGHT_STYLESHEET = """
    QMainWindow {
        background-color: #f5f5f5;
        color: #333333;
    }
    QWidget {
        background-color: #f5f5f5;
        color: #333333;
    }
    QGroupBox {
        font-weight: bold;
        border: 1px solid #cccccc;
        border-radius: 6px;
        margin-top: 12px;
        padding-top: 12px;
        color: #2b5797;
    }
    QGroupBox::title {
        subcontrol-origin: margin;
        left: 10px;
        padding: 0 5px 0 5px;
    }
    QPushButton {
        background-color: #ffffff;
        color: #333333;
        border: 1px solid #cccccc;
        padding: 6px 12px;
        border-radius: 4px;
        font-weight: normal;
    }
    QPushButton:hover {
        background-color: #eeeeee;
        border: 1px solid #bbbbbb;
    }
    QPushButton:pressed {
        background-color: #dddddd;
    }
    QPushButton:disabled {
        background-color: #f0f0f0;
        color: #aaaaaa;
        border: 1px solid #e0e0e0;
    }
    QPushButton#btn_start {
        background-color: #4CAF50;
        color: #ffffff;
        border: 1px solid #388E3C;
    }
    QPushButton#btn_start:hover {
        background-color: #45a049;
    }
    QPushButton#btn_stop {
        background-color: #f44336;
        color: #ffffff;
        border: 1px solid #d32f2f;
    }
    QPushButton#btn_stop:hover {
        background-color: #da190b;
    }
    QLineEdit, QSpinBox, QComboBox {
        padding: 6px;
        border: 1px solid #cccccc;
        border-radius: 4px;
        background-color: #ffffff;
        color: #333333;
    }
    QLineEdit:focus, QSpinBox:focus, QComboBox:focus {
        border: 1px solid #2b5797;
    }
    QCheckBox {
        spacing: 8px;
        color: #333333;
    }
    QLabel {
        color: #333333;
    }
    QTextEdit {
        border: 1px solid #cccccc;
        border-radius: 4px;
        font-family: 'Consolas', 'Cascadia Code', monospace;
        font-size: 11px;
        background-color: #ffffff;
        color: #333333;
    }
    QTabWidget::pane {
        border: 1px solid #cccccc;
        top: -1px;
    }
    QTabBar::tab {
        background-color: #e0e0e0;
        color: #666666;
        padding: 8px 16px;
        border: 1px solid #cccccc;
        border-bottom: none;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        margin-right: 2px;
    }
    QTabBar::tab:selected {
        background-color: #f5f5f5;
        color: #333333;
        border-bottom: 2px solid #2b5797;
    }
    QProgressBar {
        border: 1px solid #cccccc;
        border-radius: 4px;
        background-color: #ffffff;
        color: #333333;
        text-align: center;
    }
    QProgressBar::chunk {
        background-color: #2b5797;
        width: 1px;
    }
    QTableWidget, QTreeView {
        background-color: #ffffff;
        color: #333333;
        border: 1px solid #cccccc;
        gridline-color: #eeeeee;
    }
    QHeaderView::section {
        background-color: #f0f0f0;
        color: #333333;
        padding: 6px;
        border: 1px solid #cccccc;
    }
    QScrollBar:vertical {
        border: none;
        background: #f5f5f5;
        width: 12px;
        margin: 0px;
    }
    QScrollBar::handle:vertical {
        background: #cccccc;
        min-height: 20px;
        border-radius: 6px;
        margin: 2px;
    }
    QScrollBar::handle:vertical:hover {
        background: #bbbbbb;
    }
    QScrollBar:horizontal {
        border: none;
        background: #f5f5f5;
        height: 12px;
        margin: 0px;
    }
    QScrollBar::handle:horizontal {
        background: #cccccc;
        min-width: 20px;
        border-radius: 6px;
        margin: 2px;
    }
    QSplitter::handle {
        background-color: #cccccc;
    }
    """

    @staticmethod
    def get_system_theme() -> str:
        """Detecteert het systeem thema (Windows specifiek)"""
        try:
            import winreg
            registry = winreg.ConnectRegistry(None, winreg.HKEY_CURRENT_USER)
            key = winreg.OpenKey(registry, r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize")
            value, _ = winreg.QueryValueEx(key, "AppsUseLightTheme")
            return "light" if value == 1 else "dark"
        except Exception:
            return "dark" # Fallback naar dark mode

    @staticmethod
    def apply_theme(app: QApplication, theme: str):
        if theme == "dark":
            app.setStyleSheet(ThemeManager.DARK_STYLESHEET)
            palette = QPalette()
            # Dark theme palette
            dark_color = QColor(30, 30, 30)
            text_color = QColor(224, 224, 224)
            highlight_color = QColor(74, 134, 232)
            
            palette.setColor(QPalette.ColorRole.Window, dark_color)
            palette.setColor(QPalette.ColorRole.WindowText, text_color)
            palette.setColor(QPalette.ColorRole.Base, QColor(37, 37, 38))
            palette.setColor(QPalette.ColorRole.AlternateBase, dark_color)
            palette.setColor(QPalette.ColorRole.ToolTipBase, dark_color)
            palette.setColor(QPalette.ColorRole.ToolTipText, text_color)
            palette.setColor(QPalette.ColorRole.Text, text_color)
            palette.setColor(QPalette.ColorRole.Button, QColor(51, 51, 51))
            palette.setColor(QPalette.ColorRole.ButtonText, text_color)
            palette.setColor(QPalette.ColorRole.Highlight, highlight_color)
            palette.setColor(QPalette.ColorRole.HighlightedText, Qt.GlobalColor.white)
            
            app.setPalette(palette)
        elif theme == "light":
            app.setStyleSheet(ThemeManager.LIGHT_STYLESHEET)
            palette = QPalette()
            # Light theme palette
            light_color = QColor(245, 245, 245)
            text_color = QColor(51, 51, 51)
            highlight_color = QColor(43, 87, 151)
            
            palette.setColor(QPalette.ColorRole.Window, light_color)
            palette.setColor(QPalette.ColorRole.WindowText, text_color)
            palette.setColor(QPalette.ColorRole.Base, Qt.GlobalColor.white)
            palette.setColor(QPalette.ColorRole.AlternateBase, light_color)
            palette.setColor(QPalette.ColorRole.ToolTipBase, light_color)
            palette.setColor(QPalette.ColorRole.ToolTipText, text_color)
            palette.setColor(QPalette.ColorRole.Text, text_color)
            palette.setColor(QPalette.ColorRole.Button, light_color)
            palette.setColor(QPalette.ColorRole.ButtonText, text_color)
            palette.setColor(QPalette.ColorRole.Highlight, highlight_color)
            palette.setColor(QPalette.ColorRole.HighlightedText, Qt.GlobalColor.white)
            
            app.setPalette(palette)
        else:
            app.setStyleSheet("")
            app.setPalette(app.style().standardPalette())
