"""
Configuration Management Module

Handles loading, saving, and validation of application settings.
Supports JSON-based configuration with platform-aware data directories.
"""

import json
import platform
from pathlib import Path
from typing import Any, Dict, Optional
from dataclasses import dataclass, asdict
from app.utils.logger import setup_logger


logger = setup_logger(__name__)


def get_data_dir() -> Path:
    """
    Get platform-appropriate data directory.
    
    Returns:
        Path to application data directory
    """
    system = platform.system()
    
    if system == 'Windows':
        base = Path.home() / 'AppData' / 'Local'
    elif system == 'Darwin':  # macOS
        base = Path.home() / 'Library' / 'Application Support'
    else:  # Linux
        base = Path.home() / '.local' / 'share'
    
    app_dir = base / 'Browser'
    app_dir.mkdir(parents=True, exist_ok=True)
    return app_dir


@dataclass
class BrowserConfig:
    """Application configuration data model."""
    
    # Window settings
    window_width: int = 1280
    window_height: int = 800
    window_x: int = 100
    window_y: int = 100
    window_maximized: bool = False
    
    # Theme settings
    theme: str = 'auto'  # auto, light, dark
    accent_color: str = '#0078D4'  # Windows blue
    
    # Tab settings
    tab_bar_position: str = 'top'  # top, bottom, left
    show_tab_preview: bool = True
    max_tabs_per_row: int = 8
    
    # Behavior settings
    start_page: str = 'about:home'
    search_engine: str = 'google'
    auto_update: bool = True
    privacy_mode: bool = False
    
    # Performance settings
    enable_gpu_acceleration: bool = True
    cache_size_mb: int = 100
    
    # Developer settings
    debug_mode: bool = False
    dev_tools_visible: bool = False


class ConfigManager:
    """Manages application configuration with persistence."""
    
    def __init__(self, data_dir: Optional[Path] = None):
        """
        Initialize configuration manager.
        
        Args:
            data_dir: Path to data directory (uses platform default if None)
        """
        self.data_dir = data_dir or get_data_dir()
        self.config_file = self.data_dir / 'config.json'
        self.config = BrowserConfig()
        self._load_config()
    
    def _load_config(self) -> None:
        """Load configuration from file."""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                # Merge loaded data with defaults (allows new keys to be added)
                for key, value in data.items():
                    if hasattr(self.config, key):
                        setattr(self.config, key, value)
                
                logger.info(f"Loaded configuration from {self.config_file}")
            except Exception as e:
                logger.error(f"Failed to load config: {e}. Using defaults.")
        else:
            logger.info("No config file found. Using defaults.")
    
    def save_config(self) -> bool:
        """
        Save configuration to file.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            self.data_dir.mkdir(parents=True, exist_ok=True)
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(asdict(self.config), f, indent=2)
            logger.info(f"Saved configuration to {self.config_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get configuration value.
        
        Args:
            key: Configuration key
            default: Default value if key not found
        
        Returns:
            Configuration value or default
        """
        return getattr(self.config, key, default)
    
    def set(self, key: str, value: Any) -> bool:
        """
        Set configuration value.
        
        Args:
            key: Configuration key
            value: New value
        
        Returns:
            True if successful
        """
        if hasattr(self.config, key):
            setattr(self.config, key, value)
            return True
        else:
            logger.warning(f"Unknown config key: {key}")
            return False
    
    def to_dict(self) -> Dict[str, Any]:
        """Get all configuration as dictionary."""
        return asdict(self.config)
    
    def reset_to_defaults(self) -> None:
        """Reset configuration to defaults."""
        self.config = BrowserConfig()
        logger.info("Configuration reset to defaults")
    
    def get_data_dir(self) -> Path:
        """Get application data directory."""
        return self.data_dir
    
    def get_cache_dir(self) -> Path:
        """Get cache directory."""
        cache_dir = self.data_dir / 'cache'
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir
    
    def get_logs_dir(self) -> Path:
        """Get logs directory."""
        logs_dir = self.data_dir / 'logs'
        logs_dir.mkdir(parents=True, exist_ok=True)
        return logs_dir
    
    def get_db_path(self) -> Path:
        """Get database file path."""
        return self.data_dir / 'browser.db'


# Global config instance
_config_manager: Optional[ConfigManager] = None


def get_config_manager() -> ConfigManager:
    """Get or create global config manager instance."""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigManager()
    return _config_manager


def init_config(data_dir: Optional[Path] = None) -> ConfigManager:
    """Initialize global config manager."""
    global _config_manager
    _config_manager = ConfigManager(data_dir)
    return _config_manager
