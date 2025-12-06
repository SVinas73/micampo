import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/operadores/[nombre]/score - Obtener score del operador
export async function GET(
  request: Request,
  { params }: { params: { nombre: string } }
) {
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

    const nombreOperador = decodeURIComponent(params.nombre);

    // Buscar evaluaciones del operador
    const evaluaciones = await prisma.evaluacionOperador.findMany({
      where: {
        userId: user.id,
        operador: nombreOperador,
      },
      orderBy: { fecha: "desc" },
      take: 30, // Últimas 30 evaluaciones
    });

    if (evaluaciones.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron evaluaciones para este operador" },
        { status: 404 }
      );
    }

    // Calcular estadísticas
    const scorePromedio =
      evaluaciones.reduce((acc, e) => acc + e.scoreGeneral, 0) / evaluaciones.length;

    const scoreSeguridadPromedio =
      evaluaciones.reduce((acc, e) => acc + e.scoreSeguridad, 0) / evaluaciones.length;

    const scoreEficienciaPromedio =
      evaluaciones.reduce((acc, e) => acc + e.scoreEficiencia, 0) / evaluaciones.length;

    const scoreCuidadoPromedio =
      evaluaciones.reduce((acc, e) => acc + e.scoreCuidado, 0) / evaluaciones.length;

    // Últimos 7 días
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const evaluacionesRecientes = evaluaciones.filter(
      (e) => new Date(e.fecha) >= hace7Dias
    );

    const scoreReciente =
      evaluacionesRecientes.length > 0
        ? evaluacionesRecientes.reduce((acc, e) => acc + e.scoreGeneral, 0) /
          evaluacionesRecientes.length
        : scorePromedio;

    // Tendencia
    const tendencia = scoreReciente > scorePromedio ? "Mejorando" : "Estable";
    const diferenciaTendencia = ((scoreReciente - scorePromedio) / scorePromedio) * 100;

    // Incidentes
    const totalIncidentes = evaluaciones.filter((e) => e.incidentes).length;

    // Ranking (comparar con otros operadores)
    const todosOperadores = await prisma.evaluacionOperador.findMany({
      where: { userId: user.id },
      distinct: ["operador"],
    });

    const operadoresConScore = await Promise.all(
      todosOperadores.map(async (op) => {
        const evals = await prisma.evaluacionOperador.findMany({
          where: {
            userId: user.id,
            operador: op.operador,
          },
        });
        return {
          operador: op.operador,
          score: evals.reduce((acc, e) => acc + e.scoreGeneral, 0) / evals.length,
        };
      })
    );

    operadoresConScore.sort((a, b) => b.score - a.score);
    const ranking =
      operadoresConScore.findIndex((op) => op.operador === nombreOperador) + 1;

    return NextResponse.json({
      operador: nombreOperador,
      scoreGeneral: scorePromedio.toFixed(2),
      scoreSeguridad: scoreSeguridadPromedio.toFixed(2),
      scoreEficiencia: scoreEficienciaPromedio.toFixed(2),
      scoreCuidado: scoreCuidadoPromedio.toFixed(2),
      tendencia,
      diferenciaTendencia: diferenciaTendencia.toFixed(2),
      totalEvaluaciones: evaluaciones.length,
      totalIncidentes,
      ranking,
      totalOperadores: operadoresConScore.length,
      evaluacionesRecientes: evaluacionesRecientes.length,
      ultimaEvaluacion: evaluaciones[0],
    });
  } catch (error) {
    console.error("Error al obtener score:", error);
    return NextResponse.json({ error: "Error al obtener score" }, { status: 500 });
  }
}