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
    const estadoPago = searchParams.get("estadoPago");

    const where: any = { userId: session.user.id };
    if (estadoPago) where.estadoPago = estadoPago;

    const cuentas = await prisma.cuentaPorPagar.findMany({
      where,
      include: {
        comprobante: {
          select: { numero: true, tipo: true },
        },
        pagos: true,
      },
      orderBy: { fechaVencimiento: "asc" },
    });

    return NextResponse.json(cuentas);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener cuentas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const cuenta = await prisma.cuentaPorPagar.create({
      data: {
        comprobanteId: data.comprobanteId,
        proveedor: data.proveedor,
        proveedorRut: data.proveedorRut,
        concepto: data.concepto,
        fechaEmision: data.fechaEmision,
        fechaVencimiento: data.fechaVencimiento,
        monto: data.monto,
        moneda: data.moneda || "USD",
        saldo: data.monto,
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    return NextResponse.json(cuenta, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear cuenta" }, { status: 500 });
  }
}