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

    const rutina = await prisma.rutinaTropa.findUnique({ where: { id: params.id } });
    if (!rutina || rutina.userId !== session.user.id) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { tropaIds, ...campos } = body;
    const data: Record<string, unknown> = {};
    for (const k of ["nombre", "tipo", "emoji", "color", "descripcion", "estado"] as const) {
      if (k in campos) data[k] = campos[k] === "" ? null : campos[k];
    }
    if ("config" in campos) data.config = campos.config ? JSON.stringify(campos.config) : null;

    const actualizada = await prisma.rutinaTropa.update({ where: { id: params.id }, data });

    if (Array.isArray(tropaIds)) {
      // Reasignar: quitar la rutina a las que ya no están y asignar a las nuevas
      await prisma.tropa.updateMany({
        where: { rutinaId: params.id, userId: session.user.id, id: { notIn: tropaIds } },
        data: { rutinaId: null },
      });
      if (tropaIds.length > 0) {
        await prisma.tropa.updateMany({
          where: { id: { in: tropaIds }, userId: session.user.id },
          data: { rutinaId: params.id },
        });
      }
    }

    return NextResponse.json(actualizada);
  } catch (error) {
    console.error("Error al actualizar rutina:", error);
    return NextResponse.json({ error: "Error al actualizar rutina" }, { status: 500 });
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

    const rutina = await prisma.rutinaTropa.findUnique({ where: { id: params.id } });
    if (!rutina || rutina.userId !== session.user.id) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    await prisma.rutinaTropa.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Rutina eliminada" });
  } catch (error) {
    console.error("Error al eliminar rutina:", error);
    return NextResponse.json({ error: "Error al eliminar rutina" }, { status: 500 });
  }
}
