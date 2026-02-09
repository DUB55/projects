# 🌐 Modern Desktop Browser - Complete 12-Phase Development Blueprint

**Project:** Feature-rich, locally-stored, animated desktop browser built on PySide6/Qt Quick  
**Stack:** Python + PySide6 + Qt Quick/QML + QtWebEngine + SQLite + OS Keychain  
**Duration:** 12 phases (~90 days, depending on team size and dedication)  
**Target:** MVP → Beta → v1.0 Production Release  

---

## 📋 Executive Summary

This plan is structured to **ship incrementally** while maintaining code quality, UX polish, and performance. Each phase builds upon the previous, with clear hand-off points and validation gates.

- **Phases 1–3:** Foundation (core browser, navigation, data layer)
- **Phases 4–5:** Data & Organization (bookmarks, history, passwords, tab groups)
- **Phases 6–7:** UX Polish & Settings (animations, theming, shortcuts)
- **Phases 8–10:** Advanced Features (extensions scaffold, incognito, advanced tools)
- **Phases 11–12:** Quality & Launch (performance, testing, packaging)

---

---

# PHASE 1: Project Foundation & Infrastructure (Days 1–5)

## 🎯 Goals
- Establish project structure, configuration, and local-only data persistence
- Bootstrap PySide6 + QML shell with event loop
- Create SQLite schema for app data
- Set up keyring (OS password storage) integration
- Establish development workflow & logging

## 📦 Deliverables
1. **Restructured project layout** (clean separation of UI/core/services)
2. **SQLite database schema** (bookmarks, history, sessions, settings, downloads)
3. **Configuration manager** (load/save app settings as JSON or SQLite)
4. **Keyring adapter** (wrapper for `keyring` library → Windows/macOS/Linux)
5. **QML bootstrap** (minimal PySide6 window + QML engine)
6. **Logging & debugging** setup (file-based logs, development console)

## 🛠️ Tasks

### Core Infrastructure
- [ ] Redesign directory structure per the blueprint layout
- [ ] Create `app/main.py` entry point with argument parsing
- [ ] Implement `core/config/config_manager.py` (load/save settings)
- [ ] Set up data directories (platform-aware: `%AppData%` on Windows, `~/.local/share` on Linux/macOS)
- [ ] Create `utils/logger.py` with file + console output
- [ ] Add `requirements.txt` with final dependencies (PySide6, keyring, pyinstaller, etc.)

### Database & Persistence
- [ ] Design & implement `core/persistence/db.py` (SQLite connection pool, context managers)
- [ ] Create migration system (e.g., `core/persistence/migrations/001_initial_schema.sql`)
- [ ] Schema tables:
  - `history (id, url, title, visit_time_utc, transition, favicon_id)`
  - `bookmarks (id, parent_id, type, title, url, position, created_utc)`
  - `bookmark_tags (bookmark_id, tag)`
  - `sessions (id, window_id, tab_json, saved_utc)`
  - `settings (key TEXT PRIMARY KEY, value_json)`
  - `downloads (id, url, path, state, bytes_total, bytes_recvd, started_utc, finished_utc)`
  - `search_engines (id, name, keyword, url_template, is_default)`
  - `extensions_manifest (extension_id, manifest_json, enabled, created_utc)`
- [ ] Implement `core/persistence/migrations/__init__.py` with auto-migration on app start

### Keyring & Security
- [ ] Create `core/security/keyring_adapter.py` (wrapper over `keyring` library)
  - Methods: `save_password(service, username, password)`, `get_password(service, username)`, `delete_password(service, username)`
- [ ] Test on Windows (Credential Manager), add fallback for unsupported platforms
- [ ] Document security model in README (explain OS keychain use)

### PySide6 & QML Bootstrap
- [ ] Create `app/core/state/app_state.py` (central state store: tabs, windows, settings as signals/slots)
- [ ] Implement `app/main.py` with QApplication + QQmlApplicationEngine
- [ ] Create minimal `app/ui/App.qml` (empty window, toolbar placeholder)
- [ ] Wire up Qt signal/slot for state changes (e.g., settings theme → QML update)
- [ ] Verify QML engine loads; test signal emission in Python → QML reaction
- [ ] Add hot-reload support (optional but useful for dev)

### Development Tools
- [ ] Add debug/verbose CLI flag (e.g., `--debug`, `--dev-mode`)
- [ ] Create `app/dev_tools.py` with:
  - QML profiler activation
  - Console for printing Python/QML messages
  - Quick database inspector
- [ ] Document setup for local dev (installing from `requirements.txt`, running `python app/main.py`)

## ✅ Validation Checklist
- [ ] App launches without errors; empty QML window appears
- [ ] Settings saved/loaded from disk
- [ ] SQLite database created with all tables
- [ ] Keyring integration tested (password save/retrieve on dev OS)
- [ ] Logger writes to file + console
- [ ] QML signals/slots working (test with a dummy button)

---

---

# PHASE 2: Core Browser Navigation & Tabs (Days 6–15)

## 🎯 Goals
- Implement tab and window management
- Create navigation UI (back/forward/refresh/home/omnibox)
- Build tab model and rendering
- Integrate QtWebEngine for page rendering
- Implement session persistence (crash recovery, "last session" restore)

## 📦 Deliverables
1. **Tab model** (`QAbstractListModel` in Python)
2. **QtWebEngine integration** (per-tab QWebEngineView, profile setup)
3. **Navigation service** (back/forward, refresh, URL handling)
4. **QML tab bar** (horizontal, with close buttons, active state)
5. **Omnibox** (URL/search input with basic history suggestions)
6. **Session manager** (save/restore tabs on crash or "last session" restore)
7. **Toolbar** (back/forward/refresh/home buttons with state)

## 🛠️ Tasks

### Tab Model & State
- [ ] Create `core/models/tabs_model.py` (`QAbstractListModel` subclass)
  - Roles: `id`, `title`, `icon`, `url`, `webview`, `group_id`, `is_pinned`, `is_audio_playing`, `is_loading`, `load_progress`
  - Methods: `add_tab(url, parent_window)`, `remove_tab(tab_id)`, `update_tab(tab_id, **props)`, `get_tab(tab_id)`
- [ ] Create `core/models/windows_model.py` (tracks open windows, active window)
- [ ] Extend `app_state.py` to manage tab/window models and expose as Qt properties

### Navigation Service
- [ ] Create `core/services/navigation.py`
  - Methods: `navigate(view, url)`, `go_back(view)`, `go_forward(view)`, `refresh(view)`, `stop_loading(view)`
  - Track navigation history per view (for back/forward)
  - Emit signals on state changes (can_go_back, can_go_forward, url_changed, title_changed, favicon_changed, loading)
- [ ] Implement simple URL validation (detect search query vs. URL; if search, use default search engine)
- [ ] Create `core/services/search_engines.py` (manage search engine list, get default, resolve search queries)

### QtWebEngine Integration
- [ ] Create `core/browser/web_engine_manager.py`
  - Set up persistent `QWebEngineProfile` (with `storageName`, `persistentStoragePath`, `cachePath`, `downloadPath`)
  - Separate incognito profile (created later in Phase 9, stubbed here)
  - Methods: `create_view(profile)` → returns `QWebEngineView`, `set_download_handler`, `set_request_interceptor`, etc.
- [ ] Configure profile settings:
  - Persistent cookies: `ForcePersistentCookies`
  - User agent (optional custom)
  - Accept language (system locale)
  - Cache size (reasonable default)
- [ ] Implement download handler (trigger download UI in Phase 3)
- [ ] Add page lifecycle signals: `loadStarted()`, `loadProgress(int)`, `loadFinished(bool)`, `titleChanged()`, `iconChanged()`, `urlChanged()`

### QML UI (Toolbar, Tab Bar, Omnibox)
- [ ] Create `app/ui/components/Toolbar.qml`
  - Back/Forward/Refresh/Home buttons (disable when not applicable)
  - Omnibox (text input, focus on Ctrl+L)
  - Status bar (show URL on hover, loading indicator)
- [ ] Create `app/ui/components/TabBar.qml`
  - Horizontal tab list from model
  - Close button per tab (visual hover effect)
  - Active tab highlight
  - Drag-reorder (basic, no animation yet)
  - Right-click context menu (close, duplicate, pin tab—scaffold)
- [ ] Create `app/ui/components/Omnibox.qml`
  - Text input for URL/search
  - Suggestions dropdown (hardcoded empty for now; populated in Phase 3)
  - Address bar styling (show URL as faded text when focused)
  - Enter key navigates
- [ ] Create main `app/ui/App.qml` layout:
  ```
  Window {
    Toolbar { /* top */ }
    TabBar { /* below toolbar */ }
    WebEngineView { /* center, active tab */ }
  }
  ```
- [ ] Connect QML to Python models (assign `tabModel` to TabBar's model, bind active view)

### Session Manager
- [ ] Create `core/services/session_manager.py`
  - Methods: `save_session(window_id) → json`, `load_session(window_id) → [tab_urls]`, `get_last_session()`, `delete_session(window_id)`
  - Store in SQLite `sessions` table (serialized tab list with URLs + positions)
- [ ] On app start:
  - Check if app crashed (no clean shutdown signal); if yes, restore last session
  - Load startup preference (new tab / last session / custom pages) from settings
- [ ] On app close (or interval-based save):
  - Save current tab list to DB
- [ ] Add "Restore last closed tab" (keep stack of recently closed tabs)

### Keyboard Shortcuts (Basic)
- [ ] Register shortcuts in `app/shortcuts.py`:
  - `Ctrl+T` → New Tab
  - `Ctrl+W` → Close Tab
  - `Ctrl+Tab` / `Ctrl+Shift+Tab` → Next/Prev Tab
  - `Ctrl+L` → Focus Omnibox
  - `F5` / `Ctrl+R` → Refresh
  - `Ctrl+Shift+R` → Hard Refresh
  - `Alt+Left` / `Alt+Right` → Back/Forward
  - `Ctrl+H` → History (stub for Phase 3)
  - `Ctrl+D` → Bookmark (stub for Phase 3)
- [ ] Wire to actions in app state

## ✅ Validation Checklist
- [ ] App launches with one blank tab
- [ ] Navigate to a website (e.g., `google.com`); content loads
- [ ] Back/Forward/Refresh buttons work and update toolbar state
- [ ] Omnibox accepts input; Enter navigates
- [ ] New Tab (`Ctrl+T`), Close Tab (`Ctrl+W`), Tab switching work
- [ ] Session saved on close; app restores tabs on next launch
- [ ] Keyboard shortcuts respond
- [ ] No crashes during navigation or tab operations

---

---

# PHASE 3: Data Management Layer (Days 16–25)

## 🎯 Goals
- Implement bookmarks and history services with persistent storage
- Build bookmarks manager UI and history UI
- Integrate "Clear browsing data" dialog
- Add download manager with progress tracking
- Populate omnibox suggestions (history + bookmarks)

## 📦 Deliverables
1. **Bookmarks service** (CRUD, folder structure, tags)
2. **History service** (log visits, query ranges, delete)
3. **Downloads service** (track progress, manage paths)
4. **Bookmarks manager UI** (tree view, add/edit/delete, folders)
5. **History UI** (list by date, search, delete range)
6. **Downloads panel** (progress, open folder, pause/resume placeholder)
7. **"Clear browsing data" dialog**
8. **Omnibox suggestion engine** (history + bookmarks + search)

## 🛠️ Tasks

### Bookmarks Service
- [ ] Create `core/services/bookmarks.py`
  - Methods: `add_bookmark(title, url, folder_id, tags)`, `delete_bookmark(id)`, `update_bookmark(id, **props)`, `get_bookmarks(parent_id)`, `add_folder(name, parent_id)`, `delete_folder(id)`, `get_tree()`, `import_html(path)`, `export_html(path)`
  - Query: `search_bookmarks(query)` (search by title/url/tags)
  - Track `created_utc`, `modified_utc`
- [ ] Wire DB operations to SQLite schema (bookmarks, bookmark_tags tables)
- [ ] Implement folder hierarchy (parent_id → tree structure)
- [ ] Add signals: `bookmark_added`, `bookmark_deleted`, `folder_added`, `folder_deleted`

### Bookmarks Manager UI
- [ ] Create `app/ui/pages/BookmarksManager.qml`
  - Left pane: folder tree (expandable)
  - Right pane: list of bookmarks in selected folder
  - Toolbar: Add Bookmark, Add Folder, Import, Export
  - Context menu: Edit, Delete, Move to Folder
  - Search box (fuzzy match title/URL/tags)
  - Double-click to open in new tab
- [ ] Create Python model `core/models/bookmarks_model.py` (expose bookmarks tree to QML)
- [ ] Bind to action: `Ctrl+Shift+O` → open Bookmarks Manager; `Ctrl+D` → quick-add bookmark for current page

### History Service
- [ ] Create `core/services/history.py`
  - Methods: `add_visit(url, title, timestamp)`, `get_history(start_date, end_date)`, `delete_range(start_date, end_date)`, `delete_all()`, `search_history(query)`
  - Group by day automatically for UI
  - Track `transition` type (link, typed, generated, etc.)
- [ ] Wire to DB schema (history table)
- [ ] Add signals: `visit_added`, `history_cleared`
- [ ] Log every page visit (trigger on `loadFinished()` in navigation service)

### History UI
- [ ] Create `app/ui/pages/HistoryManager.qml`
  - Group by date (Today, Yesterday, 1 week ago, etc.)
  - List of visits with favicon, title, URL, time
  - Search box (filter by title/URL)
  - Multi-select + delete button
  - "Clear all" button
- [ ] Create Python model `core/models/history_model.py` (expose grouped history to QML)
- [ ] Bind to action: `Ctrl+H` → open History Manager

### Downloads Service
- [ ] Create `core/services/downloads.py`
  - Track download state: `STARTING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `PAUSED`
  - Methods: `add_download(url, path, mime_type)`, `update_progress(download_id, bytes_received, bytes_total)`, `complete_download(id)`, `cancel_download(id)`, `get_downloads()`, `clear_downloads(time_range)`, `open_in_folder(path)`
  - Store metadata in SQLite (downloads table)
- [ ] Hook QtWebEngine's download handler:
  - Create `core/browser/download_handler.py`
  - On download request, prompt user for location (or use default Downloads folder)
  - Relay progress signals back to Downloads Service

### Downloads Panel UI
- [ ] Create `app/ui/panels/DownloadsPanel.qml`
  - Slide-out from bottom-right (toggled by `Ctrl+J`)
  - List of downloads with:
    - File icon + name + URL
    - Progress bar (if in-progress)
    - Status (downloading / completed / failed)
    - Action buttons: open, show in folder, pause/resume (if supported), cancel, remove
  - "Clear all" button (with time-range filter)
- [ ] Create Python model `core/models/downloads_model.py`
- [ ] Integrate with Toolbar: show download count badge

### Clear Browsing Data Dialog
- [ ] Create `app/ui/dialogs/ClearBrowsingDataDialog.qml`
  - Time-range selector (Last hour / Last day / Last week / All time)
  - Checkboxes:
    - [ ] Cookies and cached images and files
    - [ ] History
    - [ ] Downloaded files list (not actual files)
    - [ ] Passwords
    - [ ] Cache
  - "Clear data" button
- [ ] Create `core/services/browsing_data.py` to handle multi-service clearing
  - Clear QtWebEngine profile cache: `QWebEngineProfile.clearHttpCache()`, `clearHttpCacheAsync()` (Qt 6.3+)
  - Clear bookmarks service (optional)
  - Clear history service
  - Clear passwords from keyring
  - Clear downloads metadata
- [ ] Bind to menu or settings

### Omnibox Suggestions
- [ ] Create `core/services/suggest.py`
  - Methods: `get_suggestions(query)` → list of (title, url, type, icon)
  - Query history, bookmarks, search engines for matches
  - Rank by relevance + recency
  - Limit to ~10 results
- [ ] Async fetch (don't block UI during typing)
- [ ] Update `Omnibox.qml` to display suggestions in dropdown
- [ ] On selection, navigate to URL or execute search

## ✅ Validation Checklist
- [ ] Bookmarks Manager opens (`Ctrl+Shift+O`); can add/delete/organize bookmarks
- [ ] History Manager opens (`Ctrl+H`); shows visits grouped by date
- [ ] Omnibox shows history + bookmark suggestions as you type
- [ ] Downloads panel shows in-progress and completed downloads
- [ ] "Clear browsing data" dialog clears selected data types
- [ ] On app restart, bookmarks and history persist
- [ ] No crashes during bookmark/history operations

---

---

# PHASE 4: Password & Security Management (Days 26–30)

## 🎯 Goals
- Implement password save/fill with OS keychain integration
- Build password manager UI
- Create save-password prompts on form submission
- Ensure credentials are encrypted in OS keychain

## 📦 Deliverables
1. **Password service** (save, retrieve, delete, list)
2. **OS keychain adapter** (Windows/macOS/Linux)
3. **Password save prompt** (on form submission detection)
4. **Password fill injection** (via content scripts, minimal for now)
5. **Password manager UI** (list, view, delete)
6. **Settings for password behavior** (save passwords on/off, show passwords on/off)

## 🛠️ Tasks

### Password Service
- [ ] Create `core/services/passwords.py`
  - Methods: `save_password(origin, username, password)`, `get_passwords(origin)`, `delete_password(origin, username)`, `list_all_passwords()` (for manager)
  - Store **password metadata** (origin, username_hint, last_used) in SQLite (new table `password_metadata`)
  - Store **actual password** in OS keychain via `keyring_adapter.py`
  - Use service name: `"BrowserApp-{origin}"`
- [ ] Add signals: `password_saved`, `password_deleted`

### Password Save Prompt
- [ ] Create `core/browser/form_detector.py`
  - Inject a small JS snippet into page that detects form submission
  - On submit, message the Python side with origin, username, password (via QtWebChannel or JavaScript bridge)
  - **Security note:** Only transmit over secure channel; consider hashing or encrypting in transit (mitigation: use window-local JS bridge, not network)
- [ ] Create `app/ui/dialogs/SavePasswordPrompt.qml`
  - Show when form submits: "Save password for [username] on [origin]?"
  - Buttons: Save, Never for this site, Not now
  - If "Never", add origin to exclusion list (store in settings)
- [ ] Integrate with app state: emit signal on form submit → trigger dialog

### Password Manager UI
- [ ] Create `app/ui/pages/PasswordsManager.qml`
  - List all saved passwords (show origin, username, masked password)
  - Reveal password toggle (require password or biometric prompt on Windows/macOS; optional for MVP)
  - Copy to clipboard button
  - Delete button
  - Search by origin/username
  - Settings toggle: "Save passwords on/off"
  - Exclusion list (sites where we don't prompt)
- [ ] Create Python model `core/models/passwords_model.py`

### Password Fill (Minimal MVP)
- [ ] For MVP, focus on **save** behavior; **fill** can be:
  - Keyboard shortcut to trigger a fill suggestion (scaffold)
  - Or manual: show a "Fill" button in password manager, copy password
  - (Full auto-fill requires more JS bridge; deferred to Phase 8+)

### Keyring Adapter (Finalization)
- [ ] Test on Windows (Credential Manager):
  - `keyring.set_password("BrowserApp-https://example.com", "user@example.com", "secretpassword")`
  - `keyring.get_password("BrowserApp-https://example.com", "user@example.com")` → retrieves
- [ ] Graceful fallback if keyring unavailable (in-memory cache with warning, or fallback encryption)
- [ ] Add password strength indicator (optional, for future)

## ✅ Validation Checklist
- [ ] Submit a form on a website; "Save password" prompt appears
- [ ] Click "Save"; password stored in OS keychain
- [ ] Open Password Manager; saved password listed
- [ ] Restart app; password still retrievable
- [ ] Delete password; removed from keyring and UI
- [ ] Sites in exclusion list don't prompt
- [ ] No crashes or keyring errors

---

---

# PHASE 5: Advanced Tab Features & Organization (Days 31–40)

## 🎯 Goals
- Implement tab groups with collapse/color/label
- Add vertical tabs mode
- Build quick switcher (Ctrl+K) with fuzzy search
- Create tab overview / grid view
- Improve tab drag-reorder and context menus

## 📦 Deliverables
1. **Tab groups model & service**
2. **Tab groups UI** (collapsible, colored label, bulk actions)
3. **Vertical tabs mode** (alternative layout)
4. **Quick switcher** (fuzzy search tabs, history, commands)
5. **Tab overview** (zoomed grid, animated scale)
6. **Enhanced tab context menu** (pin, group, duplicate, etc.)
7. **Tab drag-reorder** (with animation)

## 🛠️ Tasks

### Tab Groups Service & Model
- [ ] Create `core/services/tab_groups.py`
  - Methods: `create_group(name, color)`, `delete_group(id)`, `add_tab_to_group(tab_id, group_id)`, `remove_tab_from_group(tab_id)`, `set_group_collapsed(id, collapsed)`, `rename_group(id, name)`, `set_group_color(id, color)`
  - Store in SQLite (new table: `tab_groups (id, name, color, collapsed)` and `tab_group_members (group_id, tab_id)`)
- [ ] Extend `tabs_model.py` with `group_id` role
- [ ] Create `core/models/groups_model.py` (expose tab groups to QML)
- [ ] Add signals: `group_created`, `group_deleted`, `group_collapsed`, `tab_grouped`

### Tab Groups UI
- [ ] Update `app/ui/components/TabBar.qml` to show groups:
  - If vertical layout: show group headers (collapsible sections); tabs indent under group
  - If horizontal: show group label before tabs (optional, or in a separate "group bar")
- [ ] Create `app/ui/components/TabGroup.qml` (represents one group)
  - Header with group name + color indicator
  - Collapse/expand toggle
  - Context menu: rename, change color, remove group
  - Drag group to reorder
- [ ] Color picker for group (preset palette: red, blue, green, yellow, purple, orange)

### Vertical Tabs Mode
- [ ] Add setting: `appearance.tab_layout` → "horizontal" | "vertical"
- [ ] Redesign TabBar layout:
  - Vertical: sidebar on left, ~200px wide, tabs scroll vertically
  - Horizontal: traditional top bar
- [ ] Update main layout to accommodate sidebar
- [ ] Groups show as collapsible sections in vertical mode
- [ ] Animate transition between layouts (slide/fade)

### Quick Switcher (Ctrl+K)
- [ ] Create `app/ui/dialogs/QuickSwitcher.qml`
  - Modal overlay, centered input box
  - Input triggers fuzzy search across:
    - Tabs (by title, URL, group name)
    - History (recent visits)
    - Bookmarks
    - Commands (shortcut list)
  - Show results in a scrollable list
  - Keyboard nav: arrow keys to select, Enter to activate
  - Escape to close
  - Real-time as you type (debounced to 100ms)
- [ ] Create `core/services/quick_search.py` (fuzzy search implementation)
  - Use simple fuzzy matching (can upgrade to `rapidfuzz` if needed)
  - Rank results by relevance + recency
- [ ] Integrate with shortcut system: Ctrl+K triggers Quick Switcher

### Tab Overview
- [ ] Create `app/ui/dialogs/TabOverview.qml`
  - Grid of tab thumbnails (animated scale-in from 0 → 1.0)
  - Show favicon, title, snippet of URL
  - Click to activate, keyboard nav (arrow keys)
  - Escape to close
  - Option: trigger on Ctrl+Shift+A or via menu
- [ ] Consider using QML Image or WebKit thumbnail API (minimal for MVP; can improve later)

### Enhanced Tab Context Menu
- [ ] Right-click on tab → menu:
  - [ ] Reload
  - [ ] Pin Tab
  - [ ] Duplicate
  - [ ] Move to New Group
  - [ ] Move to Existing Group (submenu)
  - [ ] Close Tab
  - [ ] Close Tabs to the Right (future)
  - [ ] Close All Tabs in Group (if grouped)
- [ ] Implement in `app/ui/components/TabContextMenu.qml`

### Tab Drag-Reorder with Animation
- [ ] Enhance TabBar to support drag-drop:
  - On drag start, fade tab slightly; show drop indicator
  - On drop, animate tab to new position (spring easing)
  - Update `tabs_model` position attribute
  - Save to session
- [ ] Use QML `DropArea` + `Drag` attached properties

## ✅ Validation Checklist
- [ ] Create tab group, add tabs to it, verify group appears in tab bar
- [ ] Collapse/expand group; tabs hide/show
- [ ] Switch tab layout to vertical; sidebar appears, groups show as sections
- [ ] Press Ctrl+K; quick switcher opens; type and filter tabs/history
- [ ] Press Ctrl+Shift+A (or menu); tab overview grid shows
- [ ] Drag tab to new position; animates smoothly
- [ ] Right-click tab; context menu shows options
- [ ] Tab groups and layout persist on restart

---

---

# PHASE 6: UI Polish & Animations (Days 41–55)

## 🎯 Goals
- Implement comprehensive motion spec and micro-interactions
- Polish all UI components with animations and hover states
- Build theming system (light/dark/high-contrast)
- Create new tab page with speed dial and wallpaper
- Optimize for 60 FPS performance

## 📦 Deliverables
1. **Motion spec** (YAML: durations, easings, spring values)
2. **Animated transitions** (tab open/close, group collapse, panel slide, page fade)
3. **Micro-interactions** (hover ripple, press feedback, focus glow)
4. **Theme engine** (light/dark/high-contrast, persistent)
5. **Dynamic accent color** (from wallpaper or site theme color)
6. **New Tab page** (speed dial, live time/weather tiles, quick actions)
7. **Performance baseline** (60 FPS verification, QML Profiler results)

## 🛠️ Tasks

### Motion Spec Definition
- [ ] Create `app/ui/theme/MotionSpec.qml`
  ```qml
  pragma Singleton
  QtObject {
    readonly property QtObject durations: QtObject {
      readonly property int fast: 120
      readonly property int normal: 180
      readonly property int slow: 240
    }
    readonly property QtObject easings: QtObject {
      readonly property int standard: Easing.OutCubic
      readonly property int decel: Easing.OutQuart
      readonly property int easeIn: Easing.InCubic
    }
  }
  ```
- [ ] Document motion spec in `docs/motion_spec.md` with examples

### Animated Tab Open/Close
- [ ] Tab open: slide-in from right (x: parent.width → x: 0) + opacity 0→1 (120ms)
- [ ] Tab close: fade out + collapse width (opacity 1→0 + width to 0 in 180ms)
- [ ] Spring bounce on new tab (scale 0.96→1.0 with spring easing)
- [ ] Implement in `app/ui/components/TabItem.qml` with states + transitions

### Animated Group Collapse/Expand
- [ ] Group collapse: cross-fade child tabs, scaleY spring (1.0→0)
- [ ] Group expand: reverse; children slide in
- [ ] Implement in `TabGroup.qml`

### Animated Panel Slide-In/Out
- [ ] Side panels (Bookmarks, History, Downloads): slide from edge
- [ ] Omnibox focus: elevate (shadow) + glow; suggestion list fade/slide-up
- [ ] Implement in `Omnibox.qml`, `SidePanel.qml`

### Micro-Interactions
- [ ] Button hover: opacity change, scale 1.0→1.05
- [ ] Button press: scale feedback 1.05→0.98
- [ ] Ripple effect on click (QML: custom Rectangle with radial gradient)
- [ ] Tab hover: highlight background fade-in
- [ ] Focus ring: glow animation on focused input (width pulse)
- [ ] Implement reusable `RippleButton.qml` component

### Theme Engine
- [ ] Create `core/services/theme_service.py`
  - Methods: `set_theme(theme_name)`, `get_theme()`, `get_available_themes()`, `set_accent_color(color)`, `get_accent_color()`
  - Themes: "Light", "Dark", "High-Contrast"
  - Store preference in SQLite settings
- [ ] Create `app/ui/theme/Themes.qml` (singleton) with color definitions:
  ```qml
  QtObject {
    id: themes
    property QtObject light: QtObject {
      property color background: "#FFFFFF"
      property color foreground: "#000000"
      property color accent: "#0078D4"  // or dynamic
      property color surface: "#F3F3F3"
    }
    property QtObject dark: QtObject {
      property color background: "#1E1E1E"
      property color foreground: "#FFFFFF"
      property color accent: "#60A5FA"
      property color surface: "#2D2D2D"
    }
  }
  ```
- [ ] Connect theme setting to QML `Palette` or custom bindings
- [ ] All components reference theme colors, not hardcoded

### Dynamic Accent Color
- [ ] Create `core/services/accent_color.py`
  - Extract prominent color from wallpaper or website theme color meta tag
  - Methods: `extract_accent_from_image(path)`, `extract_accent_from_page(html)`, `set_accent_manually(color)`
  - Use library like `colorsys` or `PIL` to sample dominant color
- [ ] Set accent color in theme on app start or tab switch
- [ ] QML observes accent color property and updates dynamically

### New Tab Page
- [ ] Create `app/ui/pages/NewTabPage.qml`
  - Background: wallpaper (configurable image or gradient)
  - Top: time/date widget
  - Center: speed dial (most visited sites + pinned bookmarks in grid)
  - Speed dial card: favicon + title, click to navigate, right-click to remove/reorder
  - Optional live tiles: weather, news, quote (scaffold; fetch from local service or hardcode for MVP)
  - Bottom: quick actions (New Tab Group, New Incognito Window, Settings)
  - All elements have subtle animations on load (fade/slide-in staggered)
- [ ] Create `core/services/most_visited.py` (query history for top sites)
- [ ] Integrate wallpaper: read from Windows wallpaper path or allow custom upload
- [ ] Add customization in Settings (enable/disable speed dial, choose background)

### Performance Optimization & Profiling
- [ ] Use Qt Creator's **QML Profiler** to measure frame times
  - Target: 60 FPS (16.7 ms per frame)
  - Identify jank: long paints, JS parsing, model updates
- [ ] Optimize common issues:
  - Avoid nested `Repeater`s; use `ListView` / `GridView` with delegates
  - Cache layer for expensive visuals (shadows, blur): `cache: true` on complex items
  - Lazy-load delegates (don't render off-screen)
  - Debounce resize/scroll events
- [ ] Profile tab switching, opening multiple tabs, scrolling pages
- [ ] Create `docs/performance_profile.md` with baseline measurements

## ✅ Validation Checklist
- [ ] New tab animates open (spring slide-in)
- [ ] Tab close animates (fade + collapse)
- [ ] Group collapse/expand smooth spring animation
- [ ] Hover over buttons shows ripple and scale effect
- [ ] Focus ring glows on input fields
- [ ] Switch theme from Light to Dark; all colors update
- [ ] New Tab page loads with animations and speed dial visible
- [ ] QML Profiler shows 60 FPS during tab switching
- [ ] No visible stutter during any UI transitions

---

---

# PHASE 7: Settings & Customization (Days 56–62)

## 🎯 Goals
- Implement comprehensive settings UI with multiple sections
- Create shortcut editor with conflict detection
- Build startup and homepage configuration
- Allow search engine customization and keyword assignment

## 📦 Deliverables
1. **Settings manager** (load/save sections)
2. **Settings UI** (pages: Appearance, Search, Downloads, Startup, Shortcuts, Advanced)
3. **Shortcut editor** (view, assign, detect conflicts)
4. **Search engine manager** (add/remove engines, set default, keyword search)
5. **Startup behavior** (new tab, last session, custom pages)
6. **Homepage configuration**
7. **Advanced settings** (cache size, user agent, JavaScript, plugins, site permissions scaffold)

## 🛠️ Tasks

### Settings Manager (Enhancement)
- [ ] Extend `core/services/settings.py` or create new if not fully implemented
  - Methods: `get_setting(key, default)`, `set_setting(key, value)`, `get_all_settings()`, `reset_to_defaults()`
  - Organize settings by section: `appearance`, `search`, `startup`, `privacy`, `advanced`
  - Emit signal on change: `setting_changed(key, value)`
- [ ] Persist all settings in SQLite or JSON file

### Settings UI Structure
- [ ] Create `app/ui/pages/SettingsPage.qml` (main settings container)
  - Left sidebar: section list (Appearance, Search, Startup, Passwords, Downloads, Shortcuts, Advanced)
  - Right content area: section-specific UI
  - Search box: filter settings by keyword

#### Appearance Settings
- [ ] `app/ui/pages/settings/AppearanceSettings.qml`
  - Theme selector: Light / Dark / High-Contrast
  - Density selector: Comfortable / Compact (affects padding/spacing)
  - Font size slider (smaller → larger)
  - Wallpaper picker (button to select image file)
  - Accent color: custom picker or "extract from wallpaper"
  - Tab layout: Horizontal / Vertical
  - Show/hide bookmarks bar option
  - Glass mode toggle (if GPU allows; fallback gracefully)

#### Search Settings
- [ ] `app/ui/pages/settings/SearchSettings.qml`
  - Default search engine dropdown
  - List of search engines with edit/delete buttons
  - "Add search engine" form:
    - Name (e.g., "DuckDuckGo")
    - URL template (e.g., "https://duckduckgo.com/?q=%s")
    - Keyword (e.g., "dd") for quick search
  - Autocomplete suggestions toggle
  - Safe search toggle (if applicable)

#### Startup Settings
- [ ] `app/ui/pages/settings/StartupSettings.qml`
  - Radio buttons: Open new tab / Restore last session / Custom pages
  - If "Custom pages": input field to enter URLs (comma-separated or + button to add)
  - Option: Open last closed tabs on startup

#### Passwords Settings
- [ ] `app/ui/pages/settings/PasswordsSettings.qml`
  - "Save passwords" toggle
  - "Auto-fill passwords" toggle
  - "Show passwords" option (with warning)
  - Button: "Manage passwords" → opens Password Manager
  - Exclusion list (sites where we don't prompt)

#### Downloads Settings
- [ ] `app/ui/pages/settings/DownloadsSettings.qml`
  - Downloads folder path picker
  - "Ask where to save each file" toggle
  - Checkboxes:
    - [ ] Show downloads when complete
    - [ ] Clear downloads on exit
  - Button: "Show in folder" (open downloads folder)

#### Shortcuts Settings
- [ ] `app/ui/pages/settings/ShortcutsSettings.qml`
  - List of all shortcuts (grouped by category: Navigation, Tabs, Tools, etc.)
  - Each row: command name, current shortcut, "Edit" button
  - Click "Edit" → single-key input (record new shortcut)
  - Conflict detection: if new shortcut conflicts, show warning + suggestion
  - "Reset to defaults" button
  - Search box to filter shortcuts
- [ ] Implement `core/services/shortcuts_manager.py`:
  - Methods: `get_shortcuts()`, `set_shortcut(command, key_sequence)`, `detect_conflicts(key_sequence)`, `reset_shortcuts()`
  - Validate QKeySequence syntax
  - Save to settings
  - Emit signal on change (update registered shortcuts in main app)

#### Advanced Settings
- [ ] `app/ui/pages/settings/AdvancedSettings.qml`
  - **Privacy & Security:**
    - [ ] Clear browsing data on exit
    - [ ] Disable third-party cookies
    - [ ] Tracking prevention level: Off / Standard / Strict
  - **Web:**
    - JavaScript enabled toggle
    - Plugins enabled toggle
    - Images enabled toggle
    - Web Audio enabled toggle
  - **Performance:**
    - Cache size slider (MB)
    - Memory limit toggle
  - **Developer:**
    - Show FPS counter toggle
    - Enable QML Profiler toggle
    - Clear cache button
  - **About:**
    - App version
    - Qt version
    - Chromium version
    - Shortcuts to docs/privacy policy

### Search Engine Manager
- [ ] Enhance `core/services/search_engines.py`:
  - Methods: `add_engine(name, url_template, keyword)`, `remove_engine(id)`, `set_default_engine(id)`, `get_engines()`, `get_default_engine()`, `search_with_engine(query, engine_id)`
- [ ] Store in SQLite table: `search_engines (id, name, keyword, url_template, is_default, position)`
- [ ] Pre-populate with defaults: Google, DuckDuckGo, Bing, Wikipedia

### Shortcut Registry Update
- [ ] Update `app/shortcuts.py` to be dynamic:
  - On app start, load shortcuts from settings
  - Listen for `shortcuts_changed` signal
  - Unregister old shortcuts, register new ones
  - Prevent duplicate registrations

## ✅ Validation Checklist
- [ ] Open Settings (`Cmd+,` or via menu)
- [ ] Switch theme from Light to Dark; app updates immediately
- [ ] Change default search engine; omnibox respects new engine
- [ ] Add custom search engine with keyword; use it (e.g., type "dd query" in omnibox)
- [ ] Edit a shortcut; conflict detector works
- [ ] Set startup to "restore last session"; app loads previous tabs on restart
- [ ] Change downloads folder; new downloads save to new location
- [ ] All settings persist on restart

---

---

# PHASE 8: Extensions Framework (Phase 2 Scaffold) (Days 63–70)

## 🎯 Goals
- Scaffold extension system architecture
- Implement manifest v0 (minimal spec)
- Create content script injection system
- Build native ↔ extension message bridge
- Create extensions management UI

## 📦 Deliverables
1. **Extension manifest v0** (JSON schema, parser)
2. **Content script injection** (JS into matching pages)
3. **Message bridge** (QtWebChannel: extension ↔ native)
4. **Extension host** (load, validate, manage extensions)
5. **Extensions manager UI** (list, enable/disable, reload, settings)
6. **Extension storage API** (key/value in SQLite)
7. **Example house extension** (e.g., "Dark Reader" or "Tab Groups Helper")

## 🛠️ Tasks

### Extension Manifest v0
- [ ] Define manifest schema (e.g., `app/extensions/manifest_schema.json`)
  ```json
  {
    "manifest_version": 1,
    "name": "My Extension",
    "version": "1.0.0",
    "description": "Does something cool",
    "author": "Me",
    "permissions": ["storage", "tabs", "messaging"],
    "content_scripts": [
      {
        "matches": ["https://example.com/*"],
        "js": ["content.js"]
      }
    ],
    "background": {
      "type": "python",
      "script": "background.py"
    },
    "action": {
      "default_title": "Extension Action",
      "default_popup": "popup.html"
    }
  }
  ```
- [ ] Implement manifest validator in `core/extensions/manifest_parser.py`

### Extension Host
- [ ] Create `core/extensions/extension_host.py`
  - Methods: `load_extension(path)`, `enable_extension(id)`, `disable_extension(id)`, `reload_extension(id)`, `get_extensions()`
  - Validate manifest on load
  - Track enabled/disabled state
  - Manage storage per extension (SQLite table: `extension_storage (extension_id, key, value)`)
- [ ] Create extension data directory structure:
  ```
  ~/.local/share/BrowserApp/extensions/
  ├── com.example.extension1/
  │   ├── manifest.json
  │   ├── content.js
  │   ├── background.py
  │   └── storage.sqlite
  ```

### Content Script Injection
- [ ] Create `core/browser/content_script_injector.py`
  - Hook into `QWebEngineView`'s page load
  - Match extension's `matches` pattern against page URL
  - Inject specified JS file into page context
  - Set up message bridge (see below)
- [ ] Implement JS script injection via `QWebEngineScript`

### Message Bridge (QtWebChannel)
- [ ] Create `core/extensions/extension_api.py` (native API exposed to JS)
  - Methods (callable from extension JS): `send_message(data)`, `storage_set(key, value)`, `storage_get(key)`, `tabs_get_current()`, `tabs_create(url)`
  - Signals (callback to extension JS): `message_received`, `storage_changed`
- [ ] Create QML wrapper `app/ui/components/ExtensionBridge.qml`
  - Use `QtWebChannel` to expose API to JS
  - Set up on each `QWebEngineView`
- [ ] Create example JS bridge in extension template:
  ```javascript
  // Extension JS can call:
  window.nativeBridge.storage.set('key', 'value');
  window.nativeBridge.storage.get('key', (val) => console.log(val));
  window.nativeBridge.tabs.getCurrent((tab) => console.log(tab.url));
  ```

### Extensions Manager UI
- [ ] Create `app/ui/pages/ExtensionsManager.qml`
  - List of installed extensions with icon, name, version, description
  - Toggle: enabled/disabled
  - Buttons: settings (if extension provides UI), reload, uninstall, view source
  - "Load unpacked" button (for developers; point to a folder)
  - Search box (filter by name)
- [ ] Create Python model `core/models/extensions_model.py`

### Extension Storage API
- [ ] Extend DB schema: new table `extension_storage (extension_id TEXT, key TEXT, value TEXT, PRIMARY KEY (extension_id, key))`
- [ ] Implement in `extension_api.py`:
  - `storage.set(key, value)` → insert/update
  - `storage.get(key, callback)` → query + callback
  - `storage.remove(key)`
  - `storage.clear()`

### Example House Extension
- [ ] Create a simple example: `app/extensions/examples/dark_reader_lite/`
  - Manifest: inject CSS to make pages dark
  - `content.js`: toggle dark mode, listen to toggle button
  - Storage: save per-site dark mode preference
  - This demonstrates:
    - Manifest validation
    - Content script injection
    - Storage API
    - Message passing (if user clicks toggle, JS sends message → storage saved)

## ✅ Validation Checklist
- [ ] Load example extension; appears in Extensions Manager
- [ ] Enable/disable extension; toggle works
- [ ] Navigate to website matching extension's `matches` pattern; content script injected
- [ ] Extension calls `storage.set()` and `storage.get()`; data persists
- [ ] Reload extension; state preserved
- [ ] Message bridge works (extension → native, native → extension)
- [ ] Uninstall extension; removed from Extensions Manager and filesystem

---

---

# PHASE 9: Incognito & Multiple Profiles (Days 71–75)

## 🎯 Goals
- Implement incognito (private) browsing mode
- Support multiple user profiles with separate data
- Create profile switcher in UI
- Ensure profile data isolation

## 📦 Deliverables
1. **Incognito profile** (ephemeral, off-the-record)
2. **Profile switcher** (UI to select active profile)
3. **Profile-specific databases** (separate bookmarks, history, settings per profile)
4. **Profile creation/deletion** (add new profiles via UI)
5. **Profile isolation** (no data leakage between profiles)

## 🛠️ Tasks

### Incognito Window Support
- [ ] Create `core/services/incognito_service.py`
  - Method: `create_incognito_window()` → launches a new app window with incognito profile
  - Incognito profile: `QWebEngineProfile` with `offTheRecord=true`, no persistent storage
  - Mark windows as incognito (visual indicator: different theme, e.g., darker/dimmed)
  - Incognito windows don't log history, don't save passwords, don't persist cookies
- [ ] Update `core/browser/web_engine_manager.py` to handle incognito profiles
- [ ] Bind to shortcut: `Ctrl+Shift+N` → New Incognito Window

### Multiple Profiles System
- [ ] Enhance `core/services/profile_service.py`
  - Methods: `create_profile(name)`, `delete_profile(id)`, `switch_profile(id)`, `get_profiles()`, `get_current_profile()`, `get_profile_dir(id)` → path to profile-specific data
  - Store profile list in `settings` table (JSON array)
  - Each profile has separate:
    - SQLite database (at `~/.local/share/BrowserApp/profiles/{profile_id}/app.sqlite`)
    - QWebEngineProfile (with `storageName=profile_{id}`, separate cache/storage paths)
    - Keyring namespace (passwords prefixed with profile ID)
- [ ] Create default profile on first launch: "Default"

### Profile Switcher UI
- [ ] Add profile avatar/button in toolbar (e.g., top-right)
  - Click to open dropdown menu
  - List all profiles with radio-selected current profile
  - Option: "Add new profile" (→ dialog to enter name)
  - Option: "Manage profiles" (→ settings page to delete, rename)
- [ ] On profile switch:
  - Close all open tabs in current profile (or save to session)
  - Switch QWebEngineProfile
  - Reload active tab list from new profile's database
  - Update UI (reload bookmarks, history, passwords from new profile's DB)
  - Visual transition: fade out, switch, fade in

### Profile Settings Page
- [ ] Create `app/ui/pages/settings/ProfilesSettings.qml`
  - List of profiles with name, created date, size
  - Buttons: rename, delete (confirm dialog), set as default
  - "Create profile" button
  - Show which is active

### Profile Data Isolation
- [ ] Ensure:
  - Each profile has its own SQLite database file
  - QWebEngineProfile uses separate paths (`persistentStoragePath`, `cachePath`)
  - Passwords stored in keyring with profile-scoped service name
  - No cross-profile data leakage
- [ ] Test: switch profiles, verify bookmarks/history/passwords don't leak

## ✅ Validation Checklist
- [ ] Press Ctrl+Shift+N; new incognito window opens (visually distinct)
- [ ] Browse in incognito; history not logged
- [ ] Open Settings → Profiles; create new profile "Work"
- [ ] Switch to "Work" profile; bookmarks/history different from "Default"
- [ ] Add bookmark in "Work"; switch back to "Default"; bookmark absent
- [ ] Close incognito window; re-open new incognito window; cookies not retained
- [ ] Passwords in different profiles remain separate

---

---

# PHASE 10: Advanced Features & Polish (Days 76–82)

## 🎯 Goals
- Implement in-page find with smooth highlights
- Add screenshot tool (visible + full page)
- Scaffold reader mode (DOM simplification)
- Enhance PDF viewer experience
- Add page zoom + page actions

## 📦 Deliverables
1. **Find in page** (Ctrl+F, highlight, match count, navigate)
2. **Screenshot tool** (visible area, full page, auto-save)
3. **Reader mode** (simplified, readable layout)
4. **Page zoom** (zoom in/out, reset, persistent per domain)
5. **Page actions menu** (print, take screenshot, reader mode toggle)
6. **PDF viewer enhancements** (toolbar, zoom, download)

## 🛠️ Tasks

### Find in Page
- [ ] Create `app/ui/panels/FindPanel.qml`
  - Input box (Ctrl+F to open, Escape to close)
  - Buttons: previous match, next match
  - Text: "X of Y matches" counter
  - Match highlighting: yellow background, current match green
  - Case-sensitive toggle
- [ ] Implement `core/browser/find_handler.py`
  - Hook: `QWebEngineView.findText(text, options)` (built-in)
  - Track matches and current index
  - Emit signals: `matches_count_changed(count)`, `match_highlighted(index)`
- [ ] Smooth scroll to match (when navigating): use `QWebEngineView.scroll()`

### Screenshot Tool
- [ ] Create `core/browser/screenshot_service.py`
  - Methods: `take_screenshot(view, full_page=False)` → returns QImage or saves to disk
  - Uses: `QWebEngineView.grabToImage()` (built-in, async)
  - Save location: Downloads folder (or temp folder for clipboard)
- [ ] Create `app/ui/dialogs/ScreenshotDialog.qml`
  - Option: visible area / full page / custom region
  - Preview of screenshot
  - Button: Save to Downloads, Copy to clipboard
  - Auto-save to Downloads with timestamped filename (default)
- [ ] Bind to shortcut or menu (e.g., via page actions menu)

### Reader Mode (Scaffold)
- [ ] Create `core/browser/reader_mode.py`
  - Simplified DOM extraction (remove ads, sidebars, scripts)
  - Use library: `readability-lxml` (Python port of Mozilla's Readability)
  - Render simplified HTML in new tab or overlay
- [ ] Create `app/ui/dialogs/ReaderModeDialog.qml`
  - Display simplified content
  - Font size slider
  - Background color (white/sepia/dark)
  - Line spacing slider
- [ ] Bind to: menu icon or Ctrl+Alt+R
- [ ] Note: This is an MVP; full readability can be improved with ML later

### Page Zoom
- [ ] Create `core/services/zoom_service.py`
  - Methods: `set_zoom(view, factor)`, `get_zoom(view)`, `reset_zoom(view)`, `zoom_in(view)`, `zoom_out(view)`
  - Store zoom level per domain in SQLite (new table: `zoom_levels (domain, zoom_factor)`)
  - Use `QWebEngineView.setZoomFactor(float)`
- [ ] Bind to: Ctrl+Plus, Ctrl+Minus, Ctrl+0 (reset)
- [ ] Show zoom indicator in toolbar when zoomed (e.g., "110%")

### Page Actions Menu
- [ ] Add menu button in toolbar (⋯ or icon)
  - Options:
    - [ ] Print (Ctrl+P)
    - [ ] Take screenshot
    - [ ] Toggle reader mode (if supported)
    - [ ] Save page as... (save HTML)
    - [ ] Page zoom: zoom in/out/reset
    - [ ] Show source (Ctrl+U)
    - [ ] Page info (metadata, links count, scripts, etc.)
    - [ ] Developer tools (if dev mode enabled)
    - [ ] Report issue
- [ ] Implement in `app/ui/components/PageActionsMenu.qml`

### PDF Viewer Enhancements
- [ ] QtWebEngine has built-in PDF viewer; enhance with toolbar:
  - Button: zoom in/out
  - Button: previous/next page
  - Input: jump to page
  - Button: download PDF
  - Button: open in external viewer
- [ ] Show page counter (e.g., "Page 5 of 20")
- [ ] Persist zoom level for PDFs

## ✅ Validation Checklist
- [ ] Press Ctrl+F; find panel opens
- [ ] Type search term; matches highlight, counter updates
- [ ] Navigate matches with arrow buttons
- [ ] Press Escape; find panel closes
- [ ] Click ⋯ menu → "Take screenshot"; dialog shows options
- [ ] Select "Full page"; screenshot captures entire scrollable page
- [ ] Save screenshot; file appears in Downloads folder
- [ ] Click ⋯ menu → "Reader mode"; page simplifies
- [ ] Adjust font size in reader mode; applies
- [ ] Zoom page (Ctrl+Plus); zoom persists for domain on next visit
- [ ] Open PDF; toolbar shows zoom and page navigation

---

---

# PHASE 11: Performance & Reliability (Days 83–87)

## 🎯 Goals
- Profile and optimize performance bottlenecks
- Implement comprehensive crash recovery
- Add memory management and cleanup
- Create automated test suite
- Validate 60 FPS performance across features

## 📦 Deliverables
1. **Performance baselines** (frame times, memory, startup time)
2. **Crash recovery** (watchdog, session snapshots, restore on next launch)
3. **Memory audit & optimization** (profile with Qt tools)
4. **Cleanup routines** (old sessions, temp files, old history)
5. **Automated test suite** (unit tests, integration tests, UI tests)
6. **QML Profiler reports** (FPS analysis, hot-spot identification)

## 🛠️ Tasks

### Performance Baseline & Profiling
- [ ] Measure baseline metrics:
  - App startup time (cold start)
  - First paint time (when first tab loads)
  - Interaction latency (e.g., open/close tab, switch tabs)
  - Memory footprint (idle, with N tabs, peak)
  - Frame rate during animations, scrolling, tab operations
- [ ] Use Qt Creator's QML Profiler:
  - Record session while performing key actions
  - Export reports to `docs/performance/`
  - Identify frame drops, long paints, model updates
- [ ] Optimize identified hotspots:
  - Cache expensive bindings
  - Lazy-load delegates
  - Reduce shadow/blur rendering
  - Batch model updates
- [ ] Re-measure post-optimization

### Crash Recovery
- [ ] Create `core/services/crash_recovery.py`
  - Watchdog thread: periodically write session snapshot (every 30 seconds or on significant change)
  - On app start, check for incomplete shutdown (e.g., PID file left behind)
  - If crash detected, restore last session on next launch
  - Show banner: "Restore? [Yes] [No]" (allow user to decline)
- [ ] Implement via PID file:
  - Write PID to `~/.local/share/BrowserApp/app.pid` on start
  - Delete on clean exit
  - On next start, if PID file exists → assume crash
- [ ] Session snapshot includes:
  - Open tabs (URLs, scroll position, form state if possible)
  - Active tab index
  - Open windows (position, size, profile)
  - Groups and their state

### Memory Management
- [ ] Add cleanup routines:
  - Old history (older than 90 days) → delete monthly
  - Old sessions (older than 30 days) → delete
  - Cache cleanup: call `QWebEngineProfile.clearHttpCache()` periodically or on-demand
  - Orphaned temp files → cleanup
- [ ] Implement in `core/services/maintenance.py`:
  - Methods: `cleanup_old_history()`, `cleanup_old_sessions()`, `cleanup_cache()`, `run_maintenance()`
  - Trigger on app idle or scheduled (daily)
- [ ] Monitor memory: add option to log memory stats in debug mode

### Automated Test Suite
- [ ] Create `tests/test_bookmarks.py` (unit tests for bookmarks service)
  - Test: add, delete, update, query bookmarks
  - Test: folder operations
  - Test: import/export
  - Use mock DB or in-memory SQLite
- [ ] Create `tests/test_history.py`
  - Test: add visit, query, delete range
  - Test: grouping by date
- [ ] Create `tests/test_navigation.py`
  - Test: back/forward stack
  - Test: URL validation and search query detection
- [ ] Create `tests/test_passwords.py`
  - Test: save, retrieve, delete (mock keyring)
- [ ] Create `tests/integration_test.py`
  - Full-flow test: launch app, load page, bookmark, close, restart, verify
- [ ] Use `pytest` framework
- [ ] Set up CI/CD (GitHub Actions) to run tests on push

### QML Performance Test
- [ ] Create `tests/qml_performance_test.qml`
  - Benchmark: create 100 tabs, measure frame time
  - Benchmark: rapid tab switching
  - Benchmark: group collapse/expand
  - Output FPS stats
- [ ] Run with QML Profiler; export results

## ✅ Validation Checklist
- [ ] Baseline metrics documented (startup time, memory, FPS)
- [ ] Crash recovery test: kill app process, restart, tabs restored
- [ ] Memory profiler shows reasonable footprint (< 500 MB idle with 10 tabs)
- [ ] Unit tests pass (pytest)
- [ ] QML Profiler shows 60 FPS during all animations
- [ ] History cleanup routine runs; old entries removed
- [ ] No memory leaks detected (valgrind or Qt memory tool)

---

---

# PHASE 12: Launch & Distribution (Days 88–90)

## 🎯 Goals
- Package app for distribution (Windows, macOS, Linux)
- Code signing and security
- Create landing page and documentation
- Prepare release notes
- Set up auto-update infrastructure (basic)

## 📦 Deliverables
1. **Packaged installers** (per-platform: .exe, .dmg, .deb/.AppImage)
2. **Code signing** (Windows EV cert, macOS notarization)
3. **Release notes** (changelog, known issues, roadmap)
4. **Landing page** (website, features, download links)
5. **Documentation** (user guide, privacy policy, troubleshooting)
6. **Auto-update mechanism** (stub; server infrastructure for later)

## 🛠️ Tasks

### Windows Packaging
- [ ] Configure PyInstaller build:
  - Create `build_windows.ps1` (Windows build script using PyInstaller)
  - Specify entry point, dependencies, hidden modules
  - Exclude unnecessary files (reduce bundle size)
  - Bundle assets (icons, themes, example extensions)
  - Output: `dist/BrowserApp-Setup-x.y.z.exe` (NSIS installer) or `.msi`
- [ ] Create installer icon and banner images
- [ ] Test installer: run on clean Windows VM, verify app launches and functions
- [ ] Code sign executable:
  - Obtain EV code signing certificate (or self-sign for testing)
  - Use `signtool.exe` to sign `.exe` and `.msi`
  - Verify signature: right-click Properties → Digital Signatures

### macOS Packaging
- [ ] Configure PyInstaller for macOS:
  - Output: `.app` bundle + `.dmg` for distribution
  - Bundle icon (`.icns`)
  - Test on macOS VM
- [ ] Code signing and notarization:
  - Sign app with Apple Developer certificate
  - Submit for notarization (via `altool`)
  - Staple notarization to app
  - Verify: `spctl -a -v` command

### Linux Packaging
- [ ] Create `.AppImage` (portable, no installation):
  - Use `linuxdeployqt` to bundle dependencies
  - Test on Ubuntu 20.04 LTS, Fedora
- [ ] Create `.deb` package for Debian-based distros
  - Use `checkinstall` or write `.deb` spec manually
- [ ] Create `.rpm` for Red Hat-based distros

### Documentation
- [ ] Create website landing page (`docs/index.html` or external site)
  - Header: app name, tagline, screenshots
  - Features section: animated carousel of key features
  - Download buttons (links to installer releases)
  - FAQ section
  - Privacy policy: explain local-only storage, no telemetry
- [ ] Write user guide (`docs/USER_GUIDE.md`):
  - Getting started (download, install, first launch)
  - Tab management, groups, vertical tabs
  - Bookmarks, history, passwords
  - Settings walkthrough
  - Keyboard shortcuts (printable reference)
  - Troubleshooting (crashes, performance, extensions)
- [ ] Privacy policy (`docs/PRIVACY.md`):
  - Clarify that all data stored locally
  - No telemetry, no analytics
  - No third-party services (except for page rendering)
  - Explain OS keychain usage
- [ ] Developer documentation (`docs/DEVELOPER.md`):
  - Architecture overview
  - Extension development guide
  - Building from source
  - Contributing guidelines

### Release & Changelog
- [ ] Create release notes (`RELEASE_NOTES.md`):
  - Version 1.0.0 changelog:
    - New features (tabs, bookmarks, history, passwords, settings, extensions scaffold)
    - Known issues (e.g., "Reader mode is MVP", "extensions limited to local use")
    - Performance notes
    - Security notes (local-only, no telemetry)
  - Roadmap for v1.1, v2.0 (future directions)
- [ ] Create tag/release in version control: `v1.0.0`

### Auto-Update Infrastructure (Stub)
- [ ] Create `core/services/update_checker.py` (basic)
  - Method: `check_for_updates()` → queries update server (HTTP endpoint)
  - Stub implementation: compare local version to remote version.json
  - If update available, notify user with dialog: "New version available. Download?"
  - Link to GitHub releases or update server
- [ ] For now, update server can be a simple JSON file hosted on a static site or GitHub
- [ ] Future: implement delta updates + signature verification

### Final Testing & QA
- [ ] Test suite verification:
  - All unit tests pass
  - Integration tests pass
  - Manual testing checklist (see Appendix A for full list)
- [ ] Performance verification:
  - Baseline metrics met
  - No regressions from Phase 11
- [ ] Security audit:
  - No hardcoded secrets
  - Keyring usage correct
  - Extension sandbox (basic)
  - SQL injection prevention (parameterized queries)

## ✅ Validation Checklist
- [ ] Windows installer created, tested on clean VM
- [ ] macOS app signed and notarized
- [ ] Linux AppImage created, tested
- [ ] Landing page live with download links
- [ ] Release notes published
- [ ] Privacy policy clear and accurate
- [ ] User guide covers key features
- [ ] Auto-update check works (notifies on new version)
- [ ] All automated tests pass
- [ ] Code coverage > 70% (if tracked)

---

---

# 📅 Gantt Timeline (Simplified)

```
Phase 1:  ████████ (Days 1–5)     Foundation & Infrastructure
Phase 2:  ██████████ (Days 6–15)   Core Browser Navigation
Phase 3:  ██████████ (Days 16–25)  Data Management (Bookmarks, History, Downloads)
Phase 4:  █████ (Days 26–30)       Passwords & Security
Phase 5:  ██████████ (Days 31–40)  Tab Groups & Organization
Phase 6:  ███████████████ (Days 41–55)  UI Polish & Animations
Phase 7:  ██████ (Days 56–62)      Settings & Customization
Phase 8:  ████████ (Days 63–70)    Extensions Scaffold
Phase 9:  █████ (Days 71–75)       Incognito & Profiles
Phase 10: ███████ (Days 76–82)     Advanced Features
Phase 11: █████ (Days 83–87)       Performance & Reliability
Phase 12: ███ (Days 88–90)         Launch & Distribution
         ───────────────────────────────────────────────
         Total: ~90 days (full team: faster; solo dev: extend)
```

---

---

# 🎯 Key Principles Throughout Phases

1. **Incremental delivery**: Ship a functional browser MVP by end of Phase 5
   - Users can browse, organize with bookmarks, use history, manage tabs/groups
   - Settings and animations not essential for early MVP

2. **Code quality**: All phases include testing and documentation
   - Unit tests for services (Phase 11 consolidates, but write as you go)
   - Clear separation of concerns (UI, core, services, persistence)

3. **Local-only commitment**: No backend, no server calls
   - All data in SQLite, OS keychain, or QWebEngine profiles on disk
   - Verify no network requests from browser core (only web pages make requests)

4. **Performance first**: 60 FPS target for all animations
   - Profile regularly (every phase)
   - Avoid common QML pitfalls (nested Repeaters, unbounded delegates)

5. **User delight**: Every interaction should feel responsive
   - Micro-interactions (hover, press, transitions)
   - Keyboard shortcuts as first-class feature
   - Customization (themes, shortcuts, profiles)

---

---

# 📚 Appendix A: Manual QA Checklist (for Phase 12)

## Basic Navigation
- [ ] Open app; blank tab or last session restored
- [ ] Type URL; page loads
- [ ] Back/Forward/Refresh buttons work
- [ ] Home button navigates to homepage
- [ ] F5 refreshes; Ctrl+Shift+R hard-refreshes

## Tabs & Windows
- [ ] Ctrl+T opens new tab
- [ ] Ctrl+W closes current tab
- [ ] Ctrl+Shift+T restores closed tab
- [ ] Ctrl+Tab switches to next tab; Ctrl+Shift+Tab to previous
- [ ] Ctrl+N opens new window
- [ ] Tab drag-reorder works
- [ ] Tab context menu (right-click) shows options

## Bookmarks & History
- [ ] Ctrl+D adds current page to bookmarks
- [ ] Ctrl+Shift+O opens bookmarks manager
- [ ] Ctrl+H opens history manager
- [ ] Search bookmarks and history
- [ ] Delete bookmarks and history entries
- [ ] Clear browsing data dialog works

## Passwords
- [ ] Form submission prompts "Save password?"
- [ ] Saved passwords appear in password manager
- [ ] Passwords cleared on "Clear browsing data"

## Settings
- [ ] Settings page opens and all sections accessible
- [ ] Theme change (Light/Dark) applies immediately
- [ ] Search engine change reflects in omnibox
- [ ] Shortcut editor works, conflicts detected
- [ ] Downloads folder setting respected
- [ ] Startup behavior (new tab / last session) works

## Tab Groups
- [ ] Create tab group; group appears in tab bar
- [ ] Add tabs to group
- [ ] Collapse/expand group
- [ ] Change group color
- [ ] Delete group (tabs remain or move to default)

## Advanced
- [ ] Incognito window (Ctrl+Shift+N) doesn't log history
- [ ] Quick switcher (Ctrl+K) filters tabs/history/commands
- [ ] Find in page (Ctrl+F) highlights and navigates
- [ ] Screenshot tool (via menu) captures and saves
- [ ] Page zoom (Ctrl+Plus/Minus) works and persists per domain
- [ ] Reader mode simplifies page content

## Performance
- [ ] App starts in < 3 seconds (cold start)
- [ ] Tab switching smooth (60 FPS)
- [ ] Animations fluid (no stuttering)
- [ ] Memory stable (no growth over 30 minutes of use)

## Crash Recovery
- [ ] Force-kill app; restart restores tabs

---

---

# 🚀 Next Steps (After This Blueprint)

1. **Confirm design direction** with your team:
   - Color palette / theme style (Material, Fluent, bespoke?)
   - Animation personality (snappy 120ms vs. expressive 200ms+)
   - Tab bar style (horizontal-only or vertical-first?)

2. **Set up dev environment**:
   - Clone/initialize repo
   - Install dependencies from `requirements.txt`
   - Run Phase 1 tasks

3. **Establish CI/CD**:
   - GitHub Actions: run tests on push
   - Auto-build on tags (for releases)

4. **Communication cadence**:
   - Daily standups (if team) or weekly progress checks
   - Demo each phase (invite feedback)
   - Adjust phases if blockers emerge

---

**This blueprint is your roadmap. Each phase is achievable, testable, and shippable. Let's build something beautiful! 🌟**

