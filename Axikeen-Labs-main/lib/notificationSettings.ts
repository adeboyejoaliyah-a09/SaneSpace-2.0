export type NotificationPermissionState = 'default' | 'granted' | 'denied'

export type NotificationSettings = {
  enabled: boolean
  time: string
  permission: NotificationPermissionState
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  time: '9:00 AM',
  permission: 'default',
}

const STORAGE_KEY = 'sane_notification_settings'

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  const storage = window.localStorage
  if (!storage || typeof storage.getItem !== 'function') return null
  return storage
}

export function loadNotificationSettings(): NotificationSettings {
  const storage = getStorage()
  if (!storage) return DEFAULT_NOTIFICATION_SETTINGS

  try {
    const saved = storage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_NOTIFICATION_SETTINGS

    const parsed = JSON.parse(saved) as Partial<NotificationSettings>
    return {
      enabled: Boolean(parsed.enabled),
      time: typeof parsed.time === 'string' && parsed.time ? parsed.time : DEFAULT_NOTIFICATION_SETTINGS.time,
      permission: parsed.permission === 'granted' || parsed.permission === 'denied' ? parsed.permission : 'default',
    }
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS
  }
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  const next = { ...loadNotificationSettings(), ...settings }
  const storage = getStorage()

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return next
}
