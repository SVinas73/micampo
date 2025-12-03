import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { animalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const registro = await prisma.registroGenetico.findUnique({
      where: { animalId: params.animalId },
    });

    if (!registro || registro.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    const data = await request.json();

    const updated = await prisma.registroGenetico.update({
      where: { animalId: params.animalId },
      data: {
        ...(data.padreId !== undefined && { padreId: data.padreId || null }),
        ...(data.madreId !== undefined && { madreId: data.madreId || null }),
        ...(data.abueloPaternoId !== undefined && { abueloPaternoId: data.abueloPaternoId || null }),
        ...(data.abuelaPaternaId !== undefined && { abuelaPaternaId: data.abuelaPaternaId || null }),
        ...(data.abueloMaternoId !== undefined && { abueloMaternoId: data.abueloMaternoId || null }),
        ...(data.abuelaMaternaId !== undefined && { abuelaMaternaId: data.abuelaMaternaId || null }),
        ...(data.muestraADN !== undefined && { muestraADN: data.muestraADN }),
        ...(data.fechaMuestraADN !== undefined && {
          fechaMuestraADN: data.fechaMuestraADN ? new Date(data.fechaMuestraADN) : null,
        }),
        ...(data.laboratorio !== undefined && { laboratorio: data.laboratorio }),
        ...(data.valorGeneticoEstimado !== undefined && {
          valorGeneticoEstimado: data.valorGeneticoEstimado ? parseFloat(data.valorGeneticoEstimado) : null,
        }),
        ...(data.observaciones !== undefined && { observaciones: data.observaciones }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar registro:", error);
    return NextResponse.json(
      { error: "Error al actualizar registro" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { animalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const registro = await prisma.registroGenetico.findUnique({
      where: { animalId: params.animalId },
    });

    if (!registro || registro.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    await prisma.registroGenetico.delete({
      where: { animalId: params.animalId },
    });

    return NextResponse.json({ message: "Registro eliminado" });
  } catch (error) {
    console.error("Error al eliminar registro:", error);
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    );
  }
}