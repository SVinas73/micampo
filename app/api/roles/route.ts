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

    const roles = await prisma.rol.findMany({
      where: { userId: session.user.id },
      include: {
        usuariosRol: true,
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener roles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const rol = await prisma.rol.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        permisos: JSON.stringify(data.permisos),
        userId: session.user.id,
      },
    });

    return NextResponse.json(rol, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear rol" }, { status: 500 });
  }
}