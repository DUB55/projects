"""
Bookmarks Manager Module

Manages browser bookmarks:
- Create/read/update/delete bookmarks
- Bookmark folders for organization
- Search bookmarks
- Import/export functionality
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import json

from app.utils.logger import setup_logger


logger = setup_logger(__name__)


@dataclass
class Bookmark:
    """Represents a single bookmark."""
    id: str
    url: str
    title: str
    folder_id: Optional[str] = None  # None = root
    timestamp: str = ""
    favicon_url: Optional[str] = None
    tags: List[str] = None
    
    def __post_init__(self):
        """Initialize fields."""
        if self.tags is None:
            self.tags = []
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = asdict(self)
        return data
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Bookmark':
        """Create from dictionary."""
        return cls(**data)


@dataclass
class BookmarkFolder:
    """Represents a bookmark folder."""
    id: str
    name: str
    parent_id: Optional[str] = None  # None = root
    timestamp: str = ""
    
    def __post_init__(self):
        """Initialize fields."""
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'parent_id': self.parent_id,
            'timestamp': self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'BookmarkFolder':
        """Create from dictionary."""
        return cls(**data)


class BookmarksManager:
    """Manages bookmarks for a profile."""
    
    def __init__(self, data_dir: Path):
        """
        Initialize bookmarks manager.
        
        Args:
            data_dir: Profile data directory
        """
        self.data_dir = Path(data_dir)
        self.bookmarks_file = self.data_dir / "bookmarks.json"
        
        self.bookmarks: Dict[str, Bookmark] = {}
        self.folders: Dict[str, BookmarkFolder] = {}
        
        self._load_bookmarks()
    
    def _load_bookmarks(self) -> None:
        """Load bookmarks from file."""
        try:
            if self.bookmarks_file.exists():
                with open(self.bookmarks_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Load bookmarks
                    for b_data in data.get('bookmarks', []):
                        bookmark = Bookmark.from_dict(b_data)
                        self.bookmarks[bookmark.id] = bookmark
                    
                    # Load folders
                    for f_data in data.get('folders', []):
                        folder = BookmarkFolder.from_dict(f_data)
                        self.folders[folder.id] = folder
                
                logger.info(f"Loaded {len(self.bookmarks)} bookmarks, {len(self.folders)} folders")
        except Exception as e:
            logger.error(f"Failed to load bookmarks: {e}")
    
    def _save_bookmarks(self) -> None:
        """Save bookmarks to file."""
        try:
            data = {
                'version': 1,
                'bookmarks': [b.to_dict() for b in self.bookmarks.values()],
                'folders': [f.to_dict() for f in self.folders.values()]
            }
            
            with open(self.bookmarks_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save bookmarks: {e}")
    
    def create_bookmark(
        self,
        url: str,
        title: str = "",
        folder_id: Optional[str] = None,
        favicon_url: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Bookmark:
        """
        Create new bookmark.
        
        Args:
            url: Bookmark URL
            title: Bookmark title
            folder_id: Folder to place in
            favicon_url: Favicon URL
            tags: List of tags
        
        Returns:
            Created bookmark
        """
        # Generate ID
        bookmark_id = f"bm_{len(self.bookmarks)}_{datetime.now().timestamp():.0f}"
        
        bookmark = Bookmark(
            id=bookmark_id,
            url=url,
            title=title or url,
            folder_id=folder_id,
            favicon_url=favicon_url,
            tags=tags or []
        )
        
        self.bookmarks[bookmark_id] = bookmark
        self._save_bookmarks()
        
        logger.debug(f"Created bookmark: {bookmark.title}")
        return bookmark
    
    def delete_bookmark(self, bookmark_id: str) -> bool:
        """
        Delete bookmark.
        
        Args:
            bookmark_id: ID of bookmark
        
        Returns:
            True if successful
        """
        if bookmark_id in self.bookmarks:
            del self.bookmarks[bookmark_id]
            self._save_bookmarks()
            logger.debug(f"Deleted bookmark: {bookmark_id}")
            return True
        
        return False
    
    def get_bookmark(self, bookmark_id: str) -> Optional[Bookmark]:
        """
        Get specific bookmark.
        
        Args:
            bookmark_id: ID of bookmark
        
        Returns:
            Bookmark or None
        """
        return self.bookmarks.get(bookmark_id)
    
    def get_all_bookmarks(self) -> List[Bookmark]:
        """
        Get all bookmarks.
        
        Returns:
            List of bookmarks
        """
        return list(self.bookmarks.values())
    
    def get_bookmarks_in_folder(self, folder_id: Optional[str] = None) -> List[Bookmark]:
        """
        Get bookmarks in folder.
        
        Args:
            folder_id: Folder ID (None = root)
        
        Returns:
            List of bookmarks in folder
        """
        return [b for b in self.bookmarks.values() if b.folder_id == folder_id]
    
    def update_bookmark(self, bookmark_id: str, **kwargs) -> bool:
        """
        Update bookmark properties.
        
        Args:
            bookmark_id: ID of bookmark
            **kwargs: Properties to update
        
        Returns:
            True if successful
        """
        bookmark = self.bookmarks.get(bookmark_id)
        if not bookmark:
            return False
        
        for key, value in kwargs.items():
            if hasattr(bookmark, key):
                setattr(bookmark, key, value)
        
        self._save_bookmarks()
        logger.debug(f"Updated bookmark: {bookmark_id}")
        return True
    
    def create_folder(
        self,
        name: str,
        parent_id: Optional[str] = None
    ) -> BookmarkFolder:
        """
        Create bookmark folder.
        
        Args:
            name: Folder name
            parent_id: Parent folder ID
        
        Returns:
            Created folder
        """
        folder_id = f"bf_{len(self.folders)}_{datetime.now().timestamp():.0f}"
        
        folder = BookmarkFolder(
            id=folder_id,
            name=name,
            parent_id=parent_id
        )
        
        self.folders[folder_id] = folder
        self._save_bookmarks()
        
        logger.debug(f"Created bookmark folder: {name}")
        return folder
    
    def delete_folder(self, folder_id: str) -> bool:
        """
        Delete bookmark folder.
        
        Args:
            folder_id: ID of folder
        
        Returns:
            True if successful
        """
        if folder_id not in self.folders:
            return False
        
        # Delete all bookmarks in folder
        to_delete = [b_id for b_id, b in self.bookmarks.items() if b.folder_id == folder_id]
        for b_id in to_delete:
            del self.bookmarks[b_id]
        
        # Delete folder
        del self.folders[folder_id]
        self._save_bookmarks()
        
        logger.debug(f"Deleted bookmark folder: {folder_id}")
        return True
    
    def get_folder(self, folder_id: str) -> Optional[BookmarkFolder]:
        """
        Get specific folder.
        
        Args:
            folder_id: ID of folder
        
        Returns:
            Folder or None
        """
        return self.folders.get(folder_id)
    
    def get_all_folders(self) -> List[BookmarkFolder]:
        """
        Get all folders.
        
        Returns:
            List of folders
        """
        return list(self.folders.values())
    
    def get_subfolders(self, parent_id: Optional[str] = None) -> List[BookmarkFolder]:
        """
        Get subfolders in folder.
        
        Args:
            parent_id: Parent folder ID (None = root)
        
        Returns:
            List of subfolders
        """
        return [f for f in self.folders.values() if f.parent_id == parent_id]
    
    def search_bookmarks(self, query: str, limit: int = 20) -> List[Bookmark]:
        """
        Search bookmarks by title or URL.
        
        Args:
            query: Search query
            limit: Max results
        
        Returns:
            Matching bookmarks
        """
        query_lower = query.lower()
        results = [
            b for b in self.bookmarks.values()
            if query_lower in b.title.lower()
            or query_lower in b.url.lower()
        ]
        
        return results[:limit]
    
    def search_by_tag(self, tag: str) -> List[Bookmark]:
        """
        Get bookmarks with specific tag.
        
        Args:
            tag: Tag to search for
        
        Returns:
            Bookmarks with tag
        """
        return [b for b in self.bookmarks.values() if tag in b.tags]
    
    def add_tag(self, bookmark_id: str, tag: str) -> bool:
        """
        Add tag to bookmark.
        
        Args:
            bookmark_id: ID of bookmark
            tag: Tag to add
        
        Returns:
            True if successful
        """
        bookmark = self.bookmarks.get(bookmark_id)
        if not bookmark:
            return False
        
        if tag not in bookmark.tags:
            bookmark.tags.append(tag)
            self._save_bookmarks()
        
        return True
    
    def remove_tag(self, bookmark_id: str, tag: str) -> bool:
        """
        Remove tag from bookmark.
        
        Args:
            bookmark_id: ID of bookmark
            tag: Tag to remove
        
        Returns:
            True if successful
        """
        bookmark = self.bookmarks.get(bookmark_id)
        if not bookmark:
            return False
        
        if tag in bookmark.tags:
            bookmark.tags.remove(tag)
            self._save_bookmarks()
        
        return True
    
    def export_bookmarks(self, export_path: Path) -> bool:
        """
        Export bookmarks to file.
        
        Args:
            export_path: Export file path
        
        Returns:
            True if successful
        """
        try:
            data = {
                'version': 1,
                'bookmarks': [b.to_dict() for b in self.bookmarks.values()],
                'folders': [f.to_dict() for f in self.folders.values()]
            }
            
            with open(export_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Exported bookmarks to {export_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to export bookmarks: {e}")
            return False
    
    def import_bookmarks(self, import_path: Path) -> bool:
        """
        Import bookmarks from file.
        
        Args:
            import_path: Import file path
        
        Returns:
            True if successful
        """
        try:
            with open(import_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Import bookmarks
            for b_data in data.get('bookmarks', []):
                bookmark = Bookmark.from_dict(b_data)
                self.bookmarks[bookmark.id] = bookmark
            
            # Import folders
            for f_data in data.get('folders', []):
                folder = BookmarkFolder.from_dict(f_data)
                self.folders[folder.id] = folder
            
            self._save_bookmarks()
            logger.info(f"Imported bookmarks from {import_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to import bookmarks: {e}")
            return False
    
    def get_statistics(self) -> dict:
        """
        Get bookmark statistics.
        
        Returns:
            Statistics dictionary
        """
        return {
            'total_bookmarks': len(self.bookmarks),
            'total_folders': len(self.folders),
            'bookmarks_in_root': len(self.get_bookmarks_in_folder(None)),
            'folders_in_root': len(self.get_subfolders(None))
        }
