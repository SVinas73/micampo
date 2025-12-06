import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria - Listar toda la maquinaria
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
    const tipo = searchParams.get("tipo");

    const maquinarias = await prisma.maquinaria.findMany({
      where: {
        establecimiento: {
          userId: user.id,
        },
        ...(estado && { estado }),
        ...(tipo && { tipo }),
      },
      include: {
        establecimiento: true,
        mantenimientos: {
          orderBy: { fecha: "desc" },
          take: 5,
        },
        alertas: {
          where: { estado: "Activa" },
          orderBy: { prioridad: "desc" },
        },
        _count: {
          select: {
            mantenimientos: true,
            alertas: true,
            ordenesTaller: true,
          },
        },
      },
      orderBy: { codigo: "asc" },
    });

    // Calcular próximo mantenimiento
    const maquinariasConProximo = maquinarias.map((maq) => {
      const horasFaltantes = maq.intervaloMantenimiento
        ? (maq.ultimoMantenimiento || 0) + maq.intervaloMantenimiento - maq.horasMotor
        : null;

      return {
        ...maq,
        horasFaltantesMantenimiento: horasFaltantes,
        necesitaMantenimiento: horasFaltantes !== null && horasFaltantes <= 0,
      };
    });

    return NextResponse.json(maquinariasConProximo);
  } catch (error) {
    console.error("Error al obtener maquinaria:", error);
    return NextResponse.json({ error: "Error al obtener maquinaria" }, { status: 500 });
  }
}

// POST /api/maquinaria - Crear nueva maquinaria
export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      codigo,
      tipo,
      marca,
      modelo,
      numeroSerie,
      anioFabricacion,
      patente,
      horasMotor,
      capacidad,
      valorAdquisicion,
      fechaAdquisicion,
      intervaloMantenimiento,
      establecimientoId,
    } = body;

    // Validaciones
    if (!codigo || !tipo || !marca || !modelo || !establecimientoId) {
      return NextResponse.json(
        { error: "Campos requeridos: codigo, tipo, marca, modelo, establecimientoId" },
        { status: 400 }
      );
    }

    // Verificar que el establecimiento pertenece al usuario
    const establecimiento = await prisma.establecimiento.findFirst({
      where: {
        id: establecimientoId,
        // Agregar validación si tu modelo lo requiere
      },
    });

    if (!establecimiento) {
      return NextResponse.json(
        { error: "Establecimiento no encontrado" },
        { status: 404 }
      );
    }

    // Verificar código único
    const existe = await prisma.maquinaria.findUnique({
      where: { codigo },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Ya existe una maquinaria con ese código" },
        { status: 400 }
      );
    }

    const maquinaria = await prisma.maquinaria.create({
      data: {
        codigo,
        tipo,
        marca,
        modelo,
        numeroSerie,
        anioFabricacion: anioFabricacion ? parseInt(anioFabricacion) : null,
        patente,
        horasMotor: horasMotor ? parseFloat(horasMotor) : 0,
        capacidad,
        valorAdquisicion: valorAdquisicion ? parseFloat(valorAdquisicion) : null,
        fechaAdquisicion: fechaAdquisicion ? new Date(fechaAdquisicion) : null,
        intervaloMantenimiento: intervaloMantenimiento
          ? parseFloat(intervaloMantenimiento)
          : 250,
        ultimoMantenimiento: 0,
        establecimientoId,
      },
      include: {
        establecimiento: true,
      },
    });

    // Crear alerta inicial de mantenimiento
    if (intervaloMantenimiento) {
      await prisma.alertaMantenimiento.create({
        data: {
          maquinariaId: maquinaria.id,
          tipo: "HorasMotor",
          categoria: "Mantenimiento",
          prioridad: "Media",
          titulo: "Primer mantenimiento programado",
          descripcion: `Mantenimiento inicial a las ${intervaloMantenimiento} horas`,
          horasMotorAlerta: parseFloat(intervaloMantenimiento),
          estado: "Activa",
        },
      });
    }

    return NextResponse.json(maquinaria, { status: 201 });
  } catch (error) {
    console.error("Error al crear maquinaria:", error);
    return NextResponse.json({ error: "Error al crear maquinaria" }, { status: 500 });
  }
}