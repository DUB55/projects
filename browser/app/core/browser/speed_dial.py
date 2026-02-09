"""
Speed Dial Manager Module

Manages Speed Dial shortcuts and frequently visited sites.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import datetime
from pathlib import Path
import json
from PySide6.QtCore import QObject, Signal, Slot
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


@dataclass
class Shortcut:
    """Represents a Speed Dial shortcut."""
    id: str
    title: str
    url: str
    icon: str = "🔗"
    color: str = "#4CAF50"
    position: int = 0
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'url': self.url,
            'icon': self.icon,
            'color': self.color,
            'position': self.position
        }


@dataclass
class FrequentSite:
    """Represents a frequently visited site."""
    url: str
    title: str
    visit_count: int = 1
    last_visited: str = field(default_factory=lambda: datetime.now().isoformat())
    icon: str = "🌐"
    color: str = "#2196F3"
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'url': self.url,
            'title': self.title,
            'visit_count': self.visit_count,
            'last_visited': self.last_visited,
            'icon': self.icon,
            'color': self.color
        }


class SpeedDialManager(QObject):
    """
    Manages Speed Dial shortcuts and frequently visited sites.
    
    Features:
      - Create/delete/reorder shortcuts
      - Track frequently visited sites
      - JSON persistence
      - Import/export shortcuts
    """
    
    # Signals
    shortcuts_changed = Signal(list)  # List[Shortcut]
    frequent_sites_changed = Signal(list)  # List[FrequentSite]
    shortcut_added = Signal(object)  # Shortcut
    shortcut_removed = Signal(str)  # shortcut_id
    
    def __init__(self, profile_path: Path):
        """
        Initialize Speed Dial manager.
        
        Args:
            profile_path: Path to profile data directory
        """
        super().__init__()
        self.profile_path = Path(profile_path)
        self.data_file = self.profile_path / "speed_dial.json"
        self.frequent_sites_file = self.profile_path / "frequent_sites.json"
        
        self._shortcuts: Dict[str, Shortcut] = {}
        self._frequent_sites: Dict[str, FrequentSite] = {}
        
        # Create directories
        self.profile_path.mkdir(parents=True, exist_ok=True)
        
        # Load data
        self._load_shortcuts()
        self._load_frequent_sites()
        
        logger.info(f"SpeedDialManager initialized at {profile_path}")
    
    # Shortcuts management
    
    @Slot(str, str, str)
    def add_shortcut(self, url: str, title: str = "", icon: str = "🔗", color: str = "#4CAF50") -> Optional[Shortcut]:
        """
        Add new shortcut.
        
        Args:
            url: Website URL
            title: Display title
            icon: Emoji icon
            color: Color code
        
        Returns:
            Created Shortcut or None if failed
        """
        try:
            shortcut_id = f"sc_{len(self._shortcuts)}_{int(datetime.now().timestamp())}"
            title = title or self._extract_domain(url)
            
            shortcut = Shortcut(
                id=shortcut_id,
                title=title,
                url=url,
                icon=icon,
                color=color,
                position=len(self._shortcuts)
            )
            
            self._shortcuts[shortcut_id] = shortcut
            self._save_shortcuts()
            
            logger.info(f"Added shortcut: {title} -> {url}")
            self.shortcut_added.emit(shortcut)
            self.shortcuts_changed.emit(self.get_all_shortcuts())
            
            return shortcut
        
        except Exception as e:
            logger.error(f"Failed to add shortcut: {e}")
            return None
    
    @Slot(str)
    def remove_shortcut(self, shortcut_id: str) -> bool:
        """
        Remove shortcut.
        
        Args:
            shortcut_id: ID of shortcut to remove
        
        Returns:
            True if successful
        """
        try:
            if shortcut_id in self._shortcuts:
                del self._shortcuts[shortcut_id]
                self._save_shortcuts()
                
                logger.info(f"Removed shortcut: {shortcut_id}")
                self.shortcut_removed.emit(shortcut_id)
                self.shortcuts_changed.emit(self.get_all_shortcuts())
                
                return True
            return False
        
        except Exception as e:
            logger.error(f"Failed to remove shortcut: {e}")
            return False
    
    def get_all_shortcuts(self) -> List[Shortcut]:
        """
        Get all shortcuts.
        
        Returns:
            List of shortcuts sorted by position
        """
        return sorted(self._shortcuts.values(), key=lambda s: s.position)
    
    def get_shortcut(self, shortcut_id: str) -> Optional[Shortcut]:
        """
        Get shortcut by ID.
        
        Args:
            shortcut_id: ID to retrieve
        
        Returns:
            Shortcut or None if not found
        """
        return self._shortcuts.get(shortcut_id)
    
    # Frequent sites management
    
    @Slot(str, str)
    def record_visit(self, url: str, title: str = "") -> None:
        """
        Record a site visit for frequently visited tracking.
        
        Args:
            url: Website URL
            title: Page title
        """
        try:
            if url in self._frequent_sites:
                site = self._frequent_sites[url]
                site.visit_count += 1
                site.last_visited = datetime.now().isoformat()
            else:
                title = title or self._extract_domain(url)
                site = FrequentSite(url=url, title=title)
                self._frequent_sites[url] = site
            
            self._save_frequent_sites()
            self.frequent_sites_changed.emit(self.get_top_frequent_sites())
        
        except Exception as e:
            logger.error(f"Failed to record visit: {e}")
    
    def get_top_frequent_sites(self, limit: int = 8) -> List[FrequentSite]:
        """
        Get top frequently visited sites.
        
        Args:
            limit: Maximum number to return
        
        Returns:
            List of frequently visited sites sorted by visit count
        """
        sites = sorted(
            self._frequent_sites.values(),
            key=lambda s: (-s.visit_count, s.last_visited),
            reverse=True
        )
        return sites[:limit]
    
    def clear_frequent_sites(self) -> None:
        """Clear all frequently visited sites."""
        try:
            self._frequent_sites.clear()
            self._save_frequent_sites()
            logger.info("Cleared frequent sites")
            self.frequent_sites_changed.emit([])
        
        except Exception as e:
            logger.error(f"Failed to clear frequent sites: {e}")
    
    # Persistence
    
    def _load_shortcuts(self) -> None:
        """Load shortcuts from file."""
        try:
            if self.data_file.exists():
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for item in data:
                        sc = Shortcut(**item)
                        self._shortcuts[sc.id] = sc
                logger.info(f"Loaded {len(self._shortcuts)} shortcuts")
            else:
                # Create default shortcuts
                self._create_default_shortcuts()
        
        except Exception as e:
            logger.error(f"Failed to load shortcuts: {e}")
    
    def _save_shortcuts(self) -> None:
        """Save shortcuts to file."""
        try:
            data = [s.to_dict() for s in self.get_all_shortcuts()]
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        
        except Exception as e:
            logger.error(f"Failed to save shortcuts: {e}")
    
    def _load_frequent_sites(self) -> None:
        """Load frequent sites from file."""
        try:
            if self.frequent_sites_file.exists():
                with open(self.frequent_sites_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for item in data:
                        site = FrequentSite(**item)
                        self._frequent_sites[site.url] = site
                logger.info(f"Loaded {len(self._frequent_sites)} frequent sites")
        
        except Exception as e:
            logger.error(f"Failed to load frequent sites: {e}")
    
    def _save_frequent_sites(self) -> None:
        """Save frequent sites to file."""
        try:
            data = [s.to_dict() for s in self.get_top_frequent_sites(limit=50)]
            with open(self.frequent_sites_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        
        except Exception as e:
            logger.error(f"Failed to save frequent sites: {e}")
    
    def _create_default_shortcuts(self) -> None:
        """Create default shortcuts."""
        defaults = [
            ("https://google.com", "Google", "🔍", "#4285F4"),
            ("https://github.com", "GitHub", "🐙", "#333333"),
            ("https://stackoverflow.com", "Stack Overflow", "📚", "#F48024"),
            ("https://reddit.com", "Reddit", "🔥", "#FF4500"),
        ]
        
        for url, title, icon, color in defaults:
            self.add_shortcut(url, title, icon, color)
    
    @staticmethod
    def _extract_domain(url: str) -> str:
        """Extract domain from URL for display."""
        try:
            # Remove protocol
            domain = url.replace("https://", "").replace("http://", "")
            # Get domain part only
            domain = domain.split('/')[0].split('?')[0]
            return domain.capitalize()
        except:
            return url
