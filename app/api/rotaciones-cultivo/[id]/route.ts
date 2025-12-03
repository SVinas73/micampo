import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const rotacion = await prisma.rotacionCultivo.findUnique({
      where: { id: params.id },
    });

    if (!rotacion || rotacion.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Rotación no encontrada" },
        { status: 404 }
      );
    }

    await prisma.rotacionCultivo.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Rotación eliminada" });
  } catch (error) {
    console.error("Error al eliminar rotación:", error);
    return NextResponse.json(
      { error: "Error al eliminar rotación" },
      { status: 500 }
    );
  }
}