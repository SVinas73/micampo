// Formas de UI y helpers del tab Lotes (mapeo de la API a la vista). Sin datos de ejemplo.

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

// Tonalidad FUERTE y distinta por cultivo (vista "Cultivos" del mapa y croquis).
// Lote vacío → blanquecino (COLOR_LOTE_VACIO).
export const CULTIVO_COLORES: Record<string, string> = {
  Soja: "#22a04a",       // verde
  Maíz: "#f5c211",       // amarillo
  Trigo: "#d98c21",      // dorado
  Cebada: "#a16a1b",     // marrón dorado
  Avena: "#7f9a3d",      // oliva
  Sorgo: "#b3372f",      // rojo teja
  Girasol: "#f97316",    // naranja
  Alfalfa: "#7c3aed",    // violeta
  Trébol: "#65a30d",     // lima
  Arroz: "#0d9488",      // teal
  Canola: "#c7d11f",     // amarillo verdoso
  Lino: "#3b82f6",       // azul
  Papa: "#8d6e63",       // marrón
  Maní: "#c2703d",       // caramelo
  Centeno: "#6b7280",    // gris verdoso
  Triticale: "#94742c",
  Quinoa: "#c026d3",     // fucsia
  Chía: "#4b5563",
};
export const COLOR_LOTE_VACIO = "#f5f2ea";

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
