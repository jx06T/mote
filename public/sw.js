const VERSION = 'v1.0.1';
const SHELL_CACHE = `mote-shell-${VERSION}`;
const API_CACHE = `mote-api-${VERSION}`;
const IMAGE_CACHE = `mote-images-${VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, API_CACHE, IMAGE_CACHE];

const SHELL_KEY = '/index.html';
const SHELL_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return Promise.allSettled(
        SHELL_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] Cache add failed:', url, err))
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key.startsWith('mote-') && !CURRENT_CACHES.includes(key)) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // In development, bypass Vite dev server files, HMR, and source modules
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.searchParams.has('t') ||
    url.searchParams.has('import')
  ) {
    return;
  }

  // Strategy 1: API -> Network-First (GET only)
  if (url.pathname.startsWith('/api/')) {
    if (event.request.method !== 'GET') return;

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {});
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: { code: 'OFFLINE', message: '離線且無可用快取' } }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Strategy 2: Images -> Stale-While-Revalidate
  if (
    (url.pathname.includes('/image') ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i)) &&
    !url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(event.request, responseToCache).catch(() => {});
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy 3: HTML Navigation -> Network-First with unified SHELL_KEY fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put(SHELL_KEY, responseToCache).catch(() => {});
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedShell = await caches.match(SHELL_KEY);
          if (cachedShell) return cachedShell;
          return new Response('離線模式且無可用快取', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // Strategy 4: Static assets -> Cache-First
  if (
    event.request.method === 'GET' &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/favicon.svg') ||
      url.pathname.startsWith('/manifest.json') ||
      url.pathname.startsWith('/icon-') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.ttf') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js'))
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(SHELL_CACHE).then((cache) => {
                cache.put(event.request, responseToCache).catch(() => {});
              });
            }
            return response;
          })
          .catch(
            () =>
              new Response('', { status: 504, statusText: 'Offline and not cached' })
          );
      })
    );
  }
});
