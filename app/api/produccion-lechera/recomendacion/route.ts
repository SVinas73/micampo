import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

export const maxDuration = 45;

type Recomendacion = {
  analisis: string;
  acciones: { titulo: string; detalle: string }[];
  fuente: "ia" | "reglas";
  simulado?: boolean;
};

/** Recomendación basada en reglas cuando no hay API key o falla la IA. */
function recomendacionReglas(ctx: {
  vacasOrdenne: number;
  promedio7d: number;
  bajoCurva: number;
  delPromedio: number | null;
}): Recomendacion {
  const acciones: { titulo: string; detalle: string }[] = [];
  if (ctx.bajoCurva > 0) {
    acciones.push({
      titulo: `Revisar ${ctx.bajoCurva} vaca(s) bajo curva`,
      detalle: "Controlar condición corporal, consumo de ración y posible mastitis subclínica (RCS individual).",
    });
  }
  if (ctx.delPromedio !== null && ctx.delPromedio > 200) {
    acciones.push({
      titulo: "Planificar secados",
      detalle: `El DEL promedio del rodeo es ${Math.round(ctx.delPromedio)} días: programá los secados de las vacas que superan 290 DEL.`,
    });
  }
  acciones.push({
    titulo: "Registrar ordeñes a diario",
    detalle: "Con carga diaria de turnos, las curvas de lactancia y alertas de caída ganan precisión.",
  });
  return {
    analisis:
      ctx.vacasOrdenne === 0
        ? "Todavía no hay registros de ordeñe suficientes para un análisis del rodeo. Empezá registrando los turnos diarios."
        : `Rodeo con ${ctx.vacasOrdenne} vacas en ordeñe y un promedio de ${ctx.promedio7d.toFixed(1)} lt/vaca/día en la última semana.`,
    acciones,
    fuente: "reglas",
    simulado: true,
  };
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const desde = new Date();
    desde.setDate(desde.getDate() - 30);

    const registros = await prisma.registroLechero.findMany({
      where: { userId: session.user.id, fecha: { gte: desde } },
      include: {
        animal: {
          select: {
            id: true,
            caravana: true,
            raza: true,
            historialReproductivo: { select: { ultimoParto: true, totalPartos: true } },
          },
        },
      },
      orderBy: { fecha: "asc" },
    });

    // Contexto real por vaca
    const porVaca = new Map<string, { caravana: string; litros: number[]; del: number | null; partos: number }>();
    for (const r of registros) {
      const key = r.animalId;
      if (!porVaca.has(key)) {
        const up = r.animal.historialReproductivo?.ultimoParto;
        porVaca.set(key, {
          caravana: r.animal.caravana,
          litros: [],
          del: up ? Math.floor((Date.now() - new Date(up).getTime()) / (24 * 3600 * 1000)) : null,
          partos: r.animal.historialReproductivo?.totalPartos ?? 0,
        });
      }
      porVaca.get(key)!.litros.push(r.litros);
    }

    const vacas = Array.from(porVaca.values());
    const vacasOrdenne = vacas.length;
    const proms = vacas.map((v) => {
      const ult7 = v.litros.slice(-7);
      const prom7 = ult7.length ? ult7.reduce((s, x) => s + x, 0) / ult7.length : 0;
      const promTotal = v.litros.length ? v.litros.reduce((s, x) => s + x, 0) / v.litros.length : 0;
      return { ...v, prom7, promTotal, caida: promTotal > 0 ? (promTotal - prom7) / promTotal : 0 };
    });
    const promedio7d = proms.length ? proms.reduce((s, v) => s + v.prom7, 0) / proms.length : 0;
    const bajoCurva = proms.filter((v) => v.caida > 0.2).length;
    const conDel = proms.filter((v) => v.del !== null);
    const delPromedio = conDel.length ? conDel.reduce((s, v) => s + (v.del || 0), 0) / conDel.length : null;

    const ctx = { vacasOrdenne, promedio7d, bajoCurva, delPromedio };

    const anthropic = getAnthropic();
    if (!anthropic || registros.length < 5) {
      return NextResponse.json(recomendacionReglas(ctx));
    }

    const resumenVacas = proms
      .sort((a, b) => a.caida - b.caida)
      .slice(0, 40)
      .map((v) => `#${v.caravana}: DEL ${v.del ?? "?"}, prom 7d ${v.prom7.toFixed(1)} lt, prom 30d ${v.promTotal.toFixed(1)} lt, partos ${v.partos}`)
      .join("\n");

    const message = await anthropic.messages.create({
      model: IA_MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `Sos un asesor experto en producción lechera de tambos del Río de la Plata.

DATOS REALES DEL RODEO (últimos 30 días):
- Vacas en ordeñe: ${vacasOrdenne}
- Promedio 7 días: ${promedio7d.toFixed(1)} lt/vaca/día
- DEL promedio: ${delPromedio !== null ? Math.round(delPromedio) + " días" : "sin datos de partos"}
- Vacas con caída >20% vs su promedio: ${bajoCurva}

DETALLE POR VACA:
${resumenVacas || "(sin registros individuales)"}

TAREA: Generá UNA recomendación concreta para mejorar la producción, y hasta 3 acciones específicas ejecutables (nutrición, manejo, sanidad o secado), citando caravanas o rangos de DEL reales de los datos.

Respondé SOLO JSON:
{"analisis":"párrafo breve con la recomendación principal","acciones":[{"titulo":"...","detalle":"..."}]}`,
        },
      ],
    });

    const texto = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = parseJsonTolerante<{ analisis?: string; acciones?: { titulo: string; detalle: string }[] }>(texto);
    if (!parsed?.analisis) {
      return NextResponse.json(recomendacionReglas(ctx));
    }

    return NextResponse.json({
      analisis: parsed.analisis,
      acciones: Array.isArray(parsed.acciones) ? parsed.acciones.slice(0, 3) : [],
      fuente: "ia",
    } satisfies Recomendacion);
  } catch (error) {
    console.error("Error en recomendación lechera:", error);
    return NextResponse.json({ error: "Error al generar recomendación" }, { status: 500 });
  }
}
