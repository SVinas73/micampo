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
    const categoria = searchParams.get("categoria");

    const where: any = { userId: session.user.id };
    if (categoria) where.categoria = categoria;

    const stocks = await prisma.stockInsumo.findMany({
      where,
      include: {
        lotes: {
          where: { cantidadActual: { gt: 0 } },
          orderBy: { fechaVencimiento: "asc" },
        },
        alertas: {
          where: { estado: "Activa" },
          orderBy: { fechaDeteccion: "desc" },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(stocks);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener stocks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const stock = await prisma.stockInsumo.create({
      data: {
        ...data,
        userId: session.user.id,
        alertaStockBajo: data.stockActual <= data.stockMinimo,
        valorStock: data.stockActual * (data.precioUnitario || 0),
      },
    });

    // Verificar alerta
    if (stock.alertaStockBajo) {
      await prisma.alertaStock.create({
        data: {
          stockInsumoId: stock.id,
          tipo: "StockBajo",
          severidad: stock.stockActual === 0 ? "Crítica" : "Alta",
          titulo: `Stock bajo: ${stock.nombre}`,
          mensaje: `Stock actual: ${stock.stockActual} ${stock.unidadMedida}. Mínimo: ${stock.stockMinimo} ${stock.unidadMedida}`,
          stockActual: stock.stockActual,
          stockMinimo: stock.stockMinimo,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(stock, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear stock" }, { status: 500 });
  }
}