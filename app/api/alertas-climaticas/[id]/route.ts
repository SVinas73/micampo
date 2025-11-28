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

    const { leida } = await request.json();

    const alerta = await prisma.alertaClimatica.findUnique({
      where: { id: params.id },
    });

    if (!alerta || alerta.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    const alertaActualizada = await prisma.alertaClimatica.update({
      where: { id: params.id },
      data: {
        leida: leida !== undefined ? leida : true,
      },
    });

    return NextResponse.json(alertaActualizada);
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const alerta = await prisma.alertaClimatica.findUnique({
      where: { id: params.id },
    });

    if (!alerta || alerta.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 }
      );
    }

    await prisma.alertaClimatica.delete({
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