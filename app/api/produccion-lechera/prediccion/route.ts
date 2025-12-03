import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener últimos 90 días de producción (NUEVO modelo)
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - 90);

    const registros = await prisma.produccionLechera.findMany({
      where: {
        userId: session.user.id,
        fecha: {
          gte: fechaDesde,
        },
      },
      orderBy: {
        fecha: "asc",
      },
    });

    if (registros.length < 7) {
      return NextResponse.json(
        { error: "Se necesitan al menos 7 días de registros" },
        { status: 400 }
      );
    }

    // Agrupar por día
    const produccionPorDia = registros.reduce((acc: any, r) => {
      const fecha = r.fecha.toISOString().split('T')[0];
      if (!acc[fecha]) {
        acc[fecha] = { fecha, litros: 0, registros: 0 };
      }
      acc[fecha].litros += r.litrosTotales; // CAMBIO AQUÍ
      acc[fecha].registros += 1;
      return acc;
    }, {});

    const serie = Object.values(produccionPorDia).sort((a: any, b: any) => 
      a.fecha.localeCompare(b.fecha)
    );

    // Llamar a Claude para predicción
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Sos un experto en análisis de datos de producción lechera.

Analizá la siguiente serie temporal de producción de leche (litros por día) y generá una predicción para los próximos 7 días:

DATOS HISTÓRICOS:
${JSON.stringify(serie, null, 2)}

CONTEXTO:
- Total de días con datos: ${serie.length}
- Promedio diario: ${(serie.reduce((sum: number, d: any) => sum + d.litros, 0) / serie.length).toFixed(1)} litros
- Último registro: ${(serie[serie.length - 1] as any).fecha}

TAREA:
1. Identificá patrones y tendencias
2. Detectá estacionalidad o ciclicidad
3. Considerá factores como clima, nutrición, estrés
4. Generá predicción realista para próximos 7 días
5. Calculá intervalo de confianza
6. Identifica riesgos potenciales

FORMATO DE RESPUESTA (JSON):
{
  "prediccion": [
    {
      "fecha": "YYYY-MM-DD",
      "litrosPredichos": 850,
      "confianza": 85,
      "limiteInferior": 800,
      "limiteSuperior": 900
    }
  ],
  "tendencia": "Estable|Creciente|Decreciente",
  "analisis": "Descripción del patrón detectado",
  "factoresRiesgo": ["Lista de factores que podrían afectar"],
  "recomendaciones": ["Acciones sugeridas"]
}

Respondé SOLO con el JSON, sin texto adicional.`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    let prediccion;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prediccion = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No se encontró JSON en la respuesta");
      }
    } catch (parseError) {
      console.error("Error parseando respuesta:", responseText);
      return NextResponse.json(
        { error: "Error al procesar predicción" },
        { status: 500 }
      );
    }

    return NextResponse.json(prediccion);
  } catch (error) {
    console.error("Error al generar predicción:", error);
    return NextResponse.json(
      { error: "Error al generar predicción" },
      { status: 500 }
    );
  }
}