import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const data = await request.json();

    // Obtener cuenta
    const cuenta = await prisma.cuentaPorPagar.findUnique({
      where: { id: params.id },
    });

    if (!cuenta || cuenta.userId !== session.user.id) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    // Crear pago
    const pago = await prisma.pagoRealizado.create({
      data: {
        cuentaPorPagarId: params.id,
        fecha: new Date(data.fecha),
        monto: parseFloat(data.monto),
        moneda: data.moneda || "USD",
        metodoPago: data.metodoPago,
        referencia: data.referencia || null,
        cuentaBancariaId: data.cuentaBancariaId || null,  // Este campo DEBE existir en PagoRealizado
        observaciones: data.observaciones || null,
        userId: session.user.id,
      },
    });

    // Actualizar cuenta
    const nuevoMontoPagado = parseFloat(cuenta.montoPagado.toString()) + parseFloat(data.monto);
    const nuevoSaldo = parseFloat(cuenta.monto.toString()) - nuevoMontoPagado;
    let nuevoEstado = cuenta.estadoPago;

    if (nuevoSaldo <= 0) {
      nuevoEstado = "Pagado";
    } else if (nuevoMontoPagado > 0) {
      nuevoEstado = "Parcial";
    }

    await prisma.cuentaPorPagar.update({
      where: { id: params.id },
      data: {
        montoPagado: nuevoMontoPagado,
        saldo: nuevoSaldo,
        estadoPago: nuevoEstado,
      },
    });

    // Registrar en extracto bancario si hay cuenta
    if (data.cuentaBancariaId) {
      await prisma.extractoBancario.create({
        data: {
          cuentaId: data.cuentaBancariaId,  // ✅ CORREGIDO: "cuentaId" en lugar de "cuentaBancariaId"
          fecha: new Date(data.fecha),
          descripcion: `Pago ${cuenta.proveedor} - ${cuenta.concepto}`,
          debito: parseFloat(data.monto),
          saldo: 0, // Se actualizará después
          referencia: data.referencia || null,
          userId: session.user.id,
        },
      });

      // Actualizar saldo de cuenta bancaria
      await prisma.cuentaBancaria.update({
        where: { id: data.cuentaBancariaId },
        data: {
          saldoActual: {
            decrement: parseFloat(data.monto),
          },
        },
      });
    }

    // Crear transacción de gasto
    await prisma.transaccion.create({
      data: {
        tipo: "Gasto",
        categoria: "Pagos a Proveedores",
        monto: parseFloat(data.monto),
        fecha: new Date(data.fecha),
        descripcion: `Pago ${cuenta.proveedor} - ${cuenta.concepto}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(pago, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al registrar pago" }, { status: 500 });
  }
}