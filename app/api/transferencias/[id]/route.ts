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

    const transferencia = await prisma.transferencia.findUnique({
      where: { id: params.id },
      include: {
        detalles: true,
        transporteInfo: true,
      },
    });

    if (!transferencia || transferencia.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json(transferencia);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener transferencia" }, { status: 500 });
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

    const transferencia = await prisma.transferencia.update({
      where: { id: params.id },
      data: {
        estado: data.estado,
        fechaSalida: data.fechaSalida,
        fechaLlegada: data.fechaLlegada,
        observaciones: data.observaciones,
      },
    });

    return NextResponse.json(transferencia);
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

    await prisma.transferencia.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Eliminada" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}