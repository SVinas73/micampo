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
    const stockInsumoId = searchParams.get("stockInsumoId");

    const where: any = { userId: session.user.id };
    if (stockInsumoId) where.stockInsumoId = stockInsumoId;

    const lotes = await prisma.loteInsumo.findMany({
      where,
      include: {
        stockInsumo: {
          select: { nombre: true, categoria: true, unidadMedida: true },
        },
      },
      orderBy: { fechaVencimiento: "asc" },
    });

    // Calcular días para vencer
    const lotesConDias = lotes.map((lote) => {
      if (lote.fechaVencimiento) {
        const dias = Math.ceil(
          (new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return { ...lote, diasParaVencer: dias };
      }
      return lote;
    });

    return NextResponse.json(lotesConDias);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener lotes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Calcular días para vencer
    let diasParaVencer = null;
    if (data.fechaVencimiento) {
      diasParaVencer = Math.ceil(
        (new Date(data.fechaVencimiento).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }

    const lote = await prisma.loteInsumo.create({
      data: {
        ...data,
        diasParaVencer,
        userId: session.user.id,
      },
      include: {
        stockInsumo: true,
      },
    });

    // Actualizar stock del insumo
    await prisma.stockInsumo.update({
      where: { id: data.stockInsumoId },
      data: {
        stockActual: {
          increment: data.cantidadInicial,
        },
      },
    });

    // Crear movimiento de entrada
    await prisma.movimientoStock.create({
      data: {
        stockInsumoId: data.stockInsumoId,
        tipoMovimiento: "Entrada",
        cantidad: data.cantidadInicial,
        unidadMedida: data.unidadMedida,
        stockAnterior: lote.stockInsumo.stockActual,
        stockPosterior: lote.stockInsumo.stockActual + data.cantidadInicial,
        origen: "Compra",
        loteInsumoId: lote.id,
        costoUnitario: data.costoUnitario,
        costoTotal: data.costoTotal,
        observaciones: `Ingreso lote ${data.numeroLote}`,
        userId: session.user.id,
      },
    });

    // Verificar alerta de vencimiento
    if (diasParaVencer !== null && diasParaVencer <= 30) {
      await prisma.alertaStock.create({
        data: {
          stockInsumoId: data.stockInsumoId,
          tipo: "Vencimiento",
          severidad: diasParaVencer <= 7 ? "Crítica" : "Media",
          titulo: `Lote próximo a vencer: ${lote.stockInsumo.nombre}`,
          mensaje: `Lote ${data.numeroLote} vence en ${diasParaVencer} días`,
          diasVencimiento: diasParaVencer,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(lote, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear lote" }, { status: 500 });
  }
}