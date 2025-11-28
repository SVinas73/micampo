import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const conciliaciones = await prisma.conciliacion.findMany({
      where: { userId: session.user.id },
      include: {
        cuenta: { select: { nombre: true } },
        diferencias: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(conciliaciones);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener conciliaciones" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { cuentaId, fechaInicio, fechaFin } = await request.json();

    if (!cuentaId || !fechaInicio || !fechaFin) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const extractos = await prisma.extractoBancario.findMany({
      where: {
        cuentaId,
        fecha: { gte: new Date(fechaInicio), lte: new Date(fechaFin) },
      },
      orderBy: { fecha: "asc" },
    });

    const transacciones = await prisma.transaccion.findMany({
      where: {
        userId: session.user.id,
        fecha: { gte: new Date(fechaInicio), lte: new Date(fechaFin) },
      },
      orderBy: { fecha: "asc" },
    });

    const saldoInicialBanco = extractos.length > 0 ? extractos[0].saldo : 0;
    const saldoFinalBanco = extractos.length > 0 ? extractos[extractos.length - 1].saldo : 0;

    let saldoFinalLibros = 0;
    for (const t of transacciones) {
      saldoFinalLibros += t.tipo === "Ingreso" ? t.monto : -t.monto;
    }

    const conciliados = new Set();
    const diferencias = [];
    let itemsConciliados = 0;

    for (const extracto of extractos) {
      const montoExtracto = (extracto.credito || 0) - (extracto.debito || 0);
      
      const match = transacciones.find(t => {
        if (conciliados.has(t.id)) return false;
        const montoTx = t.tipo === "Ingreso" ? t.monto : -t.monto;
        const diferenciaMonto = Math.abs(montoTx - montoExtracto);
        const diferenciaFecha = Math.abs(new Date(t.fecha).getTime() - new Date(extracto.fecha).getTime());
        return diferenciaMonto < 0.01 && diferenciaFecha < 7 * 24 * 60 * 60 * 1000;
      });

      if (match) {
        itemsConciliados++;
        conciliados.add(match.id);
      } else {
        diferencias.push({
          tipo: "EnBancoNoEnLibros",
          fecha: extracto.fecha,
          descripcion: extracto.descripcion,
          montoBanco: montoExtracto,
          montoLibros: null,
          diferencia: montoExtracto,
        });
      }
    }

    for (const t of transacciones) {
      if (!conciliados.has(t.id)) {
        const montoTx = t.tipo === "Ingreso" ? t.monto : -t.monto;
        diferencias.push({
          tipo: "EnLibrosNoEnBanco",
          fecha: t.fecha,
          descripcion: t.descripcion,
          montoLibros: montoTx,
          montoBanco: null,
          diferencia: montoTx,
        });
      }
    }

    const diferencia = saldoFinalBanco - saldoFinalLibros;
    const estado = Math.abs(diferencia) < 0.01 ? "Conciliado" : "Con Diferencias";

    const conciliacion = await prisma.conciliacion.create({
      data: {
        cuentaId,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        saldoInicialBanco,
        saldoFinalBanco,
        saldoInicialLibros: 0,
        saldoFinalLibros,
        diferencia,
        estado,
        itemsConciliados,
        itemsPendientes: diferencias.length,
        userId: session.user.id,
      },
    });

    if (diferencias.length > 0) {
      await prisma.diferenciaConciliacion.createMany({
        data: diferencias.map(d => ({
          conciliacionId: conciliacion.id,
          tipo: d.tipo,
          fecha: d.fecha,
          descripcion: d.descripcion,
          montoLibros: d.montoLibros,
          montoBanco: d.montoBanco,
          diferencia: d.diferencia,
          userId: session.user.id,
        })),
      });
    }

    const resultado = await prisma.conciliacion.findUnique({
      where: { id: conciliacion.id },
      include: { cuenta: true, diferencias: true },
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear conciliación" }, { status: 500 });
  }
}