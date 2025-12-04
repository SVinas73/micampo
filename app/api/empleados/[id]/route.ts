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

    const empleado = await prisma.empleado.findUnique({
      where: { id: params.id },
      include: {
        registrosHoras: {
          orderBy: { fecha: "desc" },
        },
        pagos: {
          orderBy: { periodo: "desc" },
        },
        tareas: {
          orderBy: { fechaAsignacion: "desc" },
        },
      },
    });

    if (!empleado || empleado.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json(empleado);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener empleado" }, { status: 500 });
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

    const empleado = await prisma.empleado.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(empleado);
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

    await prisma.empleado.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Eliminado" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}