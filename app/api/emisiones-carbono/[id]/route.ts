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

    const emision = await prisma.emisionCarbono.findUnique({
      where: { id: params.id },
    });

    if (!emision || emision.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Emisión no encontrada" },
        { status: 404 }
      );
    }

    await prisma.emisionCarbono.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Emisión eliminada" });
  } catch (error) {
    console.error("Error al eliminar emisión:", error);
    return NextResponse.json(
      { error: "Error al eliminar emisión" },
      { status: 500 }
    );
  }
}