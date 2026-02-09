"""
Application State Management Module

Manages global application state with Qt signals/slots.
Provides reactive state management for:
  - Tabs (active tab, tab list, tab properties)
  - Windows (active window, window list)
  - Settings (live updates)
  - Navigation (back/forward stack)
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Dict, Any
from pathlib import Path
from PySide6.QtCore import QObject, Signal, Slot, QTimer
from app.utils.logger import setup_logger
from app.core.browser.browser_profile import (
    get_profile_manager, BrowserProfile
)
from app.core.browser.web_engine import WebEngineManager
from app.core.browser.navigation import NavigationManager
from app.core.browser.session_manager import SessionManager, WindowSnapshot, TabSnapshot
from app.core.browser.bookmarks import BookmarksManager
from app.core.browser.find_in_page import FindInPageManager
from app.core.browser.find_in_page import FindInPageManager
from app.core.browser.speed_dial import SpeedDialManager
from app.core.browser.downloads import DownloadsManager
from app.core.browser.suggest import SuggestionEngine
from app.core.security.passwords import PasswordManager


logger = setup_logger(__name__)


class TabState(Enum):
    """Tab state enum."""
    LOADING = "loading"
    IDLE = "idle"
    ERROR = "error"


@dataclass
class TabGroup:
    """Represents a group of tabs."""
    id: str
    title: str
    color: str  # Hex color
    is_collapsed: bool = False
    tab_ids: List[int] = field(default_factory=list)

@dataclass
class Tab:
    """Represents a browser tab."""
    id: int
    url: str = "about:home"
    title: str = "New Tab"
    is_active: bool = False
    state: TabState = TabState.IDLE
    progress: int = 0  # 0-100
    favicon_url: str = ""
    is_incognito: bool = False
    history_index: int = 0
    history: List[str] = field(default_factory=list)
    profile_id: Optional[str] = None  # Profile this tab belongs to
    group_id: Optional[str] = None  # Group this tab belongs to
    
    def can_go_back(self) -> bool:
        """Check if can navigate back."""
        return self.history_index > 0
    
    def can_go_forward(self) -> bool:
        """Check if can navigate forward."""
        return self.history_index < len(self.history) - 1


@dataclass
class WindowState:
    """Represents a browser window."""
    id: int
    tabs: List[Tab] = field(default_factory=list)
    groups: Dict[str, TabGroup] = field(default_factory=dict)
    active_tab_index: int = 0
    width: int = 1280
    height: int = 800
    x: int = 100
    y: int = 100
    is_maximized: bool = False
    is_fullscreen: bool = False
    
    def get_active_tab(self) -> Optional[Tab]:
        """Get currently active tab."""
        if 0 <= self.active_tab_index < len(self.tabs):
            return self.tabs[self.active_tab_index]
        return None
    
    def add_tab(self, tab: Tab) -> None:
        """Add tab to window."""
        self.tabs.append(tab)
    
    def remove_tab(self, index: int) -> None:
        """Remove tab from window."""
        if 0 <= index < len(self.tabs):
            self.tabs.pop(index)
            if self.active_tab_index >= len(self.tabs):
                self.active_tab_index = len(self.tabs) - 1


class AppState(QObject):
    """
    Central application state manager with profile support.
    
    Manages:
      - Multiple browser profiles (work, personal, etc.)
      - Tabs & windows per profile
      - Navigation history per profile
      - Session auto-save
    
    Signals:
      - tab_created: A new tab was created
      - tab_closed: A tab was closed
      - tab_activated: A tab became active
      - tab_updated: A tab was updated
      - window_created: A new window was created
      - window_closed: A window was closed
      - settings_changed: Settings were updated
      - navigation_changed: Navigation state changed
      - profile_changed: Active profile changed
      - profiles_updated: Profile list updated
    """
    
    # Signals
    tab_created = Signal(int, int)  # window_id, tab_id
    tab_closed = Signal(int, int)  # window_id, tab_id
    tab_activated = Signal(int, int)  # window_id, tab_id
    tab_updated = Signal(int, int)  # window_id, tab_id
    group_created = Signal(int, str)  # window_id, group_id
    group_updated = Signal(int, str)  # window_id, group_id
    group_deleted = Signal(int, str)  # window_id, group_id
    window_created = Signal(int)  # window_id
    window_closed = Signal(int)  # window_id
    settings_changed = Signal(str, object)  # key, value
    navigation_changed = Signal(int, int)  # window_id, tab_id
    profile_changed = Signal(str)  # profile_id
    profiles_updated = Signal(list)  # List[BrowserProfile]
    
    def __init__(self, data_dir: Optional[Path] = None):
        """
        Initialize application state.
        
        Args:
            data_dir: Data directory for profiles
        """
        super().__init__()
        self._windows: Dict[int, WindowState] = {}
        self._active_window_id: Optional[int] = None
        self._next_window_id = 1
        self._next_tab_id = 1
        
        # Configuration
        from app.core.config.config_manager import get_config_manager
        self._config_manager = get_config_manager()
        self._settings = self._config_manager.to_dict()
        
        # Profile support
        self._profile_manager = get_profile_manager()
        self._current_profile_id: Optional[str] = None
        self._web_engines: Dict[str, WebEngineManager] = {}
        self._nav_managers: Dict[str, NavigationManager] = {}
        self._session_managers: Dict[str, SessionManager] = {}
        self._bookmarks_managers: Dict[str, BookmarksManager] = {}
        self._find_managers: Dict[str, FindInPageManager] = {}
        self._speed_dial_managers: Dict[str, SpeedDialManager] = {}
        self._downloads_managers: Dict[str, DownloadsManager] = {}
        self._suggestion_engines: Dict[str, SuggestionEngine] = {}
        self._password_managers: Dict[str, PasswordManager] = {}
        
        # Auto-save timer (30 seconds)
        self._auto_save_timer = QTimer()
        self._auto_save_timer.timeout.connect(self._on_auto_save)
        self._auto_save_timer.start(30000)  # 30 seconds
        
        logger.info("ApplicationState initialized with profile support")
    
    def get_data_dir(self) -> Path:
        """Get application data directory."""
        return self._config_manager.data_dir
    
    # Profile Management
    def set_current_profile(self, profile_id: str) -> bool:
        """
        Switch to profile.
        
        Args:
            profile_id: Profile ID to switch to
        
        Returns:
            True if successful
        """
        profile = self._profile_manager.get_profile(profile_id)
        if not profile:
            logger.warning(f"Profile not found: {profile_id}")
            return False
        
        # Initialize managers for this profile if needed
        if profile_id not in self._web_engines:
            self._web_engines[profile_id] = WebEngineManager(profile.data_path)
            self._nav_managers[profile_id] = NavigationManager(profile.data_path)
            self._session_managers[profile_id] = SessionManager(profile.data_path)
            self._bookmarks_managers[profile_id] = BookmarksManager(profile.data_path)
            self._find_managers[profile_id] = FindInPageManager()
            self._speed_dial_managers[profile_id] = SpeedDialManager(profile.data_path)
            self._downloads_managers[profile_id] = DownloadsManager(profile.data_path)
            self._suggestion_engines[profile_id] = SuggestionEngine(
                self._nav_managers[profile_id],
                self._bookmarks_managers[profile_id]
            )
            self._password_managers[profile_id] = PasswordManager(profile.data_path)
            logger.info(f"Initialized managers for profile: {profile.name}")
        
        self._current_profile_id = profile_id
        self._profile_manager.set_active_profile(profile_id)
        
        logger.info(f"Switched to profile: {profile.name}")
        self.profile_changed.emit(profile_id)
        return True
    
    def get_current_profile(self) -> Optional[BrowserProfile]:
        """Get currently active profile."""
        if self._current_profile_id:
            return self._profile_manager.get_profile(self._current_profile_id)
        return None
    
    def get_web_engine(self, profile_id: Optional[str] = None) -> Optional[WebEngineManager]:
        """Get WebEngine for profile."""
        pid = profile_id or self._current_profile_id
        return self._web_engines.get(pid) if pid else None
    
    def get_navigation_manager(self, profile_id: Optional[str] = None) -> Optional[NavigationManager]:
        """Get NavigationManager for profile."""
        pid = profile_id or self._current_profile_id
        return self._nav_managers.get(pid) if pid else None
    
    def get_session_manager(self, profile_id: Optional[str] = None) -> Optional[SessionManager]:
        """Get SessionManager for profile."""
        pid = profile_id or self._current_profile_id
        return self._session_managers.get(pid) if pid else None
    
    def get_bookmarks_manager(self, profile_id: Optional[str] = None) -> Optional[BookmarksManager]:
        """Get BookmarksManager for profile."""
        pid = profile_id or self._current_profile_id
        return self._bookmarks_managers.get(pid) if pid else None
    
    def get_find_manager(self, profile_id: Optional[str] = None) -> Optional[FindInPageManager]:
        """Get FindInPageManager for profile."""
        pid = profile_id or self._current_profile_id
        return self._find_managers.get(pid) if pid else None
    
    def get_speed_dial_manager(self, profile_id: Optional[str] = None) -> Optional[SpeedDialManager]:
        """Get SpeedDialManager for profile."""
        pid = profile_id or self._current_profile_id
        return self._speed_dial_managers.get(pid) if pid else None
    
    def get_downloads_manager(self, profile_id: Optional[str] = None) -> Optional[DownloadsManager]:
        """Get DownloadsManager for profile."""
        pid = profile_id or self._current_profile_id
        return self._downloads_managers.get(pid) if pid else None

    def get_suggestion_engine(self, profile_id: Optional[str] = None) -> Optional[SuggestionEngine]:
        """Get SuggestionEngine for profile."""
        pid = profile_id or self._current_profile_id
        return self._suggestion_engines.get(pid) if pid else None
    
    def get_password_manager(self, profile_id: Optional[str] = None) -> Optional[PasswordManager]:
        """Get PasswordManager for profile."""
        pid = profile_id or self._current_profile_id
        return self._password_managers.get(pid) if pid else None
    
    # Settings Management
    def get_setting(self, key: str, default: Any = None) -> Any:
        """Get setting value."""
        return self._config_manager.get(key, default)
    
    def set_setting(self, key: str, value: Any) -> bool:
        """Set setting value."""
        if self._config_manager.set(key, value):
            self._config_manager.save_config()
            self._settings[key] = value
            self.settings_changed.emit(key, value)
            logger.info(f"Setting changed: {key} = {value}")
            return True
        return False
        
    def get_all_settings(self) -> Dict[str, Any]:
        """Get all settings."""
        return self._config_manager.to_dict()

    # Window Management
    def create_window(self) -> int:
        """
        Create new window.
        
        Returns:
            Window ID
        """
        window_id = self._next_window_id
        self._next_window_id += 1
        
        window = WindowState(id=window_id)
        self._windows[window_id] = window
        self._active_window_id = window_id
        
        # Create default tab
        tab_id = self.create_tab(window_id)
        logger.info(f"Created window {window_id} with tab {tab_id}")
        
        self.window_created.emit(window_id)
        return window_id
    
    def close_window(self, window_id: int) -> bool:
        """
        Close window.
        
        Args:
            window_id: ID of window to close
        
        Returns:
            True if successful
        """
        if window_id in self._windows:
            del self._windows[window_id]
            
            # Update active window
            if self._active_window_id == window_id:
                self._active_window_id = next(iter(self._windows.keys()), None)
            
            logger.info(f"Closed window {window_id}")
            self.window_closed.emit(window_id)
            return True
        
        return False
    
    def get_window(self, window_id: int) -> Optional[WindowState]:
        """Get window by ID."""
        return self._windows.get(window_id)
    
    def get_windows(self) -> List[WindowState]:
        """Get all windows."""
        return list(self._windows.values())
    
    def set_active_window(self, window_id: int) -> bool:
        """Set active window."""
        if window_id in self._windows:
            self._active_window_id = window_id
            return True
        return False
    
    def get_active_window(self) -> Optional[WindowState]:
        """Get active window."""
        if self._active_window_id:
            return self._windows.get(self._active_window_id)
        return None
    
    # Tab Group Management
    def create_group(self, window_id: int, title: str, color: str) -> str:
        """Create a new tab group."""
        window = self._windows.get(window_id)
        if not window:
            return ""
        
        import uuid
        group_id = str(uuid.uuid4())
        group = TabGroup(id=group_id, title=title, color=color)
        window.groups[group_id] = group
        
        self.group_created.emit(window_id, group_id)
        return group_id

    def add_tab_to_group(self, window_id: int, tab_id: int, group_id: str) -> None:
        """Add a tab to a group."""
        window = self._windows.get(window_id)
        if not window or group_id not in window.groups:
            return
        
        # Remove from old group if any
        tab = next((t for t in window.tabs if t.id == tab_id), None)
        if tab and tab.group_id:
            old_group = window.groups.get(tab.group_id)
            if old_group and tab_id in old_group.tab_ids:
                old_group.tab_ids.remove(tab_id)
        
        if tab:
            tab.group_id = group_id
            window.groups[group_id].tab_ids.append(tab_id)
            self.group_updated.emit(window_id, group_id)
            self.tab_updated.emit(window_id, tab_id)

    def remove_tab_from_group(self, window_id: int, tab_id: int) -> None:
        """Remove a tab from its group."""
        window = self._windows.get(window_id)
        if not window:
            return
            
        tab = next((t for t in window.tabs if t.id == tab_id), None)
        if tab and tab.group_id:
            group = window.groups.get(tab.group_id)
            if group and tab_id in group.tab_ids:
                group.tab_ids.remove(tab_id)
                group_id = tab.group_id
                tab.group_id = None
                self.group_updated.emit(window_id, group_id)
                self.tab_updated.emit(window_id, tab_id)

    def toggle_group_collapse(self, window_id: int, group_id: str) -> None:
        """Toggle group collapse state."""
        window = self._windows.get(window_id)
        if not window or group_id not in window.groups:
            return
            
        group = window.groups[group_id]
        group.is_collapsed = not group.is_collapsed
        self.group_updated.emit(window_id, group_id)

    # Tab Management
    def create_tab(self, window_id: int, url: str = "about:home") -> int:
        """
        Create new tab in window (profile-scoped).
        
        Args:
            window_id: ID of window
            url: Initial URL
        
        Returns:
            Tab ID
        """
        window = self.get_window(window_id)
        if not window:
            logger.warning(f"Window {window_id} not found")
            return -1
        
        tab_id = self._next_tab_id
        self._next_tab_id += 1
        
        # Scope tab to current profile
        profile_id = self._current_profile_id or "default"
        tab = Tab(id=tab_id, url=url, profile_id=profile_id)
        window.add_tab(tab)
        
        # Add to navigation history
        nav = self.get_navigation_manager(profile_id)
        if nav and url != "about:home":
            nav.add_entry(url, tab.title)
        
        logger.info(f"Created tab {tab_id} in window {window_id} (profile: {profile_id})")
        self.tab_created.emit(window_id, tab_id)
        
        return tab_id
    
    def close_tab(self, window_id: int, tab_index: int) -> bool:
        """
        Close tab.
        
        Args:
            window_id: ID of window
            tab_index: Index of tab
        
        Returns:
            True if successful
        """
        window = self.get_window(window_id)
        if not window or tab_index >= len(window.tabs):
            return False
        
        tab_id = window.tabs[tab_index].id
        window.remove_tab(tab_index)
        
        logger.info(f"Closed tab {tab_id} in window {window_id}")
        self.tab_closed.emit(window_id, tab_id)
        
        # Close window if last tab closed
        if len(window.tabs) == 0:
            self.close_window(window_id)
        
        return True
    
    def get_tab(self, window_id: int, tab_index: int) -> Optional[Tab]:
        """Get tab by window and index."""
        window = self.get_window(window_id)
        if window and 0 <= tab_index < len(window.tabs):
            return window.tabs[tab_index]
        return None
    
    def set_active_tab(self, window_id: int, tab_index: int) -> bool:
        """
        Set active tab.
        
        Args:
            window_id: ID of window
            tab_index: Index of tab
        
        Returns:
            True if successful
        """
        window = self.get_window(window_id)
        if not window or tab_index >= len(window.tabs):
            return False
        
        # Deactivate old active tab
        old_tab = window.get_active_tab()
        if old_tab:
            old_tab.is_active = False
        
        # Activate new tab
        window.active_tab_index = tab_index
        new_tab = window.get_active_tab()
        if new_tab:
            new_tab.is_active = True
            logger.info(f"Activated tab {new_tab.id} in window {window_id}")
            self.tab_activated.emit(window_id, new_tab.id)
            return True
        
        return False
    
    def update_tab(self, window_id: int, tab_id: int, **kwargs) -> bool:
        """
        Update tab properties.
        
        Args:
            window_id: ID of window
            tab_id: ID of tab
            **kwargs: Properties to update (url, title, progress, etc.)
        
        Returns:
            True if successful
        """
        window = self.get_window(window_id)
        if not window:
            return False
        
        for tab in window.tabs:
            if tab.id == tab_id:
                for key, value in kwargs.items():
                    if hasattr(tab, key):
                        setattr(tab, key, value)
                
                self.tab_updated.emit(window_id, tab_id)
                return True
        
        return False
    
    # Settings Management
    def set_setting(self, key: str, value: Any) -> None:
        """Set setting value."""
        self._settings[key] = value
        self.settings_changed.emit(key, value)
        logger.debug(f"Setting changed: {key} = {value}")
    
    def get_setting(self, key: str, default: Any = None) -> Any:
        """Get setting value."""
        return self._settings.get(key, default)
    
    def get_settings(self) -> Dict[str, Any]:
        """Get all settings."""
        return self._settings.copy()
    
    # Navigation
    def navigate_to(self, window_id: int, tab_index: int, url: str) -> bool:
        """
        Navigate tab to URL.
        
        Args:
            window_id: ID of window
            tab_index: Index of tab
            url: URL to navigate to
        
        Returns:
            True if successful
        """
        tab = self.get_tab(window_id, tab_index)
        if not tab:
            return False
        
        # Add to navigation history
        if tab.profile_id:
            nav = self.get_navigation_manager(tab.profile_id)
            if nav:
                nav.add_entry(url, tab.title)
        
        # Update tab
        return self.update_tab(window_id, tab.id, url=url, state=TabState.LOADING)
    
    def go_back(self, window_id: int, tab_index: int) -> bool:
        """
        Navigate back in tab history.
        
        Args:
            window_id: ID of window
            tab_index: Index of tab
        
        Returns:
            True if successful
        """
        tab = self.get_tab(window_id, tab_index)
        if not tab or not tab.profile_id:
            return False
        
        nav = self.get_navigation_manager(tab.profile_id)
        if not nav or not nav.can_go_back():
            return False
        
        url = nav.go_back()
        if url:
            return self.update_tab(window_id, tab.id, url=url, state=TabState.LOADING)
        
        return False
    
    def go_forward(self, window_id: int, tab_index: int) -> bool:
        """
        Navigate forward in tab history.
        
        Args:
            window_id: ID of window
            tab_index: Index of tab
        
        Returns:
            True if successful
        """
        tab = self.get_tab(window_id, tab_index)
        if not tab or not tab.profile_id:
            return False
        
        nav = self.get_navigation_manager(tab.profile_id)
        if not nav or not nav.can_go_forward():
            return False
        
        url = nav.go_forward()
        if url:
            return self.update_tab(window_id, tab.id, url=url, state=TabState.LOADING)
        
        return False
    
    def can_go_back(self, window_id: int, tab_index: int) -> bool:
        """Check if can go back."""
        tab = self.get_tab(window_id, tab_index)
        if not tab or not tab.profile_id:
            return False
        
        nav = self.get_navigation_manager(tab.profile_id)
        return nav.can_go_back() if nav else False
    
    def can_go_forward(self, window_id: int, tab_index: int) -> bool:
        """Check if can go forward."""
        tab = self.get_tab(window_id, tab_index)
        if not tab or not tab.profile_id:
            return False
        
        nav = self.get_navigation_manager(tab.profile_id)
        return nav.can_go_forward() if nav else False
    
    # Session Management
    def auto_save_session(self) -> None:
        """Auto-save current session for all profiles."""
        if not self._current_profile_id:
            return
        
        try:
            sm = self.get_session_manager(self._current_profile_id)
            if not sm:
                return
            
            # Build window snapshots
            windows = []
            for window in self.get_windows():
                tabs = []
                for i, tab in enumerate(window.tabs):
                    if tab.profile_id == self._current_profile_id:
                        tab_snap = TabSnapshot(
                            tab_id=str(tab.id),
                            url=tab.url,
                            title=tab.title,
                            position=i,
                            is_active=tab.is_active,
                            group_id=tab.group_id
                        )
                        tabs.append(tab_snap)
                
                groups = []
                for group in window.groups.values():
                    group_snap = GroupSnapshot(
                        group_id=group.id,
                        title=group.title,
                        color=group.color,
                        is_collapsed=group.is_collapsed
                    )
                    groups.append(group_snap)
                
                if tabs:
                    active_tab_id = str(window.get_active_tab().id) if window.get_active_tab() else None
                    window_snap = WindowSnapshot(
                        window_id=str(window.id),
                        x=window.x,
                        y=window.y,
                        width=window.width,
                        height=window.height,
                        is_maximized=window.is_maximized,
                        tabs=tabs,
                        groups=groups,
                        active_tab_id=active_tab_id
                    )
                    windows.append(window_snap)
            
            if windows:
                sm.save_current_session(windows)
                logger.debug(f"Auto-saved session for profile: {self._current_profile_id}")
        
        except Exception as e:
            logger.error(f"Failed to auto-save session: {e}")
    
    @Slot()
    def _on_auto_save(self) -> None:
        """Timer callback for auto-save."""
        self.auto_save_session()
    
    def restore_session(self, profile_id: Optional[str] = None) -> bool:
        """
        Restore session for profile.
        
        Args:
            profile_id: Profile to restore session for
        
        Returns:
            True if restored
        """
        pid = profile_id or self._current_profile_id
        if not pid:
            return False
        
        try:
            sm = self.get_session_manager(pid)
            if not sm:
                return False
            
            sessions = sm.get_sessions()
            if not sessions:
                return False
            
            windows = sm.restore_session(sessions[0].session_id)
            if not windows:
                return False
            
            # Reconstruct windows/tabs/groups
            for window_snap in windows:
                window_id = self.create_window()
                window = self.get_window(window_id)
                
                # Restore groups
                for group_snap in window_snap.groups:
                    group = TabGroup(
                        id=group_snap.group_id,
                        title=group_snap.title,
                        color=group_snap.color,
                        is_collapsed=group_snap.is_collapsed
                    )
                    window.groups[group.id] = group
                
                # Restore tabs
                for tab_snap in window_snap.tabs:
                    tab_id = self.create_tab(window_id, tab_snap.url)
                    if tab_snap.group_id:
                        self.add_tab_to_group(window_id, tab_id, tab_snap.group_id)
            
            logger.info(f"Restored session for profile: {pid}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to restore session: {e}")
            return False
    
    # QML Property Getters
    
    def get_all_profiles(self) -> List[Dict[str, Any]]:
        """Get all profiles as dictionaries for QML binding."""
        try:
            profiles = self._profile_manager.get_all_profiles()
            return [
                {
                    'id': p.id,
                    'name': p.name,
                    'icon_color': p.icon_color,
                    'description': p.description
                }
                for p in profiles
            ]
        except Exception as e:
            logger.error(f"Failed to get profiles: {e}")
            return []
    
    def get_current_profile_name(self) -> str:
        """Get current profile name."""
        profile = self.get_current_profile()
        return profile.name if profile else "Default"
    
    def get_current_profile_color(self) -> str:
        """Get current profile color."""
        profile = self.get_current_profile()
        return profile.icon_color if profile else "#4CAF50"
    
    def get_speed_dial_shortcuts(self) -> List[Dict[str, Any]]:
        """Get speed dial shortcuts for current profile."""
        try:
            manager = self.get_speed_dial_manager()
            if not manager:
                return []
            return [
                {
                    'id': s.id,
                    'title': s.title,
                    'url': s.url,
                    'icon': s.icon,
                    'color': s.color,
                    'domain': self._extract_domain(s.url)
                }
                for s in manager.get_all_shortcuts()
            ]
        except Exception as e:
            logger.error(f"Failed to get speed dial shortcuts: {e}")
            return []
    
    def get_frequent_sites(self, limit: int = 8) -> List[Dict[str, Any]]:
        """Get frequently visited sites for current profile."""
        try:
            manager = self.get_speed_dial_manager()
            if not manager:
                return []
            return [
                {
                    'title': s.title,
                    'url': s.url,
                    'icon': s.icon,
                    'color': s.color,
                    'visit_count': s.visit_count,
                    'domain': self._extract_domain(s.url)
                }
                for s in manager.get_top_frequent_sites(limit)
            ]
        except Exception as e:
            logger.error(f"Failed to get frequent sites: {e}")
            return []
    
    @Slot(str, str)
    def add_speed_dial_shortcut(self, url: str, title: str = "") -> bool:
        """Add a speed dial shortcut."""
        try:
            manager = self.get_speed_dial_manager()
            if manager:
                manager.add_shortcut(url, title)
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to add speed dial shortcut: {e}")
            return False
    
    @Slot(str)
    def record_site_visit(self, url: str) -> None:
        """Record a site visit."""
        try:
            manager = self.get_speed_dial_manager()
            if manager:
                manager.record_visit(url)
        except Exception as e:
            logger.error(f"Failed to record site visit: {e}")
    
    @staticmethod
    def _extract_domain(url: str) -> str:
        """Extract domain from URL."""
        try:
            domain = url.replace("https://", "").replace("http://", "")
            domain = domain.split('/')[0].split('?')[0]
            return domain
        except:
            return url


# Global state instance
_app_state: Optional[AppState] = None


def get_app_state() -> AppState:
    """Get global app state instance."""
    global _app_state
    if _app_state is None:
        _app_state = AppState()
    return _app_state


def init_app_state(data_dir: Optional[Path] = None) -> AppState:
    """
    Initialize global app state instance.
    
    Args:
        data_dir: Data directory for profiles
    
    Returns:
        AppState instance
    """
    global _app_state
    _app_state = AppState(data_dir)
    return _app_state
