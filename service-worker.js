// Service Worker de Online Shop — cachea el "shell" de la app para que abra rápido
// y sea instalable en Android/iPhone. Los datos (Google Sheets vía Apps Script) siempre
// se piden en vivo por internet, esto solo cachea el HTML/CSS/JS de la app.

const CACHE_NAME = 'online-shop-v1';
const ARCHIVOS_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/api.js',
  '/js/app.js',
  '/manifest.json',
  '/img/icon-192.png',
  '/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear llamadas al backend (Apps Script) — esos datos siempre deben ser en vivo
  if (url.hostname.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((respuestaCache) => {
      return respuestaCache || fetch(event.request).then((respuestaRed) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === 'GET') cache.put(event.request, respuestaRed.clone());
          return respuestaRed;
        });
      }).catch(() => respuestaCache);
    })
  );
});
