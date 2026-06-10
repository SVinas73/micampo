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

    const alerta = await prisma.alertaPlaga.findUnique({
      where: { id: params.id },
    });

    if (!alerta || alerta.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    const { estado, tratamientoAplicado, fechaResolucion } = await request.json();

    const updated = await prisma.alertaPlaga.update({
      where: { id: params.id },
      data: {
        ...(estado !== undefined && { estado }),
        ...(tratamientoAplicado !== undefined && { tratamientoAplicado }),
        ...(fechaResolucion !== undefined && {
          fechaResolucion: fechaResolucion ? new Date(fechaResolucion) : null,
        }),
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar alerta:", error);
    return NextResponse.json(
      { error: "Error al actualizar alerta" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const alerta = await prisma.alertaPlaga.findUnique({
      where: { id: params.id },
    });

    if (!alerta || alerta.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    await prisma.alertaPlaga.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Alerta eliminada" });
  } catch (error) {
    console.error("Error al eliminar alerta:", error);
    return NextResponse.json(
      { error: "Error al eliminar alerta" },
      { status: 500 }
    );
  }
}