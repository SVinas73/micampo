import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Actualiza campos livianos del análisis (p. ej. la alerta de plaga que generó). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const reg = await prisma.analisisVision.findUnique({ where: { id }, select: { userId: true } });
    if (!reg || reg.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    const data: { alertaPlagaId?: string | null } = {};
    if (typeof body.alertaPlagaId === "string") data.alertaPlagaId = body.alertaPlagaId;
    await prisma.analisisVision.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al actualizar análisis de visión:", error);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

/** Elimina un análisis del historial (solo del propio usuario). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;

    const reg = await prisma.analisisVision.findUnique({ where: { id }, select: { userId: true } });
    if (!reg || reg.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    await prisma.analisisVision.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al eliminar análisis de visión:", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
