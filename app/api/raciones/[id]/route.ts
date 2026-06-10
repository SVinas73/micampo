import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const racion = await prisma.racion.findUnique({
      where: { id: params.id },
    });

    if (!racion || racion.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Ración no encontrada" },
        { status: 404 }
      );
    }

    await prisma.racion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Ración eliminada" });
  } catch (error) {
    console.error("Error al eliminar ración:", error);
    return NextResponse.json(
      { error: "Error al eliminar ración" },
      { status: 500 }
    );
  }
}