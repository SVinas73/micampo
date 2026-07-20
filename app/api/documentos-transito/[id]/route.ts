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
    const doc = await prisma.documentoTransito.findUnique({ where: { id: params.id } });
    if (!doc || doc.userId !== session.user.id) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }
    const b = await request.json();
    const data: Record<string, unknown> = {};
    for (const k of ["numero", "origen", "destino", "motivo", "categoria", "transporte", "estado", "notas"] as const) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("cabezas" in b) data.cabezas = b.cabezas ? parseInt(String(b.cabezas)) : null;
    for (const k of ["pesoTotal", "pesoCarcasa", "precioKg", "importe"] as const) {
      if (k in b) data[k] = b[k] ? parseFloat(String(b[k])) : null;
    }
    if ("vencimiento" in b) data.vencimiento = b.vencimiento ? new Date(b.vencimiento) : null;

    const actualizado = await prisma.documentoTransito.update({ where: { id: params.id }, data });
    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar documento:", error);
    return NextResponse.json({ error: "Error al actualizar documento" }, { status: 500 });
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
    const doc = await prisma.documentoTransito.findUnique({ where: { id: params.id } });
    if (!doc || doc.userId !== session.user.id) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }
    await prisma.documentoTransito.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Documento eliminado" });
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    return NextResponse.json({ error: "Error al eliminar documento" }, { status: 500 });
  }
}
