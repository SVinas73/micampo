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

    const control = await prisma.controlCargaAnimal.findUnique({
      where: { id: params.id },
    });

    if (!control || control.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Control no encontrado" },
        { status: 404 }
      );
    }

    await prisma.controlCargaAnimal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Control eliminado" });
  } catch (error) {
    console.error("Error al eliminar control:", error);
    return NextResponse.json(
      { error: "Error al eliminar control" },
      { status: 500 }
    );
  }
}