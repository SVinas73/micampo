import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const registro = await prisma.registroPluviometrico.findUnique({ where: { id: params.id } });
    if (!registro || registro.userId !== session.user.id) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }

    const { milimetros, fecha, ubicacion, observaciones } = await request.json();
    const updated = await prisma.registroPluviometrico.update({
      where: { id: params.id },
      data: {
        ...(milimetros !== undefined && { milimetros: parseFloat(milimetros) }),
        ...(fecha !== undefined && { fecha: new Date(fecha) }),
        ...(ubicacion !== undefined && { ubicacion: ubicacion || null }),
        ...(observaciones !== undefined && { observaciones: observaciones || null }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar registro:", error);
    return NextResponse.json({ error: "Error al actualizar registro" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }  // ← CAMBIO AQUÍ
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;  // ← AWAIT PARAMS

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const registro = await prisma.registroPluviometrico.findUnique({
      where: { id: params.id },
    });

    if (!registro || registro.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    await prisma.registroPluviometrico.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Registro eliminado" });
  } catch (error) {
    console.error("Error al eliminar registro:", error);
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    );
  }
}