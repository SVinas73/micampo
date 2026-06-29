import { getAnthropic, IA_MODEL, parseJsonTolerante, modeloPropio } from "@/lib/ia";

/**
 * Intérprete de notas de campo (texto libre / voz) → labor estructurada.
 * Núcleo compartido por la captura rápida (modal) y la interfaz por WhatsApp.
 * Rutea en 3 niveles: modelo propio de MiCampo → Claude → heurística por palabras
 * clave. NO persiste: devuelve un borrador para confirmar/crear con /api/labores.
 */

export const TIPOS_LABOR = ["Siembra", "Pulverización", "Fertilización", "Cosecha", "Labranza", "Riego", "Monitoreo"];

export type LoteRef = { id: string; nombre: string };

export type LaborDraft = {
  tipoLabor: string;
  loteNombre: string | null;
  loteId: string | null;
  fechaISO: string;
  descripcion: string;
};

export type CapturaResultado = {
  tipo: "labor";
  labor: LaborDraft;
  confianza: number;
  resumen: string;
  simulado: boolean;
  fuente?: string;
};

function fechaRelativa(texto: string): string {
  const hoy = new Date();
  const t = texto.toLowerCase();
  if (t.includes("ayer")) hoy.setDate(hoy.getDate() - 1);
  else if (t.includes("mañana")) hoy.setDate(hoy.getDate() + 1);
  return hoy.toISOString().split("T")[0];
}

/** Empareja el nombre de lote mencionado contra la lista real del usuario. */
function matchLote(nombre: string | null | undefined, lotes: LoteRef[]): LoteRef | undefined {
  if (!nombre) return undefined;
  const n = nombre.toLowerCase();
  return lotes.find((l) => l.nombre.toLowerCase() === n) || lotes.find((l) => l.nombre.toLowerCase().includes(n));
}

export function parseHeuristico(texto: string, lotes: LoteRef[]): CapturaResultado {
  const t = texto.toLowerCase();
  const tipo = TIPOS_LABOR.find((x) => t.includes(x.toLowerCase())) ||
    (t.includes("sembr") ? "Siembra" : t.includes("fumig") || t.includes("pulver") ? "Pulverización" :
      t.includes("fertiliz") ? "Fertilización" : t.includes("cosech") ? "Cosecha" : t.includes("rieg") ? "Riego" : "Monitoreo");
  const lote = lotes.find((l) => t.includes(l.nombre.toLowerCase())) ||
    lotes.find((l) => {
      const num = l.nombre.match(/\d+/)?.[0];
      return num && new RegExp(`lote\\s*${num}\\b`).test(t);
    });
  return {
    tipo: "labor",
    labor: {
      tipoLabor: tipo,
      loteNombre: lote?.nombre || null,
      loteId: lote?.id || null,
      fechaISO: fechaRelativa(texto),
      descripcion: texto.trim(),
    },
    confianza: lote ? 70 : 45,
    resumen: lote ? `${tipo} en ${lote.nombre}` : `${tipo} (indicá el lote)`,
    simulado: true,
  };
}

/**
 * Interpreta una nota de campo en una labor estructurada.
 * @param simuladoSiSinIA marca simulado:true cuando no hay ninguna IA disponible.
 */
export async function interpretarNota(texto: string, lotes: LoteRef[]): Promise<CapturaResultado> {
  // 1) Modelo propio de MiCampo (NLP entrenado a medida).
  const propio = await modeloPropio<Partial<LaborDraft> & { confianza?: number }>("captura.texto", {
    texto, lotes: lotes.map((l) => l.nombre),
  });
  if (propio?.tipoLabor) {
    const lote = matchLote(propio.loteNombre, lotes);
    const tipo = TIPOS_LABOR.includes(propio.tipoLabor) ? propio.tipoLabor : "Monitoreo";
    return {
      tipo: "labor",
      labor: { tipoLabor: tipo, loteNombre: lote?.nombre || null, loteId: lote?.id || null, fechaISO: propio.fechaISO || fechaRelativa(texto), descripcion: propio.descripcion || texto.trim() },
      confianza: propio.confianza ?? 80,
      resumen: lote ? `${tipo} en ${lote.nombre}` : `${tipo} (indicá el lote)`,
      simulado: false,
      fuente: "modelo-propio",
    };
  }

  // 2) Claude.
  const anthropic = getAnthropic();
  if (!anthropic) return parseHeuristico(texto, lotes);

  try {
    const res = await anthropic.messages.create({
      model: IA_MODEL,
      max_tokens: 500,
      system: "Interpretás notas de campo en español rioplatense y las convertís en una labor agronómica estructurada. Devolvés SOLO JSON.",
      messages: [{
        role: "user",
        content: `Nota del productor: "${texto}"

Lotes disponibles: ${JSON.stringify(lotes.map((l) => l.nombre))}
Tipos de labor válidos: ${JSON.stringify(TIPOS_LABOR)}
Fecha de hoy: ${new Date().toISOString().split("T")[0]}

Devolvé un JSON:
{
  "tipoLabor": "uno de los tipos válidos",
  "loteNombre": "el nombre EXACTO del lote de la lista que mejor coincida, o null",
  "fechaISO": "YYYY-MM-DD (interpretá 'hoy', 'ayer', 'mañana')",
  "descripcion": "resumen corto y claro de lo que se hizo",
  "confianza": 0-100
}`,
      }],
    });
    const text = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const p = parseJsonTolerante<Partial<LaborDraft> & { confianza?: number }>(text);
    if (p?.tipoLabor) {
      const lote = matchLote(p.loteNombre, lotes);
      const tipo = TIPOS_LABOR.includes(p.tipoLabor) ? p.tipoLabor : "Monitoreo";
      return {
        tipo: "labor",
        labor: { tipoLabor: tipo, loteNombre: lote?.nombre || null, loteId: lote?.id || null, fechaISO: p.fechaISO || fechaRelativa(texto), descripcion: p.descripcion || texto.trim() },
        confianza: p.confianza ?? 60,
        resumen: lote ? `${tipo} en ${lote.nombre}` : `${tipo} (indicá el lote)`,
        simulado: false,
      };
    }
  } catch (e) {
    console.error("Captura IA falló, usando heurística:", e);
  }
  return { ...parseHeuristico(texto, lotes), simulado: false };
}

/**
 * Transcribe una nota de voz (audio) a texto. Usa el modelo propio de MiCampo si
 * está configurado (tarea "captura.voz"). Sin él devuelve null: el caller decide
 * cómo degradar (p. ej. pedir que escriban la nota). El navegador ya transcribe
 * localmente con Web Speech API en la captura rápida; esto cubre el canal WhatsApp.
 */
export async function transcribirVoz(audioBase64: string, mimeType: string): Promise<string | null> {
  const r = await modeloPropio<{ texto?: string; transcript?: string }>("captura.voz", { audioBase64, mimeType });
  return r?.texto || r?.transcript || null;
}
