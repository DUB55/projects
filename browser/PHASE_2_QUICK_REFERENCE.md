# 📘 PHASE 2 QUICK REFERENCE

**Purpose:** Fast lookup for Phase 2 modules and usage  
**Date:** January 20, 2026  
**Modules:** 4 completed, 4 remaining

---

## 🎯 Module Summary

| Module | File | Lines | Purpose |
|--------|------|-------|---------|
| BrowserProfile | `browser_profile.py` | 330 | Multi-profile management |
| WebEngine | `web_engine.py` | 280 | QtWebEngine integration |
| Navigation | `navigation.py` | 420 | History & back/forward |
| SessionManager | `session_manager.py` | 420 | Save/restore sessions |

---

## 🔥 10-Second Overview

**BrowserProfile:** Create multiple browser profiles, each with own data  
**WebEngine:** Set up QtWebEngine per profile with isolated cache/storage  
**Navigation:** Track history, handle back/forward, search history  
**SessionManager:** Save complete window/tab state, restore on startup  

---

## 🚀 Quick Usage Examples

### Create Profile
```python
from app.core.browser.browser_profile import get_profile_manager

pm = get_profile_manager()
profile = pm.create_profile("Work", "Office", "blue")
pm.set_active_profile(profile.id)
```

### Create WebEngine
```python
from app.core.browser.web_engine import WebEngineManager

engine = WebEngineManager(profile.data_path)
web_profile = engine.get_profile()  # For QtWebEngine
page = engine.create_page()
```

### Add to History
```python
from app.core.browser.navigation import NavigationManager

nav = NavigationManager(profile.data_path)
nav.add_entry("https://example.com", "Example")

# Navigate back
if nav.can_go_back():
    url = nav.go_back()
```

### Save Session
```python
from app.core.browser.session_manager import SessionManager

sm = SessionManager(profile.data_path)
session = sm.create_session("Morning")

# Build snapshots
tab = TabSnapshot("id", "https://ex.com", "Example", 0, True)
window = WindowSnapshot("wid", 0, 0, 1280, 720, False, [tab], "id")

sm.save_current_session([window])
```

---

## 📂 File Locations

```
app/core/browser/
├── browser_profile.py    ← Profile management
├── web_engine.py         ← WebEngine setup
├── navigation.py         ← History & navigation
└── session_manager.py    ← Session save/restore
```

---

## 🔗 Key Classes

### BrowserProfile (browser_profile.py)
- `BrowserProfile` - Profile data (id, name, icon_color, data_path)
- `ProfileManager` - Manage all profiles

**Methods:** 14 (create, delete, get, set_active, rename, etc.)

### WebEngineManager (web_engine.py)
- `WebEngineManager` - Regular mode
- `OffTheRecordWebEngineManager` - Private mode

**Methods:** 9 (get_profile, create_page, clear_cache, etc.)

### NavigationManager (navigation.py)
- `HistoryEntry` - Single history entry
- `NavigationStack` - Back/forward stack
- `NavigationManager` - Manage history

**Methods:** 11 (add_entry, go_back, go_forward, search, clear, etc.)

### SessionManager (session_manager.py)
- `TabSnapshot` - Saved tab state
- `WindowSnapshot` - Saved window state
- `Session` - Complete session
- `SessionManager` - Manage sessions

**Methods:** 13 (create_session, restore_session, save_current, export, etc.)

---

## 💾 Data Storage

```
~/.browser/data/
├── profiles.json         ← All profiles
└── profiles/[id]/
    ├── cache/            ← WebEngine cache
    ├── storage/          ← LocalStorage
    ├── history.json      ← Navigation history
    └── sessions/[id].json ← Saved sessions
```

---

## 🎯 Core Methods

### BrowserProfile
```python
pm.create_profile(name, desc, color) → BrowserProfile
pm.delete_profile(id) → bool
pm.get_profile(id) → BrowserProfile
pm.get_all_profiles() → List[BrowserProfile]
pm.set_active_profile(id) → bool
pm.rename_profile(id, name) → bool
pm.set_profile_color(id, color) → bool
```

### WebEngineManager
```python
engine.get_profile() → QWebEngineProfile
engine.create_page() → QWebEnginePage
engine.clear_cache()
engine.clear_cookies()
engine.clear_local_storage()
engine.clear_all()
engine.get_cache_size() → int
engine.get_user_agent() → str
engine.set_user_agent(ua: str)
```

### NavigationManager
```python
nav.add_entry(url, title, favicon_url) → HistoryEntry
nav.go_back() → str (url) or None
nav.go_forward() → str (url) or None
nav.can_go_back() → bool
nav.can_go_forward() → bool
nav.get_history(limit=50) → List[HistoryEntry]
nav.search_history(query, limit=20) → List[HistoryEntry]
nav.delete_entry(url) → bool
nav.clear_history()
nav.clear_history_since(timestamp)
nav.get_statistics() → dict
```

### SessionManager
```python
sm.create_session(name, profile_id) → Session
sm.restore_session(session_id) → List[WindowSnapshot]
sm.delete_session(session_id) → bool
sm.save_current_session(windows)
sm.get_sessions() → List[Session]
sm.get_session(session_id) → Session
sm.get_profile_sessions(profile_id) → List[Session]
sm.export_session(session_id, path) → bool
sm.import_session(path, name) → Session
sm.cleanup_old_sessions(keep_count=10) → int
sm.auto_save_interval() → int (30000 ms)
```

---

## 🔀 Data Flow

```
User Action
    ↓
QML Signal
    ↓
AppState Method (TODO)
    ↓
Browser Service Method (BrowserProfile/WebEngine/Navigation/Session)
    ↓
Persistence (JSON/SQLite/Cache/Storage)
    ↓
Return Result
    ↓
AppState Signal
    ↓
QML Update
```

---

## ⚡ Common Patterns

### Initialization
```python
init_profile_manager(data_dir)
pm = get_profile_manager()
profile = pm.get_active_profile()
```

### Per-Profile Setup
```python
engine = WebEngineManager(profile.data_path)
nav = NavigationManager(profile.data_path)
sm = SessionManager(profile.data_path)
```

### Signal/Slot Pattern
```python
# Python emits signal
tab_created_signal.emit(tab_obj)

# QML responds
onTabCreated: { /* update UI */ }
```

### JSON Persistence
```python
data = obj.to_dict()
session.to_dict() → {'id': 'x', 'name': 'y', ...}

obj = Class.from_dict(data)
Session.from_dict({'id': 'x', ...}) → Session instance
```

---

## 🧪 Testing Checklist

- [ ] Create profile, verify data_path created
- [ ] Delete profile, verify JSON updated
- [ ] Switch profile, verify active_profile changed
- [ ] Add history entry, verify history.json created
- [ ] Go back, verify correct URL returned
- [ ] Search history, verify results match
- [ ] Clear history, verify history.json removed
- [ ] Create session, verify JSON file created
- [ ] Restore session, verify tabs reconstructed
- [ ] Export session, verify file readable
- [ ] Clear cache, verify cache/ directory cleaned
- [ ] Private mode, verify no storage created

---

## 📊 Stats

| Metric | Value |
|--------|-------|
| **Total Lines** | 1,450 |
| **Classes** | 11 |
| **Methods** | 45+ |
| **Functions** | 4 |
| **Dataclasses** | 5 |
| **Files** | 4 |
| **Test Cases** | ~40 (to write) |

---

## 🔗 Integration Points

1. **BrowserProfile** → Isolates all data per profile
2. **WebEngineManager** → Creates page instances
3. **NavigationManager** → Provides history for UI
4. **SessionManager** → Provides saved states for restore

**Connect via:** AppState signals/slots to QML UI

---

## 📚 Documentation Index

- **PHASE_2_SUMMARY.md** - Overview & statistics
- **PHASE_2_PROGRESS.md** - Detailed progress tracking
- **PHASE_2_INTEGRATION_GUIDE.md** - Implementation & integration
- **PHASE_2_QUICK_REFERENCE.md** - This file
- **CHANGELOG.md** - Change history

---

## 🎓 Learning Path

**Level 1 - Overview:**
1. Read PHASE_2_SUMMARY.md
2. Review this quick reference

**Level 2 - Usage:**
1. Look at "Quick Usage Examples" above
2. Check "Core Methods" for available APIs
3. Try basic operations

**Level 3 - Integration:**
1. Read PHASE_2_INTEGRATION_GUIDE.md
2. Study "Data Flow" and "Common Patterns"
3. Implement AppState connections

**Level 4 - Testing:**
1. Follow "Testing Checklist"
2. Write unit tests for each module
3. Write integration tests

---

## ❓ FAQ

**Q: How do I switch profiles?**
A: `pm.set_active_profile(profile_id)` then recreate WebEngine/Nav/Session

**Q: Where is history stored?**
A: `profiles/[profile_id]/history.json`

**Q: How often do sessions auto-save?**
A: Every 30 seconds (30000 ms)

**Q: Can I have private mode?**
A: Yes, use `OffTheRecordWebEngineManager`

**Q: How do I restore a session?**
A: `sm.restore_session(session_id)` returns windows to reconstruct

**Q: What if history gets too large?**
A: Auto-cleanup keeps last 1000 entries

**Q: Can I export a profile?**
A: Sessions are exportable: `sm.export_session(id, path)`

**Q: How is data isolated?**
A: Each profile has separate cache/, storage/, history.json, sessions/

---

## 🚀 Next Steps

1. **AppState Integration** - Make tabs profile-aware
2. **WebEngineView** - Add actual web rendering
3. **Profile UI** - Allow switching profiles
4. **Navigation UI** - Back/forward buttons
5. **Session UI** - Show saved sessions

---

## 📞 Quick Help

**Import statements:**
```python
from app.core.browser.browser_profile import (
    get_profile_manager, init_profile_manager
)
from app.core.browser.web_engine import WebEngineManager
from app.core.browser.navigation import NavigationManager
from app.core.browser.session_manager import SessionManager
```

**Initialize:**
```python
init_profile_manager(Path.home() / ".browser" / "data")
pm = get_profile_manager()
```

**Get managers:**
```python
profile = pm.get_active_profile()
engine = WebEngineManager(profile.data_path)
nav = NavigationManager(profile.data_path)
sm = SessionManager(profile.data_path)
```

---

**Last Updated:** January 20, 2026  
**Quick Ref Version:** 1.0  
**Status:** Complete & Ready

---

## 📋 Cheat Sheet

```python
# Profile Management
pm = get_profile_manager()
p = pm.create_profile("Work")
pm.set_active_profile(p.id)
pm.get_all_profiles()

# Web Engine
engine = WebEngineManager(profile.data_path)
profile = engine.get_profile()  # For Qt

# Navigation
nav = NavigationManager(profile.data_path)
nav.add_entry(url, title)
nav.go_back()
nav.search_history("query")

# Sessions
sm = SessionManager(profile.data_path)
sm.create_session("Session Name")
sm.save_current_session([windows])
sm.restore_session(session_id)
```

---

That's it! You now have everything you need to understand and use Phase 2.

**Ready to build?** → "Continue Phase 2: Implement AppState integration"
