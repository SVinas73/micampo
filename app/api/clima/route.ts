import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* ============================================================
   /api/clima — Clima real con Open-Meteo (gratis, sin API key).
   Devuelve un payload normalizado y listo para el agro:
   - actual: temp, sensación, humedad, viento+dirección+ráfaga,
     rocío, presión, precipitación, ΔT (apto pulverización), icono.
   - dias[7]: máx/mín, prob. y mm de lluvia, viento, ET0, icono.
   - alertas agronómicas derivadas (helada, calor, lluvia, viento).
   Coordenadas por query ?lat=&lon= (centroide del lote del usuario);
   por defecto, zona núcleo pampeana.
   ============================================================ */

const DIRS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
const dir = (deg: number) => DIRS[Math.round(deg / 22.5) % 16];

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function wmo(code: number): { icon: string; desc: string } {
  if (code === 0) return { icon: "sun", desc: "Despejado" };
  if (code === 1) return { icon: "sun", desc: "Mayormente despejado" };
  if (code === 2) return { icon: "cloud", desc: "Parcialmente nublado" };
  if (code === 3) return { icon: "cloud", desc: "Nublado" };
  if (code === 45 || code === 48) return { icon: "cloud", desc: "Niebla" };
  if (code >= 51 && code <= 57) return { icon: "droplet", desc: "Llovizna" };
  if (code >= 61 && code <= 67) return { icon: "droplet", desc: "Lluvia" };
  if (code >= 71 && code <= 77) return { icon: "cloud", desc: "Nieve" };
  if (code >= 80 && code <= 82) return { icon: "droplet", desc: "Chubascos" };
  if (code === 85 || code === 86) return { icon: "cloud", desc: "Chubascos de nieve" };
  if (code >= 95) return { icon: "droplet", desc: "Tormenta" };
  return { icon: "cloud", desc: "—" };
}

// ΔT (delta-T) = temperatura − temperatura de bulbo húmedo (Stull 2011).
// Guía de pulverización: ideal 2–8, aceptable hasta 10, fuera de rango >10 o <2.
function deltaT(t: number, rh: number): number {
  const tw =
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  return Math.max(0, Math.round((t - tw) * 10) / 10);
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat") || "-33.3"; // zona núcleo (Pampa) por defecto
    const lon = searchParams.get("lon") || "-61.5";

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,` +
      `wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m,surface_pressure` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,` +
      `precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration` +
      `&timezone=auto&forecast_days=7`;

    const r = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 900 } });
    if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
    const data = await r.json();

    const c = data.current;
    const dT = deltaT(c.temperature_2m, c.relative_humidity_2m);
    const aptoPulver = dT >= 2 && dT <= 10 && c.wind_speed_10m >= 3 && c.wind_speed_10m <= 20;
    const cw = wmo(c.weather_code);

    const actual = {
      temperatura: Math.round(c.temperature_2m),
      sensacion: Math.round(c.apparent_temperature),
      humedad: Math.round(c.relative_humidity_2m),
      rocio: Math.round(c.dew_point_2m),
      viento: Math.round(c.wind_speed_10m),
      vientoDir: dir(c.wind_direction_10m),
      rafaga: Math.round(c.wind_gusts_10m),
      precipitacion: c.precipitation,
      presion: Math.round(c.surface_pressure),
      deltaT: dT,
      aptoPulverizacion: aptoPulver,
      icono: cw.icon,
      descripcion: cw.desc,
    };

    const d = data.daily;
    const dias = (d.time as string[]).map((iso, i) => {
      const fecha = new Date(iso + "T00:00:00");
      const w = wmo(d.weather_code[i]);
      return {
        fecha: iso,
        nombre: DIAS[fecha.getDay()],
        num: fecha.getDate(),
        esHoy: i === 0,
        icono: w.icon,
        desc: w.desc,
        max: Math.round(d.temperature_2m_max[i]),
        min: Math.round(d.temperature_2m_min[i]),
        mm: Math.round((d.precipitation_sum[i] || 0) * 10) / 10,
        probLluvia: d.precipitation_probability_max?.[i] ?? 0,
        viento: Math.round(d.wind_speed_10m_max[i]),
        et0: Math.round((d.et0_fao_evapotranspiration?.[i] || 0) * 10) / 10,
      };
    });

    // Alertas agronómicas derivadas
    const alertas: { tipo: string; severidad: string; mensaje: string; recomendacion: string }[] = [];
    if (actual.temperatura <= 3) alertas.push({ tipo: "Riesgo de helada", severidad: "Crítica", mensaje: `Temperatura ${actual.temperatura}°C`, recomendacion: "Proteger cultivos sensibles y asegurar agua para el ganado." });
    if (actual.temperatura >= 35) alertas.push({ tipo: "Calor extremo", severidad: "Alta", mensaje: `Temperatura ${actual.temperatura}°C`, recomendacion: "Aumentar riego y asegurar sombra para el rodeo." });
    const lluviaProx = dias.slice(0, 2).find((x) => x.mm >= 5 || x.probLluvia >= 60);
    if (lluviaProx) alertas.push({ tipo: "Lluvia próxima", severidad: "Media", mensaje: `${lluviaProx.nombre}: ${lluviaProx.mm}mm (${lluviaProx.probLluvia}%)`, recomendacion: "Posponer pulverizaciones y planificar labores." });
    if (actual.viento > 25) alertas.push({ tipo: "Viento fuerte", severidad: "Alta", mensaje: `${actual.viento} km/h, ráfagas ${actual.rafaga}`, recomendacion: "Evitar aplicaciones de agroquímicos (deriva)." });
    else if (!aptoPulver) alertas.push({ tipo: "Ventana de pulverización", severidad: "Media", mensaje: `ΔT ${dT} / viento ${actual.viento} km/h fuera de rango`, recomendacion: "Esperá condiciones óptimas (ΔT 2–8, viento 3–15 km/h)." });

    return NextResponse.json({
      actual,
      dias,
      alertas,
      ubicacion: { lat: Number(lat), lon: Number(lon), nombre: data.timezone || "Campo" },
      actualizado: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error /api/clima:", error);
    return NextResponse.json({ error: "Error al consultar el clima" }, { status: 500 });
  }
}
