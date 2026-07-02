import { NextResponse } from "next/server";

/**
 * DESACTIVADO. Este endpoint fabricaba pronósticos con Math.random() y los persistía
 * como si fueran reales, lo que viola la regla de "datos reales únicamente".
 * El pronóstico real lo sirve /api/clima (Open-Meteo). Se deja este stub 410 por si
 * algún cliente viejo lo invoca, sin generar ni guardar datos falsos.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Endpoint desactivado. Usá /api/clima (datos reales de Open-Meteo)." },
    { status: 410 }
  );
}
