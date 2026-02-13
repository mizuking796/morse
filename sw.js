const CACHE_NAME = 'morse-v2.0';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/morse-data.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Skip navigation requests to avoid redirect caching issues with GitHub Pages
  if (e.request.mode === 'navigate') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
