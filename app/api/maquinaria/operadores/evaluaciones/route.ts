import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/operadores/evaluaciones - Listar evaluaciones
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const operador = searchParams.get("operador");
    const maquinariaId = searchParams.get("maquinariaId");
    const dias = parseInt(searchParams.get("dias") || "30");

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    const evaluaciones = await prisma.evaluacionOperador.findMany({
      where: {
        userId: user.id,
        ...(operador && { operador }),
        ...(maquinariaId && { maquinariaId }),
        fecha: { gte: fechaInicio },
      },
      include: {
        maquinaria: {
          select: {
            codigo: true,
            tipo: true,
            marca: true,
            modelo: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    // Calcular promedios
    const promedios = {
      scoreSeguridad:
        evaluaciones.reduce((acc, e) => acc + e.scoreSeguridad, 0) /
          evaluaciones.length || 0,
      scoreEficiencia:
        evaluaciones.reduce((acc, e) => acc + e.scoreEficiencia, 0) /
          evaluaciones.length || 0,
      scoreCuidado:
        evaluaciones.reduce((acc, e) => acc + e.scoreCuidado, 0) / evaluaciones.length ||
        0,
      scoreGeneral:
        evaluaciones.reduce((acc, e) => acc + e.scoreGeneral, 0) / evaluaciones.length ||
        0,
    };

    return NextResponse.json({
      evaluaciones,
      promedios,
      total: evaluaciones.length,
    });
  } catch (error) {
    console.error("Error al obtener evaluaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener evaluaciones" },
      { status: 500 }
    );
  }
}

// POST /api/maquinaria/operadores/evaluaciones - Crear evaluación
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const {
      operador,
      maquinariaId,
      fecha,
      duracionJornada,
      velocidadPromedio,
      velocidadMaxima,
      frenadosBruscos,
      aceleracionesBruscas,
      girosBruscos,
      excesosVelocidad,
      tiempoTrabajando,
      tiempoRalenti,
      consumoCombustible,
      usoAdecuado,
      mantenimientoDiario,
      reporteProblemas,
      observaciones,
      incidentes,
    } = body;

    // Validaciones
    if (!operador || !maquinariaId || !duracionJornada) {
      return NextResponse.json(
        { error: "Campos requeridos: operador, maquinariaId, duracionJornada" },
        { status: 400 }
      );
    }

    // Calcular scores

    // 1. Score de Seguridad (0-100)
    let scoreSeguridad = 100;
    scoreSeguridad -= (frenadosBruscos || 0) * 5; // -5 pts por frenado brusco
    scoreSeguridad -= (aceleracionesBruscas || 0) * 5;
    scoreSeguridad -= (girosBruscos || 0) * 3;
    scoreSeguridad -= (excesosVelocidad || 0) * 10;
    scoreSeguridad = Math.max(0, scoreSeguridad);

    // 2. Score de Eficiencia (0-100)
    const totalTiempo = (tiempoTrabajando || 0) + (tiempoRalenti || 0);
    const eficienciaTiempo =
      totalTiempo > 0 ? ((tiempoTrabajando || 0) / totalTiempo) * 100 : 0;

    const consumoPorHora =
      tiempoTrabajando && consumoCombustible
        ? consumoCombustible / tiempoTrabajando
        : 0;
    const consumoIdeal = 12.5; // L/h
    const eficienciaConsumo =
      consumoPorHora > 0
        ? Math.max(0, 100 - Math.abs(consumoPorHora - consumoIdeal) * 5)
        : 100;

    const scoreEficiencia = (eficienciaTiempo + eficienciaConsumo) / 2;

    // 3. Score de Cuidado (0-100)
    let scoreCuidado = 0;
    if (usoAdecuado) scoreCuidado += 40;
    if (mantenimientoDiario) scoreCuidado += 30;
    if (reporteProblemas) scoreCuidado += 30;

    // 4. Score General
    const scoreGeneral = (scoreSeguridad + scoreEficiencia + scoreCuidado) / 3;

    // Determinar calificación
    let calificacion = "Mala";
    if (scoreGeneral >= 90) calificacion = "Excelente";
    else if (scoreGeneral >= 75) calificacion = "Muy Buena";
    else if (scoreGeneral >= 60) calificacion = "Buena";
    else if (scoreGeneral >= 40) calificacion = "Regular";

    const evaluacion = await prisma.evaluacionOperador.create({
      data: {
        userId: user.id,
        operador,
        maquinariaId,
        fecha: fecha ? new Date(fecha) : new Date(),
        duracionJornada: parseFloat(duracionJornada),
        velocidadPromedio: velocidadPromedio ? parseFloat(velocidadPromedio) : 0,
        velocidadMaxima: velocidadMaxima ? parseFloat(velocidadMaxima) : 0,
        frenadosBruscos: frenadosBruscos || 0,
        aceleracionesBruscas: aceleracionesBruscas || 0,
        girosBruscos: girosBruscos || 0,
        excesosVelocidad: excesosVelocidad || 0,
        tiempoTrabajando: tiempoTrabajando ? parseFloat(tiempoTrabajando) : 0,
        tiempoRalenti: tiempoRalenti ? parseFloat(tiempoRalenti) : 0,
        consumoCombustible: consumoCombustible ? parseFloat(consumoCombustible) : 0,
        consumoPorHora,
        usoAdecuado: usoAdecuado !== false,
        mantenimientoDiario: mantenimientoDiario !== false,
        reporteProblemas: reporteProblemas !== false,
        scoreSeguridad,
        scoreEficiencia,
        scoreCuidado,
        scoreGeneral,
        calificacion,
        observaciones,
        incidentes,
      },
    });

    // Actualizar score promedio del operador
    const operadorRecord = await prisma.operador.findFirst({
      where: {
        nombre: operador.split(" ")[0],
        apellido: operador.split(" ")[1] || "",
      },
    });

    if (operadorRecord) {
      const todasEvaluaciones = await prisma.evaluacionOperador.findMany({
        where: { operador },
      });

      const nuevoPromedio =
        todasEvaluaciones.reduce((acc, e) => acc + e.scoreGeneral, 0) /
        todasEvaluaciones.length;

      await prisma.operador.update({
        where: { id: operadorRecord.id },
        data: {
          scorePromedio: nuevoPromedio,
          totalEvaluaciones: todasEvaluaciones.length,
        },
      });
    }

    return NextResponse.json(evaluacion, { status: 201 });
  } catch (error) {
    console.error("Error al crear evaluación:", error);
    return NextResponse.json({ error: "Error al crear evaluación" }, { status: 500 });
  }
}