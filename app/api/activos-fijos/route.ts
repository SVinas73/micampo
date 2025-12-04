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
    const tipo = searchParams.get("tipo");
    const estado = searchParams.get("estado");

    const where: any = { userId: session.user.id };
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const activos = await prisma.activoFijo.findMany({
      where,
      include: {
        maquina: {
          select: { nombre: true, tipo: true },
        },
        registrosDepreciacion: {
          orderBy: { periodo: "desc" },
          take: 12,
        },
      },
      orderBy: { fechaAdquisicion: "desc" },
    });

    return NextResponse.json(activos);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener activos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Calcular depreciación
    const depreciacionAnual = (data.valorAdquisicion - data.valorResidual) / data.vidaUtilAnios;
    const depreciacionMensual = depreciacionAnual / 12;

    const activo = await prisma.activoFijo.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        tipo: data.tipo,
        descripcion: data.descripcion,
        marca: data.marca,
        modelo: data.modelo,
        anioFabricacion: data.anioFabricacion,
        numeroSerie: data.numeroSerie,
        valorAdquisicion: data.valorAdquisicion,
        moneda: data.moneda || "USD",
        fechaAdquisicion: data.fechaAdquisicion,
        vidaUtilAnios: data.vidaUtilAnios,
        valorResidual: data.valorResidual || 0,
        metodoDepreciacion: data.metodoDepreciacion || "Lineal",
        depreciacionAnual,
        depreciacionMensual,
        depreciacionAcumulada: 0,
        valorActual: data.valorAdquisicion,
        estado: data.estado || "Activo",
        maquinaId: data.maquinaId,
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    return NextResponse.json(activo, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear activo" }, { status: 500 });
  }
}