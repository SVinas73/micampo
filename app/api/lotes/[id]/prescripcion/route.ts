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
    // Tamaño de celda: apunta a ~26 celdas dentro del bbox — el máximo que permite
    // el límite de consultas satelitales SIN truncar nunca una parte del lote.
    // (Las celdas de una misma zona luego se disuelven y suavizan en polígonos
    // orgánicos, como un mapa de prescripción agronómico real.)
    const anchoKm = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], { units: "kilometers" });
    const altoKm = turf.distance([bbox[0], bbox[1]], [bbox[0], bbox[3]], { units: "kilometers" });
    const cellKm = Math.max(0.04, Math.sqrt((anchoKm * altoKm) / 26));

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

    // Zonificación por QUINTILES de NDVI → 5 zonas de manejo con 5 dosis distintas,
    // como los mapas de prescripción comerciales.
    const ZONAS = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"] as const;
    type Zona = (typeof ZONAS)[number];
    const orden = [...celdas].sort((a, b) => a.ndvi - b.ndvi);
    const q = (k: number) => orden[Math.min(orden.length - 1, Math.floor((k * orden.length) / 5))]?.ndvi ?? 0;
    const cortes = [q(1), q(2), q(3), q(4)];
    const zonaDe = (ndvi: number): Zona =>
      ndvi <= cortes[0] ? "Muy bajo" : ndvi <= cortes[1] ? "Bajo" : ndvi <= cortes[2] ? "Medio" : ndvi <= cortes[3] ? "Alto" : "Muy alto";
    // Factor de dosis por estrategia
    const FACTOR: Record<Zona, number> = estrategia === "compensar"
      ? { "Muy bajo": 1.3, Bajo: 1.15, Medio: 1.0, Alto: 0.88, "Muy alto": 0.78 }   // más insumo donde el vigor es bajo
      : { "Muy bajo": 0.78, Bajo: 0.88, Medio: 1.0, Alto: 1.15, "Muy alto": 1.3 }; // más insumo donde hay potencial
    // Rampa clásica de prescripción (5 clases): el color sigue a la DOSIS (roja la
    // más baja → verde oscuro la más alta), independiente de la estrategia elegida.
    const RAMPA_DOSIS = ["#d7191c", "#fdae61", "#f5e04e", "#a6d96a", "#1a9641"];
    const ordenDosis = ZONAS
      .map((z) => ({ z, d: Math.round(dosisBase * FACTOR[z]) }))
      .sort((a, b) => a.d - b.d);
    const COLOR = {} as Record<Zona, string>;
    ordenDosis.forEach((o, i) => { COLOR[o.z] = RAMPA_DOSIS[Math.min(i, RAMPA_DOSIS.length - 1)]; });

    let prodTotal = 0;
    celdas.forEach((c) => { prodTotal += Math.round(dosisBase * FACTOR[zonaDe(c.ndvi)]) * c.areaHa; });

    // DISUELVE las celdas contiguas de una misma zona y SUAVIZA el borde aserrado
    // de la grilla (Chaikin + leve buffer expansivo), recortando al contorno del
    // lote y RESTANDO lo ya ocupado por las zonas anteriores → teselado orgánico
    // sin huecos ni solapes, como un mapa de prescripción agronómico real.
    const bufferKm = 0.2 * cellKm;
    let ocupado: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null = null;
    const features: GeoJSON.Feature[] = [];
    ZONAS.forEach((z) => {
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
        let final: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null = null;
        try {
          let suave = turf.polygonSmooth(turf.feature(g), { iterations: 3 }).features[0] as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
          suave = (turf.buffer(suave, bufferKm, { units: "kilometers" }) as typeof suave | undefined) || suave;
          let recorte = turf.intersect(turf.featureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>([suave, poly]));
          if (recorte && ocupado) recorte = turf.difference(turf.featureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>([recorte, ocupado]));
          final = recorte;
        } catch { /* sin suavizado, va la geometría original */ }
        if (!final) final = turf.feature(g);
        try {
          ocupado = ocupado ? (turf.union(turf.featureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>([ocupado, final])) as typeof ocupado) : final;
        } catch { /* si la unión falla, sigue con lo acumulado */ }
        const polys: GeoJSON.Polygon[] = [];
        if (final.geometry.type === "Polygon") polys.push(final.geometry);
        else final.geometry.coordinates.forEach((coords) => polys.push({ type: "Polygon", coordinates: coords }));
        polys.forEach((gg) => {
          const haPoly = turf.area(turf.feature(gg)) / 10000;
          if (haPoly < 0.02) return; // astillas del recorte: ensucian sin aportar
          features.push({
            type: "Feature",
            geometry: gg,
            properties: {
              ndvi: ndviProm, zona: z, dosis, unidad: "kg/ha", color: COLOR[z],
              areaHa: Math.round(haPoly * 100) / 100,
            },
          });
        });
      });
    });

    const prodUniforme = dosisBase * areaTotalHa;
    const ahorroPct = prodUniforme > 0 ? Math.round(((prodUniforme - prodTotal) / prodUniforme) * 100) : 0;
    const zonas = ZONAS.map((z) => {
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
