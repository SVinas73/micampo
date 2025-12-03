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

    const repuestos = await prisma.repuesto.findMany({
      where,
      include: {
        movimientos: {
          orderBy: { fecha: "desc" },
          take: 5,
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(repuestos);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener repuestos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const repuesto = await prisma.repuesto.create({
      data: {
        ...data,
        alertaStockBajo: data.stockActual <= data.stockMinimo,
        valorStock: data.stockActual * (data.precioUnitario || 0),
        userId: session.user.id,
      },
    });

    return NextResponse.json(repuesto, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear repuesto" }, { status: 500 });
  }
}