import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

export const maxDuration = 30;

/**
 * Correlación entre DOS datasets que comparten dimensión (mismos labels).
 * Calcula el coeficiente de Pearson sobre los pares emparejados por label y, si
 * hay IA, una lectura agronómica/económica. Ej: NDVI vs Margen, Costo vs Margen.
 * Body: { a: {titulo, unidad, datos}, b: {titulo, unidad, datos} }
 */
type Serie = { titulo: string; unidad?: string; datos: { label: string; value: number }[] };

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { const a = x[i] - mx, b = y[i] - my; num += a * b; dx += a * a; dy += b * b; }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

function fuerza(r: number): string {
  const a = Math.abs(r);
  if (a >= 0.7) return "fuerte";
  if (a >= 0.4) return "moderada";
  if (a >= 0.2) return "débil";
  return "casi nula";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { a, b } = (await request.json()) as { a?: Serie; b?: Serie };
    if (!a?.datos?.length || !b?.datos?.length) return NextResponse.json({ error: "Faltan datasets" }, { status: 400 });

    // Empareja por label
    const mapB = new Map(b.datos.map((p) => [p.label, p.value]));
    const pares: { label: string; x: number; y: number }[] = [];
    a.datos.forEach((p) => { if (mapB.has(p.label)) pares.push({ label: p.label, x: p.value, y: mapB.get(p.label)! }); });

    if (pares.length < 3) {
      return NextResponse.json({
        r: 0, fuerza: "insuficiente", pares: pares.length,
        resumen: `No hay suficientes puntos en común entre "${a.titulo}" y "${b.titulo}" para correlacionar (se necesitan al menos 3).`,
        hallazgos: [], simulado: true,
      });
    }

    const r = Math.round(pearson(pares.map((p) => p.x), pares.map((p) => p.y)) * 100) / 100;
    const dir = r > 0 ? "positiva (suben juntos)" : "negativa (uno sube, el otro baja)";

    const anthropic = getAnthropic();
    if (anthropic) {
      try {
        const res = await anthropic.messages.create({
          model: IA_MODEL, max_tokens: 700,
          system: "Sos un analista agropecuario. Interpretás la correlación entre dos variables reales del productor con criterio agronómico y económico. No inventes datos. SOLO JSON.",
          messages: [{
            role: "user",
            content: `Variable A: "${a.titulo}" (${a.unidad || ""}). Variable B: "${b.titulo}" (${b.unidad || ""}).
Coeficiente de Pearson r = ${r} (${fuerza(r)}, ${dir}), sobre ${pares.length} puntos.
Pares (label, A, B): ${JSON.stringify(pares)}

Devolvé JSON:
{"resumen":"qué significa esta relación para el productor, 1-2 frases","hallazgos":["caso concreto 1 con nombres reales","caso concreto 2"],"recomendacion":"una acción concreta"}`,
          }],
        });
        const text = res.content.filter((b2: any) => b2.type === "text").map((b2: any) => b2.text).join("");
        const parsed = parseJsonTolerante<any>(text);
        if (parsed?.resumen) return NextResponse.json({ r, fuerza: fuerza(r), pares: pares.length, puntos: pares, ...parsed, simulado: false });
      } catch (e) { console.error("Correlación IA falló:", e); }
    }

    // Determinístico
    const outlier = pares.reduce((acc, p) => (Math.abs(p.x) > Math.abs(acc.x) ? p : acc), pares[0]);
    return NextResponse.json({
      r, fuerza: fuerza(r), pares: pares.length, puntos: pares,
      resumen: `Correlación ${fuerza(r)} y ${dir} entre ${a.titulo.toLowerCase()} y ${b.titulo.toLowerCase()} (r=${r}, ${pares.length} puntos).`,
      hallazgos: [`${outlier.label}: ${a.titulo} ${outlier.x.toLocaleString("es-AR")} · ${b.titulo} ${outlier.y.toLocaleString("es-AR")}.`],
      recomendacion: Math.abs(r) >= 0.4 ? "La relación es suficientemente clara para usarla en decisiones; revisá los casos extremos." : "La relación es débil; no la uses como única base de decisión.",
      simulado: true,
    });
  } catch (error) {
    console.error("Error en correlación:", error);
    return NextResponse.json({ error: "Error al correlacionar" }, { status: 500 });
  }
}
