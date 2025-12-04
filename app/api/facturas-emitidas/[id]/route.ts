import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Obtener factura
    const factura = await prisma.facturaEmitida.findUnique({
      where: { id: params.id },
    });

    if (!factura || factura.userId !== session.user.id) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    // Crear pago
    const pago = await prisma.pagoRecibido.create({
      data: {
        facturaId: params.id,
        fecha: data.fecha,
        monto: data.monto,
        moneda: data.moneda || "USD",
        metodoPago: data.metodoPago,
        referencia: data.referencia,
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    // Actualizar factura
    const nuevoMontoCobrado = factura.montoCobrado + data.monto;
    const nuevoSaldo = factura.total - nuevoMontoCobrado;
    let nuevoEstado = factura.estadoCobro;

    if (nuevoSaldo <= 0) {
      nuevoEstado = "Cobrado";
    } else if (nuevoMontoCobrado > 0) {
      nuevoEstado = "Parcial";
    }

    await prisma.facturaEmitida.update({
      where: { id: params.id },
      data: {
        montoCobrado: nuevoMontoCobrado,
        saldo: nuevoSaldo,
        estadoCobro: nuevoEstado,
      },
    });

    return NextResponse.json(pago, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al registrar pago" }, { status: 500 });
  }
}