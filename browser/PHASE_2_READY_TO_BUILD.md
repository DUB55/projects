# 🚀 PHASE 2 READY TO BUILD - FEATURE IMPLEMENTATION GUIDE

**Status:** ✅ All Foundation Complete - Ready for Features  
**Date:** January 20, 2026  
**Next Steps:** Feature Wiring (Days 8-10)

---

## 🎯 WHAT'S NEXT - IMMEDIATE PRIORITIES

### Priority 1: Speed Dial Wiring (Day 8 - 4-5 hours)

**Location:** `app/ui/pages/SpeedDial.qml`

**Bind Shortcuts Data:**
```qml
GridLayout {
    width: parent.width
    columns: speedDial.columns
    columnSpacing: 12
    rowSpacing: 12
    
    Repeater {
        model: appBridge.speedDialShortcuts  // ← Bind here
        // ... shortcut display code
    }
}
```

**Bind Frequent Sites:**
```qml
Repeater {
    model: appBridge.frequentSites  // ← Bind here
    // ... frequent site display
}
```

**Implement Click to Navigate:**
```qml
MouseArea {
    anchors.fill: parent
    onClicked: {
        webView.url = modelData.url
        appBridge.recordSiteVisit(modelData.url)  // Record visit
    }
}
```

**Estimated Time:** 2-3 hours

---

### Priority 2: Find-in-Page Wiring (Day 8-9 - 4-5 hours)

**Location:** `app/ui/App.qml`

**Show/Hide with Keyboard:**
```qml
Keys.onPressed: {
    if (event.key === Qt.Key_F && event.modifiers & Qt.ControlModifier) {
        findBar.visible = !findBar.visible
        if (findBar.visible) findBar.forceActiveFocus()
        event.accepted = true
    }
}
```

**Connect Find Bar to WebView:**
```qml
FindBar {
    id: findBar
    visible: false
    anchors.bottom: parent.bottom
    
    onSearchTermChanged: {
        // WebEngineView find API (to be implemented)
        webView.findText(term)
    }
    onFindNext: webView.findText(searchTerm, null)
    onFindPrevious: webView.findText(searchTerm, null)
    onCloseFind: visible = false
}
```

**AppState Find Integration:**
```python
# In AppState, add:
def find_in_page(self, text: str):
    manager = self.get_find_manager()
    if manager:
        manager.set_search_term(text)
```

**Estimated Time:** 2-3 hours

---

### Priority 3: Session Recovery (Day 9 - 3-4 hours)

**Location:** `app/main.py` and `app/core/state/app_state.py`

**Auto-Restore on Startup:**
```python
# In initialize_application():
app_state = init_app_state(config.get_data_dir())
profiles = pm.get_all_profiles()
if profiles:
    app_state.set_current_profile(profiles[0].id)
    # Auto-restore session
    app_state.restore_session(profiles[0].id)
```

**Auto-Save Timer:**
- Already implemented in AppState (30 seconds)
- Currently just needs testing

**Session Management UI:**
```qml
// Add to App.qml header:
Button {
    text: "📁"
    width: 40
    height: 40
    onClicked: showSessionManager()
}
```

**Estimated Time:** 2-3 hours

---

### Priority 4: Keyboard Shortcuts (Day 9 - 2-3 hours)

**Shortcuts to Implement:**
```qml
Keys.onPressed: {
    // New Tab: Ctrl+T
    if (event.key === Qt.Key_T && event.modifiers & Qt.ControlModifier) {
        createNewTab()
    }
    // Close Tab: Ctrl+W
    if (event.key === Qt.Key_W && event.modifiers & Qt.ControlModifier) {
        closeCurrentTab()
    }
    // Find: Ctrl+F
    if (event.key === Qt.Key_F && event.modifiers & Qt.ControlModifier) {
        findBar.visible = true
    }
    // Reload: Ctrl+R or F5
    if (event.key === Qt.Key_R && event.modifiers & Qt.ControlModifier ||
        event.key === Qt.Key_F5) {
        webView.reload()
    }
}
```

**Estimated Time:** 1-2 hours

---

## 📋 BUILD ORDER

### Day 8 (High Confidence - 6-7 hours)
1. **Speed Dial Wiring** (3-4 hours)
   - Bind shortcuts list
   - Bind frequent sites list
   - Implement navigation
   - Test data display

2. **Find-in-Page Keyboard** (2-3 hours)
   - Add Ctrl+F handler
   - Show/hide FindBar
   - Focus management

### Day 9 (Medium Confidence - 6-7 hours)
1. **Session Recovery** (3-4 hours)
   - Auto-restore on startup
   - Session save confirmation
   - Session manager UI

2. **Keyboard Shortcuts** (2-3 hours)
   - Ctrl+T new tab
   - Ctrl+W close tab
   - Ctrl+R reload
   - Tab navigation

### Day 10 (Testing & Polish - 5-6 hours)
1. **Unit Tests** (2-3 hours)
   - Test manager classes
   - Test bridge methods
   - Test signal emission

2. **Manual Testing** (2-3 hours)
   - Profile switching
   - Speed dial navigation
   - Find functionality
   - Session recovery

---

## 🧠 IMPLEMENTATION MINDSET

### Start Small, Test Often
- Implement one feature
- Test immediately
- Fix before next feature
- Keep track of what works

### Follow Patterns
- Use existing patterns (managers, signals)
- Copy similar code structures
- Maintain consistency
- Document as you go

### Test Each Component
- Profile switching → test
- Speed dial display → test
- Speed dial click → test
- Find bar show → test
- Find functionality → test
- Session restore → test

---

## 🛠️ TOOLS & RESOURCES

### Debugging
- Use `console.log()` in QML for debugging
- Check `logger.debug()` in Python
- Watch Qt signals with print statements
- Use breakpoints in IDE

### Documentation
- Existing code examples show patterns
- QtWebEngine docs for web APIs
- PySide6 docs for Qt classes
- QML documentation for UI

### Testing
- Run application frequently
- Click all UI elements
- Try all keyboard shortcuts
- Check console output

---

## ⚡ QUICK START FOR DAY 8

### Code to Write First

**SpeedDial.qml - Bind Data:**
```qml
Repeater {
    model: appBridge ? appBridge.speedDialShortcuts : []
    delegate: Rectangle {
        // Use: modelData.url, modelData.title, modelData.icon
    }
}
```

**App.qml - Find Shortcut:**
```qml
Keys.onPressed: (event) => {
    if (event.key === Qt.Key_F && event.modifiers & Qt.ControlModifier) {
        findBar.visible = true
        event.accepted = true
    }
}
```

**AppState - Find Method:**
```python
def find_text(self, text: str):
    manager = self.get_find_manager()
    if manager:
        manager.set_search_term(text)
```

---

## 🎯 SUCCESS CRITERIA

### Speed Dial Complete ✓
- [x] Shortcuts display in grid
- [x] Click navigates to URL
- [x] Frequent sites show
- [x] Visit recording works

### Find-in-Page Complete ✓
- [x] Ctrl+F opens find bar
- [x] Search term input works
- [x] Match counter shows
- [x] Next/prev navigation works

### Sessions Complete ✓
- [x] Auto-save every 30 seconds
- [x] Restore on startup
- [x] Per-profile isolation
- [x] Session manager UI

### Keyboard Complete ✓
- [x] Ctrl+T creates tab
- [x] Ctrl+W closes tab
- [x] Ctrl+F opens find
- [x] Ctrl+R reloads page

---

## 📊 FEATURE COMPLETION TRACKER

### Speed Dial
- [ ] QML binding
- [ ] Click navigation
- [ ] Frequent sites
- [ ] Visit recording
- [ ] UI polish

### Find-in-Page
- [ ] Keyboard shortcut (Ctrl+F)
- [ ] Find bar visibility
- [ ] Search in WebView
- [ ] Match highlighting
- [ ] Next/prev navigation

### Sessions
- [ ] Auto-save on timer
- [ ] Load on startup
- [ ] UI for sessions
- [ ] Session management
- [ ] Data persistence

### Shortcuts
- [ ] Ctrl+T (new tab)
- [ ] Ctrl+W (close tab)
- [ ] Ctrl+F (find)
- [ ] Ctrl+R (reload)
- [ ] Ctrl+Tab (switch tab)

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: appBridge is undefined
**Solution:** Ensure qml_bridge.py is imported and registered in main.py

### Issue: Shortcuts don't display
**Solution:** Check appBridge.speedDialShortcuts has data - verify bridge initialization

### Issue: Find bar doesn't show
**Solution:** Ensure visibility property is set to true, check event.key comparisons

### Issue: Navigation doesn't work
**Solution:** Check webView.url is being set, verify URL format

### Issue: Session doesn't restore
**Solution:** Check SessionManager has data, verify restore_session() is called

---

## 📞 GETTING HELP

### If Something Breaks
1. Check the console logs
2. Verify imports are correct
3. Check bridge initialization
4. Look at existing similar code
5. Read error messages carefully

### If Feature Won't Work
1. Start with a simpler version
2. Add one line at a time
3. Test after each line
4. Use console.log to debug QML
5. Use logger.debug() for Python

### If Stuck
1. Review the architecture document
2. Look at similar working code
3. Check the integration guide
4. Read relevant documentation
5. Test individual components

---

## ✅ YOU'RE READY

All the foundation is in place. The architecture is solid. The integration is working. You now have everything needed to add the features.

**Start with Speed Dial.** It's the most straightforward and will build confidence.

**Then Find-in-Page.** It's more complex but follows the same patterns.

**Then Sessions.** It uses existing managers already in place.

**Then Polish.** Add shortcuts and UI refinements.

You've got this! 🚀

---

**Ready Command:** "Start Phase 2 Features: Implement Speed Dial Wiring"

**Timeline:** 
- Day 8: Speed Dial + Find Keyboard
- Day 9: Session Recovery + Shortcuts
- Day 10: Testing + Polish
- **Target:** Phase 2 Complete by Jan 24 ✅

---

**Created:** January 20, 2026  
**Status:** ✅ Ready to Build Features  
**Next:** Feature Implementation (Days 8-10)
