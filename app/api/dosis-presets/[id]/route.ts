import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const row = await prisma.insight.findUnique({ where: { id } });
    if (!row || row.userId !== session.user.id || row.tipo !== "dosis-preset") {
      return NextResponse.json({ error: "Preestablecido no encontrado" }, { status: 404 });
    }
    await prisma.insight.delete({ where: { id } });
    return NextResponse.json({ message: "Preestablecido eliminado" });
  } catch (error) {
    console.error("Error al eliminar preestablecido:", error);
    return NextResponse.json({ error: "Error al eliminar preestablecido" }, { status: 500 });
  }
}
