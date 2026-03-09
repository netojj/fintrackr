const CACHE_NAME = 'fintrackr-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/firebase-config.js',
  '/fintrackr_logo_1772046881316.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Força o novo SW a assumir o controle imediatamente
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME && k !== 'fintrackr-fonts') return caches.delete(k); })
    )).then(() => self.clients.claim()) // Assume controle das abas abertas imediatamente
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Google Fonts caching strategy: Cache-First
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open('fintrackr-fonts').then(cache => {
        return cache.match(e.request).then(res => {
          return res || fetch(e.request).then(net => {
            cache.put(e.request, net.clone());
            return net;
          });
        });
      })
    );
    return;
  }

  // Firebase/External: Network-Only
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com') || url.hostname.includes('firebase')) {
    return;
  }

  // Especial para index.html: Network-First
  // Isso garante que se houver internet, ele sempre pega a versão atualizada
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Outros Assets Locais: Stale-While-Revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => null);
      return cached || net;
    })
  );
});
