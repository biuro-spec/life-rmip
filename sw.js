/**
 * Life RMiP - Service Worker
 * ==========================
 * Cache-first dla statycznych zasobów, network-first dla API
 */

const CACHE_NAME = 'life-rmip-v9';

const STATIC_ASSETS = [
  './',
  './index.html',
  './orders.html',
  './order-details.html',
  './css/main.css',
  './css/login.css',
  './css/orders.css',
  './js/utils.js',
  './js/api.js',
  './js/pwa.js',
  './js/login.js',
  './js/orders.js',
  './js/order-details.js',
  './assets/logo.png',
  './assets/icon.svg',
  './manifest.json'
];

// Install - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls (Google Apps Script) - network only, no cache
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('script.googleusercontent.com')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({
          success: false,
          message: 'Brak połączenia z serwerem. Sprawdź internet.'
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // External resources (CDN, fonts) - network first, cache fallback
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Local static assets - cache first, network fallback
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
      .catch(() => {
        // Offline fallback for HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      })
  );
});
