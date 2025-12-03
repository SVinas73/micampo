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

    // Registros del período (NUEVO modelo)
    const registros = await prisma.produccionLechera.findMany({
      where: {
        userId: session.user.id,
        fecha: {
          gte: fechaDesde,
        },
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

    // Calcular estadísticas
    const totalLitros = registros.reduce((sum, r) => sum + r.litrosTotales, 0);
    const promedioLitros = registros.length > 0 ? totalLitros / registros.length : 0;
    
    const registrosConCalidad = registros.filter(r => r.grasa !== null || r.proteina !== null);
    const promedioGrasa = registrosConCalidad.length > 0
      ? registrosConCalidad.reduce((sum, r) => sum + (r.grasa || 0), 0) / registrosConCalidad.length
      : null;
    
    const promedioProteina = registrosConCalidad.length > 0
      ? registrosConCalidad.reduce((sum, r) => sum + (r.proteina || 0), 0) / registrosConCalidad.length
      : null;

    const registrosConSCC = registros.filter(r => r.scc !== null);
    const promedioSCC = registrosConSCC.length > 0
      ? registrosConSCC.reduce((sum, r) => sum + (r.scc || 0), 0) / registrosConSCC.length
      : null;

    // Producción por día
    type ProduccionDia = {
      fecha: string;
      litros: number;
      registros: number;
    };

    const produccionPorDiaMap: Record<string, ProduccionDia> = {};
    
    registros.forEach(r => {
      const fecha = r.fecha.toISOString().split('T')[0];
      if (!produccionPorDiaMap[fecha]) {
        produccionPorDiaMap[fecha] = { fecha, litros: 0, registros: 0 };
      }
      produccionPorDiaMap[fecha].litros += r.litrosTotales; // CAMBIO AQUÍ
      produccionPorDiaMap[fecha].registros += 1;
    });

    const serieProduccion = Object.values(produccionPorDiaMap).sort((a, b) => 
      a.fecha.localeCompare(b.fecha)
    );

    // Producción por turno
    type ProduccionTurno = Record<string, number>;
    const produccionPorTurno: ProduccionTurno = {};
    
    registros.forEach(r => {
      const turno = r.turno || "Sin turno";
      if (!produccionPorTurno[turno]) {
        produccionPorTurno[turno] = 0;
      }
      produccionPorTurno[turno] += r.litrosTotales; // CAMBIO AQUÍ
    });

    // Top animales productores
    type AnimalProduccion = {
      caravana: string;
      litros: number;
      registros: number;
      raza: string | null;
    };

    const produccionPorAnimalMap: Record<string, AnimalProduccion> = {};
    
    registros.forEach(r => {
      const caravana = r.animal.caravana;
      if (!produccionPorAnimalMap[caravana]) {
        produccionPorAnimalMap[caravana] = { 
          caravana, 
          litros: 0, 
          registros: 0, 
          raza: r.animal.raza 
        };
      }
      produccionPorAnimalMap[caravana].litros += r.litrosTotales; // CAMBIO AQUÍ
      produccionPorAnimalMap[caravana].registros += 1;
    });

    const topAnimales = Object.values(produccionPorAnimalMap)
      .sort((a, b) => b.litros - a.litros)
      .slice(0, 10);

    // Detectar alertas
    type Alerta = {
      tipo: string;
      severidad: string;
      mensaje: string;
    };

    const alertas: Alerta[] = [];
    
    // Alertas de caída de producción
    const registrosConAlerta = registros.filter(r => r.alertaCaida);
    if (registrosConAlerta.length > 0) {
      alertas.push({
        tipo: "Caída Producción",
        severidad: "Alta",
        mensaje: `${registrosConAlerta.length} animales con caída de producción detectada`,
      });
    }

    // Alerta de calidad
    if (promedioSCC && promedioSCC > 200000) {
      alertas.push({
        tipo: "Calidad Leche",
        severidad: promedioSCC > 400000 ? "Crítica" : "Media",
        mensaje: `SCC promedio elevado: ${Math.round(promedioSCC).toLocaleString()} células/ml`,
      });
    }

    return NextResponse.json({
      resumen: {
        totalLitros: Math.round(totalLitros),
        promedioLitros: Math.round(promedioLitros * 10) / 10,
        totalRegistros: registros.length,
        promedioGrasa: promedioGrasa ? Math.round(promedioGrasa * 100) / 100 : null,
        promedioProteina: promedioProteina ? Math.round(promedioProteina * 100) / 100 : null,
        promedioSCC: promedioSCC ? Math.round(promedioSCC) : null,
      },
      serieProduccion,
      produccionPorTurno,
      topAnimales,
      alertas,
      registrosRecientes: registros.slice(0, 20),
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}