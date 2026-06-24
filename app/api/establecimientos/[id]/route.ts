import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH/DELETE de un establecimiento.
 * Al eliminar, los lotes asociados NO se borran: su establecimientoId queda en
 * null (relación con onDelete: SetNull), así no se pierde ningún lote.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const est = await prisma.establecimiento.findUnique({ where: { id } });
    if (!est || est.userId !== session.user.id) {
      return NextResponse.json({ error: "Establecimiento no encontrado" }, { status: 404 });
    }

    const { nombre, direccion, ciudad, provincia, pais, cuit, hectareasTotales, coordenadas, centroLatitud, centroLongitud, perimetro } = await request.json();
    const updated = await prisma.establecimiento.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(direccion !== undefined && { direccion: direccion || null }),
        ...(ciudad !== undefined && { ciudad: ciudad || null }),
        ...(provincia !== undefined && { provincia: provincia || null }),
        ...(pais !== undefined && { pais: pais || null }),
        ...(cuit !== undefined && { cuit: cuit || null }),
        ...(hectareasTotales !== undefined && { hectareasTotales: hectareasTotales ? parseFloat(hectareasTotales) : null }),
        ...(coordenadas !== undefined && { coordenadas: coordenadas ? JSON.stringify(coordenadas) : null }),
        ...(centroLatitud !== undefined && { centroLatitud: centroLatitud != null ? parseFloat(centroLatitud) : null }),
        ...(centroLongitud !== undefined && { centroLongitud: centroLongitud != null ? parseFloat(centroLongitud) : null }),
        ...(perimetro !== undefined && { perimetro: perimetro != null ? parseFloat(perimetro) : null }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar establecimiento:", error);
    return NextResponse.json({ error: "Error al actualizar establecimiento" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const est = await prisma.establecimiento.findUnique({
      where: { id },
      include: { _count: { select: { lotes: true } } },
    });
    if (!est || est.userId !== session.user.id) {
      return NextResponse.json({ error: "Establecimiento no encontrado" }, { status: 404 });
    }

    const lotesLiberados = est._count.lotes;
    await prisma.establecimiento.delete({ where: { id } });

    return NextResponse.json({
      message: "Establecimiento eliminado",
      lotesLiberados,
    });
  } catch (error) {
    console.error("Error al eliminar establecimiento:", error);
    return NextResponse.json({ error: "Error al eliminar establecimiento" }, { status: 500 });
  }
}
