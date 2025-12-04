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

    const totalBruto = data.salarioBase + data.horasExtra + data.bonificaciones;
    const totalNeto = totalBruto - data.deducciones;

    const pago = await prisma.pagoSalario.create({
      data: {
        empleadoId: params.id,
        periodo: data.periodo,
        fechaPago: data.fechaPago,
        salarioBase: data.salarioBase,
        horasExtra: data.horasExtra || 0,
        bonificaciones: data.bonificaciones || 0,
        deducciones: data.deducciones || 0,
        totalBruto,
        totalNeto,
        moneda: data.moneda || "USD",
        metodoPago: data.metodoPago || "Transferencia",
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    // Registrar transacción
    await prisma.transaccion.create({
      data: {
        tipo: "Gasto",
        categoria: "Sueldos",
        monto: totalNeto,
        moneda: data.moneda || "USD",
        fecha: data.fechaPago,
        descripcion: `Salario ${data.periodo} - Empleado`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(pago, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al registrar pago" }, { status: 500 });
  }
}