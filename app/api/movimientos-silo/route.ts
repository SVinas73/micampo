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
    const siloId = searchParams.get("siloId");

    const where: any = { userId: session.user.id };
    if (siloId) where.siloId = siloId;

    const movimientos = await prisma.movimientoSilo.findMany({
      where,
      include: {
        silo: {
          select: { nombre: true, tipoSilo: true },
        },
        calidadGrano: true,
        ticketBalanza: true,
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

    // Obtener silo
    const silo = await prisma.silo.findUnique({
      where: { id: data.siloId },
    });

    if (!silo) {
      return NextResponse.json({ error: "Silo no encontrado" }, { status: 404 });
    }

    const stockAnterior = silo.stockActual;
    let stockPosterior = stockAnterior;

    if (data.tipoMovimiento === "Entrada") {
      stockPosterior = stockAnterior + data.cantidad;
    } else if (data.tipoMovimiento === "Salida") {
      stockPosterior = stockAnterior - data.cantidad;
    } else if (data.tipoMovimiento === "Ajuste") {
      stockPosterior = data.cantidad;
    }

    const movimiento = await prisma.movimientoSilo.create({
      data: {
        ...data,
        stockAnterior,
        stockPosterior,
        userId: session.user.id,
      },
    });

    // Actualizar silo
    await prisma.silo.update({
      where: { id: data.siloId },
      data: {
        stockActual: stockPosterior,
        porcentaje: (stockPosterior / silo.capacidadTotal) * 100,
      },
    });

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear movimiento" }, { status: 500 });
  }
}