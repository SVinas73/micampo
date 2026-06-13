import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

type Sugerencia = { fecha: string; mm: number; motivo: string; costoUSD: number };
type PuntoBalance = { dia: string; sinRiego: number; conRiego: number };
type AnalisisRiego = {
  balanceProyectado: PuntoBalance[];
  sugerencias: Sugerencia[];
  estadoHidrico: string;
  costoEvento: number;
  simulado?: boolean;
};

const DIAS = ["HOY 22", "JUE 23", "VIE 24", "SÁB 25", "DOM 26", "LUN 27", "MAR 28"];

/**
 * Cálculo determinístico (modo demo) modulado por `estrategia` (0-100):
 * más estrategia → más mm aplicados y más costo (priorizar rinde sobre ahorro de agua).
 */
function calculoDeterministico(
  estrategia: number,
  cultivo: string,
  etapaFenologica: string,
  hectareas: number,
): AnalisisRiego {
  const e = Math.max(0, Math.min(100, estrategia)) / 100;

  const etcBase: Record<string, number> = {
    Soja: 5.5, Maíz: 6.0, Trigo: 4.5, Girasol: 5.0, Alfalfa: 7.0,
  };
  const ajusteEtapa: Record<string, number> = {
    Germinación: 0.4, Vegetativo: 0.7, Floración: 1.2, Fructificación: 1.0, Maduración: 0.6,
  };
  const etcDiaria = (etcBase[cultivo] || 5.0) * (ajusteEtapa[etapaFenologica] || 1.0);

  // Humedad sin riego desciende por consumo ETo hacia la zona roja.
  const sinRiego = [82, 70, 58, 38, 22, 12, 5];

  // mm por evento crece con la estrategia (10 → 22 mm aprox).
  const mmEvento = Math.round(10 + e * 12);
  const ganancia = mmEvento / 1.5; // % de humedad recuperado por riego

  // Con riego: recupera humedad en los días de sugerencia (índices 3 y 5).
  const conRiego = sinRiego.map((v, i) => {
    let val = v;
    if (i >= 3) val = Math.min(85, v + ganancia);
    if (i >= 5) val = Math.min(85, v + ganancia * 0.8);
    return Math.round(val);
  });

  const costoMM = 12; // USD/mm (energía + insumo)
  const costoPorEvento = Math.round(mmEvento * costoMM * Math.max(1, hectareas / 18));

  const sugerencias: Sugerencia[] = [
    {
      fecha: "2025-09-25",
      mm: mmEvento,
      motivo: "Humedad proyectada cae a 22% sin riego (estrés severo)",
      costoUSD: costoPorEvento,
    },
    {
      fecha: "2025-09-27",
      mm: mmEvento,
      motivo: "Balance hídrico negativo proyectado en 5 días",
      costoUSD: costoPorEvento,
    },
  ];

  const balanceProyectado: PuntoBalance[] = DIAS.map((dia, i) => ({
    dia,
    sinRiego: sinRiego[i],
    conRiego: conRiego[i],
  }));

  return {
    balanceProyectado,
    sugerencias,
    estadoHidrico: e < 0.35 ? "Déficit Controlado" : "Bien Hidratado",
    costoEvento: sugerencias.reduce((s, x) => s + x.costoUSD, 0),
    simulado: true,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      loteId,
      cultivo = "Maíz",
      etapaFenologica = "Vegetativo",
      lluviasRecientes,
      estrategia = 75,
    } = body || {};

    let hectareas = 18;
    if (loteId) {
      const lote = await prisma.lote.findUnique({ where: { id: loteId } });
      if (lote && lote.userId === session.user.id) {
        hectareas = lote.hectareas || hectareas;
      }
    }

    const fallback = calculoDeterministico(
      Number(estrategia) || 0,
      cultivo,
      etapaFenologica,
      hectareas,
    );

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json(fallback);
    }

    try {
      const prompt = `Sos un agrónomo experto en riego de precisión. Analizá el balance hídrico de un lote y devolvé SOLO un objeto JSON válido (sin texto adicional).

Contexto:
- Cultivo: ${cultivo}
- Etapa fenológica: ${etapaFenologica}
- Superficie: ${hectareas} ha
- Lluvias recientes (mm): ${JSON.stringify(lluviasRecientes ?? "sin datos")}
- Estrategia del productor (0=ahorrar agua, 100=maximizar rinde): ${estrategia}

Días a proyectar (en este orden): ${JSON.stringify(DIAS)}

Devolvé este formato exacto:
{
  "balanceProyectado": [{"dia": "HOY 22", "sinRiego": 82, "conRiego": 82}, ...7 elementos en el orden dado, valores 0-100 de % de humedad],
  "sugerencias": [{"fecha": "2025-09-25", "mm": 15, "motivo": "texto breve", "costoUSD": 320}],
  "estadoHidrico": "Bien Hidratado",
  "costoEvento": 450
}

Reglas: "sinRiego" desciende por consumo ETo hacia la zona roja (<30% = peligro de marchitez). "conRiego" recupera humedad en los días de las sugerencias. A mayor estrategia, más mm por evento y mayor costo.`;

      const resp = await anthropic.messages.create({
        model: IA_MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const text = resp.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n");

      const parsed = parseJsonTolerante<AnalisisRiego>(text);
      if (
        parsed &&
        Array.isArray(parsed.balanceProyectado) &&
        Array.isArray(parsed.sugerencias)
      ) {
        return NextResponse.json({ ...parsed, simulado: false });
      }
      return NextResponse.json(fallback);
    } catch (iaError) {
      console.error("Error IA riego, usando fallback:", iaError);
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error("Error en análisis IA:", error);
    return NextResponse.json(
      { error: "Error al analizar requerimientos de riego" },
      { status: 500 },
    );
  }
}
