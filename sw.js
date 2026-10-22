/* ============================================================
   So Lyon — Service Worker
   Cache des ressources pour un usage hors-ligne + démarrage instantané
   ============================================================ */
const CACHE = "so-lyon-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css?v=28",
  "./js/icons.js?v=28",
  "./js/cloud.js?v=28",
  "./js/data.js?v=28",
  "./js/app.js?v=28",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// installation : pré-cache de l'ossature
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(ASSETS.map((a) => cache.add(new Request(a, { cache: "reload" }))))
    ).then(() => self.skipWaiting())
  );
});

// activation : purge des vieux caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// stratégie :
// - API Supabase / tuiles de carte / photos : réseau d'abord, sinon cache
// - fichiers de l'app : cache d'abord (instantané), mise à jour en arrière-plan
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  const isAppFile = url.origin === location.origin;
  const isMapTile = /tile\.openstreetmap\.org|unpkg\.com|wikimedia|supabase/.test(url.hostname);

  if (isAppFile) {
    // cache-first pour l'app : démarrage instantané
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((cached) => {
        const fetched = fetch(e.request).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || fetched;
      })
    );
  } else if (isMapTile) {
    // network-first pour le contenu vivant
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
