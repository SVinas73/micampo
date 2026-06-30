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
      costoTotal: costoTotalMezcla,
      aguaPorHa,
      loteId,
      observaciones,
    } = await request.json();

    if (!nombre || !tipoProducto || !nombreProducto || dosisObjetivo == null || !superficieHa) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Cálculos
    const cantidadTotal = parseFloat(dosisObjetivo) * parseFloat(superficieHa);
    // Si el cliente manda el costo TOTAL de la mezcla (todos los productos), lo usamos;
    // si no, lo estimamos con el producto principal.
    const costoTotal =
      costoTotalMezcla != null && !isNaN(parseFloat(costoTotalMezcla))
        ? parseFloat(costoTotalMezcla)
        : costoUnitario
          ? cantidadTotal * parseFloat(costoUnitario)
          : null;
    const aguaTotal = aguaPorHa
      ? parseFloat(aguaPorHa) * parseFloat(superficieHa)
      : null;

    // Convierte a número seguro: texto no numérico → null (evita NaN que rompe Prisma).
    const numOrNull = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null;
      const n = parseFloat(String(v));
      return isNaN(n) ? null : n;
    };

    const calculo = await prisma.calculoDosis.create({
      data: {
        nombre,
        tipoProducto,
        nombreProducto,
        concentracion: numOrNull(concentracion),
        dosisObjetivo: parseFloat(dosisObjetivo),
        superficieHa: parseFloat(superficieHa),
        cantidadTotal,
        costoUnitario: numOrNull(costoUnitario),
        costoTotal,
        aguaPorHa: numOrNull(aguaPorHa),
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