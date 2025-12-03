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

    const tanques = await prisma.tanqueCombustible.findMany({
      where: { userId: session.user.id },
      include: {
        cargas: {
          orderBy: { fecha: "desc" },
          take: 10,
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(tanques);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener tanques" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const porcentaje = (data.nivelActual / data.capacidadTotal) * 100;
    const alertaNivelBajo = data.nivelActual <= data.nivelMinimo;

    const tanque = await prisma.tanqueCombustible.create({
      data: {
        ...data,
        porcentaje,
        alertaNivelBajo,
        userId: session.user.id,
      },
    });

    return NextResponse.json(tanque, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear tanque" }, { status: 500 });
  }
}