import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const evento = await prisma.eventoRiego.findUnique({
      where: { id: params.id },
    });

    if (!evento || evento.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const {
      fechaReal,
      laminaAplicada,
      duracionReal,
      estado,
      costo,
      observaciones,
    } = await request.json();

    const updated = await prisma.eventoRiego.update({
      where: { id: params.id },
      data: {
        ...(fechaReal !== undefined && { fechaReal: fechaReal ? new Date(fechaReal) : null }),
        ...(laminaAplicada !== undefined && { laminaAplicada: laminaAplicada ? parseFloat(laminaAplicada) : null }),
        ...(duracionReal !== undefined && { duracionReal: duracionReal ? parseInt(duracionReal) : null }),
        ...(estado !== undefined && { estado }),
        ...(costo !== undefined && { costo: costo ? parseFloat(costo) : null }),
        ...(observaciones !== undefined && { observaciones }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    return NextResponse.json(
      { error: "Error al actualizar evento" },
      { status: 500 }
    );
  }
}