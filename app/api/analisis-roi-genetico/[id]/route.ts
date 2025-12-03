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

    const analisis = await prisma.analisisROIGenetico.findUnique({
      where: { id: params.id },
    });

    if (!analisis || analisis.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Análisis no encontrado" },
        { status: 404 }
      );
    }

    await prisma.analisisROIGenetico.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Análisis eliminado" });
  } catch (error) {
    console.error("Error al eliminar análisis:", error);
    return NextResponse.json(
      { error: "Error al eliminar análisis" },
      { status: 500 }
    );
  }
}