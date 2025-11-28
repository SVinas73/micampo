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
      productos, // Array de productos aplicados
    } = await request.json();

    if (!tipo || !fecha || !loteId || !superficieTrabajada || !descripcion) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
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
    });

    // Si hay productos aplicados, crearlos Y descontar stock automáticamente
    if (productos && Array.isArray(productos) && productos.length > 0) {
      for (const prod of productos) {
        // Crear aplicación de producto
        await prisma.aplicacionProducto.create({
          data: {
            laborId: labor.id,
            tipoProducto: prod.tipoProducto,
            nombreProducto: prod.nombreProducto,
            principioActivo: prod.principioActivo || null,
            dosis: parseFloat(prod.dosis),
            unidadDosis: prod.unidadDosis,
            metodoAplicacion: prod.metodoAplicacion || null,
            userId: session.user.id,
          },
        });

        // 🔥 REGISTRO ATÓMICO: Descontar stock automáticamente
        if (prod.productoId && prod.ubicacionId) {
          const cantidadTotal = parseFloat(prod.dosis) * parseFloat(superficieTrabajada);

          // Buscar la ubicación del producto
          const ubicacion = await prisma.ubicacionProducto.findFirst({
            where: {
              id: prod.ubicacionId,
              productoId: prod.productoId,
              userId: session.user.id,
            },
          });

          if (ubicacion) {
            // Validar que haya suficiente stock
            if (ubicacion.cantidad >= cantidadTotal) {
              // Descontar stock
              await prisma.ubicacionProducto.update({
                where: { id: ubicacion.id },
                data: {
                  cantidad: ubicacion.cantidad - cantidadTotal,
                },
              });

              // Registrar la transferencia como "Uso en Labor"
              await prisma.transferenciaProducto.create({
                data: {
                  productoId: prod.productoId,
                  origenUbicacion: ubicacion.ubicacion,
                  destinoUbicacion: `Aplicado en ${labor.descripcion}`,
                  cantidad: cantidadTotal,
                  fecha: new Date(fecha),
                  motivo: "Descuento automático por labor",
                  responsable: operarios || "Sistema",
                  userId: session.user.id,
                },
              });
            } else {
              // Si no hay stock suficiente, advertir pero continuar
              console.warn(
                `Stock insuficiente para ${prod.nombreProducto}: disponible ${ubicacion.cantidad}, requerido ${cantidadTotal}`
              );
            }
          }
        }
      }
    }

    // Retornar labor completa
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