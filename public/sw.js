// Service Worker for Studio Buku PWA & Offline Reader Support
const CACHE_NAME = 'studio-buku-v2';
const STATIC_PRECACHE = [
  '/pricing',
  '/terms',
  '/privacy',
  '/studio-buku-logo.jpg',
  '/QRIS-DANA.jpeg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting obsolete cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip non-http/https schemes (e.g. chrome-extension:)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never intercept API requests, Firebase auth handlers, or Vite dev server endpoints
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/__/') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('/src/')
  ) {
    return;
  }

  // 1. Navigation requests (HTML documents): Network-First
  // Ensures user always gets the freshest index.html with up-to-date chunk hashes,
  // falling back to cached pages only when completely offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return caches.match('/');
          });
        })
    );
    return;
  }

  // 2. JavaScript, WebAssembly, and CSS module chunks (/assets/* or .js/.css)
  // If a requested chunk is missing from the server (e.g. after a rebuild),
  // NEVER allow an SPA fallback (which returns text/html) to be returned or cached as a script!
  if (
    url.pathname.startsWith('/assets/') ||
    event.request.destination === 'script' ||
    event.request.destination === 'worker' ||
    event.request.destination === 'style' ||
    /\.(js|mjs|wasm|css)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          const contentType = networkResponse.headers.get('content-type') || '';

          // If the server responded with text/html for a script/css asset (e.g. 404 SPA fallback),
          // DO NOT cache and return a real 404 so module loading fails cleanly instead of MIME mismatch
          if (contentType.includes('text/html')) {
            return new Response('Asset not found', {
              status: 404,
              statusText: 'Not Found',
              headers: { 'Content-Type': 'text/plain' }
            });
          }

          if (networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Dynamic public reader pages (/p/*, /buku/*)
  if (url.pathname.startsWith('/p/') || url.pathname.startsWith('/buku/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 4. Stale-While-Revalidate for images, fonts, and other static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
