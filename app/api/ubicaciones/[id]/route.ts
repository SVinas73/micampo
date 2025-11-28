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

    const { esPrincipal } = await request.json();

    const ubicacion = await prisma.ubicacion.findUnique({
      where: { id: params.id },
    });

    if (!ubicacion || ubicacion.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    // Si se marca como principal, desmarcar las demás
    if (esPrincipal) {
      await prisma.ubicacion.updateMany({
        where: {
          userId: session.user.id,
          esPrincipal: true,
        },
        data: {
          esPrincipal: false,
        },
      });
    }

    const ubicacionActualizada = await prisma.ubicacion.update({
      where: { id: params.id },
      data: {
        esPrincipal: esPrincipal || false,
      },
    });

    return NextResponse.json(ubicacionActualizada);
  } catch (error) {
    console.error("Error al actualizar ubicación:", error);
    return NextResponse.json(
      { error: "Error al actualizar ubicación" },
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

    const ubicacion = await prisma.ubicacion.findUnique({
      where: { id: params.id },
    });

    if (!ubicacion || ubicacion.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    await prisma.ubicacion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Ubicación eliminada" });
  } catch (error) {
    console.error("Error al eliminar ubicación:", error);
    return NextResponse.json(
      { error: "Error al eliminar ubicación" },
      { status: 500 }
    );
  }
}