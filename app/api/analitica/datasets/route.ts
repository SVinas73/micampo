import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resumenEconomicoLotes } from "@/lib/economia";

export const maxDuration = 30;

/**
 * Datasets analíticos listos para graficar en 3D. Calcula varias series a partir
 * de datos reales del usuario. Cada serie es { label, value } + metadatos para
 * que la gráfica 3D y el análisis con IA las consuman directamente.
 */

const PALETA = ["#5e7733", "#768f44", "#8aa353", "#d9a538", "#c08a22", "#2c6bb8", "#64748b", "#c93434"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const userId = session.user.id;

    const [eco, costos, lotes, leche] = await Promise.all([
      resumenEconomicoLotes(userId),
      prisma.costoLote.findMany({ where: { userId } }),
      prisma.lote.findMany({ where: { userId } }),
      prisma.produccionLechera.findMany({ where: { userId }, orderBy: { fecha: "desc" }, take: 14 }),
    ]);

    // Margen por hectárea por lote
    const margenPorLote = eco
      .filter((l) => l.fuente !== "sin-datos")
      .map((l, i) => ({ label: l.nombre, value: Math.round(l.margenPorHa), color: l.margenPorHa < 0 ? "#c93434" : PALETA[i % PALETA.length] }));

    // Costos por categoría (concepto)
    const porConcepto: Record<string, number> = {};
    costos.forEach((c) => {
      const k = c.concepto || "Otros";
      porConcepto[k] = (porConcepto[k] || 0) + (c.costoTotal || c.monto || 0);
    });
    const costosPorCategoria = Object.entries(porConcepto).map(([label, value], i) => ({ label, value: Math.round(value), color: PALETA[i % PALETA.length] }));

    // Hectáreas por cultivo
    const porCultivo: Record<string, number> = {};
    lotes.forEach((l) => {
      const k = l.cultivo || "Sin cultivo";
      porCultivo[k] = (porCultivo[k] || 0) + (l.hectareas || 0);
    });
    const haPorCultivo = Object.entries(porCultivo).map(([label, value], i) => ({ label, value: Math.round(value), color: PALETA[i % PALETA.length] }));

    // Producción lechera (litros/día, cronológico)
    const produccionLechera = [...leche]
      .reverse()
      .map((r, i) => ({
        label: new Date(r.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
        value: Math.round(r.litrosTotales || 0),
        color: PALETA[i % PALETA.length],
      }));

    const datasets = [
      { id: "margenPorLote", titulo: "Margen por hectárea, por lote", unidad: "USD/ha", datos: margenPorLote },
      { id: "costosPorCategoria", titulo: "Costos por categoría", unidad: "USD", datos: costosPorCategoria },
      { id: "haPorCultivo", titulo: "Superficie por cultivo", unidad: "ha", datos: haPorCultivo },
      { id: "produccionLechera", titulo: "Producción lechera (últimos registros)", unidad: "L/día", datos: produccionLechera },
    ].filter((d) => d.datos.length > 0);

    return NextResponse.json({ datasets });
  } catch (error) {
    console.error("Error en datasets analíticos:", error);
    return NextResponse.json({ error: "Error al armar los datasets" }, { status: 500 });
  }
}
