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

    const where: any = {
      userId: session.user.id,
    };

    if (loteId) {
      where.loteId = loteId;
    }

    const controles = await prisma.controlCargaAnimal.findMany({
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
        fecha: "desc",
      },
    });

    return NextResponse.json(controles);
  } catch (error) {
    console.error("Error al obtener controles:", error);
    return NextResponse.json(
      { error: "Error al obtener controles" },
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
      fecha,
      cantidadAnimales,
      pesoPromedioAnimales,
      capacidadRecomendada,
      disponibilidadForraje,
      diasDisponibilidad,
      observaciones,
      responsable,
    } = await request.json();

    if (!loteId || !cantidadAnimales || !pesoPromedioAnimales) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Obtener lote
    const lote = await prisma.lote.findUnique({
      where: { id: loteId },
    });

    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    // Calcular Unidades Animal (UA)
    // UA = Peso / 450 kg (estándar de vaca adulta)
    const cantidad = parseInt(cantidadAnimales);
    const pesoPromedio = parseFloat(pesoPromedioAnimales);
    const unidadesAnimal = (cantidad * pesoPromedio) / 450;

    // Calcular carga animal
    const cargaAnimalUA = unidadesAnimal / lote.hectareas;
    const cargaAnimalKg = (cantidad * pesoPromedio) / lote.hectareas;

    // Capacidad recomendada (default: 1.5 UA/ha para campo templado)
    const capacidad = capacidadRecomendada ? parseFloat(capacidadRecomendada) : 1.5;

    // Porcentaje de capacidad utilizada
    const porcentajeCapacidad = (cargaAnimalUA / capacidad) * 100;

    // Determinar estado
    let estado = "Óptimo";
    if (porcentajeCapacidad < 70) {
      estado = "Subcargado";
    } else if (porcentajeCapacidad > 110) {
      estado = "Sobrecargado";
    }

    // Calcular cuántos animales más o menos
    let animalesAdicionales = null;
    let animalesReducir = null;

    if (estado === "Subcargado") {
      const uaDisponibles = (capacidad * lote.hectareas) - unidadesAnimal;
      animalesAdicionales = Math.floor((uaDisponibles * 450) / pesoPromedio);
    } else if (estado === "Sobrecargado") {
      const uaExcedentes = unidadesAnimal - (capacidad * lote.hectareas);
      animalesReducir = Math.ceil((uaExcedentes * 450) / pesoPromedio);
    }

    // Análisis IA
    const analisisIA: any = {
      evaluacion: "",
      recomendaciones: [],
    };

    const alertas = [];

    if (estado === "Sobrecargado") {
      analisisIA.evaluacion = `Sobrecarga del ${(porcentajeCapacidad - 100).toFixed(0)}%. Riesgo de degradación del pastizal.`;
      analisisIA.recomendaciones.push(`Reducir ${animalesReducir} animales o aumentar superficie`);
      analisisIA.recomendaciones.push("Implementar rotación de pasturas");
      alertas.push("⚠️ Carga animal excesiva");
    } else if (estado === "Subcargado") {
      analisisIA.evaluacion = `Subcarga del ${(100 - porcentajeCapacidad).toFixed(0)}%. Capacidad no utilizada.`;
      analisisIA.recomendaciones.push(`Puede agregar hasta ${animalesAdicionales} animales más`);
      analisisIA.recomendaciones.push("Aprovechar forraje disponible");
    } else {
      analisisIA.evaluacion = "Carga animal óptima para la capacidad del lote.";
      analisisIA.recomendaciones.push("Mantener monitoreo periódico");
      analisisIA.recomendaciones.push("Realizar rotación según disponibilidad de forraje");
    }

    if (disponibilidadForraje && diasDisponibilidad) {
      const dias = parseInt(diasDisponibilidad);
      if (dias < 15) {
        alertas.push("⚠️ Forraje disponible para menos de 15 días");
        analisisIA.recomendaciones.push("Planificar movimiento urgente o suplementación");
      } else if (dias < 30) {
        alertas.push("ℹ️ Forraje disponible para menos de 30 días");
        analisisIA.recomendaciones.push("Preparar próximo lote o suplemento");
      }
    }

    const control = await prisma.controlCargaAnimal.create({
      data: {
        loteId,
        fecha: fecha ? new Date(fecha) : new Date(),
        cantidadAnimales: cantidad,
        pesoPromedioAnimales: pesoPromedio,
        unidadesAnimal,
        cargaAnimalUA,
        cargaAnimalKg,
        capacidadRecomendada: capacidad,
        porcentajeCapacidad,
        estado,
        disponibilidadForraje: disponibilidadForraje ? parseFloat(disponibilidadForraje) : null,
        diasDisponibilidad: diasDisponibilidad ? parseInt(diasDisponibilidad) : null,
        animalesAdicionales,
        animalesReducir,
        analisisIA: JSON.stringify(analisisIA),
        alertas: alertas.length > 0 ? JSON.stringify(alertas) : null,
        observaciones: observaciones || null,
        responsable: responsable || null,
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

    return NextResponse.json(control, { status: 201 });
  } catch (error) {
    console.error("Error al crear control:", error);
    return NextResponse.json(
      { error: "Error al crear control de carga animal" },
      { status: 500 }
    );
  }
}