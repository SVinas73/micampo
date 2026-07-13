import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tropas = await prisma.tropa.findMany({
      where: { userId: session.user.id },
      include: {
        lote: { select: { id: true, nombre: true, hectareas: true } },
        rutina: true,
        _count: { select: { animales: true } },
        animales: {
          select: {
            id: true,
            caravana: true,
            nombre: true,
            categoria: true,
            raza: true,
            sexo: true,
            estado: true,
            registrosPeso: { orderBy: { fecha: "desc" }, take: 1, select: { peso: true, fecha: true } },
            historialReproductivo: { select: { estadoActual: true } },
            tratamientos: {
              where: { estado: { in: ["En curso", "En retiro"] } },
              select: { id: true, estado: true },
            },
          },
        },
        movimientos: { orderBy: { fecha: "desc" }, take: 5 },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(tropas);
  } catch (error) {
    console.error("Error al obtener tropas:", error);
    return NextResponse.json({ error: "Error al obtener tropas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { nombre, categoria, color, loteId, rutinaId, notas, animalIds } = await request.json();

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const tropa = await prisma.tropa.create({
      data: {
        nombre,
        categoria: categoria || null,
        color: color || null,
        loteId: loteId || null,
        rutinaId: rutinaId || null,
        notas: notas || null,
        userId: session.user.id,
      },
    });

    // Asignar animales iniciales (si vienen)
    if (Array.isArray(animalIds) && animalIds.length > 0) {
      await prisma.animal.updateMany({
        where: { id: { in: animalIds }, userId: session.user.id },
        data: { tropaId: tropa.id },
      });
    }

    const completa = await prisma.tropa.findUnique({
      where: { id: tropa.id },
      include: {
        lote: { select: { id: true, nombre: true } },
        _count: { select: { animales: true } },
      },
    });

    return NextResponse.json(completa, { status: 201 });
  } catch (error) {
    console.error("Error al crear tropa:", error);
    return NextResponse.json({ error: "Error al crear tropa" }, { status: 500 });
  }
}
