import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Sentinel Hub gratuito con límites
const SENTINEL_HUB_URL = "https://services.sentinel-hub.com/ogc/wms";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { loteId, fecha, tipoIndice } = await request.json();

    if (!loteId || !fecha) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Obtener lote con coordenadas
    const lote = await prisma.lote.findUnique({
      where: { id: loteId },
    });

    if (!lote || lote.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    if (!lote.coordenadas) {
      return NextResponse.json(
        { error: "El lote no tiene coordenadas georreferenciadas" },
        { status: 400 }
      );
    }

    // Parsear coordenadas
    const geoJSON = JSON.parse(lote.coordenadas);
    const coords = geoJSON.geometry.coordinates[0];

    // Calcular bounding box
    const lons = coords.map((c: number[]) => c[0]);
    const lats = coords.map((c: number[]) => c[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Generar URL de Sentinel Hub (requiere configuración adicional)
    // Por ahora, simulamos con URLs de ejemplo
    const urlImagen = `https://services.sentinel-hub.com/ogc/wms/...?BBOX=${minLon},${minLat},${maxLon},${maxLat}`;

    // Simular análisis NDVI
    const ndviPromedio = 0.65 + Math.random() * 0.2; // 0.65 - 0.85
    const ndviMin = ndviPromedio - 0.15;
    const ndviMax = ndviPromedio + 0.15;
    const areaVerde = 75 + Math.random() * 20; // 75% - 95%
    const areaProblema = 5 + Math.random() * 10; // 5% - 15%

    // Crear registro
    const imagen = await prisma.imagenSatelital.create({
      data: {
        loteId,
        fecha: new Date(fecha),
        fuente: "Sentinel-2",
        tipoIndice: tipoIndice || "NDVI",
        urlImagen,
        nubosidad: Math.random() * 20, // 0-20%
        resolucion: 10, // metros
        ndviPromedio: parseFloat(ndviPromedio.toFixed(3)),
        ndviMin: parseFloat(ndviMin.toFixed(3)),
        ndviMax: parseFloat(ndviMax.toFixed(3)),
        areaVerde: parseFloat(areaVerde.toFixed(2)),
        areaProblema: parseFloat(areaProblema.toFixed(2)),
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(imagen, { status: 201 });
  } catch (error) {
    console.error("Error al generar NDVI:", error);
    return NextResponse.json(
      { error: "Error al generar imagen NDVI" },
      { status: 500 }
    );
  }
}