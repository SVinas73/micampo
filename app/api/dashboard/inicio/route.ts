import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // ============================================
    // 1. LITROS DIARIOS PROMEDIO (últimos 30 días)
    // ============================================
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const registrosLecheros = await prisma.produccionLechera.findMany({
      where: {
        userId,
        fecha: { gte: hace30Dias, lte: hoy },
      },
      select: { litrosTotales: true },
    });

    const totalLitros = registrosLecheros.reduce((sum, r) => sum + r.litrosTotales, 0);
    let litrosDiariosPromedio =
      registrosLecheros.length > 0 ? totalLitros / registrosLecheros.length : 0;

    // Datos de prueba si no hay registros
    if (litrosDiariosPromedio === 0) {
      litrosDiariosPromedio = 20.32; // Valor de prueba
    }

    // ============================================
    // 2. ALERTAS ACTIVAS (críticas y altas)
    // ============================================
    let alertasActivas = await prisma.alertaPredictiva.count({
      where: {
        userId,
        estado: "Activa",
        severidad: { in: ["Alta", "Crítica"] },
      },
    });

    // ============================================
    // 3. TRATAMIENTOS ACTIVOS (últimos 30 días)
    // ============================================
    let tratamientosActivos = await prisma.eventoSanitario.count({
      where: {
        userId,
        fecha: { gte: hace30Dias },
      },
    });

    if (tratamientosActivos === 0) {
      tratamientosActivos = 8; // Valor de prueba
    }

    // ============================================
    // 4. PRODUCCIÓN MES ACTUAL
    // ============================================
    const produccionMesActual = await prisma.produccionLechera.aggregate({
      where: {
        userId,
        fecha: { gte: primerDiaMes, lte: ultimoDiaMes },
      },
      _sum: { litrosTotales: true },
    });

    let produccionTotal = produccionMesActual._sum.litrosTotales || 0;

    if (produccionTotal === 0) {
      produccionTotal = 30512; // Valor de prueba
    }

    // ============================================
    // 5. BALANCE MES ACTUAL
    // ============================================
    const ingresos = await prisma.transaccion.aggregate({
      where: {
        userId,
        tipo: "ingreso",
        fecha: { gte: primerDiaMes, lte: ultimoDiaMes },
      },
      _sum: { monto: true },
    });

    const gastos = await prisma.transaccion.aggregate({
      where: {
        userId,
        tipo: "gasto",
        fecha: { gte: primerDiaMes, lte: ultimoDiaMes },
      },
      _sum: { monto: true },
    });

    const totalIngresos = parseFloat((ingresos._sum.monto || 0).toString());
    const totalGastos = parseFloat((gastos._sum.monto || 0).toString());
    let balanceMesActual = totalIngresos - totalGastos;

    if (balanceMesActual === 0) {
      balanceMesActual = 10500; // Valor de prueba
    }

    // ============================================
    // 6. PRONÓSTICO CLIMÁTICO (7 días)
    // ============================================
    const ubicacion = await prisma.ubicacion.findFirst({
      where: { userId, esPrincipal: true },
    });

    const lat = ubicacion?.latitud || -34.6037;
    const lon = ubicacion?.longitud || -56.1915;

    const climaUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=7`;

    let pronostico = [];
    try {
      const climaRes = await fetch(climaUrl);
      const climaData = await climaRes.json();

      if (climaData.daily) {
        const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        pronostico = climaData.daily.time.map((fecha: string, i: number) => {
          const date = new Date(fecha);
          const diaSemana = diasSemana[date.getDay()];
          const numero = date.getDate();
          const mes = meses[date.getMonth()];

          return {
            fecha,
            dia: `${diaSemana} ${numero < 10 ? "0" : ""}${numero} ${mes}`,
            tempMax: Math.round(climaData.daily.temperature_2m_max[i]),
            tempMin: Math.round(climaData.daily.temperature_2m_min[i]),
            probabilidadLluvia: climaData.daily.precipitation_probability_max[i] || 0,
            viento: Math.round(climaData.daily.wind_speed_10m_max[i]),
            direccionViento: "SE",
            condicion: climaData.daily.precipitation_sum[i] > 5 ? "lluvia" : "despejado",
          };
        });
      }
    } catch (error) {
      console.error("Error al obtener clima:", error);
    }

    // Datos de prueba si no hay pronóstico
    if (pronostico.length === 0) {
      const dias = ["Jue", "Vie", "Sáb", "Dom", "Lun", "Mar", "Mié"];
      for (let i = 0; i < 7; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + i);
        pronostico.push({
          fecha: fecha.toISOString(),
          dia: `${dias[i]} ${fecha.getDate() < 10 ? "0" : ""}${fecha.getDate()} Dic`,
          tempMax: Math.floor(Math.random() * 8) + 28,
          tempMin: Math.floor(Math.random() * 5) + 16,
          probabilidadLluvia: Math.floor(Math.random() * 70),
          viento: Math.floor(Math.random() * 15) + 15,
          direccionViento: "SE",
          condicion: Math.random() > 0.7 ? "lluvia" : "despejado",
        });
      }
    }

    // ============================================
    // 7. TAREAS PROGRAMADAS
    // ============================================
    const hoyInicio = new Date(hoy);
    hoyInicio.setHours(0, 0, 0, 0);
    const en7Dias = new Date(hoyInicio);
    en7Dias.setDate(en7Dias.getDate() + 7);

    const tareasProgramadas = await prisma.tareaEmpleado.findMany({
      where: {
        userId,
        fechaVencimiento: { gte: hoyInicio, lte: en7Dias },
        estado: { in: ["Pendiente", "EnProceso"] },
      },
      select: {
        id: true,
        titulo: true,
        fechaVencimiento: true,
        prioridad: true,
      },
      orderBy: { fechaVencimiento: "asc" },
      take: 7,
    });

    let tareas = tareasProgramadas.map((t) => ({
      fecha: t.fechaVencimiento?.toISOString() || "",
      titulo: t.titulo,
      tipo: t.prioridad === "Urgente" || t.prioridad === "Alta" ? "urgente" : "normal",
    }));

    // Datos de prueba si no hay tareas
    if (tareas.length === 0) {
      tareas = [
        {
          fecha: pronostico[0]?.fecha || hoy.toISOString(),
          titulo: "Sembrar Lote 3",
          tipo: "normal",
        },
        {
          fecha: pronostico[4]?.fecha || hoy.toISOString(),
          titulo: "Retirar Conaprole",
          tipo: "urgente",
        },
      ];
    }

    // ============================================
    // 8. GRÁFICO FINANCIERO (12 meses)
    // ============================================
    const inicioAño = new Date(hoy.getFullYear(), 0, 1);
    const transacciones = await prisma.transaccion.findMany({
      where: {
        userId,
        fecha: { gte: inicioAño, lte: hoy },
      },
      select: {
        tipo: true,
        monto: true,
        fecha: true,
      },
    });

    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    const datosPorMes = meses.map((mes, index) => {
      const mesTransacciones = transacciones.filter((t) => {
        const mesT = t.fecha.getMonth();
        return mesT === index;
      });

      const ingresosSum = mesTransacciones
        .filter((t) => t.tipo === "ingreso")
        .reduce((sum, t) => sum + parseFloat(t.monto.toString()), 0);

      const gastosSum = mesTransacciones
        .filter((t) => t.tipo === "gasto")
        .reduce((sum, t) => sum + parseFloat(t.monto.toString()), 0);

      return {
        mes,
        ingresos: Math.round(ingresosSum),
        gastos: Math.round(gastosSum),
      };
    });

    // Datos de prueba si no hay transacciones
    if (datosPorMes.every((m) => m.ingresos === 0 && m.gastos === 0)) {
      datosPorMes.forEach((mes, index) => {
        mes.ingresos = Math.floor(Math.random() * 40000) + 60000;
        mes.gastos = Math.floor(Math.random() * 20000) + 30000;
      });
    }

    // Calcular balance promedio
    const totalIngresosAño = datosPorMes.reduce((sum, m) => sum + m.ingresos, 0);
    const totalGastosAño = datosPorMes.reduce((sum, m) => sum + m.gastos, 0);
    const balancePromedio = Math.round((totalIngresosAño - totalGastosAño) / 12);

    // Calcular porcentajes
    const ultimosMeses = datosPorMes.slice(-3);
    const mesesAnteriores = datosPorMes.slice(-6, -3);

    const ingresosRecientes = ultimosMeses.reduce((sum, m) => sum + m.ingresos, 0) / 3;
    const ingresosAnteriores = mesesAnteriores.reduce((sum, m) => sum + m.ingresos, 0) / 3;
    const porcentajeIngresos =
      ingresosAnteriores > 0
        ? Math.round(((ingresosRecientes - ingresosAnteriores) / ingresosAnteriores) * 100)
        : 0;

    const gastosRecientes = ultimosMeses.reduce((sum, m) => sum + m.gastos, 0) / 3;
    const gastosAnteriores = mesesAnteriores.reduce((sum, m) => sum + m.gastos, 0) / 3;
    const porcentajeGastos =
      gastosAnteriores > 0
        ? Math.round(((gastosRecientes - gastosAnteriores) / gastosAnteriores) * 100)
        : 0;

    // ============================================
    // RESPONSE FINAL
    // ============================================
    return NextResponse.json({
      metricas: {
        litrosDiariosPromedio: Math.round(litrosDiariosPromedio * 100) / 100,
        alertasActivas,
        tratamientosActivos,
        produccionMesActual: Math.round(produccionTotal),
        balanceMesActual: Math.round(balanceMesActual),
      },
      pronostico,
      graficoFinanciero: {
        balancePromedio,
        porcentajeIngresos,
        porcentajeGastos,
        datos: datosPorMes,
      },
      tareasProgramadas: tareas,
    });
  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}