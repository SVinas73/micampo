import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { loteId, tipo, producto, dosisBase, unidad } = await request.json();

    if (!loteId || !tipo || !producto || !dosisBase || !unidad) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Obtener zonas de manejo del lote
    const zonas = await prisma.zonaManejo.findMany({
      where: { loteId },
    });

    if (zonas.length === 0) {
      return NextResponse.json(
        { error: "El lote no tiene zonas de manejo definidas" },
        { status: 400 }
      );
    }

    // Generar prescripción variable con IA simple
    const prescripcionDatos = zonas.map((zona) => {
      let factorAjuste = 1.0;

      // Ajustar según potencial productivo
      if (zona.potencialProductivo === "Alto") {
        factorAjuste = 1.2;
      } else if (zona.potencialProductivo === "Bajo") {
        factorAjuste = 0.8;
      }

      // Ajustar según índice verde si existe
      if (zona.indiceVerde) {
        if (zona.indiceVerde > 0.7) {
          factorAjuste *= 1.1;
        } else if (zona.indiceVerde < 0.5) {
          factorAjuste *= 0.9;
        }
      }

      const dosisAjustada = parseFloat(dosisBase) * factorAjuste;

      return {
        zonaId: zona.id,
        zonaNombre: zona.nombre,
        dosis: parseFloat(dosisAjustada.toFixed(2)),
        unidad,
        area: zona.area,
        coordenadas: JSON.parse(zona.coordenadas),
      };
    });

    const criterios = {
      potencialProductivo: "Se ajustó dosis según potencial: +20% en zonas altas, -20% en bajas",
      indiceVerde: "Se consideró NDVI histórico para refinar dosis",
      dosisBase: `Dosis base: ${dosisBase} ${unidad}`,
    };

    return NextResponse.json({
      loteId,
      tipo,
      producto,
      unidad,
      prescripcionDatos,
      criterios,
      generadoPorIA: true,
    });
  } catch (error) {
    console.error("Error al generar prescripción:", error);
    return NextResponse.json(
      { error: "Error al generar prescripción variable" },
      { status: 500 }
    );
  }
}