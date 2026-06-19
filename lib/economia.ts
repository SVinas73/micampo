import { prisma } from "@/lib/prisma";

/**
 * Capa económica central — "gemelo económico".
 * Calcula la economía por lote a partir de datos reales (CostoLote + MargenBruto +
 * superficie del lote) para que cada recomendación del sistema pueda expresarse en
 * USD/ha y margen/ha. Reutilizada por el endpoint /api/economia/lotes y por el
 * copiloto.
 */

export type EconomiaLote = {
  loteId: string;
  nombre: string;
  hectareas: number;
  cultivo: string | null;
  ingresos: number;
  costos: number;
  margen: number;
  costoPorHa: number;
  margenPorHa: number;
  porcentajeMargen: number;
  fuente: "margen-bruto" | "costos" | "sin-datos";
};

export async function resumenEconomicoLotes(userId: string): Promise<EconomiaLote[]> {
  const [lotes, costos, margenes] = await Promise.all([
    prisma.lote.findMany({ where: { userId } }),
    prisma.costoLote.findMany({ where: { userId } }),
    prisma.margenBruto.findMany({
      where: { userId, tipo: "Lote" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Costos acumulados por lote
  const costosPorLote = new Map<string, number>();
  costos.forEach((c) => {
    const monto = c.costoTotal || c.monto || 0;
    costosPorLote.set(c.loteId, (costosPorLote.get(c.loteId) || 0) + monto);
  });

  // Último margen bruto por lote (referenciaId)
  const margenPorLote = new Map<string, (typeof margenes)[number]>();
  margenes.forEach((m) => {
    if (!margenPorLote.has(m.referenciaId)) margenPorLote.set(m.referenciaId, m);
  });

  return lotes.map((l) => {
    const ha = l.hectareas || 0;
    const mb = margenPorLote.get(l.id);
    const costosAcum = costosPorLote.get(l.id) || 0;

    let ingresos = 0;
    let costosLote = costosAcum;
    let fuente: EconomiaLote["fuente"] = costosAcum > 0 ? "costos" : "sin-datos";

    if (mb) {
      ingresos = mb.ingresos || 0;
      costosLote = mb.costos || costosAcum;
      fuente = "margen-bruto";
    }

    const margen = ingresos - costosLote;
    return {
      loteId: l.id,
      nombre: l.nombre,
      hectareas: ha,
      cultivo: l.cultivo,
      ingresos,
      costos: costosLote,
      margen,
      costoPorHa: ha > 0 ? costosLote / ha : 0,
      margenPorHa: ha > 0 ? margen / ha : 0,
      porcentajeMargen: ingresos > 0 ? (margen / ingresos) * 100 : 0,
      fuente,
    };
  });
}
