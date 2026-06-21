import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ndviSerieDePoligono, sentinelStatsDisponible, type NdviSerie } from "@/lib/sentinel";
import { getInsight, saveInsight } from "@/lib/insight";

/**
 * POST /api/lotes/ndvi-serie
 * Body: { id, geojson }
 * Devuelve la serie temporal de NDVI del lote (últimos 180 días) + anomalía.
 * Cachea 24 h en Insight. Sin credenciales Sentinel -> { disponible: false }.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (!sentinelStatsDisponible()) {
      return NextResponse.json({ disponible: false });
    }

    const { id, geojson } = (await request.json()) as { id?: string; geojson?: GeoJSON.Polygon | null };
    if (!id || !geojson?.coordinates?.[0]?.length) {
      return NextResponse.json({ error: "id y geojson requeridos" }, { status: 400 });
    }

    const clave = `ndvi-serie:${id}`;
    const cache = await getInsight<NdviSerie>(session.user.id, clave, 24 * 60);
    if (cache) return NextResponse.json({ disponible: true, ...cache });

    const r = await ndviSerieDePoligono(geojson);
    if (!r) return NextResponse.json({ disponible: true, serie: [], anomalia: null });
    await saveInsight(session.user.id, clave, "ndvi-serie", r, "sentinel-2-l2a");
    return NextResponse.json({ disponible: true, ...r });
  } catch (error) {
    console.error("Error en serie NDVI:", error);
    return NextResponse.json({ disponible: false }, { status: 200 });
  }
}
