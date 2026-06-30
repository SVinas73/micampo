// Datos compartidos del tab Lotes — formas de UI + datos de ejemplo del Figma.

export interface ComentarioLote {
  texto: string;
  autor: string;
  fecha: string;
}

export interface LoteUI {
  id: string; // código corto de UI (L-01…)
  dbId?: string; // id real en la base de datos
  name: string;
  campo: string;
  ha: number;
  cultivo: string | null;
  variety?: string;
  estadio?: string;
  ndvi: number;
  humedad?: number; // humedad de suelo real (Open-Meteo, m³/m³)
  aguaUtil: number;
  sano: boolean;
  vacio?: boolean;
  comentarios: ComentarioLote[];
  geojson?: { type: "Polygon"; coordinates: number[][][] } | null;
  cultivoColor?: string | null;
  establecimientoId?: string | null;
  perimetro?: number | null;
}

export interface LoteGeo {
  id: string;
  points: string;
  labelX: number;
  labelY: number;
  labelFill: string;
}

/* Polígonos del mapa (fiel al Figma) */
export const LOTES_GEO: LoteGeo[] = [
  { id: "L-01", points: "100,60 280,70 305,200 90,190", labelX: 190, labelY: 130, labelFill: "#38491f" },
  { id: "L-02", points: "305,200 90,190 80,310 295,320", labelX: 190, labelY: 250, labelFill: "white" },
  { id: "L-03", points: "305,75 540,90 555,230 305,200", labelX: 420, labelY: 155, labelFill: "#38491f" },
  { id: "L-04", points: "555,230 305,200 295,320 545,340", labelX: 420, labelY: 270, labelFill: "#38491f" },
  { id: "L-05", points: "545,340 295,320 290,440 540,460", labelX: 420, labelY: 395, labelFill: "#38491f" },
  { id: "L-06", points: "540,90 700,100 685,250 555,230", labelX: 610, labelY: 170, labelFill: "#38491f" },
  { id: "L-07", points: "685,250 540,230 540,360 690,380", labelX: 610, labelY: 320, labelFill: "#38491f" },
  { id: "L-08", points: "690,380 540,360 540,480 695,490", labelX: 610, labelY: 430, labelFill: "white" },
];

/* Métricas de capas por lote (NDVI / Humedad / Topografía / color de cultivo) — Figma */
export const GEO_METRICAS: Record<
  string,
  { cultivoColor: string | null; ndvi: number; hum: number; topo: number; vacio: boolean }
> = {
  "L-01": { cultivoColor: "#768f44", ndvi: 0.78, hum: 72, topo: 145, vacio: false },
  "L-02": { cultivoColor: "#5fae62", ndvi: 0.71, hum: 64, topo: 130, vacio: false },
  "L-03": { cultivoColor: "#d9a538", ndvi: 0.62, hum: 48, topo: 165, vacio: false },
  "L-04": { cultivoColor: "#a88032", ndvi: 0.55, hum: 42, topo: 195, vacio: false },
  "L-05": { cultivoColor: "#aabd76", ndvi: 0.68, hum: 58, topo: 210, vacio: false },
  "L-06": { cultivoColor: null, ndvi: 0.42, hum: 30, topo: 240, vacio: true },
  "L-07": { cultivoColor: "#d9a538", ndvi: 0.74, hum: 68, topo: 175, vacio: false },
  "L-08": { cultivoColor: "#5fae62", ndvi: 0.66, hum: 55, topo: 120, vacio: false },
};

export const CULTIVO_COLORES: Record<string, string> = {
  Soja: "#768f44",
  Maíz: "#d9a538",
  Trigo: "#a88032",
  Alfalfa: "#aabd76",
  Girasol: "#e8b94a",
  Trébol: "#7bc77e",
};

/* Lotes de ejemplo (mismos nombres que el mapa del Figma) */
export const LOTES_INICIALES: LoteUI[] = [
  { id: "L-01", name: "Norte 1", campo: "Don Ramón", ha: 82, cultivo: "Soja", variety: "DM-40R", estadio: "R3 - Form. Vainas", ndvi: 0.78, aguaUtil: 72, sano: false, comentarios: [{ texto: "Sector bajo con encharcamiento tras la lluvia. Revisar drenaje.", autor: "Juan", fecha: "10/Oct" }] },
  { id: "L-02", name: "Norte 2", campo: "Don Ramón", ha: 75, cultivo: "Soja", variety: "NA-5009", estadio: "R2 - Floración", ndvi: 0.71, aguaUtil: 64, sano: true, comentarios: [] },
  { id: "L-03", name: "Este 1", campo: "Don Ramón", ha: 96, cultivo: "Maíz", variety: "DK-7210", estadio: "V6 - Vegetativo", ndvi: 0.62, aguaUtil: 48, sano: false, comentarios: [] },
  { id: "L-04", name: "Sur 1", campo: "Don Ramón", ha: 64, cultivo: "Trigo", variety: "BIO-INTA 300", estadio: "Z31 - Primer Nudo", ndvi: 0.55, aguaUtil: 42, sano: true, comentarios: [] },
  { id: "L-05", name: "Sur 2", campo: "La Esperanza", ha: 42, cultivo: "Alfalfa", variety: "WL-1058", estadio: "Vegetativo", ndvi: 0.68, aguaUtil: 58, sano: true, comentarios: [] },
  { id: "L-06", name: "Loma 1", campo: "La Esperanza", ha: 60, cultivo: null, estadio: "—", ndvi: 0.42, aguaUtil: 30, sano: true, vacio: true, comentarios: [] },
  { id: "L-07", name: "Oeste 1", campo: "La Esperanza", ha: 78, cultivo: "Maíz", variety: "DK-7272", estadio: "V8 - Vegetativo", ndvi: 0.74, aguaUtil: 68, sano: true, comentarios: [] },
  { id: "L-08", name: "Oeste 2", campo: "La Esperanza", ha: 61, cultivo: "Soja", variety: "DM-46R", estadio: "R1 - Floración", ndvi: 0.66, aguaUtil: 55, sano: true, comentarios: [] },
];

/* Plantillas de fila para la Vista Lista (datos enriquecidos del Figma) */
export interface ListaExtra {
  genetica: string;
  finPct: number;
  finUSD: string;
  finDisp: string;
  ndviLabel: string;
  ndviTrend: "up" | "down" | "flat";
  plaga: string;
  riesgo: string;
  riesgoColor: "red" | "amber" | "green";
  riesgoVal: string;
  visita: string;
  monitor: string;
  proy: string;
  proyDelta: string;
  proyFecha: string;
  neg?: boolean;
}

export const LISTA_EXTRAS: ListaExtra[] = [
  { genetica: "DK-7210", finPct: 65, finUSD: "$260 / $400 USD", finDisp: "$140/Ha", ndviLabel: "Alto", ndviTrend: "up", plaga: "Isoca Medidora", riesgo: "Alta", riesgoColor: "red", riesgoVal: "15/m²", visita: "Hace 2 días", monitor: "Pendiente", proy: "9.5 Tn/Ha", proyDelta: "+5% vs Prom", proyFecha: "15/Mar" },
  { genetica: "DM-40R", finPct: 85, finUSD: "$200 / $235 USD", finDisp: "$35/Ha", ndviLabel: "Medio", ndviTrend: "flat", plaga: "Chinche Verde", riesgo: "Media", riesgoColor: "amber", riesgoVal: "2/m²", visita: "Hace 5 días", monitor: "Vigilancia", proy: "3.2 Tn/Ha", proyDelta: "-2% vs Prom", proyFecha: "20/Abr", neg: true },
  { genetica: "BIO-INTA 300", finPct: 40, finUSD: "$150 / $380 USD", finDisp: "$230/Ha", ndviLabel: "Muy Alto", ndviTrend: "up", plaga: "Sin Plagas/Enf.", riesgo: "Nula", riesgoColor: "green", riesgoVal: "0/m²", visita: "Ayer", monitor: "OK - Saludable", proy: "5.1 Tn/Ha", proyDelta: "+8% vs Prom", proyFecha: "10/Dic" },
  { genetica: "NA-5009", finPct: 80, finUSD: "$190 / $235 USD", finDisp: "$45/Ha", ndviLabel: "Medio", ndviTrend: "down", plaga: "Pulgón Verde", riesgo: "Alta", riesgoColor: "red", riesgoVal: "20/m²", visita: "Hoy", monitor: "Acción inmediata", proy: "3.0 Tn/Ha", proyDelta: "-5% vs Prom", proyFecha: "20/Abr", neg: true },
  { genetica: "P245", finPct: 70, finUSD: "$220 / $315 USD", finDisp: "$95/Ha", ndviLabel: "Alto", ndviTrend: "up", plaga: "Sin Plagas/Enf.", riesgo: "Nula", riesgoColor: "green", riesgoVal: "0/m²", visita: "Hace 3 días", monitor: "OK - Saludable", proy: "2.8 Tn/Ha", proyDelta: "+4% vs Prom", proyFecha: "05/May" },
];

export interface LaborUI {
  id?: string;
  loteId?: string; // dbId del lote
  loteCode?: string; // código UI
  tipo: string;
  fecha: string; // dd/Mmm
  detalle: string;
}

export const LABORES_EJEMPLO: LaborUI[] = [
  { tipo: "Pulverización", fecha: "14/Abr", detalle: "Glifosato 3 L/Ha" },
  { tipo: "Fertilización", fecha: "08/Abr", detalle: "Urea 120 kg/Ha" },
  { tipo: "Siembra", fecha: "22/Mar", detalle: "Var. estándar · 80 kpa" },
  { tipo: "Análisis suelo", fecha: "15/Mar", detalle: "pH 6.2 · MO 2.8%" },
];

export function fechaCorta(d: Date): string {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${String(d.getDate()).padStart(2, "0")}/${meses[d.getMonth()]}`;
}

/* Mapea filas reales de /api/lotes a la forma de UI, reutilizando geo/metricas de ejemplo */
export function mapLotesApi(rows: Array<Record<string, unknown>>): LoteUI[] {
  return rows.map((r, i) => {
    // Geometría real guardada en la base (GeoJSON en `coordenadas`)
    let geojson: LoteUI["geojson"] = null;
    if (typeof r.coordenadas === "string" && r.coordenadas) {
      try {
        const parsed = JSON.parse(r.coordenadas as string);
        if (parsed?.type === "Polygon" && Array.isArray(parsed.coordinates)) geojson = parsed;
      } catch {}
    }
    const cultivo = (r.cultivo as string) || null;
    return {
      id: String(r.id ?? `L-${i + 1}`),
      dbId: String(r.id ?? ""),
      name: String(r.nombre ?? `Lote ${i + 1}`),
      campo: String(r.campo ?? "Mi campo"),
      ha: Number(r.hectareas ?? 0),
      cultivo,
      variety: undefined,
      estadio: "—", // estadio fenológico real se deriva de la siembra (no se inventa)
      ndvi: 0, // sin medición satelital aún; se completará con NDVI real
      aguaUtil: 0,
      sano: true,
      vacio: !cultivo,
      comentarios: [],
      geojson,
      cultivoColor: cultivo ? (CULTIVO_COLORES[cultivo] || "#5e7733") : null,
      establecimientoId: (r.establecimientoId as string) || null,
      perimetro: r.perimetro != null ? Number(r.perimetro) : null,
    };
  });
}
