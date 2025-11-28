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

    const cuentas = await prisma.cuentaBancaria.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            extractos: true,
            conciliaciones: true,
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(cuentas);
  } catch (error) {
    console.error("Error al obtener cuentas:", error);
    return NextResponse.json(
      { error: "Error al obtener cuentas" },
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

    const { nombre, banco, numeroCuenta, tipoCuenta, moneda, saldoActual } = await request.json();

    if (!nombre || !banco || !numeroCuenta || !tipoCuenta) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const cuenta = await prisma.cuentaBancaria.create({
      data: {
        nombre,
        banco,
        numeroCuenta,
        tipoCuenta,
        moneda: moneda || "USD",
        saldoActual: saldoActual ? parseFloat(saldoActual) : 0,
        saldoLibros: saldoActual ? parseFloat(saldoActual) : 0,
        userId: session.user.id,
      },
    });

    return NextResponse.json(cuenta, { status: 201 });
  } catch (error) {
    console.error("Error al crear cuenta:", error);
    return NextResponse.json(
      { error: "Error al crear cuenta" },
      { status: 500 }
    );
  }
}