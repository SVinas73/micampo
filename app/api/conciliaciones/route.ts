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

    const conciliaciones = await prisma.conciliacion.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        cuenta: {
          select: {
            nombre: true,
          },
        },
        diferencias: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(conciliaciones);
  } catch (error) {
    console.error("Error al obtener conciliaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener conciliaciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { cuentaId, fechaInicio, fechaFin } = await request.json();

    if (!cuentaId || !fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Obtener extractos del banco en el período
    const extractos = await prisma.extractoBancario.findMany({
      where: {
        cuentaId,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
      orderBy: {
        fecha: "asc",
      },
    });

    // Obtener transacciones de libros en el período
    const transacciones = await prisma.transaccion.findMany({
      where: {
        userId: session.user.id,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
      orderBy: {
        fecha: "asc",
      },
    });

    const saldoInicialBanco = extractos.length > 0 ? extractos[0].saldo - (extractos[0].credito || 0) + (extractos[0].debito || 0) : 0;
    const saldoFinalBanco = extractos.length > 0 ? extractos[extractos.length - 1].saldo : 0;

    const saldoInicialLibros = transacciones.length > 0 
      ? transacciones.reduce((sum, t, index) => {
          if (index === 0) return t.tipo === "Ingreso" ? t.monto : -t.monto;
          return sum;
        }, 0)
      : 0;

    const saldoFinalLibros = transacciones.reduce((sum, t) => {
      return sum + (t.tipo === "Ingreso" ? t.monto : -t.monto);
    }, saldoInicialLibros);

    // Matching automático simple
    let itemsConciliados = 0;
    const diferencias: any[] = [];

    extractos.forEach(extracto => {
      const monto = extracto.credito || -(extracto.debito || 0);
      const transaccionMatch = transacciones.find(t => {
        const montoTransaccion = t.tipo === "Ingreso" ? t.monto : -t.monto;
        return Math.abs(montoTransaccion - monto) < 0.01 && 
               Math.abs(new Date(t.fecha).getTime() - new Date(extracto.fecha).getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 días
      });

      if (transaccionMatch) {
        itemsConciliados++;
      } else {
        diferencias.push({
          tipo: "EnBancoNoEnLibros",
          fecha: extracto.fecha,
          descripcion: extracto.descripcion,
          montoBanco: monto,
          diferencia: monto,
        });
      }
    });

    transacciones.forEach(transaccion => {
      const montoTransaccion = transaccion.tipo === "Ingreso" ? transaccion.monto : -transaccion.monto;
      const extractoMatch = extractos.find(e => {
        const monto = e.credito || -(e.debito || 0);
        return Math.abs(montoTransaccion - monto) < 0.01 && 
               Math.abs(new Date(transaccion.fecha).getTime() - new Date(e.fecha).getTime()) < 7 * 24 * 60 * 60 * 1000;
      });

      if (!extractoMatch) {
        diferencias.push({
          tipo: "EnLibrosNoEnBanco",
          fecha: transaccion.fecha,
          descripcion: transaccion.descripcion,
          montoLibros: montoTransaccion,
          diferencia: montoTransaccion,
        });
      }
    });

    const diferencia = saldoFinalBanco - saldoFinalLibros;
    const estado = Math.abs(diferencia) < 0.01 ? "Conciliado" : "Con Diferencias";

    // Crear conciliación
    const conciliacion = await prisma.conciliacion.create({
      data: {
        cuentaId,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        saldoInicialBanco,
        saldoFinalBanco,
        saldoInicialLibros,
        saldoFinalLibros,
        diferencia,
        estado,
        itemsConciliados,
        itemsPendientes: diferencias.length,
        userId: session.user.id,
      },
    });

    // Crear diferencias
    if (diferencias.length > 0) {
      await prisma.diferenciaConciliacion.createMany({
        data: diferencias.map(d => ({
          conciliacionId: conciliacion.id,
          tipo: d.tipo,
          fecha: new Date(d.fecha),
          descripcion: d.descripcion,
          montoLibros: d.montoLibros || null,
          montoBanco: d.montoBanco || null,
          diferencia: d.diferencia,
          userId: session.user.id,
        })),
      });
    }

    // Retornar conciliación completa
    const conciliacionCompleta = await prisma.conciliacion.findUnique({
      where: { id: conciliacion.id },
      include: {
        cuenta: true,
        diferencias: true,
      },
    });

    return NextResponse.json(conciliacionCompleta, { status: 201 });
  } catch (error) {
    console.error("Error al crear conciliación:", error);
    return NextResponse.json(
      { error: "Error al crear conciliación" },
      { status: 500 }
    );
  }
}