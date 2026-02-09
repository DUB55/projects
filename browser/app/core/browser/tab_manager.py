"""
Tab Manager

Manages browser tabs and tab state.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from uuid import uuid4
from datetime import datetime
from PySide6.QtCore import QObject, Signal
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


@dataclass
class BrowserTab:
    """Represents a browser tab."""
    id: str
    title: str
    url: str
    favicon: str = ""
    profile_id: str = ""
    created_at: str = ""
    
    def __post_init__(self):
        if not self.id:
            self.id = str(uuid4())
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


class TabManager(QObject):
    """Manages browser tabs."""
    
    # Signals
    tab_added = Signal(dict)  # BrowserTab dict
    tab_removed = Signal(str)  # tab_id
    tab_activated = Signal(str)  # tab_id
    tab_updated = Signal(str, dict)  # tab_id, updated_data
    
    def __init__(self, profile_id: str = "default"):
        """
        Initialize tab manager.
        
        Args:
            profile_id: Profile ID for this tab manager
        """
        super().__init__()
        self.profile_id = profile_id
        self._tabs: Dict[str, BrowserTab] = {}
        self._active_tab_id: Optional[str] = None
        
        # Create initial tab
        initial_tab = BrowserTab(
            id="",
            title="New Tab",
            url="about:blank",
            profile_id=profile_id
        )
        self._add_tab(initial_tab)
        
        logger.info(f"TabManager initialized for profile: {profile_id}")
    
    def _add_tab(self, tab: BrowserTab) -> str:
        """Add a tab internally."""
        self._tabs[tab.id] = tab
        if not self._active_tab_id:
            self._active_tab_id = tab.id
        self.tab_added.emit(tab.to_dict())
        logger.info(f"Tab added: {tab.id} ({tab.title})")
        return tab.id
    
    def new_tab(self, url: str = "about:blank", title: str = "New Tab") -> str:
        """
        Create a new tab.
        
        Args:
            url: URL to load
            title: Tab title
            
        Returns:
            New tab ID
        """
        tab = BrowserTab(
            id="",
            title=title,
            url=url,
            profile_id=self.profile_id
        )
        return self._add_tab(tab)
    
    def close_tab(self, tab_id: str) -> bool:
        """
        Close a tab.
        
        Args:
            tab_id: Tab ID to close
            
        Returns:
            True if closed successfully
        """
        if tab_id not in self._tabs:
            return False
        
        # Don't allow closing if it's the last tab
        if len(self._tabs) <= 1:
            logger.warning("Cannot close last tab")
            return False
        
        del self._tabs[tab_id]
        self.tab_removed.emit(tab_id)
        
        # Switch to another tab if closed tab was active
        if self._active_tab_id == tab_id:
            remaining_tab_ids = list(self._tabs.keys())
            if remaining_tab_ids:
                self.activate_tab(remaining_tab_ids[0])
        
        logger.info(f"Tab closed: {tab_id}")
        return True
    
    def activate_tab(self, tab_id: str) -> bool:
        """
        Activate a tab.
        
        Args:
            tab_id: Tab ID to activate
            
        Returns:
            True if activated successfully
        """
        if tab_id not in self._tabs:
            return False
        
        self._active_tab_id = tab_id
        self.tab_activated.emit(tab_id)
        logger.info(f"Tab activated: {tab_id}")
        return True
    
    def update_tab(self, tab_id: str, **kwargs) -> bool:
        """
        Update tab data.
        
        Args:
            tab_id: Tab ID to update
            **kwargs: Fields to update (title, url, favicon)
            
        Returns:
            True if updated successfully
        """
        if tab_id not in self._tabs:
            return False
        
        tab = self._tabs[tab_id]
        for key, value in kwargs.items():
            if hasattr(tab, key):
                setattr(tab, key, value)
        
        self.tab_updated.emit(tab_id, kwargs)
        logger.info(f"Tab updated: {tab_id} - {kwargs}")
        return True
    
    def get_tab(self, tab_id: str) -> Optional[BrowserTab]:
        """Get a tab by ID."""
        return self._tabs.get(tab_id)
    
    def get_active_tab(self) -> Optional[BrowserTab]:
        """Get the active tab."""
        if self._active_tab_id:
            return self._tabs.get(self._active_tab_id)
        return None
    
    def get_all_tabs(self) -> List[Dict[str, Any]]:
        """Get all tabs."""
        return [tab.to_dict() for tab in self._tabs.values()]
    
    def get_active_tab_id(self) -> Optional[str]:
        """Get active tab ID."""
        return self._active_tab_id
    
    def get_tab_count(self) -> int:
        """Get total number of tabs."""
        return len(self._tabs)


def init_tab_manager(profile_id: str = "default") -> TabManager:
    """Initialize tab manager for a profile."""
    return TabManager(profile_id)
