import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const certificacion = await prisma.certificacionSostenibilidad.findUnique({
      where: { id: params.id },
      include: {
        checklistItems: {
          orderBy: { codigo: "asc" },
        },
        carpetaDocumentos: {
          orderBy: { createdAt: "desc" },
        },
        establecimiento: {
          select: {
            nombre: true,
            cuit: true,
          },
        },
      },
    });

    if (!certificacion) {
      return NextResponse.json(
        { error: "Certificación no encontrada" },
        { status: 404 }
      );
    }

    // Calcular estadísticas del checklist
    const totalItems = certificacion.checklistItems.length;
    const itemsCumplen = certificacion.checklistItems.filter((i) => i.cumple).length;
    const porcentajeCumplimiento =
      totalItems > 0 ? (itemsCumplen / totalItems) * 100 : 0;

    return NextResponse.json({
      ...certificacion,
      estadisticas: {
        totalItems,
        itemsCumplen,
        porcentajeCumplimiento: porcentajeCumplimiento.toFixed(1),
      },
    });
  } catch (error) {
    console.error("Error al obtener certificación:", error);
    return NextResponse.json(
      { error: "Error al obtener certificación" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const certificacion = await prisma.certificacionSostenibilidad.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(certificacion);
  } catch (error) {
    console.error("Error al actualizar certificación:", error);
    return NextResponse.json(
      { error: "Error al actualizar certificación" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.certificacionSostenibilidad.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Certificación eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar certificación:", error);
    return NextResponse.json(
      { error: "Error al eliminar certificación" },
      { status: 500 }
    );
  }
}