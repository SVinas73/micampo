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
    const loteId = searchParams.get("loteId");
    const estado = searchParams.get("estado");

    const where: any = {
      userId: session.user.id,
    };

    if (loteId) {
      where.loteId = loteId;
    }

    if (estado) {
      where.estado = estado;
    }

    const alertas = await prisma.alertaPlaga.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaDeteccion: "desc",
      },
    });

    return NextResponse.json(alertas);
  } catch (error) {
    console.error("Error al obtener alertas de plagas:", error);
    return NextResponse.json(
      { error: "Error al obtener alertas" },
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
      loteId,
      plaga,
      tipo,
      severidad,
      metodoDeteccion,
      sintomas,
      areaAfectada,
      observaciones,
    } = await request.json();

    if (!loteId || !plaga || !tipo || !severidad) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Simular análisis IA para recomendaciones
    const confianza = 75 + Math.random() * 20; // 75-95%
    
    const recomendacionesIA: { [key: string]: any } = {
      "Insecto": {
        recomendacion: "Aplicar insecticida específico. Monitorear población cada 3 días.",
        productos: ["Clorpirifos 48%", "Cipermetrina 25%"],
        momento: "Inmediato si la población supera umbral económico",
      },
      "Hongo": {
        recomendacion: "Aplicar fungicida preventivo. Mejorar ventilación del cultivo.",
        productos: ["Azoxistrobina", "Tebuconazol"],
        momento: "24-48 horas, preferiblemente por la mañana",
      },
      "Bacteria": {
        recomendacion: "Eliminar plantas afectadas. Aplicar bactericida cúprico.",
        productos: ["Oxicloruro de cobre", "Hidróxido de cobre"],
        momento: "Inmediato, aislar área infectada",
      },
      "Maleza": {
        recomendacion: "Aplicar herbicida selectivo. Considerar control mecánico.",
        productos: ["Glifosato", "2,4-D"],
        momento: "Estado vegetativo temprano de la maleza",
      },
    };

    const recomendacion = recomendacionesIA[tipo] || {
      recomendacion: "Consultar con agrónomo especializado",
      productos: [],
      momento: "Lo antes posible",
    };

    const alerta = await prisma.alertaPlaga.create({
      data: {
        loteId,
        plaga,
        tipo,
        severidad,
        confianza: parseFloat(confianza.toFixed(1)),
        metodoDeteccion: metodoDeteccion || "Manual",
        sintomas: sintomas ? JSON.stringify(sintomas) : null,
        areaAfectada: areaAfectada ? parseFloat(areaAfectada) : null,
        recomendacion: recomendacion.recomendacion,
        productos: JSON.stringify(recomendacion.productos),
        momento: recomendacion.momento,
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

    return NextResponse.json(alerta, { status: 201 });
  } catch (error) {
    console.error("Error al crear alerta:", error);
    return NextResponse.json(
      { error: "Error al crear alerta de plaga" },
      { status: 500 }
    );
  }
}