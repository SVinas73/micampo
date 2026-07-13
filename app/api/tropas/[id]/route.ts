import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function tropaDelUsuario(id: string, userId: string) {
  const tropa = await prisma.tropa.findUnique({ where: { id } });
  if (!tropa || tropa.userId !== userId) return null;
  return tropa;
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

    const tropa = await tropaDelUsuario(params.id, session.user.id);
    if (!tropa) {
      return NextResponse.json({ error: "Tropa no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { agregarAnimalIds, quitarAnimalIds, ...campos } = body;

    const permitidos = ["nombre", "categoria", "color", "estado", "loteId", "rutinaId", "notas"] as const;
    const data: Record<string, unknown> = {};
    for (const k of permitidos) {
      if (k in campos) data[k] = campos[k] === "" ? null : campos[k];
    }

    if (Object.keys(data).length > 0) {
      await prisma.tropa.update({ where: { id: params.id }, data });
    }

    if (Array.isArray(agregarAnimalIds) && agregarAnimalIds.length > 0) {
      await prisma.animal.updateMany({
        where: { id: { in: agregarAnimalIds }, userId: session.user.id },
        data: { tropaId: params.id },
      });
    }
    if (Array.isArray(quitarAnimalIds) && quitarAnimalIds.length > 0) {
      await prisma.animal.updateMany({
        where: { id: { in: quitarAnimalIds }, userId: session.user.id, tropaId: params.id },
        data: { tropaId: null },
      });
    }

    const actualizada = await prisma.tropa.findUnique({
      where: { id: params.id },
      include: {
        lote: { select: { id: true, nombre: true } },
        rutina: true,
        _count: { select: { animales: true } },
      },
    });

    return NextResponse.json(actualizada);
  } catch (error) {
    console.error("Error al actualizar tropa:", error);
    return NextResponse.json({ error: "Error al actualizar tropa" }, { status: 500 });
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

    const tropa = await tropaDelUsuario(params.id, session.user.id);
    if (!tropa) {
      return NextResponse.json({ error: "Tropa no encontrada" }, { status: 404 });
    }

    // Los animales quedan sin tropa (SetNull en el schema)
    await prisma.tropa.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Tropa eliminada" });
  } catch (error) {
    console.error("Error al eliminar tropa:", error);
    return NextResponse.json({ error: "Error al eliminar tropa" }, { status: 500 });
  }
}
