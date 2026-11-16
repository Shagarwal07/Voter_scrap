self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A minimum fetch handler is required by Chrome for PWA installability.
  // Here we do nothing, letting the browser handle requests normally.
});
