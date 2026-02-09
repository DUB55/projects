from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Optional, List
import uuid

@dataclass
class SharedText:
    id: str
    name: str
    content: str
    created_at: datetime
    expires_at: datetime
    tags: List[str] = field(default_factory=list)

@dataclass
class FolderShare:
    id: str
    base_path: str
    is_file: bool
    created_at: datetime
    expires_at: datetime
    tags: List[str] = field(default_factory=list)

class Store:
    def __init__(self):
        self.texts: Dict[str, SharedText] = {}
        self.roots: Dict[str, FolderShare] = {}

    def cleanup(self):
        now = datetime.now(timezone.utc)
        self.texts = {k: v for k, v in self.texts.items() if v.expires_at > now}
        self.roots = {k: v for k, v in self.roots.items() if v.expires_at > now}

    def add_text(self, name: str, content: str, ttl_minutes: int, tags: Optional[List[str]] = None) -> SharedText:
        self.cleanup()
        now = datetime.now(timezone.utc)
        item = SharedText(
            id=str(uuid.uuid4()),
            name=name,
            content=content,
            created_at=now,
            expires_at=now + timedelta(minutes=ttl_minutes)
        )
        if tags:
            item.tags = tags
        self.texts[item.id] = item
        return item

    def add_root(self, base_path: str, ttl_minutes: int, tags: Optional[List[str]] = None) -> FolderShare:
        self.cleanup()
        p = Path(base_path).resolve()
        now = datetime.now(timezone.utc)
        item = FolderShare(
            id=str(uuid.uuid4()),
            base_path=str(p),
            is_file=p.is_file(),
            created_at=now,
            expires_at=now + timedelta(minutes=ttl_minutes)
        )
        if tags:
            item.tags = tags
        self.roots[item.id] = item
        return item

    def list_texts(self) -> List[SharedText]:
        self.cleanup()
        return sorted(self.texts.values(), key=lambda x: x.created_at, reverse=True)

    def list_roots(self) -> List[FolderShare]:
        self.cleanup()
        return sorted(self.roots.values(), key=lambda x: x.created_at, reverse=True)

    def get_text(self, text_id: str) -> Optional[SharedText]:
        self.cleanup()
        return self.texts.get(text_id)

    def get_root(self, root_id: str) -> Optional[FolderShare]:
        self.cleanup()
        return self.roots.get(root_id)

    def extend_text(self, text_id: str, minutes: int) -> bool:
        self.cleanup()
        item = self.texts.get(text_id)
        if not item:
            return False
        item.expires_at = item.expires_at + timedelta(minutes=minutes)
        return True

    def extend_root(self, root_id: str, minutes: int) -> bool:
        self.cleanup()
        item = self.roots.get(root_id)
        if not item:
            return False
        item.expires_at = item.expires_at + timedelta(minutes=minutes)
        return True

    def purge_text(self, text_id: str) -> bool:
        return self.texts.pop(text_id, None) is not None

    def purge_root(self, root_id: str) -> bool:
        return self.roots.pop(root_id, None) is not None
