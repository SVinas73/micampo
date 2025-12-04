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

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha") || new Date().toISOString().split("T")[0];

    // ACTIVOS
    // Cuentas bancarias
    const cuentasBancarias = await prisma.cuentaBancaria.findMany({
      where: { userId: session.user.id },
    });
    const efectivoBancos = cuentasBancarias.reduce((sum, c) => sum + c.saldo, 0);

    // Cuentas por cobrar
    const cuentasPorCobrar = await prisma.facturaEmitida.findMany({
      where: {
        userId: session.user.id,
        estadoCobro: { not: "Cobrado" },
      },
    });
    const totalPorCobrar = cuentasPorCobrar.reduce((sum, f) => sum + f.saldo, 0);

    // Inventarios (stocks)
    const stocks = await prisma.stockInsumo.findMany({
      where: { userId: session.user.id },
    });
    const valorInventarios = stocks.reduce((sum, s) => sum + (s.valorStock || 0), 0);

    // Activos fijos
    const activosFijos = await prisma.activoFijo.findMany({
      where: {
        userId: session.user.id,
        estado: "Activo",
      },
    });
    const valorActivosFijos = activosFijos.reduce((sum, a) => sum + a.valorActual, 0);

    const totalActivos = efectivoBancos + totalPorCobrar + valorInventarios + valorActivosFijos;

    // PASIVOS
    // Cuentas por pagar
    const cuentasPorPagar = await prisma.cuentaPorPagar.findMany({
      where: {
        userId: session.user.id,
        estadoPago: { not: "Pagado" },
      },
    });
    const totalPorPagar = cuentasPorPagar.reduce((sum, c) => sum + c.saldo, 0);

    const totalPasivos = totalPorPagar;

    // PATRIMONIO
    const patrimonio = totalActivos - totalPasivos;

    return NextResponse.json({
      fecha,
      activos: {
        corrientes: {
          efectivoBancos,
          cuentasPorCobrar: totalPorCobrar,
          inventarios: valorInventarios,
          total: efectivoBancos + totalPorCobrar + valorInventarios,
        },
        noCoorrientes: {
          activosFijos: valorActivosFijos,
          total: valorActivosFijos,
        },
        total: totalActivos,
      },
      pasivos: {
        corrientes: {
          cuentasPorPagar: totalPorPagar,
          total: totalPorPagar,
        },
        total: totalPasivos,
      },
      patrimonio: {
        patrimonioNeto: patrimonio,
        total: patrimonio,
      },
      verificacion: {
        balanceado: Math.abs(totalActivos - (totalPasivos + patrimonio)) < 0.01,
        diferencia: totalActivos - (totalPasivos + patrimonio),
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al generar balance" }, { status: 500 });
  }
}