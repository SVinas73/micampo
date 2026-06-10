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

    const reporte = await prisma.reporteAgroquimico.findUnique({
      where: { id: params.id },
      include: {
        establecimiento: true,
      },
    });

    if (!reporte) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(reporte);
  } catch (error) {
    console.error("Error al obtener reporte:", error);
    return NextResponse.json(
      { error: "Error al obtener reporte" },
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
    const { estado, numeroReporte, organismoDestino } = body;

    const updateData: any = {};

    if (estado) {
      updateData.estado = estado;
      if (estado === "Enviado") {
        updateData.fechaEnvio = new Date();
      } else if (estado === "Aprobado") {
        updateData.fechaAprobacion = new Date();
      }
    }

    if (numeroReporte) {
      updateData.numeroReporte = numeroReporte;
    }

    if (organismoDestino) {
      updateData.organismoDestino = organismoDestino;
    }

    const reporte = await prisma.reporteAgroquimico.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(reporte);
  } catch (error) {
    console.error("Error al actualizar reporte:", error);
    return NextResponse.json(
      { error: "Error al actualizar reporte" },
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

    await prisma.reporteAgroquimico.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Reporte eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar reporte:", error);
    return NextResponse.json(
      { error: "Error al eliminar reporte" },
      { status: 500 }
    );
  }
}