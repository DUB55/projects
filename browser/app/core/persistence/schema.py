"""
SQLite Database Schema

Phase 1 tables:
  - history: Browsing history
  - bookmarks: User bookmarks
  - sessions: Saved browser sessions
  - settings: Application settings
  - downloads: Download history
  - search_engines: Search engine configurations
  - extensions_manifest: Extension metadata
"""

INITIAL_SCHEMA = """
-- History Table
CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT,
    timestamp INTEGER NOT NULL,
    visit_count INTEGER DEFAULT 1,
    last_visit INTEGER NOT NULL,
    description TEXT,
    favicon_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp);
CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);


-- Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    folder_path TEXT DEFAULT 'Bookmarks',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    favicon_url TEXT,
    tags TEXT,  -- JSON array stored as text
    is_folder INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON bookmarks(folder_path);
CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url);


-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    data TEXT NOT NULL,  -- JSON serialized session data
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_auto_save INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);


-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,  -- JSON serialized value
    type TEXT,  -- string, integer, boolean, json
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);


-- Downloads Table
CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT DEFAULT 'completed',  -- completed, cancelled, paused
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    progress_percent INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_downloads_started ON downloads(started_at);
CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);


-- Search Engines Table
CREATE TABLE IF NOT EXISTS search_engines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    suggest_url TEXT,
    favicon_url TEXT,
    is_default INTEGER DEFAULT 0,
    is_enabled INTEGER DEFAULT 1,
    shortcut TEXT
);


-- Extensions Manifest Table
CREATE TABLE IF NOT EXISTS extensions_manifest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    extension_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    author TEXT,
    path TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    installed_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    metadata TEXT  -- JSON with permissions, etc.
);

CREATE INDEX IF NOT EXISTS idx_extensions_enabled ON extensions_manifest(enabled);

-- Create default search engines
INSERT OR IGNORE INTO search_engines (name, url, suggest_url, is_default, shortcut)
VALUES 
    ('Google', 'https://www.google.com/search?q=%s', 'https://www.google.com/complete/search?client=chrome&q=%s', 1, 'g'),
    ('Bing', 'https://www.bing.com/search?q=%s', 'https://www.bing.com/osjson.aspx?query=%s', 0, 'b'),
    ('DuckDuckGo', 'https://duckduckgo.com/?q=%s', 'https://duckduckgo.com/ac/?q=%s&type=list', 0, 'd'),
    ('Wikipedia', 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=%s', NULL, 0, 'w');
"""


MIGRATION_001_UP = INITIAL_SCHEMA

MIGRATION_001_DOWN = """
DROP TABLE IF EXISTS extensions_manifest;
DROP TABLE IF EXISTS search_engines;
DROP TABLE IF EXISTS downloads;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS history;
"""
