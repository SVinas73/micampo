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

    const mov = await prisma.movimientoTropa.findUnique({ where: { id: params.id } });
    if (!mov || mov.userId !== session.user.id) {
      return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { accion, ...campos } = body;

    if (accion === "ejecutar") {
      const actualizado = await prisma.movimientoTropa.update({
        where: { id: params.id },
        data: { estado: "Ejecutado" },
      });
      if (mov.destinoNombre) {
        const loteDestino = await prisma.lote.findFirst({
          where: { userId: session.user.id, nombre: mov.destinoNombre },
        });
        await prisma.tropa.update({
          where: { id: mov.tropaId },
          data: { loteId: loteDestino?.id || null },
        });
        await prisma.animal.updateMany({
          where: { tropaId: mov.tropaId, userId: session.user.id },
          data: { ubicacion: mov.destinoNombre },
        });
      }
      return NextResponse.json(actualizado);
    }

    if (accion === "cancelar") {
      const actualizado = await prisma.movimientoTropa.update({
        where: { id: params.id },
        data: { estado: "Cancelado" },
      });
      return NextResponse.json(actualizado);
    }

    const data: Record<string, unknown> = {};
    for (const k of ["horario", "origenNombre", "destinoNombre", "motivo", "estado", "responsable", "notas"] as const) {
      if (k in campos) data[k] = campos[k] === "" ? null : campos[k];
    }
    if ("fecha" in campos && campos.fecha) data.fecha = new Date(campos.fecha);
    if ("cabezas" in campos) data.cabezas = campos.cabezas ? parseInt(campos.cabezas) : null;

    const actualizado = await prisma.movimientoTropa.update({ where: { id: params.id }, data });
    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar movimiento:", error);
    return NextResponse.json({ error: "Error al actualizar movimiento" }, { status: 500 });
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

    const mov = await prisma.movimientoTropa.findUnique({ where: { id: params.id } });
    if (!mov || mov.userId !== session.user.id) {
      return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 });
    }

    await prisma.movimientoTropa.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Movimiento eliminado" });
  } catch (error) {
    console.error("Error al eliminar movimiento:", error);
    return NextResponse.json({ error: "Error al eliminar movimiento" }, { status: 500 });
  }
}
