export type NotificationPermissionState = 'default' | 'granted' | 'denied'

export type NotificationSettings = {
  enabled: boolean
  time: string
  permission: NotificationPermissionState
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  time: '09:00',
  permission: 'default',
}

const STORAGE_KEY = 'sane_notification_settings'

export function normalizeReminderTime(value: string | null | undefined): string {
  if (!value) return DEFAULT_NOTIFICATION_SETTINGS.time

  const trimmed = value.trim()
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hoursText, minutesText] = trimmed.split(':')
    const hours = Number(hoursText)
    const minutes = Number(minutesText)
    if (Number.isInteger(hours) && Number.isInteger(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  const legacy = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (legacy) {
    let hours = Number(legacy[1])
    const minutes = Number(legacy[2])
    const meridian = legacy[3]?.toUpperCase()

    if (meridian === 'PM' && hours < 12) hours += 12
    if (meridian === 'AM' && hours === 12) hours = 0

    if (minutes >= 0 && minutes < 60) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  return DEFAULT_NOTIFICATION_SETTINGS.time
}

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
      time: normalizeReminderTime(typeof parsed.time === 'string' ? parsed.time : null),
      permission: parsed.permission === 'granted' || parsed.permission === 'denied' ? parsed.permission : 'default',
    }
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS
  }
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  const next = { ...loadNotificationSettings(), ...settings, time: normalizeReminderTime(settings.time ?? loadNotificationSettings().time) }
  const storage = getStorage()

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return next
}
