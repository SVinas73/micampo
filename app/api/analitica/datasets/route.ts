import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resumenEconomicoLotes } from "@/lib/economia";

export const maxDuration = 30;

/**
 * Datasets analíticos listos para graficar en 3D y para correlacionar con IA.
 * Cada serie es { label, value } + metadatos (unidad, dimension, temporal).
 * - dimension: clave de cruce para correlaciones ("lote", "cultivo", "campaña"…).
 * - temporal: true para series de evolución en el tiempo (por campaña/fecha).
 */

const PALETA = ["#5e7733", "#768f44", "#8aa353", "#d9a538", "#c08a22", "#2c6bb8", "#64748b", "#c93434"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const userId = session.user.id;

    const [eco, costos, lotes, leche, cosechas, ndviRows] = await Promise.all([
      resumenEconomicoLotes(userId),
      prisma.costoLote.findMany({ where: { userId } }),
      prisma.lote.findMany({ where: { userId } }),
      prisma.produccionLechera.findMany({ where: { userId }, orderBy: { fecha: "desc" }, take: 14 }),
      prisma.cosecha.findMany({ where: { userId }, include: { lote: { select: { nombre: true } } } }),
      prisma.insight.findMany({ where: { userId, tipo: "ndvi" }, orderBy: { createdAt: "desc" } }),
    ]);

    const nombreLote = new Map(lotes.map((l) => [l.id, l.nombre]));

    // ---- Por lote ----
    const margenPorLote = eco
      .filter((l) => l.fuente !== "sin-datos")
      .map((l, i) => ({ label: l.nombre, value: Math.round(l.margenPorHa), color: l.margenPorHa < 0 ? "#c93434" : PALETA[i % PALETA.length] }));

    const costoPorLote = eco
      .filter((l) => l.costoPorHa > 0)
      .map((l, i) => ({ label: l.nombre, value: Math.round(l.costoPorHa), color: PALETA[i % PALETA.length] }));

    // NDVI por lote (del caché de Insight; el más reciente por lote)
    const ndviPorLoteMap = new Map<string, number>();
    ndviRows.forEach((r) => {
      const loteId = r.clave.replace("ndvi:", "");
      if (ndviPorLoteMap.has(loteId)) return;
      try { const d = JSON.parse(r.contenido); if (typeof d.ndvi === "number") ndviPorLoteMap.set(loteId, d.ndvi); } catch {}
    });
    const ndviPorLote = [...ndviPorLoteMap.entries()]
      .filter(([id]) => nombreLote.has(id))
      .map(([id, v], i) => ({ label: nombreLote.get(id)!, value: Math.round(v * 100), color: PALETA[i % PALETA.length] }));

    // ---- Por categoría / cultivo ----
    const porConcepto: Record<string, number> = {};
    costos.forEach((c) => { const k = c.concepto || "Otros"; porConcepto[k] = (porConcepto[k] || 0) + (c.costoTotal || c.monto || 0); });
    const costosPorCategoria = Object.entries(porConcepto).map(([label, value], i) => ({ label, value: Math.round(value), color: PALETA[i % PALETA.length] }));

    const porCultivo: Record<string, number> = {};
    lotes.forEach((l) => { const k = l.cultivo || "Sin cultivo"; porCultivo[k] = (porCultivo[k] || 0) + (l.hectareas || 0); });
    const haPorCultivo = Object.entries(porCultivo).map(([label, value], i) => ({ label, value: Math.round(value), color: PALETA[i % PALETA.length] }));

    // ---- Temporales (por campaña / año) ----
    const porAnioRinde: Record<string, number[]> = {};
    const porAnioIngreso: Record<string, number> = {};
    cosechas.forEach((c) => {
      const anio = String(new Date(c.fechaCosecha).getFullYear());
      (porAnioRinde[anio] ||= []).push(c.rendimiento || 0);
      porAnioIngreso[anio] = (porAnioIngreso[anio] || 0) + (c.rendimiento || 0) * (c.precioVenta || 0);
    });
    const anios = Object.keys(porAnioRinde).sort();
    const rindePorCampaña = anios.map((a, i) => ({ label: a, value: Math.round(porAnioRinde[a].reduce((s, v) => s + v, 0) / porAnioRinde[a].length), color: PALETA[i % PALETA.length] }));
    const ingresoPorCampaña = anios.map((a, i) => ({ label: a, value: Math.round(porAnioIngreso[a]), color: PALETA[i % PALETA.length] }));

    // ---- Producción lechera (temporal) ----
    const produccionLechera = [...leche].reverse().map((r, i) => ({
      label: new Date(r.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      value: Math.round(r.litrosTotales || 0), color: PALETA[i % PALETA.length],
    }));

    const datasets = [
      { id: "margenPorLote", titulo: "Margen por hectárea, por lote", unidad: "USD/ha", dimension: "lote", temporal: false, datos: margenPorLote },
      { id: "ndviPorLote", titulo: "Vigor NDVI por lote", unidad: "NDVI×100", dimension: "lote", temporal: false, datos: ndviPorLote },
      { id: "costoPorLote", titulo: "Costo por hectárea, por lote", unidad: "USD/ha", dimension: "lote", temporal: false, datos: costoPorLote },
      { id: "rindePorCampaña", titulo: "Rinde promedio por campaña", unidad: "kg/ha", dimension: "campaña", temporal: true, datos: rindePorCampaña },
      { id: "ingresoPorCampaña", titulo: "Ingreso por campaña", unidad: "USD", dimension: "campaña", temporal: true, datos: ingresoPorCampaña },
      { id: "costosPorCategoria", titulo: "Costos por categoría", unidad: "USD", dimension: "categoria", temporal: false, datos: costosPorCategoria },
      { id: "haPorCultivo", titulo: "Superficie por cultivo", unidad: "ha", dimension: "cultivo", temporal: false, datos: haPorCultivo },
      { id: "produccionLechera", titulo: "Producción lechera (últimos registros)", unidad: "L/día", dimension: "fecha", temporal: true, datos: produccionLechera },
    ].filter((d) => d.datos.length > 0);

    return NextResponse.json({ datasets });
  } catch (error) {
    console.error("Error en datasets analíticos:", error);
    return NextResponse.json({ error: "Error al armar los datasets" }, { status: 500 });
  }
}
