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

    const margenes = await prisma.margenBruto.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        periodo: "desc",
      },
    });

    return NextResponse.json(margenes);
  } catch (error) {
    console.error("Error al obtener márgenes:", error);
    return NextResponse.json(
      { error: "Error al obtener márgenes" },
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

    const { tipo, referenciaId, referenciaNombre, periodo } = await request.json();

    if (!tipo || !referenciaId || !referenciaNombre || !periodo) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Calcular ingresos y costos según el tipo
    let ingresos = 0;
    let costos = 0;

    if (tipo === "Lote") {
      // Calcular ingresos de cosechas
      const cosechas = await prisma.cosecha.findMany({
        where: {
          loteId: referenciaId,
          userId: session.user.id,
        },
      });

      ingresos = cosechas.reduce((sum, c) => {
        const ingreso = (c.precioVenta || 0) * c.rendimiento;
        return sum + ingreso;
      }, 0);

      // Calcular costos del lote
      const costosLote = await prisma.costoLote.findMany({
        where: {
          loteId: referenciaId,
          userId: session.user.id,
        },
      });

      costos = costosLote.reduce((sum, c) => sum + c.monto, 0);
    } else if (tipo === "Animal") {
      // Calcular ingresos de ventas/movimientos
      const movimientos = await prisma.movimiento.findMany({
        where: {
          animalId: referenciaId,
          tipo: "Venta",
          userId: session.user.id,
        },
      });

      ingresos = movimientos.reduce((sum, m) => sum + (m.monto || 0), 0);

      // Calcular costos del animal
      const costosAnimal = await prisma.costoAnimal.findMany({
        where: {
          animalId: referenciaId,
          userId: session.user.id,
        },
      });

      costos = costosAnimal.reduce((sum, c) => sum + c.monto, 0);
    }

    const margen = ingresos - costos;
    const margenPorcentaje = ingresos > 0 ? (margen / ingresos) * 100 : 0;

    // Buscar si ya existe un margen para este período
    const margenExistente = await prisma.margenBruto.findFirst({
      where: {
        userId: session.user.id,
        tipo,
        referenciaId,
        periodo,
      },
    });

    let margenBruto;

    if (margenExistente) {
      // Actualizar existente
      margenBruto = await prisma.margenBruto.update({
        where: { id: margenExistente.id },
        data: {
          ingresos,
          costos,
          margen,
          margenPorcentaje,
          referenciaNombre,
        },
      });
    } else {
      // Crear nuevo
      margenBruto = await prisma.margenBruto.create({
        data: {
          tipo,
          referenciaId,
          referenciaNombre,
          periodo,
          ingresos,
          costos,
          margen,
          margenPorcentaje,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(margenBruto, { status: 201 });
  } catch (error) {
    console.error("Error al calcular margen:", error);
    return NextResponse.json(
      { error: "Error al calcular margen" },
      { status: 500 }
    );
  }
}