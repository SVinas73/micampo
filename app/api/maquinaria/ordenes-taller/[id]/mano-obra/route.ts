import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/maquinaria/ordenes-taller/[id]/mano-obra - Agregar mano de obra
export async function POST(
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
      mecanico,
      especialidad,
      descripcion,
      fechaInicio,
      fechaFin,
      horas,
      tarifaHora,
    } = body;

    // Validaciones
    if (!mecanico || !descripcion || !fechaInicio || !horas || !tarifaHora) {
      return NextResponse.json(
        {
          error:
            "Campos requeridos: mecanico, descripcion, fechaInicio, horas, tarifaHora",
        },
        { status: 400 }
      );
    }

    const total = parseFloat(horas) * parseFloat(tarifaHora);

    const manoObra = await prisma.manoObraTaller.create({
      data: {
        ordenTallerId: params.id,
        mecanico,
        especialidad,
        descripcion,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        horas: parseFloat(horas),
        tarifaHora: parseFloat(tarifaHora),
        total,
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
          costoManoObra,
          costoTotal,
        },
      });
    }

    return NextResponse.json(manoObra, { status: 201 });
  } catch (error) {
    console.error("Error al agregar mano de obra:", error);
    return NextResponse.json(
      { error: "Error al agregar mano de obra" },
      { status: 500 }
    );
  }
}