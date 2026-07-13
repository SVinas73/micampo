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
    const estado = searchParams.get("estado"); // "activos" | estado exacto
    const animalId = searchParams.get("animalId");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (animalId) where.animalId = animalId;
    if (estado === "activos") where.estado = { in: ["En curso", "En retiro"] };
    else if (estado) where.estado = estado;

    const tratamientos = await prisma.tratamientoSanitario.findMany({
      where,
      include: {
        animal: {
          select: {
            id: true,
            caravana: true,
            nombre: true,
            categoria: true,
            raza: true,
            sexo: true,
            ubicacion: true,
            tropa: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaInicio: "desc" },
    });

    return NextResponse.json(tratamientos);
  } catch (error) {
    console.error("Error al obtener tratamientos:", error);
    return NextResponse.json({ error: "Error al obtener tratamientos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      animalId,
      tipo,
      diagnostico,
      zona,
      sintomas,
      severidad,
      notas,
      medicamento,
      dosis,
      via,
      dosisTotales,
      aplicarPrimeraAhora,
      proximaDosis,
      proximoControl,
      retiroHoras,
      marcaZonas,
      marcaColor,
      fechaInicio,
      responsable,
      costo,
      origenIA,
      protocolo,
    } = await request.json();

    if (!animalId || !diagnostico) {
      return NextResponse.json(
        { error: "Animal y diagnóstico son requeridos" },
        { status: 400 }
      );
    }

    const animal = await prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json({ error: "Animal no encontrado" }, { status: 404 });
    }

    const totales = Math.max(1, parseInt(dosisTotales) || 1);
    const aplicadas = totales === 1 ? 1 : aplicarPrimeraAhora ? 1 : 0;
    const inicio = fechaInicio ? new Date(fechaInicio) : new Date();

    let finRetiro: Date | null = null;
    const horasRetiro = parseInt(retiroHoras) || 0;
    if (horasRetiro > 0 && aplicadas > 0) {
      finRetiro = new Date(inicio.getTime() + horasRetiro * 3600 * 1000);
    }

    const completado = aplicadas >= totales;
    const enRetiro = finRetiro && finRetiro > new Date();
    const estadoTrat = completado ? (enRetiro ? "En retiro" : "Completado") : "En curso";

    const tratamiento = await prisma.tratamientoSanitario.create({
      data: {
        animalId,
        tipo: tipo || "Tratamiento",
        diagnostico,
        zona: zona || null,
        sintomas: sintomas ? JSON.stringify(sintomas) : null,
        severidad: severidad || null,
        notas: notas || null,
        medicamento: medicamento || null,
        dosis: dosis ? String(dosis) : null,
        via: via || null,
        dosisTotales: totales,
        dosisAplicadas: aplicadas,
        proximaDosis: proximaDosis
          ? new Date(proximaDosis)
          : totales > 1 && aplicadas < totales
            ? new Date(inicio.getTime() + 24 * 3600 * 1000)
            : null,
        proximoControl: proximoControl ? new Date(proximoControl) : null,
        retiroHoras: horasRetiro || null,
        finRetiro,
        marcaZonas: Array.isArray(marcaZonas) && marcaZonas.length > 0 ? JSON.stringify(marcaZonas) : null,
        marcaColor: marcaColor || null,
        estado: estadoTrat,
        fechaInicio: inicio,
        fechaFin: completado ? inicio : null,
        responsable: responsable || null,
        costo: costo ? parseFloat(costo) : null,
        origenIA: Boolean(origenIA),
        protocolo: protocolo ? JSON.stringify(protocolo) : null,
        userId: session.user.id,
      },
      include: {
        animal: { select: { caravana: true, nombre: true } },
      },
    });

    // Evento sanitario clásico + evento de vida (timeline)
    await prisma.eventoSanitario.create({
      data: {
        tipo: tipo || "Tratamiento",
        descripcion: `${diagnostico}${medicamento ? ` · ${medicamento}` : ""}`,
        fecha: inicio,
        producto: medicamento || null,
        dosis: dosis ? String(dosis) : null,
        animalId,
        userId: session.user.id,
      },
    });
    await prisma.eventoVida.create({
      data: {
        animalId,
        tipoEvento: "Tratamiento",
        referenciaId: tratamiento.id,
        referenciaModelo: "TratamientoSanitario",
        titulo: `${tipo || "Tratamiento"}: ${diagnostico}`,
        descripcion: medicamento
          ? `${medicamento}${dosis ? ` · ${dosis} ml` : ""}${via ? ` · ${via}` : ""}`
          : null,
        alerta: severidad === "Grave",
        userId: session.user.id,
      },
    });

    return NextResponse.json(tratamiento, { status: 201 });
  } catch (error) {
    console.error("Error al crear tratamiento:", error);
    return NextResponse.json({ error: "Error al crear tratamiento" }, { status: 500 });
  }
}
