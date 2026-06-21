import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ndviDePoligono, sentinelStatsDisponible, type NdviLote } from "@/lib/sentinel";
import { getInsight, saveInsight } from "@/lib/insight";

/**
 * POST /api/lotes/ndvi
 * Body: { lotes: [{ id, geojson }] }
 * Devuelve el NDVI real (Sentinel Hub Statistics API) por lote, con caché de 12 h.
 * Si no hay credenciales de Sentinel, responde { disponible: false }.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!sentinelStatsDisponible()) {
      return NextResponse.json({ disponible: false, resultados: {} });
    }

    const userId = session.user.id;
    const { lotes } = (await request.json()) as {
      lotes?: Array<{ id: string; geojson?: GeoJSON.Polygon | null }>;
    };
    const entradas = (lotes ?? []).filter(
      (l) => l?.id && l.geojson?.coordinates?.[0]?.length
    );

    const resultados: Record<string, NdviLote> = {};

    await Promise.all(
      entradas.map(async (l) => {
        const clave = `ndvi:${l.id}`;
        const cache = await getInsight<NdviLote>(userId, clave, 12 * 60);
        if (cache && typeof cache.ndvi === "number") {
          resultados[l.id] = cache;
          return;
        }
        const r = await ndviDePoligono(l.geojson as GeoJSON.Polygon);
        if (r) {
          resultados[l.id] = r;
          await saveInsight(userId, clave, "ndvi", r, "sentinel-2-l2a");
        }
      })
    );

    return NextResponse.json({ disponible: true, resultados });
  } catch (error) {
    console.error("Error al calcular NDVI:", error);
    return NextResponse.json({ disponible: false, resultados: {} }, { status: 200 });
  }
}
