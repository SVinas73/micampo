// Tipos y helpers del módulo Genética.
// Derivan de /api/reproductores (toros con registro genético + crías),
// /api/animales (hembras y crías) y /api/analisis-roi-genetico.

export type RegGeneticoLite = {
  valorGeneticoEstimado?: number | null;
  gananciaEsperada?: number | null;
  pesoAdultoEsperado?: number | null;
  produccionLecheEsperada?: number | null;
  razaPura?: boolean | null;
  registroGenealogia?: string | null;
  temperamento?: string | null;
  facilidadParto?: string | null;
  habilidadMaterna?: string | null;
};

export type ReproductorAPI = {
  id: string;
  caravana: string;
  nombre?: string | null;
  raza?: string | null;
  registroGenetico?: RegGeneticoLite | null;
  crias: number;
  uso: number;
};

export type ROIAPI = {
  id: string;
  reproductorId: string;
  periodo: string;
  costoAdquisicion?: number | null;
  costoMantenimiento: number;
  costoServicios: number;
  inversionTotal: number;
  numeroDescendientes: number;
  numeroVendidos: number;
  ingresoVentas: number;
  valorAgregadoGenetica?: number | null;
  ingresoTotal: number;
  roi?: number | null;
  reproductor?: { caravana: string; nombre?: string | null; raza?: string | null };
};

/** DEP Leche (proxy): producción lechera esperada o EBV. */
export function depLeche(r: ReproductorAPI): number | null {
  const g = r.registroGenetico;
  if (!g) return null;
  if (g.produccionLecheEsperada != null) return Math.round(g.produccionLecheEsperada * 10) / 10;
  if (g.valorGeneticoEstimado != null) return Math.round(g.valorGeneticoEstimado * 10) / 10;
  return null;
}

/** DEP Peso destete (proxy): ganancia diaria esperada ×205 días, o peso adulto. */
export function depPeso(r: ReproductorAPI): number | null {
  const g = r.registroGenetico;
  if (!g) return null;
  if (g.gananciaEsperada != null) return Math.round(g.gananciaEsperada * 205);
  if (g.pesoAdultoEsperado != null) return Math.round(g.pesoAdultoEsperado * 0.45);
  return null;
}

export function fmtDep(v: number | null): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v}`;
}

export const RAZA_COLOR_GEN: Record<string, string> = {
  Angus: "var(--mc-green-800)",
  "Angus Negro": "var(--mc-green-800)",
  "Angus Rojo": "var(--mc-green-700)",
  Hereford: "var(--mc-green-600)",
  Brangus: "var(--mc-green-400)",
  Braford: "var(--mc-green-500)",
  "Cruza Zebu": "var(--mc-orange-500)",
};
export const colorRaza = (r?: string | null) => (r ? RAZA_COLOR_GEN[r] || "var(--mc-text-3)" : "var(--mc-text-3)");

/** Hembra derivada de /api/animales para la sugerencia de cruza. */
export type HembraLite = { id: string; caravana: string; nombre?: string | null; raza?: string | null; objetivo: "Leche" | "Carne" };

/** Recomienda toros para una hembra: ordena por el DEP relevante + riesgo de consanguinidad por raza. */
export function recomendarToros(hembra: HembraLite, toros: ReproductorAPI[]) {
  const metric = hembra.objetivo === "Leche" ? depLeche : depPeso;
  return [...toros]
    .filter((t) => metric(t) != null)
    .sort((a, b) => (metric(b) || 0) - (metric(a) || 0))
    .slice(0, 3)
    .map((t) => ({
      ...t,
      riesgo: t.raza && t.raza === hembra.raza ? "Medio" : "Bajo",
    }));
}
