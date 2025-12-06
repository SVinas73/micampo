import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const establecimientoId = searchParams.get("establecimientoId");

    if (!establecimientoId) {
      return NextResponse.json(
        { error: "establecimientoId requerido" },
        { status: 400 }
      );
    }

    const declaraciones = await prisma.complianceEUDR.findMany({
      where: { establecimientoId },
      orderBy: { createdAt: "desc" },
      include: {
        establecimiento: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({ declaraciones });
  } catch (error) {
    console.error("Error al obtener declaraciones EUDR:", error);
    return NextResponse.json(
      { error: "Error al obtener declaraciones EUDR" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      establecimientoId,
      producto,
      codigoHS,
      volumenToneladas,
      destinoExportacion,
      loteIds,
      sinDeforestacion,
    } = body;

    if (
      !establecimientoId ||
      !producto ||
      !volumenToneladas ||
      !destinoExportacion ||
      !loteIds ||
      loteIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Generar número de declaración
    const año = new Date().getFullYear();
    const ultimaDeclaracion = await prisma.complianceEUDR.findFirst({
      where: {
        numeroDeclaracion: { startsWith: `EUDR-${año}-` },
      },
      orderBy: { numeroDeclaracion: "desc" },
    });

    let numeroSecuencia = 1;
    if (ultimaDeclaracion) {
      const match = ultimaDeclaracion.numeroDeclaracion.match(/EUDR-\d{4}-(\d+)/);
      if (match) {
        numeroSecuencia = parseInt(match[1]) + 1;
      }
    }

    const numeroDeclaracion = `EUDR-${año}-${numeroSecuencia
      .toString()
      .padStart(3, "0")}`;

    // Obtener información de los lotes
    const lotes = await prisma.lote.findMany({
      where: {
        id: { in: loteIds },
      },
      select: {
        id: true,
        nombre: true,
        hectareas: true,
        centroLatitud: true,
        centroLongitud: true,
      },
    });

    // Calcular área total
    const areaHectareas = lotes.reduce((acc, lote) => acc + lote.hectareas, 0);

    // Calcular coordenadas centrales (centroide simple)
    const latPromedio = lotes.reduce((acc, l) => acc + (l.centroLatitud || 0), 0) / lotes.length;
    const longPromedio = lotes.reduce((acc, l) => acc + (l.centroLongitud || 0), 0) / lotes.length;
    const coordenadasCentrales = `${latPromedio.toFixed(6)}, ${longPromedio.toFixed(
      6
    )}`;

    // Crear GeoJSON simplificado (en producción usar polígonos reales)
    const geometriaGeoJSON = {
      type: "FeatureCollection",
      features: lotes.map((lote) => ({
        type: "Feature",
        properties: {
          id: lote.id,
          nombre: lote.nombre,
          hectareas: lote.hectareas,
        },
        geometry: {
          type: "Point",
          coordinates: [lote.centroLongitud, lote.centroLatitud],
        },
      })),
    };

    // Crear declaración
    const declaracion = await prisma.complianceEUDR.create({
      data: {
        establecimientoId,
        numeroDeclaracion,
        producto,
        codigoHS: codigoHS || null,
        volumenToneladas: parseFloat(volumenToneladas),
        destinoExportacion,
        loteIds,
        geometriaGeoJSON,
        coordenadasCentrales,
        areaHectareas,
        sinDeforestacion: sinDeforestacion || false,
        estado: "En Preparación",
        nivelRiesgo: "Bajo", // Placeholder - calcular según algoritmo
      },
    });

    return NextResponse.json(declaracion, { status: 201 });
  } catch (error) {
    console.error("Error al crear declaración EUDR:", error);
    return NextResponse.json(
      { error: "Error al crear declaración EUDR" },
      { status: 500 }
    );
  }
}