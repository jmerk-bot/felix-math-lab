// Service worker: makes the app installable and lets it work offline.
//
// Strategy is network-first: when online, every file comes fresh from the
// server (so a new deploy shows up on the next launch), and a copy is saved.
// When offline, or if the network takes longer than NETWORK_TIMEOUT_MS, the
// saved copy is used instead.
//
// The deploy workflow replaces __APP_VERSION__ below, so each deploy installs
// a fresh cache and clears out the old one.

const CACHE = 'math-lab-__APP_VERSION__';
const NETWORK_TIMEOUT_MS = 3000;

// Everything the app needs to start offline. Add new files here.
// (Spelling audio is listed in js/words.js; the page sends that list over
// once the worker is running. See the 'precache' message below.)
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/main.js',
  './js/state.js',
  './js/audio.js',
  './js/lab.js',
  './js/quest.js',
  './js/pwa.js',
  './js/version.js',
  './js/spell.js',
  './js/words.js',
  './js/levels.js',
  './fonts/atkinson-hyperlegible-next-latin.woff2',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('math-lab-') && key !== CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json')) return; // always straight from the network

  event.respondWith(networkFirst(request));
});

// The page sends the spelling audio list (from js/words.js) so every word and
// phrase is saved for offline use, not just the ones already heard.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'precache' && Array.isArray(event.data.urls)) {
    event.waitUntil(precache(event.data.urls));
  }
});

async function precache(urls) {
  const cache = await caches.open(CACHE);
  for (const url of urls) {
    if (new URL(url).origin !== self.location.origin || await cache.match(url)) continue;
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (response.status === 200) await cache.put(url, response);
    } catch (e) {} // offline: try again next launch
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);

  // 'no-cache' revalidates with the server instead of trusting the browser's HTTP cache
  const freshRequest = request.mode === 'navigate'
    ? new Request(request.url, { cache: 'no-cache', credentials: 'same-origin' })
    : new Request(request, { cache: 'no-cache' });

  const network = fetch(freshRequest).then((response) => {
    // Only whole responses: a 206 (partial) can't be cached
    if (response.status === 200) cache.put(request, response.clone());
    return response;
  });
  network.catch(() => {}); // handled below; avoids an unhandled-rejection warning

  try {
    return await withTimeout(network, NETWORK_TIMEOUT_MS);
  } catch (e) {
    const cached = await cache.match(request, { ignoreSearch: true })
      || (request.mode === 'navigate' ? await cache.match('./index.html') : undefined);
    // Nothing saved yet: keep waiting on the network
    return cached || network;
  }
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}
