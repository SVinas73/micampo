import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 15;

/** Historial de análisis de Visión IA del usuario. Tolerante a migración pendiente. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const rows = await prisma.analisisVision.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    const items = rows.map((r) => ({
      id: r.id,
      modo: r.modo,
      titulo: r.titulo,
      resultado: r.resultado,
      confianza: r.confianza,
      detalle: r.detalle || "",
      metricas: safeJson<{ label: string; valor: string }[]>(r.metricas, []),
      recomendaciones: safeJson<string[]>(r.recomendaciones, []),
      fuente: r.fuente,
      imagenesCount: r.imagenesCount,
      thumb: r.thumb,
      loteId: r.loteId,
      loteNombre: r.loteNombre,
      establecimientoNombre: r.establecimientoNombre,
      alertaPlagaId: r.alertaPlagaId,
      createdAt: r.createdAt,
    }));
    return NextResponse.json(items);
  } catch (error) {
    // Si la tabla aún no existe (migración pendiente), el historial es vacío sin romper la UI.
    console.error("Historial de visión no disponible:", error);
    return NextResponse.json([]);
  }
}

function safeJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
