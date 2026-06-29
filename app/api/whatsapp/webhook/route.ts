import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { interpretarNota, transcribirVoz } from "@/lib/captura";
import { enviarWhatsApp, descargarMediaWhatsApp } from "@/lib/notify";

export const maxDuration = 60;

/**
 * Webhook de WhatsApp (interfaz invisible de MiCampo).
 * El productor manda una nota — de texto o de voz — y MiCampo la interpreta y la
 * registra como labor en el cuaderno de campo, sin abrir la app. Responde por el
 * mismo chat confirmando (o pidiendo el lote si no lo dedujo).
 *
 * Flujo: WhatsApp → (voz) transcripción [modelo propio] → interpretación
 *        [modelo propio → Claude → heurística] → crea labor → responde.
 *
 * Env requeridas para activar (sin ellas el endpoint queda inerte y seguro):
 *   MICAMPO_WHATSAPP_VERIFY_TOKEN  token de verificación del webhook (Meta)
 *   MICAMPO_WHATSAPP_USER_ID       userId dueño de la cuenta (mono-tenant)
 *   + las de envío en lib/notify (TOKEN, PHONE_ID)
 */

const VERIFY_TOKEN = process.env.MICAMPO_WHATSAPP_VERIFY_TOKEN || "";
const WHATSAPP_USER_ID = process.env.MICAMPO_WHATSAPP_USER_ID || "";

/** Verificación del webhook (Meta hace un GET con hub.challenge). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && VERIFY_TOKEN && token === VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    // Siempre 200 a Meta para que no reintente; el trabajo se hace best-effort.
    if (!WHATSAPP_USER_ID) return NextResponse.json({ ok: true, inactivo: true });

    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return NextResponse.json({ ok: true });
    const from: string = message.from;

    // 1) Obtener el texto de la nota (texto directo o transcripción de voz).
    let texto = "";
    if (message.type === "text") {
      texto = message.text?.body || "";
    } else if (message.type === "audio" || message.type === "voice") {
      const mediaId = message.audio?.id || message.voice?.id;
      const media = mediaId ? await descargarMediaWhatsApp(mediaId) : null;
      if (media) {
        texto = (await transcribirVoz(media.base64, media.mimeType)) || "";
      }
      if (!texto) {
        await enviarWhatsApp(from, "Recibí tu nota de voz pero todavía no puedo transcribirla. Escribime la labor en texto (ej: \"sembré soja en el Lote Norte 1 hoy\") y la registro al toque.");
        return NextResponse.json({ ok: true });
      }
    } else {
      await enviarWhatsApp(from, "Mandame una nota de texto o de voz contándome qué hiciste en el campo y la registro en tu cuaderno.");
      return NextResponse.json({ ok: true });
    }

    // 2) Interpretar y registrar.
    const lotes = (await prisma.lote.findMany({ where: { userId: WHATSAPP_USER_ID } })).map((l) => ({ id: l.id, nombre: l.nombre, ha: l.hectareas || 0 }));
    const res = await interpretarNota(texto, lotes.map((l) => ({ id: l.id, nombre: l.nombre })));
    const draft = res.labor;

    if (!draft.loteId) {
      const nombres = lotes.slice(0, 8).map((l) => `• ${l.nombre}`).join("\n");
      await enviarWhatsApp(from, `Entendí: *${draft.tipoLabor}*. ¿En qué lote? Respondé con el nombre.\n${nombres || "(no tenés lotes cargados todavía)"}`);
      return NextResponse.json({ ok: true });
    }

    const lote = lotes.find((l) => l.id === draft.loteId);
    await prisma.labor.create({
      data: {
        tipo: draft.tipoLabor,
        fecha: new Date(draft.fechaISO),
        loteId: draft.loteId,
        superficieTrabajada: lote?.ha || 0,
        descripcion: draft.descripcion || draft.tipoLabor,
        estado: "Completada",
        userId: WHATSAPP_USER_ID,
        observaciones: "Registrada por WhatsApp",
      },
    });
    await enviarWhatsApp(from, `✅ Registrado en tu cuaderno: *${draft.tipoLabor}* en *${lote?.nombre}* (${draft.fechaISO}). Confianza ${res.confianza}%.`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en webhook WhatsApp:", error);
    return NextResponse.json({ ok: true });
  }
}
