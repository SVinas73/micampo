import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/alertas-climaticas/sincronizar
 * Persiste las alertas climáticas auto-generadas por /api/clima para que queden
 * en el historial (tab Alertas) en vez de recalcularse y perderse cada visita.
 * Deduplica: no crea una alerta del mismo tipo si ya hay una de hoy (auto).
 * Body: { alertas: [{tipo, severidad, mensaje, recomendacion}], ubicacion, lat, lon }
 */
const SEV: Record<string, string> = { Crítica: "Extrema", Alta: "Alta", Media: "Media", Baja: "Baja" };
const TIPO_CAT: Record<string, string> = {
  "Riesgo de helada": "Helada", "Calor extremo": "Temperatura", "Lluvia próxima": "Lluvia",
  "Viento fuerte": "Viento", "Ventana de pulverización": "Viento",
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { alertas, ubicacion, lat, lon } = (await request.json()) as {
      alertas?: { tipo: string; severidad: string; mensaje: string; recomendacion: string }[];
      ubicacion?: string; lat?: number; lon?: number;
    };
    if (!Array.isArray(alertas) || alertas.length === 0) return NextResponse.json({ creadas: 0 });

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    // Alertas auto de hoy ya existentes (para no duplicar)
    const existentes = await prisma.alertaClimatica.findMany({
      where: { userId: session.user.id, fuenteDatos: "OpenMeteo-auto", createdAt: { gte: hoy } },
      select: { titulo: true },
    });
    const yaHay = new Set(existentes.map((e) => e.titulo));

    let creadas = 0;
    for (const a of alertas) {
      if (yaHay.has(a.tipo)) continue;
      await prisma.alertaClimatica.create({
        data: {
          tipo: TIPO_CAT[a.tipo] || "Temperatura",
          severidad: SEV[a.severidad] || "Media",
          titulo: a.tipo,
          descripcion: `${a.mensaje}. ${a.recomendacion}`,
          fechaInicio: new Date(),
          ubicacion: ubicacion || "Campo",
          latitud: lat ?? null,
          longitud: lon ?? null,
          recomendacion: a.recomendacion,
          fuenteDatos: "OpenMeteo-auto",
          userId: session.user.id,
        },
      });
      creadas++;
    }
    return NextResponse.json({ creadas });
  } catch (error) {
    console.error("Error al sincronizar alertas climáticas:", error);
    return NextResponse.json({ creadas: 0 }, { status: 200 });
  }
}
