"""
Session Manager Module

Manages browser sessions:
- Auto-save tab state
- Session restore on startup
- Window state persistence
- Session switching
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
import json

from app.utils.logger import setup_logger


logger = setup_logger(__name__)


@dataclass
class TabSnapshot:
    """Represents saved tab state."""
    tab_id: str
    url: str
    title: str
    position: int
    is_active: bool = False
    group_id: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'TabSnapshot':
        """Create from dictionary."""
        return cls(**data)


@dataclass
class GroupSnapshot:
    """Represents saved tab group state."""
    group_id: str
    title: str
    color: str
    is_collapsed: bool = False
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'GroupSnapshot':
        """Create from dictionary."""
        return cls(**data)


@dataclass
class WindowSnapshot:
    """Represents saved window state."""
    window_id: str
    x: int
    y: int
    width: int
    height: int
    is_maximized: bool
    tabs: List[TabSnapshot] = field(default_factory=list)
    groups: List[GroupSnapshot] = field(default_factory=list)
    active_tab_id: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = asdict(self)
        data['tabs'] = [tab.to_dict() for tab in self.tabs]
        data['groups'] = [group.to_dict() for group in self.groups]
        return data
    
    @classmethod
    def from_dict(cls, data: dict) -> 'WindowSnapshot':
        """Create from dictionary."""
        tabs = [TabSnapshot.from_dict(t) for t in data.pop('tabs', [])]
        groups = [GroupSnapshot.from_dict(g) for g in data.pop('groups', [])]
        return cls(tabs=tabs, groups=groups, **data)


@dataclass
class Session:
    """Represents a saved session."""
    session_id: str
    name: str
    timestamp: datetime
    windows: List[WindowSnapshot] = field(default_factory=list)
    profile_id: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            'session_id': self.session_id,
            'name': self.name,
            'timestamp': self.timestamp.isoformat(),
            'profile_id': self.profile_id,
            'windows': [w.to_dict() for w in self.windows]
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Session':
        """Create from dictionary."""
        windows = [WindowSnapshot.from_dict(w) for w in data.pop('windows', [])]
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(windows=windows, **data)


class SessionManager:
    """Manages browser sessions."""
    
    def __init__(self, data_dir: Path):
        """
        Initialize session manager.
        
        Args:
            data_dir: Profile data directory
        """
        self.data_dir = Path(data_dir)
        self.sessions_dir = self.data_dir / "sessions"
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        
        self.current_session: Optional[Session] = None
        self.sessions: Dict[str, Session] = {}
        
        self._load_sessions()
    
    def _load_sessions(self) -> None:
        """Load all saved sessions."""
        try:
            for session_file in self.sessions_dir.glob("*.json"):
                try:
                    with open(session_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        session = Session.from_dict(data)
                        self.sessions[session.session_id] = session
                except Exception as e:
                    logger.error(f"Failed to load session {session_file}: {e}")
            
            logger.info(f"Loaded {len(self.sessions)} saved sessions")
        except Exception as e:
            logger.error(f"Failed to load sessions: {e}")
    
    def _save_session(self, session: Session) -> None:
        """Save session to file."""
        try:
            session_file = self.sessions_dir / f"{session.session_id}.json"
            with open(session_file, 'w', encoding='utf-8') as f:
                json.dump(session.to_dict(), f, indent=2)
            logger.debug(f"Saved session: {session.name}")
        except Exception as e:
            logger.error(f"Failed to save session: {e}")
    
    def create_session(
        self,
        name: str,
        profile_id: Optional[str] = None
    ) -> Session:
        """
        Create new session.
        
        Args:
            name: Session name
            profile_id: Associated profile ID
            
        Returns:
            Created session
        """
        session_id = f"session_{datetime.now().timestamp():.0f}"
        session = Session(
            session_id=session_id,
            name=name,
            timestamp=datetime.now(),
            profile_id=profile_id
        )
        
        self.sessions[session_id] = session
        self.current_session = session
        self._save_session(session)
        
        logger.info(f"Created session: {name}")
        return session
    
    def save_current_session(
        self,
        windows: List[WindowSnapshot]
    ) -> None:
        """
        Save current window/tab state to session.
        
        Args:
            windows: List of window snapshots
        """
        if not self.current_session:
            self.create_session("Auto-save")
        
        if self.current_session:
            self.current_session.windows = windows
            self.current_session.timestamp = datetime.now()
            self._save_session(self.current_session)
            logger.debug(f"Saved state: {len(windows)} windows")
    
    def restore_session(self, session_id: str) -> Optional[List[WindowSnapshot]]:
        """
        Restore session windows and tabs.
        
        Args:
            session_id: Session ID
            
        Returns:
            List of window snapshots or None
        """
        session = self.sessions.get(session_id)
        if not session:
            logger.warning(f"Session not found: {session_id}")
            return None
        
        self.current_session = session
        logger.info(f"Restored session: {session.name}")
        return session.windows
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete saved session.
        
        Args:
            session_id: Session ID
            
        Returns:
            True if deleted, False otherwise
        """
        if session_id not in self.sessions:
            return False
        
        try:
            session_file = self.sessions_dir / f"{session_id}.json"
            if session_file.exists():
                session_file.unlink()
            
            del self.sessions[session_id]
            
            if self.current_session and self.current_session.session_id == session_id:
                self.current_session = None
            
            logger.info(f"Deleted session: {session_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete session: {e}")
            return False
    
    def get_sessions(self) -> List[Session]:
        """
        Get all sessions.
        
        Returns:
            List of sessions (sorted by timestamp)
        """
        sessions = list(self.sessions.values())
        sessions.sort(key=lambda s: s.timestamp, reverse=True)
        return sessions
    
    def auto_save_interval(self) -> int:
        """
        Get auto-save interval in milliseconds.
        
        Returns:
            Auto-save interval
        """
        return 30000  # 30 seconds
    
    def get_session(self, session_id: str) -> Optional[Session]:
        """
        Get specific session.
        
        Args:
            session_id: Session ID
            
        Returns:
            Session or None
        """
        return self.sessions.get(session_id)
    
    def export_session(self, session_id: str, export_path: Path) -> bool:
        """
        Export session to file.
        
        Args:
            session_id: Session ID
            export_path: Export file path
            
        Returns:
            True if successful
        """
        try:
            session = self.sessions.get(session_id)
            if not session:
                return False
            
            with open(export_path, 'w', encoding='utf-8') as f:
                json.dump(session.to_dict(), f, indent=2)
            
            logger.info(f"Exported session to {export_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to export session: {e}")
            return False
    
    def import_session(self, import_path: Path, name: Optional[str] = None) -> Optional[Session]:
        """
        Import session from file.
        
        Args:
            import_path: Import file path
            name: Override session name
            
        Returns:
            Imported session or None
        """
        try:
            with open(import_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                session = Session.from_dict(data)
            
            # Generate new ID
            session.session_id = f"session_{datetime.now().timestamp():.0f}"
            if name:
                session.name = name
            
            self.sessions[session.session_id] = session
            self._save_session(session)
            
            logger.info(f"Imported session: {session.name}")
            return session
        except Exception as e:
            logger.error(f"Failed to import session: {e}")
            return None
    
    def get_profile_sessions(self, profile_id: str) -> List[Session]:
        """
        Get sessions for specific profile.
        
        Args:
            profile_id: Profile ID
            
        Returns:
            List of sessions for profile
        """
        sessions = [
            s for s in self.sessions.values()
            if s.profile_id == profile_id
        ]
        sessions.sort(key=lambda s: s.timestamp, reverse=True)
        return sessions
    
    def cleanup_old_sessions(self, keep_count: int = 10) -> int:
        """
        Remove old sessions, keep most recent.
        
        Args:
            keep_count: Number of sessions to keep
            
        Returns:
            Number of deleted sessions
        """
        if len(self.sessions) <= keep_count:
            return 0
        
        sorted_sessions = sorted(
            self.sessions.values(),
            key=lambda s: s.timestamp,
            reverse=True
        )
        
        to_delete = sorted_sessions[keep_count:]
        deleted_count = 0
        
        for session in to_delete:
            if self.delete_session(session.session_id):
                deleted_count += 1
        
        logger.info(f"Cleaned up {deleted_count} old sessions")
        return deleted_count
