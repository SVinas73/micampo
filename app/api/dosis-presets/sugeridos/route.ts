import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";
import { getInsight, saveInsight } from "@/lib/insight";

// La ruta de IA (Claude) puede superar el timeout por defecto de Vercel (~10s).
export const maxDuration = 30;

/**
 * GET /api/dosis-presets/sugeridos?establecimientoId=&loteId=&refresh=1
 * Sugiere mezclas de aplicación según los CULTIVOS reales del ALCANCE elegido
 * (establecimiento o lote del sidebar). Con IA (Claude) si hay API key; si no,
 * reglas agronómicas por cultivo. Cachea 24 h por alcance; refresh=1 la fuerza.
 */

type ProdMix = { tipo: string; nombre: string; costoUnitario: string; dosis: string; unidad: string; concentracion?: string; carencia?: string };
type Sugerido = {
  nombre: string;
  tipo: string;
  dosis: string;
  caldo: string;
  productos: number;
  color: string;
  justificacion?: string;
  cultivo?: string;
  lote?: string; // para qué lote(s) del establecimiento aplica
  config: { loteNombre: string; loteId: string | null; area: number; caldo: number; tanque: number; tipoAplicacion: string; productos: ProdMix[] };
};
type LoteCultivo = { id: string; nombre: string; ha: number };

const COLOR: Record<string, string> = {
  Herbicida: "var(--mc-green-600)", Fungicida: "var(--mc-blue)", Insecticida: "var(--mc-orange-600)",
  Nutrición: "var(--mc-amber)", Fertilizante: "var(--mc-amber)", Mezcla: "var(--mc-green-700)",
};

// Mezclas de referencia por cultivo (puntos de partida agronómicos, Uruguay).
const REGLAS: Record<string, { nombre: string; tipo: string; caldo: number; productos: ProdMix[]; justificacion: string }[]> = {
  Soja: [
    { nombre: "Barbecho soja", tipo: "Herbicida", caldo: 120, justificacion: "Control de malezas previo a la siembra de soja.", productos: [{ tipo: "Herbicida", nombre: "Glifosato 48%", costoUnitario: "5.5", dosis: "3.0", unidad: "Lt/Ha", concentracion: "48", carencia: "15" }] },
    { nombre: "Chinche en soja", tipo: "Insecticida", caldo: 100, justificacion: "Umbral de chinches en llenado de grano.", productos: [{ tipo: "Insecticida", nombre: "Cipermetrina 25%", costoUnitario: "8.0", dosis: "0.3", unidad: "Lt/Ha", concentracion: "25", carencia: "21" }] },
  ],
  Maíz: [
    { nombre: "Preemergente maíz", tipo: "Herbicida", caldo: 130, justificacion: "Atrazina preemergente para maíz.", productos: [{ tipo: "Herbicida", nombre: "Atrazina", costoUnitario: "4.5", dosis: "2.5", unidad: "Lt/Ha", concentracion: "50", carencia: "0" }] },
    { nombre: "Tizón en maíz", tipo: "Fungicida", caldo: 120, justificacion: "Control preventivo de tizón/roya en maíz.", productos: [{ tipo: "Fungicida", nombre: "Azoxistrobina + Ciproconazole", costoUnitario: "16.0", dosis: "0.5", unidad: "Lt/Ha", concentracion: "28", carencia: "30" }] },
  ],
  Trigo: [
    { nombre: "Roya en trigo", tipo: "Fungicida", caldo: 110, justificacion: "Protección foliar contra roya en encañazón/espigazón.", productos: [{ tipo: "Fungicida", nombre: "Tebuconazole", costoUnitario: "14.0", dosis: "0.5", unidad: "Lt/Ha", concentracion: "25", carencia: "30" }] },
    { nombre: "Hoja ancha en trigo", tipo: "Herbicida", caldo: 100, justificacion: "Control de malezas de hoja ancha en macollaje.", productos: [{ tipo: "Herbicida", nombre: "2,4-D Amina", costoUnitario: "3.8", dosis: "0.6", unidad: "Lt/Ha", concentracion: "48", carencia: "0" }] },
  ],
  Cebada: [
    { nombre: "Mancha en red cebada", tipo: "Fungicida", caldo: 110, justificacion: "Fungicida foliar para cebada.", productos: [{ tipo: "Fungicida", nombre: "Protioconazole", costoUnitario: "17.0", dosis: "0.5", unidad: "Lt/Ha", concentracion: "25", carencia: "30" }] },
  ],
  Girasol: [
    { nombre: "Barbecho girasol", tipo: "Herbicida", caldo: 120, justificacion: "Limpieza de barbecho para girasol.", productos: [{ tipo: "Herbicida", nombre: "Glifosato 48%", costoUnitario: "5.5", dosis: "2.5", unidad: "Lt/Ha", concentracion: "48", carencia: "15" }] },
  ],
};

const GENERICO = { nombre: "Barbecho general", tipo: "Herbicida", caldo: 120, justificacion: "Control de malezas en barbecho para cualquier cultivo.", productos: [{ tipo: "Herbicida", nombre: "Glifosato 48%", costoUnitario: "5.5", dosis: "3.0", unidad: "Lt/Ha", concentracion: "48", carencia: "15" }] };

function aSugerido(
  m: { nombre: string; tipo: string; caldo: number; productos: ProdMix[]; justificacion: string; cultivo?: string },
  areaFallback: number,
  lotesDeCultivo: LoteCultivo[] = []
): Sugerido {
  const p0 = m.productos[0];
  const l0 = lotesDeCultivo[0];
  const haTotal = lotesDeCultivo.reduce((s, l) => s + (l.ha || 0), 0);
  const lote =
    lotesDeCultivo.length === 0 ? "Todo el establecimiento" :
    lotesDeCultivo.length === 1 ? l0.nombre :
    `${lotesDeCultivo.length} lotes${m.cultivo ? ` de ${m.cultivo}` : ""}`;
  return {
    nombre: m.nombre, tipo: m.tipo,
    dosis: p0 ? `${p0.dosis} ${p0.unidad}` : "—",
    caldo: `${m.caldo} L/Ha`,
    productos: m.productos.length,
    color: COLOR[m.tipo] || COLOR.Mezcla,
    justificacion: m.justificacion,
    cultivo: m.cultivo,
    lote,
    config: { loteNombre: l0?.nombre || "", loteId: l0?.id || null, area: haTotal > 0 ? Math.round(haTotal) : areaFallback, caldo: m.caldo, tanque: 3000, tipoAplicacion: "Terrestre", productos: m.productos },
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json([], { status: 200 });

    const sp = new URL(request.url).searchParams;
    const establecimientoId = sp.get("establecimientoId");
    const loteId = sp.get("loteId");
    const refrescar = sp.get("refresh") === "1";

    // Alcance: SIEMPRE el establecimiento completo. Si el sidebar tiene un lote
    // puntual, se resuelve su establecimiento y se analizan TODOS sus lotes.
    let estId: string | null = establecimientoId && establecimientoId !== "todos" ? establecimientoId : null;
    if (!estId && loteId && loteId !== "todos") {
      const l = await prisma.lote.findFirst({ where: { id: loteId, userId: session.user.id }, select: { establecimientoId: true } });
      estId = l?.establecimientoId || null;
    }
    const cacheKey = `dosis-sugeridos:${estId ? `est:${estId}` : "todos"}`;

    if (!refrescar) {
      const cache = await getInsight<Sugerido[]>(session.user.id, cacheKey, 24 * 60);
      if (cache) return NextResponse.json(cache);
    }

    const lotes = await prisma.lote.findMany({
      where: { userId: session.user.id, ...(estId ? { establecimientoId: estId } : {}) },
      select: { id: true, nombre: true, cultivo: true, hectareas: true },
    });
    const porCultivo = new Map<string, number>();
    const lotesPorCultivo = new Map<string, LoteCultivo[]>();
    lotes.forEach((l) => {
      if (l.cultivo) {
        porCultivo.set(l.cultivo, (porCultivo.get(l.cultivo) || 0) + (l.hectareas || 0));
        const arr = lotesPorCultivo.get(l.cultivo) || [];
        arr.push({ id: l.id, nombre: l.nombre, ha: l.hectareas || 0 });
        lotesPorCultivo.set(l.cultivo, arr);
      }
    });
    const cultivos = [...porCultivo.entries()].sort((a, b) => b[1] - a[1]);
    const areaTipica = lotes.length ? Math.round(lotes.reduce((s, l) => s + (l.hectareas || 0), 0) / lotes.length) : 85;

    // --- IA ---
    const anthropic = getAnthropic();
    if (anthropic && cultivos.length > 0) {
      try {
        const msg = await anthropic.messages.create({
          model: IA_MODEL,
          max_tokens: 1100,
          messages: [{
            role: "user",
            content: `Sos un ingeniero agrónomo en Uruguay (mes ${new Date().getMonth() + 1}). El productor tiene estos cultivos (ha): ${cultivos.map(([c, h]) => `${c} ${Math.round(h)}ha`).join(", ")}.
Sugerí 3-4 mezclas de aplicación realistas y pertinentes para esos cultivos y la época. Respondé SOLO con JSON:
[{"nombre":"texto corto","cultivo":"...","tipo":"Herbicida|Fungicida|Insecticida|Nutrición","caldo":number L/Ha,"justificacion":"por qué ahora","productos":[{"tipo":"...","nombre":"principio activo","dosis":"número","unidad":"Lt/Ha|Kg/Ha","concentracion":"%","carencia":"días","costoUnitario":"USD por Lt/Kg aprox"}]}]`,
          }],
        });
        const text = msg.content[0].type === "text" ? msg.content[0].text : "";
        const parsed = parseJsonTolerante<any[]>(text);
        if (Array.isArray(parsed) && parsed.length) {
          const out: Sugerido[] = parsed.slice(0, 4).map((m) => aSugerido({
            nombre: m.nombre || "Sugerencia", tipo: m.tipo || "Herbicida", caldo: Number(m.caldo) || 120,
            cultivo: m.cultivo || undefined,
            justificacion: m.justificacion || "", productos: (m.productos || []).map((p: any) => ({
              tipo: p.tipo || "Herbicida", nombre: p.nombre || "", costoUnitario: String(p.costoUnitario ?? ""), dosis: String(p.dosis ?? "1"), unidad: p.unidad || "Lt/Ha", concentracion: p.concentracion ? String(p.concentracion) : undefined, carencia: p.carencia ? String(p.carencia) : undefined,
            })),
          }, areaTipica, lotesPorCultivo.get(m.cultivo) || []));
          await saveInsight(session.user.id, cacheKey, "dosis-sugeridos", out, IA_MODEL);
          return NextResponse.json(out);
        }
      } catch { /* cae a reglas */ }
    }

    // --- Reglas ---
    const out: Sugerido[] = [];
    if (cultivos.length === 0) {
      out.push(aSugerido(GENERICO, areaTipica));
    } else {
      cultivos.forEach(([c]) => (REGLAS[c] || []).forEach((m) => out.push(aSugerido({ ...m, cultivo: c }, areaTipica, lotesPorCultivo.get(c) || []))));
      if (out.length === 0) out.push(aSugerido(GENERICO, areaTipica));
    }
    const final = out.slice(0, 4);
    await saveInsight(session.user.id, cacheKey, "dosis-sugeridos", final, "reglas");
    return NextResponse.json(final);
  } catch (error) {
    console.error("Error en sugeridos de dosis:", error);
    return NextResponse.json([], { status: 200 });
  }
}
