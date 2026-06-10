import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const receta = await prisma.recetaAgronomica.findUnique({
      where: { id: params.id },
      include: {
        productos: true,
        lote: true,
        labor: true,
        establecimiento: {
          select: {
            nombre: true,
            cuit: true,
            direccion: true,
          },
        },
      },
    });

    if (!receta) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(receta);
  } catch (error) {
    console.error("Error al obtener receta:", error);
    return NextResponse.json(
      { error: "Error al obtener receta" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { estado, laborId, fechaAplicacion, firmaProfesional } = body;

    const updateData: any = {};

    if (estado) {
      updateData.estado = estado;
    }

    if (laborId) {
      updateData.laborId = laborId;
    }

    if (fechaAplicacion) {
      updateData.fechaAplicacion = new Date(fechaAplicacion);
    }

    if (firmaProfesional) {
      updateData.firmaProfesional = firmaProfesional;
    }

    const receta = await prisma.recetaAgronomica.update({
      where: { id: params.id },
      data: updateData,
      include: {
        productos: true,
        lote: true,
      },
    });

    return NextResponse.json(receta);
  } catch (error) {
    console.error("Error al actualizar receta:", error);
    return NextResponse.json(
      { error: "Error al actualizar receta" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.recetaAgronomica.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Receta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar receta:", error);
    return NextResponse.json(
      { error: "Error al eliminar receta" },
      { status: 500 }
    );
  }
}