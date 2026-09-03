import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import type { Conversation, Message } from '@/lib/types'

const databasePath = process.env.SANESPACE_DATABASE_PATH || path.join(process.cwd(), 'data', 'sanespace.db')
fs.mkdirSync(path.dirname(databasePath), { recursive: true })
const database = new Database(databasePath)

database.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'text',
    created_at TEXT NOT NULL,
    messages_json TEXT NOT NULL DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS conversations_user_idx ON conversations(user_id, created_at DESC);
`)

function rowToConversation(row: Record<string, unknown>): Conversation {
  let messages: Message[] = []
  try {
    const parsed = JSON.parse(String(row.messages_json ?? '[]'))
    if (Array.isArray(parsed)) messages = parsed as Message[]
  } catch {}
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    mode: row.mode === 'voice' ? 'voice' : 'text',
    createdAt: String(row.created_at),
    messages,
  }
}

export function listConversations(userId: string) {
  return (database.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Record<string, unknown>[]).map(rowToConversation)
}

export function createConversation(userId: string, input?: { id?: string; title?: string; mode?: 'text' | 'voice' }) {
  const conversation: Conversation = {
    id: input?.id ?? crypto.randomUUID(),
    userId,
    title: input?.title ?? 'New conversation',
    mode: input?.mode ?? 'text',
    createdAt: new Date().toISOString(),
    messages: [],
  }
  database.prepare('INSERT INTO conversations (id, user_id, title, mode, created_at, messages_json) VALUES (?, ?, ?, ?, ?, ?)').run(conversation.id, userId, conversation.title, conversation.mode, conversation.createdAt, '[]')
  return conversation
}

export function updateConversation(userId: string, id: string, patch: { title?: string; messages?: Message[] }) {
  const current = listConversations(userId).find((conversation) => conversation.id === id)
  if (!current) return null
  const next = { ...current, title: patch.title ?? current.title, messages: patch.messages ?? current.messages }
  database.prepare('UPDATE conversations SET title = ?, messages_json = ? WHERE id = ? AND user_id = ?').run(next.title, JSON.stringify(next.messages), id, userId)
  return next
}

export function deleteConversation(userId: string, id: string) {
  return database.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(id, userId).changes > 0
}