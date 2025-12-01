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

    const where: any = {
      userId: session.user.id,
    };

    if (animalId) {
      where.animalId = animalId;
    }

    const diagnosticos = await prisma.diagnosticoSalud.findMany({
      where,
      include: {
        animal: {
          select: {
            caravana: true,
            tipo: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(diagnosticos);
  } catch (error) {
    console.error("Error al obtener diagnósticos:", error);
    return NextResponse.json(
      { error: "Error al obtener diagnósticos" },
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
      veterinario,
      motivoConsulta,
      temperatura,
      frecuenciaCardiaca,
      frecuenciaRespiratoria,
      condicionCorporal,
      diagnostico,
      sintomas,
      tratamiento,
      medicamentos,
      proximaRevision,
      observaciones,
      costoConsulta,
    } = await request.json();

    if (!animalId || !motivoConsulta || !diagnostico || !tratamiento) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Análisis IA simple del riesgo
    let riesgo = "Bajo";
    let recomendacionIA = "Continuar con monitoreo regular.";

    if (temperatura && temperatura > 39.5) {
      riesgo = "Alto";
      recomendacionIA = "Fiebre detectada. Monitorear de cerca y considerar antibióticos.";
    } else if (condicionCorporal && condicionCorporal < 2.5) {
      riesgo = "Medio";
      recomendacionIA = "Condición corporal baja. Evaluar plan nutricional.";
    } else if (motivoConsulta === "Emergencia") {
      riesgo = "Crítico";
      recomendacionIA = "Atención inmediata requerida. Seguimiento estrecho.";
    }

    const diagnosticoCreado = await prisma.diagnosticoSalud.create({
      data: {
        animalId,
        veterinario: veterinario || null,
        motivoConsulta,
        temperatura: temperatura ? parseFloat(temperatura) : null,
        frecuenciaCardiaca: frecuenciaCardiaca ? parseInt(frecuenciaCardiaca) : null,
        frecuenciaRespiratoria: frecuenciaRespiratoria
          ? parseInt(frecuenciaRespiratoria)
          : null,
        condicionCorporal: condicionCorporal ? parseFloat(condicionCorporal) : null,
        diagnostico,
        sintomas: sintomas ? JSON.stringify(sintomas) : null,
        tratamiento,
        medicamentos: medicamentos ? JSON.stringify(medicamentos) : null,
        proximaRevision: proximaRevision ? new Date(proximaRevision) : null,
        observaciones: observaciones || null,
        costoConsulta: costoConsulta ? parseFloat(costoConsulta) : null,
        riesgo,
        recomendacionIA,
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

    return NextResponse.json(diagnosticoCreado, { status: 201 });
  } catch (error) {
    console.error("Error al crear diagnóstico:", error);
    return NextResponse.json(
      { error: "Error al crear diagnóstico" },
      { status: 500 }
    );
  }
}