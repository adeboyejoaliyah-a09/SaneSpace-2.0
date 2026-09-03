import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'

const databasePath = process.env.SANESPACE_DATABASE_PATH || path.join(process.cwd(), 'data', 'sanespace.db')
fs.mkdirSync(path.dirname(databasePath), { recursive: true })
const database = new Database(databasePath)

database.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY, first_name TEXT, last_name TEXT,
    specialisation TEXT, language_profile TEXT, current_mood TEXT,
    challenges_json TEXT NOT NULL DEFAULT '[]', wellness_goal TEXT,
    onboarding_complete INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_memory_settings (
    user_id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_memories (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, memory_type TEXT NOT NULL,
    category TEXT NOT NULL, content TEXT NOT NULL, confidence_score REAL NOT NULL,
    source TEXT NOT NULL, created_at TEXT NOT NULL, last_updated TEXT NOT NULL,
    UNIQUE(user_id, memory_type, category)
  );
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'text', created_at TEXT NOT NULL,
    messages_json TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY, userId TEXT NOT NULL, title TEXT NOT NULL,
    description TEXT, dueAt TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
    source TEXT NOT NULL DEFAULT 'user_created', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mood_entries (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, mood TEXT NOT NULL,
    trigger_tag TEXT, note TEXT, date TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS revoked_sessions (
    token_hash TEXT PRIMARY KEY, revoked_at TEXT NOT NULL
  );
`)

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function deleteAccount(userId: string, sessionToken: string) {
  const transaction = database.transaction(() => {
    database.prepare('DELETE FROM user_profiles WHERE user_id = ?').run(userId)
    database.prepare('DELETE FROM user_memory_settings WHERE user_id = ?').run(userId)
    database.prepare('DELETE FROM user_memories WHERE user_id = ?').run(userId)
    database.prepare('DELETE FROM conversations WHERE user_id = ?').run(userId)
    database.prepare('DELETE FROM reminders WHERE userId = ?').run(userId)
    database.prepare('DELETE FROM mood_entries WHERE user_id = ?').run(userId)
    database.prepare('INSERT OR IGNORE INTO revoked_sessions (token_hash, revoked_at) VALUES (?, ?)').run(tokenHash(sessionToken), new Date().toISOString())
  })

  transaction()
}