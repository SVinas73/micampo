import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/[id]/alertas - Listar alertas
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

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") || "Activa";

    const alertas = await prisma.alertaMantenimiento.findMany({
      where: {
        maquinariaId: params.id,
        ...(estado !== "Todas" && { estado }),
      },
      orderBy: [{ prioridad: "desc" }, { fechaCreacion: "desc" }],
    });

    // Agrupar por prioridad
    const agrupadas = {
      criticas: alertas.filter((a) => a.prioridad === "Crítica"),
      altas: alertas.filter((a) => a.prioridad === "Alta"),
      medias: alertas.filter((a) => a.prioridad === "Media"),
      bajas: alertas.filter((a) => a.prioridad === "Baja"),
    };

    return NextResponse.json({
      alertas,
      resumen: {
        total: alertas.length,
        criticas: agrupadas.criticas.length,
        altas: agrupadas.altas.length,
        medias: agrupadas.medias.length,
        bajas: agrupadas.bajas.length,
      },
      agrupadas,
    });
  } catch (error) {
    console.error("Error al obtener alertas:", error);
    return NextResponse.json({ error: "Error al obtener alertas" }, { status: 500 });
  }
}

// POST /api/maquinaria/[id]/alertas - Crear alerta
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
      tipo,
      categoria,
      prioridad,
      titulo,
      descripcion,
      horasMotorAlerta,
      fechaAlerta,
      sensorAlerta,
    } = body;

    // Validaciones
    if (!tipo || !categoria || !prioridad || !titulo || !descripcion) {
      return NextResponse.json(
        {
          error:
            "Campos requeridos: tipo, categoria, prioridad, titulo, descripcion",
        },
        { status: 400 }
      );
    }

    const alerta = await prisma.alertaMantenimiento.create({
      data: {
        maquinariaId: params.id,
        tipo,
        categoria,
        prioridad,
        titulo,
        descripcion,
        horasMotorAlerta: horasMotorAlerta ? parseFloat(horasMotorAlerta) : null,
        fechaAlerta: fechaAlerta ? new Date(fechaAlerta) : null,
        sensorAlerta: sensorAlerta || false,
        estado: "Activa",
      },
    });

    return NextResponse.json(alerta, { status: 201 });
  } catch (error) {
    console.error("Error al crear alerta:", error);
    return NextResponse.json({ error: "Error al crear alerta" }, { status: 500 });
  }
}