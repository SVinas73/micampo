import { NextResponse } from "next/server";

/**
 * DESACTIVADO. Dependía de OPENWEATHER_API_KEY (ausente) y no tiene consumidores.
 * El pronóstico y el clima reales los sirve /api/clima (Open-Meteo, sin API key).
 */
export async function GET() {
  return NextResponse.json(
    { error: "Endpoint desactivado. Usá /api/clima (Open-Meteo)." },
    { status: 410 }
  );
}
