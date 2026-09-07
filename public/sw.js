/**
 * Service worker — the minimum needed for installability plus a useful
 * offline page.
 *
 * Deliberately conservative about caching: this app is almost entirely
 * live data (chat, leaderboards, balances), and serving a stale copy of
 * any of that would be worse than showing nothing. So API responses are
 * never cached — only the static shell and an offline fallback.
 */
const CACHE = "nexplay-shell-v1";
const OFFLINE_URL = "/offline.html";

const SHELL = [OFFLINE_URL, "/manifest.json", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API traffic — chat, balances and rankings must be live.
  if (url.pathname.startsWith("/api/") || url.hostname !== self.location.hostname) return;

  // Navigations: try the network, fall back to the offline page.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Static assets: serve from cache when present, otherwise fetch and store.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request)
          .then((response) => {
            if (response.ok && response.type === "basic") {
              const copy = response.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return response;
          })
          .catch(() => cached)
    )
  );
});
