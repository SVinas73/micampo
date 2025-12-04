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
    const moneda = searchParams.get("moneda");
    const fecha = searchParams.get("fecha");

    const where: any = { userId: session.user.id };
    if (moneda) where.monedaDestino = moneda;
    if (fecha) {
      const fechaDate = new Date(fecha);
      where.fecha = {
        gte: new Date(fechaDate.setHours(0, 0, 0, 0)),
        lt: new Date(fechaDate.setHours(23, 59, 59, 999)),
      };
    }

    const tipos = await prisma.tipoCambio.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: 30,
    });

    return NextResponse.json(tipos);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener tipos de cambio" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const tipo = await prisma.tipoCambio.create({
      data: {
        fecha: data.fecha || new Date(),
        monedaBase: data.monedaBase || "USD",
        monedaDestino: data.monedaDestino,
        compra: data.compra,
        venta: data.venta,
        promedio: (data.compra + data.venta) / 2,
        fuente: data.fuente || "Manual",
        userId: session.user.id,
      },
    });

    return NextResponse.json(tipo, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear tipo de cambio" }, { status: 500 });
  }
}