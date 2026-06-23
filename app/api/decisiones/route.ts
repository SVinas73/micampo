import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInsight } from "@/lib/insight";

export const maxDuration = 30;

/**
 * GET /api/decisiones — Feed de decisiones del día.
 * Junta CLIMA + SATÉLITE (NDVI) + SANIDAD + RIEGO + ECONOMÍA en una sola lista
 * de acciones priorizadas. Datos reales; cada item enlaza al módulo para actuar.
 */
type Prioridad = "alta" | "media" | "baja";
type Decision = {
  id: string;
  categoria: string;
  titulo: string;
  detalle: string;
  lote?: string;
  prioridad: Prioridad;
  impacto: string;
  ruta: string;
  icono: string;
  color: string;
};
const PESO: Record<Prioridad, number> = { alta: 3, media: 2, baja: 1 };

// ΔT (Stull) para ventana de pulverización
function deltaT(temp: number, hr: number): number {
  const es = 6.112 * Math.exp((17.62 * temp) / (243.12 + temp));
  const e = (hr / 100) * es;
  const tw = temp - (es - e) / 0.95 * 0.3; // aproximación simple del bulbo húmedo
  return Math.max(0, Math.round((temp - tw) * 10) / 10);
}

const FUNGICO: Record<string, string> = {
  Soja: "Roya asiática / mancha marrón", Trigo: "Roya / fusariosis", Maíz: "Tizón / roya común",
  Cebada: "Mancha en red", Girasol: "Esclerotinia / mildiu",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ decisiones: [] });
    const userId = session.user.id;

    const hace7 = Date.now() - 7 * 86400000;
    const [lotes, lluvias, precios] = await Promise.all([
      prisma.lote.findMany({ where: { userId } }),
      prisma.registroPluviometrico.findMany({ where: { userId, fecha: { gte: new Date(hace7) } } }),
      prisma.precioReferencia.findMany({ where: { userId }, orderBy: { fecha: "desc" } }),
    ]);

    const decisiones: Decision[] = [];
    const conCultivo = lotes.filter((l) => l.cultivo);
    const conGeo = lotes.filter((l) => l.centroLatitud != null && l.centroLongitud != null);
    const lat = conGeo.length ? (conGeo[0].centroLatitud as number) : -32.8;
    const lon = conGeo.length ? (conGeo[0].centroLongitud as number) : -56.0;

    // ---- Clima (Open-Meteo) ----
    let dias: any[] = [];
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,wind_speed_10m_max&timezone=auto&forecast_days=5`;
      const r = await fetch(url, { next: { revalidate: 3600 } });
      if (r.ok) {
        const w = await r.json();
        const cur = w.current || {};
        const d = w.daily || {};
        dias = (d.time || []).map((t: string, i: number) => ({
          tmax: d.temperature_2m_max?.[i], tmin: d.temperature_2m_min?.[i], lluvia: d.precipitation_sum?.[i] ?? 0,
          hrMax: d.relative_humidity_2m_max?.[i] ?? 0, viento: d.wind_speed_10m_max?.[i] ?? 0,
        }));
        // Helada esta noche
        if (dias[0] && dias[0].tmin <= 3) {
          decisiones.push({ id: "helada", categoria: "Clima", titulo: "Riesgo de helada esta noche", detalle: `Mínima de ${Math.round(dias[0].tmin)}°C. Protegé cultivos sensibles y asegurá agua para el ganado.`, prioridad: "alta", impacto: "Evita daño por frío", ruta: "/clima", icono: "thermometer", color: "#c93434" });
        }
        // Ventana de pulverización (ahora)
        const t = cur.temperature_2m, hr = cur.relative_humidity_2m, v = cur.wind_speed_10m;
        if (typeof t === "number" && typeof v === "number") {
          const dt = deltaT(t, hr ?? 60);
          if (v >= 3 && v <= 15 && dt >= 2 && dt <= 8) {
            decisiones.push({ id: "ventana", categoria: "Pulverización", titulo: "Ventana óptima de pulverización", detalle: `Viento ${Math.round(v)} km/h y ΔT ${dt}: condiciones ideales para aplicar hoy.`, prioridad: "media", impacto: "Mejor eficacia, menos deriva", ruta: "/calculadora-dosis", icono: "wind", color: "#5e7733" });
          } else if (v > 25) {
            decisiones.push({ id: "noviento", categoria: "Pulverización", titulo: "No pulverices: viento fuerte", detalle: `${Math.round(v)} km/h: alto riesgo de deriva. Esperá mejores condiciones.`, prioridad: "media", impacto: "Evita pérdida de producto", ruta: "/clima", icono: "wind", color: "#d9a538" });
          }
        }
        // Lluvia importante próxima
        const lluviaProx = dias.slice(0, 3).reduce((s, x) => s + (x.lluvia || 0), 0);
        if (lluviaProx >= 20) {
          decisiones.push({ id: "lluvia", categoria: "Clima", titulo: "Lluvia importante en camino", detalle: `${Math.round(lluviaProx)} mm previstos en 3 días. Posponé pulverizaciones y planificá labores.`, prioridad: "media", impacto: "Aprovechá o protegé según el cultivo", ruta: "/plan-riego", icono: "droplet", color: "#2c6bb8" });
        }
      }
    } catch { /* sin clima */ }

    // ---- Presión de plagas / enfermedades (reglas climáticas por cultivo) ----
    if (dias.length) {
      const hrAlta = dias.filter((x) => x.hrMax >= 80).length;
      const tmed = dias.reduce((s, x) => s + (x.tmax || 0), 0) / dias.length;
      if (hrAlta >= 2 && tmed >= 18 && tmed <= 30) {
        const cultivosUnicos = [...new Set(conCultivo.map((l) => l.cultivo))];
        cultivosUnicos.slice(0, 2).forEach((cult) => {
          const lote = conCultivo.find((l) => l.cultivo === cult)!;
          const prob = Math.min(92, 45 + hrAlta * 12);
          decisiones.push({ id: `plaga-${cult}`, categoria: "Sanidad", titulo: `Riesgo de ${FUNGICO[cult!] || "enfermedad fúngica"}`, detalle: `Humedad ≥80% en ${hrAlta} días favorece el hongo en ${cult}. Monitoreá ${lote.nombre} y evaluá fungicida preventivo.`, lote: lote.nombre, prioridad: prob >= 70 ? "alta" : "media", impacto: `${prob}% de probabilidad`, ruta: "/campo-digital?tab=Detección de Enfermedades (IA)", icono: "bug", color: prob >= 70 ? "#c93434" : "#d9a538" });
        });
      }
    }

    // ---- NDVI: caída de vigor (caché de series) ----
    for (const l of conGeo.slice(0, 10)) {
      const serie = await getInsight<{ anomalia?: string; variacionPct?: number }>(userId, `ndvi-serie:${l.id}`, 7 * 24 * 60);
      if (serie?.anomalia === "caida") {
        decisiones.push({ id: `ndvi-${l.id}`, categoria: "Satélite", titulo: `Caída de vigor en ${l.nombre}`, detalle: `El NDVI bajó ${Math.abs(serie.variacionPct || 0)}% vs su media. Revisá estrés hídrico, plaga o nutrición antes de que se note a ojo.`, lote: l.nombre, prioridad: "alta", impacto: "Detección temprana (2-3 semanas)", ruta: "/campo-digital?tab=Lotes", icono: "activity", color: "#c0532a" });
      }
    }

    // ---- Riego: lotes de verano con poca lluvia reciente ----
    const lluvia7 = lluvias.reduce((s, r) => s + (r.milimetros || 0), 0);
    const veranoCrops = conCultivo.filter((l) => ["Maíz", "Soja", "Sorgo", "Girasol"].includes(l.cultivo || ""));
    if (veranoCrops.length && lluvia7 < 10 && (dias[0]?.tmax ?? 0) >= 26) {
      const l = veranoCrops[0];
      decisiones.push({ id: `riego-${l.id}`, categoria: "Riego", titulo: `Considerá regar ${l.nombre}`, detalle: `Solo ${Math.round(lluvia7)} mm en 7 días con calor: el ${l.cultivo} puede entrar en estrés hídrico. Revisá el balance.`, lote: l.nombre, prioridad: "media", impacto: "Protege el rinde", ruta: "/plan-riego", icono: "droplet", color: "#2c6bb8" });
    }

    // ---- Economía: precio por encima del promedio para tus cultivos ----
    const cultivosUser = new Set(conCultivo.map((l) => l.cultivo));
    const porProducto = new Map<string, number[]>();
    precios.forEach((p) => { const a = porProducto.get(p.producto) ?? []; a.push(p.precio); porProducto.set(p.producto, a); });
    porProducto.forEach((hist, prod) => {
      if (!cultivosUser.has(prod) || hist.length < 2) return;
      const actual = hist[0];
      const prom = hist.reduce((s, v) => s + v, 0) / hist.length;
      if (actual > prom * 1.03) {
        const pct = Math.round(((actual - prom) / prom) * 100);
        decisiones.push({ id: `venta-${prod}`, categoria: "Comercialización", titulo: `Precio alto de ${prod}: evaluá vender`, detalle: `${prod} a US$${Math.round(actual)}/t, ${pct}% sobre su promedio reciente. Buena ventana para fijar precio.`, prioridad: "media", impacto: `+${pct}% vs promedio`, ruta: "/comercializacion", icono: "dollar", color: "#5e7733" });
      }
    });

    decisiones.sort((a, b) => PESO[b.prioridad] - PESO[a.prioridad]);
    return NextResponse.json({ decisiones, generado: new Date().toISOString() });
  } catch (error) {
    console.error("Error en decisiones:", error);
    return NextResponse.json({ decisiones: [] }, { status: 200 });
  }
}
