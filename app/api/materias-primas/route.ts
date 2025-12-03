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

    const materias = await prisma.materiaPrima.findMany({
      where: { userId: session.user.id },
      include: {
        movimientos: {
          orderBy: { fecha: "desc" },
          take: 5,
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(materias);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener materias primas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const materia = await prisma.materiaPrima.create({
      data: {
        ...data,
        alertaStockBajo: data.stockActual <= data.stockMinimo,
        valorStock: data.stockActual * (data.precioUnitario || 0),
        userId: session.user.id,
      },
    });

    return NextResponse.json(materia, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear materia prima" }, { status: 500 });
  }
}