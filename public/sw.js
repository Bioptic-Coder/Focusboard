const CACHE_NAME = "deskdash-cache-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./assets/index-2YFcZdkh.js",
  "./assets/index-BNUUEkje.css",
  "./favicon.svg",
  "./fonts/atkinson-hyperlegible-latin-400-italic.woff",
  "./fonts/atkinson-hyperlegible-latin-400-italic.woff2",
  "./fonts/atkinson-hyperlegible-latin-400-normal.woff",
  "./fonts/atkinson-hyperlegible-latin-400-normal.woff2",
  "./fonts/atkinson-hyperlegible-latin-700-italic.woff",
  "./fonts/atkinson-hyperlegible-latin-700-italic.woff2",
  "./fonts/atkinson-hyperlegible-latin-700-normal.woff",
  "./fonts/atkinson-hyperlegible-latin-700-normal.woff2",
  "./icons.svg",
  "./index.html",
  "./manifest.json"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event with Stale-While-Revalidate
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip caching dev server hot module reloading (HMR) or chrome-extensions
  if (url.pathname.includes("@vite") || url.pathname.includes("node_modules") || url.protocol === "chrome-extension:") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Silent catch for network failure (offline mode)
        });

      return cachedResponse || fetchPromise;
    })
  );
});
