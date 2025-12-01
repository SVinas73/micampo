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
    const estado = searchParams.get("estado");

    const where: any = {
      userId: session.user.id,
    };

    if (estado) {
      where.estado = estado;
    }

    const alertas = await prisma.alertaSanitaria.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(alertas);
  } catch (error) {
    console.error("Error al obtener alertas sanitarias:", error);
    return NextResponse.json(
      { error: "Error al obtener alertas" },
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

    const {
      tipo,
      severidad,
      titulo,
      descripcion,
      animalId,
      categoria,
      numeroAfectados,
      accionRequerida,
      fechaLimite,
      deteccionIA,
      confianza,
      recomendacion,
    } = await request.json();

    if (!tipo || !severidad || !titulo || !descripcion || !accionRequerida) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const alerta = await prisma.alertaSanitaria.create({
      data: {
        tipo,
        severidad,
        titulo,
        descripcion,
        animalId: animalId || null,
        categoria: categoria || null,
        numeroAfectados: numeroAfectados ? parseInt(numeroAfectados) : 1,
        accionRequerida,
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        deteccionIA: deteccionIA || false,
        confianza: confianza ? parseFloat(confianza) : null,
        recomendacion: recomendacion || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(alerta, { status: 201 });
  } catch (error) {
    console.error("Error al crear alerta sanitaria:", error);
    return NextResponse.json(
      { error: "Error al crear alerta" },
      { status: 500 }
    );
  }
}