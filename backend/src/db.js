const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/codvault.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS redeem_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      reward TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'all',
      season TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','pending')),
      expires_at TEXT,
      source TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weapons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      description TEXT,
      base_damage INTEGER,
      fire_rate INTEGER,
      range INTEGER,
      mobility INTEGER,
      control INTEGER,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loadouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weapon_id INTEGER NOT NULL REFERENCES weapons(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      playstyle TEXT NOT NULL DEFAULT 'balanced',
      description TEXT,
      attachments TEXT NOT NULL DEFAULT '[]',
      perks TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK(difficulty IN ('beginner','intermediate','advanced')),
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sensitivity_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      playstyle TEXT NOT NULL,
      device_type TEXT NOT NULL DEFAULT 'phone',
      fps_sensitivity INTEGER,
      ads_sensitivity INTEGER,
      scope_3x INTEGER,
      scope_4x INTEGER,
      sniper_scope INTEGER,
      gyroscope INTEGER,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hud_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      device_type TEXT NOT NULL DEFAULT 'phone',
      playstyle TEXT NOT NULL,
      fire_button_size INTEGER,
      fire_button_position TEXT,
      joystick_size INTEGER,
      hud_layout TEXT NOT NULL DEFAULT '{}',
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS player_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT NOT NULL UNIQUE,
      username TEXT,
      sensitivity_preset_id INTEGER REFERENCES sensitivity_presets(id) ON DELETE SET NULL,
      hud_preset_id INTEGER REFERENCES hud_settings(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_codes_status ON redeem_codes(status);
    CREATE INDEX IF NOT EXISTS idx_codes_platform ON redeem_codes(platform);
    CREATE INDEX IF NOT EXISTS idx_weapons_category ON weapons(category);
    CREATE INDEX IF NOT EXISTS idx_tips_category ON tips(category);
    CREATE INDEX IF NOT EXISTS idx_profiles_uid ON player_profiles(uid);
  `);

}

module.exports = { getDb };
