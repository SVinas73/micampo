/* MiCampo · Service Worker
   Caché de tiles del mapa para zonas con mala señal (campo).

   Estrategia: cache-first SOLO para hosts de tiles cross-origin (inmutables por
   z/x/y). NUNCA intercepta same-origin, _next, navegaciones ni rutas /api, para
   no romper la app ni servir código viejo. Si algo falla, la app sigue normal. */

const TILE_CACHE = "micampo-tiles-v1";
const MAX_TILES = 600;

// Reglas de hosts permitidos (cross-origin). Para S3 exigimos el prefijo de path
// del dataset de elevación, para no cachear cualquier otra cosa de S3.
const REGLAS = [
  { host: "server.arcgisonline.com" },
  { host: "services.sentinel-hub.com" },
  { host: "fonts.openmaptiles.org" },
  { host: "basemaps.cartocdn.com" },
  { host: "s3.amazonaws.com", pathPrefix: "/elevation-tiles-prod" },
  { host: "elevation-tiles-prod.s3.amazonaws.com" },
];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("micampo-tiles-") && k !== TILE_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function esTile(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.origin === self.location.origin) return false; // jamás same-origin
    return REGLAS.some(
      (r) => (u.hostname === r.host || u.hostname.endsWith("." + r.host)) && (!r.pathPrefix || u.pathname.startsWith(r.pathPrefix))
    );
  } catch {
    return false;
  }
}

async function recortar(cache) {
  const keys = await cache.keys();
  const exceso = keys.length - MAX_TILES;
  for (let i = 0; i < exceso; i++) await cache.delete(keys[i]); // FIFO: borra los más viejos
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !esTile(req.url)) return; // dejá pasar todo lo demás

  event.respondWith(
    (async () => {
      const cache = await caches.open(TILE_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached; // cache-first: instantáneo y funciona offline
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          cache.put(req, res.clone());
          recortar(cache);
        }
        return res;
      } catch {
        return cached || Response.error(); // sin red y sin caché: tile en blanco
      }
    })()
  );
});
