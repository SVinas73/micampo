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

    const precios = await prisma.precioReferencia.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        fecha: "desc",
      },
      take: 50,
    });

    return NextResponse.json(precios);
  } catch (error) {
    console.error("Error al obtener precios:", error);
    return NextResponse.json(
      { error: "Error al obtener precios" },
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

    const { producto, precio, fecha, fuente } = await request.json();

    if (!producto || !precio || !fecha) {
      return NextResponse.json(
        { error: "Producto, precio y fecha son requeridos" },
        { status: 400 }
      );
    }

    const precioReferencia = await prisma.precioReferencia.create({
      data: {
        producto,
        precio: parseFloat(precio),
        fecha: new Date(fecha),
        fuente: fuente || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(precioReferencia, { status: 201 });
  } catch (error) {
    console.error("Error al crear precio:", error);
    return NextResponse.json(
      { error: "Error al crear precio" },
      { status: 500 }
    );
  }
}