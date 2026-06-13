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
