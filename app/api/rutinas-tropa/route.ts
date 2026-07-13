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

    const rutinas = await prisma.rutinaTropa.findMany({
      where: { userId: session.user.id },
      include: {
        tropas: { select: { id: true, nombre: true, color: true } },
        _count: { select: { movimientos: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(rutinas);
  } catch (error) {
    console.error("Error al obtener rutinas:", error);
    return NextResponse.json({ error: "Error al obtener rutinas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { nombre, tipo, emoji, color, descripcion, config, tropaIds } = await request.json();

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const rutina = await prisma.rutinaTropa.create({
      data: {
        nombre,
        tipo: tipo || "rotacion",
        emoji: emoji || null,
        color: color || null,
        descripcion: descripcion || null,
        config: config ? JSON.stringify(config) : null,
        userId: session.user.id,
      },
    });

    if (Array.isArray(tropaIds) && tropaIds.length > 0) {
      await prisma.tropa.updateMany({
        where: { id: { in: tropaIds }, userId: session.user.id },
        data: { rutinaId: rutina.id },
      });
    }

    const completa = await prisma.rutinaTropa.findUnique({
      where: { id: rutina.id },
      include: { tropas: { select: { id: true, nombre: true, color: true } } },
    });

    return NextResponse.json(completa, { status: 201 });
  } catch (error) {
    console.error("Error al crear rutina:", error);
    return NextResponse.json({ error: "Error al crear rutina" }, { status: 500 });
  }
}
