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
    const animalId = searchParams.get("animalId");

    const where: any = {
      userId: session.user.id,
    };

    if (animalId) {
      where.animalId = animalId;
    }

    const registros = await prisma.registroLechero.findMany({
      where,
      include: {
        animal: {
          select: {
            caravana: true,
            raza: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
      take: 200,
    });

    return NextResponse.json(registros);
  } catch (error) {
    console.error("Error al obtener registros lecheros:", error);
    return NextResponse.json(
      { error: "Error al obtener registros lecheros" },
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

    const { animalId, fecha, litros, turno, calidad, observaciones } = await request.json();

    if (!animalId || !fecha || litros === undefined) {
      return NextResponse.json(
        { error: "Animal, fecha y litros son requeridos" },
        { status: 400 }
      );
    }

    const registro = await prisma.registroLechero.create({
      data: {
        animalId,
        fecha: new Date(fecha),
        litros: parseFloat(litros),
        turno: turno || null,
        calidad: calidad || null,
        observaciones: observaciones || null,
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
            raza: true,
          },
        },
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error al crear registro lechero:", error);
    return NextResponse.json(
      { error: "Error al crear registro lechero" },
      { status: 500 }
    );
  }
}