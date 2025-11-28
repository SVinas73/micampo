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

    const { activo } = await request.json();

    const arrendamiento = await prisma.arrendamiento.findUnique({
      where: { id: params.id },
    });

    if (!arrendamiento || arrendamiento.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Arrendamiento no encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.arrendamiento.update({
      where: { id: params.id },
      data: {
        activo: activo !== undefined ? activo : arrendamiento.activo,
      },
      include: {
        lote: {
          select: {
            nombre: true,
            hectareas: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar arrendamiento:", error);
    return NextResponse.json(
      { error: "Error al actualizar arrendamiento" },
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

    const arrendamiento = await prisma.arrendamiento.findUnique({
      where: { id: params.id },
    });

    if (!arrendamiento || arrendamiento.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Arrendamiento no encontrado" },
        { status: 404 }
      );
    }

    await prisma.arrendamiento.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Arrendamiento eliminado" });
  } catch (error) {
    console.error("Error al eliminar arrendamiento:", error);
    return NextResponse.json(
      { error: "Error al eliminar arrendamiento" },
      { status: 500 }
    );
  }
}