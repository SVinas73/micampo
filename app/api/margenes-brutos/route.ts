import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const periodo = searchParams.get("periodo");

    const where: any = { userId: session.user.id };
    if (tipo) where.tipo = tipo;
    if (periodo) where.periodo = periodo;

    const margenes = await prisma.margenBruto.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Parsear detalles JSON
    const margenesConDetalles = margenes.map((m) => ({
      ...m,
      detalles: JSON.parse(m.detalles || "{}"),
    }));

    return NextResponse.json(margenesConDetalles);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener márgenes" }, { status: 500 });
  }
}