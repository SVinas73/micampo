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
      planRiegoId,
      periodo,
      fechaInicio,
      fechaFin,
      laminaTotal,
      numeroRiegos,
      horasOperacion,
      energiaConsumida,
      costoEnergia,
      costoManoObra,
      costoMantenimiento,
      incrementoRendimiento,
      valorIncremento,
    } = await request.json();

    if (!planRiegoId || !periodo || !fechaInicio || !fechaFin || !laminaTotal) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Obtener plan de riego
    const plan = await prisma.planRiego.findUnique({
      where: { id: planRiegoId },
      include: {
        lote: {
          select: {
            hectareas: true,
          },
        },
      },
    });

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Plan de riego no encontrado" },
        { status: 404 }
      );
    }

    // Calcular volumen total
    const volumenTotal = parseFloat(laminaTotal) * (plan.lote?.hectareas || 1) * 10; // m³

    // Calcular costos
    const costoTotalEnergia = costoEnergia ? parseFloat(costoEnergia) : 0;
    const costoTotalManoObra = costoManoObra ? parseFloat(costoManoObra) : 0;
    const costoTotalMantenimiento = costoMantenimiento ? parseFloat(costoMantenimiento) : 0;
    const costoTotal = costoTotalEnergia + costoTotalManoObra + costoTotalMantenimiento;

    // Costo por mm
    const costoMM = costoTotal / parseFloat(laminaTotal);

    // Relación beneficio/costo
    let relacionBC = null;
    if (valorIncremento && costoTotal > 0) {
      relacionBC = parseFloat(valorIncremento) / costoTotal;
    }

    // Eficiencia
    const eficienciaAplicacion = plan.eficienciaRiego || 85;

    // Análisis IA
    const analisisIA = {
      eficiencia:
        eficienciaAplicacion > 85
          ? "Alta eficiencia de riego"
          : eficienciaAplicacion > 70
          ? "Eficiencia aceptable"
          : "Baja eficiencia, revisar sistema",
      economia:
        relacionBC && relacionBC > 2
          ? `Excelente relación B/C (${relacionBC.toFixed(2)}). Riego altamente rentable.`
          : relacionBC && relacionBC > 1
          ? `Relación B/C positiva (${relacionBC.toFixed(2)}). Riego rentable.`
          : relacionBC
          ? `Relación B/C baja (${relacionBC.toFixed(2)}). Evaluar optimizaciones.`
          : "No hay datos de beneficio para evaluar rentabilidad",
      costos:
        costoMM > 5
          ? "Costo por mm elevado. Considerar optimizar energía."
          : "Costo por mm razonable",
    };

    const oportunidadesMejora = [];

    if (eficienciaAplicacion < 80) {
      oportunidadesMejora.push("Mejorar uniformidad de riego");
      oportunidadesMejora.push("Revisar presión y caudal del sistema");
    }

    if (costoTotalEnergia > costoTotal * 0.7) {
      oportunidadesMejora.push("Evaluar riego nocturno para tarifa eléctrica reducida");
      oportunidadesMejora.push("Considerar bombas más eficientes");
    }

    if (numeroRiegos > laminaTotal / 30) {
      oportunidadesMejora.push("Riegos muy frecuentes. Evaluar aumentar lámina por riego");
    }

    const analisis = await prisma.analisisCostoRiego.create({
      data: {
        planRiegoId,
        periodo,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        laminaTotal: parseFloat(laminaTotal),
        volumenTotal,
        numeroRiegos: parseInt(numeroRiegos),
        horasOperacion: horasOperacion ? parseFloat(horasOperacion) : 0,
        energiaConsumida: energiaConsumida ? parseFloat(energiaConsumida) : 0,
        costoEnergia: costoTotalEnergia,
        costoManoObra: costoTotalManoObra,
        costoMantenimiento: costoTotalMantenimiento,
        costoTotal,
        incrementoRendimiento: incrementoRendimiento ? parseFloat(incrementoRendimiento) : null,
        valorIncremento: valorIncremento ? parseFloat(valorIncremento) : null,
        costoMM,
        relacionBeneficioCosto: relacionBC,
        eficienciaAplicacion,
        analisisIA: JSON.stringify(analisisIA),
        oportunidadesMejora: oportunidadesMejora.length > 0 ? JSON.stringify(oportunidadesMejora) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(analisis, { status: 201 });
  } catch (error) {
    console.error("Error al crear análisis:", error);
    return NextResponse.json(
      { error: "Error al crear análisis de costos de riego" },
      { status: 500 }
    );
  }
}