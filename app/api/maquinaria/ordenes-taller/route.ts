import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/ordenes-taller - Listar órdenes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const prioridad = searchParams.get("prioridad");

    const ordenes = await prisma.ordenTaller.findMany({
      where: {
        maquinaria: {
          establecimiento: {
            // Agregar filtro por usuario si tu modelo lo requiere
          },
        },
        ...(estado && { estado }),
        ...(prioridad && { prioridad }),
      },
      include: {
        maquinaria: {
          select: {
            codigo: true,
            tipo: true,
            marca: true,
            modelo: true,
          },
        },
        repuestos: true,
        manoObra: true,
        _count: {
          select: {
            repuestos: true,
            manoObra: true,
          },
        },
      },
      orderBy: { fechaIngreso: "desc" },
    });

    // Resumen
    const resumen = {
      total: ordenes.length,
      ingresadas: ordenes.filter((o) => o.estado === "Ingresada").length,
      enProceso: ordenes.filter((o) => o.estado === "En Proceso").length,
      esperandoRepuestos: ordenes.filter((o) => o.estado === "Esperando Repuestos")
        .length,
      completadas: ordenes.filter((o) => o.estado === "Completada").length,
      costoTotal: ordenes.reduce((acc, o) => acc + o.costoTotal, 0),
    };

    return NextResponse.json({
      ordenes,
      resumen,
    });
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

// POST /api/maquinaria/ordenes-taller - Crear orden
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      maquinariaId,
      tipo,
      categoria,
      prioridad,
      descripcionFalla,
      mecanicoAsignado,
      horasMotorIngreso,
      fechaEstimada,
    } = body;

    // Validaciones
    if (
      !maquinariaId ||
      !tipo ||
      !categoria ||
      !prioridad ||
      !descripcionFalla
    ) {
      return NextResponse.json(
        {
          error:
            "Campos requeridos: maquinariaId, tipo, categoria, prioridad, descripcionFalla",
        },
        { status: 400 }
      );
    }

    // Generar número de orden
    const ultimaOrden = await prisma.ordenTaller.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const anio = new Date().getFullYear();
    const numero = ultimaOrden
      ? parseInt(ultimaOrden.numeroOrden.split("-")[2]) + 1
      : 1;
    const numeroOrden = `OT-${anio}-${numero.toString().padStart(3, "0")}`;

    // Obtener horas motor actuales si no se proporcionan
    let horasMotor = horasMotorIngreso;
    if (!horasMotor) {
      const maquinaria = await prisma.maquinaria.findUnique({
        where: { id: maquinariaId },
        select: { horasMotor: true },
      });
      horasMotor = maquinaria?.horasMotor || 0;
    }

    const orden = await prisma.ordenTaller.create({
      data: {
        numeroOrden,
        maquinariaId,
        tipo,
        categoria,
        prioridad,
        descripcionFalla,
        mecanicoAsignado,
        horasMotorIngreso: horasMotor,
        fechaEstimada: fechaEstimada ? new Date(fechaEstimada) : null,
        estado: "Ingresada",
      },
      include: {
        maquinaria: {
          select: {
            codigo: true,
            tipo: true,
            marca: true,
            modelo: true,
          },
        },
      },
    });

    // Actualizar estado de maquinaria
    await prisma.maquinaria.update({
      where: { id: maquinariaId },
      data: { estado: "Mantenimiento" },
    });

    return NextResponse.json(orden, { status: 201 });
  } catch (error) {
    console.error("Error al crear orden:", error);
    return NextResponse.json({ error: "Error al crear orden" }, { status: 500 });
  }
}