# ⚡ Quick Reference: Phase Completion Checklists

Use this document as a **daily reference** to validate phase completion. Each section corresponds to a phase and lists the minimum viable deliverables.

---

## ✅ PHASE 1: Foundation & Infrastructure

**Estimated Duration:** Days 1–5  
**Goal:** Project structure, data persistence, logging, Qt bootstrap

### Must-Have Deliverables
- [ ] Project directory restructured (`app/`, `core/`, `tests/`, `assets/`)
- [ ] `requirements.txt` updated with all final dependencies
- [ ] SQLite database created with all 7 base tables
- [ ] Migration system working (auto-run on app startup)
- [ ] `app/main.py` launches PySide6 QApplication
- [ ] Minimal `app/ui/App.qml` loads (empty window)
- [ ] Logger writes to file + console
- [ ] Platform-aware data directories initialized
- [ ] Keyring adapter functional on dev OS (Windows, macOS, or Linux)
- [ ] Qt signal/slot system working (test with dummy button in QML)

### Definition of Done
```
[ ] App launches without errors
[ ] No SQLite errors in logs
[ ] Settings saved/loaded correctly
[ ] Keyring password save/retrieve works
[ ] QML window renders
```

### Quick Test Commands
```bash
python app/main.py              # Should launch empty window
python app/main.py --debug      # Should show debug logs
sqlite3 ~/.local/share/BrowserApp/app.sqlite ".tables"  # Should list 7 tables
```

---

## ✅ PHASE 2: Core Browser Navigation & Tabs

**Estimated Duration:** Days 6–15  
**Goal:** Working tabs, navigation, session management

### Must-Have Deliverables
- [ ] Tab model (`QAbstractListModel`) working with mock data
- [ ] QtWebEngine profile configured with persistent storage
- [ ] `QWebEngineView` rendering pages in active tab
- [ ] Toolbar with Back/Forward/Refresh/Home buttons (functional)
- [ ] Omnibox accepting input and navigating to URLs
- [ ] Tab bar showing tabs with close buttons
- [ ] `Ctrl+T` opens new tab; `Ctrl+W` closes current tab
- [ ] Navigation history tracked (back/forward buttons update)
- [ ] Session saved to disk on app close
- [ ] Session restored on app restart
- [ ] Search query detection (omnibox text → default search engine)
- [ ] Page title + favicon updated as page loads

### Definition of Done
```
[ ] Navigate to google.com → page loads
[ ] Back/Forward buttons work
[ ] New Tab (Ctrl+T) and Close Tab (Ctrl+W) work
[ ] Close and restart app → tabs restored
[ ] Type search query in omnibox → searches
```

### Quick Test Commands
```bash
# Test tab creation
# Test navigation
# Test session persistence
```

---

## ✅ PHASE 3: Data Management (Bookmarks, History, Downloads)

**Estimated Duration:** Days 16–25  
**Goal:** Data persistence, UI for data management, omnibox suggestions

### Must-Have Deliverables
- [ ] Bookmarks Manager UI (list, add, delete, folders)
- [ ] Bookmarks saved to SQLite
- [ ] Bookmarks loaded on app startup
- [ ] `Ctrl+D` adds current page to bookmarks
- [ ] `Ctrl+Shift+O` opens Bookmarks Manager
- [ ] History Manager UI (grouped by date, search, delete range)
- [ ] History logged on every page visit
- [ ] `Ctrl+H` opens History Manager
- [ ] Downloads panel UI (shows progress, completion status)
- [ ] Downloads saved to SQLite with metadata
- [ ] "Clear browsing data" dialog with checkboxes (history, bookmarks, cache, etc.)
- [ ] Omnibox suggests history + bookmarks as user types
- [ ] Download count badge on toolbar (if downloads panel exists)

### Definition of Done
```
[ ] Add bookmark via Ctrl+D → appears in Bookmarks Manager
[ ] Delete bookmark → removed from manager and disk
[ ] Open Bookmarks Manager → can navigate folders, search, delete
[ ] Open History Manager → grouped by date, can search/delete range
[ ] Download a file → progress shown, saved to Downloads folder
[ ] Type in omnibox → suggestions appear from history + bookmarks
[ ] Clear browsing data → selected types cleared
```

### Quick Test Commands
```bash
# Test bookmarking
# Test history logging
# Test clear data
# Test omnibox suggestions
```

---

## ✅ PHASE 4: Passwords & Security

**Estimated Duration:** Days 26–30  
**Goal:** Password save/fill with OS keychain integration

### Must-Have Deliverables
- [ ] Submit a form → "Save password?" prompt appears
- [ ] Click "Save" → password stored in OS keychain (Windows Credential Manager, etc.)
- [ ] Password Manager UI shows saved passwords (masked)
- [ ] Click "Reveal" → password shown (optional: with auth prompt)
- [ ] Copy password button → copies to clipboard
- [ ] Delete password → removed from keychain
- [ ] Password metadata (origin, username hint) stored in SQLite
- [ ] Exclusion list (sites where we don't prompt) functional
- [ ] "Save passwords" toggle in Settings enables/disables prompting
- [ ] Keyring graceful fallback (if unavailable, show warning)

### Definition of Done
```
[ ] Submit form on website → "Save password?" prompt
[ ] Save password → no error in logs
[ ] Restart app → password still retrievable
[ ] Open Password Manager → password listed (masked)
[ ] Delete password → removed from manager
[ ] Add site to exclusion list → no more prompts for that site
```

### Quick Test Commands
```bash
# Test form submission on mock website
# Test password save/retrieve
# Test keyring integration (check OS password store)
```

---

## ✅ PHASE 5: Advanced Tab Features & Organization

**Estimated Duration:** Days 31–40  
**Goal:** Tab groups, vertical tabs, quick switcher, tab overview

### Must-Have Deliverables
- [ ] Tab Group creation (right-click tab → "Add to group" or Ctrl+G)
- [ ] Tab groups display in tab bar (collapsible sections or group label)
- [ ] Group collapse/expand animations working
- [ ] Change group color (context menu or group settings)
- [ ] Rename group (right-click group header)
- [ ] Delete group (right-click, confirm dialog)
- [ ] Vertical tabs mode toggle (Settings → Appearance → Tab Layout: Vertical)
- [ ] Vertical tabs render correctly (sidebar, groups as sections)
- [ ] Quick Switcher (Ctrl+K) opens, accepts input, filters tabs/history/bookmarks
- [ ] Quick Switcher fuzzy matching works (type "goo" → finds "google.com")
- [ ] Keyboard nav in Quick Switcher (arrows, Enter to select, Escape to close)
- [ ] Tab Overview (Ctrl+Shift+A or menu) shows grid of tabs with thumbnails
- [ ] Tab drag-reorder with smooth animation
- [ ] Tab context menu (right-click): reload, pin, duplicate, move to group, close, etc.

### Definition of Done
```
[ ] Create tab group, add tabs → group visible in tab bar
[ ] Collapse/expand group → smooth animation, tabs hide/show
[ ] Switch tab layout to vertical → sidebar appears, groups display as sections
[ ] Press Ctrl+K → quick switcher opens
[ ] Type "gmail" → quick switcher filters to matching tabs/history
[ ] Click result or press Enter → switches to that tab
[ ] Press Escape → quick switcher closes
[ ] Ctrl+Shift+A → tab overview grid shown
[ ] Drag tab to new position → animates, order saved
```

### Quick Test Commands
```bash
# Test tab group creation and collapse
# Test vertical tab layout toggle
# Test quick switcher (Ctrl+K)
# Test tab overview (Ctrl+Shift+A)
# Test tab drag-reorder
```

---

## ✅ PHASE 6: UI Polish & Animations

**Estimated Duration:** Days 41–55  
**Goal:** Micro-interactions, theming, new tab page, 60 FPS performance

### Must-Have Deliverables
- [ ] Motion spec defined (durations, easings, spring values)
- [ ] Tab open animation (spring slide-in from right, 120–180 ms)
- [ ] Tab close animation (fade-out + collapse width, 180 ms)
- [ ] Group collapse/expand animation (cross-fade, scaleY spring)
- [ ] Omnibox focus animation (elevate, glow, suggestion dropdown slide-up)
- [ ] Panel slide-in animation (side panels, 180 ms)
- [ ] Button hover effects (opacity change, scale 1.0→1.05)
- [ ] Button press effects (scale 1.05→0.98 feedback)
- [ ] Ripple effect on click (visible on all buttons)
- [ ] Focus ring animations (input fields glow on focus)
- [ ] Theme service functional (Light, Dark, High-Contrast)
- [ ] All UI components use theme colors (no hardcoded colors)
- [ ] Dynamic accent color extraction (from wallpaper or site)
- [ ] New Tab page renders with:
  - [ ] Wallpaper background (image or gradient)
  - [ ] Time/date widget
  - [ ] Speed dial (most visited + pinned bookmarks in grid)
  - [ ] Quick action buttons (New Tab Group, Incognito, Settings)
  - [ ] Fade/slide-in animations on load (staggered)
- [ ] Theme switching (Light ↔ Dark) updates all UI immediately
- [ ] QML Profiler confirms 60 FPS during:
  - [ ] Tab switching
  - [ ] Animations (tab open/close, group collapse)
  - [ ] Scrolling pages
  - [ ] Model updates

### Definition of Done
```
[ ] Switch theme to Dark → all colors update
[ ] Open new tab → page animates in (spring slide)
[ ] Close tab → animates out (fade + collapse)
[ ] Collapse tab group → smooth cross-fade animation
[ ] Hover over button → scale + ripple effect
[ ] Press Ctrl+T → new tab animates in smoothly
[ ] Open new tab page → speed dial visible with animations
[ ] QML Profiler shows sustained 60 FPS during interactions
```

### Quick Test Commands
```bash
# Test theme switching
# Test all animations for smoothness
# Run QML Profiler during interactions
# Verify 60 FPS target
```

---

## ✅ PHASE 7: Settings & Customization

**Estimated Duration:** Days 56–62  
**Goal:** Comprehensive settings, shortcut editor, customization

### Must-Have Deliverables
- [ ] Settings page accessible (Cmd+, or Settings icon in toolbar)
- [ ] Settings organized by section (sidebar menu)
- [ ] Appearance Settings:
  - [ ] Theme selector (Light/Dark/High-Contrast)
  - [ ] Tab layout selector (Horizontal/Vertical)
  - [ ] Density selector (Comfortable/Compact)
  - [ ] Wallpaper picker
  - [ ] Accent color picker
- [ ] Search Settings:
  - [ ] Default search engine dropdown
  - [ ] List of search engines with add/edit/delete buttons
  - [ ] Keyword search (e.g., "dd query" → DuckDuckGo)
- [ ] Startup Settings:
  - [ ] Radio buttons: New Tab / Restore Last Session / Custom Pages
  - [ ] Custom pages input
- [ ] Shortcuts Settings:
  - [ ] List of all shortcuts (grouped by category)
  - [ ] Edit button per shortcut (record new key sequence)
  - [ ] Conflict detection (warn if shortcut already in use)
  - [ ] "Reset to defaults" button
- [ ] Passwords Settings:
  - [ ] "Save passwords" toggle
  - [ ] "Auto-fill" toggle
  - [ ] Manage Passwords button (→ Password Manager)
  - [ ] Exclusion list
- [ ] Downloads Settings:
  - [ ] Downloads folder picker
  - [ ] "Ask before download" toggle
  - [ ] Clear on exit toggle
- [ ] Advanced Settings:
  - [ ] Privacy options (tracking prevention, clear on exit)
  - [ ] Web features (JavaScript, plugins, images enabled/disabled)
  - [ ] Performance options (cache size)
- [ ] All settings persist on app restart
- [ ] Keyboard shortcuts dynamically update when changed

### Definition of Done
```
[ ] Open Settings (Cmd+,) → page loads
[ ] Switch theme → app updates immediately
[ ] Change default search engine → omnibox respects it
[ ] Add custom search engine with keyword → can use keyword search
[ ] Edit a shortcut → conflict detector alerts if conflict
[ ] Change startup behavior → persists on restart
[ ] All settings visible and functional in respective sections
```

### Quick Test Commands
```bash
# Test opening Settings
# Test theme switching
# Test search engine change
# Test shortcut editor
# Test settings persistence on restart
```

---

## ✅ PHASE 8: Extensions Framework (Scaffold)

**Estimated Duration:** Days 63–70  
**Goal:** Extension system foundation, content scripts, message bridge

### Must-Have Deliverables
- [ ] Extension manifest v0 schema defined and validated
- [ ] Extension host loads extensions from `~/.local/share/BrowserApp/extensions/`
- [ ] Manifest validator parses manifest.json and checks required fields
- [ ] Content script injection functional (JS injects into matching pages)
- [ ] QtWebChannel message bridge working (JS ↔ Python messaging)
- [ ] Extension storage API functional (key/value storage per extension in SQLite)
- [ ] Extensions Manager UI (list extensions, enable/disable, reload, uninstall)
- [ ] "Load unpacked" button (for local development)
- [ ] Example extension works (e.g., simple dark mode toggle or page info helper)
- [ ] Extension permissions respected (content_scripts, storage, messaging)

### Definition of Done
```
[ ] Load example extension via Extensions Manager
[ ] Enable extension → no errors
[ ] Navigate to website matching extension's URL pattern
[ ] Content script injects (verify in DevTools if available)
[ ] Extension can read/write to storage (test with simple example)
[ ] Reload extension → state preserved
[ ] Disable extension → content script no longer injects
```

### Quick Test Commands
```bash
# Test loading example extension
# Test content script injection
# Test message bridge (JS ↔ Python)
# Test extension storage
```

---

## ✅ PHASE 9: Incognito & Multiple Profiles

**Estimated Duration:** Days 71–75  
**Goal:** Private browsing, user profiles, data isolation

### Must-Have Deliverables
- [ ] Incognito window support:
  - [ ] Ctrl+Shift+N launches new incognito window
  - [ ] Incognito profile is off-the-record (ephemeral, no persistent storage)
  - [ ] Incognito window visually distinct (e.g., darker theme)
  - [ ] Browsing in incognito doesn't log history
  - [ ] Passwords not saved in incognito mode
- [ ] Multiple profile support:
  - [ ] Create new profile via Settings → Profiles
  - [ ] Profile data isolated (separate bookmarks, history, passwords)
  - [ ] Profile switcher in toolbar (avatar/dropdown)
  - [ ] Switch profile → active tabs reload from new profile's DB
  - [ ] Delete profile (confirm dialog, delete data or archive)
- [ ] Profile-specific data:
  - [ ] Each profile has own SQLite database
  - [ ] Each profile has own QWebEngineProfile (separate cache/storage)
  - [ ] Passwords per profile (keyring namespace)
- [ ] Default profile on first launch ("Default")

### Definition of Done
```
[ ] Press Ctrl+Shift+N → new incognito window opens (visually distinct)
[ ] Browse in incognito → history not logged
[ ] Close incognito, reopen → cookies not retained
[ ] Create new profile "Work" → separate from "Default"
[ ] Switch profiles → bookmarks/history different
[ ] Add bookmark in "Work" → not visible in "Default"
[ ] Settings → Profiles shows all profiles, can rename/delete
```

### Quick Test Commands
```bash
# Test incognito window (Ctrl+Shift+N)
# Test profile creation and switching
# Test data isolation between profiles
```

---

## ✅ PHASE 10: Advanced Features & Polish

**Estimated Duration:** Days 76–82  
**Goal:** Find, screenshots, reader mode, zoom, page actions

### Must-Have Deliverables
- [ ] Find in page:
  - [ ] Ctrl+F opens find panel
  - [ ] Highlights matches on page (yellow background, current green)
  - [ ] Shows "X of Y matches" counter
  - [ ] Navigate matches (previous/next buttons)
  - [ ] Case-sensitive toggle
  - [ ] Escape closes find panel
- [ ] Screenshot tool:
  - [ ] Accessible via page actions menu (⋯ button)
  - [ ] Options: visible area / full page / region (scaffold)
  - [ ] Preview before save
  - [ ] Save to Downloads folder (with timestamp)
  - [ ] Copy to clipboard option
- [ ] Reader mode (scaffold):
  - [ ] Accessible via page actions menu or Ctrl+Alt+R
  - [ ] Simplifies page DOM (removes ads, sidebars, scripts)
  - [ ] Font size slider
  - [ ] Background color options (white/sepia/dark)
  - [ ] Line spacing adjustment
- [ ] Page zoom:
  - [ ] Ctrl+Plus / Ctrl+Minus / Ctrl+0 (reset) → zoom page
  - [ ] Zoom level persists per domain
  - [ ] Zoom indicator in toolbar (when zoomed)
- [ ] Page actions menu:
  - [ ] Print (Ctrl+P)
  - [ ] Screenshot
  - [ ] Reader mode toggle
  - [ ] Page zoom controls
  - [ ] Show page source (Ctrl+U)
  - [ ] Page info (metadata, link count, etc.)
- [ ] PDF viewer enhancements:
  - [ ] Toolbar with zoom, page navigation
  - [ ] Page counter ("Page X of Y")
  - [ ] Download button

### Definition of Done
```
[ ] Press Ctrl+F → find panel opens at bottom
[ ] Type "example" → all matches highlighted
[ ] Click next/prev → navigates through matches
[ ] Open page actions menu (⋯) → screenshot option visible
[ ] Take screenshot → dialog shows options
[ ] Select "Full page" → screenshot captures entire scrollable page
[ ] Save screenshot → file appears in Downloads folder
[ ] Press Ctrl+Alt+R → reader mode simplifies page
[ ] Zoom page (Ctrl+Plus) → zoom persists for domain on next visit
[ ] Open PDF → toolbar shows zoom and page navigation
```

### Quick Test Commands
```bash
# Test Ctrl+F (find in page)
# Test screenshot tool
# Test reader mode
# Test Ctrl+Plus/Minus (zoom)
# Test page actions menu
```

---

## ✅ PHASE 11: Performance & Reliability

**Estimated Duration:** Days 83–87  
**Goal:** Profiling, optimization, crash recovery, testing, memory management

### Must-Have Deliverables
- [ ] Performance baselines documented:
  - [ ] Startup time (cold start, < 3 seconds target)
  - [ ] Memory footprint (idle, with 10 tabs, peak usage)
  - [ ] Frame rate during animations (target 60 FPS)
- [ ] QML Profiler reports generated (key interactions)
- [ ] Crash recovery functional:
  - [ ] App crash detection (PID file check)
  - [ ] Session snapshot on app close
  - [ ] Restore banner on restart ("Restore? Yes / No")
  - [ ] Session restored if user approves
- [ ] Maintenance routines:
  - [ ] Old history (> 90 days) cleaned up
  - [ ] Old sessions (> 30 days) deleted
  - [ ] Cache cleanup on-demand or periodic
- [ ] Automated test suite (pytest):
  - [ ] Unit tests for bookmarks service
  - [ ] Unit tests for history service
  - [ ] Unit tests for navigation service
  - [ ] Unit tests for passwords service
  - [ ] Integration tests (full-flow: launch, browse, bookmark, restart, verify)
- [ ] All tests pass
- [ ] Code coverage > 70% (if tracked)
- [ ] Memory profile shows no major leaks
- [ ] 60 FPS verified during:
  - [ ] Tab switching
  - [ ] Animations
  - [ ] Page scrolling
  - [ ] Model updates (100 tabs)

### Definition of Done
```
[ ] Startup time < 3 seconds (cold start)
[ ] Memory footprint reasonable (< 500 MB idle with 10 tabs)
[ ] Force-kill app → restart shows "Restore?" banner
[ ] Click "Yes" → tabs restored to previous state
[ ] Run pytest → all tests pass
[ ] QML Profiler shows 60 FPS during all interactions
[ ] Create 100 tabs → still renders at 60 FPS
[ ] Memory profiler shows no major leaks
```

### Quick Test Commands
```bash
# Run pytest (unit + integration tests)
pytest tests/

# Run QML performance test
# Use Qt Creator's QML Profiler on key interactions
# Measure startup time
# Memory profiling (valgrind or Qt memory tool)
```

---

## ✅ PHASE 12: Launch & Distribution

**Estimated Duration:** Days 88–90  
**Goal:** Packaging, signing, documentation, release

### Must-Have Deliverables
- [ ] Windows installer:
  - [ ] PyInstaller configuration created (`build_windows.ps1`)
  - [ ] `.exe` installer generated
  - [ ] Installer tested on clean Windows VM
  - [ ] Code-signed (EV cert or self-sign for testing)
- [ ] macOS app:
  - [ ] PyInstaller configuration for macOS
  - [ ] `.app` bundle + `.dmg` created
  - [ ] Code-signed with Apple Developer cert
  - [ ] Notarized (submitted via `altool`, stapled)
  - [ ] Tested on clean macOS VM
- [ ] Linux package:
  - [ ] AppImage created (or `.deb` / `.rpm`)
  - [ ] Tested on Ubuntu and Fedora VMs
- [ ] Landing page:
  - [ ] Website with app name, features, screenshots
  - [ ] Download links (Windows, macOS, Linux)
  - [ ] Privacy policy (local-only, no telemetry)
  - [ ] FAQ section
- [ ] Documentation:
  - [ ] User Guide (features, settings, shortcuts, troubleshooting)
  - [ ] Privacy Policy (detailed)
  - [ ] Developer Guide (architecture, extension development, build from source)
- [ ] Release materials:
  - [ ] Release notes (`RELEASE_NOTES.md`) with v1.0.0 changelog
  - [ ] Known issues documented
  - [ ] Roadmap for future versions
  - [ ] Version tag in repo (`v1.0.0`)
- [ ] Auto-update stub:
  - [ ] Update checker service implemented
  - [ ] Version check endpoint (JSON file or server)
  - [ ] Notify user if new version available
  - [ ] Link to GitHub releases or update server
- [ ] QA final checklist (Appendix A):
  - [ ] All manual tests pass
  - [ ] No crashes during typical usage
  - [ ] Performance stable (no memory leaks observed)
  - [ ] All features functional

### Definition of Done
```
[ ] Run Windows installer on clean VM → app launches
[ ] Run macOS app on clean VM → app launches
[ ] Run Linux AppImage → app launches
[ ] Visit landing page → features and download links visible
[ ] Read privacy policy → clarifies local-only storage
[ ] Read user guide → all major features documented
[ ] Final QA checklist (Appendix A) → all items passed
```

### Quick Test Commands
```bash
# Build Windows installer
build_windows.ps1

# Test installer on clean VM
# Test app functionality post-install

# Build macOS app
# Test on macOS VM

# Build Linux AppImage
# Test on Linux VM

# Verify landing page live
# Verify release notes published
```

---

---

## 🎯 Phase Completion Signals

Use these **quick signals** to know when a phase is truly complete:

### ✅ Phase Complete If:
1. **All must-have deliverables** (checked above) are implemented
2. **Definition of Done** checklist passes (manual test)
3. **No critical bugs** blocking further progress
4. **Code review** done (if team-based)
5. **Documentation** updated
6. **Next phase** can start immediately without unresolved blockers

### 🚩 Phase NOT Complete If:
- Major features stubbed (e.g., "TODO" in code)
- Manual tests fail
- Crashes occur during normal usage
- Performance doesn't meet targets (if specified)
- Critical bugs marked as "known issues"

---

## 📊 Progress Snapshot Template

Print and fill this out **weekly** to track progress:

```
Date: ________________
Phase: ________________
Target Completion: ________________

Completed Tasks (this week):
[ ] Task 1
[ ] Task 2
[ ] Task 3

In-Progress Tasks:
[ ] Task 4
[ ] Task 5

Blockers / Issues:
1. ___________________
2. ___________________

Next Week's Focus:
- ___________________
- ___________________

Confidence Level (1–10): _____
Comments: ___________________
```

---

**Print this document and post it in your workspace. Check off items daily. Report blockers immediately. Ship fast, iterate often.** 🚀

