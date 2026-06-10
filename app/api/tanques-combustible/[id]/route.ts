import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const porcentaje = (data.nivelActual / data.capacidadTotal) * 100;
    const alertaNivelBajo = data.nivelActual <= data.nivelMinimo;

    const tanque = await prisma.tanqueCombustible.update({
      where: { id: params.id },
      data: {
        ...data,
        porcentaje,
        alertaNivelBajo,
      },
    });

    return NextResponse.json(tanque);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

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

    await prisma.tanqueCombustible.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Eliminado" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}