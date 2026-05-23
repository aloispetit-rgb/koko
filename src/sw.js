var CACHE = 'koko-v1';

var PRECACHE = [
  '/',
  '/parent/',
  '/assets/css/style.css',
  '/assets/css/child.css',
  '/assets/css/parent.css',
  '/assets/js/timeUtils.js',
  '/assets/js/storage.js',
  '/assets/js/recurrence.js',
  '/assets/js/periods.js',
  '/assets/js/smiley.js',
  '/assets/js/calendar.js',
  '/assets/js/app.js',
  '/assets/js/parent.js',
  '/assets/img/periods/ecole.png',
  '/assets/img/periods/dormir.png',
  '/assets/img/calendar/smiley-0.png',
  '/assets/img/calendar/smiley-1.png',
  '/assets/img/calendar/smiley-2.png',
  '/assets/img/calendar/smiley-3.png',
  '/assets/img/calendar/smiley-4.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var networkFetch = fetch(e.request).then(function (response) {
        if (response.ok || response.type === 'opaque') {
          var clone = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function () { return cached; });

      return cached || networkFetch;
    })
  );
});
