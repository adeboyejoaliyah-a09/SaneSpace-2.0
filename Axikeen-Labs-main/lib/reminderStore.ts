import Database from 'better-sqlite3'

export type ReminderStatus = 'pending' | 'completed' | 'dismissed' | 'cancelled'
export type ReminderSource = 'conversation' | 'memory' | 'user_created' | 'daily_plan'

export type Reminder = {
  id: string
  userId: string
  title: string
  description: string | null
  dueAt: string
  status: ReminderStatus
  source: ReminderSource
  createdAt: string
  updatedAt: string
}

const dbFile = process.env.DB_FILE || './data/sanespace.db'
const db = new Database(dbFile)

db.exec(`
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    dueAt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    source TEXT NOT NULL DEFAULT 'user_created',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`)

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_reminders_user_id_due_at
  ON reminders (userId, dueAt);
`)

export function createReminder(input: {
  userId: string
  title: string
  description?: string | null
  dueAt: string
  source?: ReminderSource
}): Reminder {
  const now = new Date().toISOString()
  const reminder: Reminder = {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title.trim(),
    description: input.description?.trim() ?? null,
    dueAt: new Date(input.dueAt).toISOString(),
    status: 'pending',
    source: input.source ?? 'user_created',
    createdAt: now,
    updatedAt: now,
  }

  db.prepare(`
    INSERT INTO reminders (id, userId, title, description, dueAt, status, source, createdAt, updatedAt)
    VALUES (@id, @userId, @title, @description, @dueAt, @status, @source, @createdAt, @updatedAt)
  `).run(reminder)

  return reminder
}

export function listReminders(userId: string): Reminder[] {
  return db
    .prepare(`
      SELECT *
      FROM reminders
      WHERE userId = @userId
      ORDER BY dueAt ASC
    `)
    .all({ userId }) as Reminder[]
}

export function getReminderById(userId: string, id: string): Reminder | null {
  return (
    db
      .prepare(`
        SELECT *
        FROM reminders
        WHERE id = @id AND userId = @userId
      `)
      .get({ id, userId }) as Reminder | undefined ?? null
  )
}

export function updateReminder(
  userId: string,
  id: string,
  patch: Partial<Pick<Reminder, 'title' | 'description' | 'dueAt' | 'status' | 'source'>>
): Reminder | null {
  const current = getReminderById(userId, id)
  if (!current) return null

  const next: Reminder = {
    ...current,
    ...patch,
    dueAt: patch.dueAt ? new Date(patch.dueAt).toISOString() : current.dueAt,
    updatedAt: new Date().toISOString(),
  }

  db.prepare(`
    UPDATE reminders
    SET title = @title,
        description = @description,
        dueAt = @dueAt,
        status = @status,
        source = @source,
        updatedAt = @updatedAt
    WHERE id = @id AND userId = @userId
  `).run({
    ...next,
    userId,
  })

  return next
}

export function deleteReminder(userId: string, id: string): boolean {
  const result = db.prepare(`
    DELETE FROM reminders
    WHERE id = @id AND userId = @userId
  `).run({ id, userId })
  return result.changes > 0
}

export function clearReminders(userId: string): void {
  db.prepare(`DELETE FROM reminders WHERE userId = @userId`).run({ userId })
}