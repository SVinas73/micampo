// Tipos y helpers del módulo Mov. de Tropas.
// Derivan la vista de los datos reales de /api/tropas, /api/rutinas-tropa,
// /api/movimientos-tropa y /api/lotes.

export type AnimalTropaAPI = {
  id: string;
  caravana: string;
  nombre?: string | null;
  categoria?: string | null;
  raza?: string | null;
  sexo: string;
  estado: string;
  registrosPeso?: { peso: number; fecha: string }[];
  historialReproductivo?: { estadoActual: string } | null;
  tratamientos?: { id: string; estado: string }[];
};

export type TropaAPI = {
  id: string;
  nombre: string;
  categoria?: string | null;
  color?: string | null;
  estado: string;
  loteId?: string | null;
  lote?: { id: string; nombre: string; hectareas?: number } | null;
  rutinaId?: string | null;
  rutina?: RutinaAPI | null;
  notas?: string | null;
  animales?: AnimalTropaAPI[];
  movimientos?: MovTropaAPI[];
  _count?: { animales: number };
};

export type RutinaConfig = {
  secuencia?: { lugar: string; inicio?: string; fin?: string }[];
  freq?: string; // "Una vez" | "Diaria" | "Semanal" | "Mensual" | "Cada X días"
  freqDias?: number;
  modo?: "siempre" | "rango";
  desde?: string;
  hasta?: string;
};

export type RutinaAPI = {
  id: string;
  nombre: string;
  tipo: string;
  emoji?: string | null;
  color?: string | null;
  descripcion?: string | null;
  config?: string | null;
  estado: string;
  tropas?: { id: string; nombre: string; color?: string | null }[];
  _count?: { movimientos: number };
};

export type MovTropaAPI = {
  id: string;
  tropaId: string;
  fecha: string;
  horario?: string | null;
  origenNombre?: string | null;
  destinoNombre?: string | null;
  motivo?: string | null;
  estado: string; // Planificado, En curso, Ejecutado, Cancelado
  cabezas?: number | null;
  distanciaKm?: number | null;
  duracionMin?: number | null;
  responsable?: string | null;
  notas?: string | null;
  rutinaId?: string | null;
  tropa?: { id: string; nombre: string; color?: string | null; categoria?: string | null; _count?: { animales: number } };
  rutina?: { id: string; nombre: string; emoji?: string | null } | null;
};

export type LoteGeoAPI = {
  id: string;
  nombre: string;
  hectareas: number;
  coordenadas?: string | null;
  centroLatitud?: number | null;
  centroLongitud?: number | null;
};

export const PALETA_TROPAS = ["#16a34a", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#0891b2", "#ec4899", "#d97706"];

export function colorDeTropa(t: TropaAPI, idx: number): string {
  return t.color || PALETA_TROPAS[idx % PALETA_TROPAS.length];
}

export const ESTADO_COLOR_TROPA: Record<string, string> = {
  Saludable: "#16a34a",
  Preñada: "#8b5cf6",
  "En tratamiento": "#c48410",
  Vacía: "#64748b",
  "En servicio": "#3b82f6",
  "En celo": "#f59e0b",
};

/** Estado sanitario de un animal de tropa (derivado de datos reales). */
export function estadoAnimalTropa(a: AnimalTropaAPI): string {
  if ((a.tratamientos || []).length > 0) return "En tratamiento";
  const h = a.historialReproductivo?.estadoActual;
  if (h === "Preñada") return "Preñada";
  if (h === "En Servicio") return "En servicio";
  if (h === "En Celo") return "En celo";
  return "Saludable";
}

export function pesoPromTropa(t: TropaAPI): number | null {
  const pesos = (t.animales || []).map((a) => a.registrosPeso?.[0]?.peso).filter((p): p is number => typeof p === "number");
  if (pesos.length === 0) return null;
  return Math.round(pesos.reduce((s, p) => s + p, 0) / pesos.length);
}

export function parseRutinaConfig(r: RutinaAPI | null | undefined): RutinaConfig {
  if (!r?.config) return {};
  try {
    return JSON.parse(r.config) as RutinaConfig;
  } catch {
    return {};
  }
}

export function rutaDeRutina(r: RutinaAPI | null | undefined): string[] {
  return (parseRutinaConfig(r).secuencia || []).map((s) => s.lugar).filter(Boolean);
}

export function freqLabel(r: RutinaAPI | null | undefined): string {
  const c = parseRutinaConfig(r);
  if (!c.freq) return "—";
  if (c.freq === "Cada X días") return `Cada ${c.freqDias || 0} días`;
  return c.freq;
}

/** Días de descanso de un lote = días desde que la última tropa salió de él. */
export function diasDescansoLote(nombreLote: string, movimientos: MovTropaAPI[], tropas: TropaAPI[]): number | null {
  const ocupado = tropas.some((t) => t.lote?.nombre === nombreLote);
  if (ocupado) return 0;
  const salidas = movimientos
    .filter((m) => m.estado === "Ejecutado" && m.origenNombre === nombreLote)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  if (salidas.length === 0) return null;
  return Math.floor((Date.now() - new Date(salidas[0].fecha).getTime()) / (24 * 3600 * 1000));
}

export const fmtFechaLarga = (d: string | Date) =>
  (typeof d === "string" ? new Date(d) : d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

export const esMismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* La fecha del movimiento se guarda como medianoche UTC ("YYYY-MM-DD" del input).
   Para comparar/mostrar sin corrimiento de zona horaria trabajamos con el
   substring de fecha, nunca con new Date(iso) directo. */
export const fechaStrMov = (iso: string) => iso.slice(0, 10);
export const dateLocalDeISO = (iso: string) => new Date(iso.slice(0, 10) + "T00:00:00");

export const parseHora = (h?: string | null): number | null => {
  if (!h) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(h);
  if (!m) return null;
  return parseInt(m[1]) + parseInt(m[2]) / 60;
};

export const codigoTropa = (idx: number) => `T-${String(idx + 1).padStart(2, "0")}`;

export function mapaColoresTropas(tropas: TropaAPI[]): Record<string, string> {
  const out: Record<string, string> = {};
  tropas.forEach((t, i) => { out[t.id] = colorDeTropa(t, i); });
  return out;
}

export function razaPredominante(t: TropaAPI): string | null {
  const counts: Record<string, number> = {};
  (t.animales || []).forEach((a) => { if (a.raza) counts[a.raza] = (counts[a.raza] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

/** Clasificación del motivo de un movimiento (para filtros e insights del historial). */
export type TipoMov = "Interno" | "Venta" | "Compra" | "Destete" | "Sanitario";
export const TIPOS_MOV: TipoMov[] = ["Interno", "Venta", "Compra", "Destete", "Sanitario"];
export function tipoDeMovimiento(m: MovTropaAPI): TipoMov {
  const s = (m.motivo || "").toLowerCase();
  if (/venta|frigor[ií]f|faena/.test(s)) return "Venta";
  if (/compra|remate|ingreso de hacienda/.test(s)) return "Compra";
  if (/destete/.test(s)) return "Destete";
  if (/sanit|vacun|ba[ñn]o|tratamiento|revisaci[oó]n/.test(s)) return "Sanitario";
  return "Interno";
}

/** Movimiento planificado cuya fecha/hora ya pasó (alerta de atraso). */
export function movAtrasado(m: MovTropaAPI, ahora = new Date()): boolean {
  if (m.estado !== "Planificado") return false;
  const hoyStr = toDateStr(ahora);
  const f = fechaStrMov(m.fecha);
  if (f < hoyStr) return true;
  if (f > hoyStr) return false;
  const h = parseHora(m.horario);
  return h !== null && h < ahora.getHours() + ahora.getMinutes() / 60;
}

/** Días que la tropa lleva en su lote actual (desde el último movimiento ejecutado hacia él). */
export function diasEnLote(t: TropaAPI, movimientos: MovTropaAPI[]): number | null {
  if (!t.lote?.nombre) return null;
  const llegada = movimientos
    .filter((m) => m.tropaId === t.id && m.estado === "Ejecutado" && m.destinoNombre === t.lote?.nombre)
    .sort((a, b) => fechaStrMov(b.fecha).localeCompare(fechaStrMov(a.fecha)))[0];
  if (!llegada) return null;
  return Math.max(0, Math.floor((Date.now() - dateLocalDeISO(llegada.fecha).getTime()) / (24 * 3600 * 1000)));
}

/* ============ Geometría de lotes (GeoJSON guardado por Campo Digital) ============ */

const esLatLngPt = (p: number[]) => Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180;

/** Extrae el anillo exterior [ [lat,lng], ... ] de una geometría en cualquiera de los formatos que guarda la app. */
export function ringDeCoordenadas(coordenadas?: string | null): [number, number][] | null {
  if (!coordenadas) return null;
  let geo: unknown = coordenadas;
  if (typeof geo === "string") {
    try {
      geo = JSON.parse(geo);
    } catch {
      return null;
    }
  }
  // Feature / FeatureCollection → geometry
  const g0 = geo as { type?: string; geometry?: unknown; features?: { geometry?: unknown }[] };
  if (g0?.type === "Feature" && g0.geometry) geo = g0.geometry;
  else if (g0?.type === "FeatureCollection" && g0.features?.[0]?.geometry) geo = g0.features[0].geometry;

  const g = geo as { type?: string; coordinates?: unknown } | unknown[];
  let ring: unknown = null;
  if (Array.isArray(g)) {
    // Array crudo: [[x,y],...] o [[[x,y],...]] o [{lat,lng},...]
    ring = Array.isArray(g[0]) && Array.isArray((g[0] as unknown[])[0]) ? g[0] : g;
  } else if (g?.type === "MultiPolygon") {
    ring = (g.coordinates as number[][][][])?.[0]?.[0];
  } else if (g?.coordinates) {
    ring = (g.coordinates as number[][][])?.[0];
  }
  if (!Array.isArray(ring)) return null;

  const pts: [number, number][] = [];
  for (const c of ring as unknown[]) {
    if (Array.isArray(c) && c.length >= 2 && isFinite(Number(c[0])) && isFinite(Number(c[1]))) {
      pts.push([Number(c[0]), Number(c[1])]);
    } else {
      const o = c as { lat?: number; lng?: number };
      if (o && typeof o.lat === "number" && typeof o.lng === "number") pts.push([o.lat, o.lng]);
    }
  }
  if (pts.length < 3) return null;

  // GeoJSON es [lng,lat]; si los puntos ya vienen como [lat,lng] los detectamos
  // (lat válida y lng "grande") y no los damos vuelta dos veces.
  const yaLatLng = pts.every((p) => esLatLngPt(p)) && pts.some((p) => Math.abs(p[1]) > 90);
  const out = yaLatLng ? pts : pts.map(([x, y]) => [y, x] as [number, number]);
  return out.every((p) => esLatLngPt(p)) ? out : null;
}

/** Centroide simple del anillo (promedio de vértices) o el centro guardado del lote. */
export function centroDeLote(l: { coordenadas?: string | null; centroLatitud?: number | null; centroLongitud?: number | null }): [number, number] | null {
  const ring = ringDeCoordenadas(l.coordenadas);
  if (ring) {
    const lat = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const lng = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    return [lat, lng];
  }
  if (typeof l.centroLatitud === "number" && typeof l.centroLongitud === "number") return [l.centroLatitud, l.centroLongitud];
  return null;
}
