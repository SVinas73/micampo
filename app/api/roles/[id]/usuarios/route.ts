import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const usuarioRol = await prisma.usuarioRol.create({
      data: {
        usuarioEmail: data.usuarioEmail,
        rolId: params.id,
        estado: data.estado || "Invitado",
        restricciones: data.restricciones ? JSON.stringify(data.restricciones) : null,
        userId: session.user.id,
      },
    });

    // TODO: Enviar email de invitación

    return NextResponse.json(usuarioRol, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al asignar rol" }, { status: 500 });
  }
}