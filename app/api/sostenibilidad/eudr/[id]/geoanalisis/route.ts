import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const eudr = await prisma.complianceEUDR.findUnique({
      where: { id: params.id },
      include: { establecimiento: { select: { userId: true } } },
    });
    if (!eudr || eudr.establecimiento?.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No encontrada" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      imagenSatelital2019,
      imagenSatelital2020,
      imagenSatelitalActual,
      fuenteImagenes,
      coberturaBoscosa2019,
      coberturaBoscosa2020,
      coberturaBoscosaActual,
    } = body;

    // Detectar cambio
    let cambioDetectado = false;
    let detallesCambio = null;

    if (
      coberturaBoscosa2019 !== undefined &&
      coberturaBoscosa2020 !== undefined &&
      coberturaBoscosaActual !== undefined
    ) {
      const cambio2019a2020 = coberturaBoscosa2020 - coberturaBoscosa2019;
      const cambio2020aActual = coberturaBoscosaActual - coberturaBoscosa2020;

      if (cambio2019a2020 < -5 || cambio2020aActual < -5) {
        // Pérdida > 5%
        cambioDetectado = true;
        detallesCambio = `Reducción de cobertura detectada: ${cambio2019a2020.toFixed(
          1
        )}% (2019-2020), ${cambio2020aActual.toFixed(1)}% (2020-Actual)`;
      }
    }

    // Actualizar declaración
    const declaracion = await prisma.complianceEUDR.update({
      where: { id: params.id },
      data: {
        imagenSatelital2019: imagenSatelital2019 || null,
        imagenSatelital2020: imagenSatelital2020 || null,
        imagenSatelitalActual: imagenSatelitalActual || null,
        fuenteImagenes: fuenteImagenes || null,
        coberturaBoscosa2019:
          coberturaBoscosa2019 !== undefined ? parseFloat(coberturaBoscosa2019) : null,
        coberturaBoscosa2020:
          coberturaBoscosa2020 !== undefined ? parseFloat(coberturaBoscosa2020) : null,
        coberturaBoscosaActual:
          coberturaBoscosaActual !== undefined
            ? parseFloat(coberturaBoscosaActual)
            : null,
        cambioDetectado,
        detallesCambio,
        nivelRiesgo: cambioDetectado ? "Alto" : "Bajo",
      },
    });

    return NextResponse.json({
      declaracion,
      analisis: {
        cambioDetectado,
        detallesCambio,
        recomendacion: cambioDetectado
          ? "Se requiere investigación adicional sobre el cambio de cobertura detectado"
          : "No se detectaron cambios significativos en la cobertura boscosa",
      },
    });
  } catch (error) {
    console.error("Error en geoanálisis:", error);
    return NextResponse.json(
      { error: "Error en geoanálisis" },
      { status: 500 }
    );
  }
}