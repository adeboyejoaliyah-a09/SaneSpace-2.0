'use client'

import { useEffect } from 'react'
import { registerServiceWorker, requestNotificationPermission, supportsBrowserNotifications } from '@/lib/notificationClient'

export function NotificationBootstrap() {
  useEffect(() => {
    if (!supportsBrowserNotifications()) return

    void registerServiceWorker().catch(() => undefined)

    if (Notification.permission === 'default') {
      void requestNotificationPermission().catch(() => undefined)
    }
  }, [])

  return null
}
