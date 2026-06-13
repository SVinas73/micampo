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

    const labor = await prisma.labor.findUnique({
      where: { id: params.id },
    });

    if (!labor || labor.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Labor no encontrada" },
        { status: 404 }
      );
    }

    await prisma.labor.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Labor eliminada" });
  } catch (error) {
    console.error("Error al eliminar labor:", error);
    return NextResponse.json(
      { error: "Error al eliminar labor" },
      { status: 500 }
    );
  }
}
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

    const labor = await prisma.labor.findUnique({ where: { id: params.id } });

    if (!labor || labor.userId !== session.user.id) {
      return NextResponse.json({ error: "Labor no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.tipo !== undefined) data.tipo = body.tipo;
    if (body.fecha !== undefined) data.fecha = new Date(body.fecha);
    if (body.descripcion !== undefined) data.descripcion = body.descripcion;
    if (body.observaciones !== undefined) data.observaciones = body.observaciones;
    if (body.estado !== undefined) data.estado = body.estado;
    if (body.prioridad !== undefined) data.prioridad = body.prioridad;
    if (body.motivoBloqueo !== undefined) data.motivoBloqueo = body.motivoBloqueo;
    if (body.operarios !== undefined) data.operarios = body.operarios;
    if (body.horasTrabajadas !== undefined)
      data.horasTrabajadas = body.horasTrabajadas ? parseFloat(body.horasTrabajadas) : null;
    if (body.superficieTrabajada !== undefined)
      data.superficieTrabajada = parseFloat(body.superficieTrabajada);

    const actualizada = await prisma.labor.update({
      where: { id: params.id },
      data,
      include: { lote: { select: { nombre: true, hectareas: true } } },
    });

    return NextResponse.json(actualizada);
  } catch (error) {
    console.error("Error al actualizar labor:", error);
    return NextResponse.json({ error: "Error al actualizar labor" }, { status: 500 });
  }
}
