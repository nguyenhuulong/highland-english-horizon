// Higland English Horizon — Service Worker
const CACHE_NAME = "heh-v1";
const STATIC_ASSETS = [
  "/",
  "/library",
  "/games",
  "/creator",
  "/progress",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      self.addEventListener("fetch", (event) => {
        if (event.request.method !== "GET") return;

        const url = new URL(event.request.url);

        const isStaticAsset =
          url.pathname.startsWith("/_next/") ||
          url.pathname.endsWith(".css") ||
          url.pathname.endsWith(".js") ||
          url.pathname.endsWith(".png") ||
          url.pathname.endsWith(".jpg") ||
          url.pathname.endsWith(".svg") ||
          url.pathname.endsWith(".ico") ||
          url.pathname.endsWith(".woff2");

        if (!isStaticAsset) return;

        event.respondWith(
          caches.match(event.request).then((cached) => {
            if (cached) return cached;

            return fetch(event.request).then((response) => {
              const clone = response.clone();

              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });

              return response;
            });
          })
        );
      });
    })
  );
});
