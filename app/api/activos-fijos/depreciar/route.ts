import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { mes, anio } = await request.json();
    const periodo = `${anio}-${String(mes).padStart(2, "0")}`;

    // Obtener activos activos
    const activos = await prisma.activoFijo.findMany({
      where: {
        userId: session.user.id,
        estado: "Activo",
      },
    });

    const registros = [];

    for (const activo of activos) {
      // Verificar si ya existe depreciación para este período
      const existente = await prisma.registroDepreciacion.findUnique({
        where: {
          activoFijoId_periodo: {
            activoFijoId: activo.id,
            periodo,
          },
        },
      });

      if (existente) continue;

      // Calcular depreciación
      const nuevaDepreciacionAcumulada = activo.depreciacionAcumulada + activo.depreciacionMensual;
      const nuevoValorLibros = activo.valorAdquisicion - nuevaDepreciacionAcumulada;

      // Crear registro
      const registro = await prisma.registroDepreciacion.create({
        data: {
          activoFijoId: activo.id,
          periodo,
          mes,
          anio,
          montoDepreciacion: activo.depreciacionMensual,
          depreciacionAcumulada: nuevaDepreciacionAcumulada,
          valorLibros: Math.max(nuevoValorLibros, activo.valorResidual),
          userId: session.user.id,
        },
      });

      // Actualizar activo
      await prisma.activoFijo.update({
        where: { id: activo.id },
        data: {
          depreciacionAcumulada: nuevaDepreciacionAcumulada,
          valorActual: Math.max(nuevoValorLibros, activo.valorResidual),
        },
      });

      registros.push(registro);
    }

    return NextResponse.json({
      message: `Depreciación calculada para ${registros.length} activos`,
      registros,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al depreciar activos" }, { status: 500 });
  }
}