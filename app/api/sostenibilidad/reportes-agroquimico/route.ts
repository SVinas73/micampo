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

    const { searchParams } = new URL(req.url);
    const establecimientoId = searchParams.get("establecimientoId");

    if (!establecimientoId) {
      return NextResponse.json(
        { error: "establecimientoId requerido" },
        { status: 400 }
      );
    }

    const reportes = await prisma.reporteAgroquimico.findMany({
      where: { establecimientoId },
      orderBy: { fechaInicio: "desc" },
      include: {
        establecimiento: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({ reportes });
  } catch (error) {
    console.error("Error al obtener reportes:", error);
    return NextResponse.json(
      { error: "Error al obtener reportes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { establecimientoId, periodo, fechaInicio, fechaFin, tipoReporte } = body;

    if (!establecimientoId || !periodo || !fechaInicio || !fechaFin || !tipoReporte) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // ============================================
    // OBTENER TODAS LAS RECETAS DEL PERÍODO
    // ============================================
    const recetas = await prisma.recetaAgronomica.findMany({
      where: {
        establecimientoId,
        fechaEmision: { gte: inicio, lte: fin },
        estado: { in: ["Aprobada", "Aplicada"] },
      },
      include: {
        productos: true,
        lote: true,
      },
    });

    // ============================================
    // PROCESAR PRODUCTOS Y CALCULAR TOTALES
    // ============================================
    const productosMap = new Map();
    let totalLitros = 0;
    let totalKilos = 0;
    let totalHectareas = 0;
    const totalAplicaciones = recetas.length;

    // Contadores por tipo
    let herbicidas = 0;
    let insecticidas = 0;
    let fungicidas = 0;
    let fertilizantes = 0;
    let otros = 0;

    // Contadores por banda toxicológica
    let bandaIa = 0;
    let bandaIb = 0;
    let bandaII = 0;
    let bandaIII = 0;
    let bandaIV = 0;
    let bandaU = 0;

    recetas.forEach((receta) => {
      totalHectareas += receta.hectareas;

      receta.productos.forEach((producto) => {
        // Agrupar productos iguales
        const key = `${producto.nombreComercial}-${producto.ingredienteActivo}`;
        if (!productosMap.has(key)) {
          productosMap.set(key, {
            nombreComercial: producto.nombreComercial,
            ingredienteActivo: producto.ingredienteActivo,
            tipoProducto: producto.tipoProducto,
            bandaToxicologica: producto.bandaToxicologica,
            unidad: producto.unidadDosis,
            cantidad: 0,
          });
        }

        const item = productosMap.get(key);
        item.cantidad += producto.dosisTotal;

        // Sumar a totales según unidad
        if (producto.unidadDosis?.toLowerCase().includes("l")) {
          totalLitros += producto.dosisTotal;
        } else {
          totalKilos += producto.dosisTotal;
        }

        // Clasificar por tipo
        const tipo = producto.tipoProducto?.toLowerCase() || "";
        if (tipo.includes("herbicida")) herbicidas += producto.dosisTotal;
        else if (tipo.includes("insecticida")) insecticidas += producto.dosisTotal;
        else if (tipo.includes("fungicida")) fungicidas += producto.dosisTotal;
        else if (tipo.includes("fertilizante")) fertilizantes += producto.dosisTotal;
        else otros += producto.dosisTotal;

        // Clasificar por banda toxicológica
        switch (producto.bandaToxicologica) {
          case "Ia":
            bandaIa += producto.dosisTotal;
            break;
          case "Ib":
            bandaIb += producto.dosisTotal;
            break;
          case "II":
            bandaII += producto.dosisTotal;
            break;
          case "III":
            bandaIII += producto.dosisTotal;
            break;
          case "IV":
            bandaIV += producto.dosisTotal;
            break;
          case "U":
            bandaU += producto.dosisTotal;
            break;
        }
      });
    });

    const productosDetalle = Array.from(productosMap.values());

    // Crear reporte
    const reporte = await prisma.reporteAgroquimico.create({
      data: {
        establecimientoId,
        periodo,
        fechaInicio: inicio,
        fechaFin: fin,
        tipoReporte,
        totalProductos: productosMap.size,
        totalLitros,
        totalKilos,
        totalHectareas,
        totalAplicaciones,
        productosDetalle,
        herbicidas,
        insecticidas,
        fungicidas,
        fertilizantes,
        otros,
        bandaIa,
        bandaIb,
        bandaII,
        bandaIII,
        bandaIV,
        bandaU,
        estado: "Borrador",
      },
      include: {
        establecimiento: {
          select: {
            nombre: true,
            cuit: true,
          },
        },
      },
    });

    return NextResponse.json(reporte, { status: 201 });
  } catch (error) {
    console.error("Error al crear reporte:", error);
    return NextResponse.json(
      { error: "Error al crear reporte" },
      { status: 500 }
    );
  }
}