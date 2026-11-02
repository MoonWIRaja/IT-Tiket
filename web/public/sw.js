// Network first, so deploys show at once; the cache only serves when offline.
const CACHE = 'it-tiket-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()),
));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request)));
});

self.addEventListener('push', (e) => {
  const n = e.data?.json() ?? {};
  e.waitUntil(self.registration.showNotification(n.title ?? 'IT-Tiket', {
    body: n.body, tag: n.tag, icon: 'icon-192.png', data: { url: n.url },
    requireInteraction: !!n.call, vibrate: n.call ? [400, 200, 400, 200, 400] : [200],
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url ?? '', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((tabs) => {
    const tab = tabs[0];
    return tab ? tab.focus().then(() => tab.navigate(url)) : self.clients.openWindow(url);
  }));
});
