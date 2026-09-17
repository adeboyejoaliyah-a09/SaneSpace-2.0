import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const testDbPath = path.join(os.tmpdir(), `sanespace-reminders-${process.pid}.db`)
process.env.SANESPACE_DATABASE_PATH = testDbPath

import { getReminderBackend, resetReminderBackendForTests } from './reminderDb'
import { createReminder, listReminders } from './reminderStore'

describe('reminder database backend', () => {
  beforeAll(async () => {
    await resetReminderBackendForTests()
  })

  afterAll(async () => {
    await resetReminderBackendForTests()
    for (const suffix of ['', '-wal', '-shm']) {
      try { fs.rmSync(`${testDbPath}${suffix}`, { force: true }) } catch {}
    }
  })

  it('initializes the local SQLite backend when no Postgres URL is set', async () => {
    const backend = await getReminderBackend()
    expect(backend.kind).toBe('sqlite')
  })

  it('persists reminders through the local backend', async () => {
    const reminder = await createReminder({
      userId: 'backend-user',
      title: 'Backend persistence check',
      dueAt: new Date(Date.now() + 60000).toISOString(),
    })
    const all = await listReminders('backend-user')
    expect(all.map((r) => r.id)).toContain(reminder.id)
  })
})
