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
    const anchoKm = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], { units: "kilometers" });
    const altoKm = turf.distance([bbox[0], bbox[1]], [bbox[0], bbox[3]], { units: "kilometers" });

    // NDVI base (caché) para respaldo/demo.
    const baseNdvi = (await getInsight<{ ndvi: number }>(session.user.id, `ndvi:${id}`, 7 * 24 * 60))?.ndvi || 0.6;

    // 1) MUESTREO. Pocas celdas grandes (~12) → consultas satelitales fiables (más
    //    píxeles por celda, menos rate limit). Cada centroide dentro del lote es un
    //    punto de control con su NDVI real.
    const cellKm = Math.max(0.05, Math.sqrt((anchoKm * altoKm) / 12));
    const grid = turf.squareGrid(bbox, cellKm, { units: "kilometers" });
    const puntos: GeoJSON.Feature<GeoJSON.Point>[] = [];
    grid.features.forEach((cell) => {
      const cen = turf.centroid(cell);
      if (turf.booleanPointInPolygon(cen, poly)) puntos.push(cen);
    });
    if (puntos.length === 0) puntos.push(turf.centroid(poly));
    const muestra = puntos.slice(0, 16);

    // Valor NDVI de demostración: gradiente diagonal suave alrededor del NDVI base.
    const valorDemo = (p: number[], i: number): number => {
      const grad = ((p[0] - bbox[0]) / (bbox[2] - bbox[0] || 1) - 0.5) * 0.22 + ((p[1] - bbox[1]) / (bbox[3] - bbox[1] || 1) - 0.5) * 0.12;
      const onda = Math.sin(p[0] * 850 + p[1] * 500 + i) * 0.05;
      return Math.max(0.2, Math.min(0.92, baseNdvi + grad + onda));
    };

    let sentinel = sentinelStatsDisponible();
    const bufKm = Math.max(0.03, cellKm / 2);
    let controles: { lng: number; lat: number; ndvi: number }[];
    if (sentinel) {
      // Muestreo satelital con TIMEOUT global: si Sentinel tarda o falla, caemos al
      // gradiente demo para que el mapa igual salga (marcado como estimación).
      const consultas = muestra.map((pt) => {
        const circ = turf.buffer(pt, bufKm, { units: "kilometers" });
        return (circ ? ndviDePoligono(circ.geometry as GeoJSON.Polygon) : Promise.resolve(null)).catch(() => null);
      });
      const res = await Promise.race([
        Promise.all(consultas),
        new Promise<null>((r) => setTimeout(() => r(null), 22_000)),
      ]);
      const validos = (res || []).filter((n): n is NonNullable<typeof n> => n?.ndvi != null).map((n) => n.ndvi);
      if (res && validos.length > 0) {
        const media = validos.reduce((s, v) => s + v, 0) / validos.length;
        controles = muestra.map((pt, i) => ({ lng: pt.geometry.coordinates[0], lat: pt.geometry.coordinates[1], ndvi: res[i]?.ndvi ?? media }));
      } else {
        sentinel = false;
        controles = muestra.map((pt, i) => ({ lng: pt.geometry.coordinates[0], lat: pt.geometry.coordinates[1], ndvi: valorDemo(pt.geometry.coordinates, i) }));
      }
    } else {
      controles = muestra.map((pt, i) => ({ lng: pt.geometry.coordinates[0], lat: pt.geometry.coordinates[1], ndvi: valorDemo(pt.geometry.coordinates, i) }));
    }

    // 2) SUPERFICIE CONTINUA. Grilla fina sobre TODO el bbox del lote, con NDVI
    //    interpolado por IDW (peso 2) de los puntos de control.
    const fineKm = Math.max(0.012, Math.min(anchoKm, altoKm) / 45);
    const fineGrid = turf.pointGrid(bbox, fineKm, { units: "kilometers" }) as GeoJSON.FeatureCollection<GeoJSON.Point>;
    const idw = (lng: number, lat: number): number => {
      let num = 0, den = 0;
      for (const c of controles) {
        const d = (c.lng - lng) ** 2 + (c.lat - lat) ** 2;
        if (d < 1e-12) return c.ndvi;
        const w = 1 / (d * d);
        num += w * c.ndvi; den += w;
      }
      return den ? num / den : baseNdvi;
    };
    fineGrid.features.forEach((f) => { f.properties = { ndvi: idw(f.geometry.coordinates[0], f.geometry.coordinates[1]) }; });
    if (fineGrid.features.length === 0) return NextResponse.json({ error: "No se pudo zonificar el lote" }, { status: 422 });

    // 3) ZONAS DE MANEJO (5) por QUINTILES del NDVI interpolado.
    const ZONAS = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"] as const;
    type Zona = (typeof ZONAS)[number];
    const vals = fineGrid.features.map((f) => (f.properties as { ndvi: number }).ndvi).sort((a, b) => a - b);
    const qv = (k: number) => vals[Math.min(vals.length - 1, Math.floor((k * vals.length) / 5))];
    const breaks = [vals[0] - 1e-6, qv(1), qv(2), qv(3), qv(4), vals[vals.length - 1] + 1e-6];
    // Colapsa breaks repetidos (lote muy homogéneo) para que isobands no falle.
    for (let i = 1; i < breaks.length; i++) if (breaks[i] <= breaks[i - 1]) breaks[i] = breaks[i - 1] + 1e-6;

    // Dosis por zona (según estrategia) y color por DOSIS (rojo=baja → verde=alta),
    // independiente de la estrategia elegida.
    const FACTOR: Record<Zona, number> = estrategia === "compensar"
      ? { "Muy bajo": 1.3, Bajo: 1.15, Medio: 1.0, Alto: 0.88, "Muy alto": 0.78 }   // más insumo donde el vigor es bajo
      : { "Muy bajo": 0.78, Bajo: 0.88, Medio: 1.0, Alto: 1.15, "Muy alto": 1.3 }; // más insumo donde hay potencial
    const RAMPA_DOSIS = ["#d7191c", "#fdae61", "#f5e04e", "#a6d96a", "#1a9641"];
    const dosisZona = ZONAS.map((z) => Math.round(dosisBase * FACTOR[z]));
    const colorZona: string[] = new Array(ZONAS.length);
    dosisZona.map((d, i) => ({ i, d })).sort((a, b) => a.d - b.d).forEach((o, rank) => { colorZona[o.i] = RAMPA_DOSIS[Math.min(rank, RAMPA_DOSIS.length - 1)]; });

    // 4) ISOBANDAS (curvas de nivel rellenas) → recorte al lote → un polígono por
    //    porción de zona. Da el aspecto orgánico y suave de un mapa de prescripción.
    let bandsFc: GeoJSON.FeatureCollection | null = null;
    try { bandsFc = turf.isobands(fineGrid as any, breaks, { zProperty: "ndvi" }) as GeoJSON.FeatureCollection; } catch { bandsFc = null; }

    const features: GeoJSON.Feature[] = [];
    const haPorZona = new Array(ZONAS.length).fill(0) as number[];
    (bandsFc?.features ?? []).forEach((band) => {
      // Mapea cada banda a su zona por el límite inferior de su rango NDVI.
      const lo = parseFloat(String((band.properties as { ndvi?: string }).ndvi ?? "").split("-")[0]);
      let zi = 0, best = Infinity;
      for (let k = 0; k < ZONAS.length; k++) { const dd = Math.abs(breaks[k] - lo); if (dd < best) { best = dd; zi = k; } }
      let clip: GeoJSON.Feature | null = null;
      try { clip = turf.intersect(turf.featureCollection([band as any, poly as any])); } catch { clip = null; }
      if (!clip) return;
      const anillos: GeoJSON.Position[][][] = clip.geometry.type === "Polygon"
        ? [(clip.geometry as GeoJSON.Polygon).coordinates]
        : (clip.geometry as GeoJSON.MultiPolygon).coordinates;
      anillos.forEach((coords) => {
        const g: GeoJSON.Polygon = { type: "Polygon", coordinates: coords };
        const ha = turf.area(turf.feature(g)) / 10000;
        if (ha < 0.05) return; // descarta astillas
        haPorZona[zi] += ha;
        features.push({
          type: "Feature",
          geometry: g,
          properties: {
            ndvi: Math.round(((breaks[zi] + breaks[zi + 1]) / 2) * 100) / 100,
            zona: ZONAS[zi], dosis: dosisZona[zi], unidad: "kg/ha", color: colorZona[zi],
            areaHa: Math.round(ha * 100) / 100,
          },
        });
      });
    });
    if (features.length === 0) return NextResponse.json({ error: "No se pudo zonificar el lote" }, { status: 422 });

    // 5) RESUMEN (ahorro de insumo vs dosis fija).
    const prodTotal = haPorZona.reduce((s, ha, i) => s + ha * dosisZona[i], 0);
    const prodUniforme = dosisBase * areaTotalHa;
    const ahorroPct = prodUniforme > 0 ? Math.round(((prodUniforme - prodTotal) / prodUniforme) * 100) : 0;
    const zonas = ZONAS.map((z, i) => ({ zona: z, dosis: dosisZona[i], ha: Math.round(haPorZona[i] * 10) / 10, color: colorZona[i] })).filter((z) => z.ha > 0);

    return NextResponse.json({
      producto, dosisBase, estrategia, fuente: sentinel ? "Sentinel-2" : "estimado",
      // Sin NDVI satelital real (Sentinel), la zonificación es una estimación demostrativa.
      simulado: !sentinel,
      areaHa: Math.round(areaTotalHa * 10) / 10,
      resumen: { celdas: zonas.length, prodTotal: Math.round(prodTotal), prodUniforme: Math.round(prodUniforme), ahorroPct, zonas },
      geojson: { type: "FeatureCollection", features },
    });
  } catch (error) {
    console.error("Error en prescripción variable:", error);
    return NextResponse.json({ error: "Error al generar la prescripción" }, { status: 500 });
  }
}
