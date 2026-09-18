self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open('sanespace-static').then(() => undefined))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const payload = event.data?.json?.() ?? {
    title: 'SaneSpace reminder',
    body: 'It is time for your gentle check-in.',
  }

  const title = payload.title || 'SaneSpace reminder'
  const body = payload.body || 'It is time for your gentle check-in.'

  self.registration.showNotification(title, {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'sanespace-reminder',
    vibrate: [200, 100, 200],
  })
})
