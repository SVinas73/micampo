import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params; // ← AWAIT PARAMS

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lote = await prisma.lote.findUnique({
      where: { id: params.id },
      include: {
        siembras: {
          orderBy: { fechaSiembra: "desc" }
        },
        cosechas: {
          orderBy: { fechaCosecha: "desc" }
        },
        marcadoresGeo: {
          orderBy: { fecha: "desc" }
        },
        imagenesSatelitales: {
          orderBy: { fecha: "desc" }
        },
        analisisSuelo: {
          orderBy: { fechaAnalisis: "desc" }
        },
        planesSiembra: {
          orderBy: { fechaSiembraRecomendada: "desc" }
        },
        costos: {
          orderBy: { fecha: "desc" }
        },
      },
    });

    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(lote);
  } catch (error) {
    console.error("Error al obtener lote:", error);
    return NextResponse.json(
      { error: "Error al obtener lote" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params; // ← AWAIT PARAMS

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lote = await prisma.lote.findUnique({
      where: { id: params.id },
    });

    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    const {
      nombre,
      hectareas,
      cultivo,
      coordenadas,
      centroLatitud,
      centroLongitud,
      perimetro,
    } = await request.json();

    const updated = await prisma.lote.update({
      where: { id: params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(hectareas !== undefined && { hectareas: parseFloat(hectareas) }),
        ...(cultivo !== undefined && { cultivo }),
        ...(coordenadas !== undefined && {
          coordenadas: coordenadas ? JSON.stringify(coordenadas) : null,
        }),
        ...(centroLatitud !== undefined && {
          centroLatitud: centroLatitud ? parseFloat(centroLatitud) : null,
        }),
        ...(centroLongitud !== undefined && {
          centroLongitud: centroLongitud ? parseFloat(centroLongitud) : null,
        }),
        ...(perimetro !== undefined && {
          perimetro: perimetro ? parseFloat(perimetro) : null,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar lote:", error);
    return NextResponse.json(
      { error: "Error al actualizar lote" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params; // ← AWAIT PARAMS

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lote = await prisma.lote.findUnique({
      where: { id: params.id },
    });

    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    await prisma.lote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Lote eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar lote:", error);
    return NextResponse.json(
      { error: "Error al eliminar lote" },
      { status: 500 }
    );
  }
}