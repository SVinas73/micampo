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
 *
 * Degrada con elegancia: sin credenciales o ante cualquier error, devuelve null
 * y el sistema sigue funcionando (NDVI queda en 0 / "sin medición").
 */

const OAUTH_URL = "https://services.sentinel-hub.com/oauth/token";
const STATS_URL = "https://services.sentinel-hub.com/api/v1/statistics";

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

let tokenCache: { token: string; exp: number } | null = null;

async function getToken(): Promise<string | null> {
  if (!sentinelStatsDisponible()) return null;
  // Reutiliza el token mientras no esté por expirar (margen de 60 s).
  if (tokenCache && tokenCache.exp - 60_000 > Date.now()) return tokenCache.token;
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SENTINEL_CLIENT_ID as string,
      client_secret: process.env.SENTINEL_CLIENT_SECRET as string,
    });
    const res = await fetch(OAUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    tokenCache = { token: json.access_token, exp: Date.now() + (json.expires_in ?? 3600) * 1000 };
    return tokenCache.token;
  } catch {
    return null;
  }
}

export type NdviLote = { ndvi: number; fecha: string | null };
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
  const token = await getToken();
  if (!token) return null;

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
    const res = await fetch(STATS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
  const token = await getToken();
  if (!token) return null;

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
    const res = await fetch(STATS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
