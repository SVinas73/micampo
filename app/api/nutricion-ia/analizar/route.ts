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

    const {
      categoriaAnimal,
      pesoActual,
      pesoObjetivo,
      gananciaEsperada,
      produccionLeche,
      etapaProductiva,
    } = await request.json();

    if (!categoriaAnimal || !pesoActual) {
      return NextResponse.json(
        { error: "Categoría y peso actual son requeridos" },
        { status: 400 }
      );
    }

    // Simulación de análisis IA avanzado
    // En producción, aquí iría un modelo de ML o API especializada

    const requerimientosBase: { [key: string]: any } = {
      "Vaca lechera": {
        energiaBase: 12,
        proteinaBase: 1.8,
        fibraBase: 6,
        factorProduccion: 0.4, // Por litro de leche
      },
      "Ternero": {
        energiaBase: 8,
        proteinaBase: 1.2,
        fibraBase: 2,
        factorCrecimiento: 0.15,
      },
      "Novillo": {
        energiaBase: 15,
        proteinaBase: 1.5,
        fibraBase: 7,
        factorEngorde: 0.2,
      },
      "Vaquillona": {
        energiaBase: 10,
        proteinaBase: 1.3,
        fibraBase: 5,
        factorCrecimiento: 0.18,
      },
      "Toro": {
        energiaBase: 18,
        proteinaBase: 2.0,
        fibraBase: 8,
        factorMantenimiento: 0.1,
      },
    };

    const req = requerimientosBase[categoriaAnimal] || requerimientosBase["Novillo"];

    let energiaDiaria = req.energiaBase;
    let proteinaDiaria = req.proteinaBase;

    // Ajustes por producción de leche
    if (produccionLeche && req.factorProduccion) {
      energiaDiaria += parseFloat(produccionLeche) * req.factorProduccion;
      proteinaDiaria += parseFloat(produccionLeche) * 0.05;
    }

    // Ajustes por ganancia esperada
    if (gananciaEsperada) {
      const ganancia = parseFloat(gananciaEsperada);
      energiaDiaria += ganancia * (req.factorEngorde || req.factorCrecimiento || 0.15);
      proteinaDiaria += ganancia * 0.2;
    }

    // Ajuste por peso
    const factorPeso = parseFloat(pesoActual) / 500; // Normalizar a 500kg
    energiaDiaria *= factorPeso;
    proteinaDiaria *= factorPeso;

    const fibraDiaria = req.fibraBase * factorPeso;

    // Composición de dieta sugerida
    const dietaSugerida = [
      {
        alimento: "Forraje (Heno/Silo)",
        cantidad: (fibraDiaria * 1.2).toFixed(1),
        unidad: "kg MS",
        aporte: "Fibra y energía base",
      },
      {
        alimento: "Concentrado Proteico",
        cantidad: (proteinaDiaria * 0.8).toFixed(1),
        unidad: "kg",
        aporte: "Proteína",
      },
      {
        alimento: "Suplemento Energético",
        cantidad: (energiaDiaria * 0.15).toFixed(1),
        unidad: "kg",
        aporte: "Energía adicional",
      },
      {
        alimento: "Sales Minerales",
        cantidad: "0.05",
        unidad: "kg",
        aporte: "Minerales y vitaminas",
      },
    ];

    // Cálculo de costos (valores aproximados)
    const costosEstimados = {
      forraje: 0.15, // USD/kg
      concentrado: 0.45,
      suplemento: 0.35,
      minerales: 1.2,
    };

    const costoTotal =
      parseFloat(dietaSugerida[0].cantidad) * costosEstimados.forraje +
      parseFloat(dietaSugerida[1].cantidad) * costosEstimados.concentrado +
      parseFloat(dietaSugerida[2].cantidad) * costosEstimados.suplemento +
      parseFloat(dietaSugerida[3].cantidad) * costosEstimados.minerales;

    // Calcular eficiencia alimenticia estimada
    const eficienciaEstimada = gananciaEsperada
      ? (parseFloat(gananciaEsperada) / (energiaDiaria / 2.5)).toFixed(2)
      : null;

    const recomendacion = {
      energiaDiaria: parseFloat(energiaDiaria.toFixed(2)),
      proteinaDiaria: parseFloat(proteinaDiaria.toFixed(2)),
      fibraDiaria: parseFloat(fibraDiaria.toFixed(2)),
      dietaSugerida,
      costoTotal: parseFloat(costoTotal.toFixed(2)),
      eficienciaAlimenticia: eficienciaEstimada,
      confianza: 85 + Math.random() * 10,
      recomendaciones: [
        `Suministrar ${energiaDiaria.toFixed(1)} Mcal de energía diaria`,
        `Aportar ${proteinaDiaria.toFixed(1)} kg de proteína por día`,
        `Asegurar ${fibraDiaria.toFixed(1)} kg de fibra para salud ruminal`,
        gananciaEsperada
          ? `Con esta dieta se espera una ganancia de ${gananciaEsperada} kg/día`
          : "Monitorear peso semanalmente",
        "Proporcionar agua fresca ad libitum",
        "Dividir la ración en 2-3 comidas diarias para mejor aprovechamiento",
      ],
      alertas:
        proteinaDiaria > 2.5
          ? ["⚠️ Alto nivel de proteína, puede ser costoso. Evaluar alternativas."]
          : [],
    };

    return NextResponse.json(recomendacion);
  } catch (error) {
    console.error("Error en análisis nutricional:", error);
    return NextResponse.json(
      { error: "Error al analizar requerimientos nutricionales" },
      { status: 500 }
    );
  }
}