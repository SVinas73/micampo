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
    const cultivo = searchParams.get("cultivo");

    const where: any = { userId: session.user.id };
    if (cultivo) where.cultivo = cultivo;

    const calidades = await prisma.calidadGrano.findMany({
      where,
      orderBy: { fechaAnalisis: "desc" },
      take: 50,
    });

    return NextResponse.json(calidades);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener calidades" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const calidad = await prisma.calidadGrano.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });

    return NextResponse.json(calidad, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear calidad" }, { status: 500 });
  }
}