import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const plan = await prisma.planNutricional.findUnique({
      where: { id: params.id },
    });

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    const { estado, composicionDieta, costoTotal } = await request.json();

    const updated = await prisma.planNutricional.update({
      where: { id: params.id },
      data: {
        ...(estado !== undefined && { estado }),
        ...(composicionDieta !== undefined && {
          composicionDieta: JSON.stringify(composicionDieta),
        }),
        ...(costoTotal !== undefined && { costoTotal: parseFloat(costoTotal) }),
      },
      include: {
        animal: {
          select: {
            caravana: true,
            tipo: true,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const plan = await prisma.planNutricional.findUnique({
      where: { id: params.id },
    });

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    await prisma.planNutricional.delete({
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