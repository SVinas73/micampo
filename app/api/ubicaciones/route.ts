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

    const ubicaciones = await prisma.ubicacion.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { esPrincipal: "desc" },
        { nombre: "asc" },
      ],
    });

    return NextResponse.json(ubicaciones);
  } catch (error) {
    console.error("Error al obtener ubicaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener ubicaciones" },
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

    const { nombre, ciudad, provincia, pais, latitud, longitud, esPrincipal } = await request.json();

    if (!nombre || !latitud || !longitud) {
      return NextResponse.json(
        { error: "Nombre, latitud y longitud son requeridos" },
        { status: 400 }
      );
    }

    // Si se marca como principal, desmarcar las demás
    if (esPrincipal) {
      await prisma.ubicacion.updateMany({
        where: {
          userId: session.user.id,
          esPrincipal: true,
        },
        data: {
          esPrincipal: false,
        },
      });
    }

    const ubicacion = await prisma.ubicacion.create({
      data: {
        nombre,
        ciudad: ciudad || null,
        provincia: provincia || null,
        pais: pais || "Uruguay",
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        esPrincipal: esPrincipal || false,
        userId: session.user.id,
      },
    });

    return NextResponse.json(ubicacion, { status: 201 });
  } catch (error) {
    console.error("Error al crear ubicación:", error);
    return NextResponse.json(
      { error: "Error al crear ubicación" },
      { status: 500 }
    );
  }
}