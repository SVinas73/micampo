import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarHashBlockchain } from "@/lib/blockchain";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      etapa,
      descripcion,
      fecha,
      responsable,
      ubicacion,
      datos,
      imagenes,
      documentos,
    } = await request.json();

    if (!etapa || !descripcion || !fecha) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Verificar que el registro existe y pertenece al usuario
    const registro = await prisma.registroTrazabilidad.findUnique({
      where: { id: params.id },
    });

    if (!registro || registro.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    // Generar hash de validación para esta etapa
    const dataEtapa = {
      registroId: params.id,
      etapa,
      descripcion,
      fecha,
      responsable,
      ubicacion,
      datos,
    };

    const hashValidacion = generarHashBlockchain(dataEtapa, registro.hashBlockchain);

    const nuevaEtapa = await prisma.etapaTrazabilidad.create({
      data: {
        registroId: params.id,
        etapa,
        descripcion,
        fecha: new Date(fecha),
        responsable: responsable || null,
        ubicacion: ubicacion || null,
        datos: datos ? JSON.stringify(datos) : null,
        imagenes: imagenes || null,
        documentos: documentos || null,
        hashValidacion,
        userId: session.user.id,
      },
    });

    return NextResponse.json(nuevaEtapa, { status: 201 });
  } catch (error) {
    console.error("Error al crear etapa:", error);
    return NextResponse.json(
      { error: "Error al crear etapa" },
      { status: 500 }
    );
  }
}