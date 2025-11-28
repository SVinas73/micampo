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

    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id: params.id },
    });

    if (!cuenta || cuenta.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      );
    }

    await prisma.cuentaBancaria.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Cuenta eliminada" });
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    return NextResponse.json(
      { error: "Error al eliminar cuenta" },
      { status: 500 }
    );
  }
}