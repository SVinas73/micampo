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

    const maquina = await prisma.maquina.findUnique({
      where: { id: params.id },
    });

    if (!maquina || maquina.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Maquina no encontrada" },
        { status: 404 }
      );
    }

    await prisma.maquina.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Maquina eliminada" });
  } catch (error) {
    console.error("Error al eliminar maquina:", error);
    return NextResponse.json(
      { error: "Error al eliminar maquina" },
      { status: 500 }
    );
  }
}