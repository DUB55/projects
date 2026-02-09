"""
Logging Configuration Module

Provides unified logging across the application with:
- File logging (rotating, daily rollover)
- Console logging (colored output)
- Configurable log levels
- Structured logging support
"""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Optional
import colorlog


def setup_logger(
    name: str,
    log_file: Optional[Path] = None,
    level: int = logging.INFO,
    debug: bool = False
) -> logging.Logger:
    """
    Configure a logger with file and console handlers.
    
    Args:
        name: Logger name (usually __name__)
        log_file: Path to log file (optional)
        level: Logging level (default: INFO)
        debug: Enable debug mode (set to DEBUG level)
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Set level based on debug flag
    if debug:
        logger.setLevel(logging.DEBUG)
        default_level = logging.DEBUG
    else:
        logger.setLevel(level)
        default_level = level
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Format strings
    detailed_fmt = (
        '%(asctime)s | %(name)-20s | %(levelname)-8s | %(funcName)-15s:%(lineno)-4d | %(message)s'
    )
    simple_fmt = '%(asctime)s | %(levelname)-8s | %(message)s'
    
    # Console handler with color
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(default_level)
    console_formatter = colorlog.ColoredFormatter(
        '%(log_color)s' + simple_fmt + '%(reset)s',
        log_colors={
            'DEBUG': 'cyan',
            'INFO': 'green',
            'WARNING': 'yellow',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        }
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler (if log file specified)
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)  # Always log DEBUG and above to file
        file_formatter = logging.Formatter(detailed_fmt)
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    return logger


class ApplicationLogger:
    """Singleton logger manager for the entire application."""
    
    _instance = None
    _logger = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def init(self, log_dir: Path, debug: bool = False) -> logging.Logger:
        """Initialize the application logger."""
        log_file = log_dir / 'browser.log'
        self._logger = setup_logger(
            'browser',
            log_file=log_file,
            level=logging.DEBUG if debug else logging.INFO,
            debug=debug
        )
        return self._logger
    
    def get_logger(self, name: str = 'browser') -> logging.Logger:
        """Get logger instance."""
        if self._logger is None:
            self._logger = setup_logger(name)
        return logging.getLogger(name)
    
    def debug(self, msg: str, *args, **kwargs):
        """Log debug message."""
        if self._logger:
            self._logger.debug(msg, *args, **kwargs)
    
    def info(self, msg: str, *args, **kwargs):
        """Log info message."""
        if self._logger:
            self._logger.info(msg, *args, **kwargs)
    
    def warning(self, msg: str, *args, **kwargs):
        """Log warning message."""
        if self._logger:
            self._logger.warning(msg, *args, **kwargs)
    
    def error(self, msg: str, *args, **kwargs):
        """Log error message."""
        if self._logger:
            self._logger.error(msg, *args, **kwargs)
    
    def critical(self, msg: str, *args, **kwargs):
        """Log critical message."""
        if self._logger:
            self._logger.critical(msg, *args, **kwargs)


# Global logger instance
app_logger = ApplicationLogger()
