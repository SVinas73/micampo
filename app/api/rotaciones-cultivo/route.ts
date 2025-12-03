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

    const rotaciones = await prisma.rotacionCultivo.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaSiembra: "desc",
      },
    });

    return NextResponse.json(rotaciones);
  } catch (error) {
    console.error("Error al obtener rotaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener rotaciones" },
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
      fechaSiembra,
      fechaCosecha,
      rendimiento,
      calidadCosecha,
      tipoRotacion,
      aporteNitrogeno,
      residuosCosecha,
      laboreo,
      costoTotal,
      ingresoTotal,
      observaciones,
    } = await request.json();

    if (!loteId || !cultivo || !fechaSiembra) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Calcular margen bruto
    let margenBruto = null;
    if (costoTotal && ingresoTotal) {
      margenBruto = parseFloat(ingresoTotal) - parseFloat(costoTotal);
    }

    // Análisis IA simple de sostenibilidad
    const analisisSostenibilidad = {
      balanceNitrogeno: aporteNitrogeno ? parseFloat(aporteNitrogeno) : 0,
      conservacionSuelo: laboreo === "Siembra Directa" ? "Excelente" : laboreo === "Reducido" ? "Buena" : "Regular",
      aporteMateria: residuosCosecha ? `${residuosCosecha} ton/ha de rastrojo` : "No especificado",
      recomendacion: "",
    };

    if (tipoRotacion === "Leguminosa") {
      analisisSostenibilidad.recomendacion = "Excelente rotación. Las leguminosas aportan nitrógeno al suelo y rompen ciclos de plagas.";
    } else if (tipoRotacion === "Gramínea") {
      analisisSostenibilidad.recomendacion = "Considerar incluir leguminosas en la rotación para mejorar balance de nitrógeno.";
    }

    const rotacion = await prisma.rotacionCultivo.create({
      data: {
        loteId,
        cultivo,
        variedad: variedad || null,
        fechaSiembra: new Date(fechaSiembra),
        fechaCosecha: fechaCosecha ? new Date(fechaCosecha) : null,
        rendimiento: rendimiento ? parseFloat(rendimiento) : null,
        calidadCosecha: calidadCosecha || null,
        tipoRotacion: tipoRotacion || null,
        aporteNitrogeno: aporteNitrogeno ? parseFloat(aporteNitrogeno) : null,
        residuosCosecha: residuosCosecha ? parseFloat(residuosCosecha) : null,
        laboreo: laboreo || null,
        costoTotal: costoTotal ? parseFloat(costoTotal) : null,
        ingresoTotal: ingresoTotal ? parseFloat(ingresoTotal) : null,
        margenBruto,
        observaciones: observaciones || null,
        analisisIA: JSON.stringify(analisisSostenibilidad),
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

    return NextResponse.json(rotacion, { status: 201 });
  } catch (error) {
    console.error("Error al crear rotación:", error);
    return NextResponse.json(
      { error: "Error al crear rotación de cultivo" },
      { status: 500 }
    );
  }
}