import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { construirDecisiones } from "@/lib/decisiones";

export const maxDuration = 30;

/**
 * GET /api/decisiones — Feed de decisiones del día.
 * Junta CLIMA + SATÉLITE (NDVI) + SANIDAD + RIEGO + ECONOMÍA + SINERGIAS en una
 * sola lista de acciones priorizadas. Datos reales; cada item enlaza al módulo
 * para actuar. La lógica vive en lib/decisiones (reutilizada por las alertas).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ decisiones: [] });
    return NextResponse.json(await construirDecisiones(session.user.id));
  } catch (error) {
    console.error("Error en decisiones:", error);
    return NextResponse.json({ decisiones: [] }, { status: 200 });
  }
}
