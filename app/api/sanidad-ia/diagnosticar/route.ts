import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

// Diagnóstico sanitario asistido por IA: a partir de la zona afectada, los
// síntomas y el historial del animal sugiere diagnósticos probables y
// protocolos de tratamiento comparados (éxito, retiro, costo).
export const maxDuration = 45;

type Protocolo = {
  id: string;
  nombre: string;
  badge?: string | null;
  medicamento: string;
  tasaExito: number;
  stock: boolean;
  retiroHoras: number;
  costo: number;
};

type RespuestaDiag = {
  analisis: string;
  diagnosticosProbables: { nombre: string; probabilidad: number }[];
  protocolos: Protocolo[];
  fuente: string;
  simulado: boolean;
};

// Protocolos de referencia por familia de diagnóstico (fallback sin IA).
const PROTOCOLOS_BASE: Record<string, Protocolo[]> = {
  default: [
    { id: "recomendado", nombre: "Protocolo Combinado", badge: "Recomendado", medicamento: "Oxitetraciclina 20% + Antiinflamatorio", tasaExito: 90, stock: true, retiroHoras: 72, costo: 38 },
    { id: "economico", nombre: "Alternativa Económica", medicamento: "Penicilina / Estreptomicina", tasaExito: 76, stock: true, retiroHoras: 96, costo: 14 },
    { id: "premium", nombre: "Alternativa Premium / Corto Retiro", medicamento: "Ceftiofur (retiro corto)", tasaExito: 87, stock: true, retiroHoras: 24, costo: 62 },
  ],
  mastitis: [
    { id: "recomendado", nombre: "Intramamario + Sistémico", badge: "Recomendado", medicamento: "Cefalexina intramamaria + Antiinflamatorio", tasaExito: 92, stock: true, retiroHoras: 96, costo: 45 },
    { id: "economico", nombre: "Alternativa Económica", medicamento: "Penicilina intramamaria", tasaExito: 74, stock: true, retiroHoras: 120, costo: 18 },
    { id: "premium", nombre: "Corto Retiro (tambo)", medicamento: "Ceftiofur sistémico", tasaExito: 88, stock: true, retiroHoras: 24, costo: 68 },
  ],
  podal: [
    { id: "recomendado", nombre: "Protocolo Podal Completo", badge: "Recomendado", medicamento: "Oxitetraciclina LA + curación tópica", tasaExito: 91, stock: true, retiroHoras: 72, costo: 32 },
    { id: "economico", nombre: "Curación Tópica", medicamento: "Sulfato de cobre + venda", tasaExito: 70, stock: true, retiroHoras: 0, costo: 8 },
    { id: "premium", nombre: "Antibiótico Corto Retiro", medicamento: "Ceftiofur", tasaExito: 86, stock: true, retiroHoras: 24, costo: 60 },
  ],
};

function protocolosPorDiagnostico(diagnostico: string): Protocolo[] {
  const d = (diagnostico || "").toLowerCase();
  if (d.includes("mastitis") || d.includes("ubre")) return PROTOCOLOS_BASE.mastitis;
  if (d.includes("piet") || d.includes("pata") || d.includes("podal") || d.includes("laminitis"))
    return PROTOCOLOS_BASE.podal;
  return PROTOCOLOS_BASE.default;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { animalId, zona, zonaLabel, sintomas, diagnostico, severidad, notas } =
      await request.json();

    // Contexto real del animal y del rodeo
    let contexto = "";
    if (animalId) {
      const animal = await prisma.animal.findUnique({
        where: { id: animalId },
        include: {
          registrosPeso: { orderBy: { fecha: "desc" }, take: 1 },
          tratamientos: { orderBy: { fechaInicio: "desc" }, take: 5 },
          historialReproductivo: true,
        },
      });
      if (animal && animal.userId === session.user.id) {
        const edad = animal.fechaNacimiento
          ? Math.floor((Date.now() - new Date(animal.fechaNacimiento).getTime()) / (365.25 * 24 * 3600 * 1000))
          : null;
        contexto = [
          `Caravana ${animal.caravana}`,
          animal.categoria,
          animal.raza,
          edad !== null ? `${edad} años` : null,
          animal.registrosPeso[0] ? `${animal.registrosPeso[0].peso} kg` : null,
          animal.historialReproductivo?.estadoActual
            ? `estado reproductivo: ${animal.historialReproductivo.estadoActual}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");
        if (animal.tratamientos.length > 0) {
          contexto += `\nTratamientos previos: ${animal.tratamientos
            .map((t) => `${t.diagnostico} (${t.medicamento || "s/med"}, ${t.estado})`)
            .join("; ")}`;
        }
      }
    }

    // Historial del rodeo para la misma zona/diagnóstico
    const similares = await prisma.tratamientoSanitario.findMany({
      where: {
        userId: session.user.id,
        OR: [
          ...(zona ? [{ zona }] : []),
          ...(diagnostico ? [{ diagnostico: { contains: diagnostico, mode: "insensitive" as const } }] : []),
        ],
      },
      take: 20,
      orderBy: { fechaInicio: "desc" },
      select: { diagnostico: true, medicamento: true, estado: true },
    });

    const anthropic = getAnthropic();

    if (anthropic) {
      const prompt = `Sos un veterinario experto en bovinos de un sistema de gestión ganadera.
Datos del caso:
- Animal: ${contexto || "sin datos adicionales"}
- Zona afectada: ${zonaLabel || zona || "no especificada"}
- Síntomas observados: ${(sintomas || []).join(", ") || "no especificados"}
- Diagnóstico presuntivo del productor: ${diagnostico || "ninguno"}
- Severidad: ${severidad || "no especificada"}
- Notas: ${notas || "—"}
${similares.length > 0 ? `- Casos previos en el rodeo: ${similares.map((s) => `${s.diagnostico}→${s.medicamento || "s/med"} (${s.estado})`).join("; ")}` : ""}

Respondé SOLO con JSON válido con este shape exacto:
{
  "analisis": "análisis clínico breve (2-3 oraciones) mencionando el historial del rodeo si es relevante",
  "diagnosticosProbables": [{"nombre": "...", "probabilidad": 0-100}],
  "protocolos": [
    {"id":"recomendado","nombre":"...","badge":"Recomendado por IA","medicamento":"...","tasaExito":0-100,"stock":true,"retiroHoras":N,"costo":USD},
    {"id":"economico","nombre":"Alternativa Económica","medicamento":"...","tasaExito":0-100,"stock":true,"retiroHoras":N,"costo":USD},
    {"id":"premium","nombre":"Alternativa Premium / Corto Retiro","medicamento":"...","tasaExito":0-100,"stock":true,"retiroHoras":N,"costo":USD}
  ]
}
Usá medicamentos veterinarios reales para bovinos y períodos de retiro (carencia) realistas en horas.`;

      try {
        const msg = await anthropic.messages.create({
          model: IA_MODEL,
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        });
        const text = msg.content
          .filter((b) => b.type === "text")
          .map((b) => (b.type === "text" ? b.text : ""))
          .join("");
        const parsed = parseJsonTolerante<Omit<RespuestaDiag, "fuente" | "simulado">>(text);
        if (parsed && Array.isArray(parsed.protocolos) && parsed.protocolos.length > 0) {
          const res: RespuestaDiag = {
            analisis: parsed.analisis || "",
            diagnosticosProbables: parsed.diagnosticosProbables || [],
            protocolos: parsed.protocolos,
            fuente: "claude",
            simulado: false,
          };
          return NextResponse.json(res);
        }
      } catch (e) {
        console.error("IA diagnóstico falló, cayendo a reglas:", e);
      }
    }

    // Fallback por reglas (sin API key o si la IA falla)
    const exitosos = similares.filter((s) => s.estado === "Completado").length;
    const analisisReglas =
      similares.length > 0
        ? `Según el historial del rodeo (${similares.length} casos similares, ${exitosos} completados), los protocolos combinados muestran la mejor tasa de resolución para este cuadro.`
        : `Sin historial previo de este cuadro en el rodeo. Se sugieren protocolos estándar para ${zonaLabel || zona || "el cuadro descripto"}.`;

    const res: RespuestaDiag = {
      analisis: analisisReglas,
      diagnosticosProbables: diagnostico ? [{ nombre: diagnostico, probabilidad: 70 }] : [],
      protocolos: protocolosPorDiagnostico(diagnostico || zonaLabel || ""),
      fuente: "reglas",
      simulado: true,
    };
    return NextResponse.json(res);
  } catch (error) {
    console.error("Error en diagnóstico IA:", error);
    return NextResponse.json({ error: "Error en diagnóstico IA" }, { status: 500 });
  }
}
