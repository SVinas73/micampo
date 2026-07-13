// Tipos y helpers del módulo Producción Lechera.
// Toda la vista deriva de /api/animales, /api/registros-lecheros y
// /api/boletas-lecheras — sin datos demo.

import { AnimalAPI } from "./tipos";

export type RegLecheroAPI = {
  id: string;
  animalId: string;
  fecha: string;
  litros: number;
  turno?: string | null;
  calidad?: string | null;
  observaciones?: string | null;
  animal?: { caravana: string; raza?: string | null };
};

export type BoletaAPI = {
  id: string;
  fecha: string;
  tipo: string; // retiro | calidad
  numero?: string | null;
  industria?: string | null;
  litros?: number | null;
  grasa?: number | null;
  proteina?: number | null;
  ccs?: number | null;
  ufc?: number | null;
  temperatura?: number | null;
  precioLitro?: number | null;
  importe?: number | null;
  notas?: string | null;
};

export const fechaStrDe = (iso: string) => iso.slice(0, 10);
export const hoyStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const diasDesde = (iso: string | null | undefined): number | null =>
  iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000))) : null;

/* ── Modelo de Wood: y(t) = a·t^b·e^(−c·t) ── */

export type WoodParams = { a: number; b: number; c: number };

/** Curva de referencia estándar (parámetros de Wood de literatura para vaca lechera). */
export const WOOD_REFERENCIA: WoodParams = { a: 14.25, b: 0.228, c: 0.006 };

export const wood = (t: number, p: WoodParams) => (t <= 0 ? 0 : p.a * Math.pow(t, p.b) * Math.exp(-p.c * t));

/**
 * Ajusta el modelo de Wood por mínimos cuadrados sobre ln(y) = ln a + b·ln t − c·t.
 * Necesita ≥5 puntos con litros>0. Devuelve null si el ajuste no es confiable.
 */
export function fitWood(points: { del: number; litros: number }[]): WoodParams | null {
  const pts = points.filter((p) => p.del > 0 && p.litros > 0);
  if (pts.length < 5) return null;
  // X = [1, ln t, -t], resolver X'X θ = X'y con θ = [ln a, b, c]
  let s11 = 0, s12 = 0, s13 = 0, s22 = 0, s23 = 0, s33 = 0, y1 = 0, y2 = 0, y3 = 0;
  for (const p of pts) {
    const lt = Math.log(p.del);
    const t = -p.del;
    const ly = Math.log(p.litros);
    s11 += 1; s12 += lt; s13 += t;
    s22 += lt * lt; s23 += lt * t; s33 += t * t;
    y1 += ly; y2 += ly * lt; y3 += ly * t;
  }
  // Resolver el sistema 3×3 simétrico por eliminación
  const M = [
    [s11, s12, s13, y1],
    [s12, s22, s23, y2],
    [s13, s23, s33, y3],
  ];
  for (let col = 0; col < 3; col++) {
    let piv = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-9) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      for (let k = col; k < 4; k++) M[r][k] -= f * M[col][k];
    }
  }
  const lnA = M[0][3] / M[0][0];
  const b = M[1][3] / M[1][1];
  const c = M[2][3] / M[2][2];
  const a = Math.exp(lnA);
  if (!isFinite(a) || !isFinite(b) || !isFinite(c) || a <= 0 || a > 80 || b < -0.5 || b > 1.5 || c < -0.02 || c > 0.05) return null;
  return { a, b, c };
}

export const integrarWood = (p: WoodParams, hasta: number) => {
  let s = 0;
  for (let t = 1; t <= hasta; t++) s += wood(t, p);
  return s;
};

/* ── Vacas lecheras derivadas ── */

export type SerieDia = { fecha: string; litros: number; turnos: Record<string, number> };

export type VacaLechera = {
  dbId: string;
  caravana: string; // sin '#'
  raza: string;
  lote: string;
  del: number | null;
  lactancia: number; // nº de partos
  serie: SerieDia[]; // totales diarios, asc
  hoy: number | null; // litros del último día con registro
  ultimoRegistro: string | null; // fecha del último registro
  prom7: number | null;
  pct: number | null; // % vs curva esperada (si hay DEL)
  estado: string; // En pico | Media | Declinando | Próx. seca | Bajo curva | Seca | Sin datos
  enOrdenne: boolean;
  fechaEsperadaParto: string | null;
  ultimoParto: string | null;
  delAnterior: { del: number; litros: number }[]; // lactancia anterior (previa al último parto)
  puntosDEL: { del: number; litros: number }[]; // lactancia actual (para ajustar Wood)
};

export function estadoLactancia(del: number | null, pct: number | null): string {
  if (pct !== null && pct < 80) return "Bajo curva";
  if (del === null) return "Sin datos";
  if (del >= 270) return "Próx. seca";
  if (del <= 90) return "En pico";
  if (del <= 180) return "Media";
  return "Declinando";
}

export function plEstBadge(e: string): { bg: string; tc: string; b: string } {
  if (e === "En pico") return { bg: "var(--mc-green-50)", tc: "var(--mc-green-700)", b: "var(--mc-green-200)" };
  if (e === "Media") return { bg: "var(--mc-blue-bg)", tc: "var(--mc-blue)", b: "rgba(44,107,184,.2)" };
  if (e === "Declinando") return { bg: "var(--mc-surface-3)", tc: "var(--mc-text-2)", b: "var(--mc-line-2)" };
  if (e === "Próx. seca") return { bg: "var(--mc-amber-bg)", tc: "var(--mc-amber)", b: "rgba(196,132,16,.2)" };
  if (e === "Bajo curva") return { bg: "var(--mc-red-bg)", tc: "var(--mc-red)", b: "rgba(201,52,52,.2)" };
  return { bg: "var(--mc-surface-3)", tc: "var(--mc-text-2)", b: "var(--mc-line-2)" };
}

export function plVsCfg(p: number): { c: string; pre: string; bc: string } {
  if (p >= 90) return { c: "var(--mc-green-600)", pre: "", bc: "#16a34a" };
  if (p >= 75) return { c: "var(--mc-amber)", pre: "~", bc: "#c48410" };
  return { c: "var(--mc-red)", pre: "", bc: "#c93434" };
}

export function plDelColor(d: number): string {
  if (d >= 30 && d <= 90) return "#16a34a";
  if (d > 90 && d <= 180) return "#2c6bb8";
  return "#b4bdb7";
}

/**
 * Deriva las vacas lecheras del rodeo real: hembras con registros de leche o
 * con parto registrado. La curva esperada se pasa como parámetro (ajuste del
 * rodeo o curva de referencia).
 */
export function derivarVacas(animales: AnimalAPI[], registros: RegLecheroAPI[], esperada: WoodParams): VacaLechera[] {
  const porAnimal = new Map<string, RegLecheroAPI[]>();
  for (const r of registros) {
    if (!porAnimal.has(r.animalId)) porAnimal.set(r.animalId, []);
    porAnimal.get(r.animalId)!.push(r);
  }

  const out: VacaLechera[] = [];
  for (const a of animales) {
    // Animales dados de baja no participan
    if (a.fechaBaja || ["Vendido", "Muerto", "Baja"].includes(a.estado)) continue;
    if (a.sexo !== "Hembra" && a.sexo !== "H") continue;
    const regs = porAnimal.get(a.id) || [];
    const ultimoParto = a.historialReproductivo?.ultimoParto || null;
    if (regs.length === 0 && !ultimoParto) continue;

    // Serie diaria (total por día, con detalle por turno)
    const porDia = new Map<string, SerieDia>();
    for (const r of regs) {
      const f = fechaStrDe(r.fecha);
      if (!porDia.has(f)) porDia.set(f, { fecha: f, litros: 0, turnos: {} });
      const d = porDia.get(f)!;
      d.litros += r.litros;
      const t = r.turno || "Sin turno";
      d.turnos[t] = (d.turnos[t] || 0) + r.litros;
    }
    const serie = Array.from(porDia.values()).sort((x, y) => x.fecha.localeCompare(y.fecha));

    const del = diasDesde(ultimoParto);
    const ultimo = serie.length ? serie[serie.length - 1] : null;
    const ult7 = serie.slice(-7);
    const prom7 = ult7.length ? ult7.reduce((s, d) => s + d.litros, 0) / ult7.length : null;
    const hoy = ultimo ? ultimo.litros : null;

    // Puntos (DEL, litros) de la lactancia actual y la anterior
    const puntosDEL: { del: number; litros: number }[] = [];
    const delAnterior: { del: number; litros: number }[] = [];
    if (ultimoParto) {
      const parto = new Date(fechaStrDe(ultimoParto) + "T00:00:00").getTime();
      for (const d of serie) {
        const t = Math.round((new Date(d.fecha + "T00:00:00").getTime() - parto) / (24 * 3600 * 1000));
        if (t > 0 && t <= 400) puntosDEL.push({ del: t, litros: d.litros });
        else if (t <= 0) {
          // registro previo al último parto → lactancia anterior (DEL estimado hacia atrás con ciclo de 12,5 meses)
          const tPrev = t + 380;
          if (tPrev > 0 && tPrev <= 400) delAnterior.push({ del: tPrev, litros: d.litros });
        }
      }
    }

    const esperadoHoy = del !== null ? wood(Math.min(del, 305), esperada) : null;
    const pct = hoy !== null && esperadoHoy && esperadoHoy > 0 ? Math.round((hoy / esperadoHoy) * 100) : null;

    const dUlt = ultimo ? diasDesde(ultimo.fecha + "T00:00:00") : null;
    const enOrdenne = dUlt !== null && dUlt <= 21 && (del === null || del <= 320);
    const seca = !enOrdenne && ultimoParto !== null;

    out.push({
      dbId: a.id,
      caravana: a.caravana.replace(/^#/, ""),
      raza: a.raza || "—",
      lote: a.tropa?.nombre || a.ubicacion || "Sin lote",
      del,
      lactancia: a.historialReproductivo?.totalPartos || 0,
      serie,
      hoy,
      ultimoRegistro: ultimo ? ultimo.fecha : null,
      prom7: prom7 !== null ? Math.round(prom7 * 10) / 10 : null,
      pct,
      estado: seca ? "Seca" : estadoLactancia(del, pct),
      enOrdenne,
      fechaEsperadaParto: a.historialReproductivo?.fechaEsperadaParto || null,
      ultimoParto,
      delAnterior,
      puntosDEL,
    });
  }
  return out;
}

/* ── Turnos de ordeñe (derivados de registros reales + configuración local) ── */

export type TurnoDef = { nombre: string; hora: string; turnoKey: string; extra?: boolean; nota?: string };

export const TURNOS_BASE: TurnoDef[] = [
  { nombre: "1er Ordeñe", hora: "06:00", turnoKey: "Mañana" },
  { nombre: "2do Ordeñe", hora: "13:00", turnoKey: "Tarde" },
  { nombre: "3er Ordeñe", hora: "20:00", turnoKey: "Noche" },
];

const LS_TURNOS = () => `mc-pl-turnos-extra-${hoyStr()}`;
const LS_INICIADOS = () => `mc-pl-turnos-iniciados-${hoyStr()}`;
const LS_PENDIENTES = () => `mc-pl-turnos-pendientes-${hoyStr()}`;

export function turnosExtraHoy(): TurnoDef[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_TURNOS()) || "[]") as TurnoDef[];
  } catch {
    return [];
  }
}
export function agregarTurnoExtra(t: TurnoDef) {
  const cur = turnosExtraHoy();
  localStorage.setItem(LS_TURNOS(), JSON.stringify([...cur, { ...t, extra: true }]));
}
export function turnosIniciados(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_INICIADOS()) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}
export function marcarTurnoIniciado(nombre: string, hora: string) {
  const cur = turnosIniciados();
  cur[nombre] = hora;
  localStorage.setItem(LS_INICIADOS(), JSON.stringify(cur));
}
export function turnosPendientes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_PENDIENTES()) || "[]") as string[];
  } catch {
    return [];
  }
}
export function setTurnosPendientes(nombres: string[]) {
  localStorage.setItem(LS_PENDIENTES(), JSON.stringify(nombres));
}

export type TurnoEstado = "Completado" | "En Curso" | "Pendiente";

/** Estado real del turno: registros de hoy con ese turno → Completado; iniciado sin registros → En Curso. */
export function estadoTurno(def: TurnoDef, registrosHoy: RegLecheroAPI[], iniciados: Record<string, string>): { estado: TurnoEstado; litros: number; vacas: number } {
  const delTurno = registrosHoy.filter((r) => (r.turno || "") === def.turnoKey || (r.turno || "") === def.nombre);
  const litros = delTurno.reduce((s, r) => s + r.litros, 0);
  const vacas = new Set(delTurno.map((r) => r.animalId)).size;
  if (litros > 0) return { estado: "Completado", litros, vacas };
  if (iniciados[def.nombre]) return { estado: "En Curso", litros, vacas };
  return { estado: "Pendiente", litros, vacas };
}

export const nfLt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
