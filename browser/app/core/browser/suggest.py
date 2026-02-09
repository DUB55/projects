"""
Suggestion Engine Module

Provides search suggestions from:
- Open tabs
- History
- Bookmarks
- Search engines (optional for future)
"""

from typing import List, Dict, Any
from dataclasses import dataclass, asdict

from app.utils.logger import setup_logger
from app.core.browser.navigation import NavigationManager
from app.core.browser.bookmarks import BookmarksManager

logger = setup_logger(__name__)


@dataclass
class Suggestion:
    """Represents a search suggestion."""
    title: str
    url: str
    type: str  # 'history', 'bookmark', 'tab', 'search'
    icon: str = ""
    relevance: int = 0
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return asdict(self)


class SuggestionEngine:
    """Generates suggestions for the omnibox."""
    
    def __init__(self, navigation_manager: NavigationManager, bookmarks_manager: BookmarksManager):
        """
        Initialize suggestion engine.
        
        Args:
            navigation_manager: Navigation manager instance
            bookmarks_manager: Bookmarks manager instance
        """
        self.nav_manager = navigation_manager
        self.bookmarks_manager = bookmarks_manager
        
    def get_suggestions(self, query: str, limit: int = 10) -> List[Suggestion]:
        """
        Get suggestions for query.
        
        Args:
            query: User input
            limit: Max results per category
        
        Returns:
            List of merged and ranked suggestions
        """
        if not query or len(query.strip()) < 2:
            return []
            
        suggestions = []
        
        # 1. Search History
        if self.nav_manager:
            history_results = self.nav_manager.search_history(query, limit=5)
            for entry in history_results:
                suggestions.append(Suggestion(
                    title=entry.title,
                    url=entry.url,
                    type='history',
                    icon='🕓',
                    relevance=80
                ))
                
        # 2. Search Bookmarks
        if self.bookmarks_manager:
            bookmark_results = self.bookmarks_manager.search_bookmarks(query, limit=5)
            for bm in bookmark_results:
                suggestions.append(Suggestion(
                    title=bm.title,
                    url=bm.url,
                    type='bookmark',
                    icon='★',
                    relevance=90
                ))
        
        # 3. Search Engine fallback
        suggestions.append(Suggestion(
            title=f"Search for '{query}'",
            url=query, # Will be handled by navigation as a search
            type='search',
            icon='🔍',
            relevance=100
        ))
        
        # Sort by relevance
        suggestions.sort(key=lambda x: x.relevance, reverse=True)
        
        return suggestions[:limit]
