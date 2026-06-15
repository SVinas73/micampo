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

    const registros = await prisma.registroPeso.findMany({
      where,
      include: {
        animal: {
          select: {
            caravana: true,
            tipo: true,
            raza: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(registros);
  } catch (error) {
    console.error("Error al obtener registros de peso:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
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
      fecha,
      peso,
      tipoMedicion,
      metodoMedicion,
      condicionCorporal,
      estadoSalud,
      responsable,
      observaciones,
    } = await request.json();

    if (!animalId || !peso || !tipoMedicion) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Obtener animal y su fecha de nacimiento
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
    });

    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Animal no encontrado" },
        { status: 404 }
      );
    }

    // Calcular edad en días
    const fechaPesaje = fecha ? new Date(fecha) : new Date();
    const fechaNacimiento = animal.fechaNacimiento ? new Date(animal.fechaNacimiento) : null;
    const edadDias = fechaNacimiento
      ? Math.floor((fechaPesaje.getTime() - fechaNacimiento.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Obtener último pesaje anterior
    const ultimoPesaje = await prisma.registroPeso.findFirst({
      where: {
        animalId,
        fecha: {
          lt: fechaPesaje,
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    // Calcular ganancias
    let gananciaDesdeAnterior = null;
    let gananciaPromedioDiaria = null;
    let diasDesdeAnterior = null;

    if (ultimoPesaje) {
      gananciaDesdeAnterior = parseFloat(peso) - ultimoPesaje.peso;
      diasDesdeAnterior = Math.floor(
        (fechaPesaje.getTime() - new Date(ultimoPesaje.fecha).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasDesdeAnterior > 0) {
        gananciaPromedioDiaria = gananciaDesdeAnterior / diasDesdeAnterior;
      }
    }

    // Análisis IA simple
    const alertas = [];
    const analisisIA: any = {
      tendencia: "Normal",
      recomendaciones: [],
    };

    if (gananciaPromedioDiaria !== null) {
      // Analizar según tipo de animal y edad
      let gananciaEsperada = 0.8; // kg/día por defecto

      if (animal.tipo === "Bovino") {
        if (tipoMedicion === "Destete") {
          gananciaEsperada = 0.5; // Terneros
        } else if (tipoMedicion === "Intermedio") {
          gananciaEsperada = 0.8; // Novillos
        } else if (tipoMedicion === "Preventa") {
          gananciaEsperada = 1.0; // Engorde intensivo
        }
      }

      if (gananciaPromedioDiaria < gananciaEsperada * 0.7) {
        alertas.push("Ganancia de peso por debajo de lo esperado");
        analisisIA.tendencia = "Baja";
        analisisIA.recomendaciones.push("Revisar plan nutricional");
        analisisIA.recomendaciones.push("Descartar problemas sanitarios");
      } else if (gananciaPromedioDiaria > gananciaEsperada * 1.3) {
        analisisIA.tendencia = "Excelente";
        analisisIA.recomendaciones.push("Mantener plan actual");
      }
    }

    if (condicionCorporal && parseFloat(condicionCorporal) < 2.5) {
      alertas.push("Condición corporal baja");
      analisisIA.recomendaciones.push("Incrementar aporte nutricional");
    }

    const registro = await prisma.registroPeso.create({
      data: {
        animalId,
        fecha: fechaPesaje,
        peso: parseFloat(peso),
        tipoMedicion,
        metodoMedicion: metodoMedicion || "Balanza",
        condicionCorporal: condicionCorporal ? parseFloat(condicionCorporal) : null,
        estadoSalud: estadoSalud || null,
        edadDias,
        gananciaDesdeAnterior,
        gananciaPromedioDiaria,
        diasDesdeAnterior,
        analisisIA: JSON.stringify(analisisIA),
        alertas: alertas.length > 0 ? JSON.stringify(alertas) : null,
        responsable: responsable || null,
        observaciones: observaciones || null,
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

    // Crear evento de vida
    await prisma.eventoVida.create({
      data: {
        animalId,
        fecha: fechaPesaje,
        tipoEvento: "Peso",
        referenciaId: registro.id,
        referenciaModelo: "RegistroPeso",
        titulo: `Pesaje: ${peso} kg`,
        descripcion: `${tipoMedicion} - Ganancia: ${gananciaPromedioDiaria?.toFixed(2) || "N/A"} kg/día`,
        valorNumerico: parseFloat(peso),
        unidad: "kg",
        importante: tipoMedicion === "Nacimiento" || tipoMedicion === "Preventa",
        alerta: alertas.length > 0,
        userId: session.user.id,
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error al crear registro de peso:", error);
    return NextResponse.json(
      { error: "Error al crear registro de peso" },
      { status: 500 }
    );
  }
}