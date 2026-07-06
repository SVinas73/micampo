/**
 * Integración con Sentinel Hub Statistics API para NDVI real por lote.
 *
 * A diferencia del WMS (que solo pinta una imagen), la Statistics API calcula
 * el NDVI medio real sobre el polígono de cada lote a partir de Sentinel-2.
 *
 * Requiere credenciales OAuth de Sentinel Hub (distintas del instance ID del WMS):
 *   - SENTINEL_CLIENT_ID
 *   - SENTINEL_CLIENT_SECRET
 * Son del lado servidor (NO NEXT_PUBLIC): nunca se exponen al navegador.
 * Sirven tanto las de una cuenta clásica (services.sentinel-hub.com) como las del
 * plan gratuito de Copernicus Data Space (CDSE): el endpoint se detecta solo.
 *
 * Degrada con elegancia: sin credenciales o ante cualquier error, devuelve null
 * y el sistema sigue funcionando (NDVI queda en 0 / "sin medición").
 */

// Endpoints soportados: cuenta CLÁSICA de Sentinel Hub y plan gratuito de
// COPERNICUS DATA SPACE (CDSE). Se detecta solo contra cuál valen las
// credenciales (el primer OAuth que responda queda cacheado); se puede forzar
// con SENTINEL_HOST=classic | cdse.
const ENDPOINTS = [
  {
    id: "classic",
    oauth: "https://services.sentinel-hub.com/oauth/token",
    stats: "https://services.sentinel-hub.com/api/v1/statistics",
    process: "https://services.sentinel-hub.com/api/v1/process",
  },
  {
    id: "cdse",
    oauth: "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
    stats: "https://sh.dataspace.copernicus.eu/api/v1/statistics",
    process: "https://sh.dataspace.copernicus.eu/api/v1/process",
  },
] as const;
type Endpoint = (typeof ENDPOINTS)[number];

const EVALSCRIPT_NDVI = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1 },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  return { ndvi: [ndvi], dataMask: [s.dataMask] };
}`;

export function sentinelStatsDisponible(): boolean {
  return Boolean(process.env.SENTINEL_CLIENT_ID && process.env.SENTINEL_CLIENT_SECRET);
}

let endpointCache: Endpoint | null = null;
let tokenCache: { token: string; exp: number } | null = null;

function endpointsCandidatos(): readonly Endpoint[] {
  const forzado = (process.env.SENTINEL_HOST || "").toLowerCase();
  if (forzado) {
    const e = ENDPOINTS.find((x) => x.id === forzado || x.oauth.includes(forzado) || x.stats.includes(forzado));
    if (e) return [e];
  }
  return endpointCache ? [endpointCache] : ENDPOINTS;
}

/** Token OAuth + URLs (Statistics/Process) del endpoint contra el que valen las credenciales. */
async function getAuth(): Promise<{ token: string; stats: string; process: string } | null> {
  if (!sentinelStatsDisponible()) return null;
  // Reutiliza el token mientras no esté por expirar (margen de 60 s).
  if (tokenCache && endpointCache && tokenCache.exp - 60_000 > Date.now()) {
    return { token: tokenCache.token, stats: endpointCache.stats, process: endpointCache.process };
  }
  for (const ep of endpointsCandidatos()) {
    try {
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SENTINEL_CLIENT_ID as string,
        client_secret: process.env.SENTINEL_CLIENT_SECRET as string,
      });
      const res = await fetch(ep.oauth, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { access_token?: string; expires_in?: number };
      if (!json.access_token) continue;
      endpointCache = ep;
      tokenCache = { token: json.access_token, exp: Date.now() + (json.expires_in ?? 3600) * 1000 };
      return { token: tokenCache.token, stats: ep.stats, process: ep.process };
    } catch {
      /* probamos el siguiente endpoint */
    }
  }
  return null;
}

// Colormap NDVI (rojo → naranja → amarillo → verde claro → verde oscuro) para el
// raster: mismo aspecto que los mapas de vigor de dron/satélite. Salida RGBA:
// transparente donde no hay dato (dataMask 0).
const EVALSCRIPT_NDVI_TILE = `//VERSION=3
function setup() {
  return { input: [{ bands: ["B04", "B08", "dataMask"] }], output: { bands: 4 } };
}
var R = [
  [0.05, [0.60, 0.00, 0.13]], [0.20, [0.84, 0.19, 0.15]], [0.32, [0.96, 0.43, 0.26]],
  [0.42, [0.99, 0.68, 0.38]], [0.50, [1.00, 0.88, 0.55]], [0.58, [0.90, 0.96, 0.60]],
  [0.66, [0.65, 0.85, 0.42]], [0.74, [0.40, 0.74, 0.39]], [0.82, [0.16, 0.63, 0.30]],
  [0.90, [0.00, 0.41, 0.22]]
];
function col(v) {
  if (v <= R[0][0]) return R[0][1];
  for (var i = 1; i < R.length; i++) {
    if (v <= R[i][0]) {
      var t = (v - R[i - 1][0]) / (R[i][0] - R[i - 1][0]);
      var a = R[i - 1][1], b = R[i][1];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
  }
  return R[R.length - 1][1];
}
function evaluatePixel(s) {
  if (s.dataMask === 0) return [0, 0, 0, 0];
  var d = s.B08 + s.B04;
  var ndvi = d === 0 ? 0 : (s.B08 - s.B04) / d;
  var c = col(ndvi);
  return [c[0], c[1], c[2], 1];
}`;

/**
 * Renderiza UN tile (256×256) de NDVI Sentinel-2 real vía la Process API, para el
 * bbox dado en EPSG:3857. Usa el mosaico menos nuboso de los últimos 90 días.
 * No depende de las capas configuradas en la instancia WMS (solo del OAuth).
 * Devuelve el PNG, o null si no hay credenciales / falla / no hay datos.
 */
export async function ndviTilePng(bbox3857: [number, number, number, number]): Promise<Buffer | null> {
  const auth = await getAuth();
  if (!auth) return null;
  const hoy = new Date();
  const desde = new Date(hoy.getTime() - 90 * 86400000);
  const payload = {
    input: {
      bounds: {
        bbox: bbox3857,
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/3857" },
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: { from: `${desde.toISOString().slice(0, 10)}T00:00:00Z`, to: `${hoy.toISOString().slice(0, 10)}T23:59:59Z` },
            maxCloudCoverage: 40,
            mosaickingOrder: "leastCC",
          },
        },
      ],
    },
    output: { width: 256, height: 256, responses: [{ identifier: "default", format: { type: "image/png" } }] },
    evalscript: EVALSCRIPT_NDVI_TILE,
  };
  try {
    const res = await fetch(auth.process, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "image/png", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export type NdviLote = { ndvi: number; fecha: string | null; stale?: boolean };
export type NdviPunto = { fecha: string; ndvi: number };
export type NdviSerie = {
  serie: NdviPunto[];
  actual: number | null;
  media: number | null; // media de los puntos previos al último
  variacionPct: number | null; // variación del último vs la media previa
  anomalia: "normal" | "caida" | "suba" | null;
};

/**
 * Calcula el NDVI medio real de un polígono (GeoJSON, coords lng/lat EPSG:4326)
 * tomando la observación con menos nubes más reciente de los últimos 90 días.
 */
export async function ndviDePoligono(
  geometry: GeoJSON.Polygon
): Promise<NdviLote | null> {
  const auth = await getAuth();
  if (!auth) return null;

  const hoy = new Date();
  const desde = new Date(hoy.getTime() - 90 * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const payload = {
    input: {
      bounds: {
        geometry,
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [{ type: "sentinel-2-l2a", dataFilter: { maxCloudCoverage: 30 } }],
    },
    aggregation: {
      timeRange: { from: `${iso(desde)}T00:00:00Z`, to: `${iso(hoy)}T23:59:59Z` },
      aggregationInterval: { of: "P15D" },
      evalscript: EVALSCRIPT_NDVI,
      resx: 10,
      resy: 10,
    },
  };

  try {
    const res = await fetch(auth.stats, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: Array<{
        interval?: { from?: string };
        outputs?: { ndvi?: { bands?: { B0?: { stats?: { mean?: number; sampleCount?: number; noDataCount?: number } } } } };
      }>;
    };
    const intervals = json.data ?? [];
    // Recorre de más reciente a más antiguo y toma el primer intervalo con datos válidos.
    for (let i = intervals.length - 1; i >= 0; i--) {
      const stats = intervals[i]?.outputs?.ndvi?.bands?.B0?.stats;
      const valido =
        stats &&
        typeof stats.mean === "number" &&
        !Number.isNaN(stats.mean) &&
        (stats.sampleCount ?? 0) - (stats.noDataCount ?? 0) > 0;
      if (valido) {
        const ndvi = Math.max(0, Math.min(1, Number((stats!.mean as number).toFixed(3))));
        return { ndvi, fecha: intervals[i]?.interval?.from?.slice(0, 10) ?? null };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Serie temporal de NDVI (un punto cada ~15 días, últimos 180 días) + detección
 * de anomalía: compara el último valor contra la media de los anteriores.
 */
export async function ndviSerieDePoligono(geometry: GeoJSON.Polygon): Promise<NdviSerie | null> {
  const auth = await getAuth();
  if (!auth) return null;

  const hoy = new Date();
  const desde = new Date(hoy.getTime() - 180 * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const payload = {
    input: {
      bounds: { geometry, properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" } },
      data: [{ type: "sentinel-2-l2a", dataFilter: { maxCloudCoverage: 35 } }],
    },
    aggregation: {
      timeRange: { from: `${iso(desde)}T00:00:00Z`, to: `${iso(hoy)}T23:59:59Z` },
      aggregationInterval: { of: "P15D" },
      evalscript: EVALSCRIPT_NDVI,
      resx: 10,
      resy: 10,
    },
  };

  try {
    const res = await fetch(auth.stats, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: Array<{
        interval?: { from?: string };
        outputs?: { ndvi?: { bands?: { B0?: { stats?: { mean?: number; sampleCount?: number; noDataCount?: number } } } } };
      }>;
    };
    const serie: NdviPunto[] = [];
    for (const it of json.data ?? []) {
      const stats = it?.outputs?.ndvi?.bands?.B0?.stats;
      const valido =
        stats && typeof stats.mean === "number" && !Number.isNaN(stats.mean) &&
        (stats.sampleCount ?? 0) - (stats.noDataCount ?? 0) > 0;
      if (valido && it.interval?.from) {
        serie.push({ fecha: it.interval.from.slice(0, 10), ndvi: Math.max(0, Math.min(1, Number((stats!.mean as number).toFixed(3)))) });
      }
    }
    if (serie.length === 0) return { serie: [], actual: null, media: null, variacionPct: null, anomalia: null };

    const actual = serie[serie.length - 1].ndvi;
    const previos = serie.slice(0, -1);
    const media = previos.length ? Number((previos.reduce((s, p) => s + p.ndvi, 0) / previos.length).toFixed(3)) : null;
    let variacionPct: number | null = null;
    let anomalia: NdviSerie["anomalia"] = "normal";
    if (media && media > 0) {
      variacionPct = Math.round(((actual - media) / media) * 100);
      if (variacionPct <= -10) anomalia = "caida";
      else if (variacionPct >= 10) anomalia = "suba";
      else anomalia = "normal";
    }
    return { serie, actual, media, variacionPct, anomalia };
  } catch {
    return null;
  }
}
