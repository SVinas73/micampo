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
    const reproductorId = searchParams.get("reproductorId");

    const where: any = {
      userId: session.user.id,
    };

    if (reproductorId) {
      where.reproductorId = reproductorId;
    }

    const analisis = await prisma.analisisROIGenetico.findMany({
      where,
      include: {
        reproductor: {
          select: {
            caravana: true,
            tipo: true,
            raza: true,
            sexo: true,
          },
        },
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    return NextResponse.json(analisis);
  } catch (error) {
    console.error("Error al obtener análisis ROI:", error);
    return NextResponse.json(
      { error: "Error al obtener análisis" },
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
      reproductorId,
      periodo,
      fechaInicio,
      fechaFin,
      costoAdquisicion,
      costoMantenimiento,
      costoServicios,
      numeroDescendientes,
      numeroVendidos,
      ingresoVentas,
      valorAgregadoGenética,
      observaciones,
    } = await request.json();

    if (!reproductorId || !periodo || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Verificar que el reproductor existe
    const reproductor = await prisma.animal.findUnique({
      where: { id: reproductorId },
      include: {
        registroGenetico: {
          include: {
            hijosComoPadre: {
              include: {
                animal: {
                  include: {
                    registrosPeso: {
                      orderBy: {
                        fecha: "desc",
                      },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!reproductor || reproductor.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Reproductor no encontrado" },
        { status: 404 }
      );
    }

    // Calcular totales
    const inversionTotal =
      parseFloat(costoAdquisicion || 0) +
      parseFloat(costoMantenimiento || 0) +
      parseFloat(costoServicios || 0);

    const ingresoTotal =
      parseFloat(ingresoVentas || 0) + parseFloat(valorAgregadoGenética || 0);

    const beneficioNeto = ingresoTotal - inversionTotal;
    const roi = inversionTotal > 0 ? (beneficioNeto / inversionTotal) * 100 : 0;

    // Calcular años entre fechas
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const anos = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const roiAnualizado = anos > 0 ? roi / anos : roi;

    // Analizar descendencia
    let pesoPromedioDescendientes = null;
    let gananciaPromedioDiaria = null;
    let tasaSobrevivencia = null;

    if (reproductor.registroGenetico?.hijosComoPadre) {
      const descendientes = reproductor.registroGenetico.hijosComoPadre;
      
      if (descendientes.length > 0) {
        // Calcular peso promedio
        const pesosFinales = descendientes
          .map((h) => h.animal.registrosPeso[0]?.peso)
          .filter((p) => p !== undefined);

        if (pesosFinales.length > 0) {
          pesoPromedioDescendientes =
            pesosFinales.reduce((sum, p) => sum + p, 0) / pesosFinales.length;
        }

        // Calcular ganancia promedio diaria
        const ganancias = descendientes
          .map((h) => {
            const pesos = h.animal.registrosPeso;
            if (pesos.length > 0 && pesos[0].gananciaPromedioDiaria) {
              return pesos[0].gananciaPromedioDiaria;
            }
            return null;
          })
          .filter((g) => g !== null);

        if (ganancias.length > 0) {
          gananciaPromediaDiaria =
            ganancias.reduce((sum, g) => sum + (g || 0), 0) / ganancias.length;
        }

        // Tasa de sobrevivencia (simplificado)
        const total = parseInt(numeroDescendientes);
        tasaSobrevivencia = (descendientes.length / total) * 100;
      }
    }

    // Obtener promedio del rodeo para comparar
    const todosAnimales = await prisma.animal.findMany({
      where: {
        userId: session.user.id,
        tipo: reproductor.tipo,
      },
      include: {
        registrosPeso: {
          orderBy: {
            fecha: "desc",
          },
          take: 1,
        },
      },
    });

    let promedioRodeo = null;
    if (todosAnimales.length > 0) {
      const pesosRodeo = todosAnimales
        .map((a) => a.registrosPeso[0]?.peso)
        .filter((p) => p !== undefined);

      if (pesosRodeo.length > 0) {
        promedioRodeo = pesosRodeo.reduce((sum, p) => sum + p, 0) / pesosRodeo.length;
      }
    }

    let superiorPromedio = null;
    if (pesoPromedioDescendientes && promedioRodeo) {
      superiorPromedio = ((pesoPromedioDescendientes - promedioRodeo) / promedioRodeo) * 100;
    }

    // Análisis IA
    const analisisIA: any = {
      rentabilidad: "",
      genetica: "",
      recomendaciones: [],
    };

    if (roi > 50) {
      analisisIA.rentabilidad = "Excelente ROI. Reproductor altamente rentable.";
    } else if (roi > 20) {
      analisisIA.rentabilidad = "Buen ROI. Reproductor rentable.";
    } else if (roi > 0) {
      analisisIA.rentabilidad = "ROI positivo pero bajo. Evaluar mejoras.";
    } else {
      analisisIA.rentabilidad = "ROI negativo. Considerar reemplazo.";
    }

    if (superiorPromedio !== null) {
      if (superiorPromedio > 10) {
        analisisIA.genetica = `Descendientes ${superiorPromedio.toFixed(1)}% superiores al promedio. Excelente genética.`;
        analisisIA.recomendaciones.push("Mantener como reproductor principal");
        analisisIA.recomendaciones.push("Considerar colectar semen para IA");
      } else if (superiorPromedio > 0) {
        analisisIA.genetica = `Descendientes ligeramente superiores al promedio (+${superiorPromedio.toFixed(1)}%).`;
        analisisIA.recomendaciones.push("Mantener en servicio");
      } else {
        analisisIA.genetica = `Descendientes por debajo del promedio (${superiorPromedio.toFixed(1)}%).`;
        analisisIA.recomendaciones.push("Evaluar reemplazo por reproductor superior");
      }
    }

    if (tasaSobrevivencia && tasaSobrevivencia < 90) {
      analisisIA.recomendaciones.push("Revisar tasa de sobrevivencia de crías");
    }

    let recomendacion = "Mantener";
    if (roi < 0 || (superiorPromedio !== null && superiorPromedio < -10)) {
      recomendacion = "Reemplazar";
    } else if (roi > 50 && superiorPromedio && superiorPromedio > 15) {
      recomendacion = "Mantener";
    }

    const analisis = await prisma.analisisROIGenetico.create({
      data: {
        reproductorId,
        periodo,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        costoAdquisicion: costoAdquisicion ? parseFloat(costoAdquisicion) : null,
        costoMantenimiento: parseFloat(costoMantenimiento || 0),
        costoServicios: parseFloat(costoServicios || 0),
        inversionTotal,
        numeroDescendientes: parseInt(numeroDescendientes),
        numeroVendidos: parseInt(numeroVendidos),
        ingresoVentas: parseFloat(ingresoVentas || 0),
        valorAgregadoGenética: valorAgregadoGenética ? parseFloat(valorAgregadoGenética) : null,
        ingresoTotal,
        beneficioNeto,
        roi,
        roiAnualizado,
        pesoPromedioDescendientes,
        gananciaPromediaDiaria,
        tasaSobrevivencia,
        superiorPromedio,
        analisisIA: JSON.stringify(analisisIA),
        recomendacion,
        observaciones: observaciones || null,
        userId: session.user.id,
      },
      include: {
        reproductor: {
          select: {
            caravana: true,
            tipo: true,
          },
        },
      },
    });

    return NextResponse.json(analisis, { status: 201 });
  } catch (error) {
    console.error("Error al crear análisis ROI:", error);
    return NextResponse.json(
      { error: "Error al crear análisis ROI" },
      { status: 500 }
    );
  }
}