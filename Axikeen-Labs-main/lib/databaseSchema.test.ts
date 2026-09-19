import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { afterEach, describe, expect, it, vi } from 'vitest'

function makeTempDbPath() {
  const directory = path.join(process.cwd(), 'data', 'tmp-tests')
  fs.mkdirSync(directory, { recursive: true })
  const file = path.join(directory, `schema-${Date.now()}-${Math.random().toString(16).slice(2)}.db`)
  if (fs.existsSync(file)) fs.unlinkSync(file)
  return file
}

describe('database schema bootstrap', () => {
  afterEach(() => {
    vi.resetModules()
    delete process.env.SANESPACE_DATABASE_PATH
  })

  it('creates email_auth_users when the auth module initializes', async () => {
    const dbPath = makeTempDbPath()
    process.env.SANESPACE_DATABASE_PATH = dbPath

    await import('./emailAuth')

    const db = new Database(dbPath)
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'email_auth_users'").all() as Array<{ name: string }>
    expect(tables).toHaveLength(1)
    db.close()
  })

  it('adds missing onboarding columns to a legacy user_profiles table', async () => {
    const dbPath = makeTempDbPath()
    process.env.SANESPACE_DATABASE_PATH = dbPath

    const legacy = new Database(dbPath)
    legacy.exec(`
      CREATE TABLE user_profiles (
        user_id TEXT PRIMARY KEY,
        first_name TEXT,
        updated_at TEXT NOT NULL
      );
    `)
    legacy.close()

    await import('./profileStore')

    const db = new Database(dbPath)
    const columns = db.prepare('PRAGMA table_info(user_profiles)').all() as Array<{ name: string }>
    const names = new Set(columns.map((column) => column.name))
    expect(names.has('preferred_name')).toBe(true)
    expect(names.has('communication_preferences_json')).toBe(true)
    expect(names.has('onboarding_complete')).toBe(true)
    db.close()
  })
})
