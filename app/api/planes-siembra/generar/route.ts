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

    const { loteId } = await request.json();

    if (!loteId) {
      return NextResponse.json(
        { error: "Lote requerido" },
        { status: 400 }
      );
    }

    // Recopilar datos del lote
    const lote = await prisma.lote.findUnique({
      where: { id: loteId },
      include: {
        siembras: {
          orderBy: { fechaSiembra: "desc" },
          take: 10,
        },
        cosechas: {
          orderBy: { fechaCosecha: "desc" },
          take: 10,
          include: {
            siembra: {
              select: { cultivo: true },
            },
          },
        },
        analisisSuelo: {
          orderBy: { fechaAnalisis: "desc" },
          take: 3,
        },
      },
    });

    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    // Obtener clima histórico (si existe)
    const alertasClima = await prisma.alertaClimatica.findMany({
      where: { userId: session.user.id },
      orderBy: { fechaInicio: "desc" },
      take: 30,
    });

    // Preparar contexto para Claude
    const contexto = {
      lote: {
        nombre: lote.nombre,
        hectareas: lote.hectareas,
        cultivoActual: lote.cultivo,
      },
      siembrasHistoricas: lote.siembras.map(s => ({
        cultivo: s.cultivo,
        fecha: s.fechaSiembra,
        hectareas: s.hectareas,
      })),
      cosechasHistoricas: lote.cosechas.map(c => ({
        cultivo: c.siembra?.cultivo ?? null,
        fecha: c.fechaCosecha,
        rendimiento: c.rendimiento,
        precioVenta: c.precioVenta,
      })),
      analisisSuelo: lote.analisisSuelo.map(a => ({
        fecha: a.fechaAnalisis,
        pH: a.pH,
        materiaOrganica: a.materiaOrganica,
        nitrogeno: a.nitrogeno,
        fosforo: a.fosforo,
        potasio: a.potasio,
      })),
      climaReciente: alertasClima.slice(0, 10).map(a => ({
        fecha: a.fechaInicio,
        tipo: a.tipo,
        descripcion: a.descripcion,
      })),
    };

    // Llamar a Claude para análisis
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `Sos un agrónomo experto especializado en planificación de siembras y rotación de cultivos.

Analizá los siguientes datos de un lote agrícola y generá un plan de siembra inteligente:

DATOS DEL LOTE:
${JSON.stringify(contexto, null, 2)}

CONTEXTO REGIONAL:
- Región: Uruguay (clima templado)
- Estación actual: ${new Date().getMonth() >= 9 || new Date().getMonth() <= 2 ? 'Verano' : 'Invierno'}
- Mes actual: ${new Date().toLocaleString('es', { month: 'long' })}

TAREA:
1. Analizá el historial de siembras y cosechas
2. Considerá la rotación de cultivos adecuada
3. Evaluá la salud del suelo según los análisis
4. Recomendá el mejor cultivo para la próxima siembra
5. Estimá fechas óptimas de siembra y cosecha
6. Calculá rendimiento, costos e ingresos estimados
7. Justificá cada recomendación

CULTIVOS COMUNES EN URUGUAY:
- Soja (sembrar Oct-Dic, cosechar Mar-May)
- Trigo (sembrar May-Jul, cosechar Nov-Dic)
- Maíz (sembrar Set-Nov, cosechar Mar-Abr)
- Girasol (sembrar Oct-Dic, cosechar Mar-May)
- Sorgo (sembrar Oct-Dic, cosechar Mar-May)
- Cebada (sembrar May-Jul, cosechar Nov-Dic)

FORMATO DE RESPUESTA (JSON):
{
  "planes": [
    {
      "cultivo": "Nombre del cultivo",
      "variedad": "Variedad recomendada o null",
      "fechaSiembraRecomendada": "YYYY-MM-DD",
      "fechaCosechaEstimada": "YYYY-MM-DD",
      "rendimientoEstimado": 3500,
      "costoEstimadoPorHa": 800,
      "precioEstimadoVenta": 250,
      "ingresoEstimadoPorHa": 875,
      "margenEstimadoPorHa": 75,
      "confianza": 85,
      "justificacion": "Explicación detallada de por qué este cultivo",
      "beneficiosRotacion": "Beneficios para el suelo",
      "riesgos": "Riesgos a considerar",
      "recomendacionesManejo": "Prácticas recomendadas"
    }
  ]
}

IMPORTANTE:
- Generá 2-3 opciones de cultivos diferentes
- Priorizá rotación de cultivos (evitar repetir el último cultivo)
- Considerá el estado del suelo
- Sé realista con rendimientos y precios
- Respondé SOLO con el JSON, sin texto adicional`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    // Parsear respuesta de Claude
    let planesGenerados;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planesGenerados = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No se encontró JSON en la respuesta");
      }
    } catch (parseError) {
      console.error("Error parseando respuesta de Claude:", responseText);
      return NextResponse.json(
        { error: "Error al procesar análisis de IA" },
        { status: 500 }
      );
    }

    // Guardar planes en la base de datos
    const planesCreados = [];
    
    if (planesGenerados.planes && Array.isArray(planesGenerados.planes)) {
      for (const plan of planesGenerados.planes) {
        const ingresoTotal = (plan.ingresoEstimadoPorHa || 0) * lote.hectareas;
        const costoTotal = (plan.costoEstimadoPorHa || 0) * lote.hectareas;
        const margenTotal = ingresoTotal - costoTotal;

        const planCreado = await prisma.planSiembra.create({
          data: {
            loteId: lote.id,
            cultivo: plan.cultivo,
            variedad: plan.variedad || null,
            fechaSiembraRecomendada: new Date(plan.fechaSiembraRecomendada),
            fechaCosechaEstimada: new Date(plan.fechaCosechaEstimada),
            hectareas: lote.hectareas,
            rendimientoEstimado: plan.rendimientoEstimado || null,
            costoEstimado: costoTotal,
            ingresoEstimado: ingresoTotal,
            margenEstimado: margenTotal,
            confianza: plan.confianza || null,
            analisisIA: JSON.stringify({
              justificacion: plan.justificacion,
              beneficiosRotacion: plan.beneficiosRotacion,
              riesgos: plan.riesgos,
              recomendacionesManejo: plan.recomendacionesManejo,
              costoEstimadoPorHa: plan.costoEstimadoPorHa,
              ingresoEstimadoPorHa: plan.ingresoEstimadoPorHa,
              margenEstimadoPorHa: plan.margenEstimadoPorHa,
            }),
            userId: session.user.id,
          },
          include: {
            lote: {
              select: {
                nombre: true,
                hectareas: true,
              },
            },
          },
        });

        planesCreados.push(planCreado);
      }
    }

    return NextResponse.json({
      mensaje: `${planesCreados.length} planes de siembra generados`,
      planes: planesCreados,
    });
  } catch (error) {
    console.error("Error al generar planes:", error);
    return NextResponse.json(
      { error: "Error al generar planes de siembra" },
      { status: 500 }
    );
  }
}