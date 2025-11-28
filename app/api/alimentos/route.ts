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

    const alimentos = await prisma.alimento.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(alimentos);
  } catch (error) {
    console.error("Error al obtener alimentos:", error);
    return NextResponse.json(
      { error: "Error al obtener alimentos" },
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

    const { nombre, tipo, proteina, energia, fibraCruda, humedad, costoKg } = await request.json();

    if (!nombre || !tipo || proteina === undefined || energia === undefined || costoKg === undefined) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const alimento = await prisma.alimento.create({
      data: {
        nombre,
        tipo,
        proteina: parseFloat(proteina),
        energia: parseFloat(energia),
        fibraCruda: fibraCruda ? parseFloat(fibraCruda) : null,
        humedad: humedad ? parseFloat(humedad) : null,
        costoKg: parseFloat(costoKg),
        userId: session.user.id,
      },
    });

    return NextResponse.json(alimento, { status: 201 });
  } catch (error) {
    console.error("Error al crear alimento:", error);
    return NextResponse.json(
      { error: "Error al crear alimento" },
      { status: 500 }
    );
  }
}