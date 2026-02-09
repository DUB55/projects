# 🔗 Phase 2 Integration Guide

**Overview:** How to use all 4 Phase 2 modules together  
**Target Audience:** Developers implementing Phase 2 features  
**Date:** January 20, 2026

---

## 1. Initialization Sequence

### Step 1: Initialize BrowserProfile Manager (App Startup)

```python
from pathlib import Path
from app.core.browser.browser_profile import init_profile_manager, get_profile_manager

# On app startup (in app/main.py)
data_dir = Path.home() / ".browser" / "data"
init_profile_manager(data_dir)

# Get profile manager
pm = get_profile_manager()
profiles = pm.get_all_profiles()
active = pm.set_active_profile(profiles[0].id)
```

### Step 2: Initialize WebEngine for Active Profile

```python
from app.core.browser.web_engine import WebEngineManager

# When switching profiles
active_profile = pm.get_active_profile()
engine = WebEngineManager(active_profile.data_path)

# Get QWebEngineProfile for Qt
web_profile = engine.get_profile()
```

### Step 3: Initialize Navigation Manager for Profile

```python
from app.core.browser.navigation import NavigationManager

# Per profile
nav = NavigationManager(active_profile.data_path)

# Later: when page loads
nav.add_entry("https://example.com", "Example Site")
```

### Step 4: Initialize Session Manager for Profile

```python
from app.core.browser.session_manager import SessionManager

# Per profile
sm = SessionManager(active_profile.data_path)

# Restore last session on startup
sessions = sm.get_sessions()
if sessions:
    windows = sm.restore_session(sessions[0].session_id)
    # Reconstruct UI from windows
```

---

## 2. Usage Flow: User Opens New Tab

```
User clicks "New Tab"
    ↓
QML emits newTabClicked signal
    ↓
AppState.create_tab() is called
    ↓
AppState adds tab (profile-scoped)
    ↓
Update profile switcher shows active profile
    ↓
WebEngineView created with engine.create_page()
    ↓
Page loads default (speed dial / new tab page)
```

**Code Example:**
```python
# In AppState
def create_tab(self, url: str = "") -> Tab:
    # Use current profile
    profile_id = self.current_profile_id
    
    # Create tab
    tab_id = self._generate_tab_id()
    tab = Tab(
        tab_id=tab_id,
        profile_id=profile_id,
        url=url or "about:blank"
    )
    
    self.tabs[profile_id].append(tab)
    self.tabCreated.emit(tab)
    return tab
```

---

## 3. Usage Flow: User Navigates

```
User types URL in address bar
    ↓
QML address bar signal → AppState
    ↓
AppState.navigate_tab(tab_id, url)
    ↓
Navigation manager adds to history
    ↓
Back button state updated
    ↓
Page starts loading
    ↓
Page completes
    ↓
AppState.update_tab_state() → LOADED
```

**Code Example:**
```python
# In AppState (to be added)
def navigate_tab(self, tab_id: str, url: str):
    tab = self.get_tab(tab_id)
    if tab:
        # Get nav manager for this profile
        nav = self.nav_managers[tab.profile_id]
        nav.add_entry(url)
        
        # Update tab state
        tab.url = url
        tab.state = TabState.LOADING
        self.tabStateChanged.emit(tab)
```

---

## 4. Usage Flow: Back Button

```
User clicks back button
    ↓
Back button enabled? (nav.can_go_back())
    ↓
NavigationManager.go_back() returns previous URL
    ↓
WebEngineView navigates to URL
    ↓
AppState updates tab.url
    ↓
Back button state updates
```

**Code Example:**
```python
# In AppState (to be added)
def go_back(self, tab_id: str):
    tab = self.get_tab(tab_id)
    if tab:
        nav = self.nav_managers[tab.profile_id]
        url = nav.go_back()
        if url:
            tab.url = url
            tab.state = TabState.LOADING
            self.tabStateChanged.emit(tab)
```

---

## 5. Usage Flow: Profile Switching

```
User clicks profile selector
    ↓
ProfileManager.set_active_profile(profile_id)
    ↓
AppState.current_profile_id updated
    ↓
AppState.profileChanged signal emitted
    ↓
UI updates:
  - Profile switcher shows active profile
  - Tab bar switches to tabs for this profile
  - WebEngine recreated with new profile
```

**Code Example:**
```python
# When user switches profile via UI
profile_manager = get_profile_manager()
profile_manager.set_active_profile(new_profile_id)

# AppState gets notification (via signal or direct call)
app_state.set_current_profile(new_profile_id)

# UI responds to signal
# - ProfileSwitcher updates display
# - Tab bar loads this profile's tabs
# - WebEngineView switches profiles
```

---

## 6. Usage Flow: Auto-Save Session (30-second interval)

```
Timer fires every 30 seconds
    ↓
SessionManager.save_current_session() called
    ↓
Collect all window states:
    - Window position/size
    - All tabs in window
    - Current active tab
    ↓
SessionManager creates session snapshots
    ↓
Session JSON saved to profiles.json
    ↓
Timer continues
```

**Code Example:**
```python
# QML Timer (30 seconds)
Timer {
    interval: 30000  // 30 seconds
    running: true
    repeat: true
    
    onTriggered: {
        // Python function
        appState.autoSaveSession()
    }
}

# In AppState.autoSaveSession()
def autoSaveSession(self):
    profile_id = self.current_profile_id
    sm = self.session_managers[profile_id]
    
    # Build window snapshots
    windows = []
    for tab in self.tabs[profile_id]:
        # ... build WindowSnapshot
        pass
    
    sm.save_current_session(windows)
```

---

## 7. Usage Flow: Close & Reopen Browser

```
User closes browser
    ↓
SessionManager.save_current_session() final save
    ↓
Browser process exits
    ↓
---
User opens browser again
    ↓
Profile Manager loads active profile
    ↓
Session Manager loads last session
    ↓
Session windows/tabs reconstructed from snapshots
    ↓
UI renders
    ↓
Pages start loading (background)
```

**Code Example:**
```python
# On app startup
def restore_session():
    pm = get_profile_manager()
    active = pm.get_active_profile()
    
    sm = SessionManager(active.data_path)
    sessions = sm.get_sessions()
    
    if sessions:
        windows = sm.restore_session(sessions[0].session_id)
        
        # Reconstruct tabs from windows
        for window_snapshot in windows:
            for tab_snapshot in window_snapshot.tabs:
                app_state.create_tab(tab_snapshot.url)
```

---

## 8. Data Directory Structure

```
~/.browser/data/
├── profiles.json              ← Profile list
├── profiles/
│   ├── default/
│   │   ├── cache/             ← WebEngine cache
│   │   ├── storage/           ← LocalStorage, IndexedDB
│   │   ├── history.json       ← Navigation history
│   │   └── sessions/
│   │       ├── session_1.json
│   │       └── session_2.json
│   ├── work/
│   │   ├── cache/
│   │   ├── storage/
│   │   ├── history.json
│   │   └── sessions/
│   └── personal/
│       ├── cache/
│       ├── storage/
│       ├── history.json
│       └── sessions/
├── config.json                ← App settings
├── database.db                ← SQLite (bookmarks, etc.)
└── logs/
    └── browser.log
```

---

## 9. Signal Flow Diagram

```
QML UI Events
    ↓
App State (Qt Signals/Slots)
    ├── tabCreated → QML Tab bar
    ├── tabClosed → QML Tab bar
    ├── tabStateChanged → QML Tab indicator
    ├── profileChanged → Profile switcher, Tab bar
    └── navigationChanged → Address bar, Back button
    ↓
Browser Services
    ├── BrowserProfile → Data isolation
    ├── WebEngine → Page rendering
    ├── Navigation → History tracking
    └── SessionManager → Session save/restore
    ↓
Persistence Layer
    ├── JSON files (profiles, history, sessions)
    ├── SQLite (bookmarks)
    └── File cache/storage
```

---

## 10. Integration Checklist

### AppState Updates
- [ ] Add `current_profile_id` field
- [ ] Add `ProfileManager` instance
- [ ] Add `WebEngineManager` instances per profile
- [ ] Add `NavigationManager` instances per profile
- [ ] Add `SessionManager` instances per profile
- [ ] Add `profileChanged` signal
- [ ] Update `create_tab()` to be profile-scoped
- [ ] Add `navigate_tab()` method
- [ ] Add `go_back()` / `go_forward()` methods
- [ ] Add `auto_save_session()` method

### App.qml Updates
- [ ] Import WebEngineCore
- [ ] Add WebEngineView to content area
- [ ] Connect address bar to navigation
- [ ] Add loading state indicator
- [ ] Update page title handling
- [ ] Connect navigation buttons
- [ ] Add profile switcher component
- [ ] Add 30-second auto-save timer

### New QML Components
- [ ] ProfileSwitcher.qml (dropdown)
- [ ] FindBar.qml (search toolbar)

### New Python Modules
- [ ] BookmarksManager (bookmarks.py)

### Tests
- [ ] Integration test: Profile switching
- [ ] Integration test: Complete session save/restore
- [ ] Integration test: Navigation history
- [ ] Unit tests for each manager

---

## 11. Key Design Patterns

### Pattern 1: Singleton Managers
```python
# Initialize once
init_profile_manager(data_dir)
pm = get_profile_manager()  # Always returns same instance

# Per-profile managers created when needed
sm = SessionManager(profile_path)
nav = NavigationManager(profile_path)
```

### Pattern 2: Profile-Scoped Data
```python
# Each profile has isolated data
profile.data_path         # /path/to/profile/
├── cache/                # WebEngine cache (per profile)
├── storage/              # LocalStorage (per profile)
├── history.json          # Navigation history (per profile)
└── sessions/             # Saved sessions (per profile)
```

### Pattern 3: Qt Signal/Slot for Reactive UI
```python
# Data change in Python
app_state.create_tab(url)

# Signal emitted
app_state.tabCreated.emit(tab)

# QML responds
onTabCreated: tabBar.addTab(tab)
```

### Pattern 4: JSON Persistence
```python
# Objects converted to JSON automatically
session.to_dict()  # Returns dict
json.dump(data)    # Save to file

# Load back
Session.from_dict(data)  # Reconstruct
```

---

## 12. Common Issues & Solutions

### Issue: Data not persisting across profiles
**Solution:** Verify each module uses profile-specific paths:
- NavigationManager(profile_path) 
- SessionManager(profile_path)
- WebEngineManager(profile_path)

### Issue: Navigation buttons not updating
**Solution:** Ensure AppState emits `navigationChanged` signal after `go_back()` / `go_forward()`

### Issue: Session not restoring
**Solution:** Call `restore_session()` on startup, before creating tabs

### Issue: Profile switch causes crash
**Solution:** Ensure WebEngineView recreated with new profile's QWebEngineProfile

---

## 13. Performance Considerations

| Operation | Time | Notes |
|-----------|------|-------|
| Create profile | < 100ms | File I/O only |
| Switch profile | 200-500ms | WebEngine reload |
| Load history | 50-200ms | Depends on size |
| Restore session | 1-2s | Multiple pages load |
| Auto-save session | 100-200ms | JSON write |
| Navigate (back) | < 100ms | History lookup |

**Optimization Tips:**
- Lazy-load history (only show recent)
- Background-load session pages
- Cache WebEngine profiles
- Async file I/O for saves

---

## 14. Testing Template

```python
# tests/test_phase2_integration.py

def test_profile_switching():
    pm = ProfileManager(temp_dir)
    p1 = pm.create_profile("Profile 1")
    p2 = pm.create_profile("Profile 2")
    
    # Data isolation
    nav1 = NavigationManager(p1.data_path)
    nav2 = NavigationManager(p2.data_path)
    
    nav1.add_entry("https://example1.com", "Site 1")
    nav2.add_entry("https://example2.com", "Site 2")
    
    assert nav1.get_history()[0].url == "https://example1.com"
    assert nav2.get_history()[0].url == "https://example2.com"

def test_session_save_restore():
    sm = SessionManager(temp_dir)
    session = sm.create_session("Test Session")
    
    tab = TabSnapshot("tab1", "https://example.com", "Example", 0, True)
    window = WindowSnapshot("win1", 0, 0, 1280, 720, False, [tab], "tab1")
    
    sm.save_current_session([window])
    
    restored = sm.restore_session(session.session_id)
    assert restored[0].tabs[0].url == "https://example.com"
```

---

## 🎯 Next Step

**When ready, implement:**
1. AppState integration (profile-aware tabs)
2. WebEngineView in QML
3. Profile switcher UI
4. Navigation buttons

**Command:** `"Continue Phase 2: Implement AppState integration and WebEngineView"`

---

**Last Updated:** January 20, 2026  
**Integration Status:** Ready for AppState update  
**Contact:** AI Assistant
