import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

export const maxDuration = 45;

type Analisis = {
  analisis: string;
  recomendaciones: { texto: string; detalle: string }[];
  corralesRiesgo: string[];
  fuente: "ia" | "reglas";
  simulado?: boolean;
};

/** Análisis por reglas: proyecta días a faena y detecta corrales por debajo del GDP objetivo. */
function analisisReglas(corrales: CorralCtx[]): Analisis {
  const enRiesgo = corrales.filter((c) => c.gdpReal !== null && c.gdpObjetivo && c.gdpReal < c.gdpObjetivo * 0.9);
  const recomendaciones: { texto: string; detalle: string }[] = [];
  for (const c of enRiesgo.slice(0, 3)) {
    const retraso = c.gdpReal && c.gdpObjetivo && c.pesoObjetivo && c.pesoActual
      ? Math.max(0, Math.round((c.pesoObjetivo - c.pesoActual) / c.gdpReal - (c.pesoObjetivo - c.pesoActual) / c.gdpObjetivo))
      : null;
    recomendaciones.push({
      texto: "Ajustar ración a mayor densidad energética",
      detalle: `${c.nombre} — GDP ${c.gdpReal?.toFixed(2)} kg/d vs objetivo ${c.gdpObjetivo?.toFixed(2)}${retraso ? ` (retraso ~${retraso} días)` : ""}`,
    });
  }
  if (recomendaciones.length === 0) {
    recomendaciones.push({ texto: "Mantener el plan nutricional actual", detalle: "Todas las tropas están dentro del objetivo de GDP." });
  }
  return {
    analisis:
      enRiesgo.length === 0
        ? corrales.length === 0
          ? "Todavía no hay corrales de engorde cargados. Registrá tus corrales y pesadas para ver proyecciones."
          : "Todas las tropas de engorde están cumpliendo su objetivo de ganancia diaria. Mantené el monitoreo de consumo."
        : `${enRiesgo.length} tropa(s) con GDP por debajo del objetivo. A este ritmo alcanzan el peso de faena más tarde de lo planificado, aumentando el costo de alimento por cabeza.`,
    recomendaciones,
    corralesRiesgo: enRiesgo.map((c) => c.nombre),
    fuente: "reglas",
    simulado: true,
  };
}

type CorralCtx = {
  nombre: string;
  categoria: string | null;
  cabezas: number;
  pesoActual: number | null;
  pesoObjetivo: number | null;
  gdpObjetivo: number | null;
  gdpReal: number | null;
};

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const corrales = await prisma.corralEngorde.findMany({
      where: { userId: session.user.id, estado: { not: "Cerrado" } },
      include: { pesadas: { orderBy: { fecha: "desc" }, take: 3 } },
    });

    const ctx: CorralCtx[] = corrales.map((c) => {
      const gdpReal = c.pesadas[0]?.gdp ?? null;
      return {
        nombre: c.nombre,
        categoria: c.categoria,
        cabezas: c.cabezas,
        pesoActual: c.pesoActual,
        pesoObjetivo: c.pesoObjetivo,
        gdpObjetivo: c.gdpObjetivo,
        gdpReal,
      };
    });

    const anthropic = getAnthropic();
    if (!anthropic || ctx.length === 0) {
      return NextResponse.json(analisisReglas(ctx));
    }

    const detalle = ctx
      .map((c) => `${c.nombre} (${c.categoria || "s/cat"}): ${c.cabezas} cab, peso ${c.pesoActual ?? "?"}kg, GDP real ${c.gdpReal ?? "?"} vs obj ${c.gdpObjetivo ?? "?"}, meta ${c.pesoObjetivo ?? "?"}kg`)
      .join("\n");

    const message = await anthropic.messages.create({
      model: IA_MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `Sos un asesor experto en engorde a corral (feedlot) del Río de la Plata.

DATOS REALES DE LAS TROPAS EN ENGORDE:
${detalle}

TAREA: Analizá la eficiencia de engorde y generá:
1. Un análisis breve (2-3 frases) del estado general, mencionando tropas concretas en riesgo.
2. Hasta 3 recomendaciones ejecutables (nutrición, venta anticipada, monitoreo), citando la tropa.
3. La lista de nombres de tropas en riesgo (GDP < 90% del objetivo).

Respondé SOLO JSON:
{"analisis":"...","recomendaciones":[{"texto":"...","detalle":"..."}],"corralesRiesgo":["..."]}`,
        },
      ],
    });

    const texto = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = parseJsonTolerante<{ analisis?: string; recomendaciones?: { texto: string; detalle: string }[]; corralesRiesgo?: string[] }>(texto);
    if (!parsed?.analisis) {
      return NextResponse.json(analisisReglas(ctx));
    }

    return NextResponse.json({
      analisis: parsed.analisis,
      recomendaciones: Array.isArray(parsed.recomendaciones) ? parsed.recomendaciones.slice(0, 3) : [],
      corralesRiesgo: Array.isArray(parsed.corralesRiesgo) ? parsed.corralesRiesgo : [],
      fuente: "ia",
    } satisfies Analisis);
  } catch (error) {
    console.error("Error en curva IA engorde:", error);
    return NextResponse.json({ error: "Error al generar análisis" }, { status: 500 });
  }
}
