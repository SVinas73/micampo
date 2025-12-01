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

    const calculos = await prisma.calculoDosis.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(calculos);
  } catch (error) {
    console.error("Error al obtener cálculos:", error);
    return NextResponse.json(
      { error: "Error al obtener cálculos" },
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
      tipoProducto,
      nombreProducto,
      concentracion,
      dosisObjetivo,
      superficieHa,
      costoUnitario,
      aguaPorHa,
      loteId,
      observaciones,
    } = await request.json();

    if (!nombre || !tipoProducto || !nombreProducto || !dosisObjetivo || !superficieHa) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Cálculos
    const cantidadTotal = parseFloat(dosisObjetivo) * parseFloat(superficieHa);
    const costoTotal = costoUnitario
      ? cantidadTotal * parseFloat(costoUnitario)
      : null;
    const aguaTotal = aguaPorHa
      ? parseFloat(aguaPorHa) * parseFloat(superficieHa)
      : null;

    const calculo = await prisma.calculoDosis.create({
      data: {
        nombre,
        tipoProducto,
        nombreProducto,
        concentracion: concentracion ? parseFloat(concentracion) : null,
        dosisObjetivo: parseFloat(dosisObjetivo),
        superficieHa: parseFloat(superficieHa),
        cantidadTotal,
        costoUnitario: costoUnitario ? parseFloat(costoUnitario) : null,
        costoTotal,
        aguaPorHa: aguaPorHa ? parseFloat(aguaPorHa) : null,
        aguaTotal,
        loteId: loteId || null,
        observaciones: observaciones || null,
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

    return NextResponse.json(calculo, { status: 201 });
  } catch (error) {
    console.error("Error al crear cálculo:", error);
    return NextResponse.json(
      { error: "Error al crear cálculo de dosis" },
      { status: 500 }
    );
  }
}