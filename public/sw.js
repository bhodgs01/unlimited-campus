// Unlimited Campus service worker: makes the campus installable as an app. It caches nothing on
// purpose; every request goes to the network, so a new release is never hidden behind a stale copy.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
