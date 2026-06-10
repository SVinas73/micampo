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

    const zona = await prisma.zonaManejo.findUnique({
      where: { id: params.id },
    });

    if (!zona || zona.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Zona no encontrada" },
        { status: 404 }
      );
    }

    await prisma.zonaManejo.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Zona eliminada" });
  } catch (error) {
    console.error("Error al eliminar zona:", error);
    return NextResponse.json(
      { error: "Error al eliminar zona" },
      { status: 500 }
    );
  }
}