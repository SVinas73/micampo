import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const comprobante = await prisma.comprobante.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        transaccion: true,
        asignacionCostos: true,
      },
    });

    if (!comprobante || comprobante.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json(comprobante);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener comprobante" }, { status: 500 });
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

    const data = await request.json();

    const comprobante = await prisma.comprobante.update({
      where: { id: params.id },
      data: {
        estado: data.estado,
        fechaPago: data.fechaPago,
        observaciones: data.observaciones,
      },
    });

    return NextResponse.json(comprobante);
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

    await prisma.comprobante.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Eliminado" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}