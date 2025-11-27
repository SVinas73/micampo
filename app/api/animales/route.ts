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

    const animales = await prisma.animal.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        eventosSanitarios: true,
        registrosPeso: {
          orderBy: { fecha: "desc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(animales);
  } catch (error) {
    console.error("Error al obtener animales:", error);
    return NextResponse.json(
      { error: "Error al obtener animales" },
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

    const { caravana, tipo, raza, sexo, fechaNacimiento, pesoNacimiento, madre, padre } = await request.json();

    if (!caravana || !tipo || !sexo) {
      return NextResponse.json(
        { error: "Caravana, tipo y sexo son requeridos" },
        { status: 400 }
      );
    }

    const animal = await prisma.animal.create({
      data: {
        caravana,
        tipo,
        raza: raza || null,
        sexo,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        pesoNacimiento: pesoNacimiento ? parseFloat(pesoNacimiento) : null,
        madre: madre || null,
        padre: padre || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(animal, { status: 201 });
  } catch (error) {
    console.error("Error al crear animal:", error);
    return NextResponse.json(
      { error: "Error al crear animal" },
      { status: 500 }
    );
  }
}