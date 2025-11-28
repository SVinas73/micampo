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

    const costo = await prisma.costoAnimal.findUnique({
      where: { id: params.id },
    });

    if (!costo || costo.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Costo no encontrado" },
        { status: 404 }
      );
    }

    await prisma.costoAnimal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Costo eliminado" });
  } catch (error) {
    console.error("Error al eliminar costo:", error);
    return NextResponse.json(
      { error: "Error al eliminar costo" },
      { status: 500 }
    );
  }
}