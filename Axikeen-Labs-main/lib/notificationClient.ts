export function supportsBrowserNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!supportsBrowserNotifications()) return 'denied'
  return Notification.requestPermission()
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!supportsBrowserNotifications()) return null

  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

export async function pushReminderNotification(title: string, body: string): Promise<boolean> {
  if (!supportsBrowserNotifications()) return false
  if (Notification.permission !== 'granted') return false

  const registration = await registerServiceWorker()
  if (!registration) return false

  registration.showNotification(title, {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'sanespace-reminder',
  })

  return true
}
