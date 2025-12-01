import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const analisis = await prisma.analisisReproductivo.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    return NextResponse.json(analisis);
  } catch (error) {
    console.error("Error al obtener análisis reproductivos:", error);
    return NextResponse.json(
      { error: "Error al obtener análisis" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { fechaInicio, fechaFin } = await request.json();

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: "Fechas de inicio y fin son requeridas" },
        { status: 400 }
      );
    }

    // Obtener todos los animales hembra del usuario
    const hembras = await prisma.animal.findMany({
      where: {
        userId: session.user.id,
        sexo: "Hembra",
        estado: "Activo",
      },
    });

    const totalHembras = hembras.length;

    // Obtener eventos reproductivos del período
    const eventos = await prisma.eventoReproductivo.findMany({
      where: {
        userId: session.user.id,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
    });

    // Calcular métricas
    const servicios = eventos.filter((e) => e.tipo === "Servicio");
    const diagnosticos = eventos.filter((e) => e.tipo === "Diagnostico");
    const partos = eventos.filter((e) => e.tipo === "Parto");

    const hembrasCubiertas = new Set(servicios.map((s) => s.animalId)).size;
    const preñadas = diagnosticos.filter((d) => d.resultado === "Preñada").length;
    const totalCrias = partos.reduce((sum, p) => sum + (p.numCrias || 0), 0);

    const tasaServicio = totalHembras > 0 ? (hembrasCubiertas / totalHembras) * 100 : 0;
    const tasaPreniez = servicios.length > 0 ? (preñadas / servicios.length) * 100 : 0;
    const tasaNatalidad = totalHembras > 0 ? (totalCrias / totalHembras) * 100 : 0;

    // Calcular intervalo entre partos (simplificado)
    const intervalosPartos: number[] = [];
    for (const hembra of hembras) {
      const partosHembra = await prisma.eventoReproductivo.findMany({
        where: {
          animalId: hembra.id,
          tipo: "Parto",
        },
        orderBy: {
          fecha: "asc",
        },
      });

      for (let i = 1; i < partosHembra.length; i++) {
        const dias = Math.floor(
          (new Date(partosHembra[i].fecha).getTime() -
            new Date(partosHembra[i - 1].fecha).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        intervalosPartos.push(dias);
      }
    }

    const intervaloPromedio =
      intervalosPartos.length > 0
        ? intervalosPartos.reduce((a, b) => a + b, 0) / intervalosPartos.length
        : null;

    // Generar recomendaciones IA
    let recomendacionIA = "Rodeo con rendimiento dentro de parámetros normales. ";
    const areas: string[] = [];

    if (tasaServicio < 85) {
      recomendacionIA +=
        "Tasa de servicio baja. Revisar detección de celos y manejo reproductivo. ";
      areas.push("Detección de celos");
    }

    if (tasaPreniez < 60) {
      recomendacionIA += "Tasa de preñez baja. Evaluar fertilidad de toros y nutrición. ";
      areas.push("Fertilidad");
      areas.push("Nutrición");
    }

    if (intervaloPromedio && intervaloPromedio > 400) {
      recomendacionIA += "Intervalo entre partos elevado. Optimizar manejo reproductivo. ";
      areas.push("Manejo reproductivo");
    }

    if (tasaServicio >= 90 && tasaPreniez >= 70) {
      recomendacionIA = "¡Excelentes indicadores reproductivos! Mantener las prácticas actuales.";
    }

    const analisis = await prisma.analisisReproductivo.create({
      data: {
        tipoAnalisis: "Periodo",
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        totalHembras,
        hembrasCubiertas,
        tasaServicio: parseFloat(tasaServicio.toFixed(2)),
        tasaPreniez: parseFloat(tasaPreniez.toFixed(2)),
        tasaNatalidad: parseFloat(tasaNatalidad.toFixed(2)),
        tasaMortalidad: 0, // Simplificado
        intervaloPartos: intervaloPromedio ? parseFloat(intervaloPromedio.toFixed(1)) : null,
        torosUtilizados: new Set(
          servicios.filter((s) => s.toroId).map((s) => s.toroId)
        ).size,
        recomendacionIA,
        areasDeRecomen: areas.length > 0 ? JSON.stringify(areas) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(analisis, { status: 201 });
  } catch (error) {
    console.error("Error al crear análisis reproductivo:", error);
    return NextResponse.json(
      { error: "Error al crear análisis reproductivo" },
      { status: 500 }
    );
  }
}