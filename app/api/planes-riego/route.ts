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
    const loteId = searchParams.get("loteId");
    const estado = searchParams.get("estado");

    const where: any = {
      userId: session.user.id,
    };

    if (loteId) {
      where.loteId = loteId;
    }

    if (estado) {
      where.estado = estado;
    }

    const planes = await prisma.planRiego.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
            hectareas: true,
          },
        },
        eventosRiego: {
          orderBy: {
            fechaProgramada: "desc",
          },
          take: 10,
        },
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    return NextResponse.json(planes);
  } catch (error) {
    console.error("Error al obtener planes de riego:", error);
    return NextResponse.json(
      { error: "Error al obtener planes" },
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
      nombre,
      cultivo,
      etapaFenologica,
      tipoSuelo,
      etcDiaria,
      frecuenciaRiego,
      laminaRiego,
      fechaInicio,
      fechaFin,
      costoMM,
      eficienciaRiego,
      modoIA,
    } = await request.json();

    if (!loteId || !nombre || !cultivo || !etcDiaria || !frecuenciaRiego || !laminaRiego || !fechaInicio) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const plan = await prisma.planRiego.create({
      data: {
        loteId,
        nombre,
        cultivo,
        etapaFenologica: etapaFenologica || "Vegetativo",
        tipoSuelo: tipoSuelo || null,
        etcDiaria: parseFloat(etcDiaria),
        frecuenciaRiego: parseInt(frecuenciaRiego),
        laminaRiego: parseFloat(laminaRiego),
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        costoMM: costoMM ? parseFloat(costoMM) : null,
        eficienciaRiego: eficienciaRiego ? parseFloat(eficienciaRiego) : 85,
        modoIA: modoIA || false,
        estado: "Activo",
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
    console.error("Error al crear plan de riego:", error);
    return NextResponse.json(
      { error: "Error al crear plan de riego" },
      { status: 500 }
    );
  }
}