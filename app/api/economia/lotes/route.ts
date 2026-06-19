import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resumenEconomicoLotes } from "@/lib/economia";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const lotes = await resumenEconomicoLotes(session.user.id);

    const conDatos = lotes.filter((l) => l.fuente !== "sin-datos");
    const totalHa = lotes.reduce((s, l) => s + l.hectareas, 0);
    const margenTotal = lotes.reduce((s, l) => s + l.margen, 0);
    const costoTotal = lotes.reduce((s, l) => s + l.costos, 0);

    return NextResponse.json({
      lotes,
      resumen: {
        lotesConDatos: conDatos.length,
        margenTotal,
        costoTotal,
        margenPorHaPromedio: totalHa > 0 ? margenTotal / totalHa : 0,
      },
    });
  } catch (error) {
    console.error("Error en economía lotes:", error);
    return NextResponse.json({ error: "Error al calcular la economía" }, { status: 500 });
  }
}
