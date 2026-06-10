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

    const maquinas = await prisma.maquinaria.findMany({
      where: {
        establecimiento: {
          userId: session.user.id,
        },
      },
      include: {
        mantenimientos: {
          orderBy: { fecha: "desc" },
          take: 1,
        },
        _count: {
          select: {
            mantenimientos: true,
            usosMaquinaria: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mantener compatibilidad con el shape anterior (nombre, anio, horasActuales)
    const result = maquinas.map((m) => ({
      ...m,
      nombre: `${m.marca} ${m.modelo}`,
      anio: m.anioFabricacion,
      horasActuales: m.horasMotor,
      _count: {
        mantenimientos: m._count.mantenimientos,
        registrosHoras: m._count.usosMaquinaria,
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al obtener maquinas:", error);
    return NextResponse.json(
      { error: "Error al obtener maquinas" },
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

    const { nombre, tipo, marca, modelo, anio, horasActuales } = await request.json();

    if (!nombre || !tipo) {
      return NextResponse.json(
        { error: "Nombre y tipo son requeridos" },
        { status: 400 }
      );
    }

    // Maquinaria requiere un establecimiento: usar el primero del usuario o crearlo
    let establecimiento = await prisma.establecimiento.findFirst({
      where: { userId: session.user.id },
    });

    if (!establecimiento) {
      establecimiento = await prisma.establecimiento.create({
        data: {
          nombre: "Establecimiento Principal",
          userId: session.user.id,
        },
      });
    }

    const maquina = await prisma.maquinaria.create({
      data: {
        codigo: `MAQ-${Date.now()}`,
        tipo,
        marca: marca || nombre,
        modelo: modelo || "",
        anioFabricacion: anio ? parseInt(anio) : null,
        horasMotor: horasActuales ? parseFloat(horasActuales) : 0,
        establecimientoId: establecimiento.id,
      },
    });

    return NextResponse.json(
      {
        ...maquina,
        nombre: `${maquina.marca} ${maquina.modelo}`,
        anio: maquina.anioFabricacion,
        horasActuales: maquina.horasMotor,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear maquina:", error);
    return NextResponse.json(
      { error: "Error al crear maquina" },
      { status: 500 }
    );
  }
}
