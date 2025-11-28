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

    const historiales = await prisma.historialReproductivo.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
            raza: true,
            fechaNacimiento: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(historiales);
  } catch (error) {
    console.error("Error al obtener historiales:", error);
    return NextResponse.json(
      { error: "Error al obtener historiales" },
      { status: 500 }
    );
  }
}