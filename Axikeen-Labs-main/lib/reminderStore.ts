import crypto from 'crypto'
import { getReminderBackend } from './reminderDb'

export type ReminderStatus = 'pending' | 'due' | 'triggered' | 'completed' | 'dismissed' | 'cancelled'
export type ReminderSource = 'conversation' | 'memory' | 'user_created' | 'daily_plan'
export type ReminderRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export type Reminder = {
  id: string
  userId: string
  title: string
  description: string | null
  dueAt: string
  status: ReminderStatus
  source: ReminderSource
  timezone: string
  recurrence: ReminderRecurrence
  nextOccurrence: string | null
  lastTriggeredAt: string | null
  createdAt: string
  updatedAt: string
}

type ReminderRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  due_at: string | Date
  status: ReminderStatus
  source: ReminderSource
  timezone: string
  recurrence: ReminderRecurrence
  next_occurrence: string | Date | null
  last_triggered_at: string | Date | null
  created_at: string | Date
  updated_at: string | Date
}

function toIso(value: string | Date | null): string | null {
  if (value === null || value === undefined) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function mapRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? null,
    dueAt: toIso(row.due_at) as string,
    status: row.status,
    source: row.source,
    timezone: row.timezone ?? 'UTC',
    recurrence: row.recurrence ?? 'none',
    nextOccurrence: toIso(row.next_occurrence),
    lastTriggeredAt: toIso(row.last_triggered_at),
    createdAt: toIso(row.created_at) as string,
    updatedAt: toIso(row.updated_at) as string,
  }
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date)
  copy.setUTCMonth(copy.getUTCMonth() + months)
  return copy
}

function computeNextOccurrence(baseDueAt: string, recurrence: ReminderRecurrence): string | null {
  if (recurrence === 'none') return null
  const value = new Date(baseDueAt)
  const next = recurrence === 'daily'
    ? addDays(value, 1)
    : recurrence === 'weekly'
      ? addWeeks(value, 1)
      : addMonths(value, 1)
  return next.toISOString()
}

export async function createReminder(input: {
  userId: string
  title: string
  description?: string | null
  dueAt: string
  source?: ReminderSource
  timezone?: string
  recurrence?: ReminderRecurrence
}): Promise<Reminder> {
  const backend = await getReminderBackend()
  const now = new Date().toISOString()
  const dueAt = new Date(input.dueAt).toISOString()
  const recurrence = input.recurrence ?? 'none'
  const reminder: Reminder = {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title.trim(),
    description: input.description?.trim() ?? null,
    dueAt,
    status: 'pending',
    source: input.source ?? 'user_created',
    timezone: input.timezone ?? 'UTC',
    recurrence,
    nextOccurrence: recurrence === 'none' ? null : dueAt,
    lastTriggeredAt: null,
    createdAt: now,
    updatedAt: now,
  }

  await backend.query(
    `INSERT INTO reminders (
      id, user_id, title, description, due_at, status, source,
      timezone, recurrence, next_occurrence, last_triggered_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reminder.id, reminder.userId, reminder.title, reminder.description,
      reminder.dueAt, reminder.status, reminder.source, reminder.timezone,
      reminder.recurrence, reminder.nextOccurrence, reminder.lastTriggeredAt,
      reminder.createdAt, reminder.updatedAt,
    ]
  )
  return reminder
}

export async function listReminders(userId: string): Promise<Reminder[]> {
  const backend = await getReminderBackend()
  const { rows } = await backend.query<ReminderRow>(
    `SELECT * FROM reminders WHERE user_id = ? ORDER BY due_at ASC`,
    [userId]
  )
  return rows.map(mapRow)
}

export async function listDueReminders(now = new Date()): Promise<Reminder[]> {
  const backend = await getReminderBackend()
  const nowIso = new Date(now).toISOString()
  const { rows } = await backend.query<ReminderRow>(
    `SELECT * FROM reminders WHERE status IN ('pending', 'due') AND due_at <= ? ORDER BY due_at ASC`,
    [nowIso]
  )
  return rows.map(mapRow)
}

export async function getReminderById(userId: string, id: string): Promise<Reminder | null> {
  const backend = await getReminderBackend()
  const { rows } = await backend.query<ReminderRow>(
    `SELECT * FROM reminders WHERE id = ? AND user_id = ?`,
    [id, userId]
  )
  return rows[0] ? mapRow(rows[0]) : null
}

export async function claimDueReminder(userId: string, id: string, now = new Date()): Promise<Reminder | null> {
  const backend = await getReminderBackend()
  const current = await getReminderById(userId, id)
  if (!current) return null
  if (current.status !== 'pending' || new Date(current.dueAt).getTime() > new Date(now).getTime()) {
    return null
  }
  const nowIso = new Date(now).toISOString()
  const result = await backend.query(
    `UPDATE reminders SET status = 'due', updated_at = ?
     WHERE id = ? AND user_id = ? AND status = 'pending' AND due_at <= ?`,
    [nowIso, id, userId, nowIso]
  )
  if ((result.rowCount ?? 0) === 0) return null
  return { ...current, status: 'due', updatedAt: nowIso }
}

export async function triggerReminder(userId: string, id: string, now = new Date()): Promise<Reminder | null> {
  const backend = await getReminderBackend()
  const current = await getReminderById(userId, id)
  if (!current || current.status !== 'due') return null
  const nowIso = new Date(now).toISOString()
  const result = await backend.query(
    `UPDATE reminders SET status = 'triggered', last_triggered_at = ?, updated_at = ?
     WHERE id = ? AND user_id = ? AND status = 'due'`,
    [nowIso, nowIso, id, userId]
  )
  if ((result.rowCount ?? 0) === 0) return null
  return { ...current, status: 'triggered', lastTriggeredAt: nowIso, updatedAt: nowIso }
}

export async function completeReminderExecution(userId: string, id: string, now = new Date()): Promise<Reminder | null> {
  const backend = await getReminderBackend()
  const current = await getReminderById(userId, id)
  if (!current || !['due', 'triggered'].includes(current.status)) return null
  const nowIso = new Date(now).toISOString()
  const recurrence = current.recurrence ?? 'none'
  const nextOccurrence = recurrence === 'none' ? null : computeNextOccurrence(current.dueAt, recurrence)
  const nextStatus: ReminderStatus = recurrence === 'none' ? 'completed' : 'pending'
  const nextDueAt = recurrence === 'none' ? current.dueAt : nextOccurrence ?? current.dueAt
  await backend.query(
    `UPDATE reminders SET status = ?, due_at = ?, next_occurrence = ?, last_triggered_at = ?, updated_at = ?
     WHERE id = ? AND user_id = ? AND status IN ('due', 'triggered')`,
    [nextStatus, nextDueAt, nextOccurrence, nowIso, nowIso, id, userId]
  )
  return { ...current, status: nextStatus, dueAt: nextDueAt, nextOccurrence, lastTriggeredAt: nowIso, updatedAt: nowIso }
}

export async function processDueReminders(now = new Date()): Promise<{ processed: Reminder[]; skipped: number }> {
  const dueReminders = await listDueReminders(now)
  const processed: Reminder[] = []
  for (const reminder of dueReminders) {
    const claimed = await claimDueReminder(reminder.userId, reminder.id, now)
    if (!claimed) continue
    const triggered = await triggerReminder(reminder.userId, reminder.id, now)
    if (!triggered) continue
    const completed = await completeReminderExecution(reminder.userId, reminder.id, now)
    if (completed) processed.push(completed)
  }
  return { processed, skipped: dueReminders.length - processed.length }
}

export async function updateReminder(
  userId: string,
  id: string,
  patch: Partial<Pick<Reminder, 'title' | 'description' | 'dueAt' | 'status' | 'source' | 'timezone' | 'recurrence' | 'nextOccurrence' | 'lastTriggeredAt'>>
): Promise<Reminder | null> {
  const backend = await getReminderBackend()
  const current = await getReminderById(userId, id)
  if (!current) return null
  const next: Reminder = {
    ...current,
    ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
    dueAt: patch.dueAt ? new Date(patch.dueAt).toISOString() : current.dueAt,
    timezone: patch.timezone ?? current.timezone,
    recurrence: patch.recurrence ?? current.recurrence,
    nextOccurrence: patch.nextOccurrence ?? current.nextOccurrence,
    lastTriggeredAt: patch.lastTriggeredAt ?? current.lastTriggeredAt,
    updatedAt: new Date().toISOString(),
  }
  await backend.query(
    `UPDATE reminders
     SET title = ?, description = ?, due_at = ?, status = ?, source = ?,
         timezone = ?, recurrence = ?, next_occurrence = ?, last_triggered_at = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      next.title, next.description, next.dueAt, next.status, next.source,
      next.timezone, next.recurrence, next.nextOccurrence, next.lastTriggeredAt, next.updatedAt,
      id, userId,
    ]
  )
  return next
}

export async function deleteReminder(userId: string, id: string): Promise<boolean> {
  const backend = await getReminderBackend()
  const result = await backend.query(`DELETE FROM reminders WHERE id = ? AND user_id = ?`, [id, userId])
  return (result.rowCount ?? 0) > 0
}

export async function clearReminders(userId: string): Promise<void> {
  const backend = await getReminderBackend()
  await backend.query(`DELETE FROM reminders WHERE user_id = ?`, [userId])
}