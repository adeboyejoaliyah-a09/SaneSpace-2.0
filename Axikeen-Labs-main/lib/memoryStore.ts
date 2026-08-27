import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import type { ExtractedMemory, StoredUserMemory } from '@/lib/memoryExtraction'

let database: Database.Database | null = null

function getDatabase() {
  if (!database) {
    const databasePath = process.env.SANESPACE_DATABASE_PATH || path.join(process.cwd(), 'data', 'sanespace.db')
    fs.mkdirSync(path.dirname(databasePath), { recursive: true })
    database = new Database(databasePath)
    database.pragma('journal_mode = WAL')
    database.exec(`
      CREATE TABLE IF NOT EXISTS user_memory_settings (
        user_id TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS user_memories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        memory_type TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_updated TEXT NOT NULL,
        UNIQUE(user_id, memory_type, category)
      );
      CREATE INDEX IF NOT EXISTS user_memories_user_idx ON user_memories(user_id);
    `)
  }
  return database
}

function rowToMemory(row: Record<string, unknown>): StoredUserMemory {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    memoryType: row.memory_type as StoredUserMemory['memoryType'],
    category: String(row.category),
    content: String(row.content),
    confidenceScore: Number(row.confidence_score),
    source: row.source as StoredUserMemory['source'],
    lastUpdated: String(row.last_updated),
  }
}

export function isMemoryEnabled(userId: string) {
  const row = getDatabase().prepare('SELECT enabled FROM user_memory_settings WHERE user_id = ?').get(userId) as { enabled?: number } | undefined
  return row?.enabled !== 0
}

export function setMemoryEnabled(userId: string, enabled: boolean) {
  const now = new Date().toISOString()
  getDatabase().prepare(`
    INSERT INTO user_memory_settings (user_id, enabled, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at
  `).run(userId, enabled ? 1 : 0, now)
}

export function listUserMemories(userId: string) {
  const rows = getDatabase().prepare('SELECT * FROM user_memories WHERE user_id = ? ORDER BY confidence_score DESC, last_updated DESC').all(userId) as Record<string, unknown>[]
  return rows.map(rowToMemory)
}

export function retrieveRelevantMemories(userId: string, query: string, limit = 5) {
  if (!isMemoryEnabled(userId)) return []
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length >= 4).slice(0, 12)
  const memories = listUserMemories(userId)
  if (terms.length === 0) return []
  return memories
    .map((memory) => ({ memory, score: terms.reduce((score, term) => score + (memory.content.toLowerCase().includes(term) || memory.category.includes(term) ? 1 : 0), 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.memory.confidenceScore - a.memory.confidenceScore)
    .slice(0, limit)
    .map((item) => item.memory)
}

export function upsertUserMemories(userId: string, memories: ExtractedMemory[]) {
  if (!isMemoryEnabled(userId)) return []
  const now = new Date().toISOString()
  const statement = getDatabase().prepare(`
    INSERT INTO user_memories (id, user_id, memory_type, category, content, confidence_score, source, created_at, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, memory_type, category) DO UPDATE SET
      content = excluded.content,
      confidence_score = MIN(1, user_memories.confidence_score + 0.08 + excluded.confidence_score * 0.12),
      source = excluded.source,
      last_updated = excluded.last_updated
  `)
  const transaction = getDatabase().transaction(() => {
    for (const memory of memories) statement.run(crypto.randomUUID(), userId, memory.memoryType, memory.category, memory.content, memory.confidenceScore, memory.source, now, now)
  })
  transaction()
  return listUserMemories(userId)
}

export function updateUserMemory(userId: string, memoryId: string, content: string) {
  getDatabase().prepare('UPDATE user_memories SET content = ?, last_updated = ? WHERE id = ? AND user_id = ?').run(content.trim(), new Date().toISOString(), memoryId, userId)
  return listUserMemories(userId).find((memory) => memory.id === memoryId) ?? null
}

export function deleteUserMemory(userId: string, memoryId: string) {
  return getDatabase().prepare('DELETE FROM user_memories WHERE id = ? AND user_id = ?').run(memoryId, userId).changes > 0
}

export function clearUserMemories(userId: string) {
  getDatabase().prepare('DELETE FROM user_memories WHERE user_id = ?').run(userId)
}