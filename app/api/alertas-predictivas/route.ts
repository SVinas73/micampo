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
    const tipo = searchParams.get("tipo");

    const where: any = {
      userId: session.user.id,
    };

    if (estado) {
      where.estado = estado;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    const alertas = await prisma.alertaPredictiva.findMany({
      where,
      orderBy: [
        { severidad: "desc" }, // Crítica primero
        { fechaDeteccion: "desc" },
      ],
    });

    return NextResponse.json(alertas);
  } catch (error) {
    console.error("Error al obtener alertas:", error);
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
      recomendacion,
      entidad,
      entidadId,
      entidadNombre,
      metadata,
    } = await request.json();

    if (!tipo || !severidad || !titulo || !descripcion || !recomendacion) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const alerta = await prisma.alertaPredictiva.create({
      data: {
        tipo,
        severidad,
        titulo,
        descripcion,
        recomendacion,
        entidad: entidad || null,
        entidadId: entidadId || null,
        entidadNombre: entidadNombre || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(alerta, { status: 201 });
  } catch (error) {
    console.error("Error al crear alerta:", error);
    return NextResponse.json(
      { error: "Error al crear alerta" },
      { status: 500 }
    );
  }
}