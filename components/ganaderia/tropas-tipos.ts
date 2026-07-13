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

/* ── Proyección de lotes reales a un viewBox SVG (mapa esquemático) ── */

export type LoteSVG = {
  id: string;
  nombre: string;
  hectareas: number;
  pts: string; // "x,y x,y ..."
  cx: number;
  cy: number;
};

function parseCoords(raw: string | null | undefined): [number, number][] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return (arr as unknown[])
      .map((p): [number, number] | null => {
        if (Array.isArray(p) && p.length >= 2 && typeof p[0] === "number" && typeof p[1] === "number") return [p[0], p[1]];
        if (p && typeof p === "object" && "lat" in (p as object) && "lng" in (p as object)) {
          const q = p as { lat: number; lng: number };
          return [q.lat, q.lng];
        }
        return null;
      })
      .filter((p): p is [number, number] => p !== null);
  } catch {
    return [];
  }
}

/**
 * Proyecta los lotes reales (coordenadas geográficas) al viewBox del mapa
 * esquemático (100..540 × 40..460). Los lotes sin coordenadas se dibujan como
 * rectángulos en una grilla, para que el mapa siempre funcione.
 */
export function proyectarLotes(lotes: LoteGeoAPI[], viewW = 440, viewH = 420, offX = 100, offY = 40): LoteSVG[] {
  const conGeo = lotes.map((l) => ({ l, coords: parseCoords(l.coordenadas) })).filter((x) => x.coords.length >= 3);
  const out: LoteSVG[] = [];

  if (conGeo.length > 0) {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const { coords } of conGeo) {
      for (const [lat, lng] of coords) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    }
    const pad = 24;
    const spanLat = Math.max(1e-6, maxLat - minLat);
    const spanLng = Math.max(1e-6, maxLng - minLng);
    const px = (lng: number) => offX + pad + ((lng - minLng) / spanLng) * (viewW - pad * 2);
    const py = (lat: number) => offY + pad + ((maxLat - lat) / spanLat) * (viewH - pad * 2);
    for (const { l, coords } of conGeo) {
      const pts = coords.map(([lat, lng]) => `${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join(" ");
      const cx = coords.reduce((s, c) => s + px(c[1]), 0) / coords.length;
      const cy = coords.reduce((s, c) => s + py(c[0]), 0) / coords.length;
      out.push({ id: l.id, nombre: l.nombre, hectareas: l.hectareas, pts, cx, cy });
    }
  }

  // Lotes sin geometría → grilla de rectángulos
  const sinGeo = lotes.filter((l) => !out.some((o) => o.id === l.id));
  const cols = Math.max(1, Math.ceil(Math.sqrt(sinGeo.length)));
  const cw = (viewW - 40) / cols;
  const filas = Math.max(1, Math.ceil(sinGeo.length / cols));
  const ch = (viewH - 40) / filas;
  sinGeo.forEach((l, i) => {
    if (out.length > 0) {
      // Si hay lotes con geo, los sin-geo van como fichas chicas abajo a la izquierda
      const x = offX + 16 + (i % 3) * 90;
      const y = offY + viewH - 70 - Math.floor(i / 3) * 46;
      out.push({ id: l.id, nombre: l.nombre, hectareas: l.hectareas, pts: `${x},${y} ${x + 80},${y} ${x + 80},${y + 38} ${x},${y + 38}`, cx: x + 40, cy: y + 19 });
    } else {
      const col = i % cols;
      const fila = Math.floor(i / cols);
      const x = offX + 20 + col * cw;
      const y = offY + 20 + fila * ch;
      const w = cw - 14;
      const h = ch - 14;
      out.push({ id: l.id, nombre: l.nombre, hectareas: l.hectareas, pts: `${x},${y} ${x + w},${y} ${x + w},${y + h} ${x},${y + h}`, cx: x + w / 2, cy: y + h / 2 });
    }
  });

  return out;
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
