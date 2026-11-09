// Reelbook service worker: makes the web app installable and opens the last copy of the shell when offline.
// Only page loads are cached; scripts have hashed names and data comes fresh from the network.
const CACHE = "reelbook-shell-v1";

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/")));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.mode !== "navigate") return;
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const copy = response.clone();
                void caches.open(CACHE).then((cache) => cache.put("/", copy));
                return response;
            })
            .catch(() => caches.match("/")),
    );
});
