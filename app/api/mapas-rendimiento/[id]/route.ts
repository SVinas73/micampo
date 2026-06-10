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

    const mapa = await prisma.mapaRendimiento.findUnique({
      where: { id: params.id },
    });

    if (!mapa || mapa.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Mapa no encontrado" },
        { status: 404 }
      );
    }

    await prisma.mapaRendimiento.delete({
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