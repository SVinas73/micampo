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

    const labores = await prisma.labor.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
            hectareas: true,
          },
        },
        maquina: {
          select: {
            nombre: true,
          },
        },
        aplicacionesProductos: true,
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(labores);
  } catch (error) {
    console.error("Error al obtener labores:", error);
    return NextResponse.json(
      { error: "Error al obtener labores" },
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

    const {
      tipo,
      fecha,
      loteId,
      superficieTrabajada,
      descripcion,
      observaciones,
      operarios,
      horasTrabajadas,
      maquinaId,
      productos,
    } = await request.json();

    if (!tipo || !fecha || !loteId || !superficieTrabajada || !descripcion) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios son requeridos" },
        { status: 400 }
      );
    }

    // Crear labor
    const labor = await prisma.labor.create({
      data: {
        tipo,
        fecha: new Date(fecha),
        loteId,
        superficieTrabajada: parseFloat(superficieTrabajada),
        descripcion,
        observaciones: observaciones || null,
        operarios: operarios || null,
        horasTrabajadas: horasTrabajadas ? parseFloat(horasTrabajadas) : null,
        maquinaId: maquinaId || null,
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
        maquina: {
          select: {
            nombre: true,
          },
        },
      },
    });

    // Crear aplicaciones de productos si existen
    if (productos && productos.length > 0) {
      await prisma.aplicacionProducto.createMany({
        data: productos.map((p: any) => ({
          laborId: labor.id,
          tipoProducto: p.tipoProducto,
          nombreProducto: p.nombreProducto,
          principioActivo: p.principioActivo || null,
          dosis: parseFloat(p.dosis),
          unidadDosis: p.unidadDosis,
          metodoAplicacion: p.metodoAplicacion || null,
          userId: session.user.id,
        })),
      });
    }

    // Retornar labor con productos
    const laborCompleta = await prisma.labor.findUnique({
      where: { id: labor.id },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
        maquina: {
          select: {
            nombre: true,
          },
        },
        aplicacionesProductos: true,
      },
    });

    return NextResponse.json(laborCompleta, { status: 201 });
  } catch (error) {
    console.error("Error al crear labor:", error);
    return NextResponse.json(
      { error: "Error al crear labor" },
      { status: 500 }
    );
  }
}