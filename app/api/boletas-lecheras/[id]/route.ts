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

    const boleta = await prisma.boletaLechera.findUnique({ where: { id: params.id } });
    if (!boleta || boleta.userId !== session.user.id) {
      return NextResponse.json({ error: "Boleta no encontrada" }, { status: 404 });
    }

    await prisma.boletaLechera.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Boleta eliminada" });
  } catch (error) {
    console.error("Error al eliminar boleta:", error);
    return NextResponse.json({ error: "Error al eliminar boleta" }, { status: 500 });
  }
}
