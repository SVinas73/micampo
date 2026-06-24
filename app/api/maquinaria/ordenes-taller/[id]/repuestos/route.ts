import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/maquinaria/ordenes-taller/[id]/repuestos - Agregar repuesto
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ordenAuth = await prisma.ordenTaller.findUnique({
      where: { id: params.id },
      include: {
        maquinaria: { select: { establecimiento: { select: { userId: true } } } },
      },
    });
    if (
      !ordenAuth ||
      ordenAuth.maquinaria?.establecimiento?.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { codigo, descripcion, marca, cantidad, precioUnitario, proveedor } = body;

    // Validaciones
    if (!codigo || !descripcion || !cantidad || !precioUnitario) {
      return NextResponse.json(
        {
          error: "Campos requeridos: codigo, descripcion, cantidad, precioUnitario",
        },
        { status: 400 }
      );
    }

    const precioTotal = parseFloat(cantidad) * parseFloat(precioUnitario);

    const repuesto = await prisma.repuestoUsado.create({
      data: {
        ordenTallerId: params.id,
        codigo,
        descripcion,
        marca,
        cantidad: parseInt(cantidad),
        precioUnitario: parseFloat(precioUnitario),
        precioTotal,
        proveedor,
      },
    });

    // Actualizar costo total de la orden
    const orden = await prisma.ordenTaller.findUnique({
      where: { id: params.id },
      include: { repuestos: true, manoObra: true },
    });

    if (orden) {
      const costoRepuestos = orden.repuestos.reduce(
        (acc, r) => acc + r.precioTotal,
        0
      );
      const costoManoObra = orden.manoObra.reduce((acc, m) => acc + m.total, 0);
      const costoTotal = costoRepuestos + costoManoObra + orden.otrosCostos;

      await prisma.ordenTaller.update({
        where: { id: params.id },
        data: {
          costoRepuestos,
          costoTotal,
        },
      });
    }

    return NextResponse.json(repuesto, { status: 201 });
  } catch (error) {
    console.error("Error al agregar repuesto:", error);
    return NextResponse.json({ error: "Error al agregar repuesto" }, { status: 500 });
  }
}