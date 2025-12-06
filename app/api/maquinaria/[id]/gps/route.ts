import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/maquinaria/[id]/gps - Obtener posiciones GPS
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const desde = searchParams.get("desde"); // Fecha inicio
    const hasta = searchParams.get("hasta"); // Fecha fin

    const posiciones = await prisma.telemetriaGPS.findMany({
      where: {
        maquinariaId: params.id,
        ...(desde && hasta && {
          timestamp: {
            gte: new Date(desde),
            lte: new Date(hasta),
          },
        }),
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // Calcular estadísticas
    const ultimaPosicion = posiciones[0] || null;
    const distanciaTotal = calcularDistanciaTotal(posiciones);
    const tiempoTotal = calcularTiempoTotal(posiciones);

    return NextResponse.json({
      posiciones,
      estadisticas: {
        ultimaPosicion,
        totalPosiciones: posiciones.length,
        distanciaTotal: distanciaTotal.toFixed(2), // km
        tiempoTotal: tiempoTotal.toFixed(2), // horas
        velocidadPromedio:
          tiempoTotal > 0 ? (distanciaTotal / tiempoTotal).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error("Error al obtener GPS:", error);
    return NextResponse.json({ error: "Error al obtener GPS" }, { status: 500 });
  }
}

// POST /api/maquinaria/[id]/gps - Registrar posición GPS
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      latitud,
      longitud,
      velocidad,
      rumbo,
      altitud,
      precision,
      estadoMotor,
      horasMotor,
      nivelCombustible,
    } = body;

    // Validaciones
    if (!latitud || !longitud) {
      return NextResponse.json(
        { error: "Latitud y longitud son requeridos" },
        { status: 400 }
      );
    }

    const posicion = await prisma.telemetriaGPS.create({
      data: {
        maquinariaId: params.id,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        velocidad: velocidad ? parseFloat(velocidad) : 0,
        rumbo: rumbo ? parseFloat(rumbo) : 0,
        altitud: altitud ? parseFloat(altitud) : null,
        precision: precision ? parseFloat(precision) : null,
        estadoMotor: estadoMotor || "Apagado",
        horasMotor: horasMotor ? parseFloat(horasMotor) : null,
        nivelCombustible: nivelCombustible ? parseFloat(nivelCombustible) : null,
      },
    });

    // Actualizar horas motor de la maquinaria si se proporciona
    if (horasMotor) {
      await prisma.maquinaria.update({
        where: { id: params.id },
        data: { horasMotor: parseFloat(horasMotor) },
      });
    }

    return NextResponse.json(posicion, { status: 201 });
  } catch (error) {
    console.error("Error al registrar GPS:", error);
    return NextResponse.json({ error: "Error al registrar GPS" }, { status: 500 });
  }
}

// Funciones auxiliares
function calcularDistanciaTotal(posiciones: any[]): number {
  if (posiciones.length < 2) return 0;

  let distanciaTotal = 0;
  for (let i = 0; i < posiciones.length - 1; i++) {
    const dist = calcularDistanciaHaversine(
      posiciones[i].latitud,
      posiciones[i].longitud,
      posiciones[i + 1].latitud,
      posiciones[i + 1].longitud
    );
    distanciaTotal += dist;
  }
  return distanciaTotal;
}

function calcularDistanciaHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calcularTiempoTotal(posiciones: any[]): number {
  if (posiciones.length < 2) return 0;

  const inicio = new Date(posiciones[posiciones.length - 1].timestamp);
  const fin = new Date(posiciones[0].timestamp);
  return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60); // horas
}