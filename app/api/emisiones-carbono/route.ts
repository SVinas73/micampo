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

    const emisiones = await prisma.emisionCarbono.findMany({
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
        fecha: "desc",
      },
    });

    return NextResponse.json(emisiones);
  } catch (error) {
    console.error("Error al obtener emisiones:", error);
    return NextResponse.json(
      { error: "Error al obtener emisiones" },
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

    const { fuente, actividad, cantidad, unidad, factorEmision, fecha, loteId } = await request.json();

    if (!fuente || !actividad || !cantidad || !unidad || !factorEmision || !fecha) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const emisionTotal = parseFloat(cantidad) * parseFloat(factorEmision);

    const emision = await prisma.emisionCarbono.create({
      data: {
        fuente,
        actividad,
        cantidad: parseFloat(cantidad),
        unidad,
        factorEmision: parseFloat(factorEmision),
        emisionTotal,
        fecha: new Date(fecha),
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

    return NextResponse.json(emision, { status: 201 });
  } catch (error) {
    console.error("Error al crear emisión:", error);
    return NextResponse.json(
      { error: "Error al crear emisión" },
      { status: 500 }
    );
  }
}