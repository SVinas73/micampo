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

    const certificacion = await prisma.certificacionSostenibilidad.findUnique({
      where: { id: params.id },
      include: { establecimiento: { select: { userId: true } } },
    });
    if (!certificacion || certificacion.establecimiento?.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No encontrada" },
        { status: 404 }
      );
    }

    const items = await prisma.checklistCertificacion.findMany({
      where: { certificacionId: params.id },
      orderBy: { codigo: "asc" },
    });

    // Agrupar por categoría
    const porCategoria = items.reduce((acc: any, item) => {
      if (!acc[item.categoria]) {
        acc[item.categoria] = [];
      }
      acc[item.categoria].push(item);
      return acc;
    }, {});

    return NextResponse.json({
      items,
      porCategoria,
      total: items.length,
      cumplidos: items.filter((i) => i.cumple).length,
    });
  } catch (error) {
    console.error("Error al obtener checklist:", error);
    return NextResponse.json(
      { error: "Error al obtener checklist" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const certificacion = await prisma.certificacionSostenibilidad.findUnique({
      where: { id: params.id },
      include: { establecimiento: { select: { userId: true } } },
    });
    if (!certificacion || certificacion.establecimiento?.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No encontrada" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      codigo,
      categoria,
      subcategoria,
      descripcion,
      nivelRequerido,
      cumple,
      evidencia,
      criticidad,
    } = body;

    if (!codigo || !categoria || !descripcion || !nivelRequerido || !criticidad) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const item = await prisma.checklistCertificacion.create({
      data: {
        certificacionId: params.id,
        codigo,
        categoria,
        subcategoria: subcategoria || null,
        descripcion,
        nivelRequerido,
        cumple: cumple || false,
        evidencia: evidencia || null,
        criticidad,
        esNoConformidad: !cumple && (criticidad === "Mayor" || criticidad === "Menor"),
        tipoNoConformidad: !cumple ? criticidad : null,
      },
    });

    // Actualizar contadores de no conformidades en la certificación
    if (item.esNoConformidad) {
      const campo =
        item.tipoNoConformidad === "Mayor"
          ? "noConformidadesMayores"
          : "noConformidadesMenures";

      await prisma.certificacionSostenibilidad.update({
        where: { id: params.id },
        data: {
          [campo]: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error al crear item checklist:", error);
    return NextResponse.json(
      { error: "Error al crear item checklist" },
      { status: 500 }
    );
  }
}