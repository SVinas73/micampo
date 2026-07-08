import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";
import { getInsight, saveInsight } from "@/lib/insight";

// Recomendación del día con IA: el límite evita el corte de Vercel (~10s) en la
// primera generación sin caché.
export const maxDuration = 30;

/**
 * POST /api/clima/recomendacion
 * Recomendación agronómica del día: cruza el clima (actual + pronóstico + alertas)
 * con los cultivos del usuario y devuelve 2-4 acciones concretas priorizadas.
 * Claude si hay API key; si no, reglas a partir de las alertas del clima.
 * Cache 4 h por día. Body: { actual, dias, alertas }
 */
type Rec = { titulo: string; detalle: string; prioridad: "alta" | "media" | "baja"; icono: string };

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ recomendaciones: [] });

    const { actual, dias, alertas } = (await request.json()) as {
      actual?: any; dias?: any[]; alertas?: { tipo: string; severidad: string; mensaje: string; recomendacion: string }[];
    };

    const clave = `clima-rec:${new Date().toISOString().slice(0, 10)}`;
    const cache = await getInsight<{ recomendaciones: Rec[]; simulado: boolean }>(session.user.id, clave, 4 * 60);
    if (cache) return NextResponse.json(cache);

    const lotes = await prisma.lote.findMany({ where: { userId: session.user.id }, select: { cultivo: true, hectareas: true } });
    const cultivos = [...new Set(lotes.map((l) => l.cultivo).filter(Boolean))];

    const anthropic = getAnthropic();
    if (anthropic && actual) {
      try {
        const ctx = {
          clima: { temp: actual.temperatura, sensacion: actual.sensacion, humedad: actual.humedad, viento: actual.viento, deltaT: actual.deltaT, aptoPulverizacion: actual.aptoPulverizacion, descripcion: actual.descripcion },
          proximosDias: (dias || []).slice(0, 4).map((d) => ({ dia: d.nombre, max: d.max, min: d.min, mm: d.mm, prob: d.probLluvia, viento: d.viento })),
          alertas: (alertas || []).map((a) => `${a.tipo}: ${a.mensaje}`),
          cultivos,
        };
        const msg = await anthropic.messages.create({
          model: IA_MODEL, max_tokens: 700,
          messages: [{ role: "user", content: `Sos un agrónomo asesor en Uruguay. Con este clima y cultivos, dame 2-4 acciones CONCRETAS para hoy/esta semana (pulverización, riego, heladas, cosecha, labores). Sé específico y accionable.

${JSON.stringify(ctx, null, 2)}

Respondé SOLO JSON: [{"titulo":"acción corta","detalle":"qué hacer y por qué, 1 frase","prioridad":"alta|media|baja","icono":"droplet|wind|thermometer|sprout|alert|sun|cloud"}]` }],
        });
        const text = msg.content[0].type === "text" ? msg.content[0].text : "";
        const parsed = parseJsonTolerante<Rec[]>(text);
        if (Array.isArray(parsed) && parsed.length) {
          const out = { recomendaciones: parsed.slice(0, 4), simulado: false };
          await saveInsight(session.user.id, clave, "clima-rec", out, IA_MODEL);
          return NextResponse.json(out);
        }
      } catch { /* cae a reglas */ }
    }

    // --- Reglas: derivar de las alertas + clima ---
    const recs: Rec[] = [];
    (alertas || []).forEach((a) => {
      const pr = a.severidad === "Crítica" ? "alta" : a.severidad === "Alta" ? "alta" : "media";
      const ic = a.tipo.includes("helada") ? "thermometer" : a.tipo.includes("Lluvia") ? "droplet" : a.tipo.includes("Viento") || a.tipo.includes("pulver") ? "wind" : a.tipo.includes("Calor") ? "sun" : "alert";
      recs.push({ titulo: a.tipo, detalle: a.recomendacion, prioridad: pr as Rec["prioridad"], icono: ic });
    });
    if (actual?.aptoPulverizacion && recs.every((r) => !r.titulo.toLowerCase().includes("pulver"))) {
      recs.push({ titulo: "Buena ventana de pulverización", detalle: `ΔT ${actual.deltaT} y viento ${actual.viento} km/h dentro de rango: aprovechá para aplicar.`, prioridad: "media", icono: "wind" });
    }
    if (recs.length === 0) recs.push({ titulo: "Sin alertas para hoy", detalle: "Condiciones estables. Buen día para labores generales y monitoreo de lotes.", prioridad: "baja", icono: "sun" });
    const out = { recomendaciones: recs.slice(0, 4), simulado: true };
    await saveInsight(session.user.id, clave, "clima-rec", out, "reglas");
    return NextResponse.json(out);
  } catch (error) {
    console.error("Error en recomendación del clima:", error);
    return NextResponse.json({ recomendaciones: [] }, { status: 200 });
  }
}
