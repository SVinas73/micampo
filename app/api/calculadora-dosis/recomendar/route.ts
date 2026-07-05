import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

export const maxDuration = 30;

/**
 * Recomendación IA de dosis por lote. Analiza el contexto REAL del lote
 * (cultivo, superficie, última siembra, alertas de plaga vigentes y análisis de
 * suelo) y recomienda producto + dosis con criterio agronómico.
 * Requiere ANTHROPIC_API_KEY; sin key responde { simulado: true } (mensaje honesto).
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { loteId } = await request.json();
    if (!loteId) return NextResponse.json({ error: "Falta el lote" }, { status: 400 });

    const lote = await prisma.lote.findUnique({
      where: { id: loteId },
      include: {
        siembras: { orderBy: { fechaSiembra: "desc" }, take: 1 },
        analisisSuelo: { orderBy: { fechaAnalisis: "desc" }, take: 1 },
      },
    });
    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    const alertas = await prisma.alertaPlaga.findMany({
      where: { loteId, userId: session.user.id, estado: { notIn: ["Resuelta", "Falsa"] } },
      orderBy: { fechaDeteccion: "desc" },
      take: 5,
      select: { plaga: true, tipo: true, severidad: true },
    });

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json({
        simulado: true,
        mensaje: "La recomendación IA de dosis requiere configurar ANTHROPIC_API_KEY.",
      });
    }

    const suelo = lote.analisisSuelo[0];
    const contexto = {
      lote: lote.nombre,
      hectareas: lote.hectareas,
      cultivo: lote.cultivo || lote.siembras[0]?.cultivo || null,
      diasDesdeSiembra: lote.siembras[0]?.fechaSiembra
        ? Math.round((Date.now() - new Date(lote.siembras[0].fechaSiembra).getTime()) / 86400000)
        : null,
      alertasVigentes: alertas,
      suelo: suelo ? { pH: suelo.pH, materiaOrganica: suelo.materiaOrganica, n: suelo.nitrogeno, p: suelo.fosforo, k: suelo.potasio } : null,
    };

    const msg = await anthropic.messages.create({
      model: IA_MODEL,
      max_tokens: 800,
      system:
        "Sos un ingeniero agrónomo experto en protección de cultivos y fertilización en el Cono Sur. Recomendás UN tratamiento concreto (producto genérico por principio activo, dosis y caldo) según el contexto real del lote. No inventes datos del lote. Devolvés SOLO JSON.",
      messages: [{
        role: "user",
        content: `Contexto real del lote:
${JSON.stringify(contexto, null, 2)}

Recomendá el tratamiento MÁS prioritario hoy (si hay alerta de plaga vigente, priorizala; si no, según cultivo/etapa/suelo).
Respondé SOLO JSON:
{
  "objetivo": "qué se controla o corrige (1 frase)",
  "tipo": "Herbicida|Insecticida|Fungicida|Nutrición|Fertilizante",
  "producto": "nombre genérico por principio activo",
  "dosis": número,
  "unidad": "Lt/Ha|Kg/Ha|cc/Ha|g/Ha",
  "caldo": número (L/Ha recomendado),
  "justificacion": "1-2 frases técnicas",
  "advertencias": ["carencia, deriva, clima… si aplica"]
}`,
      }],
    });
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const parsed = parseJsonTolerante<{
      objetivo?: string; tipo?: string; producto?: string; dosis?: number; unidad?: string;
      caldo?: number; justificacion?: string; advertencias?: string[];
    }>(text);
    if (!parsed?.producto || !parsed?.dosis) {
      return NextResponse.json({ error: "La IA no pudo generar una recomendación con estos datos" }, { status: 422 });
    }

    return NextResponse.json({ simulado: false, ...parsed });
  } catch (error) {
    console.error("Error en recomendación IA de dosis:", error);
    return NextResponse.json({ error: "Error al generar la recomendación" }, { status: 500 });
  }
}
