import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";
import { getInsight, saveInsight } from "@/lib/insight";

/**
 * POST /api/lotes/prediccion-rendimiento  { loteId }
 * Predice el rendimiento (kg/ha) del lote para la campaña en curso a partir de
 * su historial de cosechas, suelo y vigor NDVI. Usa Claude para refinar y
 * explicar; degrada a un cálculo determinístico sin API key. Cachea 12 h.
 */

// Rendimientos de referencia (kg/ha) para Uruguay/región pampeana.
const REF: Record<string, number> = {
  Soja: 2800, Maíz: 7000, Trigo: 3500, Sorgo: 5000,
  Girasol: 1800, Cebada: 3800, Alfalfa: 12000, Trébol: 9000, Avena: 3000,
};

function refRend(cultivo?: string | null): number {
  if (!cultivo) return 3000;
  return REF[cultivo] ?? 3000;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { loteId } = (await request.json()) as { loteId?: string };
    if (!loteId) return NextResponse.json({ error: "loteId requerido" }, { status: 400 });

    const lote = await prisma.lote.findUnique({ where: { id: loteId } });
    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    const cache = await getInsight<Record<string, unknown>>(session.user.id, `rinde:${loteId}`, 12 * 60);
    if (cache) return NextResponse.json(cache);

    const [cosechas, suelo] = await Promise.all([
      prisma.cosecha.findMany({ where: { loteId }, orderBy: { fechaCosecha: "desc" }, take: 8 }),
      prisma.analisisSuelo.findFirst({ where: { loteId }, orderBy: { fechaAnalisis: "desc" } }),
    ]);
    const ndviCache = await getInsight<{ ndvi: number }>(session.user.id, `ndvi:${loteId}`, 7 * 24 * 60);
    const ndvi = ndviCache?.ndvi ?? 0;

    // --- Baseline determinístico ---
    const hist = cosechas.map((c) => c.rendimiento).filter((r) => r > 0);
    const histAvg = hist.length ? hist.reduce((s, r) => s + r, 0) / hist.length : refRend(lote.cultivo);
    const histStd = hist.length > 1
      ? Math.sqrt(hist.reduce((s, r) => s + (r - histAvg) ** 2, 0) / hist.length)
      : histAvg * 0.12;

    // --- Backtesting (leave-one-out sobre las cosechas reales) ---
    // Para cada cosecha, "predecimos" con el promedio de las OTRAS y medimos el error.
    const cosBT = cosechas.filter((c) => c.rendimiento > 0);
    let backtesting: { precision: number; casos: { anio: number; predicho: number; real: number; errorPct: number }[] } | null = null;
    if (cosBT.length >= 2) {
      const casos = cosBT.slice(0, 5).map((c) => {
        const otras = cosBT.filter((o) => o !== c).map((o) => o.rendimiento);
        const pred = Math.round(otras.reduce((s, r) => s + r, 0) / otras.length);
        const errorPct = Math.round((Math.abs(pred - c.rendimiento) / c.rendimiento) * 100);
        return { anio: new Date(c.fechaCosecha).getFullYear(), predicho: pred, real: Math.round(c.rendimiento), errorPct };
      });
      const errProm = casos.reduce((s, x) => s + x.errorPct, 0) / casos.length;
      backtesting = { precision: Math.max(0, Math.round(100 - errProm)), casos };
    }

    // Factor de vigor: NDVI 0.7 ~ neutro; cada 0.1 mueve ~8%.
    const factorNdvi = ndvi > 0 ? 1 + (ndvi - 0.7) * 0.8 : 1;
    const estimado = Math.round(histAvg * Math.min(1.25, Math.max(0.7, factorNdvi)));
    const margen = Math.round(Math.max(histStd, estimado * 0.08));
    const baseline = {
      cultivo: lote.cultivo || "Sin cultivo",
      rendimientoEstimado: estimado,
      unidad: "kg/ha",
      rangoMin: estimado - margen,
      rangoMax: estimado + margen,
      confianza: hist.length >= 3 ? 75 : hist.length >= 1 ? 60 : 45,
      baseHistorica: Math.round(histAvg),
      cosechasUsadas: hist.length,
      backtesting,
    };

    const anthropic = getAnthropic();
    if (!anthropic) {
      const out = {
        ...baseline,
        factores: [
          hist.length ? `Promedio histórico: ${Math.round(histAvg)} kg/ha (${hist.length} cosechas)` : `Sin historial: referencia regional de ${lote.cultivo || "cultivo"}`,
          ndvi > 0 ? `Vigor NDVI actual ${ndvi.toFixed(2)} (${ndvi >= 0.7 ? "alto" : ndvi >= 0.5 ? "medio" : "bajo"})` : "Sin medición NDVI",
          suelo ? `Suelo: pH ${suelo.pH ?? "—"}, P ${suelo.fosforo ?? "—"} ppm` : "Sin análisis de suelo",
        ],
        riesgos: ["Sin pronóstico climático integrado en modo sin IA."],
        simulado: true,
      };
      await saveInsight(session.user.id, `rinde:${loteId}`, "rinde", out, "deterministico");
      return NextResponse.json(out);
    }

    // --- Refinamiento con IA ---
    const ctx = {
      lote: { nombre: lote.nombre, hectareas: lote.hectareas, cultivo: lote.cultivo },
      historialCosechas: cosechas.map((c) => ({ fecha: c.fechaCosecha.toISOString().slice(0, 10), rendimiento_kg_ha: c.rendimiento, calidad: c.calidad })),
      ndviActual: ndvi,
      suelo: suelo ? { pH: suelo.pH, materiaOrganica: suelo.materiaOrganica, nitrogeno: suelo.nitrogeno, fosforo: suelo.fosforo, potasio: suelo.potasio } : null,
      baselineDeterministico: baseline,
      region: "Uruguay",
      mes: new Date().getMonth() + 1,
    };

    const msg = await anthropic.messages.create({
      model: IA_MODEL,
      max_tokens: 900,
      messages: [{
        role: "user",
        content: `Sos un agrónomo especialista en estimación de rendimientos. Con estos datos reales del lote estimá el rendimiento esperado para la campaña en curso.

DATOS:
${JSON.stringify(ctx, null, 2)}

Respondé SOLO con JSON (sin texto extra):
{
  "rendimientoEstimado": número kg/ha,
  "rangoMin": número kg/ha,
  "rangoMax": número kg/ha,
  "confianza": 0-100,
  "factores": ["driver 1 que sube/baja el rinde", "driver 2", "driver 3"],
  "riesgos": ["riesgo climático/sanitario concreto"],
  "recomendacion": "una acción concreta para proteger o mejorar el rinde"
}
Sé realista: si no hay historial, basate en referencias regionales y el NDVI. Mantené el rango coherente con la confianza.`,
      }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const parsed = parseJsonTolerante<Record<string, unknown>>(text);
    const out = {
      ...baseline,
      ...(parsed || {}),
      unidad: "kg/ha",
      cultivo: lote.cultivo || "Sin cultivo",
      simulado: false,
    };
    await saveInsight(session.user.id, `rinde:${loteId}`, "rinde", out, IA_MODEL);
    return NextResponse.json(out);
  } catch (error) {
    console.error("Error en predicción de rendimiento:", error);
    return NextResponse.json({ error: "Error al predecir el rendimiento" }, { status: 500 });
  }
}
