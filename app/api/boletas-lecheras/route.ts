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

    const boletas = await prisma.boletaLechera.findMany({
      where: {
        userId: session.user.id,
        ...(tipo ? { tipo } : {}),
      },
      orderBy: { fecha: "desc" },
      take: 200,
    });

    return NextResponse.json(boletas);
  } catch (error) {
    console.error("Error al obtener boletas lecheras:", error);
    return NextResponse.json({ error: "Error al obtener boletas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { fecha, hora, tipo, numero, industria, litros, grasa, proteina, ccs, ufc, temperatura, precioLitro, importe, notas } =
      await request.json();

    const num = (v: unknown) => (v === undefined || v === null || v === "" ? null : parseFloat(String(v)));
    const fechaHora = fecha ? new Date(`${fecha}T${hora || "00:00"}:00`) : new Date();

    const boleta = await prisma.boletaLechera.create({
      data: {
        fecha: fechaHora,
        tipo: tipo === "calidad" ? "calidad" : "retiro",
        numero: numero || null,
        industria: industria || null,
        litros: num(litros),
        grasa: num(grasa),
        proteina: num(proteina),
        ccs: num(ccs),
        ufc: num(ufc),
        temperatura: num(temperatura),
        precioLitro: num(precioLitro),
        importe: num(importe),
        notas: notas || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(boleta, { status: 201 });
  } catch (error) {
    console.error("Error al crear boleta lechera:", error);
    return NextResponse.json({ error: "Error al crear boleta" }, { status: 500 });
  }
}
