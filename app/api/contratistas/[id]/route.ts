import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const contratista = await prisma.contratista.findUnique({
      where: { id: params.id },
      include: {
        trabajos: {
          orderBy: { fechaAsignacion: "desc" },
        },
      },
    });

    if (!contratista || contratista.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json(contratista);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener contratista" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const contratista = await prisma.contratista.update({
      where: { id: params.id },
      data: {
        estado: data.estado,
        observaciones: data.observaciones,
      },
    });

    return NextResponse.json(contratista);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.contratista.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Eliminado" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}