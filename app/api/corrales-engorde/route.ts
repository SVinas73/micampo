import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const corrales = await prisma.corralEngorde.findMany({
      where: { userId: session.user.id },
      include: {
        racion: { select: { id: true, nombre: true, costoTotal: true, consumoDiario: true } },
        pesadas: { orderBy: { fecha: "desc" }, take: 30 },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(corrales);
  } catch (error) {
    console.error("Error al obtener corrales de engorde:", error);
    return NextResponse.json({ error: "Error al obtener corrales" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const b = await request.json();
    if (!b.nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const num = (v: unknown) => (v === undefined || v === null || v === "" ? null : parseFloat(String(v)));
    const int = (v: unknown) => (v === undefined || v === null || v === "" ? null : parseInt(String(v)));

    const corral = await prisma.corralEngorde.create({
      data: {
        nombre: b.nombre,
        categoria: b.categoria || null,
        capacidad: int(b.capacidad),
        cabezas: int(b.cabezas) ?? 0,
        fechaIngreso: b.fechaIngreso ? new Date(b.fechaIngreso) : new Date(),
        pesoIngreso: num(b.pesoIngreso),
        pesoActual: num(b.pesoActual) ?? num(b.pesoIngreso),
        pesoObjetivo: num(b.pesoObjetivo),
        gdpObjetivo: num(b.gdpObjetivo),
        racionId: b.racionId || null,
        consumoDiario: num(b.consumoDiario),
        costoDiario: num(b.costoDiario),
        precioMercado: num(b.precioMercado),
        fechaFaenaEst: b.fechaFaenaEst ? new Date(b.fechaFaenaEst) : null,
        estado: b.estado || "Activo",
        notas: b.notas || null,
        userId: session.user.id,
      },
    });

    // Pesada inicial de ingreso
    if (corral.pesoIngreso) {
      await prisma.pesadaCorral.create({
        data: {
          corralId: corral.id,
          fecha: corral.fechaIngreso || new Date(),
          pesoPromedio: corral.pesoIngreso,
          cabezas: corral.cabezas,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(corral, { status: 201 });
  } catch (error) {
    console.error("Error al crear corral de engorde:", error);
    return NextResponse.json({ error: "Error al crear corral" }, { status: 500 });
  }
}
