/* Chapter Guide offline cache. The app shell is network-first so a redeploy
   reaches people without a version bump; icons and manifest are cache-first.
   Offline still works: the fetch fails and the cached copy is served. */
var CACHE_NAME = "chapter-guide-v2";
var FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(function (c) { return c.addAll(FILES); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ns) {
    return Promise.all(ns.filter(function (n) { return n !== CACHE_NAME; })
      .map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var shell = req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  if (shell) {
    e.respondWith(fetch(req).then(function (r) {
      var copy = r.clone();
      caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
      return r;
    }).catch(function () {
      return caches.match(req).then(function (h) { return h || caches.match("./index.html"); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (cached) {
    if (cached) return cached;
    return fetch(req).then(function (r) {
      var copy = r.clone();
      caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
      return r;
    });
  }));
});
