import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, IA_MODEL, parseJsonTolerante } from "@/lib/ia";

export const maxDuration = 30;

/**
 * Captura por lenguaje natural / voz.
 * Recibe texto libre ("sembré el lote 4 con soja hoy") y lo interpreta como una
 * labor estructurada lista para confirmar. NO persiste: devuelve un borrador para
 * que el frontend lo confirme y lo cree con /api/labores. Degrada con un parser
 * por palabras clave cuando no hay IA.
 */

const TIPOS_LABOR = ["Siembra", "Pulverización", "Fertilización", "Cosecha", "Labranza", "Riego", "Monitoreo"];

function fechaRelativa(texto: string): string {
  const hoy = new Date();
  const t = texto.toLowerCase();
  if (t.includes("ayer")) hoy.setDate(hoy.getDate() - 1);
  else if (t.includes("mañana")) hoy.setDate(hoy.getDate() + 1);
  return hoy.toISOString().split("T")[0];
}

function parseHeuristico(texto: string, lotes: { id: string; nombre: string }[]) {
  const t = texto.toLowerCase();
  const tipo = TIPOS_LABOR.find((x) => t.includes(x.toLowerCase())) ||
    (t.includes("sembr") ? "Siembra" : t.includes("fumig") || t.includes("pulver") ? "Pulverización" :
      t.includes("fertiliz") ? "Fertilización" : t.includes("cosech") ? "Cosecha" : t.includes("rieg") ? "Riego" : "Monitoreo");
  const lote = lotes.find((l) => t.includes(l.nombre.toLowerCase())) ||
    lotes.find((l) => {
      const num = l.nombre.match(/\d+/)?.[0];
      return num && new RegExp(`lote\\s*${num}\\b`).test(t);
    });
  return {
    tipo: "labor" as const,
    labor: {
      tipoLabor: tipo,
      loteNombre: lote?.nombre || null,
      loteId: lote?.id || null,
      fechaISO: fechaRelativa(texto),
      descripcion: texto.trim(),
    },
    confianza: lote ? 70 : 45,
    resumen: lote ? `${tipo} en ${lote.nombre}` : `${tipo} (indicá el lote)`,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const userId = session.user.id;
    const { texto } = await request.json();
    if (!texto || typeof texto !== "string") {
      return NextResponse.json({ error: "Falta el texto" }, { status: 400 });
    }

    const lotes = (await prisma.lote.findMany({ where: { userId } })).map((l) => ({ id: l.id, nombre: l.nombre }));

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json({ ...parseHeuristico(texto, lotes), simulado: true });
    }

    try {
      const res = await anthropic.messages.create({
        model: IA_MODEL,
        max_tokens: 500,
        system:
          "Interpretás notas de campo en español rioplatense y las convertís en una labor agronómica estructurada. Devolvés SOLO JSON.",
        messages: [
          {
            role: "user",
            content: `Nota del productor: "${texto}"

Lotes disponibles: ${JSON.stringify(lotes.map((l) => l.nombre))}
Tipos de labor válidos: ${JSON.stringify(TIPOS_LABOR)}
Fecha de hoy: ${new Date().toISOString().split("T")[0]}

Devolvé un JSON:
{
  "tipoLabor": "uno de los tipos válidos",
  "loteNombre": "el nombre EXACTO del lote de la lista que mejor coincida, o null",
  "fechaISO": "YYYY-MM-DD (interpretá 'hoy', 'ayer', 'mañana')",
  "descripcion": "resumen corto y claro de lo que se hizo",
  "confianza": 0-100
}`,
          },
        ],
      });
      const text = res.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const p = parseJsonTolerante<any>(text);
      if (p) {
        const lote = lotes.find((l) => l.nombre === p.loteNombre) || lotes.find((l) => p.loteNombre && l.nombre.toLowerCase().includes(String(p.loteNombre).toLowerCase()));
        return NextResponse.json({
          tipo: "labor",
          labor: {
            tipoLabor: TIPOS_LABOR.includes(p.tipoLabor) ? p.tipoLabor : "Monitoreo",
            loteNombre: lote?.nombre || null,
            loteId: lote?.id || null,
            fechaISO: p.fechaISO || new Date().toISOString().split("T")[0],
            descripcion: p.descripcion || texto.trim(),
          },
          confianza: p.confianza ?? 60,
          resumen: lote ? `${p.tipoLabor} en ${lote.nombre}` : `${p.tipoLabor} (indicá el lote)`,
          simulado: false,
        });
      }
    } catch (e) {
      console.error("Captura IA falló, usando heurística:", e);
    }

    return NextResponse.json({ ...parseHeuristico(texto, lotes), simulado: false });
  } catch (error) {
    console.error("Error en captura:", error);
    return NextResponse.json({ error: "Error al interpretar" }, { status: 500 });
  }
}
