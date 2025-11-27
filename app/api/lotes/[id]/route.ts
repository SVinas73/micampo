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

    const lote = await prisma.lote.findUnique({
      where: { id: params.id },
    });

    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    await prisma.lote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Lote eliminado" });
  } catch (error) {
    console.error("Error al eliminar lote:", error);
    return NextResponse.json(
      { error: "Error al eliminar lote" },
      { status: 500 }
    );
  }
}