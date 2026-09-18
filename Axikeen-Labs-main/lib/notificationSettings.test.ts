import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_NOTIFICATION_SETTINGS, loadNotificationSettings, saveNotificationSettings } from './notificationSettings'

function createMemoryStorage() {
  const store = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value) }),
    removeItem: vi.fn((key: string) => { store.delete(key) }),
    clear: vi.fn(() => { store.clear() }),
  }
}

describe('notification settings', () => {
  beforeEach(() => {
    const storage = createMemoryStorage()
    vi.stubGlobal('window', { localStorage: storage })
  })

  it('returns safe defaults when no settings exist', () => {
    expect(loadNotificationSettings()).toEqual(DEFAULT_NOTIFICATION_SETTINGS)
  })

  it('stores and restores enabled time-based reminders', () => {
    const next = { enabled: true, time: '8:00 AM', permission: 'granted' as const }
    saveNotificationSettings(next)
    expect(loadNotificationSettings()).toEqual(next)
  })
})
