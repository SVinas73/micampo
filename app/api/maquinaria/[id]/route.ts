import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/[id] - Ver detalle
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const maquinaria = await prisma.maquinaria.findUnique({
      where: { id: params.id },
      include: {
        establecimiento: true,
        mantenimientos: {
          orderBy: { fecha: "desc" },
          take: 10,
        },
        registrosCombustible: {
          orderBy: { fecha: "desc" },
          take: 10,
        },
        usosMaquinaria: {
          orderBy: { fecha: "desc" },
          take: 10,
        },
        alertas: {
          where: { estado: { in: ["Activa", "Pospuesta"] } },
          orderBy: { prioridad: "desc" },
        },
        ordenesTaller: {
          orderBy: { fechaIngreso: "desc" },
          take: 5,
        },
        posicionesGPS: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        eficiencia: {
          orderBy: { fecha: "desc" },
          take: 7,
        },
        sensores: {
          include: {
            lecturas: {
              orderBy: { timestamp: "desc" },
              take: 10,
            },
          },
        },
        evaluacionesOperador: {
          orderBy: { fecha: "desc" },
          take: 10,
        },
      },
    });

    if (!maquinaria) {
      return NextResponse.json({ error: "Maquinaria no encontrada" }, { status: 404 });
    }

    // Calcular estadísticas
    const ultimaPosicion = maquinaria.posicionesGPS[0] || null;
    const promedioEficiencia =
      maquinaria.eficiencia.length > 0
        ? maquinaria.eficiencia.reduce((acc, e) => acc + (e.scoreGeneral || 0), 0) /
          maquinaria.eficiencia.length
        : 0;

    const alertasCriticas = maquinaria.alertas.filter(
      (a) => a.prioridad === "Crítica"
    ).length;

    return NextResponse.json({
      ...maquinaria,
      estadisticas: {
        ultimaPosicion,
        promedioEficiencia: promedioEficiencia.toFixed(1),
        alertasCriticas,
        totalMantenimientos: maquinaria.mantenimientos.length,
        totalOrdenesTaller: maquinaria.ordenesTaller.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener maquinaria:", error);
    return NextResponse.json({ error: "Error al obtener maquinaria" }, { status: 500 });
  }
}

// PATCH /api/maquinaria/[id] - Editar
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
      tipo,
      marca,
      modelo,
      numeroSerie,
      anioFabricacion,
      patente,
      horasMotor,
      estado,
      capacidad,
      valorAdquisicion,
      fechaAdquisicion,
      intervaloMantenimiento,
    } = body;

    const maquinaria = await prisma.maquinaria.update({
      where: { id: params.id },
      data: {
        ...(tipo && { tipo }),
        ...(marca && { marca }),
        ...(modelo && { modelo }),
        ...(numeroSerie !== undefined && { numeroSerie }),
        ...(anioFabricacion && { anioFabricacion: parseInt(anioFabricacion) }),
        ...(patente !== undefined && { patente }),
        ...(horasMotor !== undefined && { horasMotor: parseFloat(horasMotor) }),
        ...(estado && { estado }),
        ...(capacidad !== undefined && { capacidad }),
        ...(valorAdquisicion !== undefined && {
          valorAdquisicion: parseFloat(valorAdquisicion),
        }),
        ...(fechaAdquisicion && { fechaAdquisicion: new Date(fechaAdquisicion) }),
        ...(intervaloMantenimiento !== undefined && {
          intervaloMantenimiento: parseFloat(intervaloMantenimiento),
        }),
      },
      include: {
        establecimiento: true,
      },
    });

    return NextResponse.json(maquinaria);
  } catch (error) {
    console.error("Error al actualizar maquinaria:", error);
    return NextResponse.json(
      { error: "Error al actualizar maquinaria" },
      { status: 500 }
    );
  }
}

// DELETE /api/maquinaria/[id] - Eliminar
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.maquinaria.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Maquinaria eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar maquinaria:", error);
    return NextResponse.json({ error: "Error al eliminar maquinaria" }, { status: 500 });
  }
}