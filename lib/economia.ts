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
  // Costo REAL de maquinaria atribuido al lote (combustible + taller), prorrateado
  // por las hectáreas que cada máquina trabajó en este lote vía las labores.
  costoMaquinaria: number;
  costoCombustible: number;
  costoTaller: number;
  costoMaquinariaPorHa: number;
};

/**
 * Atribuye el costo operativo de maquinaria (combustible + taller) a cada lote.
 * Para cada máquina calcula su costo total (cargas de combustible + órdenes de
 * taller) y lo reparte entre las hectáreas que trabajó (suma de superficie de sus
 * labores). Luego suma a cada lote la parte proporcional según las hectáreas que
 * esa máquina trabajó en él. Devuelve un mapa loteId → desglose.
 */
export async function costosMaquinariaPorLote(
  userId: string
): Promise<Map<string, { combustible: number; taller: number; total: number }>> {
  const [labores, cargas, ordenes] = await Promise.all([
    prisma.labor.findMany({
      where: { userId, maquinariaId: { not: null } },
      select: { loteId: true, maquinariaId: true, superficieTrabajada: true },
    }),
    prisma.cargaCombustible.findMany({
      where: { userId, maquinariaId: { not: null } },
      select: { maquinariaId: true, costoTotal: true, litros: true, precioLitro: true },
    }),
    prisma.ordenTaller.findMany({
      where: { maquinaria: { establecimiento: { userId } } },
      select: { maquinariaId: true, costoTotal: true },
    }),
  ]);

  // Costo total de combustible y taller por máquina.
  const combPorMaq = new Map<string, number>();
  cargas.forEach((c) => {
    if (!c.maquinariaId) return;
    const costo = c.costoTotal ?? (c.precioLitro ? c.litros * c.precioLitro : 0);
    combPorMaq.set(c.maquinariaId, (combPorMaq.get(c.maquinariaId) || 0) + (costo || 0));
  });
  const tallerPorMaq = new Map<string, number>();
  ordenes.forEach((o) => {
    tallerPorMaq.set(o.maquinariaId, (tallerPorMaq.get(o.maquinariaId) || 0) + (o.costoTotal || 0));
  });

  // Hectáreas totales trabajadas por cada máquina (denominador del prorrateo).
  const haPorMaq = new Map<string, number>();
  labores.forEach((l) => {
    if (!l.maquinariaId) return;
    haPorMaq.set(l.maquinariaId, (haPorMaq.get(l.maquinariaId) || 0) + (l.superficieTrabajada || 0));
  });

  // Reparte el costo de cada máquina a los lotes por las hectáreas trabajadas.
  const out = new Map<string, { combustible: number; taller: number; total: number }>();
  labores.forEach((l) => {
    if (!l.maquinariaId) return;
    const haMaq = haPorMaq.get(l.maquinariaId) || 0;
    if (haMaq <= 0) return;
    const frac = (l.superficieTrabajada || 0) / haMaq;
    const comb = (combPorMaq.get(l.maquinariaId) || 0) * frac;
    const taller = (tallerPorMaq.get(l.maquinariaId) || 0) * frac;
    const prev = out.get(l.loteId) || { combustible: 0, taller: 0, total: 0 };
    prev.combustible += comb;
    prev.taller += taller;
    prev.total += comb + taller;
    out.set(l.loteId, prev);
  });
  return out;
}

export async function resumenEconomicoLotes(userId: string): Promise<EconomiaLote[]> {
  const [lotes, costos, margenes, maqPorLote] = await Promise.all([
    prisma.lote.findMany({ where: { userId } }),
    prisma.costoLote.findMany({ where: { userId } }),
    prisma.margenBruto.findMany({
      where: { userId, tipo: "Lote" },
      orderBy: { createdAt: "desc" },
    }),
    costosMaquinariaPorLote(userId),
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
    const maq = maqPorLote.get(l.id) || { combustible: 0, taller: 0, total: 0 };

    let ingresos = 0;
    let costosBase = costosAcum;
    let fuente: EconomiaLote["fuente"] = costosAcum > 0 ? "costos" : "sin-datos";

    if (mb) {
      ingresos = mb.ingresos || 0;
      costosBase = mb.costos || costosAcum;
      fuente = "margen-bruto";
    }

    // El costo de maquinaria (combustible + taller) se SUMA al costo base para
    // reflejar el costo real por hectárea. Si el lote no tenía datos pero sí tiene
    // costo de maquinaria atribuido, ya deja de estar "sin-datos".
    const costoMaquinaria = maq.total;
    if (fuente === "sin-datos" && costoMaquinaria > 0) fuente = "costos";
    const costosLote = costosBase + costoMaquinaria;

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
      costoMaquinaria,
      costoCombustible: maq.combustible,
      costoTaller: maq.taller,
      costoMaquinariaPorHa: ha > 0 ? costoMaquinaria / ha : 0,
    };
  });
}
