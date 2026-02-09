# config/__init__.py
"""
Configuratie module voor Noordhoff Scraper.
Beheert configuratiebestanden en validatie.
"""

__version__ = "1.0.0"
__author__ = "Noordhoff Scraper Team"

from .config_manager import ConfigManager, ScraperConfig

__all__ = ['ConfigManager', 'ScraperConfig']