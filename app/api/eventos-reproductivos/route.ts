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

    const eventos = await prisma.eventoReproductivo.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
            raza: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(eventos);
  } catch (error) {
    console.error("Error al obtener eventos reproductivos:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos reproductivos" },
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

    const {
      tipo,
      fecha,
      animalId,
      tipoServicio,
      toroId,
      semenId,
      resultado,
      diasGestacion,
      numCrias,
      condicionParto,
      crias,
      observaciones,
    } = await request.json();

    if (!tipo || !fecha || !animalId) {
      return NextResponse.json(
        { error: "Tipo, fecha y animal son requeridos" },
        { status: 400 }
      );
    }

    // Crear evento
    const evento = await prisma.eventoReproductivo.create({
      data: {
        tipo,
        fecha: new Date(fecha),
        animalId,
        tipoServicio: tipoServicio || null,
        toroId: toroId || null,
        semenId: semenId || null,
        resultado: resultado || null,
        diasGestacion: diasGestacion ? parseInt(diasGestacion) : null,
        numCrias: numCrias ? parseInt(numCrias) : null,
        condicionParto: condicionParto || null,
        crias: crias || null,
        observaciones: observaciones || null,
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
            raza: true,
          },
        },
      },
    });

    // Actualizar o crear historial reproductivo
    const historial = await prisma.historialReproductivo.upsert({
      where: {
        animalId: animalId,
      },
      create: {
        animalId: animalId,
        userId: session.user.id,
      },
      update: {},
    });

    // Actualizar historial según tipo de evento
    if (tipo === "Parto") {
      await prisma.historialReproductivo.update({
        where: { animalId: animalId },
        data: {
          totalPartos: { increment: 1 },
          totalCriasNacidas: { increment: numCrias || 1 },
          totalCriasVivas: { increment: numCrias || 1 },
          ultimoParto: new Date(fecha),
          estadoActual: "Vacía",
          fechaEsperadaParto: null,
        },
      });
    } else if (tipo === "Servicio") {
      await prisma.historialReproductivo.update({
        where: { animalId: animalId },
        data: {
          ultimoServicio: new Date(fecha),
          estadoActual: "En Servicio",
        },
      });
    } else if (tipo === "Diagnostico" && resultado === "Preñada") {
      const fechaParto = new Date(fecha);
      fechaParto.setDate(fechaParto.getDate() + (283 - (diasGestacion || 0))); // 283 días gestación promedio
      
      await prisma.historialReproductivo.update({
        where: { animalId: animalId },
        data: {
          ultimoDiagnostico: new Date(fecha),
          estadoActual: "Preñada",
          fechaEsperadaParto: fechaParto,
        },
      });
    } else if (tipo === "Diagnostico" && resultado === "Vacía") {
      await prisma.historialReproductivo.update({
        where: { animalId: animalId },
        data: {
          ultimoDiagnostico: new Date(fecha),
          estadoActual: "Vacía",
        },
      });
    } else if (tipo === "Celo") {
      await prisma.historialReproductivo.update({
        where: { animalId: animalId },
        data: {
          estadoActual: "En Celo",
        },
      });
    } else if (tipo === "Aborto") {
      await prisma.historialReproductivo.update({
        where: { animalId: animalId },
        data: {
          estadoActual: "Vacía",
          fechaEsperadaParto: null,
        },
      });
    }

    return NextResponse.json(evento, { status: 201 });
  } catch (error) {
    console.error("Error al crear evento reproductivo:", error);
    return NextResponse.json(
      { error: "Error al crear evento reproductivo" },
      { status: 500 }
    );
  }
}