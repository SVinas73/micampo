import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { organismoDestino, funcionarioReceptor, email } = body;

    // Actualizar estado a Enviado
    const reporte = await prisma.reporteAgroquimico.update({
      where: { id: params.id },
      data: {
        estado: "Enviado",
        fechaEnvio: new Date(),
        organismoDestino,
        funcionarioReceptor,
      },
      include: {
        establecimiento: true,
      },
    });

    // En producción, aquí enviarías el email con el reporte adjunto
    // Por ahora solo simulamos el envío

    return NextResponse.json({
      message: "Reporte enviado correctamente",
      reporte,
      enviadoA: email,
    });
  } catch (error) {
    console.error("Error al enviar reporte:", error);
    return NextResponse.json(
      { error: "Error al enviar reporte" },
      { status: 500 }
    );
  }
}