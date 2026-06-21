import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Análisis de suelo — datos reales del usuario.
 * GET: devuelve los análisis cargados (con su lote), ordenados por fecha.
 * POST: registra un nuevo análisis de laboratorio para un lote.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const analisis = await prisma.analisisSuelo.findMany({
      where: { userId: session.user.id },
      include: { lote: { select: { nombre: true, cultivo: true } } },
      orderBy: { fechaAnalisis: "desc" },
      take: 50,
    });

    return NextResponse.json(analisis);
  } catch (error) {
    console.error("Error al obtener análisis de suelo:", error);
    return NextResponse.json(
      { error: "Error al obtener análisis de suelo" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { loteId, fechaAnalisis, pH, materiaOrganica, nitrogeno, fosforo, potasio, observaciones } = body;

    if (!loteId) {
      return NextResponse.json({ error: "El lote es requerido" }, { status: 400 });
    }

    const lote = await prisma.lote.findUnique({ where: { id: loteId } });
    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    const num = (v: unknown) => (v === undefined || v === null || v === "" ? null : Number(v));

    // Recomendación agronómica determinística a partir de N/P/K, pH y MO.
    const recomendaciones = recetaSuelo({
      n: num(nitrogeno),
      p: num(fosforo),
      k: num(potasio),
      ph: num(pH),
      mo: num(materiaOrganica),
    });

    const analisis = await prisma.analisisSuelo.create({
      data: {
        loteId,
        fechaAnalisis: fechaAnalisis ? new Date(fechaAnalisis) : new Date(),
        pH: num(pH),
        materiaOrganica: num(materiaOrganica),
        nitrogeno: num(nitrogeno),
        fosforo: num(fosforo),
        potasio: num(potasio),
        observaciones: observaciones || null,
        recomendaciones: recomendaciones.length ? recomendaciones.join(" · ") : null,
        userId: session.user.id,
      },
      include: { lote: { select: { nombre: true, cultivo: true } } },
    });

    return NextResponse.json(analisis, { status: 201 });
  } catch (error) {
    console.error("Error al crear análisis de suelo:", error);
    return NextResponse.json({ error: "Error al crear análisis de suelo" }, { status: 500 });
  }
}

function recetaSuelo({ n, p, k, ph, mo }: { n: number | null; p: number | null; k: number | null; ph: number | null; mo: number | null }): string[] {
  const recs: string[] = [];
  if (n != null && n < 50) recs.push(`Urea 46-0-0: ${Math.round((60 - n) * 2.6)} kg/Ha (déficit de N)`);
  if (p != null && p < 15) recs.push(`Fosfato diamónico: ${Math.round((18 - p) * 6)} kg/Ha (déficit de P)`);
  if (k != null && k < 120) recs.push(`Cloruro de potasio: ${Math.round((150 - k) * 0.8)} kg/Ha (déficit de K)`);
  if (ph != null && ph < 6) recs.push(`Enmienda calcárea: 800-1200 kg/Ha (pH ${ph} bajo el óptimo)`);
  if (mo != null && mo < 2.5) recs.push("Incorporar cultivos de cobertura para subir materia orgánica");
  return recs;
}
