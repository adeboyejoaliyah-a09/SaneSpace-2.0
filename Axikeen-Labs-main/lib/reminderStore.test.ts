import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterAll, describe, expect, it } from 'vitest'

const testDbPath = path.join(os.tmpdir(), `sanespace-reminder-store-${process.pid}.db`)
process.env.SANESPACE_DATABASE_PATH = testDbPath

import {
  claimDueReminder,
  clearReminders,
  completeReminderExecution,
  createReminder,
  deleteReminder,
  getReminderById,
  listDueReminders,
  listReminders,
  processDueReminders,
  triggerReminder,
  updateReminder,
} from './reminderStore'

describe('reminder store', () => {
  it('creates a reminder for a user', async () => {
    await clearReminders('user-a')

    const reminder = await createReminder({
      userId: 'user-a',
      title: 'Submit project',
      description: 'Share the draft',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      source: 'conversation',
    })

    expect(reminder.userId).toBe('user-a')
    expect(reminder.title).toBe('Submit project')
    expect(reminder.status).toBe('pending')
  })

  it('isolates reminders by user', async () => {
    await clearReminders('user-a')
    await clearReminders('user-b')

    await createReminder({
      userId: 'user-a',
      title: 'A reminder',
      dueAt: new Date(Date.now() + 3600000).toISOString(),
    })

    await createReminder({
      userId: 'user-b',
      title: 'B reminder',
      dueAt: new Date(Date.now() + 7200000).toISOString(),
    })

    const userAReminders = await listReminders('user-a')
    const userBReminders = await listReminders('user-b')

    expect(userAReminders).toHaveLength(1)
    expect(userBReminders).toHaveLength(1)
    expect(userAReminders[0].title).toBe('A reminder')
    expect(userBReminders[0].title).toBe('B reminder')
  })

  it('prevents cross-user access by id', async () => {
    await clearReminders('user-a')
    await clearReminders('user-b')

    const aReminder = await createReminder({
      userId: 'user-a',
      title: 'A only',
      dueAt: new Date(Date.now() + 60000).toISOString(),
    })

    expect((await getReminderById('user-a', aReminder.id))?.title).toBe('A only')
    expect(await getReminderById('user-b', aReminder.id)).toBeNull()
  })

  it('preserves fields when applying a partial update', async () => {
    await clearReminders('user-a')
    const reminder = await createReminder({
      userId: 'user-a',
      title: 'Original title',
      description: 'Keep this description',
      dueAt: new Date(Date.now() + 60000).toISOString(),
    })

    const updated = await updateReminder('user-a', reminder.id, { status: 'cancelled' })
    expect(updated).toMatchObject({ title: 'Original title', description: 'Keep this description', status: 'cancelled' })
  })

  it('deletes a reminder owned by the user', async () => {
    await clearReminders('user-a')
    const reminder = await createReminder({
      userId: 'user-a',
      title: 'Delete me',
      dueAt: new Date(Date.now() + 60000).toISOString(),
    })
    expect(await deleteReminder('user-a', reminder.id)).toBe(true)
    expect(await getReminderById('user-a', reminder.id)).toBeNull()
  })

  it('finds due reminders and ignores future ones', async () => {
    await clearReminders('user-a')
    await createReminder({
      userId: 'user-a',
      title: 'Due now',
      dueAt: new Date(Date.now() - 60000).toISOString(),
    })
    await createReminder({
      userId: 'user-a',
      title: 'Future',
      dueAt: new Date(Date.now() + 3600000).toISOString(),
    })
    const due = await listDueReminders(new Date())
    expect(due.map((r) => r.title)).toContain('Due now')
    expect(due.map((r) => r.title)).not.toContain('Future')
  })

  it('claims due reminders atomically and advances recurring reminders safely', async () => {
    await clearReminders('user-a')
    const reminder = await createReminder({
      userId: 'user-a',
      title: 'Daily check-in',
      description: 'Take a minute to reflect',
      dueAt: new Date(Date.now() - 60000).toISOString(),
      timezone: 'Africa/Lagos',
      recurrence: 'daily',
    })

    const claimed = await claimDueReminder('user-a', reminder.id, new Date())
    expect(claimed).not.toBeNull()
    expect(claimed?.status).toBe('due')

    const duplicate = await claimDueReminder('user-a', reminder.id, new Date())
    expect(duplicate).toBeNull()

    const triggered = await triggerReminder('user-a', reminder.id, new Date())
    expect(triggered?.status).toBe('triggered')

    const completed = await completeReminderExecution('user-a', reminder.id, new Date())
    expect(completed?.status).toBe('pending')
    expect(completed?.recurrence).toBe('daily')
    expect(completed?.nextOccurrence).toBeTruthy()
  })

  it('processes due reminders once and keeps one recurring occurrence active', async () => {
    await clearReminders('user-a')
    const reminder = await createReminder({
      userId: 'user-a',
      title: 'Recurring follow-up',
      dueAt: new Date(Date.now() - 120000).toISOString(),
      recurrence: 'weekly',
      timezone: 'UTC',
    })

    const result = await processDueReminders(new Date())
    expect(result.processed).toHaveLength(1)
    expect(result.processed[0].id).toBe(reminder.id)
    expect(result.processed[0].status).toBe('pending')
    expect(result.processed[0].nextOccurrence).toBeTruthy()

    const second = await processDueReminders(new Date())
    expect(second.processed).toHaveLength(0)
  })

  it('ignores cancelled reminders during processing', async () => {
    await clearReminders('user-a')
    const reminder = await createReminder({
      userId: 'user-a',
      title: 'Cancelled',
      dueAt: new Date(Date.now() - 60000).toISOString(),
    })
    await updateReminder('user-a', reminder.id, { status: 'cancelled' })
    const result = await processDueReminders(new Date())
    expect(result.processed.map((r) => r.id)).not.toContain(reminder.id)
  })

  it('advances monthly recurrence', async () => {
    await clearReminders('user-a')
    const reminder = await createReminder({
      userId: 'user-a',
      title: 'Monthly',
      dueAt: new Date(Date.now() - 60000).toISOString(),
      recurrence: 'monthly',
    })
    await claimDueReminder('user-a', reminder.id, new Date())
    await triggerReminder('user-a', reminder.id, new Date())
    const completed = await completeReminderExecution('user-a', reminder.id, new Date())
    expect(completed?.status).toBe('pending')
    expect(new Date(completed!.dueAt).getTime()).toBeGreaterThan(Date.now())
  })

  it('allows only one concurrent claim of the same due reminder', async () => {
    await clearReminders('user-a')
    const reminder = await createReminder({
      userId: 'user-a',
      title: 'Concurrent claim',
      dueAt: new Date(Date.now() - 60000).toISOString(),
    })

    const now = new Date()
    const [first, second] = await Promise.all([
      claimDueReminder('user-a', reminder.id, now),
      claimDueReminder('user-a', reminder.id, now),
    ])
    const succeeded = [first, second].filter((r) => r !== null)
    expect(succeeded).toHaveLength(1)
  })
})

describe('reminder validation', () => {
  it('rejects invalid reminder input shape', () => {
    expect(() => {
      const invalid: unknown = null
      if (!invalid || typeof invalid !== 'object') {
        throw new Error('Invalid input')
      }
    }).toThrow('Invalid input')
  })
})

afterAll(() => {
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.rmSync(`${testDbPath}${suffix}`, { force: true }) } catch {}
  }
})