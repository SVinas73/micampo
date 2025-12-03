import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Obtener repuesto actual
    const repuesto = await prisma.repuesto.findUnique({
      where: { id: data.repuestoId },
    });

    if (!repuesto) {
      return NextResponse.json({ error: "Repuesto no encontrado" }, { status: 404 });
    }

    const stockAnterior = repuesto.stockActual;
    let stockPosterior = stockAnterior;

    if (data.tipoMovimiento === "Entrada") {
      stockPosterior = stockAnterior + data.cantidad;
    } else if (data.tipoMovimiento === "Salida") {
      stockPosterior = stockAnterior - data.cantidad;
    } else if (data.tipoMovimiento === "Ajuste") {
      stockPosterior = data.cantidad;
    }

    const movimiento = await prisma.movimientoRepuesto.create({
      data: {
        ...data,
        stockAnterior,
        stockPosterior,
        userId: session.user.id,
      },
    });

    // Actualizar stock
    await prisma.repuesto.update({
      where: { id: data.repuestoId },
      data: {
        stockActual: stockPosterior,
        alertaStockBajo: stockPosterior <= repuesto.stockMinimo,
        valorStock: stockPosterior * (repuesto.precioUnitario || 0),
      },
    });

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear movimiento" }, { status: 500 });
  }
}