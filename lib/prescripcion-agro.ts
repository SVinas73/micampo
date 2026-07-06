/**
 * Modelo agronómico de dosis para prescripción variable (VRT).
 *
 * En vez de "dosis base × factor", calcula la dosis por balance de nutrientes:
 *   dosis_fertilizante = (requerimiento_del_cultivo − aporte_del_suelo) / eficiencia / (%nutriente)
 *
 * - Requerimiento: rinde objetivo × coeficiente de extracción/absorción del cultivo.
 * - Aporte del suelo: análisis de suelo real del lote (N-NO3, MO para N; P y K por
 *   suficiencia respecto de un umbral crítico).
 * - El rinde objetivo VARÍA por zona (según el vigor NDVI), lo que genera la dosis
 *   variable: más donde hay más potencial (potenciar) o más donde rinde poco (compensar).
 *
 * Los coeficientes son valores orientativos publicados para la región pampeana; el
 * modelo es transparente (devuelve el detalle del cálculo) y ajustable.
 */

export type Nutriente = "N" | "P" | "K";
export type SueloAnalisis = {
  nitrogeno: number | null;   // N-NO3 (ppm, 0-20 cm)
  fosforo: number | null;     // P Bray (ppm)
  potasio: number | null;     // K intercambiable (ppm)
  pH: number | null;
  materiaOrganica: number | null; // %
} | null;

export type Fertilizante = { etiqueta: string; nutriente: Nutriente; pct: number };

// Fertilizantes comunes (grado N-P2O5-K2O). El "pct" es el del nutriente principal.
const FERTILIZANTES: { re: RegExp; nutriente: Nutriente; pct: number; etiqueta: string }[] = [
  { re: /uan|nitr[oó]geno l[ií]|soluci[oó]n|32-?0-?0/i, nutriente: "N", pct: 32, etiqueta: "UAN (32-0-0)" },
  { re: /nitrato de amonio calc|\bcan\b|27-?0-?0/i, nutriente: "N", pct: 27, etiqueta: "CAN (27-0-0)" },
  { re: /nitrato de amonio|3[34]-?0-?0/i, nutriente: "N", pct: 33.5, etiqueta: "Nitrato de amonio (33-0-0)" },
  { re: /sulfato de amonio|21-?0-?0/i, nutriente: "N", pct: 21, etiqueta: "Sulfato de amonio (21-0-0)" },
  { re: /urea|46-?0-?0/i, nutriente: "N", pct: 46, etiqueta: "Urea (46-0-0)" },
  { re: /\bdap\b|diam[oó]n|18-?46/i, nutriente: "P", pct: 46, etiqueta: "DAP (18-46-0)" },
  { re: /\bmap\b|monoam[oó]n|11-?52/i, nutriente: "P", pct: 52, etiqueta: "MAP (11-52-0)" },
  { re: /super.*triple|\bspt\b|\bsft\b|0-?46-?0/i, nutriente: "P", pct: 46, etiqueta: "Superfosfato triple (0-46-0)" },
  { re: /super.*simple|\bsps\b|\bsfs\b|0-?21-?0/i, nutriente: "P", pct: 21, etiqueta: "Superfosfato simple (0-21-0)" },
  { re: /cloruro de potasio|\bkcl\b|muriato|0-?0-?60/i, nutriente: "K", pct: 60, etiqueta: "Cloruro de potasio (0-0-60)" },
  { re: /sulfato de potasio|0-?0-?50/i, nutriente: "K", pct: 50, etiqueta: "Sulfato de potasio (0-0-50)" },
];

export function detectarFertilizante(nombre: string): Fertilizante | null {
  const n = (nombre || "").trim();
  if (!n) return null;
  for (const f of FERTILIZANTES) if (f.re.test(n)) return { etiqueta: f.etiqueta, nutriente: f.nutriente, pct: f.pct };
  return null;
}

const LEGUMINOSAS = new Set(["Soja", "Alfalfa", "Trébol", "Trebol", "Arveja", "Lenteja", "Garbanzo", "Poroto", "Maní", "Mani", "Vicia"]);
export const esLeguminosa = (cultivo?: string | null) => !!cultivo && LEGUMINOSAS.has(cultivo);

// Rinde de referencia (t/ha de grano) por cultivo — usado si no se indica rinde objetivo.
const RINDE_REF: Record<string, number> = {
  Soja: 3.0, "Maíz": 8.5, Maiz: 8.5, Trigo: 4.0, Cebada: 4.5, Girasol: 2.2, Sorgo: 6.0,
  Avena: 3.2, Centeno: 3.0, Triticale: 3.8, Arroz: 8.0, Canola: 2.5, "Maní": 3.5, Mani: 3.5,
};
export const rindeReferencia = (cultivo?: string | null) => (cultivo ? RINDE_REF[cultivo] : undefined) ?? 4.0;

// Requerimiento de N (kg N por t de grano, incluye absorción total) y extracción en
// grano de P2O5 y K2O (kg por t de grano).
const NUTRI: Record<string, { N: number; P: number; K: number }> = {
  "Maíz": { N: 20, P: 6, K: 5 }, Maiz: { N: 20, P: 6, K: 5 },
  Trigo: { N: 28, P: 8, K: 6 }, Cebada: { N: 26, P: 8, K: 6 },
  Girasol: { N: 40, P: 14, K: 20 }, Sorgo: { N: 22, P: 7, K: 6 },
  Avena: { N: 24, P: 8, K: 6 }, Soja: { N: 0, P: 12, K: 20 },
  Arroz: { N: 22, P: 6, K: 6 }, Canola: { N: 45, P: 14, K: 10 },
};
const nutriDe = (cultivo?: string | null) => (cultivo ? NUTRI[cultivo] : undefined) ?? { N: 22, P: 8, K: 8 };

const MO_REFERENCIA = 2.8; // % de materia orgánica de referencia si no hay análisis (Pampa húmeda)

// N disponible del suelo (kg N/ha): N-NO3 (ppm→kg/ha, 0-20 cm) + mineralización de la MO.
// Sin análisis, estima la mineralización con una MO de referencia (no asume 0, que
// inflaría la dosis) y lo marca como estimado.
function aporteN(suelo: SueloAnalisis): { total: number; detalle: string } {
  if (!suelo) {
    const miner = Math.round(MO_REFERENCIA * 20);
    return { total: miner, detalle: `${miner} kg N/ha estimados por mineralización (MO ref. ${MO_REFERENCIA}%, sin análisis)` };
  }
  const nitrato = suelo.nitrogeno != null ? suelo.nitrogeno * 2.4 : 0; // ppm N-NO3 → kg/ha (0-20 cm)
  const mo = suelo.materiaOrganica != null ? suelo.materiaOrganica : MO_REFERENCIA;
  const miner = mo * 20; // ≈20 kg N/ha por 1% de MO por campaña
  const partes = [
    suelo.nitrogeno != null ? `${Math.round(nitrato)} del suelo (N-NO₃)` : null,
    `${Math.round(miner)} por mineralización (MO ${mo}%)`,
  ].filter(Boolean);
  return { total: Math.round(nitrato + miner), detalle: `${partes.join(" + ")} (kg N/ha)` };
}

// Suficiencia de P/K: repone extracción si está en el umbral; construye si es deficiente;
// reduce si está muy alto.
function sufMult(valorPpm: number | null, critico: number): number {
  if (valorPpm == null) return 1;
  if (valorPpm >= critico * 2) return 0.5;
  if (valorPpm >= critico) return 1;
  return Math.min(2, 1 + (critico - valorPpm) / critico);
}
const CRIT_P = 16, CRIT_K = 130; // ppm — umbrales críticos orientativos (P Bray; K intercambiable)

export type DosisAgro = { dosis: number; requerido: number; aporte: number; detalle: string };

/** Dosis de fertilizante (kg/ha) por balance de nutrientes para un rinde objetivo dado. */
export function dosisAgronomica(opts: {
  fert: Fertilizante; cultivo?: string | null; rinde: number; suelo: SueloAnalisis; eficiencia?: number;
}): DosisAgro {
  const { fert, cultivo, rinde, suelo } = opts;
  const nut = nutriDe(cultivo);

  if (fert.nutriente === "N") {
    if (esLeguminosa(cultivo)) return { dosis: 0, requerido: 0, aporte: 0, detalle: "leguminosa: fija N atmosférico, no requiere fertilización nitrogenada" };
    const requerido = rinde * nut.N;                 // kg N/ha
    const ap = aporteN(suelo);
    const ef = opts.eficiencia ?? 0.65;              // eficiencia de uso del N
    const neto = Math.max(0, requerido - ap.total) / ef;
    return { dosis: Math.round(neto / (fert.pct / 100)), requerido: Math.round(requerido), aporte: ap.total, detalle: ap.detalle };
  }
  if (fert.nutriente === "P") {
    const removal = rinde * nut.P;                   // kg P2O5/ha
    const mult = sufMult(suelo?.fosforo ?? null, CRIT_P);
    const ef = opts.eficiencia ?? 0.9;
    const p2o5 = (removal * mult) / ef;
    const det = suelo?.fosforo != null ? `P suelo ${suelo.fosforo} ppm vs crítico ${CRIT_P} (factor ${mult.toFixed(2)})` : "sin dato de P: repone extracción";
    return { dosis: Math.round(p2o5 / (fert.pct / 100)), requerido: Math.round(removal), aporte: 0, detalle: det };
  }
  const removal = rinde * nut.K;                     // kg K2O/ha
  const mult = sufMult(suelo?.potasio ?? null, CRIT_K);
  const ef = opts.eficiencia ?? 0.9;
  const k2o = (removal * mult) / ef;
  const det = suelo?.potasio != null ? `K suelo ${suelo.potasio} ppm vs crítico ${CRIT_K} (factor ${mult.toFixed(2)})` : "sin dato de K: repone extracción";
  return { dosis: Math.round(k2o / (fert.pct / 100)), requerido: Math.round(removal), aporte: 0, detalle: det };
}

/**
 * Factor de rinde por zona según su NDVI relativo al promedio del lote y la estrategia:
 * - potenciar: más rinde objetivo donde el vigor es alto (feed the potential).
 * - compensar: más rinde objetivo donde el vigor es bajo (intentar levantar la zona).
 */
export function factorRindeZona(ndviZona: number, ndviMedio: number, estrategia: "compensar" | "potenciar"): number {
  const rel = ndviMedio > 0 ? ndviZona / ndviMedio - 1 : 0; // desvío relativo respecto al promedio
  const k = 0.6;
  const f = estrategia === "potenciar" ? 1 + rel * k : 1 - rel * k;
  return Math.max(0.75, Math.min(1.25, f));
}
