import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnthropic, IA_VISION_MODEL, parseJsonTolerante, modeloPropio, type TareaIA } from "@/lib/ia";

export const maxDuration = 45;

/**
 * Visión IA — "sacá una foto y resolvé".
 * Recibe una imagen + un modo (maleza/plaga, maquinaria, condición corporal,
 * forraje, general) y devuelve un análisis estructurado. Rutea en 3 niveles:
 * modelo propio de MiCampo → Claude vision → 503. Nunca inventa: pide más
 * foto/contexto cuando no puede.
 */

type AnthropicMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

/** Mapea cada modo de visión a la tarea estable del modelo propio. */
const TAREA_POR_MODO: Record<string, TareaIA> = {
  maleza: "vision.cultivo",
  maquinaria: "vision.maquinaria",
  "condicion-corporal": "vision.animal",
  forraje: "vision.animal",
  general: "vision.cultivo",
};

const MODOS: Record<string, { titulo: string; instruccion: string }> = {
  maleza: {
    titulo: "Identificación de maleza/plaga",
    instruccion:
      "Identificá la maleza, plaga o insecto de la foto. Indicá nombre común y científico si lo reconocés, su nivel de infestación aparente y el control recomendado (mecánico/químico). Si recomendás un principio activo, aclará que la dosis exacta se calcula en la Calculadora de Dosis.",
  },
  maquinaria: {
    titulo: "Diagnóstico de maquinaria",
    instruccion:
      "Sos un mecánico experto en maquinaria agrícola (tractores, cosechadoras, sembradoras, pulverizadoras) de todas las marcas y antigüedades. Mirá la foto: identificá la pieza o componente, el problema visible (desgaste, rotura, fuga, fisura, corrosión, correa/manguera dañada, etc.) y su gravedad. Indicá la causa probable, la acción recomendada (ajuste/reemplazo/revisión en taller) y la urgencia (inmediata / esta semana / monitorear). Si ves una chapa o número de pieza, transcribilo. Si no podés diagnosticar con confianza, pedí una foto más cercana o de otro ángulo.",
  },
  "condicion-corporal": {
    titulo: "Condición corporal del animal",
    instruccion:
      "Estimá la condición corporal del animal (escala 1 a 5, donde 1 es muy flaco y 5 muy gordo). Justificá brevemente con lo que se ve (cobertura de costillas, lomo, inserción de cola) y recomendá manejo nutricional.",
  },
  forraje: {
    titulo: "Estado del forraje/potrero",
    instruccion:
      "Evaluá el estado del potrero/pastura: disponibilidad de forraje (alta/media/baja), calidad aparente, presencia de suelo desnudo o malezas, y recomendá manejo de pastoreo. Estimá kg de materia seca/ha solo si la foto lo permite, aclarando que es aproximado.",
  },
  general: {
    titulo: "Análisis general",
    instruccion:
      "Describí lo relevante de la imagen para un productor agropecuario y dale recomendaciones accionables.",
  },
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const modo = (formData.get("modo") as string) || "general";
    if (!file) return NextResponse.json({ error: "No se proporcionó imagen" }, { status: 400 });

    let mediaType: AnthropicMediaType;
    if (file.type === "image/jpeg" || file.type === "image/jpg") mediaType = "image/jpeg";
    else if (file.type === "image/png") mediaType = "image/png";
    else if (file.type === "image/gif") mediaType = "image/gif";
    else if (file.type === "image/webp") mediaType = "image/webp";
    else return NextResponse.json({ error: "Formato no soportado (usá JPEG, PNG, GIF o WebP)" }, { status: 400 });

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const cfg = MODOS[modo] || MODOS.general;

    // 1) Modelo propio de MiCampo (si está configurado) — visión entrenada a medida.
    const tarea = TAREA_POR_MODO[modo] || "vision.cultivo";
    const propio = await modeloPropio<{
      resultado?: string; confianza?: number; detalle?: string;
      metricas?: { label: string; valor: string }[]; recomendaciones?: string[];
    }>(tarea, { modo, mediaType, imagenBase64: base64 });
    if (propio?.resultado) {
      return NextResponse.json({
        modo,
        titulo: cfg.titulo,
        resultado: propio.resultado,
        confianza: propio.confianza ?? 0,
        detalle: propio.detalle || "",
        metricas: Array.isArray(propio.metricas) ? propio.metricas : [],
        recomendaciones: Array.isArray(propio.recomendaciones) ? propio.recomendaciones : [],
        simulado: false,
        fuente: "modelo-propio",
      });
    }

    // 2) Claude vision (si hay API key).
    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json(
        { error: "La visión con IA requiere configurar ANTHROPIC_API_KEY", simulado: true },
        { status: 503 }
      );
    }

    const message = await anthropic.messages.create({
      model: IA_VISION_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            {
              type: "text",
              text: `${cfg.instruccion}

Respondé SOLO con un JSON con esta forma:
{
  "resultado": "el hallazgo principal en pocas palabras",
  "confianza": 0-100,
  "detalle": "explicación breve de lo que ves",
  "metricas": [{"label": "métrica", "valor": "valor"}],
  "recomendaciones": ["acción 1", "acción 2"]
}
Si la imagen no permite un análisis confiable, devolvé confianza baja y pedí en "detalle" una mejor foto.`,
            },
          ],
        },
      ],
    });

    const text = message.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const parsed = parseJsonTolerante<any>(text);
    if (!parsed?.resultado) {
      return NextResponse.json({ error: "No se pudo interpretar la imagen" }, { status: 422 });
    }

    return NextResponse.json({
      modo,
      titulo: cfg.titulo,
      resultado: parsed.resultado,
      confianza: parsed.confianza ?? 0,
      detalle: parsed.detalle || "",
      metricas: Array.isArray(parsed.metricas) ? parsed.metricas : [],
      recomendaciones: Array.isArray(parsed.recomendaciones) ? parsed.recomendaciones : [],
      simulado: false,
    });
  } catch (error) {
    console.error("Error en visión:", error);
    return NextResponse.json({ error: "Error al analizar la imagen" }, { status: 500 });
  }
}
