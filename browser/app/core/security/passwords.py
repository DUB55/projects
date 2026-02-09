"""
Password Manager Module

Manages secure password storage and retrieval:
- Stores metadata (URL, Username, Created Date) in JSON
- Stores actual passwords securely in OS Keyring
- Provides add/list/delete functionality
- Supports search by URL
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import json
import uuid

from app.utils.logger import setup_logger
from app.core.security.keyring_adapter import get_keyring

logger = setup_logger(__name__)


@dataclass
class PasswordEntry:
    """Represents a stored password entry."""
    id: str
    url: str
    username: str
    site_name: str
    created_at: str
    updated_at: str
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'PasswordEntry':
        """Create from dictionary."""
        return cls(**data)


class PasswordManager:
    """Manages passwords for a profile."""
    
    def __init__(self, data_dir: Path):
        """
        Initialize password manager.
        
        Args:
            data_dir: Profile data directory
        """
        self.data_dir = Path(data_dir)
        self.metadata_file = self.data_dir / "passwords.json"
        self.keyring = get_keyring()
        
        # Metadata storage (ID -> Entry)
        self.entries: Dict[str, PasswordEntry] = {}
        
        self._load_metadata()
    
    def _load_metadata(self) -> None:
        """Load password metadata from file."""
        try:
            if self.metadata_file.exists():
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    for item_data in data.get('entries', []):
                        entry = PasswordEntry.from_dict(item_data)
                        self.entries[entry.id] = entry
                
                logger.info(f"Loaded metadata for {len(self.entries)} passwords")
        except Exception as e:
            logger.error(f"Failed to load password metadata: {e}")
    
    def _save_metadata(self) -> None:
        """Save password metadata to file."""
        try:
            data = {
                'version': 1,
                'entries': [entry.to_dict() for entry in self.entries.values()]
            }
            
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save password metadata: {e}")
    
    def add_password(
        self,
        url: str,
        username: str,
        password: str,
        site_name: str = ""
    ) -> Optional[PasswordEntry]:
        """
        Add or update password.
        
        Args:
            url: Site URL
            username: Username
            password: Password
            site_name: Site Name (optional)
        
        Returns:
            Created/Updated entry or None on failure
        """
        try:
            # Check for existing entry (update if found)
            existing_id = None
            for entry in self.entries.values():
                if entry.url == url and entry.username == username:
                    existing_id = entry.id
                    break
            
            timestamp = datetime.now().isoformat()
            
            if existing_id:
                # Update existing
                entry = self.entries[existing_id]
                entry.updated_at = timestamp
                if site_name:
                    entry.site_name = site_name
                logger.info(f"Updating password for {username}@{url}")
            else:
                # Create new
                entry_id = str(uuid.uuid4())
                entry = PasswordEntry(
                    id=entry_id,
                    url=url,
                    username=username,
                    site_name=site_name or url,
                    created_at=timestamp,
                    updated_at=timestamp
                )
                self.entries[entry_id] = entry
                logger.info(f"Adding new password for {username}@{url}")
            
            # Save to Keyring
            # Key format: "profile_path:entry_id" to ensure uniqueness across profiles
            # Or simpler: just entry_id if we assume unique IDs (UUIDs are unique)
            key = entry.id
            if self.keyring.save_password(key, password, account_name="BrowserPasswords"):
                self._save_metadata()
                return entry
            else:
                logger.error("Failed to save to keyring")
                if not existing_id:
                    del self.entries[entry.id]
                return None
                
        except Exception as e:
            logger.error(f"Error adding password: {e}")
            return None
    
    def get_password(self, entry_id: str) -> Optional[str]:
        """
        Get decrypted password.
        
        Args:
            entry_id: Entry ID
            
        Returns:
            Password string or None
        """
        if entry_id not in self.entries:
            return None
            
        return self.keyring.get_password(entry_id, account_name="BrowserPasswords")
    
    def delete_password(self, entry_id: str) -> bool:
        """
        Delete password entry.
        
        Args:
            entry_id: Entry ID
            
        Returns:
            True if successful
        """
        if entry_id not in self.entries:
            return False
            
        try:
            # Delete from keyring
            self.keyring.delete_password(entry_id, account_name="BrowserPasswords")
            
            # Delete metadata
            del self.entries[entry_id]
            self._save_metadata()
            
            logger.info(f"Deleted password entry {entry_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete password: {e}")
            return False
            
    def get_all_passwords(self) -> List[PasswordEntry]:
        """Get all password entries."""
        return list(self.entries.values())
    
    def get_passwords_for_site(self, url: str) -> List[PasswordEntry]:
        """Get passwords matching URL."""
        # Simple string match for now, could be domain match later
        return [e for e in self.entries.values() if url in e.url]
