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

    const certificaciones = await prisma.certificacion.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        fechaEmision: "desc",
      },
    });

    return NextResponse.json(certificaciones);
  } catch (error) {
    console.error("Error al obtener certificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener certificaciones" },
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

    const { nombre, entidadEmisora, numeroRegistro, fechaEmision, fechaVencimiento, documentoUrl } = await request.json();

    if (!nombre || !entidadEmisora || !fechaEmision) {
      return NextResponse.json(
        { error: "Nombre, entidad emisora y fecha de emisión son requeridos" },
        { status: 400 }
      );
    }

    const certificacion = await prisma.certificacion.create({
      data: {
        nombre,
        entidadEmisora,
        numeroRegistro: numeroRegistro || null,
        fechaEmision: new Date(fechaEmision),
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        documentoUrl: documentoUrl || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(certificacion, { status: 201 });
  } catch (error) {
    console.error("Error al crear certificación:", error);
    return NextResponse.json(
      { error: "Error al crear certificación" },
      { status: 500 }
    );
  }
}