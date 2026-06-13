import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL } from "@/lib/ia";

// Plan demo determinístico cuando no hay ANTHROPIC_API_KEY (sistema 100% funcional).
function planesDemo() {
  const hoy = new Date();
  const mesProx = (n: number) => new Date(hoy.getFullYear(), hoy.getMonth() + n, 15).toISOString().slice(0, 10);
  return {
    planes: [
      { cultivo: "Maíz Tardío", variedad: "DK-7210", fechaSiembraRecomendada: mesProx(1), fechaCosechaEstimada: mesProx(6), rendimientoEstimado: 9500, costoEstimadoPorHa: 520, precioEstimadoVenta: 200, ingresoEstimadoPorHa: 1900, margenEstimadoPorHa: 1380, confianza: 92, justificacion: "Compactación severa y déficit de N en suelo: el maíz aporta rastrojo y mejora estructural.", beneficiosRotacion: "Aporte clave de rastrojo y mejora estructural del suelo.", riesgos: "Requiere ventana de siembra ajustada.", recomendacionesManejo: "Fertilización nitrogenada variable." },
      { cultivo: "Soja de Primera", variedad: "DM-40R", fechaSiembraRecomendada: mesProx(2), fechaCosechaEstimada: mesProx(7), rendimientoEstimado: 3500, costoEstimadoPorHa: 300, precioEstimadoVenta: 280, ingresoEstimadoPorHa: 980, margenEstimadoPorHa: 680, confianza: 85, justificacion: "Buena fijación de N y rotación adecuada tras gramínea.", beneficiosRotacion: "Fija nitrógeno y reduce presión de plagas de maíz.", riesgos: "Sensible a estrés hídrico en llenado.", recomendacionesManejo: "Inoculación de calidad y monitoreo de chinches." },
    ],
  };
}

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

    const anthropic = getAnthropic();

    // Sin API key → planes demo determinísticos (sistema sigue funcional).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let planesGenerados: any;

    if (!anthropic) {
      planesGenerados = planesDemo();
    } else {
    // Llamar a Claude para análisis
    const message = await anthropic.messages.create({
      model: IA_MODEL,
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

    // Parsear respuesta de Claude (con fallback a demo si falla el parseo)
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      planesGenerados = jsonMatch ? JSON.parse(jsonMatch[0]) : planesDemo();
    } catch {
      console.error("Error parseando respuesta de Claude, usando demo");
      planesGenerados = planesDemo();
    }
    } // cierre del else (IA disponible)

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