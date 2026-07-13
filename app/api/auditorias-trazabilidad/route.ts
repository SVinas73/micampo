import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const auditorias = await prisma.auditoriaTrazabilidad.findMany({
      where: { userId: session.user.id },
      orderBy: { fecha: "desc" },
      take: 200,
    });
    return NextResponse.json(auditorias);
  } catch (error) {
    console.error("Error al obtener auditorías:", error);
    return NextResponse.json({ error: "Error al obtener auditorías" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const b = await request.json();
    const auditoria = await prisma.auditoriaTrazabilidad.create({
      data: {
        fecha: b.fecha ? new Date(b.fecha) : new Date(),
        tipo: b.tipo || "Interna",
        organismo: b.organismo || null,
        alcance: b.alcance || null,
        resultado: b.resultado || null,
        observaciones: b.observaciones || null,
        proximaFecha: b.proximaFecha ? new Date(b.proximaFecha) : null,
        userId: session.user.id,
      },
    });
    return NextResponse.json(auditoria, { status: 201 });
  } catch (error) {
    console.error("Error al crear auditoría:", error);
    return NextResponse.json({ error: "Error al crear auditoría" }, { status: 500 });
  }
}
