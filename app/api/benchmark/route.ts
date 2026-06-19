import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

/**
 * Benchmarking anónimo — compara las métricas del usuario contra una cohorte
 * anonimizada del resto de los establecimientos. Solo usa agregados por usuario
 * (nunca datos individuales identificables). Requiere un mínimo de productores
 * con datos para activarse; si no, lo informa honestamente.
 */

const MIN_COHORTE = 3;

function percentil(valores: number[], v: number): number {
  if (valores.length === 0) return 0;
  const menores = valores.filter((x) => x < v).length;
  return Math.round((menores / valores.length) * 100);
}
function mediana(valores: number[]): number {
  if (!valores.length) return 0;
  const s = [...valores].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const userId = session.user.id;

    // Agregados por usuario (privacy-safe)
    const [haPorUser, costoPorUser, margenPorUser] = await Promise.all([
      prisma.lote.groupBy({ by: ["userId"], _sum: { hectareas: true } }),
      prisma.costoLote.groupBy({ by: ["userId"], _sum: { costoTotal: true, monto: true } }),
      prisma.margenBruto.groupBy({ by: ["userId"], where: { tipo: "Lote" }, _sum: { margen: true } }),
    ]);

    const haMap = new Map(haPorUser.map((r) => [r.userId, r._sum.hectareas || 0]));
    const costoMap = new Map(costoPorUser.map((r) => [r.userId, r._sum.costoTotal || r._sum.monto || 0]));
    const margenMap = new Map(margenPorUser.map((r) => [r.userId, r._sum.margen || 0]));

    // Construir métricas por usuario (solo quienes tienen hectáreas)
    const margenHaCohorte: number[] = [];
    const costoHaCohorte: number[] = [];
    for (const [uid, ha] of haMap.entries()) {
      if (!ha || ha <= 0) continue;
      const margen = margenMap.get(uid) || 0;
      const costo = costoMap.get(uid) || 0;
      if (margen !== 0) margenHaCohorte.push(margen / ha);
      if (costo > 0) costoHaCohorte.push(costo / ha);
    }

    const miHa = haMap.get(userId) || 0;
    const miMargenHa = miHa > 0 ? (margenMap.get(userId) || 0) / miHa : null;
    const miCostoHa = miHa > 0 ? (costoMap.get(userId) || 0) / miHa : null;

    const cohorteN = Math.max(margenHaCohorte.length, costoHaCohorte.length);
    const disponible = cohorteN >= MIN_COHORTE;

    const metricas: any[] = [];
    if (miMargenHa != null && margenHaCohorte.length) {
      metricas.push({
        clave: "margenPorHa",
        label: "Margen por hectárea",
        unidad: "USD/ha",
        mejorEsMayor: true,
        valor: Math.round(miMargenHa),
        mediana: Math.round(mediana(margenHaCohorte)),
        percentil: percentil(margenHaCohorte, miMargenHa),
      });
    }
    if (miCostoHa != null && costoHaCohorte.length) {
      const pctMenor = percentil(costoHaCohorte, miCostoHa);
      metricas.push({
        clave: "costoPorHa",
        label: "Costo por hectárea",
        unidad: "USD/ha",
        mejorEsMayor: false,
        valor: Math.round(miCostoHa),
        mediana: Math.round(mediana(costoHaCohorte)),
        percentil: 100 - pctMenor, // menos costo = mejor posición
      });
    }

    return NextResponse.json({
      disponible,
      cohorteN,
      minCohorte: MIN_COHORTE,
      metricas,
      mensaje: disponible
        ? `Comparación contra ${cohorteN} establecimientos (anónimo).`
        : `El benchmarking se activa cuando hay al menos ${MIN_COHORTE} establecimientos con datos. Por ahora, estas son tus métricas.`,
    });
  } catch (error) {
    console.error("Error en benchmark:", error);
    return NextResponse.json({ error: "Error al calcular benchmark" }, { status: 500 });
  }
}
