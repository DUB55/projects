"""
QML Bridge Module

Exposes AppState data to QML with proper type conversions and bindings.
"""

from typing import Any, List, Dict
from PySide6.QtCore import QObject, Property, Signal, Slot
from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import QmlElement
from app.utils.logger import setup_logger
from app.core.state.app_state import AppState

logger = setup_logger(__name__)

QML_IMPORT_NAME = "app.bridge"
QML_IMPORT_MAJOR_VERSION = 1


@QmlElement
class AppBridge(QObject):
    """
    Bridge between Python AppState and QML UI.
    
    Exposes AppState data and methods to QML with proper type conversions.
    Handles signal/slot connections between QML and Python.
    """
    
    # Signals for QML
    profilesChanged = Signal()
    speedDialChanged = Signal()
    frequentSitesChanged = Signal()
    profileNameChanged = Signal()
    profileColorChanged = Signal()
    
    # New Signals for Phase 2/3
    bookmarksChanged = Signal()
    historyChanged = Signal()
    downloadsChanged = Signal()
    passwordsChanged = Signal() # Phase 4
    tabsChanged = Signal() # Phase 5 (Tabs)
    groupsChanged = Signal()
    currentTabChanged = Signal()


    def __init__(self, app_state: AppState):
        """
        Initialize QML bridge.
        
        Args:
            app_state: AppState instance to bridge
        """
        super().__init__()
        self._app_state = app_state
        self._all_profiles: List[Dict[str, Any]] = []
        self._speed_dial_shortcuts: List[Dict[str, Any]] = []
        self._frequent_sites: List[Dict[str, Any]] = []
        
        # Connect AppState signals
        if hasattr(app_state, 'profile_changed'):
            app_state.profile_changed.connect(self._on_profile_changed)
        
        if hasattr(app_state, 'profiles_updated'):
            app_state.profiles_updated.connect(self._on_profiles_updated)
            
        # Connect Tab signals
        app_state.tab_created.connect(self._on_tab_created)
        app_state.tab_closed.connect(self._on_tab_closed)
        app_state.tab_activated.connect(self._on_tab_activated)
        app_state.tab_updated.connect(self._on_tab_updated)
        
        # Connect Group signals
        app_state.group_created.connect(self._on_groups_changed)
        app_state.group_updated.connect(self._on_groups_changed)
        app_state.group_deleted.connect(self._on_groups_changed)

        
        # Initial data load
        self._refresh_all()
        
        logger.info("AppBridge initialized")
    
    # Properties for QML binding
    
    @Property('QVariant', notify=profilesChanged)
    def allProfiles(self) -> List[Dict[str, Any]]:
        """Get all profiles."""
        return self._all_profiles

    # --- Tab Properties ---
    @Property('QVariant', notify=tabsChanged)
    def tabs(self) -> List[Dict[str, Any]]:
        """Get all tabs for active window."""
        window = self._app_state.get_active_window()
        if not window:
            return []
        
        return [{
            "id": t.id,
            "title": t.title or "New Tab",
            "url": t.url,
            "loading": t.state.value == "loading",
            "groupId": t.group_id
        } for t in window.tabs]

    @Property('QVariant', notify=groupsChanged)
    def tabGroups(self) -> List[Dict[str, Any]]:
        """Get all tab groups for active window."""
        window = self._app_state.get_active_window()
        if not window:
            return []
            
        return [{
            "id": g.id,
            "title": g.title,
            "color": g.color,
            "isCollapsed": g.is_collapsed,
            "tabIds": g.tab_ids
        } for g in window.groups.values()]

    @Property(int, notify=currentTabChanged)
    def currentTabIndex(self) -> int:
        """Get active tab index."""
        window = self._app_state.get_active_window()
        return window.active_tab_index if window else -1
    
    @Property('QVariant', notify=speedDialChanged)
    def speedDialShortcuts(self) -> List[Dict[str, Any]]:
        """Get speed dial shortcuts."""
        return self._speed_dial_shortcuts
    
    @Property('QVariant', notify=frequentSitesChanged)
    def frequentSites(self) -> List[Dict[str, Any]]:
        """Get frequently visited sites."""
        return self._frequent_sites
    
    @Property(str, notify=profileNameChanged)
    def currentProfileName(self) -> str:
        """Get current profile name."""
        return self._app_state.get_current_profile_name()
    
    @Property(str, notify=profileColorChanged)
    def currentProfileColor(self) -> str:
        """Get current profile color."""
        return self._app_state.get_current_profile_color()
    
    @Property(str, notify=profilesChanged)
    def currentProfileId(self) -> str:
        """Get ID of current profile."""
        profile = self._app_state.get_current_profile()
        return profile.id if profile else ""
    
    @Property(str, notify=profilesChanged)
    def persistentStoragePath(self) -> str:
        """Get persistent storage path for current profile."""
        profile = self._app_state.get_current_profile()
        if profile:
            path = str((profile.data_path / "storage").absolute())
            logger.debug(f"Persistent storage path: {path}")
            return path
        return ""

    @Property(str, notify=profilesChanged)
    def cachePath(self) -> str:
        """Get cache path for current profile."""
        profile = self._app_state.get_current_profile()
        if profile:
            path = str((profile.data_path / "cache").absolute())
            logger.debug(f"Cache path: {path}")
            return path
        return ""
    
    # --- Bookmarks Properties ---
    @Property('QVariant', notify=bookmarksChanged)
    def bookmarksTree(self) -> Dict[str, Any]:
        """Get complete bookmarks tree."""
        bm = self._app_state.get_bookmarks_manager()
        if not bm:
            return {}
        
        # Build tree (simplified for now: root folders + their bookmarks)
        # In a real impl, this would be recursive
        root_folders = bm.get_subfolders(None)
        root_bookmarks = bm.get_bookmarks_in_folder(None)
        
        return {
            "folders": [f.to_dict() for f in root_folders],
            "bookmarks": [b.to_dict() for b in root_bookmarks]
        }
    
    # --- Downloads Properties ---
    @Property('QVariant', notify=downloadsChanged)
    def recentDownloads(self) -> List[Dict[str, Any]]:
        """Get recent downloads."""
        dm = self._app_state.get_downloads_manager()
        if not dm:
            return []
        return [item.to_dict() for item in dm.get_all_downloads()]
        
    # --- Passwords Properties ---
    @Property('QVariant', notify=passwordsChanged)
    def savedPasswords(self) -> List[Dict[str, Any]]:
        """Get all saved passwords (metadata only)."""
        pm = self._app_state.get_password_manager()
        if not pm:
            return []
        return [entry.to_dict() for entry in pm.get_all_passwords()]

    # --- Settings Properties ---
    @Property('QVariant', notify=profilesChanged) # Re-using a signal for now or could add settingsChanged
    def settings(self) -> Dict[str, Any]:
        """Get all settings."""
        return self._app_state.get_all_settings()
    
    # --- Slots for QML calls ---
    
    @Slot(str, 'QVariant')
    def setSetting(self, key: str, value: Any) -> None:
        """
        Set a setting value.
        
        Args:
            key: Setting key
            value: New value
        """
        try:
            self._app_state.set_setting(key, value)
            # Emit signal to notify QML (simplification: re-using profilesChanged or adding new one)
            # Ideally we should have a specific signal, but for now relying on AppState signal
            # which we can connect to a bridge signal if we add it
        except Exception as e:
            logger.error(f"Error setting config: {e}")
            
    @Slot(str, 'QVariant')
    def getSetting(self, key: str, default: Any = None) -> Any:
        """Get a setting value."""
        return self._app_state.get_setting(key, default)

    @Slot(str)
    def selectProfile(self, profile_id: str) -> None:
        """
        Select a profile from QML.
        
        Args:
            profile_id: Profile ID to select
        """
        try:
            if self._app_state.set_current_profile(profile_id):
                self._refresh_all()
                logger.info(f"Selected profile: {profile_id}")
            else:
                logger.warning(f"Failed to select profile: {profile_id}")
        except Exception as e:
            logger.error(f"Error selecting profile: {e}")
    
    @Slot()
    def refreshProfiles(self) -> None:
        """Refresh profile list."""
        self._refresh_profiles()
    
    @Slot()
    def refreshSpeedDial(self) -> None:
        """Refresh speed dial shortcuts."""
        self._refresh_speed_dial()
    
    @Slot(str, str)
    def addSpeedDialShortcut(self, url: str, title: str = "") -> None:
        """
        Add speed dial shortcut from QML.
        
        Args:
            url: Website URL
            title: Display title
        """
        try:
            if self._app_state.add_speed_dial_shortcut(url, title):
                self._refresh_speed_dial()
                logger.info(f"Added shortcut: {title or url}")
        except Exception as e:
            logger.error(f"Error adding shortcut: {e}")
    
    @Slot(str)
    def recordSiteVisit(self, url: str) -> None:
        """
        Record a site visit from QML.
        
        Args:
            url: Website URL visited
        """
        try:
            self._app_state.record_site_visit(url)
            self._refresh_frequent_sites()
            
            # Also record history
            nav = self._app_state.get_navigation_manager()
            if nav:
                nav.add_entry(url)
                self.historyChanged.emit()
        except Exception as e:
            logger.error(f"Error recording site visit: {e}")
            
    # --- Bookmarks Slots ---
    @Slot(str, str)
    def addBookmark(self, url: str, title: str) -> None:
        """Add bookmark."""
        try:
            bm = self._app_state.get_bookmarks_manager()
            if bm:
                bm.create_bookmark(url, title)
                self.bookmarksChanged.emit()
        except Exception as e:
            logger.error(f"Error adding bookmark: {e}")
            
    @Slot(str)
    def removeBookmark(self, bookmark_id: str) -> None:
        """Remove bookmark."""
        try:
            bm = self._app_state.get_bookmarks_manager()
            if bm:
                bm.delete_bookmark(bookmark_id)
                self.bookmarksChanged.emit()
        except Exception as e:
            logger.error(f"Error removing bookmark: {e}")

    # --- History Slots ---
    @Slot(str)
    def searchHistory(self, query: str) -> List[Dict[str, Any]]:
        """Search history."""
        try:
            nav = self._app_state.get_navigation_manager()
            if nav:
                results = nav.search_history(query)
                return [entry.to_dict() for entry in results]
            return []
        except Exception as e:
            logger.error(f"Error searching history: {e}")
            return []

    # --- Suggestion Slots ---
    @Slot(str)
    def getSuggestions(self, query: str) -> List[Dict[str, Any]]:
        """Get omnibox suggestions."""
        try:
            engine = self._app_state.get_suggestion_engine()
            if engine:
                results = engine.get_suggestions(query)
                return [s.to_dict() for s in results]
            return []
        except Exception as e:
            logger.error(f"Error getting suggestions: {e}")
            return []
            
    # --- Password Slots ---
    @Slot(str, str, str)
    def savePassword(self, url: str, username: str, password: str) -> None:
        """Save password."""
        try:
            pm = self._app_state.get_password_manager()
            if pm:
                pm.add_password(url, username, password)
                self.passwordsChanged.emit()
        except Exception as e:
            logger.error(f"Error saving password: {e}")
            
    @Slot(str)
    def deletePassword(self, entry_id: str) -> None:
        """Delete password."""
        try:
            pm = self._app_state.get_password_manager()
            if pm:
                pm.delete_password(entry_id)
                self.passwordsChanged.emit()
        except Exception as e:
            logger.error(f"Error deleting password: {e}")
            
    @Slot(str)
    def getPasswordValue(self, entry_id: str) -> str:
        """Get actual password value."""
        try:
            pm = self._app_state.get_password_manager()
            if pm:
                return pm.get_password(entry_id) or ""
            return ""
        except Exception as e:
            logger.error(f"Error getting password value: {e}")
            return ""

    # --- Tab Slots ---
    @Slot(str)
    @Slot()
    def newTab(self, url: str = "about:home") -> None:
        """Create a new tab."""
        try:
            window = self._app_state.get_active_window()
            if window:
                self._app_state.create_tab(window.id, url)
                # Auto-activate the new tab (it's the last one)
                new_index = len(window.tabs) - 1
                if new_index >= 0:
                    self._app_state.set_active_tab(window.id, new_index)
        except Exception as e:
            logger.error(f"Error creating tab: {e}")

    @Slot()
    def closeAllTabs(self) -> None:
        """Close all tabs in active window."""
        try:
            window = self._app_state.get_active_window()
            if window:
                # Close all tabs one by one (this might close the window if all are closed)
                # We iterate backwards to maintain index stability
                for i in range(len(window.tabs) - 1, -1, -1):
                    self._app_state.close_tab(window.id, i)
        except Exception as e:
            logger.error(f"Error closing all tabs: {e}")

    @Slot()
    def clearAllHistory(self) -> None:
        """Clear all navigation history."""
        try:
            nav = self._app_state.get_navigation_manager()
            if nav:
                nav.clear_history()
                self.historyChanged.emit()
                logger.info("All history cleared")
        except Exception as e:
            logger.error(f"Error clearing history: {e}")

    @Slot()
    def resetSettings(self) -> None:
        """Reset all settings to default."""
        try:
            # This is a simplified reset
            default_settings = {
                "theme": "auto",
                "accent_color": "#0078D4",
                "show_tab_preview": True,
                "search_engine": "duckduckgo",
                "start_page": "https://duckduckgo.com",
                "homePage": "https://duckduckgo.com"
            }
            for key, val in default_settings.items():
                self._app_state.set_setting(key, val)
            logger.info("Settings reset to defaults")
        except Exception as e:
            logger.error(f"Error resetting settings: {e}")

    @Slot(int)
    def closeTab(self, index: int) -> None:
        """Close tab at index."""
        try:
            window = self._app_state.get_active_window()
            if window:
                self._app_state.close_tab(window.id, index)
        except Exception as e:
            logger.error(f"Error closing tab: {e}")

    @Slot(int)
    def activateTab(self, index: int) -> None:
        """Activate tab at index."""
        try:
            window = self._app_state.get_active_window()
            if window:
                self._app_state.set_active_tab(window.id, index)
        except Exception as e:
            logger.error(f"Error activating tab: {e}")
            
    @Slot(int, str, str)
    def updateTab(self, index: int, url: str, title: str) -> None:
        """Update tab state from UI (e.g. navigation finished)."""
        try:
            window = self._app_state.get_active_window()
            if window and 0 <= index < len(window.tabs):
                tab = window.tabs[index]
                self._app_state.update_tab(window.id, tab.id, url=url, title=title)
        except Exception as e:
            logger.error(f"Error updating tab: {e}")

    @Slot(str)
    def setClipboardText(self, text: str) -> None:
        """Set text to system clipboard."""
        try:
            from PySide6.QtGui import QGuiApplication
            clipboard = QGuiApplication.clipboard()
            clipboard.setText(text)
            logger.debug(f"Copied to clipboard: {text[:50]}...")
        except Exception as e:
            logger.error(f"Error setting clipboard: {e}")

    # --- Private methods ---
    
    def _refresh_all(self) -> None:
        """Refresh all data."""
        self._refresh_profiles()
        self._refresh_speed_dial()
        self._refresh_frequent_sites()
        self.bookmarksChanged.emit()
        self.historyChanged.emit()
        self.downloadsChanged.emit()
        self.passwordsChanged.emit()
        self.tabsChanged.emit()
        self.currentTabChanged.emit()
    
    def _refresh_profiles(self) -> None:
        """Refresh profile list."""
        try:
            self._all_profiles = self._app_state.get_all_profiles()
            self.profilesChanged.emit()
            self.profileNameChanged.emit()
            self.profileColorChanged.emit()
        except Exception as e:
            logger.error(f"Error refreshing profiles: {e}")
    
    def _refresh_speed_dial(self) -> None:
        """Refresh speed dial shortcuts."""
        try:
            self._speed_dial_shortcuts = self._app_state.get_speed_dial_shortcuts()
            self.speedDialChanged.emit()
        except Exception as e:
            logger.error(f"Error refreshing speed dial: {e}")
    
    def _refresh_frequent_sites(self) -> None:
        """Refresh frequent sites."""
        try:
            self._frequent_sites = self._app_state.get_frequent_sites()
            self.frequentSitesChanged.emit()
        except Exception as e:
            logger.error(f"Error refreshing frequent sites: {e}")
    
    def _on_profile_changed(self, profile_id: str) -> None:
        """Handle profile change signal."""
        self._refresh_all()
        logger.debug(f"Profile changed to: {profile_id}")
    
    def _on_profiles_updated(self, profiles: List) -> None:
        """Handle profiles updated signal."""
        self._refresh_profiles()
        logger.debug(f"Profiles updated: {len(profiles)} profiles")

    def _on_tab_created(self, window_id: int, tab_id: int):
        self.tabsChanged.emit()
        self.currentTabChanged.emit()
        
    def _on_tab_closed(self, window_id: int, tab_id: int):
        self.tabsChanged.emit()
        self.currentTabChanged.emit()
        
    def _on_tab_activated(self, window_id: int, tab_id: int):
        self.currentTabChanged.emit()
        
    def _on_tab_updated(self, window_id: int, tab_id: int):
        self.tabsChanged.emit()

    # --- Tab Group Slots ---
    @Slot(str, str, result=str)
    def createGroup(self, title: str, color: str) -> str:
        """Create a new tab group."""
        window = self._app_state.get_active_window()
        if window:
            return self._app_state.create_group(window.id, title, color)
        return ""

    @Slot(int, str)
    def addTabToGroup(self, tab_id: int, group_id: str) -> None:
        """Add a tab to a group."""
        window = self._app_state.get_active_window()
        if window:
            self._app_state.add_tab_to_group(window.id, tab_id, group_id)

    @Slot(int)
    def removeTabFromGroup(self, tab_id: int) -> None:
        """Remove a tab from its group."""
        window = self._app_state.get_active_window()
        if window:
            self._app_state.remove_tab_from_group(window.id, tab_id)

    @Slot(str)
    def toggleGroupCollapse(self, group_id: str) -> None:
        """Toggle group collapse state."""
        window = self._app_state.get_active_window()
        if window:
            self._app_state.toggle_group_collapse(window.id, group_id)

    def _on_groups_changed(self, window_id: int, group_id: str = "") -> None:
        """Handle group change signals from AppState."""
        self.groupsChanged.emit()
        self.tabsChanged.emit() # Groups change often affects tab display


def create_qml_bridge(app_state: AppState) -> AppBridge:
    """
    Create and register QML bridge.
    
    Args:
        app_state: AppState instance
    
    Returns:
        AppBridge instance
    """
    return AppBridge(app_state)
