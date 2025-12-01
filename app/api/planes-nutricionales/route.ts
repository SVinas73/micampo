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
    const animalId = searchParams.get("animalId");
    const estado = searchParams.get("estado");

    const where: any = {
      userId: session.user.id,
    };

    if (animalId) {
      where.animalId = animalId;
    }

    if (estado) {
      where.estado = estado;
    }

    const planes = await prisma.planNutricional.findMany({
      where,
      include: {
        animal: {
          select: {
            caravana: true,
            tipo: true,
          },
        },
        registrosConsumo: {
          orderBy: {
            fecha: "desc",
          },
          take: 10,
        },
        ajustes: {
          orderBy: {
            fecha: "desc",
          },
          take: 5,
        },
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    return NextResponse.json(planes);
  } catch (error) {
    console.error("Error al obtener planes nutricionales:", error);
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
      animalId,
      nombre,
      tipo,
      categoriaAnimal,
      pesoActual,
      pesoObjetivo,
      gananciaEsperada,
      produccionLeche,
      energiaDiaria,
      proteinaDiaria,
      fibraDiaria,
      composicionDieta,
      costoTotal,
      fechaInicio,
      fechaFin,
      generadoPorIA,
      analisisIA,
    } = await request.json();

    if (!nombre || !tipo || !categoriaAnimal || !energiaDiaria || !proteinaDiaria || !fechaInicio) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const plan = await prisma.planNutricional.create({
      data: {
        animalId: animalId || null,
        nombre,
        tipo,
        categoriaAnimal,
        pesoActual: pesoActual ? parseFloat(pesoActual) : null,
        pesoObjetivo: pesoObjetivo ? parseFloat(pesoObjetivo) : null,
        gananciaEsperada: gananciaEsperada ? parseFloat(gananciaEsperada) : null,
        produccionLeche: produccionLeche ? parseFloat(produccionLeche) : null,
        energiaDiaria: parseFloat(energiaDiaria),
        proteinaDiaria: parseFloat(proteinaDiaria),
        fibraDiaria: fibraDiaria ? parseFloat(fibraDiaria) : null,
        composicionDieta: JSON.stringify(composicionDieta),
        costoTotal: costoTotal ? parseFloat(costoTotal) : null,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        generadoPorIA: generadoPorIA || false,
        analisisIA: analisisIA ? JSON.stringify(analisisIA) : null,
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
            tipo: true,
          },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error al crear plan nutricional:", error);
    return NextResponse.json(
      { error: "Error al crear plan nutricional" },
      { status: 500 }
    );
  }
}