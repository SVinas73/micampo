import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* ============================================================
   /api/clima/historico-lluvia — promedio histórico REAL de lluvia
   con la API de archivo de Open-Meteo (gratis, sin API key).
   Trae la precipitación diaria de los últimos ~10 años para la
   ubicación y calcula el promedio mensual (12 valores) y el
   promedio anual, para comparar con lo registrado por el productor.
   ============================================================ */

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat") || "-32.8"; // centro de Uruguay por defecto
    const lon = searchParams.get("lon") || "-56.0";

    // Ventana: últimos 10 años completos (hasta el 31/12 del año pasado)
    const anioPasado = new Date().getFullYear() - 1;
    const start = `${anioPasado - 9}-01-01`;
    const end = `${anioPasado}-12-31`;

    const url =
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
      `&start_date=${start}&end_date=${end}&daily=precipitation_sum&timezone=auto`;

    const r = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 86400 } });
    if (!r.ok) throw new Error(`Open-Meteo archive ${r.status}`);
    const data = await r.json();

    const tiempos: string[] = data?.daily?.time || [];
    const precs: number[] = data?.daily?.precipitation_sum || [];

    // Suma por (año, mes) y luego promedio por mes entre años
    const porAnioMes = new Map<string, number>();
    const anios = new Set<number>();
    tiempos.forEach((iso, i) => {
      const d = new Date(iso + "T00:00:00");
      const y = d.getFullYear(), m = d.getMonth();
      anios.add(y);
      const key = `${y}-${m}`;
      porAnioMes.set(key, (porAnioMes.get(key) || 0) + (precs[i] || 0));
    });
    const nAnios = anios.size || 1;
    const promedioMensual = Array.from({ length: 12 }).map((_, m) => {
      let suma = 0;
      anios.forEach((y) => { suma += porAnioMes.get(`${y}-${m}`) || 0; });
      return Math.round(suma / nAnios);
    });
    const promedioAnual = Math.round(promedioMensual.reduce((s, v) => s + v, 0));

    return NextResponse.json({ promedioMensual, promedioAnual, anios: nAnios });
  } catch (error) {
    console.error("Error /api/clima/historico-lluvia:", error);
    return NextResponse.json({ error: "Error al obtener histórico de lluvia" }, { status: 500 });
  }
}
