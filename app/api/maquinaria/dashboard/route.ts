import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/dashboard - Dashboard completo
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

    // 1. KPIs de Maquinaria
    const totalMaquinarias = await prisma.maquinaria.count({
      where: {
        establecimiento: {
          // Agregar filtro por usuario si aplica
        },
      },
    });

    const operativas = await prisma.maquinaria.count({
      where: {
        establecimiento: {},
        estado: "Operativo",
      },
    });

    const enMantenimiento = await prisma.maquinaria.count({
      where: {
        establecimiento: {},
        estado: "Mantenimiento",
      },
    });

    const averiadas = await prisma.maquinaria.count({
      where: {
        establecimiento: {},
        estado: "Averiado",
      },
    });

    // 2. Alertas activas
    const alertasCriticas = await prisma.alertaMantenimiento.count({
      where: {
        maquinaria: {
          establecimiento: {},
        },
        estado: "Activa",
        prioridad: "Crítica",
      },
    });

    const totalAlertas = await prisma.alertaMantenimiento.count({
      where: {
        maquinaria: {
          establecimiento: {},
        },
        estado: "Activa",
      },
    });

    // 3. Órdenes de taller
    const ordenesAbiertas = await prisma.ordenTaller.count({
      where: {
        maquinaria: {
          establecimiento: {},
        },
        estado: { in: ["Ingresada", "En Proceso", "Diagnosticando"] },
      },
    });

    const ordenesCompletadasMes = await prisma.ordenTaller.count({
      where: {
        maquinaria: {
          establecimiento: {},
        },
        estado: "Completada",
        fechaSalida: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    // 4. Costos del mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const ordenesDelMes = await prisma.ordenTaller.findMany({
      where: {
        maquinaria: {
          establecimiento: {},
        },
        fechaIngreso: { gte: inicioMes },
      },
      select: {
        costoTotal: true,
      },
    });

    const costoMantenimientoMes = ordenesDelMes.reduce(
      (acc, o) => acc + o.costoTotal,
      0
    );

    // 5. Eficiencia promedio
    const eficienciaRegistros = await prisma.eficienciaMaquinaria.findMany({
      where: {
        maquinaria: {
          establecimiento: {},
        },
        fecha: { gte: inicioMes },
      },
      select: {
        scoreGeneral: true,
      },
    });

    const eficienciaPromedio =
      eficienciaRegistros.length > 0
        ? eficienciaRegistros.reduce((acc, e) => acc + (e.scoreGeneral || 0), 0) /
          eficienciaRegistros.length
        : 0;

    // 6. Top 5 maquinarias por horas motor
    const topMaquinarias = await prisma.maquinaria.findMany({
      where: {
        establecimiento: {},
      },
      orderBy: { horasMotor: "desc" },
      take: 5,
      select: {
        codigo: true,
        tipo: true,
        marca: true,
        modelo: true,
        horasMotor: true,
        estado: true,
      },
    });

    // 7. Distribución por tipo
    const maquinariasPorTipo = await prisma.maquinaria.groupBy({
      by: ["tipo"],
      where: {
        establecimiento: {},
      },
      _count: true,
    });

    // 8. Últimas 10 alertas
    const ultimasAlertas = await prisma.alertaMantenimiento.findMany({
      where: {
        maquinaria: {
          establecimiento: {},
        },
        estado: "Activa",
      },
      include: {
        maquinaria: {
          select: {
            codigo: true,
            tipo: true,
            marca: true,
          },
        },
      },
      orderBy: [{ prioridad: "desc" }, { fechaCreacion: "desc" }],
      take: 10,
    });

    // 9. Sensores en estado crítico
    const sensoresCriticos = await prisma.sensorPredictivo.count({
      where: {
        maquinaria: {
          establecimiento: {},
        },
        estado: "Crítico",
      },
    });

    // 10. Evaluaciones de operadores (última semana)
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const evaluacionesRecientes = await prisma.evaluacionOperador.findMany({
      where: {
        userId: user.id,
        fecha: { gte: hace7Dias },
      },
    });

    const scoreOperadoresPromedio =
      evaluacionesRecientes.length > 0
        ? evaluacionesRecientes.reduce((acc, e) => acc + e.scoreGeneral, 0) /
          evaluacionesRecientes.length
        : 0;

    return NextResponse.json({
      kpis: {
        totalMaquinarias,
        operativas,
        enMantenimiento,
        averiadas,
        porcentajeOperativo: totalMaquinarias > 0 ? (operativas / totalMaquinarias) * 100 : 0,
      },
      alertas: {
        total: totalAlertas,
        criticas: alertasCriticas,
        sensoresCriticos,
        ultimas: ultimasAlertas,
      },
      ordenesTaller: {
        abiertas: ordenesAbiertas,
        completadasMes: ordenesCompletadasMes,
        costoMes: costoMantenimientoMes,
      },
      eficiencia: {
        promedio: eficienciaPromedio.toFixed(2),
        totalRegistros: eficienciaRegistros.length,
      },
      operadores: {
        scorePromedio: scoreOperadoresPromedio.toFixed(2),
        evaluacionesRecientes: evaluacionesRecientes.length,
      },
      topMaquinarias,
      distribucionTipos: maquinariasPorTipo.map((t) => ({
        tipo: t.tipo,
        cantidad: t._count,
      })),
    });
  } catch (error) {
    console.error("Error al obtener dashboard:", error);
    return NextResponse.json({ error: "Error al obtener dashboard" }, { status: 500 });
  }
}