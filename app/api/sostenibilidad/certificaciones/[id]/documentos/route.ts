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

    const documentos = await prisma.documentoCertificacion.findMany({
      where: { certificacionId: params.id },
      orderBy: { createdAt: "desc" },
    });

    // Agrupar por categoría
    const porCategoria = documentos.reduce((acc: any, doc) => {
      if (!acc[doc.categoria]) {
        acc[doc.categoria] = [];
      }
      acc[doc.categoria].push(doc);
      return acc;
    }, {});

    return NextResponse.json({
      documentos,
      porCategoria,
      total: documentos.length,
    });
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    return NextResponse.json(
      { error: "Error al obtener documentos" },
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

    const body = await req.json();
    const {
      titulo,
      categoria,
      descripcion,
      archivoUrl,
      tipoArchivo,
      tamanioBytes,
      nombreArchivo,
      requisitoRelacionado,
      puntoControl,
    } = body;

    if (!titulo || !categoria || !archivoUrl || !tipoArchivo || !nombreArchivo) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const documento = await prisma.documentoCertificacion.create({
      data: {
        certificacionId: params.id,
        titulo,
        categoria,
        descripcion: descripcion || null,
        archivoUrl,
        tipoArchivo,
        tamanioBytes: tamanioBytes || 0,
        nombreArchivo,
        requisitoRelacionado: requisitoRelacionado || null,
        puntoControl: puntoControl || [],
        aprobadoPor: session.user.email || null,
        fechaAprobacion: new Date(),
      },
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error) {
    console.error("Error al crear documento:", error);
    return NextResponse.json(
      { error: "Error al crear documento" },
      { status: 500 }
    );
  }
}