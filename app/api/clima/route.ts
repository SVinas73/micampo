import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat") || "-34.9011"; // Montevideo correcto
    const lon = searchParams.get("lon") || "-56.1645"; // Montevideo correcto

    // Usar Open-Meteo API (gratuita, sin API key)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=7`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error de API:", errorText);
      throw new Error(`Error al obtener datos del clima: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al consultar API de clima:", error);
    return NextResponse.json(
      { error: "Error al consultar API de clima", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}