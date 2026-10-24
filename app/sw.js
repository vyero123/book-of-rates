/* The Book of Rates — offline.
 *
 * NETWORK-FIRST for same-origin HTML and JS, cache-first for static
 * assets. The first version was cache-first for everything, which meant a
 * deployed fix could sit behind a stale cache indefinitely — and worse,
 * a page could end up running a MIXTURE of old and new modules, which is
 * its own class of bug. A breathing app must work with no network, but
 * not at the cost of being unable to ship a correction.
 */
const CACHE = 'bor-v9';
const SHELL = [
  './', './index.html', './journey.html', './deep-light.html', './long-air.html',
  './manifest.webmanifest', './icon.svg',
  './js/protocols.js', './js/engine.js', './js/audio.js', './js/art.js',
  './js/scenes.js', './js/levels.js', './js/pageturn.js', './js/gate.js',
  './js/scroll.js', './js/surface.js', './js/blackbox.js',
  // the 3-D kit, shared by every three-dimensional chapter
  './js/breath.js', './js/palette.js', './js/mesh.js', './js/stage.js',
  // and each chapter's own protocol table
  './js/deep-light-breath.js', './js/long-air-breath.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const isCode = url => /\.(?:js|html)$/.test(url.pathname) || url.pathname.endsWith('/');

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin !== location.origin) return;

  if (isCode(url)){
    // network first: the newest correct code wins whenever we can reach it
    e.respondWith(
      fetch(r).then(res => {
        if (res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(r, copy));
        }
        return res;
      }).catch(() => caches.match(r).then(hit => hit || Response.error()))
    );
    return;
  }
  // everything else: cache first, refreshed in the background
  e.respondWith(
    caches.match(r).then(hit => hit || fetch(r).then(res => {
      if (res && res.status === 200){
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(r, copy));
      }
      return res;
    }))
  );
});
