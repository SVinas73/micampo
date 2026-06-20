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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { image, mediaType, cultivo } = body as { image?: string; mediaType?: string; loteId?: string; cultivo?: string };

    if (!image) {
      return NextResponse.json({ error: "No se proporcionó imagen" }, { status: 400 });
    }

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json(
        { error: "La detección con IA requiere configurar ANTHROPIC_API_KEY", simulado: true },
        { status: 503 }
      );
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
      return NextResponse.json({ error: "No se pudo interpretar la imagen. Probá con otra foto." }, { status: 422 });
    }

    return NextResponse.json({ ...parsed, simulado: false });
  } catch (error) {
    console.error("Error en análisis de detección:", error);
    return NextResponse.json({ error: "Error al analizar la imagen" }, { status: 500 });
  }
}
