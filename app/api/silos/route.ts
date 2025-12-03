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

    const silos = await prisma.silo.findMany({
      where: { userId: session.user.id },
      include: {
        movimientos: {
          orderBy: { fecha: "desc" },
          take: 10,
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(silos);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener silos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const porcentaje = (data.stockActual / data.capacidadTotal) * 100;

    const silo = await prisma.silo.create({
      data: {
        ...data,
        porcentaje,
        userId: session.user.id,
      },
    });

    return NextResponse.json(silo, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear silo" }, { status: 500 });
  }
}