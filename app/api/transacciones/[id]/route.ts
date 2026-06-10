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

    // Verificar que la transacción pertenece al usuario
    const transaccion = await prisma.transaccion.findUnique({
      where: { id: params.id },
    });

    if (!transaccion || transaccion.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar transacción
    await prisma.transaccion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Transacción eliminada" });
  } catch (error) {
    console.error("Error al eliminar transacción:", error);
    return NextResponse.json(
      { error: "Error al eliminar transacción" },
      { status: 500 }
    );
  }
}