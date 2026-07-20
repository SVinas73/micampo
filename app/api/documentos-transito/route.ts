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
    const estado = searchParams.get("estado");

    const docs = await prisma.documentoTransito.findMany({
      where: { userId: session.user.id, ...(estado ? { estado } : {}) },
      orderBy: { fecha: "desc" },
      take: 300,
    });
    return NextResponse.json(docs);
  } catch (error) {
    console.error("Error al obtener documentos de tránsito:", error);
    return NextResponse.json({ error: "Error al obtener documentos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const b = await request.json();
    const num = (v: unknown) => (v === undefined || v === null || v === "" ? null : parseFloat(String(v)));
    const int = (v: unknown) => (v === undefined || v === null || v === "" ? null : parseInt(String(v)));

    // Nº autogenerado si no viene
    const numero = b.numero || `DTE-${Date.now().toString().slice(-8)}`;

    const doc = await prisma.documentoTransito.create({
      data: {
        numero,
        fecha: b.fecha ? new Date(b.fecha) : new Date(),
        origen: b.origen || null,
        destino: b.destino || null,
        motivo: b.motivo || "Venta",
        categoria: b.categoria || null,
        cabezas: int(b.cabezas),
        pesoTotal: num(b.pesoTotal),
        pesoCarcasa: num(b.pesoCarcasa),
        precioKg: num(b.precioKg),
        importe: num(b.importe),
        transporte: b.transporte || null,
        vencimiento: b.vencimiento ? new Date(b.vencimiento) : null,
        estado: b.estado || "Vigente",
        notas: b.notas || null,
        userId: session.user.id,
      },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Error al crear documento de tránsito:", error);
    return NextResponse.json({ error: "Error al crear documento" }, { status: 500 });
  }
}
