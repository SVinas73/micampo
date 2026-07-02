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
    const desde = new Date();
    desde.setDate(desde.getDate() - 30);
    // Alcance Campo → Lote: filtra por el/los lote(s) vía el plan de riego.
    const { searchParams } = new URL(request.url);
    const loteId = searchParams.get("loteId");
    const loteIds = searchParams.get("loteIds");
    const ids = loteId ? [loteId] : loteIds ? loteIds.split(",").filter(Boolean) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: session.user.id, fechaProgramada: { gte: desde } };
    if (ids && ids.length) where.planRiego = { loteId: { in: ids } };
    const eventos = await prisma.eventoRiego.findMany({
      where,
      orderBy: { fechaProgramada: "desc" },
      take: 50,
    });
    return NextResponse.json(eventos);
  } catch (error) {
    console.error("Error al listar eventos de riego:", error);
    return NextResponse.json({ error: "Error al listar eventos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      planRiegoId,
      fechaProgramada,
      fechaReal,
      laminaAplicada,
      duracionReal,
      estado,
      costo,
      observaciones,
    } = await request.json();

    if (!planRiegoId || !fechaProgramada) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const evento = await prisma.eventoRiego.create({
      data: {
        planRiegoId,
        fechaProgramada: new Date(fechaProgramada),
        fechaReal: fechaReal ? new Date(fechaReal) : null,
        laminaAplicada: laminaAplicada ? parseFloat(laminaAplicada) : null,
        duracionReal: duracionReal ? parseInt(duracionReal) : null,
        estado: estado || "Programado",
        costo: costo ? parseFloat(costo) : null,
        observaciones: observaciones || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(evento, { status: 201 });
  } catch (error) {
    console.error("Error al crear evento:", error);
    return NextResponse.json(
      { error: "Error al crear evento de riego" },
      { status: 500 }
    );
  }
}