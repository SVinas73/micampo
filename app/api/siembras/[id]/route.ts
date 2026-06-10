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

    const siembra = await prisma.siembra.findUnique({
      where: { id: params.id },
    });

    if (!siembra || siembra.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Siembra no encontrada" },
        { status: 404 }
      );
    }

    await prisma.siembra.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Siembra eliminada" });
  } catch (error) {
    console.error("Error al eliminar siembra:", error);
    return NextResponse.json(
      { error: "Error al eliminar siembra" },
      { status: 500 }
    );
  }
}