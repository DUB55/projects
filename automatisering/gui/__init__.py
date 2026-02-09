# gui/__init__.py
"""
GUI module voor Noordhoff Scraper.
Bevat alle PyQt6 GUI componenten.
"""

__version__ = "1.0.0"
__author__ = "Noordhoff Scraper Team"

from .main_window import MainWindow
from .selector_tester import SelectorTesterDialog
from .widgets import LogTextEdit, ConfigTableWidget
from .dialogs import CaptchaDialog, LoginDialog, ProgressDialog

__all__ = [
    'MainWindow', 
    'SelectorTesterDialog', 
    'LogTextEdit', 
    'ConfigTableWidget',
    'CaptchaDialog', 
    'LoginDialog', 
    'ProgressDialog'
]