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
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
    }

    // Obtener saldo inicial de cuentas bancarias
    const cuentasBancarias = await prisma.cuentaBancaria.findMany({
      where: { userId: session.user.id },
    });

    const saldoInicial = cuentasBancarias.reduce((sum, c) => sum + c.saldo, 0);

    // Obtener transacciones del período
    const transacciones = await prisma.transaccion.findMany({
      where: {
        userId: session.user.id,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
      orderBy: { fecha: "asc" },
    });

    // Agrupar por mes
    const flujoPorMes: Record<string, any> = {};

    transacciones.forEach((t) => {
      const mes = t.fecha.toISOString().slice(0, 7);
      if (!flujoPorMes[mes]) {
        flujoPorMes[mes] = {
          periodo: mes,
          ingresos: 0,
          egresos: 0,
          flujoNeto: 0,
        };
      }

      if (t.tipo === "Ingreso") {
        flujoPorMes[mes].ingresos += t.monto;
      } else {
        flujoPorMes[mes].egresos += t.monto;
      }

      flujoPorMes[mes].flujoNeto = flujoPorMes[mes].ingresos - flujoPorMes[mes].egresos;
    });

    const flujoMensual = Object.values(flujoPorMes);

    // Calcular saldo acumulado
    let saldoAcumulado = saldoInicial;
    const flujoConSaldo = flujoMensual.map((mes: any) => {
      saldoAcumulado += mes.flujoNeto;
      return {
        ...mes,
        saldoAcumulado,
      };
    });

    return NextResponse.json({
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin,
      },
      saldoInicial,
      flujoMensual: flujoConSaldo,
      resumen: {
        totalIngresos: flujoMensual.reduce((sum: number, m: any) => sum + m.ingresos, 0),
        totalEgresos: flujoMensual.reduce((sum: number, m: any) => sum + m.egresos, 0),
        flujoNetoTotal: flujoMensual.reduce((sum: number, m: any) => sum + m.flujoNeto, 0),
        saldoFinal: saldoAcumulado,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al generar flujo de caja" }, { status: 500 });
  }
}