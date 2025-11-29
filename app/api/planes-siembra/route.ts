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

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const loteId = searchParams.get("loteId");

    const where: any = {
      userId: session.user.id,
    };

    if (estado) {
      where.estado = estado;
    }

    if (loteId) {
      where.loteId = loteId;
    }

    const planes = await prisma.planSiembra.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
            hectareas: true,
          },
        },
      },
      orderBy: {
        fechaSiembraRecomendada: "asc",
      },
    });

    return NextResponse.json(planes);
  } catch (error) {
    console.error("Error al obtener planes:", error);
    return NextResponse.json(
      { error: "Error al obtener planes de siembra" },
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
      cultivo,
      variedad,
      fechaSiembraRecomendada,
      fechaCosechaEstimada,
      hectareas,
      rendimientoEstimado,
      costoEstimado,
      ingresoEstimado,
      margenEstimado,
      confianza,
      analisisIA,
      observaciones,
    } = await request.json();

    if (!loteId || !cultivo || !fechaSiembraRecomendada || !fechaCosechaEstimada || !hectareas) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const plan = await prisma.planSiembra.create({
      data: {
        loteId,
        cultivo,
        variedad: variedad || null,
        fechaSiembraRecomendada: new Date(fechaSiembraRecomendada),
        fechaCosechaEstimada: new Date(fechaCosechaEstimada),
        hectareas: parseFloat(hectareas),
        rendimientoEstimado: rendimientoEstimado ? parseFloat(rendimientoEstimado) : null,
        costoEstimado: costoEstimado ? parseFloat(costoEstimado) : null,
        ingresoEstimado: ingresoEstimado ? parseFloat(ingresoEstimado) : null,
        margenEstimado: margenEstimado ? parseFloat(margenEstimado) : null,
        confianza: confianza ? parseFloat(confianza) : null,
        analisisIA: analisisIA ? JSON.stringify(analisisIA) : null,
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

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error al crear plan:", error);
    return NextResponse.json(
      { error: "Error al crear plan de siembra" },
      { status: 500 }
    );
  }
}