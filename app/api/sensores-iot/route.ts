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

    const sensores = await prisma.sensorIoT.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
        lecturas: {
          orderBy: {
            timestamp: "desc",
          },
          take: 10,
        },
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(sensores);
  } catch (error) {
    console.error("Error al obtener sensores:", error);
    return NextResponse.json(
      { error: "Error al obtener sensores" },
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
      nombre,
      tipo,
      marca,
      modelo,
      latitud,
      longitud,
      profundidad,
      protocolo,
      endpoint,
      apiKey,
      frecuenciaMedicion,
      alertaMin,
      alertaMax,
      unidad,
      observaciones,
    } = await request.json();

    if (!nombre || !tipo || !unidad) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const sensor = await prisma.sensorIoT.create({
      data: {
        loteId: loteId || null,
        nombre,
        tipo,
        marca: marca || null,
        modelo: modelo || null,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        profundidad: profundidad ? parseFloat(profundidad) : null,
        protocolo: protocolo || null,
        endpoint: endpoint || null,
        apiKey: apiKey || null,
        frecuenciaMedicion: frecuenciaMedicion ? parseInt(frecuenciaMedicion) : null,
        alertaMin: alertaMin ? parseFloat(alertaMin) : null,
        alertaMax: alertaMax ? parseFloat(alertaMax) : null,
        unidad,
        observaciones: observaciones || null,
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

    return NextResponse.json(sensor, { status: 201 });
  } catch (error) {
    console.error("Error al crear sensor:", error);
    return NextResponse.json(
      { error: "Error al crear sensor IoT" },
      { status: 500 }
    );
  }
}