import { prisma } from "@/lib/prisma";

/**
 * Caché de salidas de IA (tabla Insight).
 * - Reduce costo: evita re-llamar al modelo para la misma clave dentro de una ventana.
 * - Trazabilidad: deja registro de qué recomendó el modelo y con qué versión.
 * Degrada con elegancia: si la tabla todavía no existe (migración pendiente) o falla,
 * los helpers no rompen — simplemente actúan como "sin caché".
 */

export async function getInsight<T = unknown>(
  userId: string,
  clave: string,
  maxAgeMin: number
): Promise<T | null> {
  try {
    const desde = new Date(Date.now() - maxAgeMin * 60_000);
    const row = await prisma.insight.findFirst({
      where: { userId, clave, createdAt: { gte: desde } },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;
    return JSON.parse(row.contenido) as T;
  } catch {
    return null;
  }
}

export async function saveInsight(
  userId: string,
  clave: string,
  tipo: string,
  contenido: unknown,
  modelo?: string
): Promise<void> {
  try {
    await prisma.insight.create({
      data: { userId, clave, tipo, contenido: JSON.stringify(contenido), modelo: modelo || null },
    });
  } catch {
    // Sin caché disponible (migración pendiente u otro error): no es crítico.
  }
}
