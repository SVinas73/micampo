import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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