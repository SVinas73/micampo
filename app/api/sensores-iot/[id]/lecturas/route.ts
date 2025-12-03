import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }  // ← También arreglá esto para Next.js 15
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;  // ← AWAIT params

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sensor = await prisma.sensorIoT.findUnique({
      where: { id: params.id },
    });

    if (!sensor || sensor.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sensor no encontrado" },
        { status: 404 }
      );
    }

    const { valor, calidad, bateria, senal } = await request.json();  // ← Cambio 1: senal

    if (valor === undefined) {
      return NextResponse.json(
        { error: "Valor es requerido" },
        { status: 400 }
      );
    }

    const lectura = await prisma.lecturaSensor.create({
      data: {
        sensorId: params.id,
        valor: parseFloat(valor),
        unidad: sensor.unidad || "",
        calidad: calidad || null,
        bateria: bateria ? parseFloat(bateria) : null,
        senal: senal ? parseFloat(senal) : null,  // ← Cambio 2: senal
        userId: session.user.id,
      },
    });

    // Actualizar última lectura del sensor
    await prisma.sensorIoT.update({
      where: { id: params.id },
      data: {
        ultimaLectura: new Date(),
        ultimoValor: parseFloat(valor),
      },
    });

    return NextResponse.json(lectura, { status: 201 });
  } catch (error) {
    console.error("Error al crear lectura:", error);
    return NextResponse.json(
      { error: "Error al registrar lectura" },
      { status: 500 }
    );
  }
}