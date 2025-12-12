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
    const estado = searchParams.get("estado");

    if (!establecimientoId) {
      return NextResponse.json(
        { error: "establecimientoId requerido" },
        { status: 400 }
      );
    }

    const where: any = { establecimientoId };
    if (estado) {
      where.estado = estado;
    }

    const recetas = await prisma.recetaAgronomica.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
            hectareas: true,
          },
        },
        productos: true,
        labor: {
          select: {
            id: true,
            fecha: true,
            aplicadoPor: true,
          },
        },
        establecimiento: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: { fechaEmision: "desc" },
    });

    // Estadísticas
    const porEstado = {
      pendientes: recetas.filter((r) => r.estado === "Pendiente").length,
      aprobadas: recetas.filter((r) => r.estado === "Aprobada").length,
      aplicadas: recetas.filter((r) => r.estado === "Aplicada").length,
      vencidas: recetas.filter((r) => r.estado === "Vencida").length,
    };

    return NextResponse.json({
      recetas,
      total: recetas.length,
      porEstado,
    });
  } catch (error) {
    console.error("Error al obtener recetas:", error);
    return NextResponse.json(
      { error: "Error al obtener recetas" },
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
    const {
      establecimientoId,
      ingenieroAgronomo,
      matriculaProfesional,
      loteId,
      cultivo,
      hectareas,
      diagnostico,
      productos,
      diasVigencia,
    } = body;

    // Validaciones
    if (
      !establecimientoId ||
      !ingenieroAgronomo ||
      !matriculaProfesional ||
      !cultivo ||
      !diagnostico ||
      !productos ||
      productos.length === 0
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Generar número de receta único
    const año = new Date().getFullYear();
    const ultimaReceta = await prisma.recetaAgronomica.findFirst({
      where: {
        numeroReceta: { startsWith: `RA-${año}-` },
      },
      orderBy: { numeroReceta: "desc" },
    });

    let numeroSecuencia = 1;
    if (ultimaReceta) {
      const match = ultimaReceta.numeroReceta.match(/RA-\d{4}-(\d+)/);
      if (match) {
        numeroSecuencia = parseInt(match[1]) + 1;
      }
    }

    const numeroReceta = `RA-${año}-${numeroSecuencia.toString().padStart(3, "0")}`;

    // Calcular fecha de vencimiento
    const fechaEmision = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + (diasVigencia || 60));

    // Crear receta
    const receta = await prisma.recetaAgronomica.create({
      data: {
        establecimientoId,
        numeroReceta,
        estado: "Pendiente",
        ingenieroAgronomo,
        matriculaProfesional,
        loteId: loteId || null,
        cultivo,
        hectareas: parseFloat(hectareas),
        diagnostico,
        fechaEmision,
        fechaVencimiento,
        productos: {
          create: productos.map((p: any) => ({
            nombreComercial: p.nombreComercial,
            ingredienteActivo: p.ingredienteActivo,
            concentracion: p.concentracion,
            registroSenasa: p.registroSenasa || null,
            dosis: parseFloat(p.dosis),
            unidadDosis: p.unidadDosis,
            dosisTotal: parseFloat(p.dosis) * parseFloat(hectareas),
            bandaToxicologica: p.bandaToxicologica,
            tipoProducto: p.tipoProducto,
          })),
        },
      },
      include: {
        productos: true,
        lote: true,
      },
    });

    return NextResponse.json(receta, { status: 201 });
  } catch (error) {
    console.error("Error al crear receta:", error);
    return NextResponse.json(
      { error: "Error al crear receta" },
      { status: 500 }
    );
  }
}