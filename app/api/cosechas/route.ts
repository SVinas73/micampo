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

    const cosechas = await prisma.cosecha.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
        siembra: {
          select: {
            cultivo: true,
            variedad: true,
          },
        },
      },
      orderBy: {
        fechaCosecha: "desc",
      },
    });

    return NextResponse.json(cosechas);
  } catch (error) {
    console.error("Error al obtener cosechas:", error);
    return NextResponse.json(
      { error: "Error al obtener cosechas" },
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

    const { fechaCosecha, rendimiento, calidad, precioVenta, siembraId, loteId } = await request.json();

    if (!fechaCosecha || !rendimiento || !siembraId || !loteId) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const cosecha = await prisma.cosecha.create({
      data: {
        fechaCosecha: new Date(fechaCosecha),
        rendimiento: parseFloat(rendimiento),
        calidad: calidad || null,
        precioVenta: precioVenta ? parseFloat(precioVenta) : null,
        siembraId,
        loteId,
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
        siembra: {
          select: {
            cultivo: true,
            variedad: true,
          },
        },
      },
    });

    return NextResponse.json(cosecha, { status: 201 });
  } catch (error) {
    console.error("Error al crear cosecha:", error);
    return NextResponse.json(
      { error: "Error al crear cosecha" },
      { status: 500 }
    );
  }
}