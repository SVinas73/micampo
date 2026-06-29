/**
 * Catálogo de tratamientos y precios de insumos de referencia (Cono Sur), y el
 * motor de PRESCRIPCIÓN: convierte un riesgo (plaga/enfermedad) en una orden
 * accionable con producto, dosis, costo/ha, pérdida potencial evitada y ROI.
 *
 * Precios de referencia editables; pensado para más adelante leerse de una tabla
 * PrecioInsumo administrable por el usuario. La IA propia puede sobreescribir la
 * recomendación de producto vía la tarea "prescripcion.plaga".
 */

export type CategoriaTratamiento = "Fungicida" | "Insecticida" | "Herbicida";

export type Tratamiento = {
  producto: string;
  principioActivo: string;
  dosis: number; // por hectárea
  unidad: string; // L/ha o kg/ha
  precioUSD: number; // USD por L o kg
  categoria: CategoriaTratamiento;
};

// Rindes de referencia (kg/ha) y precios de grano (USD/ton) — usados para valuar
// la pérdida potencial. Editables / luego desde precios-referencia.
export const RINDE_REF: Record<string, number> = {
  Soja: 2800, Maíz: 8000, Trigo: 3500, Girasol: 1900, Sorgo: 5000, Cebada: 4000, Alfalfa: 12000,
};
export const PRECIO_GRANO_REF: Record<string, number> = {
  Soja: 330, Maíz: 200, Trigo: 230, Girasol: 380, Sorgo: 190, Cebada: 210, Alfalfa: 220,
};

// Tratamiento por defecto según la categoría de la amenaza.
const POR_CATEGORIA: Record<CategoriaTratamiento, Tratamiento> = {
  Fungicida: { producto: "Fungicida triazol + estrobilurina", principioActivo: "Azoxistrobina + Cyproconazole", dosis: 0.5, unidad: "L/ha", precioUSD: 28, categoria: "Fungicida" },
  Insecticida: { producto: "Insecticida (diamida)", principioActivo: "Clorantraniliprole", dosis: 0.1, unidad: "L/ha", precioUSD: 95, categoria: "Insecticida" },
  Herbicida: { producto: "Herbicida total", principioActivo: "Glifosato 48%", dosis: 3, unidad: "L/ha", precioUSD: 5.5, categoria: "Herbicida" },
};

// Tratamientos específicos por palabra clave de la amenaza (nombre común o enfermedad).
const ESPECIFICOS: { clave: RegExp; t: Tratamiento }[] = [
  { clave: /roya/i, t: { producto: "Fungicida triazol + estrobilurina", principioActivo: "Epoxiconazole + Piraclostrobina", dosis: 0.6, unidad: "L/ha", precioUSD: 30, categoria: "Fungicida" } },
  { clave: /mancha|septoria|tizón|cercospora|ojo de rana/i, t: { producto: "Fungicida estrobilurina + triazol", principioActivo: "Azoxistrobina + Tebuconazole", dosis: 0.5, unidad: "L/ha", precioUSD: 26, categoria: "Fungicida" } },
  { clave: /oídio|oidio|cenicilla/i, t: { producto: "Fungicida triazol", principioActivo: "Tebuconazole", dosis: 0.5, unidad: "L/ha", precioUSD: 18, categoria: "Fungicida" } },
  { clave: /esclerotinia|podredumbre|moho/i, t: { producto: "Fungicida específico", principioActivo: "Boscalid + Piraclostrobina", dosis: 0.6, unidad: "L/ha", precioUSD: 42, categoria: "Fungicida" } },
  { clave: /fusari/i, t: { producto: "Fungicida triazol", principioActivo: "Metconazole + Tebuconazole", dosis: 1.0, unidad: "L/ha", precioUSD: 24, categoria: "Fungicida" } },
  { clave: /oruga|isoca|cogollera|bolillera|lagarta|medidora|anticarsia/i, t: { producto: "Insecticida (diamida)", principioActivo: "Clorantraniliprole", dosis: 0.1, unidad: "L/ha", precioUSD: 95, categoria: "Insecticida" } },
  { clave: /chinche/i, t: { producto: "Insecticida piretroide + neonicotinoide", principioActivo: "Lambdacialotrina + Tiametoxam", dosis: 0.2, unidad: "L/ha", precioUSD: 22, categoria: "Insecticida" } },
  { clave: /pulgón|pulgon|áfido/i, t: { producto: "Insecticida sistémico", principioActivo: "Imidacloprid", dosis: 0.15, unidad: "L/ha", precioUSD: 30, categoria: "Insecticida" } },
  { clave: /arañuela|ácaro|acaro|trips/i, t: { producto: "Acaricida/Insecticida", principioActivo: "Abamectina", dosis: 0.3, unidad: "L/ha", precioUSD: 20, categoria: "Insecticida" } },
  { clave: /yuyo|amaranto|rama negra|sorgo de alepo|gramón|capín|raigrás|maleza/i, t: { producto: "Herbicida selectivo", principioActivo: "Glifosato + 2,4-D", dosis: 3.5, unidad: "L/ha", precioUSD: 6, categoria: "Herbicida" } },
];

/** Daño potencial máximo de rinde (fracción) si NO se trata, por categoría. */
const DANIO_MAX: Record<CategoriaTratamiento, number> = { Fungicida: 0.22, Insecticida: 0.16, Herbicida: 0.25 };
const EFICACIA_CONTROL = 0.8; // % de la pérdida que se evita al tratar a tiempo

export function tratamientoPara(amenaza: string, categoria?: CategoriaTratamiento): Tratamiento {
  const esp = ESPECIFICOS.find((e) => e.clave.test(amenaza || ""));
  if (esp) return esp.t;
  if (categoria) return POR_CATEGORIA[categoria];
  return POR_CATEGORIA.Fungicida;
}

export type Prescripcion = {
  producto: string;
  principioActivo: string;
  dosis: string; // "0.5 L/ha"
  costoHa: number; // USD/ha
  perdidaPotencialHa: number; // USD/ha en riesgo si no se trata
  ahorroHa: number; // USD/ha que se evita perder al tratar
  roi: number; // ahorro / costo
  resumen: string; // mensaje accionable
};

/**
 * Genera la prescripción accionable para un riesgo. La pérdida se valúa con el
 * rinde y el precio de grano (pasá precioGranoUSDton si tenés precio de mercado).
 */
export function prescripcionPara(opts: {
  amenaza: string;
  cultivo?: string | null;
  probabilidad: number; // 0-100
  categoria?: CategoriaTratamiento;
  precioGranoUSDton?: number;
  ventana?: string;
}): Prescripcion {
  const t = tratamientoPara(opts.amenaza, opts.categoria);
  const cultivo = opts.cultivo || "Soja";
  const rinde = RINDE_REF[cultivo] ?? 3000; // kg/ha
  const precioGrano = opts.precioGranoUSDton ?? PRECIO_GRANO_REF[cultivo] ?? 250; // USD/ton
  const prob = Math.max(0, Math.min(100, opts.probabilidad)) / 100;
  const danioPct = prob * DANIO_MAX[t.categoria];
  const perdidaPotencialHa = (danioPct * rinde / 1000) * precioGrano; // USD/ha
  const costoHa = Math.round(t.dosis * t.precioUSD * 100) / 100;
  const ahorroHa = Math.round(perdidaPotencialHa * EFICACIA_CONTROL * 100) / 100;
  const roi = costoHa > 0 ? Math.round((ahorroHa / costoHa) * 10) / 10 : 0;
  const resumen =
    `Aplicá ${t.producto} (${t.principioActivo}) a ${t.dosis} ${t.unidad}` +
    `${opts.ventana ? ` ${opts.ventana}` : ""}. ` +
    `Costo ~US$${costoHa}/ha · evitás perder ~US$${Math.round(ahorroHa)}/ha (${Math.round(danioPct * 100)}% del rinde) · ROI ${roi}x.`;
  return { producto: t.producto, principioActivo: t.principioActivo, dosis: `${t.dosis} ${t.unidad}`, costoHa, perdidaPotencialHa: Math.round(perdidaPotencialHa * 100) / 100, ahorroHa, roi, resumen };
}
