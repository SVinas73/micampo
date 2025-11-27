import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { fecha, cantidad, contratoId } = await request.json();

    if (!fecha || !cantidad || !contratoId) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const entrega = await prisma.entrega.create({
      data: {
        fecha: new Date(fecha),
        cantidad: parseFloat(cantidad),
        contratoId,
        userId: session.user.id,
      },
    });

    // Verificar si el contrato está completo
    const contrato = await prisma.contrato.findUnique({
      where: { id: contratoId },
      include: { entregas: true },
    });

    if (contrato) {
      const totalEntregado = contrato.entregas.reduce((sum, e) => sum + e.cantidad, 0);
      
      if (totalEntregado >= contrato.cantidad) {
        await prisma.contrato.update({
          where: { id: contratoId },
          data: { estado: "Entregado" },
        });
      }
    }

    return NextResponse.json(entrega, { status: 201 });
  } catch (error) {
    console.error("Error al crear entrega:", error);
    return NextResponse.json(
      { error: "Error al crear entrega" },
      { status: 500 }
    );
  }
}