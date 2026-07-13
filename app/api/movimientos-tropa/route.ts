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
    const estado = searchParams.get("estado");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (estado) where.estado = estado;
    if (desde || hasta) {
      where.fecha = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      };
    }

    const movimientos = await prisma.movimientoTropa.findMany({
      where,
      include: {
        tropa: { select: { id: true, nombre: true, color: true, categoria: true, _count: { select: { animales: true } } } },
        rutina: { select: { id: true, nombre: true, emoji: true } },
      },
      orderBy: { fecha: "desc" },
      take: 500,
    });

    return NextResponse.json(movimientos);
  } catch (error) {
    console.error("Error al obtener movimientos de tropa:", error);
    return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      tropaId,
      fecha,
      horario,
      origenNombre,
      destinoNombre,
      motivo,
      estado,
      cabezas,
      distanciaKm,
      duracionMin,
      responsable,
      notas,
      rutinaId,
    } = await request.json();

    if (!tropaId || !fecha) {
      return NextResponse.json({ error: "Tropa y fecha son requeridos" }, { status: 400 });
    }

    const tropa = await prisma.tropa.findUnique({
      where: { id: tropaId },
      include: { _count: { select: { animales: true } }, lote: { select: { nombre: true } } },
    });
    if (!tropa || tropa.userId !== session.user.id) {
      return NextResponse.json({ error: "Tropa no encontrada" }, { status: 404 });
    }

    const mov = await prisma.movimientoTropa.create({
      data: {
        tropaId,
        fecha: new Date(fecha),
        horario: horario || null,
        origenNombre: origenNombre || tropa.lote?.nombre || null,
        destinoNombre: destinoNombre || null,
        motivo: motivo || null,
        estado: estado || "Planificado",
        cabezas: cabezas ? parseInt(cabezas) : tropa._count.animales || null,
        distanciaKm: distanciaKm ? parseFloat(distanciaKm) : null,
        duracionMin: duracionMin ? parseInt(duracionMin) : null,
        responsable: responsable || null,
        notas: notas || null,
        rutinaId: rutinaId || null,
        userId: session.user.id,
      },
      include: {
        tropa: { select: { id: true, nombre: true, color: true } },
        rutina: { select: { id: true, nombre: true } },
      },
    });

    // Si el movimiento se registra como ejecutado, actualizar la ubicación de la tropa
    if ((estado || "Planificado") === "Ejecutado" && destinoNombre) {
      const loteDestino = await prisma.lote.findFirst({
        where: { userId: session.user.id, nombre: destinoNombre },
      });
      await prisma.tropa.update({
        where: { id: tropaId },
        data: { loteId: loteDestino?.id || null },
      });
      await prisma.animal.updateMany({
        where: { tropaId, userId: session.user.id },
        data: { ubicacion: destinoNombre },
      });
    }

    return NextResponse.json(mov, { status: 201 });
  } catch (error) {
    console.error("Error al crear movimiento de tropa:", error);
    return NextResponse.json({ error: "Error al crear movimiento" }, { status: 500 });
  }
}
