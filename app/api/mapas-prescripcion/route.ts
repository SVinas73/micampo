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
    const loteId = searchParams.get("loteId");

    const where: any = {
      userId: session.user.id,
    };

    if (loteId) {
      where.loteId = loteId;
    }

    const mapas = await prisma.mapaPrescripcion.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaCreacion: "desc",
      },
    });

    return NextResponse.json(mapas);
  } catch (error) {
    console.error("Error al obtener mapas:", error);
    return NextResponse.json(
      { error: "Error al obtener mapas" },
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
      loteId,
      nombre,
      tipo,
      cultivo,
      producto,
      prescripcionDatos,
      unidad,
      formatoArchivo,
      generadoPorIA,
      criterios,
    } = await request.json();

    if (!loteId || !nombre || !tipo || !producto || !prescripcionDatos || !unidad) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Calcular estadísticas de dosis
    const dosis = prescripcionDatos.map((d: any) => d.dosis);
    const dosisMinima = Math.min(...dosis);
    const dosisMaxima = Math.max(...dosis);
    const dosisPromedio = dosis.reduce((a: number, b: number) => a + b, 0) / dosis.length;

    // Generar archivo simulado (en producción, aquí se generaría el shapefile real)
    const archivoUrl = `/prescripciones/${loteId}_${Date.now()}.${formatoArchivo.toLowerCase()}`;

    const mapa = await prisma.mapaPrescripcion.create({
      data: {
        loteId,
        nombre,
        tipo,
        cultivo: cultivo || null,
        producto,
        prescripcionDatos: JSON.stringify(prescripcionDatos),
        dosisPromedio: parseFloat(dosisPromedio.toFixed(2)),
        dosisMinima: parseFloat(dosisMinima.toFixed(2)),
        dosisMaxima: parseFloat(dosisMaxima.toFixed(2)),
        unidad,
        formatoArchivo: formatoArchivo || "Shapefile",
        archivoUrl,
        generadoPorIA: generadoPorIA || false,
        criterios: criterios ? JSON.stringify(criterios) : null,
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(mapa, { status: 201 });
  } catch (error) {
    console.error("Error al crear mapa:", error);
    return NextResponse.json(
      { error: "Error al crear mapa de prescripción" },
      { status: 500 }
    );
  }
}