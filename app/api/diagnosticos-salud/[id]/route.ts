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

    const diagnostico = await prisma.diagnosticoSalud.findUnique({
      where: { id: params.id },
    });

    if (!diagnostico || diagnostico.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Diagnóstico no encontrado" },
        { status: 404 }
      );
    }

    await prisma.diagnosticoSalud.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Diagnóstico eliminado" });
  } catch (error) {
    console.error("Error al eliminar diagnóstico:", error);
    return NextResponse.json(
      { error: "Error al eliminar diagnóstico" },
      { status: 500 }
    );
  }
}