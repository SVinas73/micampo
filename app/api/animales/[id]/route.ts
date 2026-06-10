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

    const animal = await prisma.animal.findUnique({
      where: { id: params.id },
    });

    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Animal no encontrado" },
        { status: 404 }
      );
    }

    await prisma.animal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Animal eliminado" });
  } catch (error) {
    console.error("Error al eliminar animal:", error);
    return NextResponse.json(
      { error: "Error al eliminar animal" },
      { status: 500 }
    );
  }
}