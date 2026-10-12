/**
 * Service worker: cache VETËM për asset-et statike të aplikacionit.
 * Streamet (m3u8/ts/mp3/...), /proxy dhe çdo kërkesë cross-origin NUK preken kurrë.
 */
const VERSION = 'miniiptv-v1';
const SHELL = [
  './',
  'index.html',
  'css/app.css',
  'js/main.js', 'js/config.js', 'js/storage.js', 'js/network.js', 'js/channels.js',
  'js/health.js', 'js/player.js', 'js/ui.js', 'js/epg.js',
  'icons/icon.svg',
  'manifest.webmanifest',
];
const DATA = ['data/channels.json', 'data/health.json', 'data/epg.json'];
const STREAM_RE = /\.(m3u8?|ts|aac|mp3|ogg|opus|flv|mp4|m4s)(\?|$)/i;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // CDN, stream-e të jashtme
  if (url.pathname.startsWith('/proxy') || STREAM_RE.test(url.pathname)) return;

  const isData = DATA.some((d) => url.pathname.endsWith(d));
  if (isData) {
    // rrjeti fillimisht (të dhëna të reja), cache si rezervë offline
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req)),
    );
    return;
  }
  // asset-e: cache fillimisht, rifresko në sfond
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || net;
    }),
  );
});
