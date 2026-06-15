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
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
    }

    const whereCondition: any = {
      userId: session.user.id,
      fecha: {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      },
    };

    // Obtener todas las transacciones del período
    const transacciones = await prisma.transaccion.findMany({
      where: whereCondition,
      orderBy: { fecha: "asc" },
    });

    // Agrupar ingresos por categoría
    const ingresosPorCategoria = transacciones
      .filter((t) => t.tipo === "Ingreso")
      .reduce((acc, t) => {
        const cat = t.categoria || "Otros";
        acc[cat] = (acc[cat] || 0) + parseFloat(t.monto.toString());  // CORREGIDO
        return acc;
      }, {} as Record<string, number>);

    const totalIngresos = Object.values(ingresosPorCategoria).reduce((sum, v) => sum + v, 0);

    // Agrupar gastos por categoría
    const gastosPorCategoria = transacciones
      .filter((t) => t.tipo === "Gasto")
      .reduce((acc, t) => {
        const cat = t.categoria || "Otros";
        acc[cat] = (acc[cat] || 0) + parseFloat(t.monto.toString());  // CORREGIDO
        return acc;
      }, {} as Record<string, number>);

    const totalGastos = Object.values(gastosPorCategoria).reduce((sum, v) => sum + v, 0);

    // Calcular resultado
    const utilidadNeta = totalIngresos - totalGastos;
    const margenNeto = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;

    return NextResponse.json({
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin,
      },
      ingresos: {
        porCategoria: Object.entries(ingresosPorCategoria).map(([categoria, monto]) => ({
          categoria,
          monto,
          porcentaje: (monto / totalIngresos) * 100,
        })),
        total: totalIngresos,
      },
      gastos: {
        porCategoria: Object.entries(gastosPorCategoria).map(([categoria, monto]) => ({
          categoria,
          monto,
          porcentaje: (monto / totalGastos) * 100,
        })),
        total: totalGastos,
      },
      resultado: {
        utilidadNeta,
        margenNeto,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
  }
}