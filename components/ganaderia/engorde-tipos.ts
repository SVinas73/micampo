// Tipos y helpers del módulo Engorde (feedlot).
// Derivan de /api/corrales-engorde (+ pesadas) y /api/documentos-transito.

export type PesadaAPI = {
  id: string;
  fecha: string;
  pesoPromedio: number;
  cabezas?: number | null;
  gdp?: number | null;
  consumo?: number | null;
  notas?: string | null;
};

export type CorralAPI = {
  id: string;
  nombre: string;
  categoria?: string | null;
  capacidad?: number | null;
  cabezas: number;
  fechaIngreso?: string | null;
  pesoIngreso?: number | null;
  pesoActual?: number | null;
  pesoObjetivo?: number | null;
  gdpObjetivo?: number | null;
  diasEstimados?: number | null;
  racionId?: string | null;
  racion?: { id: string; nombre: string; costoTotal?: number | null; consumoDiario?: number | null } | null;
  consumoDiario?: number | null;
  costoDiario?: number | null;
  precioMercado?: number | null;
  fechaFaenaEst?: string | null;
  estado: string; // Activo | Listo | Cerrado
  notas?: string | null;
  pesadas?: PesadaAPI[];
};

export type DTEAPI = {
  id: string;
  numero: string;
  fecha: string;
  origen?: string | null;
  destino?: string | null;
  motivo?: string | null;
  categoria?: string | null;
  cabezas?: number | null;
  pesoTotal?: number | null;
  precioKg?: number | null;
  importe?: number | null;
  transporte?: string | null;
  estado: string;
  notas?: string | null;
};

const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
export const fmtDia = (d: Date) => `${d.getDate()} ${MES[d.getMonth()]}`;
export const nfEng = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
export const coma = (n: number, dec = 1) => n.toFixed(dec).replace(".", ",");

/** GDP real más reciente de un corral (de la última pesada, o derivado de dos pesadas). */
export function gdpReal(c: CorralAPI): number | null {
  const ps = (c.pesadas || []).slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  if (ps.length && ps[0].gdp != null) return ps[0].gdp;
  if (ps.length >= 2) {
    const dias = Math.max(1, (new Date(ps[0].fecha).getTime() - new Date(ps[1].fecha).getTime()) / (24 * 3600 * 1000));
    return Math.round(((ps[0].pesoPromedio - ps[1].pesoPromedio) / dias) * 100) / 100;
  }
  return null;
}

export function pesoAnterior(c: CorralAPI): number | null {
  const ps = (c.pesadas || []).slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  if (ps.length >= 2) return ps[1].pesoPromedio;
  return c.pesoIngreso ?? null;
}

/** Días restantes hasta la meta de peso al ritmo del GDP real. */
export function diasAFaena(c: CorralAPI): number | null {
  const peso = c.pesoActual ?? c.pesoIngreso;
  if (peso == null || c.pesoObjetivo == null) return null;
  if (peso >= c.pesoObjetivo) return 0;
  const g = gdpReal(c) ?? c.gdpObjetivo;
  if (!g || g <= 0) return null;
  return Math.ceil((c.pesoObjetivo - peso) / g);
}

export function proyFaenaLabel(c: CorralAPI): string {
  const d = diasAFaena(c);
  if (d === null) return "—";
  if (d === 0) return "Faena hoy";
  const f = new Date();
  f.setDate(f.getDate() + d);
  return fmtDia(f);
}

/** Estado visual de un corral (listo / cerca / proceso) según % de la meta. */
export function estadoCorral(c: CorralAPI): "listo" | "cerca" | "proceso" {
  const peso = c.pesoActual ?? c.pesoIngreso ?? 0;
  if (c.pesoObjetivo == null) return "proceso";
  if (peso >= c.pesoObjetivo) return "listo";
  if (peso >= c.pesoObjetivo * 0.92) return "cerca";
  return "proceso";
}

export const estadoConf: Record<string, { label: string; bg: string; color: string }> = {
  listo: { label: "Listo", bg: "#dcfce7", color: "#16a34a" },
  cerca: { label: "Cerca ~", bg: "#fef9c3", color: "#ca8a04" },
  proceso: { label: "En proceso", bg: "var(--mc-surface-3)", color: "var(--mc-text-2)" },
};

export function gdpColor(g: number | null): string {
  if (g == null) return "var(--mc-text-3)";
  return g >= 1.3 ? "#16a34a" : g >= 1.0 ? "#b45309" : "#dc2626";
}

/** Conversión alimenticia = kg alimento (MS) / kg de ganancia. */
export function conversion(c: CorralAPI): number | null {
  const g = gdpReal(c) ?? c.gdpObjetivo;
  const consumo = c.consumoDiario ?? c.racion?.consumoDiario;
  if (!g || g <= 0 || !consumo) return null;
  return Math.round((consumo / g) * 10) / 10;
}

/** Costo por kg ganado = costo diario / GDP. */
export function costoPorKg(c: CorralAPI): number | null {
  const g = gdpReal(c) ?? c.gdpObjetivo;
  const costo = c.costoDiario ?? c.racion?.costoTotal;
  if (!g || g <= 0 || !costo) return null;
  return Math.round((costo / g) * 100) / 100;
}

/** Serie de evolución de peso promedio del hato (todas las pesadas por fecha). */
export function evolucionHato(corrales: CorralAPI[], dias: number): { fecha: string; peso: number; objetivo: number }[] {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - dias);
  // Recolectar pesadas por día (promedio ponderado por cabezas)
  const porDia = new Map<string, { sum: number; cab: number }>();
  for (const c of corrales) {
    for (const p of c.pesadas || []) {
      const d = new Date(p.fecha);
      if (d < desde) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const cab = p.cabezas ?? c.cabezas ?? 1;
      const cur = porDia.get(key) || { sum: 0, cab: 0 };
      cur.sum += p.pesoPromedio * cab;
      cur.cab += cab;
      porDia.set(key, cur);
    }
  }
  const objProm = corrales.filter((c) => c.pesoObjetivo).reduce((s, c) => s + (c.pesoObjetivo || 0), 0) / Math.max(1, corrales.filter((c) => c.pesoObjetivo).length);
  return Array.from(porDia.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({
      fecha: fmtDia(new Date(key + "T00:00:00")),
      peso: Math.round((v.sum / v.cab) * 10) / 10,
      objetivo: Math.round(objProm) || Math.round(v.sum / v.cab),
    }));
}

export const CATEGORIAS_ENGORDE = ["Novillos", "Vaquillonas", "Terneros", "Recría", "Mixto", "Reposición"];
