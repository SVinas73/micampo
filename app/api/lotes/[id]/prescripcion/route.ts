import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as turf from "@turf/turf";
import { ndviDePoligono, sentinelStatsDisponible } from "@/lib/sentinel";
import { getInsight } from "@/lib/insight";

export const maxDuration = 60;

/**
 * POST /api/lotes/[id]/prescripcion
 * Genera un MAPA DE PRESCRIPCIÓN VARIABLE (VRT): divide el lote en una grilla,
 * mide el NDVI por zona (Sentinel Hub) y asigna una dosis variable por zona.
 * Devuelve un GeoJSON listo para descargar/llevar a la maquinaria.
 * Body: { producto, dosisBase (kg/ha o L/ha), estrategia: "compensar"|"potenciar" }
 */
type Celda = { geom: GeoJSON.Feature<GeoJSON.Polygon>; areaHa: number; ndvi: number };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const lote = await prisma.lote.findUnique({ where: { id } });
    if (!lote || lote.userId !== session.user.id) return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    if (!lote.coordenadas) return NextResponse.json({ error: "El lote no tiene geometría dibujada" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const producto: string = body.producto || "Fertilizante";
    const dosisBase: number = Number(body.dosisBase) || 100;
    const estrategia: "compensar" | "potenciar" = body.estrategia === "potenciar" ? "potenciar" : "compensar";

    let geojson: GeoJSON.Polygon;
    try { geojson = JSON.parse(lote.coordenadas); } catch { return NextResponse.json({ error: "Geometría inválida" }, { status: 400 }); }
    if (geojson.type !== "Polygon") return NextResponse.json({ error: "Geometría no soportada" }, { status: 400 });

    const poly = turf.polygon(geojson.coordinates);
    const areaTotalHa = turf.area(poly) / 10000;
    const bbox = turf.bbox(poly);
    // Grilla más fina (las celdas de una misma zona luego se DISUELVEN en polígonos
    // orgánicos, como un mapa de prescripción agronómico real).
    const n = areaTotalHa > 60 ? 6 : 5;
    const anchoKm = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], { units: "kilometers" });
    const cellKm = Math.max(0.04, anchoKm / n);

    // Grilla recortada al polígono del lote
    const grid = turf.squareGrid(bbox, cellKm, { units: "kilometers" });
    const recortes: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
    grid.features.forEach((cell) => {
      try {
        const clip = turf.intersect(turf.featureCollection([cell as any, poly as any]));
        if (clip && clip.geometry.type === "Polygon" && turf.area(clip) > 600) recortes.push(clip as GeoJSON.Feature<GeoJSON.Polygon>);
      } catch { /* ignora */ }
    });
    const celdasGeom = recortes.slice(0, 30); // límite de consultas satelitales

    // NDVI por celda
    const sentinel = sentinelStatsDisponible();
    const baseNdvi = (await getInsight<{ ndvi: number }>(session.user.id, `ndvi:${id}`, 7 * 24 * 60))?.ndvi || 0.6;
    let celdas: Celda[];
    if (sentinel) {
      const ndvis = await Promise.all(celdasGeom.map((c) => ndviDePoligono(c.geometry).catch(() => null)));
      celdas = celdasGeom.map((geom, i) => ({ geom, areaHa: turf.area(geom) / 10000, ndvi: ndvis[i]?.ndvi ?? baseNdvi }));
    } else {
      // Sin credenciales: gradiente sintético alrededor del NDVI base (para demo)
      celdas = celdasGeom.map((geom, i) => {
        const c = turf.centroid(geom).geometry.coordinates;
        const grad = ((c[0] - bbox[0]) / (bbox[2] - bbox[0] || 1) - 0.5) * 0.18 + ((i % 2) - 0.5) * 0.05;
        return { geom, areaHa: turf.area(geom) / 10000, ndvi: Math.max(0.2, Math.min(0.92, baseNdvi + grad)) };
      });
    }
    if (celdas.length === 0) return NextResponse.json({ error: "No se pudo zonificar el lote" }, { status: 422 });

    // Zonificación por terciles de NDVI
    const orden = [...celdas].sort((a, b) => a.ndvi - b.ndvi);
    const t1 = orden[Math.floor(orden.length / 3)]?.ndvi ?? 0;
    const t2 = orden[Math.floor((2 * orden.length) / 3)]?.ndvi ?? 0;
    const zonaDe = (ndvi: number): "Bajo" | "Medio" | "Alto" => (ndvi <= t1 ? "Bajo" : ndvi <= t2 ? "Medio" : "Alto");
    // Factor de dosis por estrategia
    const FACTOR = estrategia === "compensar"
      ? { Bajo: 1.2, Medio: 1.0, Alto: 0.82 }   // más insumo donde el vigor es bajo
      : { Bajo: 0.82, Medio: 1.0, Alto: 1.2 };  // más insumo donde hay potencial
    // Rampa clásica de prescripción: el color sigue a la DOSIS (roja la más baja,
    // verde oscuro la más alta), independiente de la estrategia elegida.
    const RAMPA_DOSIS = ["#d92b2b", "#f5d327", "#2e7d32"];
    const ordenDosis = (["Bajo", "Medio", "Alto"] as const)
      .map((z) => ({ z, d: Math.round(dosisBase * FACTOR[z]) }))
      .sort((a, b) => a.d - b.d);
    const COLOR = { Bajo: "", Medio: "", Alto: "" } as Record<"Bajo" | "Medio" | "Alto", string>;
    ordenDosis.forEach((o, i) => { COLOR[o.z] = RAMPA_DOSIS[Math.min(i, RAMPA_DOSIS.length - 1)]; });

    let prodTotal = 0;
    celdas.forEach((c) => { prodTotal += Math.round(dosisBase * FACTOR[zonaDe(c.ndvi)]) * c.areaHa; });

    // DISUELVE las celdas contiguas de una misma zona en polígonos orgánicos
    // (como un mapa de prescripción real, no una grilla cuadrada).
    const features: GeoJSON.Feature[] = [];
    (["Bajo", "Medio", "Alto"] as const).forEach((z) => {
      const cs = celdas.filter((c) => zonaDe(c.ndvi) === z);
      if (cs.length === 0) return;
      const dosis = Math.round(dosisBase * FACTOR[z]);
      const ndviProm = Math.round((cs.reduce((s, c) => s + c.ndvi, 0) / cs.length) * 100) / 100;
      let union: GeoJSON.Feature | null = null;
      try {
        union = cs.length === 1 ? cs[0].geom : (turf.union(turf.featureCollection(cs.map((c) => c.geom as any))) as GeoJSON.Feature | null);
      } catch { union = null; }
      const geoms: GeoJSON.Polygon[] = [];
      if (union?.geometry?.type === "Polygon") geoms.push(union.geometry as GeoJSON.Polygon);
      else if (union?.geometry?.type === "MultiPolygon") (union.geometry as GeoJSON.MultiPolygon).coordinates.forEach((coords) => geoms.push({ type: "Polygon", coordinates: coords }));
      else cs.forEach((c) => geoms.push(c.geom.geometry));
      geoms.forEach((g) => {
        features.push({
          type: "Feature",
          geometry: g,
          properties: { ndvi: ndviProm, zona: z, dosis, unidad: "kg/ha", color: COLOR[z] },
        });
      });
    });

    const prodUniforme = dosisBase * areaTotalHa;
    const ahorroPct = prodUniforme > 0 ? Math.round(((prodUniforme - prodTotal) / prodUniforme) * 100) : 0;
    const zonas = (["Bajo", "Medio", "Alto"] as const).map((z) => {
      const cs = celdas.filter((c) => zonaDe(c.ndvi) === z);
      const ha = cs.reduce((s, c) => s + c.areaHa, 0);
      return { zona: z, dosis: Math.round(dosisBase * FACTOR[z]), ha: Math.round(ha * 10) / 10, color: COLOR[z] };
    }).filter((z) => z.ha > 0);

    return NextResponse.json({
      producto, dosisBase, estrategia, fuente: sentinel ? "Sentinel-2" : "estimado",
      // Sin NDVI satelital real (Sentinel), la zonificación es una estimación demostrativa.
      simulado: !sentinel,
      areaHa: Math.round(areaTotalHa * 10) / 10,
      resumen: { celdas: celdas.length, prodTotal: Math.round(prodTotal), prodUniforme: Math.round(prodUniforme), ahorroPct, zonas },
      geojson: { type: "FeatureCollection", features },
    });
  } catch (error) {
    console.error("Error en prescripción variable:", error);
    return NextResponse.json({ error: "Error al generar la prescripción" }, { status: 500 });
  }
}
