const CACHE_NAME = "fractions-cache-v2";
const FILES_TO_CACHE = ["./","./index.html","./style.css","./app.js","./manifest.json","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))); self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))))); self.clients.claim(); });
self.addEventListener("fetch", (event) => { event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request))); });
