import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeUbicacion } from "@/lib/geocode";

/**
 * GET /api/establecimientos/clima-coords?id=<estId|todos>
 * Fuente ÚNICA de la ubicación del clima (la usan Inicio y módulo Clima por igual,
 * así ambos muestran exactamente el mismo pronóstico). Resuelve, en orden:
 *   1) centro guardado del establecimiento
 *   2) promedio de los centroides de sus lotes
 *   3) geocodificación por su ciudad/provincia/dirección (y lo PERSISTE como centro)
 * Devuelve { lat, lon, nombre, fuente } o { lat: null } si no hay forma de ubicarlo.
 */
function promedioLotes(lotes: { centroLatitud: number | null; centroLongitud: number | null }[]) {
  const conGeo = lotes.filter((l) => l.centroLatitud != null && l.centroLongitud != null);
  if (!conGeo.length) return null;
  const lat = conGeo.reduce((s, l) => s + (l.centroLatitud as number), 0) / conGeo.length;
  const lon = conGeo.reduce((s, l) => s + (l.centroLongitud as number), 0) / conGeo.length;
  return { lat, lon };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const userId = session.user.id;
    const id = new URL(request.url).searchParams.get("id");

    // "Todos" / sin establecimiento: promedio de todos los lotes con geo.
    if (!id || id === "todos") {
      const lotes = await prisma.lote.findMany({ where: { userId }, select: { centroLatitud: true, centroLongitud: true } });
      const p = promedioLotes(lotes);
      return NextResponse.json(p ? { ...p, nombre: "Todos los establecimientos", fuente: "promedio-lotes" } : { lat: null, lon: null, nombre: null, fuente: "sin-ubicacion" });
    }

    const est = await prisma.establecimiento.findFirst({
      where: { id, userId },
      include: { lotes: { select: { centroLatitud: true, centroLongitud: true } } },
    });
    if (!est) return NextResponse.json({ lat: null, lon: null, nombre: null, fuente: "sin-establecimiento" });

    // 1) Centro guardado.
    if (est.centroLatitud != null && est.centroLongitud != null) {
      return NextResponse.json({ lat: est.centroLatitud, lon: est.centroLongitud, nombre: est.nombre, fuente: "centro" });
    }
    // 2) Promedio de sus lotes (y lo PERSISTE como centro para que quede estable).
    const p = promedioLotes(est.lotes);
    if (p) {
      await prisma.establecimiento.update({ where: { id: est.id }, data: { centroLatitud: p.lat, centroLongitud: p.lon } }).catch(() => {});
      return NextResponse.json({ ...p, nombre: est.nombre, fuente: "promedio-lotes" });
    }

    // 3) Geocodificar por NOMBRE de lugar (la API de Open-Meteo busca por nombre, no
    //    por dirección con comas). Probamos ciudad, luego provincia. Persistimos el centro.
    const candidatos = [est.ciudad, est.provincia, est.direccion].map((s) => (s || "").trim()).filter(Boolean);
    let g: { lat: number; lon: number; nombre: string } | null = null;
    for (const c of candidatos) {
      g = await geocodeUbicacion(c, est.pais || "Uruguay");
      if (g) break;
    }
    if (g) {
      await prisma.establecimiento.update({ where: { id: est.id }, data: { centroLatitud: g.lat, centroLongitud: g.lon } }).catch(() => {});
      return NextResponse.json({ lat: g.lat, lon: g.lon, nombre: g.nombre, fuente: "geocode" });
    }

    return NextResponse.json({ lat: null, lon: null, nombre: est.nombre, fuente: "sin-ubicacion" });
  } catch (error) {
    console.error("Error en clima-coords:", error);
    return NextResponse.json({ lat: null, lon: null, nombre: null, fuente: "error" }, { status: 200 });
  }
}
