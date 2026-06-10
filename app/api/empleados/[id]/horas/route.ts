import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const registro = await prisma.registroHorasEmpleado.create({
      data: {
        empleadoId: params.id,
        fecha: data.fecha,
        horasRegulares: data.horasRegulares || 0,
        horasExtra: data.horasExtra || 0,
        horasNocturnas: data.horasNocturnas || 0,
        actividad: data.actividad,
        loteId: data.loteId,
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al registrar horas" }, { status: 500 });
  }
}