// UdiTest — Service Worker per modalità offline
// Versione: aggiornare questo numero ad ogni deploy per forzare il refresh della cache
const CACHE_VERSION = 'uditest-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Asset critici da pre-caricare all'installazione
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// Risorse da NON mettere in cache (sempre online)
const NETWORK_ONLY = [
  '/api/',
  '/manus-storage/',
];

// ─── Install: pre-carica gli asset critici ───────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache parziale:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: pulisce le cache vecchie ──────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch: strategia cache-first per asset, network-first per API ───────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora richieste non-GET
  if (event.request.method !== 'GET') return;

  // Ignora richieste a domini esterni (es. CDN font Google)
  if (url.origin !== self.location.origin) {
    // Per i font Google, usa cache-first
    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
      event.respondWith(cacheFirst(event.request, DYNAMIC_CACHE));
    }
    return;
  }

  // API e storage: sempre network, mai cache
  const isNetworkOnly = NETWORK_ONLY.some(path => url.pathname.startsWith(path));
  if (isNetworkOnly) {
    return; // lascia passare senza intercettare
  }

  // Asset con hash nel nome (JS/CSS/immagini Vite): cache-first immutabile
  const hasHash = /\.[a-f0-9]{8,}\.(js|css|woff2?|png|jpg|svg|webp)$/.test(url.pathname);
  if (hasHash) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // Pagine HTML e risorse senza hash: network-first con fallback cache
  event.respondWith(networkFirstWithFallback(event.request));
});

// ─── Strategie ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Risorsa non disponibile offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline: prova dalla cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback: restituisce la home (SPA fallback)
    const homeCache = await caches.match('/');
    if (homeCache) return homeCache;

    return new Response(
      `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>UdiTest — Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f4f8;color:#1a202c;}
      .box{text-align:center;padding:2rem;background:white;border-radius:1rem;box-shadow:0 4px 24px rgba(0,0,0,0.1);max-width:360px;}
      h1{color:#1E73BE;font-size:1.5rem;margin-bottom:0.5rem;}
      p{color:#718096;font-size:0.95rem;line-height:1.5;}
      button{margin-top:1.5rem;padding:0.75rem 1.5rem;background:#1E73BE;color:white;border:none;border-radius:0.5rem;font-size:1rem;cursor:pointer;}
      </style></head>
      <body><div class="box">
        <h1>📡 Sei offline</h1>
        <p>Il test dell'udito funziona offline.<br>Riconnettiti per salvare i risultati e scaricare il referto PDF.</p>
        <button onclick="window.location.reload()">Riprova</button>
      </div></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
