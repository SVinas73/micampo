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

    const mantenimientos = await prisma.mantenimiento.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        maquina: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(mantenimientos);
  } catch (error) {
    console.error("Error al obtener mantenimientos:", error);
    return NextResponse.json(
      { error: "Error al obtener mantenimientos" },
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

    const { tipo, descripcion, fecha, costo, horasActuales, maquinaId } = await request.json();

    if (!tipo || !descripcion || !fecha || !maquinaId) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const mantenimiento = await prisma.mantenimiento.create({
      data: {
        tipo,
        descripcion,
        fecha: new Date(fecha),
        costo: costo ? parseFloat(costo) : null,
        horasActuales: horasActuales ? parseFloat(horasActuales) : null,
        maquinaId,
        userId: session.user.id,
      },
      include: {
        maquina: {
          select: {
            nombre: true,
          },
        },
      },
    });

    // Actualizar horas de la máquina si se proporcionaron
    if (horasActuales) {
      await prisma.maquina.update({
        where: { id: maquinaId },
        data: { horasActuales: parseFloat(horasActuales) },
      });
    }

    return NextResponse.json(mantenimiento, { status: 201 });
  } catch (error) {
    console.error("Error al crear mantenimiento:", error);
    return NextResponse.json(
      { error: "Error al crear mantenimiento" },
      { status: 500 }
    );
  }
}