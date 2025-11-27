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

    const contratos = await prisma.contrato.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        entregas: true,
        _count: {
          select: {
            entregas: true,
          },
        },
      },
      orderBy: {
        fechaContrato: "desc",
      },
    });

    return NextResponse.json(contratos);
  } catch (error) {
    console.error("Error al obtener contratos:", error);
    return NextResponse.json(
      { error: "Error al obtener contratos" },
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

    const { tipo, producto, cantidad, precioUnitario, comprador, fechaContrato, fechaEntrega, observaciones } = await request.json();

    if (!tipo || !producto || !cantidad || !precioUnitario || !fechaContrato) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const montoTotal = parseFloat(cantidad) * parseFloat(precioUnitario);

    const contrato = await prisma.contrato.create({
      data: {
        tipo,
        producto,
        cantidad: parseFloat(cantidad),
        precioUnitario: parseFloat(precioUnitario),
        montoTotal,
        comprador: comprador || null,
        fechaContrato: new Date(fechaContrato),
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
        observaciones: observaciones || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(contrato, { status: 201 });
  } catch (error) {
    console.error("Error al crear contrato:", error);
    return NextResponse.json(
      { error: "Error al crear contrato" },
      { status: 500 }
    );
  }
}