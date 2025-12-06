import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/ordenes-taller/[id] - Ver detalle
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orden = await prisma.ordenTaller.findUnique({
      where: { id: params.id },
      include: {
        maquinaria: true,
        repuestos: true,
        manoObra: true,
      },
    });

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json(orden);
  } catch (error) {
    console.error("Error al obtener orden:", error);
    return NextResponse.json({ error: "Error al obtener orden" }, { status: 500 });
  }
}

// PATCH /api/maquinaria/ordenes-taller/[id] - Actualizar orden
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      estado,
      diagnostico,
      trabajoRealizado,
      mecanicoAsignado,
      ayudantes,
      fechaInicio,
      fechaSalida,
      observaciones,
    } = body;

    const orden = await prisma.ordenTaller.update({
      where: { id: params.id },
      data: {
        ...(estado && { estado }),
        ...(diagnostico && { diagnostico }),
        ...(trabajoRealizado && { trabajoRealizado }),
        ...(mecanicoAsignado && { mecanicoAsignado }),
        ...(ayudantes && { ayudantes }),
        ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
        ...(fechaSalida && { fechaSalida: new Date(fechaSalida) }),
        ...(observaciones && { observaciones }),
      },
      include: {
        maquinaria: true,
      },
    });

    // Si se completa la orden, actualizar estado de maquinaria
    if (estado === "Completada") {
      await prisma.maquinaria.update({
        where: { id: orden.maquinariaId },
        data: { estado: "Operativo" },
      });
    }

    return NextResponse.json(orden);
  } catch (error) {
    console.error("Error al actualizar orden:", error);
    return NextResponse.json({ error: "Error al actualizar orden" }, { status: 500 });
  }
}

// DELETE /api/maquinaria/ordenes-taller/[id] - Eliminar orden
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.ordenTaller.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Orden eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar orden:", error);
    return NextResponse.json({ error: "Error al eliminar orden" }, { status: 500 });
  }
}