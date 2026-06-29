import Anthropic from "@anthropic-ai/sdk";

/**
 * Capa IA central de MiCampo.
 * - Devuelve el cliente de Anthropic solo si hay API key configurada.
 * - Los endpoints deben degradar a un modo demo determinístico cuando no hay key,
 *   marcando la respuesta con `simulado: true`, para que el sistema sea 100%
 *   funcional incluso sin credenciales.
 */

export const IA_MODEL = process.env.MICAMPO_IA_MODEL || "claude-sonnet-4-6";
export const IA_VISION_MODEL = process.env.MICAMPO_IA_VISION_MODEL || "claude-sonnet-4-6";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function iaDisponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/* ============================================================================
 * MODELO PROPIO DE MiCampo (seam para la IA entrenada a medida)
 * ----------------------------------------------------------------------------
 * Toda capacidad de IA del sistema rutea en 3 niveles:
 *    1) modelo propio   → si MICAMPO_MODELO_URL está configurada (tu IA entrenada)
 *    2) Claude          → si hay ANTHROPIC_API_KEY
 *    3) reglas / demo   → siempre, para que nunca se rompa
 *
 * El día que entrenes tu modelo (visión de piezas/cultivos, prescripción, etc.),
 * exponés un endpoint HTTP por "tarea" y seteás MICAMPO_MODELO_URL. No hay que
 * tocar el código de los módulos: cada uno ya llama a `modeloPropio(tarea, ...)`.
 *
 * Contrato del endpoint propio:  POST  {MICAMPO_MODELO_URL}/{tarea}
 *   body: JSON con el payload de la tarea (texto, imagen base64, datos del lote…)
 *   resp: JSON con el MISMO shape que devuelve hoy el módulo (así es drop-in).
 *   Si el modelo aún no cubre esa tarea, que responda 404/501 → cae a Claude.
 * ========================================================================== */
export const MODELO_PROPIO_URL = process.env.MICAMPO_MODELO_URL || "";
export const MODELO_PROPIO_KEY = process.env.MICAMPO_MODELO_KEY || "";

/** Tareas de IA del sistema (identificadores estables para el modelo propio). */
export type TareaIA =
  | "vision.cultivo"      // diagnóstico de enfermedad/plaga en foto de planta
  | "vision.maquinaria"   // diagnóstico de pieza/falla en foto de máquina
  | "vision.factura"      // OCR de comprobantes
  | "vision.animal"       // condición corporal / forraje
  | "prescripcion.plaga"  // recomendación accionable de control (producto/dosis/ROI)
  | "prescripcion.siembra"// plan de siembra
  | "presion.plagas"      // pronóstico de presión de plagas
  | "decisiones.dia"      // feed de decisiones del día
  | "copiloto"            // asistente conversacional
  | "captura.texto"       // texto → registro estructurado (labor)
  | "captura.voz";        // audio (nota de voz) → texto transcripto

export function modeloPropioDisponible(): boolean {
  return Boolean(MODELO_PROPIO_URL);
}

/**
 * Llama al modelo propio de MiCampo para una tarea. Devuelve su JSON, o `null`
 * si no está configurado / no cubre la tarea / falla — para que el caller caiga
 * a Claude o a reglas. Nunca lanza.
 */
export async function modeloPropio<T = unknown>(tarea: TareaIA, payload: unknown): Promise<T | null> {
  if (!MODELO_PROPIO_URL) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const r = await fetch(`${MODELO_PROPIO_URL.replace(/\/$/, "")}/${tarea}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(MODELO_PROPIO_KEY ? { Authorization: `Bearer ${MODELO_PROPIO_KEY}` } : {}) },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/** Extrae el primer bloque JSON de una respuesta de modelo, con tolerancia a texto extra. */
export function parseJsonTolerante<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}
