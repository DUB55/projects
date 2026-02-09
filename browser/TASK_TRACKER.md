# 🎯 Task Tracking & Phase Breakdown

This document provides **week-by-week task lists** for each phase. Use this to track progress and assign work.

---

## PHASE 1: Project Foundation & Infrastructure (Days 1–5)

**Goal:** Establish project structure, SQLite schema, logging, PySide6 bootstrap.

### Week 1 (Days 1–5)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Redesign directory structure | Dev | TODO | Move to `app/`, `core/`, `tests/` |
| Create `app/main.py` entry point | Dev | TODO | Qt application setup |
| Implement `core/config/config_manager.py` | Dev | TODO | JSON/SQLite settings loader |
| Set up platform-aware data directories | Dev | TODO | `%AppData%` on Windows, `~/.local/share` on Linux/macOS |
| Create `utils/logger.py` with dual output | Dev | TODO | File + console logging |
| Update `requirements.txt` with final deps | Dev | TODO | PySide6, keyring, SQLAlchemy (optional), pyinstaller |
| Design SQLite schema (migration system) | Dev | TODO | 7 tables: history, bookmarks, sessions, settings, downloads, search_engines, extensions_manifest |
| Implement `core/persistence/db.py` (connection pool) | Dev | TODO | Context managers, error handling |
| Create migration system (`core/persistence/migrations/`) | Dev | TODO | Auto-run on app start |
| Implement `core/security/keyring_adapter.py` | Dev | TODO | Wrapper for `keyring` library |
| Test keyring on Windows (Credential Manager) | QA | TODO | Verify save/retrieve |
| Create `core/state/app_state.py` (Qt signals) | Dev | TODO | Central state store |
| Create minimal `app/ui/App.qml` | Dev | TODO | Empty window, toolbar placeholder |
| Wire up Python signals → QML slots | Dev | TODO | Test state propagation |
| Add debug mode CLI flag (`--debug`, `--dev-mode`) | Dev | TODO | Enable profiling tools |
| Create `app/dev_tools.py` | Dev | TODO | QML profiler, console, DB inspector |
| Document local dev setup | Doc | TODO | README.md or DEVELOPER.md |
| **PHASE 1 VALIDATION:** App launches, settings saved, DB created, keyring works | QA | TODO | Checklist in main blueprint |

---

## PHASE 2: Core Browser Navigation & Tabs (Days 6–15)

**Goal:** Tabs, navigation, QtWebEngine integration, session persistence.

### Week 2 (Days 6–10)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `core/models/tabs_model.py` (QAbstractListModel) | Dev | TODO | Roles: id, title, icon, url, webview, group_id, is_pinned, is_audio_playing, is_loading, load_progress |
| Create `core/models/windows_model.py` | Dev | TODO | Track open windows, active window |
| Extend `app_state.py` with tab/window models | Dev | TODO | Expose as Qt properties |
| Create `core/services/navigation.py` | Dev | TODO | Back, forward, refresh, URL validation, search query detection |
| Create `core/services/search_engines.py` | Dev | TODO | Manage search engine list, resolve queries |
| Create `core/browser/web_engine_manager.py` | Dev | TODO | Persistent QWebEngineProfile, download handler |
| Configure QWebEngineProfile settings | Dev | TODO | Persistent cookies, user agent, cache size |
| Implement download handler (scaffold) | Dev | TODO | Trigger download UI (Phase 3) |
| Wire page lifecycle signals | Dev | TODO | loadStarted, loadProgress, loadFinished, titleChanged, iconChanged, urlChanged |

### Week 3 (Days 11–15)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `app/ui/components/Toolbar.qml` | UI | TODO | Back/Forward/Refresh/Home buttons, omnibox, status bar |
| Create `app/ui/components/TabBar.qml` | UI | TODO | Horizontal tab list, close button, active highlight, drag-reorder |
| Create `app/ui/components/Omnibox.qml` | UI | TODO | URL/search input, suggestions dropdown (stubbed) |
| Update main `app/ui/App.qml` layout | UI | TODO | Toolbar, TabBar, WebEngineView container |
| Connect QML to Python models | Dev | TODO | Bind tabModel, active view |
| Create `core/services/session_manager.py` | Dev | TODO | Save/restore session, crash recovery logic |
| Implement startup behavior (new tab / last session) | Dev | TODO | Load from settings |
| Create `app/shortcuts.py` | Dev | TODO | Register Ctrl+T, Ctrl+W, Ctrl+Tab, Ctrl+L, F5, Alt+Left, etc. |
| Wire keyboard shortcuts to actions | Dev | TODO | Test all shortcuts |
| **PHASE 2 VALIDATION:** App launches with tab, navigates, session persists on restart | QA | TODO | Full manual test |

---

## PHASE 3: Data Management Layer (Days 16–25)

**Goal:** Bookmarks, history, downloads, clear data, omnibox suggestions.

### Week 4 (Days 16–20)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `core/services/bookmarks.py` | Dev | TODO | CRUD, folder hierarchy, tags, import/export |
| Create `core/models/bookmarks_model.py` | Dev | TODO | Expose bookmarks tree to QML |
| Create `app/ui/pages/BookmarksManager.qml` | UI | TODO | Tree view, search, multi-select delete |
| Bind Ctrl+Shift+O → Bookmarks Manager | Dev | TODO | Test launcher |
| Bind Ctrl+D → quick-add bookmark | Dev | TODO | Add current page to bookmarks |
| Create `core/services/history.py` | Dev | TODO | Log visits, query ranges, delete, search |
| Create `core/models/history_model.py` | Dev | TODO | Expose grouped history (by date) |
| Create `app/ui/pages/HistoryManager.qml` | UI | TODO | Grouped list, search, multi-select delete |
| Bind Ctrl+H → History Manager | Dev | TODO | Test launcher |
| Hook history logging in navigation service | Dev | TODO | Log every page visit on loadFinished() |

### Week 5 (Days 21–25)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `core/services/downloads.py` | Dev | TODO | Track progress, state management, metadata in SQLite |
| Create `core/browser/download_handler.py` | Dev | TODO | Hook QtWebEngine download signals, prompt user for path |
| Create `core/models/downloads_model.py` | Dev | TODO | Expose downloads to QML |
| Create `app/ui/panels/DownloadsPanel.qml` | UI | TODO | Slide-out panel, progress bars, action buttons |
| Bind Ctrl+J → toggle Downloads Panel | Dev | TODO | Test launcher |
| Create `app/ui/dialogs/ClearBrowsingDataDialog.qml` | UI | TODO | Time-range selector, multi-checkbox, clear button |
| Create `core/services/browsing_data.py` | Dev | TODO | Clear history, bookmarks, cache, downloads, passwords |
| Integrate clear-data dialog with services | Dev | TODO | Wire up all checkboxes |
| Create `core/services/suggest.py` | Dev | TODO | Fuzzy search history + bookmarks, rank by relevance |
| Update `Omnibox.qml` with suggestion dropdown | UI | TODO | Show suggestions as you type |
| Async suggestion fetching | Dev | TODO | Don't block UI during typing |
| **PHASE 3 VALIDATION:** Bookmarks/history UI work, omnibox suggests, clear data works | QA | TODO | Full manual test |

---

## PHASE 4: Password & Security Management (Days 26–30)

**Goal:** Password save/fill with keychain, password manager, save prompts.

### Week 6 (Days 26–30)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `core/services/passwords.py` | Dev | TODO | Save/retrieve/delete, metadata in SQLite, secrets in keyring |
| Create `core/browser/form_detector.py` | Dev | TODO | JS snippet to detect form submission, message bridge to Python |
| Create `app/ui/dialogs/SavePasswordPrompt.qml` | UI | TODO | "Save password for [user]?" dialog |
| Integrate form detector with app state | Dev | TODO | Emit signal on form submit → trigger dialog |
| Create `app/ui/pages/PasswordsManager.qml` | UI | TODO | List passwords, reveal toggle, copy, delete, search |
| Create `core/models/passwords_model.py` | Dev | TODO | Expose passwords to QML (masked) |
| Add keychain fallback (graceful degradation) | Dev | TODO | If keyring unavailable, show warning |
| Test password save/retrieve on Windows | QA | TODO | Verify OS credential manager usage |
| Add settings toggle: "Save passwords" | UI | TODO | Disable/enable in Settings |
| Create exclusion list for sites (where we don't prompt) | Dev | TODO | Store in settings, check before prompting |
| **PHASE 4 VALIDATION:** Password save prompt works, passwords persist, manager UI functional | QA | TODO | Full manual test |

---

## PHASE 5: Advanced Tab Features & Organization (Days 31–40)

**Goal:** Tab groups, vertical tabs, quick switcher, tab overview.

### Week 7 (Days 31–35)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `core/services/tab_groups.py` | Dev | TODO | Create/delete groups, add/remove tabs, collapse state |
| Create `core/models/groups_model.py` | Dev | TODO | Expose groups to QML |
| Create `app/ui/components/TabGroup.qml` | UI | TODO | Group header, collapse toggle, color indicator |
| Extend `TabBar.qml` to show groups | UI | TODO | Hierarchical display |
| Add vertical tabs layout option | UI | TODO | Sidebar layout, groups as sections |
| Update settings with `appearance.tab_layout` | Dev | TODO | "horizontal" | "vertical", persist |
| Animate transition between layouts | UI | TODO | Slide/fade transition |
| Create `app/ui/dialogs/QuickSwitcher.qml` | UI | TODO | Modal input, fuzzy search, keyboard nav |
| Create `core/services/quick_search.py` | Dev | TODO | Fuzzy matching for tabs, history, bookmarks, commands |
| Bind Ctrl+K → Quick Switcher | Dev | TODO | Test launcher |

### Week 8 (Days 36–40)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `app/ui/dialogs/TabOverview.qml` | UI | TODO | Grid of thumbnails, animated scale-in |
| Create thumbnail generation (or use placeholders) | Dev | TODO | Minimal for MVP |
| Bind keyboard shortcut for tab overview | Dev | TODO | Ctrl+Shift+A (optional) |
| Enhance tab context menu | UI | TODO | Reload, pin, duplicate, move to group, close, etc. |
| Implement tab drag-reorder with animation | UI | TODO | Spring easing, update model, save session |
| Test all advanced tab features | QA | TODO | Groups, vertical tabs, quick switcher, overview |
| **PHASE 5 VALIDATION:** Tab groups work, vertical layout toggles, quick switcher functional, tab overview shows | QA | TODO | Full manual test |

---

## PHASE 6: UI Polish & Animations (Days 41–55)

**Goal:** Motion spec, animations, theming, new tab page, 60 FPS verification.

### Week 9 (Days 41–45)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `app/ui/theme/MotionSpec.qml` | UI | TODO | Durations, easings, spring values |
| Document motion spec in `docs/motion_spec.md` | Doc | TODO | Examples of motion principles |
| Implement tab open/close animations | UI | TODO | Spring slide-in, fade-out on close |
| Implement group collapse/expand animations | UI | TODO | Cross-fade, scaleY spring |
| Implement panel slide-in/out animations | UI | TODO | Side panels, omnibox elevation |
| Create `RippleButton.qml` component | UI | TODO | Reusable ripple + scale feedback |
| Apply micro-interactions to all buttons | UI | TODO | Hover, press, focus effects |
| Create `core/services/theme_service.py` | Dev | TODO | Set/get theme, manage colors, persist preference |
| Create `app/ui/theme/Themes.qml` (color palette) | UI | TODO | Light, Dark, High-Contrast themes |
| Wire theme service to QML | Dev | TODO | Bindings on theme color properties |

### Week 10 (Days 46–50)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `core/services/accent_color.py` | Dev | TODO | Extract from wallpaper, website theme color |
| Integrate dynamic accent color | UI | TODO | Update on wallpaper change or tab switch |
| Create `app/ui/pages/NewTabPage.qml` | UI | TODO | Wallpaper, time/date, speed dial, quick actions |
| Create `core/services/most_visited.py` | Dev | TODO | Query history for top sites |
| Integrate speed dial with bookmarks | Dev | TODO | Show pinned bookmarks + most visited |
| Add wallpaper customization in settings | UI | TODO | Image picker, gradient options |
| Implement live tiles (weather, news, quote) | UI | TODO | Scaffold only for MVP (hardcode or local service) |
| Performance profiling with QML Profiler | QA | TODO | Measure frame times, identify jank |
| Optimize identified hotspots | Dev | TODO | Cache layers, lazy-load, batch updates |
| Create `docs/performance_profile.md` | Doc | TODO | Baseline measurements (60 FPS target) |

### Week 11 (Days 51–55)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Re-profile after optimizations | QA | TODO | Verify 60 FPS across features |
| Refine animation timings and easings | UI | TODO | Finalize motion feel (snappy vs. expressive) |
| Test all animations on lower-end hardware | QA | TODO | Graceful degradation if GPU limited |
| Polish focus indicators and accessibility | UI | TODO | Clear focus rings on all interactive elements |
| **PHASE 6 VALIDATION:** New tab page loads, animations fluid (60 FPS), theming works, all micro-interactions polished | QA | TODO | Full manual test + profiler approval |

---

## PHASE 7: Settings & Customization (Days 56–62)

**Goal:** Comprehensive settings UI, shortcut editor, search engine customization.

### Week 12 (Days 56–60)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `app/ui/pages/SettingsPage.qml` (main container) | UI | TODO | Sidebar sections, right content area, search |
| Create `app/ui/pages/settings/AppearanceSettings.qml` | UI | TODO | Theme, density, font size, wallpaper, accent color, tab layout |
| Create `app/ui/pages/settings/SearchSettings.qml` | UI | TODO | Default engine, engine list, add/edit/delete, keyword search |
| Create `app/ui/pages/settings/StartupSettings.qml` | UI | TODO | New tab / restore session / custom pages |
| Create `app/ui/pages/settings/PasswordsSettings.qml` | UI | TODO | Save passwords toggle, auto-fill toggle, exclusion list |
| Create `app/ui/pages/settings/DownloadsSettings.qml` | UI | TODO | Folder picker, "ask before download" toggle, clear on exit |
| Create `app/ui/pages/settings/ShortcutsSettings.qml` | UI | TODO | List all shortcuts, edit buttons, conflict detection |
| Create `core/services/shortcuts_manager.py` | Dev | TODO | Get/set shortcuts, validate, detect conflicts |
| Implement shortcut recording (listen for key input) | Dev | TODO | Capture new shortcut key sequence |
| Update `app/shortcuts.py` to be dynamic | Dev | TODO | Load from settings, listen for changes, register/unregister |

### Week 13 (Days 61–62)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `app/ui/pages/settings/AdvancedSettings.qml` | UI | TODO | Privacy, web, performance, developer options |
| Pre-populate search engines with defaults | Dev | TODO | Google, DuckDuckGo, Bing, Wikipedia |
| Test all settings sections | QA | TODO | Verify settings save, persist on restart |
| Bind shortcut to open Settings (`Cmd+,`) | Dev | TODO | Test launcher |
| Create Settings icon/button in toolbar | UI | TODO | Quick access to settings |
| **PHASE 7 VALIDATION:** All settings sections functional, shortcuts editor works, settings persist on restart | QA | TODO | Full manual test |

---

## PHASE 8: Extensions Framework (Phase 2 Scaffold) (Days 63–70)

**Goal:** Extension manifest, content scripts, message bridge, extension manager UI.

### Week 14 (Days 63–67)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Define extension manifest v0 schema | Dev | TODO | JSON format with name, version, permissions, content_scripts, background, action |
| Create `core/extensions/manifest_parser.py` | Dev | TODO | Validate manifest, parse fields |
| Create `core/extensions/extension_host.py` | Dev | TODO | Load, enable/disable, reload extensions, manage storage |
| Set up extension directory structure | Dev | TODO | `~/.local/share/BrowserApp/extensions/{extension_id}/` |
| Create `core/browser/content_script_injector.py` | Dev | TODO | Match URLs, inject JS files into page context |
| Implement JS injection via `QWebEngineScript` | Dev | TODO | Wire to QWebEngineView |
| Create `core/extensions/extension_api.py` | Dev | TODO | Native API exposed to JS (storage, tabs, messaging) |
| Implement `QtWebChannel` bridge for extension communication | Dev | TODO | JS ↔ Python messaging |

### Week 15 (Days 68–70)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `app/ui/pages/ExtensionsManager.qml` | UI | TODO | List extensions, enable/disable, reload, uninstall, "Load unpacked" |
| Create `core/models/extensions_model.py` | Dev | TODO | Expose extensions list to QML |
| Add extension storage table to SQLite | Dev | TODO | `extension_storage (extension_id, key, value)` |
| Create example extension (e.g., dark mode helper) | Dev | TODO | Demonstrate manifest, content script, storage |
| Test extension loading and execution | QA | TODO | Load example, verify JS injection |
| **PHASE 8 VALIDATION:** Extension loads, manifest validated, content script injects, storage API works | QA | TODO | Full manual test |

---

## PHASE 9: Incognito & Multiple Profiles (Days 71–75)

**Goal:** Incognito mode, multiple user profiles, profile switcher.

### Week 16 (Days 71–75)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `core/services/incognito_service.py` | Dev | TODO | Launch incognito windows with ephemeral profile |
| Update `web_engine_manager.py` for incognito profile | Dev | TODO | Set up off-the-record QWebEngineProfile |
| Visual indicator for incognito windows | UI | TODO | Different theme or styling for incognito |
| Bind Ctrl+Shift+N → New Incognito Window | Dev | TODO | Test launcher |
| Create `core/services/profile_service.py` | Dev | TODO | Create/delete/switch profiles, separate data per profile |
| Create profile-specific SQLite databases | Dev | TODO | `~/.local/share/BrowserApp/profiles/{profile_id}/app.sqlite` |
| Create profile-specific QWebEngineProfile paths | Dev | TODO | Separate storage, cache per profile |
| Create profile switcher UI (avatar + dropdown) | UI | TODO | List profiles, switch, "Add new profile" |
| Create `app/ui/pages/settings/ProfilesSettings.qml` | UI | TODO | List, rename, delete, set default |
| Test profile isolation (bookmarks don't leak) | QA | TODO | Verify separate data per profile |
| **PHASE 9 VALIDATION:** Incognito window works, profiles separate, profile switcher functional | QA | TODO | Full manual test |

---

## PHASE 10: Advanced Features & Polish (Days 76–82)

**Goal:** Find in page, screenshot, reader mode, page zoom, page actions menu.

### Week 17 (Days 76–80)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `app/ui/panels/FindPanel.qml` | UI | TODO | Input, prev/next buttons, match counter, case-sensitive toggle |
| Create `core/browser/find_handler.py` | Dev | TODO | Hook QWebEngineView.findText(), track matches |
| Bind Ctrl+F → Find Panel | Dev | TODO | Test launcher |
| Implement smooth scroll to match | Dev | TODO | Auto-scroll highlighted match into view |
| Create `core/browser/screenshot_service.py` | Dev | TODO | Grab visible area or full page, save or clipboard |
| Create `app/ui/dialogs/ScreenshotDialog.qml` | UI | TODO | Options: visible / full page / region, preview, save/copy |
| Bind screenshot shortcut (e.g., via menu) | Dev | TODO | Test launcher |
| Create `core/browser/reader_mode.py` | Dev | TODO | DOM simplification using `readability-lxml` |
| Create `app/ui/dialogs/ReaderModeDialog.qml` | UI | TODO | Display simplified content, font/bg/spacing controls |
| Bind reader mode shortcut (e.g., Ctrl+Alt+R) | Dev | TODO | Test launcher |

### Week 18 (Days 81–82)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `core/services/zoom_service.py` | Dev | TODO | Set/get/reset zoom, store per-domain in SQLite |
| Bind Ctrl+Plus, Ctrl+Minus, Ctrl+0 → zoom | Dev | TODO | Test all shortcuts |
| Show zoom indicator in toolbar (when zoomed) | UI | TODO | Display current zoom % |
| Create `app/ui/components/PageActionsMenu.qml` | UI | TODO | Print, screenshot, reader mode, zoom, page info, etc. |
| Add page actions button to toolbar | UI | TODO | ⋯ icon or gear icon |
| Enhance PDF viewer with toolbar | Dev | TODO | Zoom, page nav, download button |
| Test all advanced features on various websites | QA | TODO | Find, screenshot, reader mode, zoom |
| **PHASE 10 VALIDATION:** Find panel works, screenshot saves, reader mode simplifies, zoom persists, page menu functional | QA | TODO | Full manual test |

---

## PHASE 11: Performance & Reliability (Days 83–87)

**Goal:** Profiling, optimization, crash recovery, automated tests, memory audit.

### Week 19 (Days 83–87)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Baseline performance metrics (startup, FPS, memory) | QA | TODO | Cold start time, memory footprint, frame rate |
| Run QML Profiler on key actions | QA | TODO | Tab switch, animations, model updates, identify hotspots |
| Create `core/services/crash_recovery.py` | Dev | TODO | Watchdog, PID file, session snapshot, restore on next launch |
| Implement periodic session snapshots | Dev | TODO | Every 30 seconds or on significant change |
| Create `core/services/maintenance.py` | Dev | TODO | Cleanup old history, sessions, cache |
| Schedule maintenance (daily, on-demand) | Dev | TODO | Wire up to idle time or background thread |
| Create unit test suite (`tests/test_*.py`) | QA | TODO | Bookmarks, history, navigation, passwords (pytest) |
| Create integration tests | QA | TODO | Full-flow: launch, browse, bookmark, restart, verify |
| Create QML performance test | QA | TODO | Create 100 tabs, measure FPS |
| Memory profiling (valgrind or Qt memory tool) | QA | TODO | Detect leaks, optimize high-usage areas |
| Re-profile after optimizations | QA | TODO | Verify improvements |
| Create `docs/performance_profile.md` (final) | Doc | TODO | Finalized metrics, comparison to targets |
| **PHASE 11 VALIDATION:** Unit tests pass, integration tests pass, 60 FPS verified, memory stable, crash recovery works | QA | TODO | Full validation |

---

## PHASE 12: Launch & Distribution (Days 88–90)

**Goal:** Packaging, signing, documentation, release.

### Week 20 (Days 88–90)

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Configure PyInstaller for Windows build | Dev | TODO | Create `build_windows.ps1`, bundle assets, output `.exe` |
| Test Windows installer on clean VM | QA | TODO | Verify app launches and functions |
| Code-sign Windows executable (EV cert or self-sign) | Dev | TODO | Use `signtool.exe` |
| Configure PyInstaller for macOS build | Dev | TODO | Output `.app` + `.dmg` |
| Code-sign and notarize macOS app | Dev | TODO | Apple Developer cert, `altool`, staple notarization |
| Test macOS app on clean VM | QA | TODO | Verify app launches and functions |
| Create Linux AppImage | Dev | TODO | Use `linuxdeployqt`, test on Ubuntu/Fedora |
| Create landing page (`docs/index.html` or external site) | Doc | TODO | Features, screenshots, download links, privacy policy |
| Write user guide (`docs/USER_GUIDE.md`) | Doc | TODO | Getting started, features, troubleshooting, shortcuts reference |
| Write privacy policy (`docs/PRIVACY.md`) | Doc | TODO | Clarify local-only storage, no telemetry |
| Write developer docs (`docs/DEVELOPER.md`) | Doc | TODO | Architecture, extension guide, build instructions |
| Create release notes (`RELEASE_NOTES.md`) | Doc | TODO | v1.0.0 changelog, known issues, roadmap |
| Create version tag in repo (`v1.0.0`) | Dev | TODO | Tag release commit |
| Set up auto-update check (stub) | Dev | TODO | Create `update_checker.py`, query version.json endpoint |
| Final QA checklist (Appendix A) | QA | TODO | Full manual testing across all features |
| **PHASE 12 VALIDATION:** Installers created, signed, tested; landing page live; release notes published; all manual tests pass | QA | TODO | Full release validation |

---

---

## 📊 Progress Tracking Template

Print or copy this table to track actual progress:

```
Phase | Week | Planned Tasks | Completed | Blockers | Notes
------|------|---------------|-----------|----------|-------
  1   |  1   | 15 tasks      |     /15   |    -     | On track
  2   |  2   | 14 tasks      |     /14   |    -     | On track
  2   |  3   | 11 tasks      |     /11   |    -     | On track
  3   |  4   | 10 tasks      |     /10   |    -     | On track
  3   |  5   | 11 tasks      |     /11   |    -     | On track
  ... | ... |  ...          |    ...    |   ...    | ...
```

---

## 🚩 Key Dependencies & Risk Mitigation

### High-Risk Areas (monitor closely)

1. **QtWebEngine platform-specific issues**
   - Risk: Different behavior on Windows/macOS/Linux
   - Mitigation: Early CI/CD setup for multi-platform builds; test on each platform weekly

2. **Extension system complexity**
   - Risk: Message bridge or content script injection fails
   - Mitigation: Scaffold early (Phase 8), test with simple example, defer advanced features to v1.1

3. **Performance targets (60 FPS)**
   - Risk: QML animations stutter on lower-end GPUs
   - Mitigation: Profile early and often; aggressive optimization in Phase 6 & 11

4. **Keyring integration**
   - Risk: Keyring library incompatible with specific OS or distro
   - Mitigation: Test early on all target platforms; implement graceful fallback

### Parallel Work Opportunities

- **UI and Core can be developed in parallel** (Phase 2 onwards):
  - UI team builds QML components while Core team implements services
  - Use mock data initially, integrate later
  
- **Testing can begin** early (Phase 1+):
  - Write unit tests as services are built
  - Don't wait for full integration

- **Documentation** can be written as features are completed:
  - Update USER_GUIDE.md incrementally
  - Keep DEVELOPER.md in sync with architecture

---

## 🎓 Success Criteria by Phase

| Phase | Success Criteria |
|-------|------------------|
| 1 | App launches, DB created, logger works, keyring initialized |
| 2 | Navigate to websites, create tabs, session saves/restores |
| 3 | Bookmarks/history UI functional, omnibox suggests, clear data works |
| 4 | Password save prompt works, passwords persist, manager UI functional |
| 5 | Tab groups created/collapsed, vertical tabs toggle, quick switcher fuzzy-searches |
| 6 | New tab page loads, animations smooth (60 FPS), theming works |
| 7 | All settings sections functional, shortcuts editor works, settings persist |
| 8 | Extension manifest validated, content script injects, message bridge works |
| 9 | Incognito window works, profiles separate data, profile switcher functional |
| 10 | Find panel works, screenshot saves, reader mode simplifies, zoom persists |
| 11 | Unit/integration tests pass, crash recovery works, 60 FPS verified, memory stable |
| 12 | Installers signed, tested, landing page live, release notes published |

---

**Use this document to assign tasks to team members, track daily progress, and identify blockers early. Update weekly!**

