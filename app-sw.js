// Offline cache for the digital-pet rebuild (app.html). Same cache-first
// pattern as the old sw.js: first visit needs network once, every visit
// after is served from this cache so it still works with no signal.
//
// IMPORTANT: bump CACHE_NAME any time app.html is updated and re-uploaded,
// or installed phones will keep serving the OLD cached version forever —
// the activate handler below only clears caches whose name no longer matches.
const CACHE_NAME = 'digitalpet-app-v15';
const CACHE_FILES = [
  './app.html',
  './app-manifest.json',
  './nn-icon-180.png',
  './nn-icon-512.png'
  // Fluent Emoji species/decor art has no single manifest to pre-cache — it's
  // fetched at runtime from the CDN and cached opportunistically by the fetch
  // handler below the first time each icon is actually used, same as before.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && (response.type === 'opaque' || response.ok)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
