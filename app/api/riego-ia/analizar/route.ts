import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { loteId, cultivo, etapaFenologica } = await request.json();

    if (!loteId || !cultivo) {
      return NextResponse.json(
        { error: "Lote y cultivo son requeridos" },
        { status: 400 }
      );
    }

    // Obtener lote
    const lote = await prisma.lote.findUnique({
      where: { id: loteId },
    });

    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    // Simulación de análisis IA avanzado
    // En producción, aquí irían llamadas a modelos de ML o APIs especializadas
    
    const etcBase: { [key: string]: number } = {
      "Soja": 5.5,
      "Maíz": 6.0,
      "Trigo": 4.5,
      "Girasol": 5.0,
      "Alfalfa": 7.0,
    };

    const ajusteEtapa: { [key: string]: number } = {
      "Germinación": 0.4,
      "Vegetativo": 0.7,
      "Floración": 1.2,
      "Fructificación": 1.0,
      "Maduración": 0.6,
    };

    const etcDiaria = (etcBase[cultivo] || 5.0) * (ajusteEtapa[etapaFenologica] || 1.0);
    const frecuenciaSugerida = Math.ceil(30 / etcDiaria); // Regar cuando falten 30mm
    const laminaSugerida = etcDiaria * frecuenciaSugerida;
    
    // Cálculos de costo (simulado)
    const costoEnergia = 0.15; // USD por hora bomba
    const eficiencia = 85;
    const tiempoRiego = (laminaSugerida * lote.hectareas * 10) / (1000 * (eficiencia / 100)); // horas
    const costoTotal = tiempoRiego * costoEnergia * lote.hectareas;

    const recomendacion = {
      etcDiaria: parseFloat(etcDiaria.toFixed(2)),
      frecuenciaRiego: frecuenciaSugerida,
      laminaRiego: parseFloat(laminaSugerida.toFixed(2)),
      volumenTotal: parseFloat((laminaSugerida * lote.hectareas * 10).toFixed(0)), // m³
      tiempoRiego: parseFloat(tiempoRiego.toFixed(1)),
      costoEstimado: parseFloat(costoTotal.toFixed(2)),
      confianza: 85 + Math.random() * 10, // 85-95%
      recomendaciones: [
        `Regar cada ${frecuenciaSugerida} días durante la etapa ${etapaFenologica.toLowerCase()}`,
        `Aplicar ${laminaSugerida.toFixed(1)} mm por riego`,
        `Monitorear humedad del suelo regularmente`,
        etcDiaria > 6 ? "Alta demanda hídrica, considerar riego nocturno" : "Demanda hídrica moderada",
      ],
    };

    return NextResponse.json(recomendacion);
  } catch (error) {
    console.error("Error en análisis IA:", error);
    return NextResponse.json(
      { error: "Error al analizar requerimientos de riego" },
      { status: 500 }
    );
  }
}