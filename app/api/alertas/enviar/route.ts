import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { construirDecisiones } from "@/lib/decisiones";
import { enviarWhatsApp, whatsappConfigurado, WHATSAPP_TO_DEFAULT } from "@/lib/notify";

export const maxDuration = 30;

/**
 * POST /api/alertas/enviar — Empuja al teléfono (WhatsApp) las decisiones más
 * urgentes del día (alta prioridad, y media si hay lugar). Es la "alerta
 * prescriptiva al teléfono": el productor recibe la ORDEN de actuar sin entrar a
 * la app. Si WhatsApp no está configurado, devuelve el brief igual (enviado:false)
 * para que la UI lo muestre. Pensado para dispararse manualmente o por un cron.
 * Body opcional: { to?: string } (destinatario; por defecto MICAMPO_WHATSAPP_TO).
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const to: string = body?.to || WHATSAPP_TO_DEFAULT;

    const { decisiones } = await construirDecisiones(session.user.id);
    const urgentes = decisiones.filter((d) => d.prioridad === "alta");
    const seleccion = (urgentes.length ? urgentes : decisiones).slice(0, 4);

    if (seleccion.length === 0) {
      return NextResponse.json({ enviado: false, sinAlertas: true, mensaje: "Sin alertas urgentes hoy." });
    }

    const fecha = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const lineas = seleccion.map((d) => `• *${d.titulo}*${d.lote ? ` (${d.lote})` : ""}\n  ${d.detalle}`);
    const mensaje = `🌿 *MiCampo — Alertas del día*\n${fecha}\n\n${lineas.join("\n\n")}\n\nAbrí la app para actuar.`;

    let enviado = false;
    if (whatsappConfigurado() && to) {
      enviado = await enviarWhatsApp(to, mensaje);
    }
    return NextResponse.json({ enviado, configurado: whatsappConfigurado(), cantidad: seleccion.length, mensaje });
  } catch (error) {
    console.error("Error al enviar alertas:", error);
    return NextResponse.json({ error: "Error al enviar alertas" }, { status: 500 });
  }
}
