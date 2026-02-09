# ✅ Phase 3 Verification Checklist

This checklist defines the steps required to verify the functionality of Data Management features (Bookmarks, History, Downloads, Suggestions).

## 1. Bookmarks
- [ ] **Add Bookmark**: Visit a site, click Omnibox star (verify icon changes), check `bookmarks.json` update.
- [ ] **View Bookmarks**: Open Bookmarks Manager (click Star in toolbar). Verify folders and items appear.
- [ ] **Edit/Delete**: Rename a bookmark in Manager. Delete a bookmark. logic.
- [ ] **Navigate**: Click a bookmark in Manager -> Main WebView should load URL.

## 2. History
- [ ] **Tracking**: Visit 3 different sites. Open History Manager (click 'H'). Verify 3 entries with correct time.
- [ ] **Search**: Type part of a title in History Manager search box. Verify filtering.
- [ ] **Persistence**: Restart app. Verify History is still present.
- [ ] **Clear**: (See below).

## 3. Downloads
- [ ] **Download File**: Visit a download link (e.g., Python installer or sample image).
- [ ] **UI Feedback**: Verify Downloads Panel opens/notifies. Check progress bar element.
- [ ] **Completion**: Verify state changes to "Completed".
- [ ] **File System**: Check if file actually exists on disk in Downloads folder.

## 4. Omnibox Suggestions
- [ ] **History Match**: Type "goo" (if visited google.com). Verify suggestion appears in popup.
- [ ] **Bookmark Match**: Add "example.com" as bookmark. Type "exa". Verify suggestion appears.
- [ ] **Selection**: Click a suggestion. Verify URL loads.
- [ ] **Keyboard**: Use Down Arrow to select suggestion (if implemented) or simple click.

## 5. Clear Browsing Data
- [ ] **UI Open**: Open History Manager -> Click "Clear Browsing Data". Verify Dialog opens.
- [ ] **Action**: Select "Browsing History" -> Click "Clear".
- [ ] **Verification**: Close dialog. Refresh History Manager. Verify list is empty.

## 6. Profile Isolation
- [ ] **Switch Profile**: Create/Switch to Profile B.
- [ ] **Data Check**: Verify Bookmarks/History from Profile A are NOT visible in Profile B.
