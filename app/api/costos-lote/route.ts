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
    const loteId = searchParams.get("loteId");

    const where: any = {
      userId: session.user.id,
    };

    if (loteId) {
      where.loteId = loteId;
    }

    const costos = await prisma.costoLote.findMany({
      where,
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

    return NextResponse.json(costos);
  } catch (error) {
    console.error("Error al obtener costos:", error);
    return NextResponse.json(
      { error: "Error al obtener costos" },
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

    const { loteId, concepto, descripcion, monto, fecha, laborId } = await request.json();

    if (!loteId || !concepto || !descripcion || monto === undefined || !fecha) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const costo = await prisma.costoLote.create({
      data: {
        loteId,
        concepto,
        descripcion,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
        laborId: laborId || null,
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

    return NextResponse.json(costo, { status: 201 });
  } catch (error) {
    console.error("Error al crear costo:", error);
    return NextResponse.json(
      { error: "Error al crear costo" },
      { status: 500 }
    );
  }
}