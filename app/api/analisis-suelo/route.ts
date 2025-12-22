import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // ============================================
    // DATOS HARDCODEADOS SEGÚN FIGMA
    // ============================================

    const cardsLotes = [
      {
        id: "1",
        nombre: "Lote 1 - Ethel",
        subtitulo: "Lote Ente / Tipo 2 parcelas",
        parametros: [
          {
            nombre: "Nitrógeno",
            valor: "pH 7,51",
            porcentaje: 8,
            color: "green",
            necesitaFertilizante: false,
          },
          {
            nombre: "Fósforo",
            valor: "Alto 28%",
            porcentaje: 28,
            color: "orange",
            necesitaFertilizante: true,
          },
          {
            nombre: "Potasio",
            valor: "65%",
            porcentaje: 65,
            color: "yellow",
            necesitaFertilizante: false,
          },
        ],
      },
      {
        id: "41",
        nombre: "Lote 41 - Ibera",
        subtitulo: "Lote Oeste / Tipo 1 parcela",
        parametros: [
          {
            nombre: "Nitrógeno",
            valor: "pH 7,2",
            porcentaje: 12,
            color: "green",
            necesitaFertilizante: false,
          },
          {
            nombre: "Fósforo",
            valor: "Alto 35%",
            porcentaje: 35,
            color: "orange",
            necesitaFertilizante: true,
          },
          {
            nombre: "Potasio",
            valor: "58%",
            porcentaje: 58,
            color: "yellow",
            necesitaFertilizante: false,
          },
        ],
      },
      {
        id: "7",
        nombre: "Lote 7 - La Loma",
        subtitulo: "Lote Sur / Tipo 3 parcelas",
        parametros: [
          {
            nombre: "Nitrógeno",
            valor: "pH 7,8",
            porcentaje: 6,
            color: "green",
            necesitaFertilizante: false,
          },
          {
            nombre: "Fósforo",
            valor: "Medio 22%",
            porcentaje: 22,
            color: "orange",
            necesitaFertilizante: false,
          },
          {
            nombre: "Potasio",
            valor: "72%",
            porcentaje: 72,
            color: "yellow",
            necesitaFertilizante: false,
          },
        ],
      },
      {
        id: "4",
        nombre: "Lote 4 - El Bajo",
        subtitulo: "Lote Norte / Tipo 2 parcelas",
        parametros: [
          {
            nombre: "Nitrógeno",
            valor: "pH 6,9",
            porcentaje: 10,
            color: "green",
            necesitaFertilizante: false,
          },
          {
            nombre: "Fósforo",
            valor: "Bajo 18%",
            porcentaje: 18,
            color: "orange",
            necesitaFertilizante: true,
          },
          {
            nombre: "Potasio",
            valor: "45%",
            porcentaje: 45,
            color: "yellow",
            necesitaFertilizante: false,
          },
        ],
      },
    ];

    const resultadosLaboratorio = [
      {
        id: "1",
        fecha: "2024-12-16",
        lote: "Lote Norte",
        phEst: "0-20",
        fosforo: "P ppm A",
        nTotal: 45,
        ph: 6.5,
        estado: "Alto",
      },
      {
        id: "2",
        fecha: "2024-10-14",
        lote: "Lote Sur",
        phEst: "0-20",
        fosforo: "19 ppm",
        nTotal: 60,
        ph: 6.2,
        estado: "Apta",
      },
      {
        id: "3",
        fecha: "2024-10-12",
        lote: "Lote Este",
        phEst: "0-20",
        fosforo: "29 ppm",
        nTotal: 75,
        ph: 6.6,
        estado: "Óptimo",
      },
      {
        id: "4",
        fecha: "2024-10-10",
        lote: "Lote Oeste",
        phEst: "20-40",
        fosforo: "10 ppm A",
        nTotal: 50,
        ph: 6.8,
        estado: "Apta",
      },
    ];

    const evolucionHistorica = [
      { año: "2020", nitrogeno: 10, optimo: 20 },
      { año: "2021", nitrogeno: 12, optimo: 22 },
      { año: "2022", nitrogeno: 11, optimo: 21 },
      { año: "2023", nitrogeno: 14, optimo: 24 },
      { año: "2024", nitrogeno: 15, optimo: 25 },
    ];

    return NextResponse.json({
      cardsLotes,
      resultadosLaboratorio,
      evolucionHistorica,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de análisis de suelo" },
      { status: 500 }
    );
  }
}