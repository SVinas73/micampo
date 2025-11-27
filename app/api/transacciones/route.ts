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

    const transacciones = await prisma.transaccion.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        campo: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(transacciones);
  } catch (error) {
    console.error("Error al obtener transacciones:", error);
    return NextResponse.json(
      { error: "Error al obtener transacciones" },
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

    const { tipo, categoria, monto, descripcion, fecha } = await request.json();

    // Validar campos requeridos
    if (!tipo || !categoria || !monto || !fecha) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Crear transacción
    const transaccion = await prisma.transaccion.create({
      data: {
        tipo,
        categoria,
        monto,
        descripcion,
        fecha: new Date(fecha),
        userId: session.user.id,
      },
      include: {
        campo: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(transaccion, { status: 201 });
  } catch (error) {
    console.error("Error al crear transacción:", error);
    return NextResponse.json(
      { error: "Error al crear transacción" },
      { status: 500 }
    );
  }
}