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

    const productos = await prisma.producto.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        ubicaciones: {
          include: {
            lote: {
              select: {
                nombre: true,
              },
            },
          },
        },
        _count: {
          select: {
            transferencias: true,
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
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

    const { nombre, categoria, unidad, stockMinimo, ubicacionInicial, cantidadInicial } = await request.json();

    if (!nombre || !categoria || !unidad) {
      return NextResponse.json(
        { error: "Nombre, categoría y unidad son requeridos" },
        { status: 400 }
      );
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        categoria,
        unidad,
        stockMinimo: stockMinimo ? parseFloat(stockMinimo) : 0,
        userId: session.user.id,
      },
    });

    // Crear ubicación inicial si se proporciona
    if (ubicacionInicial && cantidadInicial) {
      await prisma.ubicacionProducto.create({
        data: {
          productoId: producto.id,
          ubicacion: ubicacionInicial,
          cantidad: parseFloat(cantidadInicial),
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}