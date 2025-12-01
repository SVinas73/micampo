import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const registro = await prisma.registroTrazabilidad.findUnique({
      where: { id: params.id },
      include: {
        etapas: {
          orderBy: {
            fecha: "asc",
          },
        },
      },
    });

    if (!registro) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(registro);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error al obtener registro" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const registro = await prisma.registroTrazabilidad.findUnique({
      where: { id: params.id },
    });

    if (!registro || registro.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    await prisma.registroTrazabilidad.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Registro eliminado" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    );
  }
}