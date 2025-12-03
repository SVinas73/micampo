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

    const zonas = await prisma.zonaManejo.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(zonas);
  } catch (error) {
    console.error("Error al obtener zonas:", error);
    return NextResponse.json(
      { error: "Error al obtener zonas" },
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
      coordenadas,
      area,
      potencialProductivo,
      tipoSuelo,
      profundidad,
      pendiente,
      indiceVerde,
      capacidadAgua,
      phSuelo,
      materiaOrganica,
      dosisVariable,
      restricciones,
      rendimientoPromedio,
      observaciones,
      color,
    } = await request.json();

    if (!loteId || !nombre || !coordenadas || !area || !potencialProductivo) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const zona = await prisma.zonaManejo.create({
      data: {
        loteId,
        nombre,
        coordenadas: JSON.stringify(coordenadas),
        area: parseFloat(area),
        potencialProductivo,
        tipoSuelo: tipoSuelo || null,
        profundidad: profundidad ? parseFloat(profundidad) : null,
        pendiente: pendiente || null,
        indiceVerde: indiceVerde ? parseFloat(indiceVerde) : null,
        capacidadAgua: capacidadAgua ? parseFloat(capacidadAgua) : null,
        phSuelo: phSuelo ? parseFloat(phSuelo) : null,
        materiaOrganica: materiaOrganica ? parseFloat(materiaOrganica) : null,
        dosisVariable: dosisVariable ? JSON.stringify(dosisVariable) : null,
        restricciones: restricciones ? JSON.stringify(restricciones) : null,
        rendimientoPromedio: rendimientoPromedio ? parseFloat(rendimientoPromedio) : null,
        observaciones: observaciones || null,
        color: color || "#3b82f6",
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

    return NextResponse.json(zona, { status: 201 });
  } catch (error) {
    console.error("Error al crear zona:", error);
    return NextResponse.json(
      { error: "Error al crear zona de manejo" },
      { status: 500 }
    );
  }
}