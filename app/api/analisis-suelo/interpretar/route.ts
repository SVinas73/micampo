import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

// Lee el PDF del laboratorio con visión de documentos: puede tardar > 10 s.
export const maxDuration = 45;

/**
 * POST /api/analisis-suelo/interpretar
 * Recibe el PDF del análisis de laboratorio (data URL) y, con IA, extrae los
 * valores (pH, MO, N, P, K, profundidad, fecha) para precargar el formulario.
 * Sin ANTHROPIC_API_KEY responde { simulado: true } (el usuario carga a mano).
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { pdf } = (await request.json()) as { pdf?: string };
    if (!pdf) return NextResponse.json({ error: "Adjuntá el PDF del análisis" }, { status: 400 });

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json(
        { simulado: true, error: "La lectura del PDF con IA requiere configurar ANTHROPIC_API_KEY" },
        { status: 503 }
      );
    }

    const base64 = pdf.includes(",") ? pdf.split(",")[1] : pdf;

    const msg = await anthropic.messages.create({
      model: IA_MODEL,
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            {
              type: "text",
              text: `Sos un técnico de laboratorio agronómico. Del análisis de suelo adjunto extraé los valores tal como figuran. Respondé SOLO JSON:
{
  "ph": número o null,
  "materiaOrganica": número (%) o null,
  "nitrogeno": número (kg/ha) o null,
  "fosforo": número (ppm, típicamente Bray) o null,
  "potasio": número (ppm) o null,
  "profundidad": "texto (cm)" o null,
  "fecha": "YYYY-MM-DD" o null
}
Si un valor no aparece en el informe, poné null. No inventes ni estimes datos.`,
            },
          ],
        },
      ],
    });

    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const parsed = parseJsonTolerante<{
      ph?: number | null; materiaOrganica?: number | null; nitrogeno?: number | null;
      fosforo?: number | null; potasio?: number | null; profundidad?: string | null; fecha?: string | null;
    }>(text);
    if (!parsed) {
      return NextResponse.json({ error: "No se pudieron leer los valores del PDF. Cargalos a mano." }, { status: 422 });
    }

    return NextResponse.json({ simulado: false, ...parsed });
  } catch (error) {
    console.error("Error al interpretar el análisis de suelo:", error);
    return NextResponse.json({ error: "No se pudo interpretar el PDF" }, { status: 500 });
  }
}
