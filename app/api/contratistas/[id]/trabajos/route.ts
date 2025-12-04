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

    const trabajo = await prisma.trabajoContratista.create({
      data: {
        contratistaId: params.id,
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipo: data.tipo,
        loteId: data.loteId,
        loteNombre: data.loteNombre,
        hectareas: data.hectareas,
        fechaInicio: data.fechaInicio,
        monto: data.monto,
        moneda: data.moneda || "USD",
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    return NextResponse.json(trabajo, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear trabajo" }, { status: 500 });
  }
}