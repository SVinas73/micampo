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

    const maquinas = await prisma.maquina.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        mantenimientos: {
          orderBy: { fecha: "desc" },
          take: 1,
        },
        _count: {
          select: {
            mantenimientos: true,
            registrosHoras: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(maquinas);
  } catch (error) {
    console.error("Error al obtener maquinas:", error);
    return NextResponse.json(
      { error: "Error al obtener maquinas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { nombre, tipo, marca, modelo, anio, horasActuales } = await request.json();

    if (!nombre || !tipo) {
      return NextResponse.json(
        { error: "Nombre y tipo son requeridos" },
        { status: 400 }
      );
    }

    const maquina = await prisma.maquina.create({
      data: {
        nombre,
        tipo,
        marca: marca || null,
        modelo: modelo || null,
        anio: anio ? parseInt(anio) : null,
        horasActuales: horasActuales ? parseFloat(horasActuales) : 0,
        userId: session.user.id,
      },
    });

    return NextResponse.json(maquina, { status: 201 });
  } catch (error) {
    console.error("Error al crear maquina:", error);
    return NextResponse.json(
      { error: "Error al crear maquina" },
      { status: 500 }
    );
  }
}