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
    const animalId = searchParams.get("animalId");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const where: any = {
      userId: session.user.id,
    };

    if (animalId) {
      where.animalId = animalId;
    }
    if (desde || hasta) {
      where.fecha = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta + "T23:59:59") } : {}),
      };
    }

    const registros = await prisma.registroLechero.findMany({
      where,
      include: {
        animal: {
          select: {
            caravana: true,
            raza: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
      // Con rango de fechas se permite traer la serie completa (gráficas)
      take: desde || hasta ? 5000 : 200,
    });

    return NextResponse.json(registros);
  } catch (error) {
    console.error("Error al obtener registros lecheros:", error);
    return NextResponse.json(
      { error: "Error al obtener registros lecheros" },
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

    const body = await request.json();

    // Carga masiva: { registros: [{ animalId, fecha, litros, turno, observaciones }, ...] }
    if (Array.isArray(body.registros)) {
      const filas = body.registros.filter(
        (r: { animalId?: string; fecha?: string; litros?: number }) => r.animalId && r.fecha && r.litros !== undefined
      );
      if (filas.length === 0) {
        return NextResponse.json({ error: "Sin registros válidos" }, { status: 400 });
      }
      const creados = await prisma.registroLechero.createMany({
        data: filas.map((r: { animalId: string; fecha: string; litros: number | string; turno?: string; calidad?: string; observaciones?: string }) => ({
          animalId: r.animalId,
          fecha: new Date(r.fecha),
          litros: parseFloat(String(r.litros)),
          turno: r.turno || null,
          calidad: r.calidad || null,
          observaciones: r.observaciones || null,
          userId: session.user.id,
        })),
      });
      return NextResponse.json({ creados: creados.count }, { status: 201 });
    }

    const { animalId, fecha, litros, turno, calidad, observaciones } = body;

    if (!animalId || !fecha || litros === undefined) {
      return NextResponse.json(
        { error: "Animal, fecha y litros son requeridos" },
        { status: 400 }
      );
    }

    const registro = await prisma.registroLechero.create({
      data: {
        animalId,
        fecha: new Date(fecha),
        litros: parseFloat(litros),
        turno: turno || null,
        calidad: calidad || null,
        observaciones: observaciones || null,
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
            raza: true,
          },
        },
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error al crear registro lechero:", error);
    return NextResponse.json(
      { error: "Error al crear registro lechero" },
      { status: 500 }
    );
  }
}