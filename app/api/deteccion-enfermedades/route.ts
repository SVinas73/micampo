import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Lista las alertas de plagas/enfermedades del usuario.
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const establecimientoId = new URL(request.url).searchParams.get("establecimientoId");

    const alertas = await prisma.alertaPlaga.findMany({
      where: {
        userId: session.user.id,
        ...(establecimientoId && establecimientoId !== "todos" ? { lote: { establecimientoId } } : {}),
      },
      include: { lote: { select: { nombre: true, cultivo: true } } },
      orderBy: { fechaDeteccion: "desc" },
      take: 50,
    });

    return NextResponse.json(alertas);
  } catch (error) {
    console.error("Error al obtener alertas de detección:", error);
    return NextResponse.json({ error: "Error al obtener alertas" }, { status: 500 });
  }
}

// Crea una alerta (la usa el modal "Reportar Plaga o Enfermedad").
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { loteId, plaga, tipo, severidad, incidencia, observaciones, metodoDeteccion, imagenUrl } = body;

    if (!loteId || !plaga) {
      return NextResponse.json({ error: "Lote y plaga son requeridos" }, { status: 400 });
    }

    const lote = await prisma.lote.findUnique({ where: { id: loteId } });
    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    const sev: string = severidad || (incidencia >= 50 ? "Alta" : incidencia >= 20 ? "Media" : "Baja");

    const alerta = await prisma.alertaPlaga.create({
      data: {
        loteId,
        plaga,
        tipo: tipo || "Hongo",
        severidad: sev,
        confianza: 90,
        metodoDeteccion: metodoDeteccion || "Manual",
        imagenUrl: imagenUrl || null,
        sintomas: observaciones || null,
        areaAfectada: incidencia ? Number(incidencia) : null,
        recomendacion: body.recomendacion || "Monitoreo y evaluación agronómica",
        userId: session.user.id,
      },
      include: { lote: { select: { nombre: true, cultivo: true } } },
    });

    return NextResponse.json(alerta, { status: 201 });
  } catch (error) {
    console.error("Error al crear alerta de detección:", error);
    return NextResponse.json({ error: "Error al crear alerta" }, { status: 500 });
  }
}
