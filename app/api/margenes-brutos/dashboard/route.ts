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

    const userId = session.user.id;

    // Calcular totales del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transaccionesMes = await prisma.transaccion.findMany({
      where: {
        userId,
        fecha: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const ingresosMes = transaccionesMes
      .filter((t) => t.tipo === "Ingreso")
      .reduce((sum, t) => sum + t.monto, 0);

    const gastosMes = transaccionesMes
      .filter((t) => t.tipo === "Gasto")
      .reduce((sum, t) => sum + t.monto, 0);

    const margenMes = ingresosMes - gastosMes;

    // Márgenes por lote
    const margenesPorLote = await prisma.margenBruto.findMany({
      where: {
        userId,
        tipo: "Lote",
      },
      orderBy: { porcentajeMargen: "desc" },
      take: 10,
    });

    // Márgenes por período (últimos 12 meses)
    const marginesTotales = await prisma.margenBruto.findMany({
      where: {
        userId,
        tipo: "General",
      },
      orderBy: { periodo: "desc" },
      take: 12,
    });

    // Top costos por categoría
    const transaccionesGastos = await prisma.transaccion.findMany({
      where: {
        userId,
        tipo: "Gasto",
        fecha: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const costosPorCategoria = transaccionesGastos.reduce((acc, t) => {
      const cat = t.categoria || "Sin Categoría";
      acc[cat] = (acc[cat] || 0) + t.monto;
      return acc;
    }, {} as Record<string, number>);

    // Cuentas por pagar vencidas
    const cuentasVencidas = await prisma.cuentaPorPagar.findMany({
      where: {
        userId,
        estadoPago: { not: "Pagado" },
        fechaVencimiento: { lt: new Date() },
      },
    });

    const montoVencido = cuentasVencidas.reduce((sum, c) => sum + c.saldo, 0);

    // Cuentas por cobrar pendientes
    const facturasNoCobradas = await prisma.facturaEmitida.findMany({
      where: {
        userId,
        estadoCobro: { not: "Cobrado" },
      },
    });

    const montoPorCobrar = facturasNoCobradas.reduce((sum, f) => sum + f.saldo, 0);

    return NextResponse.json({
      resumenMesActual: {
        ingresos: ingresosMes,
        gastos: gastosMes,
        margen: margenMes,
        porcentajeMargen: ingresosMes > 0 ? (margenMes / ingresosMes) * 100 : 0,
      },
      margenesPorLote: margenesPorLote.map((m) => ({
        ...m,
        detalles: JSON.parse(m.detalles || "{}"),
      })),
      marginesTotales: marginesTotales.map((m) => ({
        ...m,
        detalles: JSON.parse(m.detalles || "{}"),
      })),
      costosPorCategoria: Object.entries(costosPorCategoria).map(([categoria, monto]) => ({
        categoria,
        monto,
      })),
      alertas: {
        cuentasVencidas: cuentasVencidas.length,
        montoVencido,
        cuentasPorCobrar: facturasNoCobradas.length,
        montoPorCobrar,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener dashboard" }, { status: 500 });
  }
}