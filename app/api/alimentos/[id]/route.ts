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

    const alimento = await prisma.alimento.findUnique({
      where: { id: params.id },
    });

    if (!alimento || alimento.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Alimento no encontrado" },
        { status: 404 }
      );
    }

    await prisma.alimento.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Alimento eliminado" });
  } catch (error) {
    console.error("Error al eliminar alimento:", error);
    return NextResponse.json(
      { error: "Error al eliminar alimento" },
      { status: 500 }
    );
  }
}