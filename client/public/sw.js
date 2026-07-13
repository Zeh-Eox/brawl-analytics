/* NOVA — service worker (hand-rolled, no build integration).
 *
 * Strategies:
 *   - navigations      → network-first, fallback to cached app shell (offline)
 *   - Brawlify images  → cache-first (immutable cosmetic assets)
 *   - same-origin JS/CSS + Google Fonts → stale-while-revalidate
 * API traffic (/api and JSON) is never cached — always hits the network.
 */
const SHELL = "nova-shell-v1";
const IMG = "nova-img-v1";
const KEEP = [SHELL, IMG];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

const isImage = (url) =>
  url.hostname.endsWith("brawlify.com") ||
  /\.(png|jpe?g|svg|webp|gif|avif)$/i.test(url.pathname);

const isFont = (url) =>
  url.hostname === "fonts.googleapis.com" ||
  url.hostname === "fonts.gstatic.com";

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    const cache = await caches.open(SHELL);
    cache.put(req, res.clone());
    return res;
  } catch {
    const cached = (await caches.match(req)) || (await caches.match("/"));
    return (
      cached ||
      new Response("Hors ligne", { status: 503, statusText: "Offline" })
    );
  }
}

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") {
    const cache = await caches.open(cacheName);
    cache.put(req, res.clone());
  }
  return res;
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // Never touch API traffic (proxy lives under /api in dev; JSON elsewhere).
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/tracker")) {
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  if (isImage(url)) {
    event.respondWith(cacheFirst(req, IMG));
    return;
  }

  if (url.origin === self.location.origin || isFont(url)) {
    event.respondWith(staleWhileRevalidate(req, SHELL));
  }
});
