import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as turf from "@turf/turf";
import { ndviEstableDePoligono, sentinelStatsDisponible } from "@/lib/sentinel";
import { getInsight } from "@/lib/insight";
import { detectarFertilizante, dosisAgronomica, factorRindeZona, rindeReferencia, esLeguminosa, type SueloAnalisis } from "@/lib/prescripcion-agro";

export const maxDuration = 60;

/**
 * POST /api/lotes/[id]/prescripcion
 * Genera un MAPA DE PRESCRIPCIÓN VARIABLE (VRT) de nivel agronómico:
 *  - Muestrea NDVI ESTABLE (promedio de ~15 meses de Sentinel-2) → zonas de manejo
 *    consistentes (no una sola foto que puede tener nubes/heladas).
 *  - Interpola (IDW) y traza isobandas → zonas orgánicas suaves.
 *  - Calcula la dosis por ZONA con un modelo de BALANCE DE NUTRIENTES: requerimiento
 *    del cultivo (rinde objetivo × extracción) − aporte del suelo (análisis real).
 * Body: { producto, rindeObjetivo? (t/ha), dosisBase? (fallback), estrategia }
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Lote + último análisis de suelo (resiliente: si la relación no está disponible
    // en la base, sigue con los datos básicos del lote y sin aporte de suelo).
    let lote: Awaited<ReturnType<typeof prisma.lote.findUnique>> & { analisisSuelo?: Array<{ nitrogeno: number | null; fosforo: number | null; potasio: number | null; pH: number | null; materiaOrganica: number | null }> };
    try {
      lote = await prisma.lote.findUnique({ where: { id }, include: { analisisSuelo: { orderBy: { fechaAnalisis: "desc" }, take: 1 } } }) as typeof lote;
    } catch {
      lote = await prisma.lote.findUnique({ where: { id } }) as typeof lote;
    }
    if (!lote || lote.userId !== session.user.id) return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    if (!lote.coordenadas) return NextResponse.json({ error: "El lote no tiene geometría dibujada" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const producto: string = body.producto || "Urea";
    const dosisBase: number = Number(body.dosisBase) || 120;
    const rindeObjetivo: number | null = Number(body.rindeObjetivo) > 0 ? Number(body.rindeObjetivo) : null;
    const estrategia: "compensar" | "potenciar" = body.estrategia === "potenciar" ? "potenciar" : "compensar";
    const suelo: SueloAnalisis = lote.analisisSuelo?.[0]
      ? { nitrogeno: lote.analisisSuelo[0].nitrogeno, fosforo: lote.analisisSuelo[0].fosforo, potasio: lote.analisisSuelo[0].potasio, pH: lote.analisisSuelo[0].pH, materiaOrganica: lote.analisisSuelo[0].materiaOrganica }
      : null;
    const cultivo = lote.cultivo;

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
    let fechasNdvi = 0; // promedio de fechas Sentinel usadas por punto (evidencia de "estable")
    if (sentinel) {
      // Muestreo satelital de NDVI ESTABLE (promedio de ~15 meses) por punto, con
      // TIMEOUT global: si Sentinel tarda o falla, caemos al gradiente demo.
      const consultas = muestra.map((pt) => {
        const circ = turf.buffer(pt, bufKm, { units: "kilometers" });
        return (circ ? ndviEstableDePoligono(circ.geometry as GeoJSON.Polygon) : Promise.resolve(null)).catch(() => null);
      });
      const res = await Promise.race([
        Promise.all(consultas),
        new Promise<null>((r) => setTimeout(() => r(null), 35_000)),
      ]);
      const validas = (res || []).filter((n): n is NonNullable<typeof n> => n?.ndvi != null);
      if (res && validas.length > 0) {
        const media = validas.reduce((s, v) => s + v.ndvi, 0) / validas.length;
        fechasNdvi = Math.round(validas.reduce((s, v) => s + v.fechas, 0) / validas.length);
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

    // NDVI representativo de cada zona (punto medio de su rango) y del lote.
    const ndviMedio = vals.reduce((s, v) => s + v, 0) / vals.length;
    const ndviZona = ZONAS.map((_, i) => (breaks[i] + breaks[i + 1]) / 2);

    // DOSIS POR ZONA — modelo agronómico (balance de nutrientes) si se reconoce el
    // fertilizante; si no, fallback simple (dosis base × factor por estrategia).
    const RAMPA_DOSIS = ["#d7191c", "#fdae61", "#f5e04e", "#a6d96a", "#1a9641"];
    const fert = detectarFertilizante(producto);
    const rinde = rindeObjetivo ?? rindeReferencia(cultivo);
    let dosisZona: number[];
    let modelo: "agronómico" | "simple";
    let detalleAgro: {
      fertilizante: string; nutriente: "N" | "P" | "K"; pctNutriente: number;
      cultivo: string; rindeObjetivo: number; requerimiento: number; aporteSuelo: number;
      dosisLote: number; detalle: string; conSuelo: boolean; advertencia: string | null;
    } | null = null;
    if (fert) {
      modelo = "agronómico";
      dosisZona = ZONAS.map((_, i) => {
        const rindeZ = rinde * factorRindeZona(ndviZona[i], ndviMedio, estrategia);
        return Math.max(0, dosisAgronomica({ fert, cultivo, rinde: rindeZ, suelo }).dosis);
      });
      const loteAgro = dosisAgronomica({ fert, cultivo, rinde, suelo });
      const legN = fert.nutriente === "N" && esLeguminosa(cultivo);
      detalleAgro = {
        fertilizante: fert.etiqueta, nutriente: fert.nutriente, pctNutriente: fert.pct,
        cultivo: cultivo || "genérico", rindeObjetivo: Math.round(rinde * 10) / 10,
        requerimiento: loteAgro.requerido, aporteSuelo: loteAgro.aporte, dosisLote: loteAgro.dosis,
        detalle: loteAgro.detalle, conSuelo: !!suelo,
        advertencia: legN ? `${cultivo} fija nitrógeno: no requiere fertilización nitrogenada. Para P o K, elegí DAP/MAP o cloruro de potasio.` : null,
      };
    } else {
      modelo = "simple";
      const FACTOR: Record<Zona, number> = estrategia === "compensar"
        ? { "Muy bajo": 1.3, Bajo: 1.15, Medio: 1.0, Alto: 0.88, "Muy alto": 0.78 }
        : { "Muy bajo": 0.78, Bajo: 0.88, Medio: 1.0, Alto: 1.15, "Muy alto": 1.3 };
      dosisZona = ZONAS.map((z) => Math.round(dosisBase * FACTOR[z]));
    }

    // Color: por DOSIS (rojo=baja → verde=alta) si hay variación; si todas las dosis
    // son iguales (lote homogéneo o dosis 0), por VIGOR NDVI para que el mapa igual hable.
    const colorZona: string[] = new Array(ZONAS.length);
    if (new Set(dosisZona).size > 1) {
      dosisZona.map((d, i) => ({ i, d })).sort((a, b) => a.d - b.d).forEach((o, rank) => { colorZona[o.i] = RAMPA_DOSIS[Math.min(rank, RAMPA_DOSIS.length - 1)]; });
    } else {
      ZONAS.forEach((_, i) => { colorZona[i] = RAMPA_DOSIS[i]; });
    }

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

    // 5) RESUMEN (ahorro de insumo vs dosis uniforme).
    const dosisUniforme = modelo === "agronómico" && detalleAgro ? detalleAgro.dosisLote : dosisBase;
    const prodTotal = haPorZona.reduce((s, ha, i) => s + ha * dosisZona[i], 0);
    const prodUniforme = dosisUniforme * areaTotalHa;
    const ahorroPct = prodUniforme > 0 ? Math.round(((prodUniforme - prodTotal) / prodUniforme) * 100) : 0;
    const zonas = ZONAS.map((z, i) => ({ zona: z, dosis: dosisZona[i], ha: Math.round(haPorZona[i] * 10) / 10, color: colorZona[i], ndvi: Math.round(ndviZona[i] * 100) / 100 })).filter((z) => z.ha > 0);

    return NextResponse.json({
      producto, dosisBase, estrategia, modelo,
      fuente: sentinel ? `Sentinel-2 · NDVI estable (~${fechasNdvi} fechas)` : "estimado",
      simulado: !sentinel,
      agro: detalleAgro,
      areaHa: Math.round(areaTotalHa * 10) / 10,
      resumen: { celdas: zonas.length, prodTotal: Math.round(prodTotal), prodUniforme: Math.round(prodUniforme), ahorroPct, zonas },
      geojson: { type: "FeatureCollection", features },
    });
  } catch (error) {
    console.error("Error en prescripción variable:", error);
    return NextResponse.json({ error: "Error al generar la prescripción" }, { status: 500 });
  }
}
