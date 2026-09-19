import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_NOTIFICATION_SETTINGS, loadNotificationSettings, saveNotificationSettings } from './notificationSettings'
import { pushReminderNotification, supportsBrowserNotifications } from './notificationClient'

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
    const next = { enabled: true, time: '08:00', permission: 'granted' as const }
    saveNotificationSettings(next)
    expect(loadNotificationSettings()).toEqual(next)
  })

  it('normalizes legacy reminder strings into browser-native time values', () => {
    const legacy = { enabled: true, time: '9:00 AM', permission: 'granted' as const }
    saveNotificationSettings(legacy)
    expect(loadNotificationSettings()).toEqual({ ...legacy, time: '09:00' })
  })

  it('supports browser notifications when Notification is available even without a service worker', async () => {
    const showNotification = vi.fn()
    class FakeNotification {
      static permission = 'granted'
      constructor(public title: string, public options?: NotificationOptions) {
        showNotification(this.title, this.options)
      }
    }

    vi.stubGlobal('Notification', FakeNotification as typeof Notification)
    vi.stubGlobal('navigator', { serviceWorker: undefined })

    expect(supportsBrowserNotifications()).toBe(true)
    await expect(pushReminderNotification('Check-in saved', 'Message')).resolves.toBe(true)
    expect(showNotification).toHaveBeenCalledWith('Check-in saved', expect.objectContaining({ body: 'Message' }))
  })
})
