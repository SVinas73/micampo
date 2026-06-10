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

    const plan = await prisma.planRiego.findUnique({
      where: { id: params.id },
      include: {
        lote: {
          select: {
            nombre: true,
            hectareas: true,
          },
        },
        eventosRiego: {
          orderBy: {
            fechaProgramada: "desc",
          },
        },
      },
    });

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error al obtener plan:", error);
    return NextResponse.json(
      { error: "Error al obtener plan" },
      { status: 500 }
    );
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

    const plan = await prisma.planRiego.findUnique({
      where: { id: params.id },
    });

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    const {
      estado,
      etcDiaria,
      frecuenciaRiego,
      laminaRiego,
      modoIA,
    } = await request.json();

    const updated = await prisma.planRiego.update({
      where: { id: params.id },
      data: {
        ...(estado !== undefined && { estado }),
        ...(etcDiaria !== undefined && { etcDiaria: parseFloat(etcDiaria) }),
        ...(frecuenciaRiego !== undefined && { frecuenciaRiego: parseInt(frecuenciaRiego) }),
        ...(laminaRiego !== undefined && { laminaRiego: parseFloat(laminaRiego) }),
        ...(modoIA !== undefined && { modoIA }),
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

    const plan = await prisma.planRiego.findUnique({
      where: { id: params.id },
    });

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      );
    }

    await prisma.planRiego.delete({
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