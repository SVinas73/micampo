/**
 * Geocodificación del lado del servidor (Nominatim) con caché, timeout y un
 * User-Agent que cumple la política de uso.
 *
 * Por qué existe: la política de Nominatim EXIGE un User-Agent identificatorio
 * y limita a ~1 request/segundo. Llamarlo directo desde el navegador (como
 * hacíamos) viola esa política y termina con la IP/app bloqueada. Centralizamos
 * todo acá detrás de nuestra propia API + un caché TTL en memoria para
 * absorber ráfagas y repetir menos llamadas.
 *
 * Para producción de verdad, GEOCODER_BASE_URL puede apuntar a un proveedor
 * pago (Mapbox/Google con su shim) o a un Nominatim self-hosted.
 */

type CacheEntry<T> = { value: T; expira: number };

const TTL_MS = 1000 * 60 * 60 * 24; // 24 h
const MAX_ENTRADAS = 1000;
const cache = new Map<string, CacheEntry<unknown>>();

function leerCache<T>(key: string): T | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expira) {
    cache.delete(key);
    return undefined;
  }
  return e.value as T;
}

function guardarCache<T>(key: string, value: T): void {
  cache.set(key, { value, expira: Date.now() + TTL_MS });
  if (cache.size > MAX_ENTRADAS) {
    const primera = cache.keys().next().value;
    if (primera !== undefined) cache.delete(primera);
  }
}

const CONTACTO = process.env.GEOCODER_CONTACT || "https://micampo.app";
const USER_AGENT = `MiCampo/1.0 (${CONTACTO})`;
const BASE = process.env.GEOCODER_BASE_URL || "https://nominatim.openstreetmap.org";
const TIMEOUT_MS = 6000;

async function nominatim<T>(path: string): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${BASE}${path}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", "Accept-Language": "es" },
      signal: ctrl.signal,
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    // timeout / red caída / JSON inválido → degradación elegante
    return null;
  } finally {
    clearTimeout(t);
  }
}

export type LugarBusqueda = { display_name: string; lat: string; lon: string; address?: Record<string, string> };
export type LugarInverso = { display_name: string; address?: Record<string, string> };

/** Búsqueda directa de lugares (estilo Google Maps). Devuelve [] si no hay red. */
export async function buscarLugares(q: string): Promise<LugarBusqueda[]> {
  const query = q.trim();
  if (query.length < 3) return [];
  const key = `s:${query.toLowerCase()}`;
  const hit = leerCache<LugarBusqueda[]>(key);
  if (hit) return hit;

  const d = await nominatim<LugarBusqueda[]>(
    `/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`
  );
  const res = Array.isArray(d)
    ? d.slice(0, 5).map((r) => ({ display_name: r.display_name, lat: r.lat, lon: r.lon, address: r.address }))
    : [];
  guardarCache(key, res);
  return res;
}

/** Geocodificación inversa (coordenadas → lugar). Devuelve null si no hay red. */
export async function geocodificarInverso(lat: number, lon: number): Promise<LugarInverso | null> {
  if (!isFinite(lat) || !isFinite(lon)) return null;
  const key = `r:${lat.toFixed(4)},${lon.toFixed(4)}`;
  const hit = leerCache<LugarInverso>(key);
  if (hit) return hit;

  const d = await nominatim<LugarInverso>(`/reverse?format=jsonv2&zoom=14&lat=${lat}&lon=${lon}`);
  if (!d) return null;
  const res: LugarInverso = { display_name: d.display_name, address: d.address };
  guardarCache(key, res);
  return res;
}
