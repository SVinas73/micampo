import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const arrendamientos = await prisma.arrendamiento.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
            hectareas: true,
          },
        },
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    return NextResponse.json(arrendamientos);
  } catch (error) {
    console.error("Error al obtener arrendamientos:", error);
    return NextResponse.json(
      { error: "Error al obtener arrendamientos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      loteId,
      arrendatario,
      tipoContrato,
      moneda,
      montoFijo,
      quintales,
      porcentaje,
      fechaInicio,
      fechaFin,
      observaciones,
    } = await request.json();

    if (!loteId || !arrendatario || !tipoContrato || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Validar que tenga el campo correspondiente al tipo de contrato
    if (tipoContrato === "PagoFijo" && !montoFijo) {
      return NextResponse.json(
        { error: "Monto fijo requerido para este tipo de contrato" },
        { status: 400 }
      );
    }

    if (tipoContrato === "QuintalesFijos" && !quintales) {
      return NextResponse.json(
        { error: "Quintales requeridos para este tipo de contrato" },
        { status: 400 }
      );
    }

    if (tipoContrato === "PorcentajeProduccion" && !porcentaje) {
      return NextResponse.json(
        { error: "Porcentaje requerido para este tipo de contrato" },
        { status: 400 }
      );
    }

    const arrendamiento = await prisma.arrendamiento.create({
      data: {
        loteId,
        arrendatario,
        tipoContrato,
        moneda: moneda || "USD",
        montoFijo: montoFijo ? parseFloat(montoFijo) : null,
        quintales: quintales ? parseFloat(quintales) : null,
        porcentaje: porcentaje ? parseFloat(porcentaje) : null,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        observaciones: observaciones || null,
        userId: session.user.id,
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

    return NextResponse.json(arrendamiento, { status: 201 });
  } catch (error) {
    console.error("Error al crear arrendamiento:", error);
    return NextResponse.json(
      { error: "Error al crear arrendamiento" },
      { status: 500 }
    );
  }
}