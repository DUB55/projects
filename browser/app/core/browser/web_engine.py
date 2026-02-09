"""
WebEngine Manager Module

Manages WebEngineView instances and browser operations:
- WebEngine configuration
- Storage paths per profile
- Cookie/cache management
- Download handling
"""

from pathlib import Path
from typing import Optional
from PySide6.QtWebEngineCore import QWebEngineProfile, QWebEnginePage
from app.utils.logger import setup_logger


logger = setup_logger(__name__)


class WebEngineManager:
    """Manages WebEngine instances and configuration."""
    
    def __init__(self, profile_path: Path):
        """
        Initialize WebEngine manager.
        
        Args:
            profile_path: Path to profile data directory
        """
        self.profile_path = Path(profile_path)
        self.cache_path = self.profile_path / "cache"
        self.storage_path = self.profile_path / "storage"
        
        # Create directories
        self.cache_path.mkdir(parents=True, exist_ok=True)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self._web_profile: Optional[QWebEngineProfile] = None
        self._init_web_profile()
    
    def _init_web_profile(self) -> None:
        """Initialize QWebEngineProfile with proper settings."""
        try:
            # Create persistent profile with a unique name based on the path
            # This helps avoid conflicts and ensures data is separated
            storage_name = self.profile_path.name
            self._web_profile = QWebEngineProfile(storage_name)
            
            # Set storage paths explicitly
            self._web_profile.setPersistentStoragePath(str(self.storage_path.absolute()))
            self._web_profile.setCachePath(str(self.cache_path.absolute()))
            
            # Enable persistent cookies
            self._web_profile.setPersistentCookiesPolicy(
                QWebEngineProfile.PersistentCookiesPolicy.ForcePersistentCookies
            )
            
            # User agent (optional - makes browser identifiable)
            # For now, use default
            
            # JavaScript enabled by default
            settings = self._web_profile.settings()
            from PySide6.QtWebEngineCore import QWebEngineSettings
            settings.setAttribute(
                QWebEngineSettings.WebAttribute.JavascriptEnabled, True
            )
            settings.setAttribute(
                QWebEngineSettings.WebAttribute.LocalStorageEnabled, True
            )
            # XSSAuditingEnabled is removed in newer WebEngine versions, best to skip or check
            # settings.setAttribute(
            #     QWebEngineSettings.WebAttribute.XSSAuditingEnabled, False
            # )
            
            logger.info(f"WebEngine profile initialized at {self.profile_path}")
        
        except Exception as e:
            logger.error(f"Failed to initialize WebEngine: {e}")
    
    def get_profile(self) -> Optional[QWebEngineProfile]:
        """
        Get the WebEngineProfile.
        
        Returns:
            QWebEngineProfile instance
        """
        return self._web_profile
    
    def create_page(self) -> Optional[QWebEnginePage]:
        """
        Create a new WebEnginePage.
        
        Returns:
            QWebEnginePage instance
        """
        if self._web_profile:
            return QWebEnginePage(self._web_profile)
        return None
    
    def clear_cache(self) -> None:
        """Clear browser cache."""
        if self._web_profile:
            try:
                # Clear HTTP cache
                self._web_profile.clearHttpCache()
                logger.info("Cleared HTTP cache")
            except Exception as e:
                logger.error(f"Failed to clear cache: {e}")
    
    def clear_cookies(self) -> None:
        """Clear all cookies."""
        if self._web_profile:
            try:
                cookie_store = self._web_profile.cookieStore()
                cookie_store.deleteAllCookies()
                logger.info("Cleared all cookies")
            except Exception as e:
                logger.error(f"Failed to clear cookies: {e}")
    
    def clear_local_storage(self) -> None:
        """Clear local storage."""
        try:
            # Local storage is in storage path
            import shutil
            local_storage = self.storage_path / "Local Storage"
            if local_storage.exists():
                shutil.rmtree(local_storage)
                logger.info("Cleared local storage")
        except Exception as e:
            logger.error(f"Failed to clear local storage: {e}")
    
    def clear_all(self) -> None:
        """Clear all browser data (cache, cookies, storage)."""
        self.clear_cache()
        self.clear_cookies()
        self.clear_local_storage()
        logger.info("Cleared all browser data")
    
    def get_cache_size(self) -> int:
        """
        Get cache directory size in bytes.
        
        Returns:
            Size in bytes
        """
        try:
            total = 0
            for path in self.cache_path.rglob('*'):
                if path.is_file():
                    total += path.stat().st_size
            return total
        except Exception as e:
            logger.error(f"Failed to get cache size: {e}")
            return 0
    
    def get_user_agent(self) -> str:
        """
        Get current user agent.
        
        Returns:
            User agent string
        """
        if self._web_profile:
            return self._web_profile.httpUserAgent()
        return "Unknown"
    
    def set_user_agent(self, user_agent: str) -> None:
        """
        Set custom user agent.
        
        Args:
            user_agent: User agent string
        """
        if self._web_profile:
            try:
                self._web_profile.setHttpUserAgent(user_agent)
                logger.info(f"User agent set: {user_agent[:50]}...")
            except Exception as e:
                logger.error(f"Failed to set user agent: {e}")


class OffTheRecordWebEngineManager(WebEngineManager):
    """WebEngine manager for private/incognito mode."""
    
    def _init_web_profile(self) -> None:
        """Initialize off-the-record profile (private mode)."""
        try:
            # Create off-the-record profile (no persistent storage)
            self._web_profile = QWebEngineProfile()
            self._web_profile.setOffTheRecord(True)
            
            # Settings for private mode
            settings = self._web_profile.settings()
            from PySide6.QtWebEngineCore import QWebEngineSettings
            settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)
            
            logger.info("Off-the-record WebEngine profile created (private mode)")
        
        except Exception as e:
            logger.error(f"Failed to initialize off-the-record profile: {e}")
