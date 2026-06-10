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

    const contrato = await prisma.contrato.findUnique({
      where: { id: params.id },
    });

    if (!contrato || contrato.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Contrato no encontrado" },
        { status: 404 }
      );
    }

    await prisma.contrato.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Contrato eliminado" });
  } catch (error) {
    console.error("Error al eliminar contrato:", error);
    return NextResponse.json(
      { error: "Error al eliminar contrato" },
      { status: 500 }
    );
  }
}