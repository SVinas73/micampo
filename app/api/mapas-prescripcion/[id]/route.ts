import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const mapa = await prisma.mapaPrescripcion.findUnique({
      where: { id: params.id },
    });

    if (!mapa || mapa.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Mapa no encontrado" },
        { status: 404 }
      );
    }

    const { estado, fechaAplicacion, maquinariaUsada, observaciones } = await request.json();

    const updated = await prisma.mapaPrescripcion.update({
      where: { id: params.id },
      data: {
        ...(estado !== undefined && { estado }),
        ...(fechaAplicacion !== undefined && {
          fechaAplicacion: fechaAplicacion ? new Date(fechaAplicacion) : null,
        }),
        ...(maquinariaUsada !== undefined && { maquinariaUsada }),
        ...(observaciones !== undefined && { observaciones }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar mapa:", error);
    return NextResponse.json(
      { error: "Error al actualizar mapa" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const mapa = await prisma.mapaPrescripcion.findUnique({
      where: { id: params.id },
    });

    if (!mapa || mapa.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Mapa no encontrado" },
        { status: 404 }
      );
    }

    await prisma.mapaPrescripcion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Mapa eliminado" });
  } catch (error) {
    console.error("Error al eliminar mapa:", error);
    return NextResponse.json(
      { error: "Error al eliminar mapa" },
      { status: 500 }
    );
  }
}