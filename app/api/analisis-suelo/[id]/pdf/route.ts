import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Descarga el PDF de laboratorio subido con el análisis de suelo. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await context.params;

    const analisis = await prisma.analisisSuelo.findUnique({
      where: { id },
      select: { userId: true, pdf: true, fechaAnalisis: true, lote: { select: { nombre: true } } },
    });
    if (!analisis || analisis.userId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    if (!analisis.pdf) return NextResponse.json({ error: "Este análisis no tiene PDF adjunto" }, { status: 404 });

    const base64 = analisis.pdf.replace(/^data:application\/pdf;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const nombre = `analisis-suelo-${(analisis.lote?.nombre || "lote").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${analisis.fechaAnalisis.toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombre}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Error al descargar PDF de análisis:", error);
    return NextResponse.json({ error: "Error al descargar el PDF" }, { status: 500 });
  }
}
