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

    const where: any = {
      userId: session.user.id,
    };

    if (loteId) {
      where.loteId = loteId;
    }

    const analisis = await prisma.analisisSuelo.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaAnalisis: "desc",
      },
    });

    return NextResponse.json(analisis);
  } catch (error) {
    console.error("Error al obtener análisis:", error);
    return NextResponse.json(
      { error: "Error al obtener análisis de suelo" },
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
      fechaAnalisis,
      pH,
      materiaOrganica,
      nitrogeno,
      fosforo,
      potasio,
      observaciones,
    } = await request.json();

    if (!loteId || !fechaAnalisis) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Generar recomendaciones basadas en los valores
    let recomendaciones = "";
    
    if (pH) {
      const pHVal = parseFloat(pH);
      if (pHVal < 5.5) {
        recomendaciones += "pH bajo: Aplicar cal para corregir acidez. ";
      } else if (pHVal > 7.5) {
        recomendaciones += "pH alto: Considerar enmiendas para reducir alcalinidad. ";
      }
    }

    if (materiaOrganica) {
      const moVal = parseFloat(materiaOrganica);
      if (moVal < 2) {
        recomendaciones += "Materia orgánica baja: Incorporar compost o abono verde. ";
      }
    }

    if (nitrogeno) {
      const nVal = parseFloat(nitrogeno);
      if (nVal < 20) {
        recomendaciones += "Nitrógeno bajo: Fertilización nitrogenada recomendada. ";
      }
    }

    if (fosforo) {
      const pVal = parseFloat(fosforo);
      if (pVal < 10) {
        recomendaciones += "Fósforo bajo: Aplicar fertilizante fosfatado. ";
      }
    }

    if (potasio) {
      const kVal = parseFloat(potasio);
      if (kVal < 80) {
        recomendaciones += "Potasio bajo: Considerar fertilización potásica. ";
      }
    }

    if (!recomendaciones) {
      recomendaciones = "Los niveles están dentro de rangos aceptables. Continuar con monitoreo periódico.";
    }

    const analisis = await prisma.analisisSuelo.create({
      data: {
        loteId,
        fechaAnalisis: new Date(fechaAnalisis),
        pH: pH ? parseFloat(pH) : null,
        materiaOrganica: materiaOrganica ? parseFloat(materiaOrganica) : null,
        nitrogeno: nitrogeno ? parseFloat(nitrogeno) : null,
        fosforo: fosforo ? parseFloat(fosforo) : null,
        potasio: potasio ? parseFloat(potasio) : null,
        observaciones: observaciones || null,
        recomendaciones,
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

    return NextResponse.json(analisis, { status: 201 });
  } catch (error) {
    console.error("Error al crear análisis:", error);
    return NextResponse.json(
      { error: "Error al crear análisis de suelo" },
      { status: 500 }
    );
  }
}