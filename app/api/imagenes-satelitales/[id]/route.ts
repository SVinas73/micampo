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

    const imagen = await prisma.imagenSatelital.findUnique({
      where: { id: params.id },
    });

    if (!imagen || imagen.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Imagen no encontrada" },
        { status: 404 }
      );
    }

    await prisma.imagenSatelital.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Imagen eliminada" });
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    return NextResponse.json(
      { error: "Error al eliminar imagen" },
      { status: 500 }
    );
  }
}