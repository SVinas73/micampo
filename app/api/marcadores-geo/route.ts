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

    const marcadores = await prisma.marcadorGeorreferenciado.findMany({
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

    return NextResponse.json(marcadores);
  } catch (error) {
    console.error("Error al obtener marcadores:", error);
    return NextResponse.json(
      { error: "Error al obtener marcadores" },
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
      loteId,
      establecimientoId,
      latitud,
      longitud,
      tipo,
      titulo,
      descripcion,
      imagenes,
      responsable,
    } = await request.json();

    if ((!loteId && !establecimientoId) || !latitud || !longitud || !tipo || !titulo) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (lote o establecimiento + ubicación + tipo + título)" },
        { status: 400 }
      );
    }

    // Verificar propiedad del lote o establecimiento al que se asocia la nota
    if (loteId) {
      const lote = await prisma.lote.findUnique({ where: { id: loteId }, select: { userId: true } });
      if (!lote || lote.userId !== session.user.id) {
        return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
      }
    } else if (establecimientoId) {
      const est = await prisma.establecimiento.findUnique({ where: { id: establecimientoId }, select: { userId: true } });
      if (!est || est.userId !== session.user.id) {
        return NextResponse.json({ error: "Establecimiento no encontrado" }, { status: 404 });
      }
    }

    const marcador = await prisma.marcadorGeorreferenciado.create({
      data: {
        loteId: loteId || null,
        establecimientoId: establecimientoId || null,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        tipo,
        titulo,
        descripcion: descripcion || null,
        imagenes: imagenes || null,
        responsable: responsable || null,
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

    return NextResponse.json(marcador, { status: 201 });
  } catch (error) {
    console.error("Error al crear marcador:", error);
    return NextResponse.json(
      { error: "Error al crear marcador" },
      { status: 500 }
    );
  }
}