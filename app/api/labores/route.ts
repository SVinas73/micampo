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

    // Filtros opcionales por alcance del sidebar.
    const { searchParams } = new URL(request.url);
    const establecimientoId = searchParams.get("establecimientoId");
    const loteId = searchParams.get("loteId");

    const labores = await prisma.labor.findMany({
      where: {
        userId: session.user.id,
        ...(loteId ? { loteId } : {}),
        ...(establecimientoId && establecimientoId !== "todos" ? { lote: { establecimientoId } } : {}),
      },
      include: {
        lote: {
          select: {
            nombre: true,
            hectareas: true,
            cultivo: true,
          },
        },
        maquinaria: {
          select: {
            marca: true,
            modelo: true,
            tipo: true,
          },
        },
        aplicacionesProductos: true,
      },
      orderBy: {
        fecha: "desc",
      },
    });

    // Compatibilidad con el shape anterior (maquina.nombre)
    const result = labores.map((l) => ({
      ...l,
      maquina: l.maquinaria
        ? { nombre: `${l.maquinaria.marca} ${l.maquinaria.modelo}`, tipo: l.maquinaria.tipo }
        : null,
    }));

    return NextResponse.json(result);
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
      costoTotal, // Costo estimado del evento (para propagar a Costos/Economía)
      estado,
      prioridad,
      motivoBloqueo,
    } = await request.json();

    if (!tipo || !fecha || !loteId) {
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
        superficieTrabajada: superficieTrabajada ? parseFloat(superficieTrabajada) : 0,
        descripcion: descripcion || tipo,
        observaciones: observaciones || null,
        estado: estado || "Programada",
        prioridad: prioridad || "Normal",
        motivoBloqueo: motivoBloqueo || null,
        operarios: operarios || null,
        horasTrabajadas: horasTrabajadas ? parseFloat(horasTrabajadas) : null,
        maquinariaId: maquinaId || null,
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

        // REGISTRO ATÓMICO: Descontar stock automáticamente
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

    // Persistir el costo del evento como CostoLote para que llegue a Costos/Economía.
    const costoNum = typeof costoTotal === "number" ? costoTotal : parseFloat(costoTotal);
    if (costoNum && !Number.isNaN(costoNum) && costoNum > 0) {
      await prisma.costoLote.create({
        data: {
          loteId,
          concepto: "Labor",
          descripcion: descripcion || tipo,
          monto: costoNum,
          costoTotal: costoNum,
          fecha: new Date(fecha),
          laborId: labor.id,
          userId: session.user.id,
        },
      });
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
        maquinaria: {
          select: {
            marca: true,
            modelo: true,
            tipo: true,
          },
        },
        aplicacionesProductos: true,
      },
    });

    return NextResponse.json(
      laborCompleta
        ? {
            ...laborCompleta,
            maquina: laborCompleta.maquinaria
              ? {
                  nombre: `${laborCompleta.maquinaria.marca} ${laborCompleta.maquinaria.modelo}`,
                  tipo: laborCompleta.maquinaria.tipo,
                }
              : null,
          }
        : laborCompleta,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear labor:", error);
    return NextResponse.json(
      { error: "Error al crear labor" },
      { status: 500 }
    );
  }
}