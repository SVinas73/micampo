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
    const dias = parseInt(searchParams.get("dias") || "30");

    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - dias);

    const alertas = await prisma.alertaClimatica.findMany({
      where: {
        userId: session.user.id,
        fechaInicio: {
          gte: fechaDesde,
        },
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    // Estadísticas
    const totalAlertas = alertas.length;
    const alertasPorTipo = alertas.reduce((acc: any, a) => {
      acc[a.tipo] = (acc[a.tipo] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      alertas,
      estadisticas: {
        total: totalAlertas,
        porTipo: alertasPorTipo,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error al obtener histórico" },
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
      severidad,
      titulo,
      descripcion,
      fechaInicio,
      fechaFin,
      temperatura,
      precipitacion,
      viento,
      humedad,
      ubicacion,
      latitud,
      longitud,
      recomendacion,
    } = await request.json();

    if (!tipo || !titulo || !descripcion || !fechaInicio || !ubicacion) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const alerta = await prisma.alertaClimatica.create({
      data: {
        tipo,
        severidad: severidad || "Media",
        titulo,
        descripcion,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        temperatura: temperatura ? parseFloat(temperatura) : null,
        precipitacion: precipitacion ? parseFloat(precipitacion) : null,
        viento: viento ? parseFloat(viento) : null,
        humedad: humedad ? parseFloat(humedad) : null,
        ubicacion,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        recomendacion: recomendacion || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(alerta, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error al guardar alerta" },
      { status: 500 }
    );
  }
}