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
    const estado = searchParams.get("estado");
    const area = searchParams.get("area");

    const where: any = { userId: session.user.id };
    if (estado) where.estado = estado;
    if (area) where.area = area;

    const empleados = await prisma.empleado.findMany({
      where,
      include: {
        registrosHoras: {
          orderBy: { fecha: "desc" },
          take: 30,
        },
        pagos: {
          orderBy: { periodo: "desc" },
          take: 12,
        },
        tareas: {
          where: { estado: { not: "Completada" } },
        },
      },
      orderBy: { apellido: "asc" },
    });

    return NextResponse.json(empleados);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener empleados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    const empleado = await prisma.empleado.create({
      data: {
        legajo: data.legajo,
        nombre: data.nombre,
        apellido: data.apellido,
        documento: data.documento,
        fechaNacimiento: data.fechaNacimiento,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        cargo: data.cargo,
        area: data.area,
        fechaIngreso: data.fechaIngreso,
        tipoContrato: data.tipoContrato,
        salarioBase: data.salarioBase,
        moneda: data.moneda || "USD",
        aguinaldo: data.aguinaldo !== false,
        salarioVacacional: data.salarioVacacional !== false,
        observaciones: data.observaciones,
        userId: session.user.id,
      },
    });

    return NextResponse.json(empleado, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear empleado" }, { status: 500 });
  }
}