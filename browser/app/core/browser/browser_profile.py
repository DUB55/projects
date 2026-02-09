"""
Browser Profile Management Module

Handles browser profiles (separate contexts with their own data):
- Multiple browser profiles with independent settings/history/bookmarks
- Profile switching
- Profile creation/deletion
- Per-profile WebEngine storage
"""

from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional, Dict
import json
from app.utils.logger import setup_logger


logger = setup_logger(__name__)


@dataclass
class BrowserProfile:
    """Represents a browser profile (context)."""
    
    id: str
    name: str
    description: str = ""
    icon_color: str = "#0078D4"
    is_default: bool = False
    data_path: Path = None
    
    def __post_init__(self):
        """Initialize profile data path if not provided."""
        if self.data_path is None:
            # Will be set by ProfileManager
            pass
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon_color': self.icon_color,
            'is_default': self.is_default
        }


class ProfileManager:
    """Manages browser profiles."""
    
    PROFILES_FILE = "profiles.json"
    DEFAULT_PROFILE_ID = "main_profile"
    DEFAULT_PROFILE_NAME = "Default Profile"
    
    def __init__(self, data_dir: Path):
        """
        Initialize profile manager.
        
        Args:
            data_dir: Base data directory
        """
        self.data_dir = Path(data_dir)
        self.profiles_dir = self.data_dir / "profiles"
        self.profiles_file = self.data_dir / self.PROFILES_FILE
        self._profiles: Dict[str, BrowserProfile] = {}
        self._active_profile_id: Optional[str] = None
        
        self._init_profiles()
    
    def _init_profiles(self) -> None:
        """Initialize profiles system."""
        self.profiles_dir.mkdir(parents=True, exist_ok=True)
        
        if self.profiles_file.exists():
            self._load_profiles()
        else:
            self._create_default_profile()
    
    def _create_default_profile(self) -> None:
        """Create default profile."""
        default_profile = BrowserProfile(
            id=self.DEFAULT_PROFILE_ID,
            name=self.DEFAULT_PROFILE_NAME,
            description="Your main browser profile",
            icon_color="#0078D4",
            is_default=True,
            data_path=self.profiles_dir / self.DEFAULT_PROFILE_ID
        )
        
        default_profile.data_path.mkdir(parents=True, exist_ok=True)
        self._profiles[self.DEFAULT_PROFILE_ID] = default_profile
        self._active_profile_id = self.DEFAULT_PROFILE_ID
        
        self._save_profiles()
        logger.info(f"Created default profile: {default_profile.name}")
    
    def _load_profiles(self) -> None:
        """Load profiles from file."""
        try:
            with open(self.profiles_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            for profile_data in data.get('profiles', []):
                profile = BrowserProfile(
                    id=profile_data['id'],
                    name=profile_data['name'],
                    description=profile_data.get('description', ''),
                    icon_color=profile_data.get('icon_color', '#0078D4'),
                    is_default=profile_data.get('is_default', False),
                    data_path=self.profiles_dir / profile_data['id']
                )
                self._profiles[profile.id] = profile
            
            self._active_profile_id = data.get('active_profile', self.DEFAULT_PROFILE_ID)
            logger.info(f"Loaded {len(self._profiles)} profiles")
        
        except Exception as e:
            logger.error(f"Failed to load profiles: {e}. Creating default.")
            self._create_default_profile()
    
    def _save_profiles(self) -> None:
        """Save profiles to file."""
        try:
            data = {
                'active_profile': self._active_profile_id,
                'profiles': [profile.to_dict() for profile in self._profiles.values()]
            }
            
            with open(self.profiles_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            
            logger.debug("Saved profiles")
        
        except Exception as e:
            logger.error(f"Failed to save profiles: {e}")
    
    def create_profile(self, name: str, description: str = "", 
                      icon_color: str = "#0078D4") -> Optional[BrowserProfile]:
        """
        Create new profile.
        
        Args:
            name: Profile name
            description: Profile description
            icon_color: Profile icon color
        
        Returns:
            Created profile or None
        """
        # Generate ID from name
        profile_id = name.lower().replace(' ', '_')
        
        # Ensure unique ID
        counter = 1
        unique_id = profile_id
        while unique_id in self._profiles:
            unique_id = f"{profile_id}_{counter}"
            counter += 1
        
        profile = BrowserProfile(
            id=unique_id,
            name=name,
            description=description,
            icon_color=icon_color,
            is_default=False,
            data_path=self.profiles_dir / unique_id
        )
        
        # Create profile data directory
        profile.data_path.mkdir(parents=True, exist_ok=True)
        
        self._profiles[unique_id] = profile
        self._save_profiles()
        
        logger.info(f"Created profile: {name} ({unique_id})")
        return profile
    
    def delete_profile(self, profile_id: str) -> bool:
        """
        Delete profile.
        
        Args:
            profile_id: Profile ID
        
        Returns:
            True if successful
        """
        if profile_id not in self._profiles:
            logger.warning(f"Profile not found: {profile_id}")
            return False
        
        if profile_id == self.DEFAULT_PROFILE_ID:
            logger.warning("Cannot delete default profile")
            return False
        
        profile = self._profiles[profile_id]
        
        # Switch to default if deleting active profile
        if self._active_profile_id == profile_id:
            self._active_profile_id = self.DEFAULT_PROFILE_ID
        
        # Remove from dictionary
        del self._profiles[profile_id]
        
        # Delete data directory (optional)
        try:
            import shutil
            shutil.rmtree(profile.data_path)
            logger.info(f"Deleted profile data: {profile_id}")
        except Exception as e:
            logger.warning(f"Failed to delete profile directory: {e}")
        
        self._save_profiles()
        logger.info(f"Deleted profile: {profile_id}")
        return True
    
    def get_profile(self, profile_id: str) -> Optional[BrowserProfile]:
        """Get profile by ID."""
        return self._profiles.get(profile_id)
    
    def get_all_profiles(self) -> List[BrowserProfile]:
        """Get all profiles."""
        return list(self._profiles.values())
    
    def set_active_profile(self, profile_id: str) -> bool:
        """
        Set active profile.
        
        Args:
            profile_id: Profile ID
        
        Returns:
            True if successful
        """
        if profile_id not in self._profiles:
            logger.warning(f"Profile not found: {profile_id}")
            return False
        
        self._active_profile_id = profile_id
        self._save_profiles()
        logger.info(f"Switched to profile: {profile_id}")
        return True
    
    def get_active_profile(self) -> Optional[BrowserProfile]:
        """Get currently active profile."""
        if self._active_profile_id:
            return self._profiles.get(self._active_profile_id)
        return None
    
    def get_active_profile_id(self) -> str:
        """Get active profile ID."""
        return self._active_profile_id or self.DEFAULT_PROFILE_ID
    
    def rename_profile(self, profile_id: str, new_name: str) -> bool:
        """
        Rename profile.
        
        Args:
            profile_id: Profile ID
            new_name: New name
        
        Returns:
            True if successful
        """
        if profile_id not in self._profiles:
            return False
        
        self._profiles[profile_id].name = new_name
        self._save_profiles()
        logger.info(f"Renamed profile {profile_id} to {new_name}")
        return True
    
    def set_profile_color(self, profile_id: str, color: str) -> bool:
        """
        Set profile icon color.
        
        Args:
            profile_id: Profile ID
            color: Hex color (e.g., "#0078D4")
        
        Returns:
            True if successful
        """
        if profile_id not in self._profiles:
            return False
        
        self._profiles[profile_id].icon_color = color
        self._save_profiles()
        return True


# Global profile manager
_profile_manager: Optional[ProfileManager] = None


def get_profile_manager() -> ProfileManager:
    """Get global profile manager."""
    global _profile_manager
    if _profile_manager is None:
        from app.core.config.config_manager import get_config_manager
        config = get_config_manager()
        _profile_manager = ProfileManager(config.get_data_dir())
    return _profile_manager


def init_profile_manager(data_dir: Path) -> ProfileManager:
    """Initialize global profile manager."""
    global _profile_manager
    _profile_manager = ProfileManager(data_dir)
    return _profile_manager
