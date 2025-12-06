import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const receta = await prisma.recetaAgronomica.findUnique({
      where: { id: params.id },
      include: {
        productos: true,
        lote: true,
        establecimiento: true,
      },
    });

    if (!receta) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    // En producción, aquí generarías un PDF real con una librería como PDFKit o Puppeteer
    // Por ahora retornamos los datos para generar el PDF en el frontend

    const pdfData = {
      receta,
      generadoEn: new Date().toISOString(),
      mensaje: "PDF generado - En producción usar librería de PDFs",
    };

    return NextResponse.json(pdfData);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    return NextResponse.json(
      { error: "Error al generar PDF" },
      { status: 500 }
    );
  }
}