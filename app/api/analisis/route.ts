import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

export const maxDuration = 30;

/**
 * Análisis de una serie de datos con IA. Recibe { titulo, unidad, datos:[{label,value}] }
 * y devuelve hallazgos y recomendaciones con criterio agronómico-económico.
 * Degrada a un análisis estadístico determinístico cuando no hay IA.
 */

function analisisDeterministico(titulo: string, unidad: string, datos: { label: string; value: number }[]) {
  if (!datos.length) return { resumen: "Sin datos para analizar.", hallazgos: [], recomendaciones: [] };
  const valores = datos.map((d) => d.value);
  const max = datos.reduce((a, b) => (b.value > a.value ? b : a));
  const min = datos.reduce((a, b) => (b.value < a.value ? b : a));
  const prom = valores.reduce((s, v) => s + v, 0) / valores.length;
  const negativos = datos.filter((d) => d.value < 0);
  const hallazgos = [
    `El valor más alto es ${max.label} (${max.value.toLocaleString("es-AR")} ${unidad}).`,
    `El más bajo es ${min.label} (${min.value.toLocaleString("es-AR")} ${unidad}).`,
    `El promedio es ${Math.round(prom).toLocaleString("es-AR")} ${unidad}.`,
  ];
  if (negativos.length) hallazgos.push(`${negativos.length} con valor negativo: ${negativos.map((d) => d.label).join(", ")}.`);
  return {
    resumen: `${titulo}: ${datos.length} series, promedio ${Math.round(prom).toLocaleString("es-AR")} ${unidad}.`,
    hallazgos,
    recomendaciones: negativos.length
      ? [`Revisá ${negativos[0].label}, que está en rojo.`]
      : [`Tomá ${max.label} como referencia de buena performance.`],
    simulado: true,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { titulo, unidad, datos } = await request.json();
    if (!Array.isArray(datos) || datos.length === 0) {
      return NextResponse.json({ error: "Sin datos" }, { status: 400 });
    }

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json(analisisDeterministico(titulo, unidad || "", datos));
    }

    try {
      const res = await anthropic.messages.create({
        model: IA_MODEL,
        max_tokens: 900,
        system:
          "Sos un analista agropecuario. Analizás una serie de datos reales y devolvés hallazgos accionables con criterio agronómico y económico. No inventes datos. Devolvés SOLO JSON.",
        messages: [
          {
            role: "user",
            content: `Serie: "${titulo}" (unidad: ${unidad}).
Datos: ${JSON.stringify(datos)}

Devolvé JSON:
{
  "resumen": "1-2 frases con la lectura principal",
  "hallazgos": ["dato concreto 1", "dato concreto 2", "dato concreto 3"],
  "recomendaciones": ["acción 1 con impacto económico si aplica", "acción 2"]
}`,
          },
        ],
      });
      const text = res.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const parsed = parseJsonTolerante<any>(text);
      if (parsed?.resumen) return NextResponse.json({ ...parsed, simulado: false });
    } catch (e) {
      console.error("Análisis IA falló, usando determinístico:", e);
    }

    return NextResponse.json(analisisDeterministico(titulo, unidad || "", datos));
  } catch (error) {
    console.error("Error en análisis:", error);
    return NextResponse.json({ error: "Error al analizar" }, { status: 500 });
  }
}
