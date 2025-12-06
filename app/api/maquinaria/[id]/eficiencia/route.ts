import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/[id]/eficiencia - Obtener análisis de eficiencia
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dias = parseInt(searchParams.get("dias") || "7");

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    const registros = await prisma.eficienciaMaquinaria.findMany({
      where: {
        maquinariaId: params.id,
        fecha: { gte: fechaInicio },
      },
      orderBy: { fecha: "desc" },
    });

    // Calcular promedios
    const promedios = {
      eficienciaScore:
        registros.reduce((acc, r) => acc + (r.eficienciaScore || 0), 0) /
          registros.length || 0,
      consumoScore:
        registros.reduce((acc, r) => acc + (r.consumoScore || 0), 0) / registros.length ||
        0,
      productividadScore:
        registros.reduce((acc, r) => acc + (r.productividadScore || 0), 0) /
          registros.length || 0,
      scoreGeneral:
        registros.reduce((acc, r) => acc + (r.scoreGeneral || 0), 0) / registros.length ||
        0,
      horasTrabajando: registros.reduce((acc, r) => acc + r.horasTrabajando, 0),
      horasRalenti: registros.reduce((acc, r) => acc + r.horasRalenti, 0),
      consumoTotal: registros.reduce((acc, r) => acc + (r.consumoCombustible || 0), 0),
      areaTotal: registros.reduce((acc, r) => acc + (r.areaTrabajadasHa || 0), 0),
    };

    const porcentajeRalenti =
      promedios.horasTrabajando + promedios.horasRalenti > 0
        ? (promedios.horasRalenti /
            (promedios.horasTrabajando + promedios.horasRalenti)) *
          100
        : 0;

    return NextResponse.json({
      registros,
      promedios: {
        ...promedios,
        porcentajeRalenti: porcentajeRalenti.toFixed(2),
        consumoPorHa:
          promedios.areaTotal > 0
            ? (promedios.consumoTotal / promedios.areaTotal).toFixed(2)
            : 0,
      },
      periodo: {
        dias,
        desde: fechaInicio.toISOString(),
        hasta: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error al obtener eficiencia:", error);
    return NextResponse.json({ error: "Error al obtener eficiencia" }, { status: 500 });
  }
}

// POST /api/maquinaria/[id]/eficiencia - Registrar datos de eficiencia
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      fecha,
      horasTrabajando,
      horasRalenti,
      horasApagado,
      consumoCombustible,
      distanciaRecorrida,
      areaTrabajadasHa,
      operador,
      loteId,
      tarea,
    } = body;

    // Validaciones
    if (!horasTrabajando && !horasRalenti && !horasApagado) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos un tipo de horas" },
        { status: 400 }
      );
    }

    // Calcular totales y scores
    const horasTotales =
      (horasTrabajando || 0) + (horasRalenti || 0) + (horasApagado || 0);

    const eficienciaScore =
      horasTotales > 0 ? ((horasTrabajando || 0) / horasTotales) * 100 : 0;

    const consumoPorHora =
      horasTrabajando && consumoCombustible
        ? consumoCombustible / horasTrabajando
        : 0;

    // Score de consumo (ideal: 10-15 L/h, más bajo = mejor)
    const consumoIdeal = 12.5;
    const consumoScore =
      consumoPorHora > 0
        ? Math.max(0, 100 - Math.abs(consumoPorHora - consumoIdeal) * 5)
        : 0;

    // Score de productividad (ideal: 1-2 ha/h)
    const productividadScore =
      areaTrabajadasHa && horasTrabajando
        ? Math.min(100, (areaTrabajadasHa / horasTrabajando / 1.5) * 100)
        : 0;

    const scoreGeneral = (eficienciaScore + consumoScore + productividadScore) / 3;

    const registro = await prisma.eficienciaMaquinaria.create({
      data: {
        maquinariaId: params.id,
        fecha: fecha ? new Date(fecha) : new Date(),
        horasTrabajando: horasTrabajando || 0,
        horasRalenti: horasRalenti || 0,
        horasApagado: horasApagado || 0,
        horasTotales,
        consumoCombustible: consumoCombustible || 0,
        consumoPorHora,
        distanciaRecorrida: distanciaRecorrida || 0,
        areaTrabajadasHa: areaTrabajadasHa || 0,
        eficienciaScore,
        consumoScore,
        productividadScore,
        scoreGeneral,
        operador,
        loteId,
        tarea,
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error al registrar eficiencia:", error);
    return NextResponse.json({ error: "Error al registrar eficiencia" }, { status: 500 });
  }
}