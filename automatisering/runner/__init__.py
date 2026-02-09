# runner/__init__.py
"""
Runner module voor Noordhoff Scraper.
Bevat Playwright scraping logica.
"""

__version__ = "1.0.0"
__author__ = "Noordhoff Scraper Team"

from .playwright_runner import BookScrapeRunner
from .navigator import Navigator
from .extractor import Extractor

__all__ = ['BookScrapeRunner', 'Navigator', 'Extractor']