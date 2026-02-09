"""
Downloads Manager Module

Manages file downloads:
- Track download progress and state
- Pause/resume/cancel downloads
- History of downloaded files
- Integration with QtWebEngine downloads
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import json
from enum import Enum
import uuid

from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class DownloadState(Enum):
    """Download state enum."""
    STARTING = "starting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    INTERRUPTED = "interrupted"
    CANCELLED = "cancelled"


@dataclass
class DownloadItem:
    """Represents a download item."""
    id: str
    url: str
    path: str
    filename: str
    mime_type: str
    state: DownloadState
    bytes_received: int = 0
    bytes_total: int = 0
    start_time: str = ""
    end_time: str = ""
    error_string: str = ""
    
    def __post_init__(self):
        """Initialize fields."""
        if not self.start_time:
            self.start_time = datetime.now().isoformat()
    
    @property
    def progress(self) -> float:
        """Get progress as percentage (0-100)."""
        if self.bytes_total <= 0:
            return 0
        return (self.bytes_received / self.bytes_total) * 100
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = asdict(self)
        data['state'] = self.state.value
        return data
    
    @classmethod
    def from_dict(cls, data: dict) -> 'DownloadItem':
        """Create from dictionary."""
        # Convert state string back to Enum
        if 'state' in data and isinstance(data['state'], str):
            try:
                data['state'] = DownloadState(data['state'])
            except ValueError:
                data['state'] = DownloadState.FAILED
        
        return cls(**data)


class DownloadsManager:
    """Manages downloads for a profile."""
    
    def __init__(self, data_dir: Path):
        """
        Initialize downloads manager.
        
        Args:
            data_dir: Profile data directory
        """
        self.data_dir = Path(data_dir)
        self.downloads_file = self.data_dir / "downloads.json"
        
        self.downloads: Dict[str, DownloadItem] = {}
        
        self._load_downloads()
    
    def _load_downloads(self) -> None:
        """Load downloads from file."""
        try:
            if self.downloads_file.exists():
                with open(self.downloads_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    for item_data in data.get('downloads', []):
                        item = DownloadItem.from_dict(item_data)
                        self.downloads[item.id] = item
                
                logger.info(f"Loaded {len(self.downloads)} download items")
        except Exception as e:
            logger.error(f"Failed to load downloads: {e}")
    
    def _save_downloads(self) -> None:
        """Save downloads to file."""
        try:
            data = {
                'version': 1,
                'downloads': [item.to_dict() for item in self.downloads.values()]
            }
            
            with open(self.downloads_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save downloads: {e}")
    
    def add_download(
        self,
        url: str,
        path: str,
        filename: str,
        mime_type: str = "application/octet-stream"
    ) -> DownloadItem:
        """
        Add new download.
        
        Args:
            url: Download URL
            path: Target file path
            filename: Target filename
            mime_type: MIME type
        
        Returns:
            Created download item
        """
        download_id = str(uuid.uuid4())
        
        item = DownloadItem(
            id=download_id,
            url=url,
            path=str(path),
            filename=filename,
            mime_type=mime_type,
            state=DownloadState.STARTING
        )
        
        self.downloads[download_id] = item
        self._save_downloads()
        
        logger.debug(f"Added download: {filename}")
        return item
    
    def update_progress(
        self,
        download_id: str,
        bytes_received: int,
        bytes_total: int,
        state: Optional[DownloadState] = None
    ) -> bool:
        """
        Update download progress.
        
        Args:
            download_id: ID of download
            bytes_received: Bytes received so far
            bytes_total: Total bytes expected
            state: Optional new state
        
        Returns:
            True if successful
        """
        item = self.downloads.get(download_id)
        if not item:
            return False
            
        item.bytes_received = bytes_received
        item.bytes_total = bytes_total
        
        if state:
            item.state = state
            if state == DownloadState.COMPLETED:
                item.end_time = datetime.now().isoformat()
        elif bytes_received > 0 and item.state == DownloadState.STARTING:
            item.state = DownloadState.IN_PROGRESS
            
        self._save_downloads()
        return True
    
    def set_error(self, download_id: str, error_string: str) -> bool:
        """
        Set download error.
        
        Args:
            download_id: ID of download
            error_string: Error message
        
        Returns:
            True if successful
        """
        item = self.downloads.get(download_id)
        if not item:
            return False
            
        item.state = DownloadState.FAILED
        item.error_string = error_string
        item.end_time = datetime.now().isoformat()
        
        self._save_downloads()
        logger.warning(f"Download failed: {item.filename} - {error_string}")
        return True
    
    def cancel_download(self, download_id: str) -> bool:
        """
        Cancel download.
        
        Args:
            download_id: ID of download
        
        Returns:
            True if successful
        """
        item = self.downloads.get(download_id)
        if not item:
            return False
            
        item.state = DownloadState.CANCELLED
        item.end_time = datetime.now().isoformat()
        
        self._save_downloads()
        return True
    
    def get_download(self, download_id: str) -> Optional[DownloadItem]:
        """Get download item."""
        return self.downloads.get(download_id)
    
    def get_all_downloads(self) -> List[DownloadItem]:
        """Get all downloads sorted by start time (newest first)."""
        items = list(self.downloads.values())
        items.sort(key=lambda x: x.start_time, reverse=True)
        return items
    
    def clear_downloads(self) -> None:
        """Clear download history (does not delete files)."""
        self.downloads.clear()
        self._save_downloads()
        logger.info("Cleared download history")
    
    def remove_download(self, download_id: str) -> bool:
        """Remove single download from history."""
        if download_id in self.downloads:
            del self.downloads[download_id]
            self._save_downloads()
            return True
        return False
