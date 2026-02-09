# storage/__init__.py
"""
Storage module voor Noordhoff Scraper.
Bevat data opslag en manifest generatie.
"""

__version__ = "1.0.0"
__author__ = "Noordhoff Scraper Team"

from .saver import DataSaver

__all__ = ['DataSaver']