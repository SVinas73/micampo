import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat") || "-34.9011"; // Montevideo por defecto
    const lon = searchParams.get("lon") || "-56.1645";

    if (!API_KEY) {
      return NextResponse.json(
        { error: "API Key de clima no configurada" },
        { status: 500 }
      );
    }

    // Obtener pronóstico 7 días
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
    );

    if (!forecastResponse.ok) {
      throw new Error("Error al obtener pronóstico");
    }

    const forecastData = await forecastResponse.json();

    // Obtener clima actual
    const currentResponse = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
    );

    if (!currentResponse.ok) {
      throw new Error("Error al obtener clima actual");
    }

    const currentData = await currentResponse.json();

    // Procesar datos para agricultura
    const alertasAgricolas = [];

    // Detectar alertas
    if (currentData.main.temp > 35) {
      alertasAgricolas.push({
        tipo: "Calor Extremo",
        severidad: "Alta",
        mensaje: `Temperatura muy alta (${currentData.main.temp}°C). Riesgo de estrés térmico en cultivos y animales.`,
        recomendacion: "Aumentar riego y asegurar sombra para el ganado.",
      });
    }

    if (currentData.main.temp < 0) {
      alertasAgricolas.push({
        tipo: "Helada",
        severidad: "Crítica",
        mensaje: `Temperatura bajo cero (${currentData.main.temp}°C). Riesgo de daño por heladas.`,
        recomendacion: "Proteger cultivos sensibles y asegurar agua para el ganado.",
      });
    }

    // Buscar lluvia próxima
    const proximaLluvia = forecastData.list.find(
      (item: any) => item.weather[0].main === "Rain"
    );

    if (proximaLluvia) {
      const horasHastaLluvia = Math.floor(
        (new Date(proximaLluvia.dt * 1000).getTime() - Date.now()) / (1000 * 60 * 60)
      );

      if (horasHastaLluvia <= 24) {
        alertasAgricolas.push({
          tipo: "Lluvia Próxima",
          severidad: "Media",
          mensaje: `Se esperan lluvias en ${horasHastaLluvia} horas.`,
          recomendacion: "Posponer aplicaciones de agroquímicos y planificar labores.",
        });
      }
    }

    // Viento fuerte
    if (currentData.wind.speed > 40) {
      alertasAgricolas.push({
        tipo: "Viento Fuerte",
        severidad: "Alta",
        mensaje: `Vientos de ${Math.round(currentData.wind.speed * 3.6)} km/h.`,
        recomendacion: "Evitar aplicaciones de herbicidas/insecticidas.",
      });
    }

    // Humedad muy baja
    if (currentData.main.humidity < 30) {
      alertasAgricolas.push({
        tipo: "Baja Humedad",
        severidad: "Media",
        mensaje: `Humedad relativa baja (${currentData.main.humidity}%).`,
        recomendacion: "Riesgo de incendios. Monitorear riego.",
      });
    }

    // Agrupar pronóstico por día
    const pronosticoDiario: any = {};
    
    forecastData.list.forEach((item: any) => {
      const fecha = item.dt_txt.split(" ")[0];
      if (!pronosticoDiario[fecha]) {
        pronosticoDiario[fecha] = {
          fecha,
          tempMax: item.main.temp_max,
          tempMin: item.main.temp_min,
          descripcion: item.weather[0].description,
          icono: item.weather[0].icon,
          lluvia: item.rain ? item.rain["3h"] || 0 : 0,
          viento: item.wind.speed,
          humedad: item.main.humidity,
          registros: [],
        };
      } else {
        pronosticoDiario[fecha].tempMax = Math.max(
          pronosticoDiario[fecha].tempMax,
          item.main.temp_max
        );
        pronosticoDiario[fecha].tempMin = Math.min(
          pronosticoDiario[fecha].tempMin,
          item.main.temp_min
        );
        if (item.rain) {
          pronosticoDiario[fecha].lluvia += item.rain["3h"] || 0;
        }
      }
      pronosticoDiario[fecha].registros.push(item);
    });

    const dias = Object.values(pronosticoDiario).slice(0, 7);

    return NextResponse.json({
      actual: {
        temperatura: Math.round(currentData.main.temp),
        sensacionTermica: Math.round(currentData.main.feels_like),
        tempMax: Math.round(currentData.main.temp_max),
        tempMin: Math.round(currentData.main.temp_min),
        descripcion: currentData.weather[0].description,
        icono: currentData.weather[0].icon,
        humedad: currentData.main.humidity,
        viento: Math.round(currentData.wind.speed * 3.6), // m/s a km/h
        presion: currentData.main.pressure,
        visibilidad: currentData.visibility / 1000, // metros a km
        amanecer: currentData.sys.sunrise,
        atardecer: currentData.sys.sunset,
      },
      pronostico: dias,
      alertas: alertasAgricolas,
      ubicacion: {
        nombre: currentData.name,
        lat,
        lon,
      },
    });
  } catch (error) {
    console.error("Error al obtener clima:", error);
    return NextResponse.json(
      { error: "Error al obtener datos climáticos" },
      { status: 500 }
    );
  }
}