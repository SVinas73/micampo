import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { interpretarNota } from "@/lib/captura";

export const maxDuration = 30;

/**
 * Captura por lenguaje natural / voz.
 * Recibe texto libre ("sembré el lote 4 con soja hoy") y lo interpreta como una
 * labor estructurada lista para confirmar. NO persiste: devuelve un borrador para
 * que el frontend lo confirme y lo cree con /api/labores. Rutea: modelo propio →
 * Claude → heurística por palabras clave (vía lib/captura).
 */
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
    const resultado = await interpretarNota(texto, lotes);
    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error en captura:", error);
    return NextResponse.json({ error: "Error al interpretar" }, { status: 500 });
  }
}
