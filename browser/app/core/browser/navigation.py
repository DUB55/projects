"""
Web Navigation Module

Handles web navigation operations:
- Navigation history management
- Back/forward/reload operations
- URL loading
- History tracking
"""

from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json

from app.utils.logger import setup_logger


logger = setup_logger(__name__)


@dataclass
class HistoryEntry:
    """Represents a history entry."""
    url: str
    title: str
    timestamp: datetime
    favicon_url: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            'url': self.url,
            'title': self.title,
            'timestamp': self.timestamp.isoformat(),
            'favicon_url': self.favicon_url
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'HistoryEntry':
        """Create from dictionary."""
        return cls(
            url=data['url'],
            title=data['title'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            favicon_url=data.get('favicon_url')
        )


class NavigationStack:
    """Manages forward/back navigation stacks."""
    
    def __init__(self):
        """Initialize navigation stack."""
        self.back_stack: List[HistoryEntry] = []
        self.forward_stack: List[HistoryEntry] = []
        self.current: Optional[HistoryEntry] = None
    
    def push(self, entry: HistoryEntry) -> None:
        """
        Push entry to history.
        
        Args:
            entry: History entry to push
        """
        if self.current:
            self.back_stack.append(self.current)
        self.current = entry
        self.forward_stack.clear()  # Clear forward when new navigation occurs
        logger.debug(f"Navigation pushed: {entry.title} ({entry.url})")
    
    def go_back(self) -> Optional[HistoryEntry]:
        """
        Go back in history.
        
        Returns:
            Previous history entry or None
        """
        if not self.back_stack:
            return None
        
        if self.current:
            self.forward_stack.append(self.current)
        
        self.current = self.back_stack.pop()
        logger.debug(f"Navigation back: {self.current.title}")
        return self.current
    
    def go_forward(self) -> Optional[HistoryEntry]:
        """
        Go forward in history.
        
        Returns:
            Next history entry or None
        """
        if not self.forward_stack:
            return None
        
        if self.current:
            self.back_stack.append(self.current)
        
        self.current = self.forward_stack.pop()
        logger.debug(f"Navigation forward: {self.current.title}")
        return self.current
    
    def can_go_back(self) -> bool:
        """Check if can go back."""
        return len(self.back_stack) > 0
    
    def can_go_forward(self) -> bool:
        """Check if can go forward."""
        return len(self.forward_stack) > 0
    
    def clear(self) -> None:
        """Clear all history."""
        self.back_stack.clear()
        self.forward_stack.clear()
        self.current = None
        logger.debug("Navigation history cleared")


class NavigationManager:
    """Manages browser navigation."""
    
    def __init__(self, data_dir: Path):
        """
        Initialize navigation manager.
        
        Args:
            data_dir: Profile data directory
        """
        self.data_dir = Path(data_dir)
        self.history_file = self.data_dir / "history.json"
        self.navigation_stack = NavigationStack()
        self.full_history: List[HistoryEntry] = []
        
        self._load_history()
    
    def _load_history(self) -> None:
        """Load history from file."""
        try:
            if self.history_file.exists():
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.full_history = [
                        HistoryEntry.from_dict(entry)
                        for entry in data.get('entries', [])
                    ]
                logger.info(f"Loaded {len(self.full_history)} history entries")
        except Exception as e:
            logger.error(f"Failed to load history: {e}")
            self.full_history = []
    
    def _save_history(self) -> None:
        """Save history to file."""
        try:
            # Keep last 1000 entries
            entries = self.full_history[-1000:]
            data = {
                'version': 1,
                'entries': [entry.to_dict() for entry in entries]
            }
            
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save history: {e}")
    
    def add_entry(
        self,
        url: str,
        title: str = "",
        favicon_url: Optional[str] = None
    ) -> HistoryEntry:
        """
        Add entry to history.
        
        Args:
            url: Page URL
            title: Page title
            favicon_url: Favicon URL (optional)
            
        Returns:
            Created history entry
        """
        entry = HistoryEntry(
            url=url,
            title=title or url,
            timestamp=datetime.now(),
            favicon_url=favicon_url
        )
        
        self.full_history.append(entry)
        self.navigation_stack.push(entry)
        self._save_history()
        
        logger.debug(f"History entry added: {entry.title}")
        return entry
    
    def go_back(self) -> Optional[str]:
        """
        Go back to previous page.
        
        Returns:
            URL to navigate to or None
        """
        entry = self.navigation_stack.go_back()
        return entry.url if entry else None
    
    def go_forward(self) -> Optional[str]:
        """
        Go forward to next page.
        
        Returns:
            URL to navigate to or None
        """
        entry = self.navigation_stack.go_forward()
        return entry.url if entry else None
    
    def can_go_back(self) -> bool:
        """Check if can go back."""
        return self.navigation_stack.can_go_back()
    
    def can_go_forward(self) -> bool:
        """Check if can go forward."""
        return self.navigation_stack.can_go_forward()
    
    def get_history(self, limit: int = 50) -> List[HistoryEntry]:
        """
        Get recent history.
        
        Args:
            limit: Number of entries to return
            
        Returns:
            List of history entries (most recent first)
        """
        return list(reversed(self.full_history[-limit:]))
    
    def search_history(self, query: str, limit: int = 20) -> List[HistoryEntry]:
        """
        Search history by title or URL.
        
        Args:
            query: Search query
            limit: Max results
            
        Returns:
            Matching history entries
        """
        query_lower = query.lower()
        results = [
            entry for entry in self.full_history
            if query_lower in entry.title.lower()
            or query_lower in entry.url.lower()
        ]
        return list(reversed(results[-limit:]))
    
    def delete_entry(self, url: str) -> bool:
        """
        Delete history entry.
        
        Args:
            url: URL to delete
            
        Returns:
            True if deleted, False otherwise
        """
        original_len = len(self.full_history)
        self.full_history = [
            entry for entry in self.full_history
            if entry.url != url
        ]
        
        if len(self.full_history) < original_len:
            self._save_history()
            logger.debug(f"Deleted history entry: {url}")
            return True
        
        return False
    
    def clear_history(self) -> None:
        """Clear all history."""
        self.full_history.clear()
        self.navigation_stack.clear()
        
        try:
            if self.history_file.exists():
                self.history_file.unlink()
        except Exception as e:
            logger.error(f"Failed to delete history file: {e}")
        
        logger.info("History cleared")
    
    def clear_history_since(self, timestamp: datetime) -> None:
        """
        Clear history entries since timestamp.
        
        Args:
            timestamp: Delete entries after this time
        """
        original_len = len(self.full_history)
        self.full_history = [
            entry for entry in self.full_history
            if entry.timestamp < timestamp
        ]
        
        deleted_count = original_len - len(self.full_history)
        if deleted_count > 0:
            self._save_history()
            logger.info(f"Deleted {deleted_count} recent history entries")
    
    def get_statistics(self) -> dict:
        """
        Get history statistics.
        
        Returns:
            Statistics dictionary
        """
        if not self.full_history:
            return {
                'total_entries': 0,
                'date_range': None,
                'unique_domains': 0
            }
        
        from urllib.parse import urlparse
        
        domains = set()
        for entry in self.full_history:
            try:
                domain = urlparse(entry.url).netloc
                domains.add(domain)
            except Exception:
                pass
        
        return {
            'total_entries': len(self.full_history),
            'first_visit': self.full_history[0].timestamp,
            'last_visit': self.full_history[-1].timestamp,
            'unique_domains': len(domains)
        }
