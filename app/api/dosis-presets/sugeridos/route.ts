import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";
import { getInsight, saveInsight } from "@/lib/insight";

/**
 * GET /api/dosis-presets/sugeridos
 * Sugiere mezclas de aplicación según los CULTIVOS reales del usuario.
 * Con IA (Claude) si hay API key; si no, reglas agronómicas por cultivo.
 * Cachea 24 h en Insight. Cada sugerencia trae una config lista para usar.
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
  config: { loteNombre: string; loteId: string | null; area: number; caldo: number; tanque: number; tipoAplicacion: string; productos: ProdMix[] };
};

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

function aSugerido(m: { nombre: string; tipo: string; caldo: number; productos: ProdMix[]; justificacion: string }, area: number): Sugerido {
  const p0 = m.productos[0];
  return {
    nombre: m.nombre, tipo: m.tipo,
    dosis: p0 ? `${p0.dosis} ${p0.unidad}` : "—",
    caldo: `${m.caldo} L/Ha`,
    productos: m.productos.length,
    color: COLOR[m.tipo] || COLOR.Mezcla,
    justificacion: m.justificacion,
    config: { loteNombre: "", loteId: null, area, caldo: m.caldo, tanque: 3000, tipoAplicacion: "Terrestre", productos: m.productos },
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json([], { status: 200 });

    const cache = await getInsight<Sugerido[]>(session.user.id, "dosis-sugeridos", 24 * 60);
    if (cache) return NextResponse.json(cache);

    const lotes = await prisma.lote.findMany({ where: { userId: session.user.id }, select: { cultivo: true, hectareas: true } });
    const porCultivo = new Map<string, number>();
    lotes.forEach((l) => { if (l.cultivo) porCultivo.set(l.cultivo, (porCultivo.get(l.cultivo) || 0) + (l.hectareas || 0)); });
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
            justificacion: m.justificacion || "", productos: (m.productos || []).map((p: any) => ({
              tipo: p.tipo || "Herbicida", nombre: p.nombre || "", costoUnitario: String(p.costoUnitario ?? ""), dosis: String(p.dosis ?? "1"), unidad: p.unidad || "Lt/Ha", concentracion: p.concentracion ? String(p.concentracion) : undefined, carencia: p.carencia ? String(p.carencia) : undefined,
            })),
          }, areaTipica));
          await saveInsight(session.user.id, "dosis-sugeridos", "dosis-sugeridos", out, IA_MODEL);
          return NextResponse.json(out);
        }
      } catch { /* cae a reglas */ }
    }

    // --- Reglas ---
    const out: Sugerido[] = [];
    if (cultivos.length === 0) {
      out.push(aSugerido(GENERICO, areaTipica));
    } else {
      cultivos.forEach(([c]) => (REGLAS[c] || []).forEach((m) => out.push(aSugerido(m, areaTipica))));
      if (out.length === 0) out.push(aSugerido(GENERICO, areaTipica));
    }
    const final = out.slice(0, 4);
    await saveInsight(session.user.id, "dosis-sugeridos", "dosis-sugeridos", final, "reglas");
    return NextResponse.json(final);
  } catch (error) {
    console.error("Error en sugeridos de dosis:", error);
    return NextResponse.json([], { status: 200 });
  }
}
