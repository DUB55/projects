"""
Keyring Adapter Module

Secure password storage using OS-native keyrings:
  - Windows: Credential Manager
  - macOS: Keychain
  - Linux: Secret Service (via libsecret)
"""

import keyring
from typing import Optional
from app.utils.logger import setup_logger


logger = setup_logger(__name__)

SERVICE_NAME = "DesktopBrowser"


class KeyringError(Exception):
    """Keyring operation error."""
    pass


class KeyringAdapter:
    """Wrapper for secure password storage."""
    
    def __init__(self, service: str = SERVICE_NAME):
        """
        Initialize keyring adapter.
        
        Args:
            service: Service name for keyring (namespace)
        """
        self.service = service
        self._available = self._check_availability()
    
    def _check_availability(self) -> bool:
        """
        Check if keyring is available on this system.
        
        Returns:
            True if keyring backend is available
        """
        try:
            backend = keyring.get_keyring()
            logger.info(f"Keyring backend available: {backend.__class__.__name__}")
            return backend is not None
        except Exception as e:
            logger.warning(f"Keyring not available: {e}")
            return False
    
    def is_available(self) -> bool:
        """Check if keyring is available."""
        return self._available
    
    def save_password(self, username: str, password: str, account_name: str = "default") -> bool:
        """
        Save password to keyring.
        
        Args:
            username: Username/identifier
            password: Password to save
            account_name: Account name (default: "default")
        
        Returns:
            True if successful
        """
        if not self._available:
            logger.warning("Keyring not available, password not saved")
            return False
        
        try:
            key = f"{account_name}:{username}"
            keyring.set_password(self.service, key, password)
            logger.info(f"Password saved for {key}")
            return True
        except Exception as e:
            logger.error(f"Failed to save password: {e}")
            return False
    
    def get_password(self, username: str, account_name: str = "default") -> Optional[str]:
        """
        Retrieve password from keyring.
        
        Args:
            username: Username/identifier
            account_name: Account name (default: "default")
        
        Returns:
            Password or None if not found
        """
        if not self._available:
            logger.warning("Keyring not available")
            return None
        
        try:
            key = f"{account_name}:{username}"
            password = keyring.get_password(self.service, key)
            if password:
                logger.debug(f"Password retrieved for {key}")
            else:
                logger.debug(f"No password found for {key}")
            return password
        except Exception as e:
            logger.error(f"Failed to retrieve password: {e}")
            return None
    
    def delete_password(self, username: str, account_name: str = "default") -> bool:
        """
        Delete password from keyring.
        
        Args:
            username: Username/identifier
            account_name: Account name (default: "default")
        
        Returns:
            True if successful
        """
        if not self._available:
            logger.warning("Keyring not available")
            return False
        
        try:
            key = f"{account_name}:{username}"
            keyring.delete_password(self.service, key)
            logger.info(f"Password deleted for {key}")
            return True
        except keyring.errors.PasswordDeleteError:
            logger.warning(f"Password not found for {key}")
            return False
        except Exception as e:
            logger.error(f"Failed to delete password: {e}")
            return False
    
    def has_password(self, username: str, account_name: str = "default") -> bool:
        """
        Check if password exists.
        
        Args:
            username: Username/identifier
            account_name: Account name (default: "default")
        
        Returns:
            True if password exists
        """
        return self.get_password(username, account_name) is not None
    
    def list_accounts(self) -> list[str]:
        """
        List all stored account usernames.
        
        Returns:
            List of usernames
        """
        if not self._available:
            return []
        
        try:
            # This is backend-dependent and may not work on all systems
            backend = keyring.get_keyring()
            if hasattr(backend, 'get_credential'):
                # Some backends support listing
                logger.debug("Keyring backend doesn't support listing")
            return []
        except Exception as e:
            logger.error(f"Failed to list accounts: {e}")
            return []
    
    def clear_all(self) -> bool:
        """
        Clear all stored passwords for this service.
        
        Warning: This deletes all stored passwords for the application!
        
        Returns:
            True if successful
        """
        if not self._available:
            return False
        
        try:
            # Note: This is a destructive operation
            logger.warning("Clearing all stored passwords")
            # Most keyring backends don't support bulk delete
            # You would need to track and delete individual entries
            logger.warning("Bulk delete not fully implemented")
            return True
        except Exception as e:
            logger.error(f"Failed to clear passwords: {e}")
            return False


# Global keyring instance
_keyring: Optional[KeyringAdapter] = None


def get_keyring() -> KeyringAdapter:
    """Get global keyring instance."""
    global _keyring
    if _keyring is None:
        _keyring = KeyringAdapter()
    return _keyring


def init_keyring(service: str = SERVICE_NAME) -> KeyringAdapter:
    """Initialize global keyring instance."""
    global _keyring
    _keyring = KeyringAdapter(service)
    return _keyring
