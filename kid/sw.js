// =============================================================================
// SERVICE WORKER — offline cache for the hub and every game.
//
// Served at /sw.js with `const VERSION = '...'` injected by server.mjs from
// the precache manifest, so any file change rolls the worker. Strategy:
// - install/update: diff /sw-manifest.json against the stored copy and fetch
//   only new or changed files (first install downloads everything, ~5MB)
// - fetch: cache-first with a background refresh (stale-while-revalidate),
//   keyed by pathname so /?who=asher hits the cached /
// - logging endpoints pass straight through to the network (the page itself
//   queues failed log posts and replays them when back online)
// =============================================================================

const CACHE = 'kid-games-static';
// ANIMAL's brain must never be served stale from cache — the page keeps its own
// localStorage copy and queues lessons, so it handles being offline itself.
const PASSTHROUGH = new Set([
  '/log', '/save-drawing', '/sw-manifest.json', '/sw.js',
  '/animal-brain', '/animal-teach',
]);

async function precache() {
  const cache = await caches.open(CACHE);
  let manifest;
  try {
    manifest = await (await fetch('/sw-manifest.json', { cache: 'no-cache' })).json();
  } catch {
    return; // offline during update — keep whatever we have
  }
  const oldRes = await cache.match('/__manifest__');
  const old = oldRes ? await oldRes.json() : { files: {} };

  for (const [url, stamp] of Object.entries(manifest.files)) {
    if (old.files[url] === stamp && await cache.match(url)) continue;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) await cache.put(url, res);
    } catch { /* skip — runtime caching will pick it up later */ }
  }
  for (const url of Object.keys(old.files)) {
    if (!(url in manifest.files)) await cache.delete(url);
  }
  await cache.put('/__manifest__', new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/json' },
  }));
}

self.addEventListener('install', (e) => {
  e.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (PASSTHROUGH.has(url.pathname)) return;

  const key = url.pathname; // strip query so /?who=asher matches cached /
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key);
    const refresh = fetch(e.request).then((res) => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    });
    if (cached) {
      e.waitUntil(refresh.catch(() => {}));
      return cached;
    }
    try {
      return await refresh;
    } catch {
      return new Response('Offline, and this page is not saved yet. Reconnect once to save it.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  })());
});
