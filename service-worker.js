const OFFLINE_CACHE = 'hyrnex-offline-v1';
const OFFLINE_PAGE = new URL('offline.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_PAGE)));
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => {
    const offlinePage = await caches.match(OFFLINE_PAGE);
    return offlinePage || Response.error();
  }));
});
