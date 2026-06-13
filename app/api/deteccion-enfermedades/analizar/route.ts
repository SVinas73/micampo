import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnthropic, IA_VISION_MODEL, parseJsonTolerante } from "@/lib/ia";

type AnthropicMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

interface Lesion {
  etiqueta: string;
  confianza: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface AnalisisDeteccion {
  enfermedad: string;
  nombreCientifico: string;
  confianzaGlobal: number;
  severidad: "Baja" | "Media" | "Alta";
  lesiones: Lesion[];
  recomendacion: {
    producto: string;
    dosis: string;
    ventanaAplicacion: string;
    costoEstimadoHa: string;
  };
  analisis: string;
  simulado?: boolean;
}

// Análisis demo determinístico (fiel a los datos del Figma) cuando no hay IA.
const DEMO: AnalisisDeteccion = {
  enfermedad: "Roya Común",
  nombreCientifico: "Puccinia sorghi",
  confianzaGlobal: 96,
  severidad: "Media",
  lesiones: [
    { etiqueta: "Lesión A (Foco Principal)", confianza: 98, x: 0.25, y: 0.3, w: 0.12, h: 0.08 },
    { etiqueta: "Lesión B (Esporulación)", confianza: 92, x: 0.5, y: 0.25, w: 0.1, h: 0.07 },
    { etiqueta: "Lesión C (Inicial)", confianza: 85, x: 0.35, y: 0.5, w: 0.14, h: 0.1 },
    { etiqueta: "Lesión D", confianza: 81, x: 0.6, y: 0.55, w: 0.12, h: 0.08 },
    { etiqueta: "Lesión E", confianza: 78, x: 0.45, y: 0.7, w: 0.11, h: 0.07 },
    { etiqueta: "Lesión F", confianza: 74, x: 0.7, y: 0.35, w: 0.1, h: 0.07 },
    { etiqueta: "Lesión G", confianza: 71, x: 0.3, y: 0.8, w: 0.13, h: 0.09 },
  ],
  recomendacion: {
    producto: "Fungicida (Triazol + Estrob.)",
    dosis: "400 cc/Ha",
    ventanaAplicacion: "Próx. 4 hs",
    costoEstimadoHa: "$28/Ha",
  },
  analisis:
    "Eficacia contra la roya en ensayos de campo. La combinación Triazol + Estrobilurina ofrece control preventivo, curativo y antiestrés.",
  simulado: true,
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { image, mediaType, cultivo } = body as { image?: string; mediaType?: string; loteId?: string; cultivo?: string };

    const anthropic = getAnthropic();

    // Sin API key → respuesta demo determinística (sistema 100% funcional).
    if (!anthropic || !image) {
      return NextResponse.json(DEMO);
    }

    const mt: AnthropicMediaType =
      mediaType === "image/png" ? "image/png" : mediaType === "image/gif" ? "image/gif" : mediaType === "image/webp" ? "image/webp" : "image/jpeg";

    const base64 = image.includes(",") ? image.split(",")[1] : image;

    const message = await anthropic.messages.create({
      model: IA_VISION_MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mt, data: base64 } },
            {
              type: "text",
              text: `Sos un fitopatólogo experto. Analizá esta imagen de un cultivo${cultivo ? ` de ${cultivo}` : ""} y detectá enfermedades o plagas.

Respondé SOLO con un JSON con esta forma exacta (sin texto adicional):
{
  "enfermedad": "nombre común",
  "nombreCientifico": "nombre científico",
  "confianzaGlobal": 0-100,
  "severidad": "Baja" | "Media" | "Alta",
  "lesiones": [{"etiqueta": "Lesión A (descripción)", "confianza": 0-100, "x": 0-1, "y": 0-1, "w": 0-1, "h": 0-1}],
  "recomendacion": {"producto": "principio activo sugerido", "dosis": "X cc/Ha o X L/Ha", "ventanaAplicacion": "Próx. X hs", "costoEstimadoHa": "$X/Ha"},
  "analisis": "explicación técnica breve de la estrategia de control"
}

Las coordenadas x,y,w,h son relativas (0-1) respecto al tamaño de la imagen y delimitan cada lesión detectada. Identificá entre 3 y 8 lesiones si las hay.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = parseJsonTolerante<AnalisisDeteccion>(text);

    if (!parsed) {
      return NextResponse.json(DEMO);
    }

    return NextResponse.json({ ...parsed, simulado: false });
  } catch (error) {
    console.error("Error en análisis de detección:", error);
    return NextResponse.json(DEMO);
  }
}
