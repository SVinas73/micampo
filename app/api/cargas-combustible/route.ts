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
    const tanqueId = searchParams.get("tanqueId");
    const maquinaId = searchParams.get("maquinaId");

    const where: any = { userId: session.user.id };
    if (tanqueId) where.tanqueId = tanqueId;
    if (maquinaId) where.maquinariaId = maquinaId;

    const cargas = await prisma.cargaCombustible.findMany({
      where,
      include: {
        tanque: {
          select: { nombre: true, tipoCombustible: true },
        },
        maquinaria: {
          select: { marca: true, modelo: true, tipo: true },
        },
      },
      orderBy: { fecha: "desc" },
      take: 100,
    });

    // Compatibilidad con el shape anterior (maquina.nombre)
    const result = cargas.map((c) => ({
      ...c,
      maquina: c.maquinaria
        ? { nombre: `${c.maquinaria.marca} ${c.maquinaria.modelo}`, tipo: c.maquinaria.tipo }
        : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener cargas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Obtener tanque
    const tanque = await prisma.tanqueCombustible.findUnique({
      where: { id: data.tanqueId },
    });

    if (!tanque) {
      return NextResponse.json({ error: "Tanque no encontrado" }, { status: 404 });
    }

    const nivelAnterior = tanque.nivelActual;
    let nivelPosterior = nivelAnterior;

    if (data.tipoCarga === "CargaTanque") {
      nivelPosterior = nivelAnterior + data.litros;
    } else if (data.tipoCarga === "CargaMaquina") {
      nivelPosterior = nivelAnterior - data.litros;
    }

    // Calcular consumo si es carga a máquina
    let consumoLitrosHora = null;
    if (data.tipoCarga === "CargaMaquina" && data.maquinaId && data.horometroActual) {
      const ultimaCarga = await prisma.cargaCombustible.findFirst({
        where: {
          maquinariaId: data.maquinaId,
          tipoCarga: "CargaMaquina",
        },
        orderBy: { fecha: "desc" },
      });

      if (ultimaCarga && ultimaCarga.horometroActual) {
        const horasTrabajadas = data.horometroActual - ultimaCarga.horometroActual;
        if (horasTrabajadas > 0) {
          consumoLitrosHora = data.litros / horasTrabajadas;
        }
      }
    }

    const carga = await prisma.cargaCombustible.create({
      data: {
        ...data,
        nivelAnterior,
        nivelPosterior,
        consumoLitrosHora,
        costoTotal: data.litros * (data.precioLitro || 0),
        userId: session.user.id,
      },
    });

    // Actualizar tanque
    await prisma.tanqueCombustible.update({
      where: { id: data.tanqueId },
      data: {
        nivelActual: nivelPosterior,
        porcentaje: (nivelPosterior / tanque.capacidadTotal) * 100,
        alertaNivelBajo: nivelPosterior <= tanque.nivelMinimo,
      },
    });

    return NextResponse.json(carga, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear carga" }, { status: 500 });
  }
}