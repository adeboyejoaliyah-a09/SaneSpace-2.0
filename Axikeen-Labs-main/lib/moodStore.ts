import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export type MoodEntry = {
  id: string
  userId: string
  mood: string
  triggerTag: string | null
  note: string | null
  date: string
}

const databasePath = process.env.SANESPACE_DATABASE_PATH || path.join(process.cwd(), 'data', 'sanespace.db')
fs.mkdirSync(path.dirname(databasePath), { recursive: true })
const database = new Database(databasePath)

database.exec(`
  CREATE TABLE IF NOT EXISTS mood_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mood TEXT NOT NULL,
    trigger_tag TEXT,
    note TEXT,
    date TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS mood_entries_user_date_idx ON mood_entries(user_id, date DESC);
`)

function rowToEntry(row: Record<string, unknown>): MoodEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    mood: String(row.mood),
    triggerTag: typeof row.trigger_tag === 'string' ? row.trigger_tag : null,
    note: typeof row.note === 'string' ? row.note : null,
    date: String(row.date),
  }
}

export function listMoodEntries(userId: string) {
  return (database.prepare('SELECT * FROM mood_entries WHERE user_id = ? ORDER BY date DESC').all(userId) as Record<string, unknown>[]).map(rowToEntry)
}

export function createMoodEntry(input: Omit<MoodEntry, 'id'> & { id?: string }) {
  const entry: MoodEntry = { ...input, id: input.id ?? crypto.randomUUID() }
  database.prepare('INSERT INTO mood_entries (id, user_id, mood, trigger_tag, note, date) VALUES (?, ?, ?, ?, ?, ?)').run(entry.id, entry.userId, entry.mood, entry.triggerTag, entry.note, entry.date)
  return entry
}

export function clearMoodEntries(userId: string) {
  database.prepare('DELETE FROM mood_entries WHERE user_id = ?').run(userId)
}

export function updateMoodEntry(userId: string, id: string, patch: Pick<MoodEntry, 'mood' | 'triggerTag' | 'note' | 'date'>) {
  database.prepare('UPDATE mood_entries SET mood = ?, trigger_tag = ?, note = ?, date = ? WHERE id = ? AND user_id = ?').run(patch.mood, patch.triggerTag, patch.note, patch.date, id, userId)
}