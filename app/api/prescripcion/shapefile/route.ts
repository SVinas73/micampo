import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { shapefilePrescripcion, type ZonaRx } from "@/lib/shapefile";

export const runtime = "nodejs";

/**
 * POST /api/prescripcion/shapefile
 * Convierte el GeoJSON de una prescripción (zonas + dosis) en un Shapefile ESRI
 * comprimido (.shp/.shx/.dbf/.prj en un ZIP), el formato que aceptan los monitores
 * de siembra/fertilización (John Deere, Trimble, Ag Leader, etc.).
 * Body: { geojson: FeatureCollection, producto?, nombre? }
 */
type Feat = { geometry?: { type?: string; coordinates?: number[][][] }; properties?: { dosis?: number; zona?: string; ndvi?: number; unidad?: string } };

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const feats: Feat[] = body?.geojson?.features;
    if (!Array.isArray(feats) || feats.length === 0) return NextResponse.json({ error: "GeoJSON sin zonas" }, { status: 400 });
    const producto: string = body.producto || "Fertilizante";
    const nombre: string = String(body.nombre || "prescripcion").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "prescripcion";

    const zonas: ZonaRx[] = feats
      .filter((f) => f.geometry?.type === "Polygon" && Array.isArray(f.geometry.coordinates))
      .map((f) => ({
        anillos: f.geometry!.coordinates as number[][][],
        dosis: Number(f.properties?.dosis) || 0,
        zona: String(f.properties?.zona || ""),
        ndvi: Number(f.properties?.ndvi) || 0,
        producto,
        unidad: String(f.properties?.unidad || "kg/ha"),
      }));
    if (zonas.length === 0) return NextResponse.json({ error: "No hay polígonos válidos" }, { status: 400 });

    const zip = shapefilePrescripcion(zonas, nombre);
    return new NextResponse(zip as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${nombre}-shapefile.zip"`,
        "Content-Length": String(zip.length),
      },
    });
  } catch (error) {
    console.error("Error al exportar shapefile:", error);
    return NextResponse.json({ error: "No se pudo generar el shapefile" }, { status: 500 });
  }
}
