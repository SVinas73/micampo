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

    const raciones = await prisma.racion.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        componentes: {
          include: {
            alimento: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(raciones);
  } catch (error) {
    console.error("Error al obtener raciones:", error);
    return NextResponse.json(
      { error: "Error al obtener raciones" },
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
      nombre,
      animalObjetivo,
      pesoObjetivo,
      etapaProductiva,
      consumoDiario,
      componentes,
      observaciones,
    } = await request.json();

    if (!nombre || !animalObjetivo || !pesoObjetivo || !etapaProductiva || !consumoDiario) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Calcular totales
    let proteinaTotal = 0;
    let energiaTotal = 0;
    let costoTotal = 0;

    if (componentes && componentes.length > 0) {
      const alimentos = await prisma.alimento.findMany({
        where: {
          id: { in: componentes.map((c: any) => c.alimentoId) },
        },
      });

      componentes.forEach((comp: any) => {
        const alimento = alimentos.find((a) => a.id === comp.alimentoId);
        if (alimento) {
          const cantidad = parseFloat(comp.cantidad);
          proteinaTotal += (alimento.proteina * cantidad) / parseFloat(consumoDiario);
          energiaTotal += (alimento.energia * cantidad) / parseFloat(consumoDiario);
          costoTotal += alimento.costoKg * cantidad;
        }
      });
    }

    // Crear ración
    const racion = await prisma.racion.create({
      data: {
        nombre,
        animalObjetivo,
        pesoObjetivo: parseFloat(pesoObjetivo),
        etapaProductiva,
        consumoDiario: parseFloat(consumoDiario),
        proteinaTotal,
        energiaTotal,
        costoTotal,
        observaciones: observaciones || null,
        userId: session.user.id,
      },
    });

    // Crear componentes
    if (componentes && componentes.length > 0) {
      await prisma.componenteRacion.createMany({
        data: componentes.map((c: any) => ({
          racionId: racion.id,
          alimentoId: c.alimentoId,
          cantidad: parseFloat(c.cantidad),
          porcentaje: (parseFloat(c.cantidad) / parseFloat(consumoDiario)) * 100,
          userId: session.user.id,
        })),
      });
    }

    // Retornar ración completa
    const racionCompleta = await prisma.racion.findUnique({
      where: { id: racion.id },
      include: {
        componentes: {
          include: {
            alimento: true,
          },
        },
      },
    });

    return NextResponse.json(racionCompleta, { status: 201 });
  } catch (error) {
    console.error("Error al crear ración:", error);
    return NextResponse.json(
      { error: "Error al crear ración" },
      { status: 500 }
    );
  }
}