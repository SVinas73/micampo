import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const establecimientoId = searchParams.get("establecimientoId");

    if (!establecimientoId) {
      return NextResponse.json(
        { error: "establecimientoId requerido" },
        { status: 400 }
      );
    }

    const certificaciones = await prisma.certificacionSostenibilidad.findMany({
      where: { establecimientoId },
      include: {
        _count: {
          select: {
            checklistItems: true,
            carpetaDocumentos: true,
          },
        },
        establecimiento: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ certificaciones });
  } catch (error) {
    console.error("Error al obtener certificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener certificaciones" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      establecimientoId,
      tipoCertificacion,
      esquema,
      alcance,
      organismoCertificador,
      fechaSolicitud,
    } = body;

    if (
      !establecimientoId ||
      !tipoCertificacion ||
      !organismoCertificador
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const certificacion = await prisma.certificacionSostenibilidad.create({
      data: {
        establecimientoId,
        tipoCertificacion,
        esquema: esquema || null,
        alcance: alcance || [],
        organismoCertificador,
        estado: "En Proceso",
        fechaSolicitud: fechaSolicitud ? new Date(fechaSolicitud) : new Date(),
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