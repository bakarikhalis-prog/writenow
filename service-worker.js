/* Chapter Guide — offline cache.
   Bump CACHE_NAME whenever you redeploy a new version of index.html; the old
   cache is dropped automatically the next time someone opens the app. */
var CACHE_NAME = "chapter-guide-v1";
var FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(FILES); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* Cache-first: instant load, works fully offline. Falls back to the network
   only for something not yet cached, and quietly updates the cache when it
   does — the writer's actual book data never touches this, it all lives in
   IndexedDB/localStorage, completely separate from this file cache. */
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        return resp;
      }).catch(function () { return cached; });
    })
  );
});
