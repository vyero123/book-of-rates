/* The Book of Rates — offline.
 * Cache-first for the shell so a session can run with no network at all,
 * with a background refresh so a new deploy is picked up next launch. */
const CACHE = 'bor-v2';
const SHELL = [
  './', './index.html', './journey.html', './manifest.webmanifest', './icon.svg',
  './js/protocols.js', './js/engine.js', './js/audio.js', './js/art.js',
  './js/scenes.js', './js/levels.js', './js/pageturn.js', './js/gate.js',
  './js/surface.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(r, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
