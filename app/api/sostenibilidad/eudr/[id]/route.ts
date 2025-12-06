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

    const declaracion = await prisma.complianceEUDR.findUnique({
      where: { id: params.id },
      include: {
        establecimiento: true,
      },
    });

    if (!declaracion) {
      return NextResponse.json(
        { error: "Declaración no encontrada" },
        { status: 404 }
      );
    }

    // Obtener información de lotes
    const lotes = await prisma.lote.findMany({
      where: {
        id: { in: declaracion.loteIds },
      },
    });

    return NextResponse.json({
      ...declaracion,
      lotes,
    });
  } catch (error) {
    console.error("Error al obtener declaración EUDR:", error);
    return NextResponse.json(
      { error: "Error al obtener declaración EUDR" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const declaracion = await prisma.complianceEUDR.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(declaracion);
  } catch (error) {
    console.error("Error al actualizar declaración EUDR:", error);
    return NextResponse.json(
      { error: "Error al actualizar declaración EUDR" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.complianceEUDR.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Declaración eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar declaración EUDR:", error);
    return NextResponse.json(
      { error: "Error al eliminar declaración EUDR" },
      { status: 500 }
    );
  }
}