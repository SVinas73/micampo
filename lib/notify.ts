/**
 * Canal de notificaciones salientes de MiCampo (alertas prescriptivas al teléfono).
 *
 * Soporta WhatsApp Cloud API (Meta) vía variables de entorno. Todo env-gated: si no
 * está configurado, las funciones devuelven false sin romper nada (el sistema sigue
 * 100% funcional sin credenciales). El día que conectes tu número, seteás:
 *   MICAMPO_WHATSAPP_TOKEN        token permanente de la app de Meta
 *   MICAMPO_WHATSAPP_PHONE_ID     id del número de teléfono (phone_number_id)
 *   MICAMPO_WHATSAPP_TO           (opcional) destinatario por defecto para el brief diario
 *
 * Pensado para enchufar también push/SMS a futuro detrás de la misma interfaz.
 */

export const WHATSAPP_TOKEN = process.env.MICAMPO_WHATSAPP_TOKEN || "";
export const WHATSAPP_PHONE_ID = process.env.MICAMPO_WHATSAPP_PHONE_ID || "";
export const WHATSAPP_TO_DEFAULT = process.env.MICAMPO_WHATSAPP_TO || "";

export function whatsappConfigurado(): boolean {
  return Boolean(WHATSAPP_TOKEN && WHATSAPP_PHONE_ID);
}

/** Envía un mensaje de texto por WhatsApp. Devuelve true si se envió. Nunca lanza. */
export async function enviarWhatsApp(to: string, mensaje: string): Promise<boolean> {
  if (!whatsappConfigurado() || !to) return false;
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: mensaje.slice(0, 4096) },
      }),
    });
    return r.ok;
  } catch (e) {
    console.error("WhatsApp enviar falló:", e);
    return false;
  }
}

/**
 * Descarga un archivo multimedia de WhatsApp (p. ej. una nota de voz) y lo devuelve
 * en base64 para transcribir. Requiere el token. Devuelve null si falla.
 */
export async function descargarMediaWhatsApp(mediaId: string): Promise<{ base64: string; mimeType: string } | null> {
  if (!WHATSAPP_TOKEN || !mediaId) return null;
  try {
    const meta = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    });
    if (!meta.ok) return null;
    const { url, mime_type } = await meta.json();
    if (!url) return null;
    const bin = await fetch(url, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
    if (!bin.ok) return null;
    const buf = Buffer.from(await bin.arrayBuffer());
    return { base64: buf.toString("base64"), mimeType: mime_type || "audio/ogg" };
  } catch (e) {
    console.error("WhatsApp descargar media falló:", e);
    return null;
  }
}
