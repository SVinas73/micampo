import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInsight, saveInsight } from "@/lib/insight";

/**
 * POST /api/lotes/humedad
 * Body: { lotes: [{ id, geojson }] }
 * Devuelve la humedad de suelo real (Open-Meteo, m³/m³) por lote — promedio de
 * las capas 0–1, 1–3 y 3–9 cm a la hora actual. Caché de 6 h (tabla Insight),
 * con fallback a la última medición conocida si Open-Meteo no responde.
 */
type HumedadLote = { humedad: number; fecha: string | null; stale?: boolean };

function centroide(geojson: GeoJSON.Polygon): { lat: number; lng: number } {
  const ring = geojson.coordinates[0];
  const n = ring.length || 1;
  return {
    lng: ring.reduce((s, p) => s + p[0], 0) / n,
    lat: ring.reduce((s, p) => s + p[1], 0) / n,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userId = session.user.id;
    const { lotes } = (await request.json()) as {
      lotes?: Array<{ id: string; geojson?: GeoJSON.Polygon | null }>;
    };
    const entradas = (lotes ?? []).filter((l) => l?.id && l.geojson?.coordinates?.[0]?.length);

    const resultados: Record<string, HumedadLote> = {};
    const pendientes: { id: string; lat: number; lng: number }[] = [];

    // 1) Caché fresca (6 h)
    for (const l of entradas) {
      const cache = await getInsight<HumedadLote>(userId, `humedad:${l.id}`, 6 * 60);
      if (cache && typeof cache.humedad === "number") {
        resultados[l.id] = cache;
      } else {
        const c = centroide(l.geojson as GeoJSON.Polygon);
        pendientes.push({ id: l.id, lat: c.lat, lng: c.lng });
      }
    }

    // 2) Una sola llamada batch a Open-Meteo para los lotes sin caché
    if (pendientes.length > 0) {
      const lats = pendientes.map((p) => p.lat.toFixed(4)).join(",");
      const lngs = pendientes.map((p) => p.lng.toFixed(4)).join(",");
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}` +
        `&hourly=soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm` +
        `&forecast_days=1&timezone=auto`;
      try {
        const r = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
        if (r.ok) {
          const d = await r.json();
          const arr = Array.isArray(d) ? d : [d];
          const now = Date.now();
          pendientes.forEach((p, i) => {
            const h = arr[i]?.hourly;
            if (!h?.time?.length) return;
            // hora más cercana al momento actual
            let idx = 0, best = Infinity;
            h.time.forEach((t: string, j: number) => {
              const diff = Math.abs(new Date(t).getTime() - now);
              if (diff < best) { best = diff; idx = j; }
            });
            const vals = [
              h.soil_moisture_0_to_1cm?.[idx],
              h.soil_moisture_1_to_3cm?.[idx],
              h.soil_moisture_3_to_9cm?.[idx],
            ].filter((v) => typeof v === "number") as number[];
            if (!vals.length) return;
            const humedad = Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 1000) / 1000;
            const res: HumedadLote = { humedad, fecha: h.time[idx] ?? null };
            resultados[p.id] = res;
            saveInsight(userId, `humedad:${p.id}`, "humedad", res, "open-meteo");
          });
        }
      } catch {
        /* sin red: caemos al fallback de abajo */
      }

      // Fallback: última medición conocida (aunque sea vieja) para los que falten
      for (const p of pendientes) {
        if (!resultados[p.id]) {
          const ult = await getInsight<HumedadLote>(userId, `humedad:${p.id}`, 60 * 24 * 365);
          if (ult && typeof ult.humedad === "number") resultados[p.id] = { ...ult, stale: true };
        }
      }
    }

    return NextResponse.json({ disponible: true, resultados });
  } catch (error) {
    console.error("Error al calcular humedad:", error);
    return NextResponse.json({ disponible: false, resultados: {} }, { status: 200 });
  }
}
