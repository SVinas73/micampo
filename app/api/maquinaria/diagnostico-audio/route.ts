import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { modeloPropio, modeloPropioDisponible } from "@/lib/ia";

export const maxDuration = 60;

/**
 * POST /api/maquinaria/diagnostico-audio — Diagnóstico de fallas por SONIDO de motor.
 *
 * Recibe un audio del motor (+ contexto opcional: marca, modelo, código de error) y
 * lo rutea al modelo propio de MiCampo (tarea "audio.maquinaria"), que es el que se
 * entrena con miles de muestras de motores sanos/averiados. El seam ya queda listo:
 * el día que conectes tu modelo (MICAMPO_MODELO_URL), este endpoint devuelve el
 * diagnóstico real sin tocar más código.
 *
 * Mientras no haya modelo propio conectado, devuelve un estado "pendiente de modelo"
 * honesto (NO inventa un diagnóstico a partir del audio) con guía de qué grabar.
 */

type DiagnosticoAudio = {
  diagnostico: string;
  severidad: "ok" | "leve" | "media" | "alta";
  confianza: number; // 0-100
  causaProbable: string;
  accion: string;
  componentes: string[];
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Falta el audio del motor" }, { status: 400 });
    if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "El audio es muy grande (máx. 12 MB)" }, { status: 400 });

    const marca = (form.get("marca") as string) || "";
    const modelo = (form.get("modelo") as string) || "";
    const codigoError = (form.get("codigoError") as string) || "";
    const tipo = (form.get("tipo") as string) || "";

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const mimeType = file.type || "audio/webm";

    // Modelo propio de MiCampo (entrenado con sonidos de motor).
    const propio = await modeloPropio<DiagnosticoAudio>("audio.maquinaria", {
      audioBase64: base64,
      mimeType,
      contexto: { marca, modelo, tipo, codigoError },
    });

    if (propio?.diagnostico) {
      return NextResponse.json({ ...propio, fuente: "modelo-propio", pendienteModelo: false });
    }

    // Sin modelo propio conectado: respuesta honesta (no inventamos a partir del audio).
    return NextResponse.json({
      pendienteModelo: true,
      modeloConectado: modeloPropioDisponible(),
      diagnostico: "Análisis por sonido listo para tu modelo entrenado",
      severidad: "ok" as const,
      confianza: 0,
      causaProbable:
        "El diagnóstico por sonido se activa cuando conectás el modelo propio de MiCampo (entrenado con muestras de motores sanos y con falla). El audio se capturó y quedó listo para procesar.",
      accion:
        "Por ahora, complementá con el diagnóstico por foto (Visión IA → Maquinaria) y el historial de taller. Cuando el modelo esté entrenado, este mismo flujo devolverá la falla detectada.",
      componentes: [],
      mensajeGrabacion:
        "Para mejores resultados: grabá 10–15 s con el motor en marcha (ralentí y aceleración), cerca del bloque, sin viento ni voces.",
    });
  } catch (error) {
    console.error("Error en diagnóstico por audio:", error);
    return NextResponse.json({ error: "No se pudo procesar el audio" }, { status: 500 });
  }
}
