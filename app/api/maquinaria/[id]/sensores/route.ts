import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/[id]/sensores - Obtener sensores y lecturas
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sensores = await prisma.sensorPredictivo.findMany({
      where: { maquinariaId: params.id },
      include: {
        lecturas: {
          orderBy: { timestamp: "desc" },
          take: 20,
        },
      },
      orderBy: { codigoSensor: "asc" },
    });

    // Contar sensores por estado
    const resumen = {
      total: sensores.length,
      normales: sensores.filter((s) => s.estado === "Normal").length,
      alertas: sensores.filter((s) => s.estado === "Alerta").length,
      criticos: sensores.filter((s) => s.estado === "Crítico").length,
    };

    return NextResponse.json({
      sensores,
      resumen,
    });
  } catch (error) {
    console.error("Error al obtener sensores:", error);
    return NextResponse.json({ error: "Error al obtener sensores" }, { status: 500 });
  }
}

// POST /api/maquinaria/[id]/sensores - Registrar lectura de sensor
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      codigoSensor,
      tipoSensor,
      ubicacion,
      valorActual,
      valorMinimo,
      valorMaximo,
      umbralAlerta,
      umbralCritico,
      unidad,
    } = body;

    // Validaciones
    if (!codigoSensor || !tipoSensor || !ubicacion || valorActual === undefined) {
      return NextResponse.json(
        { error: "Campos requeridos: codigoSensor, tipoSensor, ubicacion, valorActual" },
        { status: 400 }
      );
    }

    // Determinar estado basado en umbrales
    let estado = "Normal";
    if (valorActual >= umbralCritico || valorActual <= (valorMinimo || 0)) {
      estado = "Crítico";
    } else if (valorActual >= umbralAlerta) {
      estado = "Alerta";
    }

    // Buscar o crear sensor
    let sensor = await prisma.sensorPredictivo.findUnique({
      where: {
        maquinariaId_codigoSensor: {
          maquinariaId: params.id,
          codigoSensor,
        },
      },
    });

    if (!sensor) {
      // Crear nuevo sensor
      sensor = await prisma.sensorPredictivo.create({
        data: {
          maquinariaId: params.id,
          codigoSensor,
          tipoSensor,
          ubicacion,
          valorActual: parseFloat(valorActual),
          valorMinimo: valorMinimo ? parseFloat(valorMinimo) : 0,
          valorMaximo: valorMaximo ? parseFloat(valorMaximo) : 100,
          umbralAlerta: parseFloat(umbralAlerta),
          umbralCritico: parseFloat(umbralCritico),
          unidad,
          estado,
          ultimaLectura: new Date(),
        },
      });
    } else {
      // Actualizar sensor existente
      sensor = await prisma.sensorPredictivo.update({
        where: { id: sensor.id },
        data: {
          valorActual: parseFloat(valorActual),
          estado,
          ultimaLectura: new Date(),
        },
      });
    }

    // Registrar lectura
    const lectura = await prisma.lecturaSensor.create({
      data: {
        sensorId: sensor.id,
        valor: parseFloat(valorActual),
        estado,
      },
    });

    // Crear alerta si es crítico
    if (estado === "Crítico") {
      await prisma.alertaMantenimiento.create({
        data: {
          maquinariaId: params.id,
          tipo: "Predictivo",
          categoria: tipoSensor,
          prioridad: "Crítica",
          titulo: `Sensor ${tipoSensor} en estado crítico`,
          descripcion: `El sensor ${codigoSensor} (${ubicacion}) registró ${valorActual} ${unidad}, superando el umbral crítico de ${umbralCritico} ${unidad}`,
          sensorAlerta: true,
          estado: "Activa",
        },
      });
    }

    return NextResponse.json(
      {
        sensor,
        lectura,
        alertaCreada: estado === "Crítico",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar sensor:", error);
    return NextResponse.json({ error: "Error al registrar sensor" }, { status: 500 });
  }
}