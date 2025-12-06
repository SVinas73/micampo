import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const establecimientoId = searchParams.get("establecimientoId");

    if (!establecimientoId) {
      return NextResponse.json(
        { error: "establecimientoId requerido" },
        { status: 400 }
      );
    }

    // ============================================
    // 1. HUELLA DE CARBONO
    // ============================================
    const huellas = await prisma.huellaCarbono.findMany({
      where: { establecimientoId },
      orderBy: { fechaInicio: "desc" },
      take: 12, // Últimos 12 períodos
    });

    const ultimaHuella = huellas[0];
    const tendenciaEmisiones =
      huellas.length >= 2
        ? ((huellas[0].emisionesTotales - huellas[1].emisionesTotales) /
            huellas[1].emisionesTotales) *
          100
        : 0;

    // ============================================
    // 2. RECETAS AGRONÓMICAS
    // ============================================
    const recetas = await prisma.recetaAgronomica.findMany({
      where: { establecimientoId },
    });

    const recetasPorEstado = {
      pendientes: recetas.filter((r) => r.estado === "Pendiente").length,
      aprobadas: recetas.filter((r) => r.estado === "Aprobada").length,
      aplicadas: recetas.filter((r) => r.estado === "Aplicada").length,
      vencidas: recetas.filter((r) => r.estado === "Vencida").length,
    };

    // ============================================
    // 3. REPORTES AGROQUÍMICOS
    // ============================================
    const reportes = await prisma.reporteAgroquimico.findMany({
      where: { establecimientoId },
    });

    const reportesPorEstado = {
      borradores: reportes.filter((r) => r.estado === "Borrador").length,
      enviados: reportes.filter((r) => r.estado === "Enviado").length,
      aprobados: reportes.filter((r) => r.estado === "Aprobado").length,
    };

    // Último reporte
    const ultimoReporte = reportes.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

    // ============================================
    // 4. CERTIFICACIONES
    // ============================================
    const certificaciones = await prisma.certificacionSostenibilidad.findMany({
      where: { establecimientoId },
      include: {
        _count: {
          select: {
            checklistItems: true,
          },
        },
      },
    });

    const certificacionesPorEstado = {
      enProceso: certificaciones.filter((c) => c.estado === "En Proceso").length,
      vigentes: certificaciones.filter((c) => c.estado === "Vigente").length,
      porRenovar: certificaciones.filter((c) => c.estado === "Por Renovar").length,
      vencidas: certificaciones.filter((c) => c.estado === "Vencida").length,
    };

    // ============================================
    // 5. EUDR
    // ============================================
    const declaracionesEUDR = await prisma.complianceEUDR.findMany({
      where: { establecimientoId },
    });

    const eudrPorEstado = {
      enPreparacion: declaracionesEUDR.filter((d) => d.estado === "En Preparación")
        .length,
      declaradas: declaracionesEUDR.filter((d) => d.estado === "Declarado").length,
      verificadas: declaracionesEUDR.filter((d) => d.estado === "Verificado").length,
      aprobadas: declaracionesEUDR.filter((d) => d.estado === "Aprobado").length,
    };

    const eudrPorRiesgo = {
      bajo: declaracionesEUDR.filter((d) => d.nivelRiesgo === "Bajo").length,
      medio: declaracionesEUDR.filter((d) => d.nivelRiesgo === "Medio").length,
      alto: declaracionesEUDR.filter((d) => d.nivelRiesgo === "Alto").length,
    };

    // ============================================
    // 6. RESUMEN GENERAL
    // ============================================
    return NextResponse.json({
      huellaCarbono: {
        ultima: ultimaHuella
          ? {
              emisionesTotales: ultimaHuella.emisionesTotales,
              emisionesPorHectarea: ultimaHuella.emisionesPorHectarea,
              periodo: ultimaHuella.periodo,
            }
          : null,
        tendencia: tendenciaEmisiones,
        historico: huellas.map((h) => ({
          periodo: h.periodo,
          emisionesTotales: h.emisionesTotales,
          emisionesPorHectarea: h.emisionesPorHectarea,
        })),
      },
      recetas: {
        total: recetas.length,
        porEstado: recetasPorEstado,
      },
      reportes: {
        total: reportes.length,
        porEstado: reportesPorEstado,
        ultimo: ultimoReporte
          ? {
              periodo: ultimoReporte.periodo,
              totalProductos: ultimoReporte.totalProductos,
              totalLitros: ultimoReporte.totalLitros,
              totalKilos: ultimoReporte.totalKilos,
            }
          : null,
      },
      certificaciones: {
        total: certificaciones.length,
        porEstado: certificacionesPorEstado,
        tiposActivas: certificaciones
          .filter((c) => c.estado === "Vigente")
          .map((c) => c.tipoCertificacion),
      },
      eudr: {
        total: declaracionesEUDR.length,
        porEstado: eudrPorEstado,
        porRiesgo: eudrPorRiesgo,
      },
    });
  } catch (error) {
    console.error("Error al obtener dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener dashboard" },
      { status: 500 }
    );
  }
}