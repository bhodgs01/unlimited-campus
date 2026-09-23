// Unlimited Campus service worker: makes the campus installable as an app, and delivers chat
// notifications. It still caches nothing on purpose; every request goes to the network, so a new
// release is never hidden behind a stale copy.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})

// A message arrived for this person. If the campus is already open and in front of them, the
// in-app badge and the open thread already show it, so a system notification would only be a
// second, noisier copy of the same thing. Otherwise, buzz.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Unlimited Campus', body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const watching = clients.some((c) => c.visibilityState === 'visible')
      if (watching) return
      return self.registration.showNotification(data.title || 'Unlimited Campus', {
        body: data.body || 'You have a new message.',
        icon: new URL('icon-192.png', self.registration.scope).href,
        badge: new URL('icon-192.png', self.registration.scope).href,
        // one notification per sender: a second message replaces the first rather than stacking
        tag: data.tag || 'chat',
        renotify: true,
        data: { url: data.url || self.registration.scope },
      })
    }),
  )
})

// Tapping it opens the campus straight onto that conversation, reusing an open window if there
// is one rather than starting a second copy of a heavy 3D scene.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || self.registration.scope, self.location.origin)
  const withWhom = url.searchParams.get('chat')
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => c.url.startsWith(self.registration.scope))
      if (open) {
        if (withWhom) open.postMessage({ type: 'open-chat', with: withWhom })
        return open.focus()
      }
      return self.clients.openWindow(url.href)
    }),
  )
})
