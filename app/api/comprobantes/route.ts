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
    const tipo = searchParams.get("tipo");
    const estado = searchParams.get("estado");

    const where: any = { userId: session.user.id };
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const comprobantes = await prisma.comprobante.findMany({
      where,
      include: {
        items: true,
        transaccion: true,
        asignacionCostos: true,
      },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(comprobantes);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener comprobantes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const comprobante = await prisma.comprobante.create({
      data: {
        tipo: data.tipo,
        numero: data.numero,
        fecha: data.fecha,
        razonSocial: data.razonSocial,
        rut: data.rut,
        direccion: data.direccion,
        moneda: data.moneda || "USD",
        subtotal: data.subtotal,
        iva: data.iva || 0,
        total: data.total,
        archivoUrl: data.archivoUrl,
        archivoNombre: data.archivoNombre,
        estado: data.estado || "Pendiente",
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    // Crear items
    if (data.items && data.items.length > 0) {
      await prisma.itemComprobante.createMany({
        data: data.items.map((item: any) => ({
          comprobanteId: comprobante.id,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
          iva: item.iva || 0,
          total: item.total,
          categoria: item.categoria,
          userId: session.user.id,
        })),
      });
    }

    // Crear transacción si corresponde
    if (data.crearTransaccion) {
      await prisma.transaccion.create({
        data: {
          tipo: "Gasto",
          categoria: "Compras",
          monto: data.total,
          moneda: data.moneda || "USD",
          fecha: data.fecha,
          descripcion: `${data.tipo} ${data.numero} - ${data.razonSocial}`,
          metodoPago: data.metodoPago || "Transferencia",
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(comprobante, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear comprobante" }, { status: 500 });
  }
}