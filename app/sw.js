/* The Book of Rates — offline.
 *
 * NETWORK-FIRST for same-origin HTML and JS, cache-first for static
 * assets. The first version was cache-first for everything, which meant a
 * deployed fix could sit behind a stale cache indefinitely — and worse,
 * a page could end up running a MIXTURE of old and new modules, which is
 * its own class of bug. A breathing app must work with no network, but
 * not at the cost of being unable to ship a correction.
 */
const CACHE = 'bor-v23';
const SHELL = [
  './', './index.html', './journey.html',
  './pearl-diver.html', './deep-light.html',  // the old address, a forwarding stub
  './long-air.html', './bamboo-rain.html', './shepherd.html',
  './murmuration.html',
  './free-dive.html',
  './lantern-current.html',   // withdrawn 7 Nov 2026; a forwarding stub
  './manifest.webmanifest', './icon.svg',
  './js/protocols.js', './js/engine.js', './js/audio.js', './js/art.js',
  './js/scenes.js', './js/levels.js', './js/pageturn.js', './js/gate.js',
  './js/scroll.js', './js/surface.js', './js/blackbox.js',
  // the book as an object: the binding, shared by the cover, the
  // contents' frame and every chapter's exit
  './js/bookframe.js', './css/bookframe.css', './js/arrival.js', './js/invite.js',
  // the 3-D kit, shared by every three-dimensional chapter
  './js/breath.js', './js/palette.js', './js/mesh.js', './js/stage.js', './js/course.js',
  // the book's own background, an idle variant of chapter six
  './js/deep-light-idle.js',
  // and each chapter's own protocol table
  './js/deep-light-breath.js', './js/long-air-breath.js',
  './js/bamboo-rain-breath.js', './js/shepherd-breath.js',
  './js/murmuration-breath.js',
  // the reader-led spine and the lighting kit (12 Nov 2026)
  './js/lead.js', './js/light.js', './js/solid.js', './js/free-dive-breath.js', './js/follow.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* CSS IS CODE. It was not in this test, so css/bookframe.css — the single
 * definition of the gold tooling, the board and the fore-edge — was served
 * CACHE-FIRST. On 12 November a material pass changed that file and nothing
 * else about the board, and the deployed page would have gone on painting
 * the previous stylesheet until the cache version happened to be bumped for
 * some unrelated reason. That is precisely the failure already written up
 * under "Deployment can hide a fix", in the same shape and one file type
 * over: a page running a mixture of old and new.
 *
 * The version bump below fixes it once. This line is what stops it coming
 * back the next time the stylesheet changes. */
const isCode = url => /\.(?:js|css|html)$/.test(url.pathname) || url.pathname.endsWith('/');

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
