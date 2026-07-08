import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

// Genera la receta con IA (puede superar el timeout por defecto de Vercel).
export const maxDuration = 30;

type Item = { producto: string; dosis: string; momento: string; motivo: string };
type Receta = { simulado: boolean; resumen: string; items: Item[]; notas?: string; fuente: string };

/** Receta determinística de respaldo (sin IA), con criterio agronómico básico. */
function recetaReglas(v: { ph: number | null; mo: number | null; n: number | null; p: number | null; k: number | null }, cultivo: string | null): Receta {
  const items: Item[] = [];
  if (v.ph != null && v.ph < 5.8) {
    const dosis = v.ph < 5.2 ? "1500-2000" : "800-1200";
    items.push({ producto: "Enmienda calcárea (calcáreo dolomítico)", dosis: `${dosis} kg/ha`, momento: "Antes de la siembra, incorporado", motivo: `pH ${v.ph} por debajo del óptimo (6,0-6,5).` });
  }
  if (v.p != null && v.p < 15) {
    const dosis = Math.round((15 - v.p) * 6 + 60);
    items.push({ producto: "Fosfato diamónico (18-46-0)", dosis: `${dosis} kg/ha`, momento: "A la siembra, en la línea", motivo: `Fósforo ${v.p} ppm bajo el umbral crítico (15 ppm).` });
  }
  if (v.k != null && v.k < 100) {
    const dosis = Math.round((100 - v.k) * 1.2 + 40);
    items.push({ producto: "Cloruro de potasio (0-0-60)", dosis: `${dosis} kg/ha`, momento: "Presiembra o macollaje", motivo: `Potasio ${v.k} ppm por debajo de 100 ppm.` });
  }
  if (v.n != null && v.n < 20) {
    const dosis = Math.round((25 - v.n) * 4 + 60);
    items.push({ producto: "Urea (46-0-0)", dosis: `${dosis} kg/ha`, momento: cultivo === "Trigo" || cultivo === "Cebada" ? "Macollaje / encañazón" : "Según etapa del cultivo", motivo: `Nitrógeno disponible bajo (${v.n} kg/ha).` });
  }
  if (v.mo != null && v.mo < 2.5) {
    items.push({ producto: "Cultivo de cobertura / aporte de rastrojo", dosis: "Plan de rotación", momento: "Entre cultivos", motivo: `Materia orgánica ${v.mo}% baja: conviene mejorar la cobertura y la rotación.` });
  }
  if (items.length === 0) items.push({ producto: "Mantener el plan de fertilización actual", dosis: "—", momento: "—", motivo: "Los valores están dentro de los rangos adecuados." });
  return {
    simulado: true,
    resumen: `Recomendación para ${cultivo || "el lote"} según pH ${v.ph ?? "—"}, MO ${v.mo ?? "—"}%, N ${v.n ?? "—"}, P ${v.p ?? "—"} ppm, K ${v.k ?? "—"} ppm.`,
    items,
    fuente: "reglas",
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { analisisId } = (await request.json()) as { analisisId?: string };
    if (!analisisId) return NextResponse.json({ error: "Falta el análisis" }, { status: 400 });

    const analisis = await prisma.analisisSuelo.findUnique({
      where: { id: analisisId },
      include: { lote: { select: { nombre: true, cultivo: true, hectareas: true } } },
    });
    if (!analisis || analisis.userId !== session.user.id) {
      return NextResponse.json({ error: "Análisis no encontrado" }, { status: 404 });
    }

    const v = { ph: analisis.pH, mo: analisis.materiaOrganica, n: analisis.nitrogeno, p: analisis.fosforo, k: analisis.potasio };
    const cultivo = analisis.lote?.cultivo || null;

    const anthropic = getAnthropic();
    if (!anthropic) {
      // Sin key: receta por reglas (honesta, útil) marcada como simulada.
      return NextResponse.json(recetaReglas(v, cultivo));
    }

    try {
      const msg = await anthropic.messages.create({
        model: IA_MODEL,
        max_tokens: 900,
        system:
          "Sos un ingeniero agrónomo experto en fertilidad de suelos y nutrición de cultivos en el Cono Sur (Uruguay/Argentina). Recomendás un plan de corrección y fertilización concreto y realista a partir de un análisis de suelo. Usás productos genéricos por fórmula. No inventás datos del análisis. Devolvés SOLO JSON.",
        messages: [
          {
            role: "user",
            content: `Análisis de suelo del lote "${analisis.lote?.nombre || "—"}"${cultivo ? ` (cultivo: ${cultivo})` : ""}${analisis.lote?.hectareas ? `, ${analisis.lote.hectareas} ha` : ""}:
- pH: ${v.ph ?? "s/d"}
- Materia orgánica: ${v.mo ?? "s/d"} %
- Nitrógeno: ${v.n ?? "s/d"} kg/ha
- Fósforo: ${v.p ?? "s/d"} ppm
- Potasio: ${v.k ?? "s/d"} ppm

Dame el plan de corrección/fertilización priorizado. Respondé SOLO JSON:
{
  "resumen": "1-2 frases con el diagnóstico y la prioridad",
  "items": [
    {"producto": "genérico por fórmula (ej: Fosfato diamónico 18-46-0)", "dosis": "N kg/ha", "momento": "cuándo aplicar", "motivo": "por qué, ligado al valor del análisis"}
  ],
  "notas": "advertencias o buenas prácticas (opcional)"
}`,
          },
        ],
      });
      const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
      const parsed = parseJsonTolerante<{ resumen?: string; items?: Item[]; notas?: string }>(text);
      if (parsed?.items?.length) {
        const receta: Receta = { simulado: false, resumen: parsed.resumen || "", items: parsed.items, notas: parsed.notas, fuente: IA_MODEL };
        // Persiste la recomendación IA en el análisis (campo recomendaciones).
        await prisma.analisisSuelo.update({ where: { id: analisisId }, data: { recomendaciones: JSON.stringify(receta) } }).catch(() => {});
        return NextResponse.json(receta);
      }
    } catch (e) {
      console.error("Receta IA falló, usando reglas:", e);
    }

    return NextResponse.json(recetaReglas(v, cultivo));
  } catch (error) {
    console.error("Error en recomendación de suelo:", error);
    return NextResponse.json({ error: "No se pudo generar la receta" }, { status: 500 });
  }
}
