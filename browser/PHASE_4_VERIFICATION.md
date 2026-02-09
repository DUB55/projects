# ✅ Phase 4 Verification Checklist (Passwords)

## 1. Password Storage
- [ ] **Add Password**: Open Password Manager (Key icon). Click "Add" (mock dialog or console for now). Verify entry appears.
- [ ] **Persistence**: Restart app. Verify password entry remains.
- [ ] **Security**: Check `passwords.json`. Verify "password" field is NOT stored in plain text there (should be in keyring).

## 2. Password Retrieval
- [ ] **View Password**: Click "Eye" icon in Password Manager. Verify password is retrieved from keyring and printed to console (debug) or shown.
- [ ] **Delete**: Click "X". Verify entry is removed from list AND `passwords.json`.

## 3. UI Integration
- [ ] **Toolbar**: Verify Key icon toggles the Password Manager overlay.
- [ ] **Overlay**: Verify it closes other overlays (Bookmarks/History) when opened.

## 4. Keyring Availability
- [ ] **System Check**: Verify logs show "Keyring backend available".
- [ ] **Fallback**: If keyring fails, verify app doesn't crash (soft failure).
