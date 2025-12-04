import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const trabajo = await prisma.trabajoContratista.update({
      where: { id: params.id },
      data: {
        estado: data.estado,
        fechaInicio: data.fechaInicio,
        fechaCompletada: data.estado === "Completado" ? new Date() : null,
        archivosUrl: data.archivosUrl ? JSON.stringify(data.archivosUrl) : null,
        estadoPago: data.estadoPago,
        observaciones: data.observaciones,
      },
    });

    // Si se completa el trabajo, crear transacción de pago
    if (data.estado === "Completado" && trabajo.monto) {
      await prisma.transaccion.create({
        data: {
          tipo: "Gasto",
          categoria: "Contratistas",
          monto: trabajo.monto,
          moneda: trabajo.moneda,
          fecha: new Date(),
          descripcion: `${trabajo.tipo} - ${trabajo.titulo}`,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(trabajo);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al actualizar trabajo" }, { status: 500 });
  }
}