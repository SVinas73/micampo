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

    const registros = await prisma.registroPeso.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(registros);
  } catch (error) {
    console.error("Error al obtener registros:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
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

    const { fecha, peso, animalId, tipoMedicion } = await request.json();

    if (!fecha || !peso || !animalId) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const registro = await prisma.registroPeso.create({
      data: {
        fecha: new Date(fecha),
        peso: parseFloat(peso),
        tipoMedicion: tipoMedicion || "Intermedio",
        animalId,
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
          },
        },
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error al crear registro:", error);
    return NextResponse.json(
      { error: "Error al crear registro" },
      { status: 500 }
    );
  }
}