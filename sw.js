const CACHE_NAME = 'wyrd-cache-v5.4';
const urlsToCache = [
  '/',
  '/index.html',
  '/style/wyrd.css',
  '/core/Constants.js',
  '/core/UIanager.js',
  '/core/MapManager.js',
  '/core/EntityManager.js',
  '/core/GameManager.js',
  '/core/Renderer.js',
  '/core/CombatManager.js',
  '/core/main.js',
  '/assets/wander/player.png',
  '/assets/wander/rat.png',
  '/assets/wander/goblin.png',
  '/assets/wander/skeleton.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});