import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

export const maxDuration = 30;

/**
 * Refinamiento IA del Balance Hídrico. El cálculo base (ET0 + lluvia + AWC) es
 * determinístico y vive en el cliente; este endpoint, cuando hay ANTHROPIC_API_KEY,
 * afina los motivos y puede ajustar los mm de cada sugerencia con criterio agronómico.
 * Sin key devuelve { simulado: true } y el card sigue 100% funcional con el cálculo local.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { lote, cultivo, etapa, balance, sugerencias } = await request.json();
    if (!Array.isArray(sugerencias) || sugerencias.length === 0) {
      return NextResponse.json({ simulado: true, sugerencias: [] });
    }

    const anthropic = getAnthropic();
    if (!anthropic) return NextResponse.json({ simulado: true });

    const msg = await anthropic.messages.create({
      model: IA_MODEL,
      max_tokens: 600,
      system: "Sos un ingeniero agrónomo especialista en riego. Afinás sugerencias de riego reales (mm y justificación) con criterio técnico. Devolvés SOLO JSON.",
      messages: [{
        role: "user",
        content: `Lote: ${lote || "—"} · Cultivo: ${cultivo || "—"} · Etapa: ${etapa || "—"}.
Balance hídrico proyectado (humedad % por día): ${JSON.stringify(balance)}
Sugerencias base (calculadas por balance ET0+lluvia): ${JSON.stringify(sugerencias)}

Ajustá cada sugerencia si corresponde (mm entre 8 y 25) y mejorá el "motivo" (1 frase técnica, concreta).
Respondé SOLO JSON: {"sugerencias":[{"dia":number,"mm":number,"motivo":"..."}]}`,
      }],
    });
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const parsed = parseJsonTolerante<{ sugerencias?: { dia: number; mm: number; motivo: string }[] }>(text);
    if (!parsed?.sugerencias?.length) return NextResponse.json({ simulado: true });

    return NextResponse.json({ simulado: false, sugerencias: parsed.sugerencias });
  } catch (error) {
    console.error("Error en riego-ia/sugerencias:", error);
    return NextResponse.json({ simulado: true }, { status: 200 });
  }
}
