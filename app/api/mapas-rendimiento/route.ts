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

    const mapas = await prisma.mapaRendimiento.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
        cosecha: {
          select: {
            cultivo: true,
            cantidadTotal: true,
          },
        },
      },
      orderBy: {
        fechaCosecha: "desc",
      },
    });

    return NextResponse.json(mapas);
  } catch (error) {
    console.error("Error al obtener mapas de rendimiento:", error);
    return NextResponse.json(
      { error: "Error al obtener mapas" },
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
      cosechaId,
      nombre,
      cultivo,
      fechaCosecha,
      datosRendimiento,
    } = await request.json();

    if (!loteId || !nombre || !cultivo || !fechaCosecha || !datosRendimiento) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Calcular estadísticas
    const rendimientos = datosRendimiento.map((d: any) => d.rendimiento);
    const rendimientoPromedio =
      rendimientos.reduce((a: number, b: number) => a + b, 0) / rendimientos.length;
    const rendimientoMinimo = Math.min(...rendimientos);
    const rendimientoMaximo = Math.max(...rendimientos);

    // Calcular coeficiente de variación
    const desviacion = Math.sqrt(
      rendimientos.reduce(
        (sum: number, r: number) => sum + Math.pow(r - rendimientoPromedio, 2),
        0
      ) / rendimientos.length
    );
    const coeficienteVariacion = (desviacion / rendimientoPromedio) * 100;

    // Clasificar zonas
    const umbralAlta = rendimientoPromedio * 1.1;
    const umbralBaja = rendimientoPromedio * 0.9;

    const zonaAlta =
      (rendimientos.filter((r: number) => r >= umbralAlta).length / rendimientos.length) * 100;
    const zonaBaja =
      (rendimientos.filter((r: number) => r <= umbralBaja).length / rendimientos.length) * 100;
    const zonaMedia = 100 - zonaAlta - zonaBaja;

    // Análisis IA
    const analisisIA = {
      variabilidad:
        coeficienteVariacion > 20
          ? "Alta variabilidad detectada. Considerar zonificación del lote."
          : coeficienteVariacion > 10
          ? "Variabilidad moderada. Revisar manejo diferenciado."
          : "Baja variabilidad. Manejo uniforme adecuado.",
      causasProbables: [],
    };

    if (zonaAlta > 30) {
      analisisIA.causasProbables.push(
        "Zonas de alto rendimiento significativas. Identificar factores de éxito."
      );
    }
    if (zonaBaja > 30) {
      analisisIA.causasProbables.push(
        "Zonas de bajo rendimiento significativas. Revisar drenaje, compactación o nutrición."
      );
    }

    const recomendaciones = [
      "Crear zonas de manejo basadas en este mapa de rendimiento",
      coeficienteVariacion > 15
        ? "Implementar agricultura de precisión variable"
        : "Mantener manejo uniforme actual",
      "Comparar con mapas de NDVI para validar áreas problemáticas",
    ];

    const mapa = await prisma.mapaRendimiento.create({
      data: {
        loteId,
        cosechaId: cosechaId || null,
        nombre,
        cultivo,
        fechaCosecha: new Date(fechaCosecha),
        datosRendimiento: JSON.stringify(datosRendimiento),
        rendimientoPromedio: parseFloat(rendimientoPromedio.toFixed(2)),
        rendimientoMinimo: parseFloat(rendimientoMinimo.toFixed(2)),
        rendimientoMaximo: parseFloat(rendimientoMaximo.toFixed(2)),
        coeficienteVariacion: parseFloat(coeficienteVariacion.toFixed(2)),
        zonaAlta: parseFloat(zonaAlta.toFixed(2)),
        zonaMedia: parseFloat(zonaMedia.toFixed(2)),
        zonaBaja: parseFloat(zonaBaja.toFixed(2)),
        analisisIA: JSON.stringify(analisisIA),
        recomendaciones: JSON.stringify(recomendaciones),
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(mapa, { status: 201 });
  } catch (error) {
    console.error("Error al crear mapa de rendimiento:", error);
    return NextResponse.json(
      { error: "Error al crear mapa de rendimiento" },
      { status: 500 }
    );
  }
}