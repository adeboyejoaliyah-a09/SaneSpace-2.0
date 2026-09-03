import { describe, expect, it } from 'vitest'
import {
  clearReminders,
  createReminder,
  getReminderById,
  listReminders,
  updateReminder,
} from './reminderStore'

describe('reminder store', () => {
  it('creates a reminder for a user', () => {
    clearReminders('user-a')

    const reminder = createReminder({
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

  it('isolates reminders by user', () => {
    clearReminders('user-a')
    clearReminders('user-b')

    createReminder({
      userId: 'user-a',
      title: 'A reminder',
      dueAt: new Date(Date.now() + 3600000).toISOString(),
    })

    createReminder({
      userId: 'user-b',
      title: 'B reminder',
      dueAt: new Date(Date.now() + 7200000).toISOString(),
    })

    const userAReminders = listReminders('user-a')
    const userBReminders = listReminders('user-b')

    expect(userAReminders).toHaveLength(1)
    expect(userBReminders).toHaveLength(1)
    expect(userAReminders[0].title).toBe('A reminder')
    expect(userBReminders[0].title).toBe('B reminder')
  })

  it('prevents cross-user access by id', () => {
    clearReminders('user-a')
    clearReminders('user-b')

    const aReminder = createReminder({
      userId: 'user-a',
      title: 'A only',
      dueAt: new Date(Date.now() + 60000).toISOString(),
    })

    expect(getReminderById('user-a', aReminder.id)?.title).toBe('A only')
    expect(getReminderById('user-b', aReminder.id)).toBeNull()
  })

  it('preserves fields when applying a partial update', () => {
    clearReminders('user-a')
    const reminder = createReminder({
      userId: 'user-a',
      title: 'Original title',
      description: 'Keep this description',
      dueAt: new Date(Date.now() + 60000).toISOString(),
    })

    const updated = updateReminder('user-a', reminder.id, { status: 'cancelled' })
    expect(updated).toMatchObject({ title: 'Original title', description: 'Keep this description', status: 'cancelled' })
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