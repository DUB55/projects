# 🎯 PHASE 2 - QUICK START INTEGRATION GUIDE

**Status:** Phase 2 Core Modules 100% Complete  
**Date:** January 20, 2026  
**Goal:** Wire components together for working browser

---

## 🔗 INTEGRATION CHECKLIST

### 1. ProfileSwitcher Integration (Next)

**File to Update:** `app/ui/App.qml`

**Add to Header:**
```qml
// In header RowLayout, before address bar:
ProfileSwitcher {
    id: profileSwitcher
    width: 200
    height: 44
    
    profiles: appState.allProfiles
    currentProfileId: appState.currentProfileId
    currentProfileName: appState.currentProfileName
    currentProfileColor: appState.currentProfileColor
    
    onProfileSelected: appState.setCurrentProfile(profileId)
    onCreateProfileClicked: appState.createNewProfile("New Profile")
}
```

**Estimated Time:** 1-2 hours

---

### 2. FindBar Integration

**File to Update:** `app/ui/App.qml`

**Add as Overlay:**
```qml
// Add after WebEngineView:
FindBar {
    id: findBar
    visible: false
    anchors.bottom: parent.bottom
    anchors.left: parent.left
    anchors.right: parent.right
    
    onSearchTermChanged: {
        webView.findText(term)
    }
    onFindNext: webView.findText(searchTerm, null)
    onFindPrevious: webView.findText(searchTerm, null)
    onCloseFind: visible = false
}

// Keyboard shortcut for find:
Keys.onPressed: {
    if (event.key === Qt.Key_F && event.modifiers & Qt.ControlModifier) {
        findBar.visible = true
        findBar.forceActiveFocus()
    }
}
```

**Estimated Time:** 1-2 hours

---

### 3. SpeedDial Integration

**File to Update:** `app/main.py` or new QML file

**Option A - New Tab Page:**
```python
# In AppState, add:
def get_speed_dial_shortcuts(self) -> List:
    """Get speed dial shortcuts for current profile."""
    if self._current_profile_id:
        speed_dial = self._speed_dial_managers.get(self._current_profile_id)
        return speed_dial.get_all_shortcuts() if speed_dial else []
    return []

def get_frequent_sites(self) -> List:
    """Get frequently visited sites."""
    if self._current_profile_id:
        speed_dial = self._speed_dial_managers.get(self._current_profile_id)
        return speed_dial.get_top_frequent_sites() if speed_dial else []
    return []

def record_site_visit(self, url: str, title: str) -> None:
    """Record a site visit."""
    if self._current_profile_id:
        speed_dial = self._speed_dial_managers.get(self._current_profile_id)
        if speed_dial:
            speed_dial.record_visit(url, title)
```

**Option B - In App.qml:**
```qml
// Show SpeedDial when navigating to "about:newtab"
Loader {
    id: pageLoader
    anchors.fill: parent
    
    sourceComponent: {
        if (webView.url === "about:newtab") {
            return speedDialComponent
        } else {
            return webViewComponent
        }
    }
}

Component {
    id: speedDialComponent
    SpeedDial {
        shortcuts: appState.speedDialShortcuts
        frequentSites: appState.frequentSites
        onShortcutClicked: webView.url = url
    }
}
```

**Estimated Time:** 2-3 hours

---

### 4. Backend Integration in AppState

**File to Update:** `app/core/state/app_state.py`

**Add Manager Initialization:**
```python
def __init__(self, data_dir: Optional[Path] = None):
    super().__init__()
    
    # ... existing code ...
    
    # Initialize managers
    self._speed_dial_managers: Dict[str, SpeedDialManager] = {}
    self._find_managers: Dict[str, FindInPageManager] = {}
    
    # Initialize default profile's managers
    if profiles:
        profile = profiles[0]
        self._speed_dial_managers[profile.id] = SpeedDialManager(profile.data_path)
        self._find_managers[profile.id] = FindInPageManager()
        self._current_profile_id = profile.id

def set_current_profile(self, profile_id: str) -> bool:
    """Switch to profile with manager initialization."""
    # ... existing code ...
    
    # Initialize speed dial and find managers
    if profile_id not in self._speed_dial_managers:
        self._speed_dial_managers[profile_id] = SpeedDialManager(profile.data_path)
        self._find_managers[profile_id] = FindInPageManager()
    
    return True
```

**Add Properties for QML Binding:**
```python
@Property
def speedDialShortcuts(self) -> List:
    """Get speed dial shortcuts."""
    if self._current_profile_id and self._current_profile_id in self._speed_dial_managers:
        return [
            {'id': s.id, 'title': s.title, 'url': s.url, 'icon': s.icon, 'color': s.color}
            for s in self._speed_dial_managers[self._current_profile_id].get_all_shortcuts()
        ]
    return []

@Property
def frequentSites(self) -> List:
    """Get frequently visited sites."""
    if self._current_profile_id and self._current_profile_id in self._speed_dial_managers:
        return [
            {'title': s.title, 'url': s.url, 'icon': s.icon, 'color': s.color}
            for s in self._speed_dial_managers[self._current_profile_id].get_top_frequent_sites()
        ]
    return []
```

**Estimated Time:** 1-2 hours

---

## 📋 REMAINING POLISH TASKS

### Phase 2 Polish Phase (Days 8-10)

**Day 8 - UI Integration:**
- [ ] Wire ProfileSwitcher into header
- [ ] Connect FindBar to WebEngineView
- [ ] Implement Ctrl+F keyboard shortcut
- [ ] Add speed dial as default new tab page

**Day 9 - Session Management:**
- [ ] Implement session auto-save
- [ ] Add session recovery on startup
- [ ] Test profile switching preserves session
- [ ] Add session UI panel

**Day 10 - Testing & Polish:**
- [ ] Unit tests for all managers
- [ ] Integration tests for workflows
- [ ] UI/UX polish
- [ ] Bug fixes and edge cases

---

## 🧪 TESTING CHECKLIST

### Unit Tests Needed

```python
# tests/test_find_in_page.py
def test_search_term_setting()
def test_find_next_navigation()
def test_find_previous_navigation()
def test_case_sensitivity()
def test_clear_search()

# tests/test_speed_dial.py
def test_add_shortcut()
def test_remove_shortcut()
def test_record_visit()
def test_get_top_frequent_sites()
def test_persistence()
def test_domain_extraction()
```

### Integration Tests Needed

```python
# tests/integration_test.py
def test_profile_switching_with_speed_dial()
def test_find_in_page_workflow()
def test_speed_dial_shortcut_navigation()
def test_session_recovery_with_bookmarks()
def test_multi_profile_isolation()
```

---

## 📊 ESTIMATED TIMELINE

| Task | Estimated Time | Status |
|------|-----------------|--------|
| ProfileSwitcher integration | 1-2 hours | ⏳ TODO |
| FindBar integration | 1-2 hours | ⏳ TODO |
| SpeedDial integration | 2-3 hours | ⏳ TODO |
| AppState backend updates | 1-2 hours | ⏳ TODO |
| Testing & bug fixes | 2-3 hours | ⏳ TODO |
| **Total Phase 2 Polish** | **7-12 hours** | ⏳ TODO |

**Phase 2 Completion Target:** January 24, 2026 (4 days)

---

## 🎯 SUCCESS CRITERIA

✅ All Phase 2 core modules complete  
✅ UI components connected to AppState  
✅ Navigation working (back/forward/refresh)  
✅ Profile switching functional  
✅ Find-in-page operational  
✅ Speed dial with shortcuts  
✅ Session auto-save and restore  
✅ Multi-profile data isolation  
✅ All tests passing  
✅ Zero console errors  

---

## 💡 KEY IMPLEMENTATION TIPS

1. **Use Qt Properties** for data binding to QML
2. **Emit signals** when state changes for reactivity
3. **Use Connections** in QML to listen for Python signals
4. **Test profile switching** thoroughly (data isolation critical)
5. **Save state** before switching profiles
6. **Handle null managers** gracefully in QML

---

## 📚 REFERENCE LINKS

**Phase 2 Core Modules:**
- BrowserProfile: `app/core/browser/browser_profile.py` (330 lines)
- WebEngine: `app/core/browser/web_engine.py` (280 lines)
- Navigation: `app/core/browser/navigation.py` (420 lines)
- SessionManager: `app/core/browser/session_manager.py` (420 lines)
- Bookmarks: `app/core/browser/bookmarks.py` (280 lines)
- FindInPage: `app/core/browser/find_in_page.py` (140 lines)
- SpeedDial: `app/core/browser/speed_dial.py` (380 lines)

**UI Components:**
- App.qml: `app/ui/App.qml` (247 lines)
- ProfileSwitcher: `app/ui/components/ProfileSwitcher.qml` (180 lines)
- FindBar: `app/ui/components/FindBar.qml` (120 lines)
- SpeedDial: `app/ui/pages/SpeedDial.qml` (290 lines)

---

## 🚀 READY TO INTEGRATE?

**Command:** "Start Phase 2 Polish Integration"

This will begin wiring all the components together for a fully functional browser.

---

**Updated:** January 20, 2026  
**By:** AI Assistant  
**Status:** ✅ Ready for Integration Phase
