import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ubicacion = searchParams.get("ubicacion") || "-34.6037,-58.3816"; // Default: Buenos Aires
    const dias = parseInt(searchParams.get("dias") || "7");

    // Verificar si ya tenemos datos recientes
    const fechaMinima = new Date();
    fechaMinima.setHours(fechaMinima.getHours() - 6); // Datos de menos de 6 horas

    const pronosticosExistentes = await prisma.pronosticoClimatico.findMany({
      where: {
        userId: session.user.id,
        ubicacion,
        fecha: {
          gte: new Date(),
        },
        createdAt: {
          gte: fechaMinima,
        },
      },
      orderBy: {
        fecha: "asc",
      },
      take: dias,
    });

    if (pronosticosExistentes.length >= dias) {
      return NextResponse.json(pronosticosExistentes);
    }

    // Generar pronóstico simulado (en producción, aquí iría llamada a OpenWeatherMap API)
    const pronosticos = [];
    for (let i = 0; i < dias; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i);
      fecha.setHours(12, 0, 0, 0);

      // Simulación de datos climáticos
      const tempBase = 20 + Math.random() * 10;
      const tempMin = tempBase - 5 - Math.random() * 3;
      const tempMax = tempBase + 5 + Math.random() * 3;
      const humedad = 50 + Math.random() * 40;
      const precipitacion = Math.random() > 0.7 ? Math.random() * 30 : 0;
      const probabilidadLluvia = precipitacion > 0 ? 60 + Math.random() * 40 : Math.random() * 40;
      const vientoVelocidad = 10 + Math.random() * 30;

      const condiciones = ["Despejado", "Parcialmente nublado", "Nublado", "Lluvia", "Tormenta"];
      const condicion =
        precipitacion > 15
          ? "Tormenta"
          : precipitacion > 5
          ? "Lluvia"
          : precipitacion > 0
          ? "Nublado"
          : Math.random() > 0.5
          ? "Despejado"
          : "Parcialmente nublado";

      // Alertas agronómicas
      const alertas = [];
      let aptoPulverizar = true;
      let aptoSembrar = true;
      let aptoCosechar = true;

      if (vientoVelocidad > 25) {
        alertas.push("⚠️ Viento alto: No recomendado pulverizar (deriva)");
        aptoPulverizar = false;
      }

      if (precipitacion > 10) {
        alertas.push("⚠️ Lluvia significativa: Suspender labores en el campo");
        aptoPulverizar = false;
        aptoSembrar = false;
        aptoCosechar = false;
      }

      if (humedad > 85 && tempMax > 25) {
        alertas.push("⚠️ Alta humedad y temperatura: Riesgo de enfermedades fúngicas");
      }

      if (tempMin < 5) {
        alertas.push("⚠️ Alerta de helada: Proteger cultivos sensibles");
      }

      const pronostico = await prisma.pronosticoClimatico.create({
        data: {
          fecha,
          ubicacion,
          fuente: "OpenWeatherMap (Simulado)",
          temperaturaMin: parseFloat(tempMin.toFixed(1)),
          temperaturaMax: parseFloat(tempMax.toFixed(1)),
          temperaturaMedia: parseFloat(((tempMin + tempMax) / 2).toFixed(1)),
          humedad: parseFloat(humedad.toFixed(0)),
          precipitacion: parseFloat(precipitacion.toFixed(1)),
          probabilidadLluvia: parseFloat(probabilidadLluvia.toFixed(0)),
          vientoVelocidad: parseFloat(vientoVelocidad.toFixed(1)),
          vientoDireccion: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(Math.random() * 8)],
          condicion,
          icono: condicion.toLowerCase().replace(" ", "_"),
          alertas: alertas.length > 0 ? JSON.stringify(alertas) : null,
          aptoPulverizar,
          aptoSembrar,
          aptoCosechar,
          userId: session.user.id,
        },
      });

      pronosticos.push(pronostico);
    }

    return NextResponse.json(pronosticos);
  } catch (error) {
    console.error("Error al obtener pronóstico:", error);
    return NextResponse.json(
      { error: "Error al obtener pronóstico climático" },
      { status: 500 }
    );
  }
}