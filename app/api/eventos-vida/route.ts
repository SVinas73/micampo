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

    if (!animalId) {
      return NextResponse.json(
        { error: "animalId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el animal pertenece al usuario
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
    });

    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Animal no encontrado" },
        { status: 404 }
      );
    }

    // Obtener todos los eventos del animal
    const eventos = await prisma.eventoVida.findMany({
      where: {
        animalId,
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(eventos);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos" },
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

    const {
      animalId,
      fecha,
      tipoEvento,
      titulo,
      descripcion,
      valorNumerico,
      unidad,
      ubicacion,
      importante,
      alerta,
    } = await request.json();

    if (!animalId || !tipoEvento || !titulo) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Verificar que el animal existe
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
    });

    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Animal no encontrado" },
        { status: 404 }
      );
    }

    const evento = await prisma.eventoVida.create({
      data: {
        animalId,
        fecha: fecha ? new Date(fecha) : new Date(),
        tipoEvento,
        titulo,
        descripcion: descripcion || null,
        valorNumerico: valorNumerico ? parseFloat(valorNumerico) : null,
        unidad: unidad || null,
        ubicacion: ubicacion || null,
        importante: importante || false,
        alerta: alerta || false,
        userId: session.user.id,
      },
    });

    return NextResponse.json(evento, { status: 201 });
  } catch (error) {
    console.error("Error al crear evento:", error);
    return NextResponse.json(
      { error: "Error al crear evento" },
      { status: 500 }
    );
  }
}