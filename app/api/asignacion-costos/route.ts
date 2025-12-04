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
    const destinoId = searchParams.get("destinoId");

    const where: any = { userId: session.user.id };
    if (destinoId) where.destinoId = destinoId;

    const asignaciones = await prisma.asignacionCosto.findMany({
      where,
      include: {
        comprobante: {
          select: {
            numero: true,
            fecha: true,
            razonSocial: true,
            tipo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(asignaciones);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener asignaciones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const asignacion = await prisma.asignacionCosto.create({
      data: {
        comprobanteId: data.comprobanteId,
        tipoDestino: data.tipoDestino,
        destinoId: data.destinoId,
        destinoNombre: data.destinoNombre,
        monto: data.monto,
        porcentaje: data.porcentaje,
        tipoCosto: data.tipoCosto,
        categoria: data.categoria,
        userId: session.user.id,
      },
    });

    // Actualizar CostoLote o CostoAnimal según corresponda
    if (data.tipoDestino === "Lote" && data.destinoId) {
      const costoExistente = await prisma.costoLote.findFirst({
        where: {
          loteId: data.destinoId,
          userId: session.user.id,
        },
      });

      if (costoExistente) {
        await prisma.costoLote.update({
          where: { id: costoExistente.id },
          data: {
            costoTotal: {
              increment: data.monto,
            },
          },
        });
      } else {
        await prisma.costoLote.create({
          data: {
            loteId: data.destinoId,
            concepto: data.categoria,
            descripcion: `Costo asignado desde comprobante`,
            monto: data.monto,
            fecha: new Date(),
            userId: session.user.id,
          },
        });
      }
    } else if (data.tipoDestino === "Animal" && data.destinoId) {
      const costoExistente = await prisma.costoAnimal.findFirst({
        where: {
          animalId: data.destinoId,
          userId: session.user.id,
        },
      });

      if (costoExistente) {
        await prisma.costoAnimal.update({
          where: { id: costoExistente.id },
          data: {
            costoTotal: {
              increment: data.monto,
            },
          },
        });
      } else {
        await prisma.costoLote.create({
          data: {
            loteId: data.destinoId,
            concepto: data.categoria,
            descripcion: `Costo asignado desde comprobante`,
            monto: data.monto,
            fecha: new Date(),
            userId: session.user.id,
          },
        });
      }
    }

    return NextResponse.json(asignacion, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear asignación" }, { status: 500 });
  }
}