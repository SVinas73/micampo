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

    const { searchParams } = new URL(request.url);
    const empleadoId = searchParams.get("empleadoId");
    const estado = searchParams.get("estado");

    const where: any = { userId: session.user.id };
    if (empleadoId) where.empleadoId = empleadoId;
    if (estado) where.estado = estado;

    const tareas = await prisma.tareaEmpleado.findMany({
      where,
      include: {
        empleado: {
          select: { nombre: true, apellido: true, cargo: true },
        },
      },
      orderBy: { fechaVencimiento: "asc" },
    });

    return NextResponse.json(tareas);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const tarea = await prisma.tareaEmpleado.create({
      data: {
        empleadoId: data.empleadoId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        prioridad: data.prioridad || "Media",
        fechaVencimiento: data.fechaVencimiento,
        loteId: data.loteId,
        ubicacion: data.ubicacion,
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    return NextResponse.json(tarea, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear tarea" }, { status: 500 });
  }
}