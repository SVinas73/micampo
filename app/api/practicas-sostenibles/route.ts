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

    const practicas = await prisma.practicaSostenible.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    return NextResponse.json(practicas);
  } catch (error) {
    console.error("Error al obtener prácticas:", error);
    return NextResponse.json(
      { error: "Error al obtener prácticas" },
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

    const { tipo, nombre, descripcion, fechaInicio, fechaFin, beneficio, loteId } = await request.json();

    if (!tipo || !nombre || !descripcion || !fechaInicio) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const practica = await prisma.practicaSostenible.create({
      data: {
        tipo,
        nombre,
        descripcion,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        beneficio: beneficio || null,
        loteId: loteId || null,
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(practica, { status: 201 });
  } catch (error) {
    console.error("Error al crear práctica:", error);
    return NextResponse.json(
      { error: "Error al crear práctica" },
      { status: 500 }
    );
  }
}