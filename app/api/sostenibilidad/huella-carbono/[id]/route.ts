import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const huella = await prisma.huellaCarbono.findUnique({
      where: { id: params.id },
      include: {
        establecimiento: {
          select: {
            nombre: true,
            hectareasTotales: true,
          },
        },
      },
    });

    if (!huella) {
      return NextResponse.json(
        { error: "Huella de carbono no encontrada" },
        { status: 404 }
      );
    }

    // Calcular porcentajes por categoría
    const total = huella.emisionesTotales;
    const distribucion = {
      combustible: ((huella.emisionesCombustible / total) * 100).toFixed(1),
      fertilizantes: ((huella.emisionesFertilizantes / total) * 100).toFixed(1),
      agroquimicos: ((huella.emisionesAgroquimicos / total) * 100).toFixed(1),
      ganaderia: ((huella.emisionesGanaderia / total) * 100).toFixed(1),
      electricidad: ((huella.emisionesElectricidad / total) * 100).toFixed(1),
      transporte: ((huella.emisionesTransporte / total) * 100).toFixed(1),
    };

    return NextResponse.json({
      ...huella,
      distribucion,
    });
  } catch (error) {
    console.error("Error al obtener huella de carbono:", error);
    return NextResponse.json(
      { error: "Error al obtener huella de carbono" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.huellaCarbono.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Huella eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar huella de carbono:", error);
    return NextResponse.json(
      { error: "Error al eliminar huella de carbono" },
      { status: 500 }
    );
  }
}