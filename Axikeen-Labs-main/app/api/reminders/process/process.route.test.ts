import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

const testDbPath = path.join(os.tmpdir(), `sanespace-process-route-${process.pid}.db`)
process.env.SANESPACE_DATABASE_PATH = testDbPath

import { POST } from './route'
import { clearReminders, createReminder, listReminders } from '@/lib/reminderStore'

const originalSecret = process.env.CRON_SECRET

describe('reminder processor route', () => {
  beforeEach(async () => {
    process.env.CRON_SECRET = 'test-secret'
    await clearReminders('user-a')
    await clearReminders('user-b')
  })

  it('rejects unauthorized requests', async () => {
    const response = await POST(new NextRequest('http://localhost/api/reminders/process', { method: 'POST' }))
    expect(response.status).toBe(401)
  })

  it('authorizes a cron request and processes a due reminder', async () => {
    const reminder = await createReminder({
      userId: 'user-a',
      title: 'Process this reminder',
      dueAt: new Date(Date.now() - 60000).toISOString(),
      timezone: 'UTC',
    })

    const response = await POST(new NextRequest('http://localhost/api/reminders/process', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    }))

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.ok).toBe(true)
    const processedIds = payload.processedReminders.map((item: { id: string }) => item.id)
    expect(processedIds).toContain(reminder.id)
    const current = (await listReminders('user-a')).find((item) => item.id === reminder.id)
    expect(current?.status).toBe('completed')
  })

  it('does not process cancelled reminders', async () => {
    const reminder = await createReminder({
      userId: 'user-a',
      title: 'Cancelled reminder',
      dueAt: new Date(Date.now() - 60000).toISOString(),
      timezone: 'UTC',
    })

    await POST(new NextRequest('http://localhost/api/reminders/process', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }))

    const updated = (await listReminders('user-a')).find((item) => item.id === reminder.id)
    expect(updated?.status).not.toBe('cancelled')
  })

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = originalSecret
    }
    for (const suffix of ['', '-wal', '-shm']) {
      try { fs.rmSync(`${testDbPath}${suffix}`, { force: true }) } catch {}
    }
  })
})
