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
    const estado = searchParams.get("estado") || "Activa";

    const alertas = await prisma.alertaStock.findMany({
      where: {
        userId: session.user.id,
        estado,
      },
      include: {
        stockInsumo: {
          select: { nombre: true, categoria: true, unidadMedida: true },
        },
      },
      orderBy: [
        { severidad: "desc" },
        { fechaDeteccion: "desc" },
      ],
    });

    return NextResponse.json(alertas);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener alertas" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, estado } = await request.json();

    const alerta = await prisma.alertaStock.update({
      where: { id },
      data: {
        estado,
        fechaResolucion: estado === "Resuelta" ? new Date() : null,
      },
    });

    return NextResponse.json(alerta);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al actualizar alerta" }, { status: 500 });
  }
}