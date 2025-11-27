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

    const lotes = await prisma.lote.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        siembras: true,
        cosechas: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(lotes);
  } catch (error) {
    console.error("Error al obtener lotes:", error);
    return NextResponse.json(
      { error: "Error al obtener lotes" },
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

    const { nombre, hectareas, cultivo } = await request.json();

    if (!nombre || !hectareas) {
      return NextResponse.json(
        { error: "Nombre y hectáreas son requeridos" },
        { status: 400 }
      );
    }

    const lote = await prisma.lote.create({
      data: {
        nombre,
        hectareas: parseFloat(hectareas),
        cultivo: cultivo || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(lote, { status: 201 });
  } catch (error) {
    console.error("Error al crear lote:", error);
    return NextResponse.json(
      { error: "Error al crear lote" },
      { status: 500 }
    );
  }
}