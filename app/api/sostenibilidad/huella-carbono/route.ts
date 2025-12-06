import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ============================================
// FACTORES DE EMISIÓN (kg CO2e por unidad)
// Basados en GHG Protocol y estudios regionales
// ============================================
const FACTORES_EMISION = {
  // Combustibles (kg CO2e por litro)
  diesel: 2.68,
  gasoil: 2.68,
  nafta: 2.31,
  gnc: 1.87,

  // Fertilizantes (kg CO2e por kg de fertilizante)
  urea: 1.34,
  superfosfato: 0.14,
  cloruroPotasio: 0.15,
  nitrato: 3.05,
  fosfato: 0.22,

  // Agroquímicos (kg CO2e por kg o L)
  herbicida: 6.3,
  insecticida: 5.1,
  fungicida: 3.9,

  // Ganadería (kg CO2e por cabeza por año)
  bovinoAdulto: 2100, // Metano entérico + estiércol
  bovinoJoven: 1200,
  ovino: 140,
  porcino: 280,
  aviar: 5,

  // Electricidad (kg CO2e por kWh)
  electricidad: 0.38,
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const establecimientoId = searchParams.get("establecimientoId");

    if (!establecimientoId) {
      return NextResponse.json(
        { error: "establecimientoId requerido" },
        { status: 400 }
      );
    }

    // Obtener todos los cálculos de huella de carbono
    const huellas = await prisma.huellaCarbono.findMany({
      where: { establecimientoId },
      orderBy: { fechaInicio: "desc" },
      include: {
        establecimiento: {
          select: {
            nombre: true,
          },
        },
      },
    });

    // Calcular estadísticas
    const totalEmisiones = huellas.reduce((acc, h) => acc + h.emisionesTotales, 0);
    const promedioEmisiones = huellas.length > 0 ? totalEmisiones / huellas.length : 0;

    // Tendencia (comparar últimas 2 mediciones)
    let tendencia = "N/A";
    if (huellas.length >= 2) {
      const actual = huellas[0].emisionesTotales;
      const anterior = huellas[1].emisionesTotales;
      const cambio = ((actual - anterior) / anterior) * 100;

      if (cambio < -5) tendencia = "Mejorando ↓";
      else if (cambio > 5) tendencia = "Empeorando ↑";
      else tendencia = "Estable →";
    }

    return NextResponse.json({
      huellas,
      estadisticas: {
        totalCalculos: huellas.length,
        totalEmisiones,
        promedioEmisiones,
        tendencia,
      },
    });
  } catch (error) {
    console.error("Error al obtener huellas de carbono:", error);
    return NextResponse.json(
      { error: "Error al obtener huellas de carbono" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { establecimientoId, periodo, fechaInicio, fechaFin } = body;

    if (!establecimientoId || !periodo || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar que no exista ya un cálculo para este período
    const existente = await prisma.huellaCarbono.findUnique({
      where: {
        establecimientoId_periodo: {
          establecimientoId,
          periodo,
        },
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un cálculo para este período" },
        { status: 400 }
      );
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // ============================================
    // 1. EMISIONES DE COMBUSTIBLE
    // ============================================
    const registrosCombustible = await prisma.registroCombustible.findMany({
      where: {
        maquinaria: { establecimientoId },
        fecha: { gte: inicio, lte: fin },
      },
    });

    const emisionesCombustible = registrosCombustible.reduce(
      (acc, reg) => acc + reg.litros * FACTORES_EMISION.diesel,
      0
    );

    // ============================================
    // 2. EMISIONES DE FERTILIZANTES
    // ============================================
    const laboresConFertilizantes = await prisma.labor.findMany({
      where: {
        lote: { establecimientoId },
        fecha: { gte: inicio, lte: fin },
        tipoLabor: { contains: "Fertilización" },
      },
    });

    let emisionesFertilizantes = 0;
    laboresConFertilizantes.forEach((labor) => {
      // Parsear dosis (ejemplo: "200 kg/ha")
      const dosisMatch = labor.dosis?.match(/(\d+(?:\.\d+)?)/);
      if (dosisMatch && labor.lote) {
        const dosis = parseFloat(dosisMatch[1]);
        // Asumimos urea como promedio (simplificación - en producción usar producto real)
        emisionesFertilizantes += dosis * FACTORES_EMISION.urea;
      }
    });

    // ============================================
    // 3. EMISIONES DE AGROQUÍMICOS
    // ============================================
    const laboresConAgroquimicos = await prisma.labor.findMany({
      where: {
        lote: { establecimientoId },
        fecha: { gte: inicio, lte: fin },
        OR: [
          { tipoLabor: { contains: "Herbicida" } },
          { tipoLabor: { contains: "Insecticida" } },
          { tipoLabor: { contains: "Fungicida" } },
          { tipoLabor: { contains: "Pulverización" } },
        ],
      },
    });

    let emisionesAgroquimicos = 0;
    laboresConAgroquimicos.forEach((labor) => {
      const dosisMatch = labor.dosis?.match(/(\d+(?:\.\d+)?)/);
      if (dosisMatch) {
        const dosis = parseFloat(dosisMatch[1]);
        // Promedio entre tipos de agroquímicos
        const factorPromedio =
          (FACTORES_EMISION.herbicida +
            FACTORES_EMISION.insecticida +
            FACTORES_EMISION.fungicida) /
          3;
        emisionesAgroquimicos += dosis * factorPromedio;
      }
    });

    // ============================================
    // 4. EMISIONES DE GANADERÍA (Metano)
    // ============================================
    const animales = await prisma.animal.findMany({
      where: {
        rodeo: { establecimientoId },
        OR: [
          { fechaNacimiento: { lte: fin } },
          { fechaIngreso: { lte: fin } },
        ],
        AND: [
          {
            OR: [{ fechaSalida: null }, { fechaSalida: { gte: inicio } }],
          },
        ],
      },
    });

    const diasPeriodo = Math.ceil(
      (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
    );
    const fraccionAnio = diasPeriodo / 365;

    let emisionesGanaderia = 0;
    animales.forEach((animal) => {
      // Calcular edad aproximada
      const fechaRef = animal.fechaNacimiento || animal.fechaIngreso || inicio;
      const edadAnios =
        (fin.getTime() - new Date(fechaRef).getTime()) / (1000 * 60 * 60 * 24 * 365);

      const factor =
        edadAnios >= 2 ? FACTORES_EMISION.bovinoAdulto : FACTORES_EMISION.bovinoJoven;

      emisionesGanaderia += factor * fraccionAnio;
    });

    // ============================================
    // 5. EMISIONES DE ELECTRICIDAD (simplificado)
    // ============================================
    // En producción, obtener de medidores/facturas
    const emisionesElectricidad = 0; // Placeholder

    // ============================================
    // 6. EMISIONES DE TRANSPORTE (simplificado)
    // ============================================
    const emisionesTransporte = 0; // Placeholder

    // ============================================
    // CÁLCULOS TOTALES
    // ============================================
    const emisionesTotales =
      emisionesCombustible +
      emisionesFertilizantes +
      emisionesAgroquimicos +
      emisionesGanaderia +
      emisionesElectricidad +
      emisionesTransporte;

    // Obtener hectáreas del establecimiento
    const lotes = await prisma.lote.findMany({
      where: { establecimientoId },
      select: { hectareas: true },
    });

    const hectareasTotales = lotes.reduce((acc, l) => acc + l.hectareas, 0);
    const emisionesPorHectarea =
      hectareasTotales > 0 ? emisionesTotales / hectareasTotales : 0;

    // Alcances (simplificado)
    const alcance1 = emisionesCombustible + emisionesGanaderia; // Emisiones directas
    const alcance2 = emisionesElectricidad; // Emisiones indirectas energía

    // Crear registro
    const huella = await prisma.huellaCarbono.create({
      data: {
        establecimientoId,
        periodo,
        fechaInicio: inicio,
        fechaFin: fin,
        emisionesCombustible,
        emisionesFertilizantes,
        emisionesAgroquimicos,
        emisionesGanaderia,
        emisionesElectricidad,
        emisionesTransporte,
        emisionesTotales,
        emisionesPorHectarea,
        alcance1,
        alcance2,
        metodologiaCalculo: "GHG Protocol",
        factoresEmision: FACTORES_EMISION,
        calculadoPor: session.user.email || "Usuario",
      },
      include: {
        establecimiento: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(huella, { status: 201 });
  } catch (error) {
    console.error("Error al calcular huella de carbono:", error);
    return NextResponse.json(
      { error: "Error al calcular huella de carbono" },
      { status: 500 }
    );
  }
}