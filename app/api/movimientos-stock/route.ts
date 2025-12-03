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
    const stockInsumoId = searchParams.get("stockInsumoId");

    const where: any = { userId: session.user.id };
    if (stockInsumoId) where.stockInsumoId = stockInsumoId;

    const movimientos = await prisma.movimientoStock.findMany({
      where,
      include: {
        stockInsumo: {
          select: { nombre: true, categoria: true, unidadMedida: true },
        },
      },
      orderBy: { fecha: "desc" },
      take: 100,
    });

    return NextResponse.json(movimientos);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Obtener stock actual
    const stockInsumo = await prisma.stockInsumo.findUnique({
      where: { id: data.stockInsumoId },
    });

    if (!stockInsumo) {
      return NextResponse.json({ error: "Stock no encontrado" }, { status: 404 });
    }

    const stockAnterior = stockInsumo.stockActual;
    let stockPosterior = stockAnterior;

    // Calcular nuevo stock según tipo
    if (data.tipoMovimiento === "Entrada") {
      stockPosterior = stockAnterior + data.cantidad;
    } else if (data.tipoMovimiento === "Salida") {
      stockPosterior = stockAnterior - data.cantidad;
    } else if (data.tipoMovimiento === "Ajuste") {
      stockPosterior = data.cantidad;
    }

    // Crear movimiento
    const movimiento = await prisma.movimientoStock.create({
      data: {
        ...data,
        stockAnterior,
        stockPosterior,
        userId: session.user.id,
      },
    });

    // Actualizar stock
    await prisma.stockInsumo.update({
      where: { id: data.stockInsumoId },
      data: {
        stockActual: stockPosterior,
        alertaStockBajo: stockPosterior <= stockInsumo.stockMinimo,
        valorStock: stockPosterior * (stockInsumo.precioUnitario || 0),
      },
    });

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear movimiento" }, { status: 500 });
  }
}