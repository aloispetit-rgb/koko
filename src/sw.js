var CACHE_NAME = 'koko-v3';

var URLS_TO_CACHE = [
  '/koko/',
  '/koko/parent/',
  '/koko/assets/css/style.css',
  '/koko/assets/css/child.css',
  '/koko/assets/css/parent.css',
  '/koko/assets/js/timeUtils.js',
  '/koko/assets/js/storage.js',
  '/koko/assets/js/recurrence.js',
  '/koko/assets/js/periods.js',
  '/koko/assets/js/smiley.js',
  '/koko/assets/js/calendar.js',
  '/koko/assets/js/app.js',
  '/koko/assets/js/parent.js',
  '/koko/assets/img/periods/ecole.png',
  '/koko/assets/img/periods/dormir.png',
  '/koko/assets/img/periods/judo.png',
  '/koko/assets/img/calendar/smiley-0.png',
  '/koko/assets/img/calendar/smiley-1.png',
  '/koko/assets/img/calendar/smiley-2.png',
  '/koko/assets/img/calendar/smiley-3.png',
  '/koko/assets/img/calendar/smiley-4.png',
  '/koko/assets/icons/icon-192.png',
  '/koko/assets/icons/icon-512.png',
  '/koko/manifest.json',
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(URLS_TO_CACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;

      return fetch(e.request).then(function (response) {
        if (response.ok || response.type === 'opaque') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function () {
        // Fallback navigation hors ligne → page d'accueil
        if (e.request.mode === 'navigate') {
          return caches.match('/koko/');
        }
      });
    })
  );
});
