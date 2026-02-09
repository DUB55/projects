# utils/logger.py
import logging
import sys
from pathlib import Path
from datetime import datetime
from logging.handlers import RotatingFileHandler
from PyQt6.QtCore import QObject, pyqtSignal

class QtHandler(logging.Handler, QObject):
    """Log handler die naar Qt signal stuurt voor GUI weergave"""
    log_signal = pyqtSignal(str, int)  # message, level
    
    def __init__(self):
        logging.Handler.__init__(self)
        QObject.__init__(self)
        
    def emit(self, record):
        msg = self.format(record)
        self.log_signal.emit(msg, record.levelno)

class Logger:
    """Gecentraliseerde logger voor applicatie"""
    
    def __init__(self, app_name: str = "NoordhoffScraper"):
        self.app_name = app_name
        self.log_dir = Path.home() / "AppData" / "Local" / app_name / "logs"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        self.setup_logging()
        
    def setup_logging(self):
        """Configureer logging systeem"""
        # Hoofdlogger
        self.logger = logging.getLogger(self.app_name)
        self.logger.setLevel(logging.DEBUG)
        
        # Verwijder bestaande handlers
        self.logger.handlers.clear()
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # File handler met rotatie
        log_file = self.log_dir / f"{datetime.now().strftime('%Y%m')}.log"
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        self.logger.addHandler(file_handler)
        
        # Qt handler voor GUI
        self.qt_handler = QtHandler()
        self.qt_handler.setLevel(logging.INFO)
        qt_formatter = logging.Formatter('%(levelname)s: %(message)s')
        self.qt_handler.setFormatter(qt_formatter)
        self.logger.addHandler(self.qt_handler)
        
    def get_qt_handler(self) -> QtHandler:
        """Retourneer Qt handler voor GUI integratie"""
        return self.qt_handler
    
    def info(self, message: str):
        """Log info bericht"""
        self.logger.info(message)
    
    def warning(self, message: str):
        """Log warning bericht"""
        self.logger.warning(message)
    
    def error(self, message: str):
        """Log error bericht"""
        self.logger.error(message)
    
    def debug(self, message: str):
        """Log debug bericht"""
        self.logger.debug(message)
    
    def critical(self, message: str):
        """Log critical bericht"""
        self.logger.critical(message)

    def cleanup(self):
        """Verwijder handlers om fouten bij afsluiten te voorkomen"""
        self.logger.handlers.clear()
        if hasattr(self, 'qt_handler'):
            self.qt_handler.close()