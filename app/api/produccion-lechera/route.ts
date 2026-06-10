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

    const registros = await prisma.produccionLechera.findMany({
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
      take: 100,
    });

    return NextResponse.json(registros);
  } catch (error) {
    console.error("Error al obtener producción lechera:", error);
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
      litrosManana,
      litrosTarde,
      grasaButirosa,
      proteina,
      lactosa,
      solidosTotales,
      ufc,
      rcs,
      diasLactancia,
      numeroLactancia,
      estadoUbre,
      condicionAnimal,
      observaciones,
      responsable,
    } = await request.json();

    if (!animalId) {
      return NextResponse.json(
        { error: "Animal es requerido" },
        { status: 400 }
      );
    }

    // Calcular litros totales
    const manana = litrosManana ? parseFloat(litrosManana) : 0;
    const tarde = litrosTarde ? parseFloat(litrosTarde) : 0;
    const litrosTotales = manana + tarde;

    if (litrosTotales <= 0) {
      return NextResponse.json(
        { error: "Debe ingresar al menos un valor de producción" },
        { status: 400 }
      );
    }

    // Obtener animal
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
    });

    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Animal no encontrado" },
        { status: 404 }
      );
    }

    const fechaRegistro = fecha ? new Date(fecha) : new Date();

    // Obtener últimos 7 días para calcular promedio
    const hace7Dias = new Date(fechaRegistro);
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const registrosAnteriores = await prisma.produccionLechera.findMany({
      where: {
        animalId,
        fecha: {
          gte: hace7Dias,
          lt: fechaRegistro,
        },
      },
      orderBy: {
        fecha: "desc",
      },
      take: 7,
    });

    // Calcular promedio de últimos 7 días
    let promedioUltimos7Dias = null;
    let variacionPorcentual = null;
    let alertaCaida = false;

    if (registrosAnteriores.length > 0) {
      const suma = registrosAnteriores.reduce((acc, r) => acc + r.litrosTotales, 0);
      promedioUltimos7Dias = suma / registrosAnteriores.length;
      variacionPorcentual = ((litrosTotales - promedioUltimos7Dias) / promedioUltimos7Dias) * 100;

      // Alerta si cae más del 15%
      if (variacionPorcentual < -15) {
        alertaCaida = true;
      }
    }

    // Análisis IA de curva de lactancia
    const analisisIA: any = {
      tendencia: "Normal",
      recomendaciones: [],
      alertas: [],
    };

    if (alertaCaida) {
      analisisIA.tendencia = "Caída significativa";
      analisisIA.alertas.push("⚠️ Caída de producción >15%");
      analisisIA.recomendaciones.push("Revisar estado de salud del animal");
      analisisIA.recomendaciones.push("Evaluar plan nutricional");
      analisisIA.recomendaciones.push("Descartar mastitis o enfermedades");
    }

    if (diasLactancia) {
      const dias = parseInt(diasLactancia);
      
      // Curva normal de lactancia: pico a los 60-90 días
      if (dias < 60) {
        analisisIA.recomendaciones.push("Fase ascendente de lactancia");
      } else if (dias >= 60 && dias <= 120) {
        analisisIA.recomendaciones.push("Pico de lactancia esperado");
        if (litrosTotales < 20) {
          analisisIA.alertas.push("Producción baja para pico de lactancia");
        }
      } else if (dias > 120 && dias <= 305) {
        analisisIA.recomendaciones.push("Fase descendente normal de lactancia");
      } else if (dias > 305) {
        analisisIA.alertas.push("Considerar secar la vaca (>305 días)");
      }
    }

    // Alertas de calidad
    if (rcs && parseInt(rcs) > 200000) {
      analisisIA.alertas.push("⚠️ RCS elevado - riesgo de mastitis");
      analisisIA.recomendaciones.push("Realizar CMT (California Mastitis Test)");
    }

    if (ufc && parseInt(ufc) > 100000) {
      analisisIA.alertas.push("⚠️ UFC elevado - calidad sanitaria comprometida");
    }

    const registro = await prisma.produccionLechera.create({
      data: {
        animalId,
        fecha: fechaRegistro,
        litrosManana: manana,
        litrosTarde: tarde,
        litrosTotales,
        grasa: grasaButirosa ? parseFloat(grasaButirosa) : null,
        proteina: proteina ? parseFloat(proteina) : null,
        lactosa: lactosa ? parseFloat(lactosa) : null,
        solidosTotales: solidosTotales ? parseFloat(solidosTotales) : null,
        ufc: ufc ? parseInt(ufc) : null,
        scc: rcs ? parseInt(rcs) : null,
        diasLactancia: diasLactancia ? parseInt(diasLactancia) : null,
        numeroLactancia: numeroLactancia ? parseInt(numeroLactancia) : null,
        estadoUbre: estadoUbre || null,
        condicionAnimal: condicionAnimal || null,
        promedioUltimos7Dias,
        variacionPorcentual,
        alertaCaida,
        analisisIA: JSON.stringify(analisisIA),
        observaciones: observaciones || null,
        responsable: responsable || null,
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
        fecha: fechaRegistro,
        tipoEvento: "Produccion",
        referenciaId: registro.id,
        referenciaModelo: "ProduccionLechera",
        titulo: `Producción: ${litrosTotales} L`,
        descripcion: variacionPorcentual 
          ? `Variación: ${variacionPorcentual.toFixed(1)}% vs promedio`
          : "Primer registro del período",
        valorNumerico: litrosTotales,
        unidad: "litros",
        importante: false,
        alerta: alertaCaida,
        userId: session.user.id,
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error al crear registro de producción:", error);
    return NextResponse.json(
      { error: "Error al crear registro" },
      { status: 500 }
    );
  }
}