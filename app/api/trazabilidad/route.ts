import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarHashBlockchain, generarCodigoQR } from "@/lib/blockchain";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipoProducto = searchParams.get("tipoProducto");

    const where: any = {
      userId: session.user.id,
    };

    if (tipoProducto) {
      where.tipoProducto = tipoProducto;
    }

    const registros = await prisma.registroTrazabilidad.findMany({
      where,
      include: {
        etapas: {
          orderBy: {
            fecha: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(registros);
  } catch (error) {
    console.error("Error al obtener registros:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
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
      tipoProducto,
      nombreProducto,
      loteProduccion,
      campo,
      ubicacion,
      certificaciones,
    } = await request.json();

    if (!tipoProducto || !nombreProducto) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Obtener último hash de la cadena del usuario
    const ultimoRegistro = await prisma.registroTrazabilidad.findFirst({
      where: { userId: session.user.id },
      orderBy: { timestamp: "desc" },
    });

    const codigoQR = generarCodigoQR();
    
    const dataBlockchain = {
      codigoQR,
      tipoProducto,
      nombreProducto,
      loteProduccion,
      campo,
      ubicacion,
      userId: session.user.id,
    };

    const hashAnterior = ultimoRegistro?.hashBlockchain || null;
    const hashBlockchain = generarHashBlockchain(dataBlockchain, hashAnterior);

    const registro = await prisma.registroTrazabilidad.create({
      data: {
        codigoQR,
        tipoProducto,
        nombreProducto,
        loteProduccion: loteProduccion || null,
        campo: campo || null,
        ubicacion: ubicacion || null,
        certificaciones: certificaciones ? JSON.stringify(certificaciones) : null,
        hashBlockchain,
        hashAnterior,
        userId: session.user.id,
      },
      include: {
        etapas: true,
      },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error al crear registro:", error);
    return NextResponse.json(
      { error: "Error al crear registro de trazabilidad" },
      { status: 500 }
    );
  }
}