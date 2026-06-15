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

    const { tipo, referenciaId, periodo } = await request.json();

    let ingresos = 0;
    let costos = 0;
    let detalles: any = {};

    if (tipo === "Lote") {
      // Calcular ingresos del lote (ventas de producción)
      const transaccionesIngreso = await prisma.transaccion.findMany({
        where: {
          userId: session.user.id,
          tipo: "Ingreso",
        },
      });
      ingresos = transaccionesIngreso.reduce(
        (sum, t) => sum + parseFloat(t.monto.toString()),  // CORREGIDO
        0
      );

      // Calcular costos del lote
      const costosLote = await prisma.costoLote.findMany({
        where: {
          userId: session.user.id,
          loteId: referenciaId,
        },
      });
      costos = costosLote.reduce(
        (sum, c) => sum + parseFloat(c.monto.toString()),  // CORREGIDO
        0
      );

      // Costos de asignaciones
      const asignaciones = await prisma.asignacionCosto.findMany({
        where: {
          userId: session.user.id,
          tipoDestino: "Lote",
          destinoId: referenciaId,
        },
      });
      costos += asignaciones.reduce(
        (sum, a) => sum + parseFloat(a.monto.toString()),  // CORREGIDO
        0
      );

      // Obtener info del lote
      const lote = await prisma.lote.findUnique({
        where: { id: referenciaId },
      });

      detalles = {
        loteNombre: lote?.nombre,
        hectareas: lote?.hectareas,
        cultivo: lote?.cultivo,
        margenPorHa: lote?.hectareas ? (ingresos - costos) / lote.hectareas : 0,
      };

    } else if (tipo === "Animal") {
      // Calcular ingresos del animal (venta)
      const transaccionesIngreso = await prisma.transaccion.findMany({
        where: {
          userId: session.user.id,
          tipo: "Ingreso",
        },
      });
      ingresos = transaccionesIngreso.reduce(
        (sum, t) => sum + parseFloat(t.monto.toString()),  // CORREGIDO
        0
      );

      // Calcular costos del animal
      const costosAnimal = await prisma.costoAnimal.findMany({
        where: {
          userId: session.user.id,
          animalId: referenciaId,
        },
      });
      costos = costosAnimal.reduce(
        (sum, c) => sum + parseFloat(c.monto.toString()),  // CORREGIDO
        0
      );

      // Costos de asignaciones
      const asignaciones = await prisma.asignacionCosto.findMany({
        where: {
          userId: session.user.id,
          tipoDestino: "Animal",
          destinoId: referenciaId,
        },
      });
      costos += asignaciones.reduce(
        (sum, a) => sum + parseFloat(a.monto.toString()),  // CORREGIDO
        0
      );

      // Obtener info del animal
      const animal = await prisma.animal.findUnique({
        where: { id: referenciaId },
      });

      detalles = {
        animalCaravana: animal?.caravana,  // CORREGIDO (antes era "numero")
        tipo: animal?.tipo,                // CORREGIDO (antes era "categoria")
        raza: animal?.raza,
        sexo: animal?.sexo,
      };

    } else if (tipo === "General") {
      // Margen general del período
      const whereCondition: any = {
        userId: session.user.id,
      };

      if (periodo) {
        const [year, month] = periodo.split("-");
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        whereCondition.fecha = {
          gte: startDate,
          lte: endDate,
        };
      }

      const transacciones = await prisma.transaccion.findMany({
        where: whereCondition,
      });

      ingresos = transacciones
        .filter((t) => t.tipo === "Ingreso")
        .reduce((sum, t) => sum + parseFloat(t.monto.toString()), 0);  // CORREGIDO

      costos = transacciones
        .filter((t) => t.tipo === "Gasto")
        .reduce((sum, t) => sum + parseFloat(t.monto.toString()), 0);  // CORREGIDO

      detalles = {
        periodo,
        cantidadIngresos: transacciones.filter((t) => t.tipo === "Ingreso").length,
        cantidadGastos: transacciones.filter((t) => t.tipo === "Gasto").length,
      };
    }

    const margen = ingresos - costos;
    const porcentajeMargen = ingresos > 0 ? (margen / ingresos) * 100 : 0;

    // Crear o actualizar registro de margen
    const margenExistente = await prisma.margenBruto.findFirst({
      where: {
        userId: session.user.id,
        tipo,
        referenciaId,
        periodo: periodo || new Date().toISOString().slice(0, 7),
      },
    });

    let margenBruto;

    if (margenExistente) {
      margenBruto = await prisma.margenBruto.update({
        where: { id: margenExistente.id },
        data: {
          ingresos,
          costos,
          margen,
          porcentajeMargen,
        },
      });
    } else {
      margenBruto = await prisma.margenBruto.create({
        data: {
          tipo,
          referenciaId,
          referenciaNombre: detalles.loteNombre || detalles.animalCaravana || "General",
          periodo: periodo || new Date().toISOString().slice(0, 7),
          ingresos,
          costos,
          margen,
          porcentajeMargen,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({
      ...margenBruto,
      detalles,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al calcular margen" }, { status: 500 });
  }
}