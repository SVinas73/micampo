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

    const { estado } = await request.json();

    const plan = await prisma.planSiembra.findUnique({
      where: { id: params.id },
    });

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.planSiembra.update({
      where: { id: params.id },
      data: {
        estado: estado || plan.estado,
      },
      include: {
        lote: {
          select: {
            nombre: true,
            hectareas: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar plan:", error);
    return NextResponse.json(
      { error: "Error al actualizar plan" },
      { status: 500 }
    );
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

    const plan = await prisma.planSiembra.findUnique({
      where: { id: params.id },
    });

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    await prisma.planSiembra.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Plan eliminado" });
  } catch (error) {
    console.error("Error al eliminar plan:", error);
    return NextResponse.json(
      { error: "Error al eliminar plan" },
      { status: 500 }
    );
  }
}