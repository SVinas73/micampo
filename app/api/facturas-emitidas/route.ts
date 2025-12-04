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
    const estadoCobro = searchParams.get("estadoCobro");

    const where: any = { userId: session.user.id };
    if (estadoCobro) where.estadoCobro = estadoCobro;

    const facturas = await prisma.facturaEmitida.findMany({
      where,
      include: {
        items: true,
        pagos: true,
      },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(facturas);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener facturas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const factura = await prisma.facturaEmitida.create({
      data: {
        numero: data.numero,
        serie: data.serie,
        tipo: data.tipo || "Factura",
        fecha: data.fecha,
        fechaVencimiento: data.fechaVencimiento,
        clienteNombre: data.clienteNombre,
        clienteRut: data.clienteRut,
        clienteDireccion: data.clienteDireccion,
        clienteEmail: data.clienteEmail,
        moneda: data.moneda || "USD",
        subtotal: data.subtotal,
        iva: data.iva,
        total: data.total,
        saldo: data.total,
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    // Crear items
    if (data.items && data.items.length > 0) {
      await prisma.itemFacturaEmitida.createMany({
        data: data.items.map((item: any) => ({
          facturaId: factura.id,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
          iva: item.iva,
          total: item.total,
          userId: session.user.id,
        })),
      });
    }

    // Crear transacción de ingreso
    await prisma.transaccion.create({
      data: {
        tipo: "Ingreso",
        categoria: "Ventas",
        monto: data.total,
        moneda: data.moneda || "USD",
        fecha: data.fecha,
        descripcion: `Factura ${data.numero} - ${data.clienteNombre}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(factura, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear factura" }, { status: 500 });
  }
}