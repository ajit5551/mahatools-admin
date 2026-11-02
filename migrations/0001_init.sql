-- Apply only if the tables do not already exist. Your current D1 database already has these tables.
CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,created_at INTEGER DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS visitors (id INTEGER PRIMARY KEY AUTOINCREMENT,visitor_id TEXT NOT NULL UNIQUE,first_seen INTEGER DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS live_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT NOT NULL UNIQUE,visitor_id TEXT NOT NULL,page TEXT,last_seen INTEGER DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS tools (id INTEGER PRIMARY KEY AUTOINCREMENT,slug TEXT NOT NULL UNIQUE,title TEXT NOT NULL,category TEXT,is_paid INTEGER DEFAULT 0,price_paise INTEGER DEFAULT 0,enabled INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS tool_usage (id INTEGER PRIMARY KEY AUTOINCREMENT,tool_id INTEGER NOT NULL,visitor_id TEXT,used_at INTEGER DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS earnings (id INTEGER PRIMARY KEY AUTOINCREMENT,source TEXT NOT NULL,amount_paise INTEGER NOT NULL,note TEXT,recorded_at INTEGER DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT,visitor_id TEXT NOT NULL,tool_id INTEGER NOT NULL,amount_paise INTEGER NOT NULL,status TEXT DEFAULT 'pending',created_at INTEGER DEFAULT (unixepoch()));
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON live_sessions(last_seen);
CREATE INDEX IF NOT EXISTS idx_usage_tool ON tool_usage(tool_id);
CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings(recorded_at);
