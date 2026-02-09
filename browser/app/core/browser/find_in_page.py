"""
Find-in-Page Manager Module

Manages find-in-page functionality for browser tabs.
"""

from dataclasses import dataclass
from typing import Optional, List
from PySide6.QtCore import QObject, Signal, Slot
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


@dataclass
class FindResult:
    """Represents a find-in-page result."""
    match_count: int = 0
    current_index: int = 0
    search_term: str = ""
    is_case_sensitive: bool = False


class FindInPageManager(QObject):
    """
    Manages find-in-page functionality.
    
    Features:
      - Search term tracking
      - Match counting
      - Case sensitivity toggle
      - Find previous/next navigation
    """
    
    # Signals
    search_updated = Signal(int, int)  # match_count, current_index
    found_matches = Signal(list)  # List of match positions
    
    def __init__(self):
        """Initialize find-in-page manager."""
        super().__init__()
        self._search_term = ""
        self._case_sensitive = False
        self._matches: List[int] = []
        self._current_index = 0
        logger.info("FindInPageManager initialized")
    
    @property
    def search_term(self) -> str:
        """Get current search term."""
        return self._search_term
    
    @property
    def case_sensitive(self) -> bool:
        """Get case sensitivity setting."""
        return self._case_sensitive
    
    @property
    def match_count(self) -> int:
        """Get total number of matches."""
        return len(self._matches)
    
    @property
    def current_index(self) -> int:
        """Get current match index (1-based for display)."""
        return self._current_index + 1 if self._matches else 0
    
    @Slot(str)
    def set_search_term(self, term: str) -> None:
        """
        Set search term and trigger search.
        
        Args:
            term: Search term to find
        """
        self._search_term = term
        self._current_index = 0
        
        if term:
            logger.info(f"Find-in-page search: '{term}'")
            self.search_updated.emit(self.match_count, self.current_index)
        else:
            self._matches.clear()
            logger.info("Find-in-page cleared")
            self.search_updated.emit(0, 0)
    
    @Slot()
    def find_next(self) -> None:
        """Move to next match."""
        if self._matches:
            self._current_index = (self._current_index + 1) % len(self._matches)
            logger.debug(f"Find next: match {self.current_index}/{self.match_count}")
            self.search_updated.emit(self.match_count, self.current_index)
    
    @Slot()
    def find_previous(self) -> None:
        """Move to previous match."""
        if self._matches:
            self._current_index = (self._current_index - 1) % len(self._matches)
            logger.debug(f"Find previous: match {self.current_index}/{self.match_count}")
            self.search_updated.emit(self.match_count, self.current_index)
    
    @Slot(bool)
    def set_case_sensitive(self, enabled: bool) -> None:
        """
        Toggle case sensitivity.
        
        Args:
            enabled: Whether to enable case sensitivity
        """
        self._case_sensitive = enabled
        self._current_index = 0
        logger.debug(f"Case sensitivity: {enabled}")
        
        if self._search_term:
            self.search_updated.emit(self.match_count, self.current_index)
    
    @Slot()
    def clear_search(self) -> None:
        """Clear current search."""
        self._search_term = ""
        self._matches.clear()
        self._current_index = 0
        logger.info("Find-in-page cleared")
        self.search_updated.emit(0, 0)
    
    def get_result(self) -> FindResult:
        """
        Get current find result.
        
        Returns:
            FindResult with current search state
        """
        return FindResult(
            match_count=self.match_count,
            current_index=self.current_index,
            search_term=self._search_term,
            is_case_sensitive=self._case_sensitive
        )
