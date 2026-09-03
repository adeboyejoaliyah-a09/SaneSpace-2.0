import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'

const databasePath = process.env.SANESPACE_DATABASE_PATH || path.join(process.cwd(), 'data', 'sanespace.db')
fs.mkdirSync(path.dirname(databasePath), { recursive: true })
const database = new Database(databasePath)

database.exec(`
  CREATE TABLE IF NOT EXISTS revoked_sessions (
    token_hash TEXT PRIMARY KEY,
    revoked_at TEXT NOT NULL
  );
`)

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function revokeSession(token: string) {
  database.prepare('INSERT OR IGNORE INTO revoked_sessions (token_hash, revoked_at) VALUES (?, ?)').run(tokenHash(token), new Date().toISOString())
}

export function isSessionRevoked(token: string) {
  return Boolean(database.prepare('SELECT token_hash FROM revoked_sessions WHERE token_hash = ?').get(tokenHash(token)))
}