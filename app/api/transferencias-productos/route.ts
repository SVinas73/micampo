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

    const transferencias = await prisma.transferenciaProducto.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        producto: {
          select: {
            nombre: true,
            unidad: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(transferencias);
  } catch (error) {
    console.error("Error al obtener transferencias:", error);
    return NextResponse.json(
      { error: "Error al obtener transferencias" },
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

    const { productoId, origenUbicacion, destinoUbicacion, cantidad, fecha, motivo, responsable } = await request.json();

    if (!productoId || !origenUbicacion || !destinoUbicacion || !cantidad || !fecha) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const cantidadNum = parseFloat(cantidad);

    // Verificar stock en origen
    const ubicacionOrigen = await prisma.ubicacionProducto.findFirst({
      where: {
        productoId,
        ubicacion: origenUbicacion,
        userId: session.user.id,
      },
    });

    if (!ubicacionOrigen || ubicacionOrigen.cantidad < cantidadNum) {
      return NextResponse.json(
        { error: "Stock insuficiente en origen" },
        { status: 400 }
      );
    }

    // Crear transferencia
    const transferencia = await prisma.transferenciaProducto.create({
      data: {
        productoId,
        origenUbicacion,
        destinoUbicacion,
        cantidad: cantidadNum,
        fecha: new Date(fecha),
        motivo: motivo || null,
        responsable: responsable || null,
        userId: session.user.id,
      },
      include: {
        producto: {
          select: {
            nombre: true,
            unidad: true,
          },
        },
      },
    });

    // Actualizar stock en origen
    await prisma.ubicacionProducto.update({
      where: { id: ubicacionOrigen.id },
      data: {
        cantidad: {
          decrement: cantidadNum,
        },
      },
    });

    // Actualizar o crear stock en destino
    const ubicacionDestino = await prisma.ubicacionProducto.findFirst({
      where: {
        productoId,
        ubicacion: destinoUbicacion,
        userId: session.user.id,
      },
    });

    if (ubicacionDestino) {
      await prisma.ubicacionProducto.update({
        where: { id: ubicacionDestino.id },
        data: {
          cantidad: {
            increment: cantidadNum,
          },
        },
      });
    } else {
      await prisma.ubicacionProducto.create({
        data: {
          productoId,
          ubicacion: destinoUbicacion,
          cantidad: cantidadNum,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(transferencia, { status: 201 });
  } catch (error) {
    console.error("Error al crear transferencia:", error);
    return NextResponse.json(
      { error: "Error al crear transferencia" },
      { status: 500 }
    );
  }
}