import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get("codigo");

    if (!codigo) {
      return NextResponse.json(
        { error: "El parámetro codigo es requerido" },
        { status: 400 }
      );
    }

    const registro = await prisma.registroTrazabilidad.findUnique({
      where: { codigoQR: codigo },
      include: {
        etapas: {
          orderBy: {
            fecha: "asc",
          },
        },
      },
    });

    if (!registro) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Respuesta pública (sin datos sensibles del usuario)
    return NextResponse.json({
      codigoQR: registro.codigoQR,
      tipoProducto: registro.tipoProducto,
      nombreProducto: registro.nombreProducto,
      loteProduccion: registro.loteProduccion,
      campo: registro.campo,
      ubicacion: registro.ubicacion,
      certificaciones: registro.certificaciones ? JSON.parse(registro.certificaciones) : null,
      hashBlockchain: registro.hashBlockchain,
      timestamp: registro.timestamp,
      etapas: registro.etapas.map(e => ({
        etapa: e.etapa,
        descripcion: e.descripcion,
        fecha: e.fecha,
        responsable: e.responsable,
        ubicacion: e.ubicacion,
        datos: e.datos ? JSON.parse(e.datos) : null,
        hashValidacion: e.hashValidacion,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error al verificar producto" },
      { status: 500 }
    );
  }
}