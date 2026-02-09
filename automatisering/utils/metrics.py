import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional

@dataclass
class MetricsData:
    start_time: float = field(default_factory=time.time)
    total_items: int = 0
    completed_items: int = 0
    failed_items: int = 0
    current_item_name: str = ""
    
    # Hierarchical tracking
    total_chapters: int = 0
    completed_chapters: int = 0
    total_paragraphs: int = 0
    completed_paragraphs: int = 0

class MetricsTracker:
    """Tracks scraping progress and calculates ETA"""
    
    def __init__(self):
        self.data = MetricsData()
        self.item_times = [] # List of (timestamp, completed_count)
        
    def reset(self, total_items: int = 0):
        self.data = MetricsData(start_time=time.time(), total_items=total_items)
        self.item_times = [(self.data.start_time, 0)]
        
    def set_total_items(self, count: int):
        self.data.total_items = count
        
    def item_completed(self, success: bool = True):
        if success:
            self.data.completed_items += 1
        else:
            self.data.failed_items += 1
            
        self.item_times.append((time.time(), self.data.completed_items))
        # Keep only last 50 entries for moving average
        if len(self.item_times) > 50:
            self.item_times.pop(0)
            
    def update_hierarchy(self, chapters: int = None, paragraphs: int = None):
        if chapters is not None:
            self.data.total_chapters = chapters
        if paragraphs is not None:
            self.data.total_paragraphs = paragraphs
            
    def chapter_completed(self):
        self.data.completed_chapters += 1
        
    def paragraph_completed(self):
        self.data.completed_paragraphs += 1
        self.item_completed(True)

    def get_speed(self) -> float:
        """Items per minute"""
        if len(self.item_times) < 2:
            return 0.0
        
        start_t, start_c = self.item_times[0]
        end_t, end_c = self.item_times[-1]
        
        duration_sec = end_t - start_t
        if duration_sec <= 0:
            return 0.0
            
        items_done = end_c - start_c
        return (items_done / duration_sec) * 60

    def get_eta(self) -> Optional[timedelta]:
        """Estimated time remaining"""
        speed_per_sec = self.get_speed() / 60
        if speed_per_sec <= 0:
            return None
            
        remaining_items = self.data.total_items - self.data.completed_items
        if remaining_items <= 0:
            return timedelta(0)
            
        seconds_left = remaining_items / speed_per_sec
        return timedelta(seconds=int(seconds_left))

    def get_progress_percentage(self) -> float:
        if self.data.total_items <= 0:
            return 0.0
        return (self.data.completed_items / self.data.total_items) * 100

    def get_summary(self) -> Dict:
        return {
            "completed": self.data.completed_items,
            "total": self.data.total_items,
            "failed": self.data.failed_items,
            "speed": self.get_speed(),
            "eta": str(self.get_eta()) if self.get_eta() else "Onbekend",
            "progress": self.get_progress_percentage(),
            "elapsed": str(timedelta(seconds=int(time.time() - self.data.start_time)))
        }
