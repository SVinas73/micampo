import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Perfil del usuario actual. GET devuelve nombre/email/foto; PATCH actualiza
 * nombre y/o foto (la foto se guarda como data URL ya redimensionada en el cliente).
 * No toca credenciales ni nada sensible.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, image: true } });
  return NextResponse.json(u || {});
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const data: { name?: string; image?: string | null } = {};
    if (typeof body.name === "string") data.name = body.name.trim().slice(0, 80);
    if (body.image === null) data.image = null;
    else if (typeof body.image === "string") {
      // Foto como data URL. Límite defensivo (~1.5 MB) para no inflar la base.
      if (body.image.length > 1_600_000) return NextResponse.json({ error: "La imagen es muy grande" }, { status: 400 });
      data.image = body.image;
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
    const u = await prisma.user.update({ where: { id: session.user.id }, data, select: { id: true, name: true, email: true, image: true } });
    return NextResponse.json(u);
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return NextResponse.json({ error: "No se pudo actualizar el perfil" }, { status: 500 });
  }
}
