import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    const where: any = { userId: session.user.id };
    if (estado) where.estado = estado;

    const contratistas = await prisma.contratista.findMany({
      where,
      include: {
        trabajos: {
          where: { estado: { not: "Completado" } },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(contratistas);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener contratistas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Generar código de acceso único
    const codigoAcceso = randomBytes(8).toString("hex").toUpperCase();

    const contratista = await prisma.contratista.create({
      data: {
        nombre: data.nombre,
        empresa: data.empresa,
        rut: data.rut,
        email: data.email,
        telefono: data.telefono,
        especialidad: data.especialidad,
        codigoAcceso,
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    // TODO: Enviar email con código de acceso

    return NextResponse.json(contratista, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear contratista" }, { status: 500 });
  }
}