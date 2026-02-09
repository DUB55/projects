"""
Keyboard Shortcuts Handler

Manages global keyboard shortcuts for the browser.
"""

from PySide6.QtCore import QObject, Slot, Qt
from PySide6.QtGui import QKeySequence, QShortcut
from PySide6.QtWidgets import QApplication
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class KeyboardShortcutsManager(QObject):
    """Manages keyboard shortcuts for the browser."""
    
    # Common shortcuts
    SHORTCUT_NEW_TAB = "Ctrl+T"
    SHORTCUT_CLOSE_TAB = "Ctrl+W"
    SHORTCUT_FIND = "Ctrl+F"
    SHORTCUT_RELOAD = "F5"
    SHORTCUT_HARD_RELOAD = "Ctrl+F5"
    SHORTCUT_BACK = "Alt+Left"
    SHORTCUT_FORWARD = "Alt+Right"
    SHORTCUT_HOME = "Alt+Home"
    SHORTCUT_ADDRESS_BAR = "Ctrl+L"
    SHORTCUT_HISTORY = "Ctrl+H"
    SHORTCUT_BOOKMARKS = "Ctrl+D"
    SHORTCUT_SETTINGS = "Ctrl+,"
    SHORTCUT_QUIT = "Ctrl+Q"
    SHORTCUT_FOCUS_SEARCH = "Ctrl+K"
    
    def __init__(self, parent=None):
        """
        Initialize keyboard shortcuts manager.
        
        Args:
            parent: Parent QObject
        """
        super().__init__(parent)
        self._app = QApplication.instance()
        self._shortcuts = {}
        self._handlers = {}
        
        logger.info("KeyboardShortcutsManager initialized")
    
    def register_shortcut(self, name: str, key_sequence: str, handler: callable) -> bool:
        """
        Register a keyboard shortcut.
        
        Args:
            name: Name of the shortcut
            key_sequence: Key sequence (e.g., "Ctrl+T")
            handler: Callable to execute when shortcut is triggered
            
        Returns:
            True if registered successfully
        """
        try:
            shortcut = QShortcut(QKeySequence(key_sequence), self._app)
            shortcut.activated.connect(handler)
            self._shortcuts[name] = shortcut
            self._handlers[name] = handler
            logger.info(f"Registered shortcut: {name} ({key_sequence})")
            return True
        except Exception as e:
            logger.error(f"Failed to register shortcut {name}: {e}")
            return False
    
    def unregister_shortcut(self, name: str) -> bool:
        """
        Unregister a keyboard shortcut.
        
        Args:
            name: Name of the shortcut
            
        Returns:
            True if unregistered successfully
        """
        if name in self._shortcuts:
            self._shortcuts[name].deleteLater()
            del self._shortcuts[name]
            del self._handlers[name]
            logger.info(f"Unregistered shortcut: {name}")
            return True
        return False
    
    def trigger_shortcut(self, name: str) -> bool:
        """
        Manually trigger a shortcut.
        
        Args:
            name: Name of the shortcut
            
        Returns:
            True if triggered successfully
        """
        if name in self._handlers:
            try:
                self._handlers[name]()
                return True
            except Exception as e:
                logger.error(f"Error triggering shortcut {name}: {e}")
                return False
        return False
    
    def get_all_shortcuts(self) -> dict:
        """Get all registered shortcuts."""
        return {name: str(self._shortcuts[name].key()) 
                for name in self._shortcuts}


def init_keyboard_shortcuts() -> KeyboardShortcutsManager:
    """Initialize global keyboard shortcuts manager."""
    return KeyboardShortcutsManager()
