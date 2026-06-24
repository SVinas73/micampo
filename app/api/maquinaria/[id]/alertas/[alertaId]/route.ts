import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/maquinaria/[id]/alertas/[alertaId] - Resolver/Actualizar alerta
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; alertaId: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const maq = await prisma.maquinaria.findUnique({
      where: { id: params.id },
      select: { establecimiento: { select: { userId: true } } },
    });
    if (!maq || maq.establecimiento?.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    const alertaExistente = await prisma.alertaMantenimiento.findFirst({
      where: { id: params.alertaId, maquinariaId: params.id },
      select: { id: true },
    });
    if (!alertaExistente) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { estado, resueltoPor, observaciones, ordenTallerId } = body;

    const alerta = await prisma.alertaMantenimiento.update({
      where: { id: params.alertaId },
      data: {
        ...(estado && { estado }),
        ...(resueltoPor && { resueltoPor }),
        ...(observaciones && { observaciones }),
        ...(ordenTallerId && { ordenTallerId }),
        ...(estado === "Atendida" && { fechaResolucion: new Date() }),
      },
    });

    return NextResponse.json(alerta);
  } catch (error) {
    console.error("Error al actualizar alerta:", error);
    return NextResponse.json({ error: "Error al actualizar alerta" }, { status: 500 });
  }
}

// DELETE /api/maquinaria/[id]/alertas/[alertaId] - Eliminar alerta
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; alertaId: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const maq = await prisma.maquinaria.findUnique({
      where: { id: params.id },
      select: { establecimiento: { select: { userId: true } } },
    });
    if (!maq || maq.establecimiento?.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    const alertaExistente = await prisma.alertaMantenimiento.findFirst({
      where: { id: params.alertaId, maquinariaId: params.id },
      select: { id: true },
    });
    if (!alertaExistente) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    await prisma.alertaMantenimiento.delete({
      where: { id: params.alertaId },
    });

    return NextResponse.json({ message: "Alerta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar alerta:", error);
    return NextResponse.json({ error: "Error al eliminar alerta" }, { status: 500 });
  }
}