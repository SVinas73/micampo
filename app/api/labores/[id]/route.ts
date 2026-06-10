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

    const labor = await prisma.labor.findUnique({
      where: { id: params.id },
    });

    if (!labor || labor.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Labor no encontrada" },
        { status: 404 }
      );
    }

    await prisma.labor.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Labor eliminada" });
  } catch (error) {
    console.error("Error al eliminar labor:", error);
    return NextResponse.json(
      { error: "Error al eliminar labor" },
      { status: 500 }
    );
  }
}