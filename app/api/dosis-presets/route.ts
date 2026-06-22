import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Preestablecidos de mezcla creados por el usuario.
 * Se guardan en la tabla Insight (tipo "dosis-preset") para no requerir una
 * migración nueva: contenido = JSON { nombre, config } de la mezcla.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const rows = await prisma.insight.findMany({
      where: { userId: session.user.id, tipo: "dosis-preset" },
      orderBy: { createdAt: "desc" },
    });
    const presets = rows
      .map((r) => {
        try {
          const data = JSON.parse(r.contenido);
          return { id: r.id, nombre: data.nombre, config: data.config };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return NextResponse.json(presets);
  } catch (error) {
    console.error("Error al listar preestablecidos:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { nombre, config } = await request.json();
    if (!nombre?.trim() || !config) {
      return NextResponse.json({ error: "Nombre y configuración requeridos" }, { status: 400 });
    }

    const row = await prisma.insight.create({
      data: {
        userId: session.user.id,
        clave: `dosis-preset:${nombre.trim()}`,
        tipo: "dosis-preset",
        contenido: JSON.stringify({ nombre: nombre.trim(), config }),
        modelo: null,
      },
    });
    return NextResponse.json({ id: row.id, nombre: nombre.trim(), config }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar preestablecido:", error);
    return NextResponse.json({ error: "Error al guardar preestablecido" }, { status: 500 });
  }
}
