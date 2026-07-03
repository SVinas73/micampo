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

export const CULTIVO_COLORES: Record<string, string> = {
  Soja: "#768f44",
  Maíz: "#d9a538",
  Trigo: "#a88032",
  Alfalfa: "#aabd76",
  Girasol: "#e8b94a",
  Trébol: "#7bc77e",
};

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
