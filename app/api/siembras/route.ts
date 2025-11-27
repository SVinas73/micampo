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

    const siembras = await prisma.siembra.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
        cosechas: true,
      },
      orderBy: {
        fechaSiembra: "desc",
      },
    });

    return NextResponse.json(siembras);
  } catch (error) {
    console.error("Error al obtener siembras:", error);
    return NextResponse.json(
      { error: "Error al obtener siembras" },
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

    const { cultivo, variedad, fechaSiembra, hectareas, loteId } = await request.json();

    if (!cultivo || !fechaSiembra || !hectareas || !loteId) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const siembra = await prisma.siembra.create({
      data: {
        cultivo,
        variedad: variedad || null,
        fechaSiembra: new Date(fechaSiembra),
        hectareas: parseFloat(hectareas),
        loteId,
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

    return NextResponse.json(siembra, { status: 201 });
  } catch (error) {
    console.error("Error al crear siembra:", error);
    return NextResponse.json(
      { error: "Error al crear siembra" },
      { status: 500 }
    );
  }
}