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

    const existente = await prisma.rol.findUnique({ where: { id: params.id } });
    if (!existente || existente.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const data = await request.json();

    const rol = await prisma.rol.update({
      where: { id: params.id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        permisos: JSON.stringify(data.permisos),
      },
    });

    return NextResponse.json(rol);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al actualizar rol" }, { status: 500 });
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

    const existente = await prisma.rol.findUnique({ where: { id: params.id } });
    if (!existente || existente.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await prisma.rol.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Eliminado" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}