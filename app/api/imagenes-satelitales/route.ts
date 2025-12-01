import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Nota: Usando servicio gratuito de Sentinel Hub
// Para producción, registrarse en: https://www.sentinel-hub.com/

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

    const imagenes = await prisma.imagenSatelital.findMany({
      where,
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(imagenes);
  } catch (error) {
    console.error("Error al obtener imágenes:", error);
    return NextResponse.json(
      { error: "Error al obtener imágenes satelitales" },
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
      fecha,
      fuente,
      tipoIndice,
      urlImagen,
      urlThumbnail,
      nubosidad,
      resolucion,
      ndviPromedio,
      ndviMin,
      ndviMax,
      areaVerde,
      areaProblema,
    } = await request.json();

    if (!loteId || !fecha || !fuente || !tipoIndice || !urlImagen) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const imagen = await prisma.imagenSatelital.create({
      data: {
        loteId,
        fecha: new Date(fecha),
        fuente,
        tipoIndice,
        urlImagen,
        urlThumbnail: urlThumbnail || null,
        nubosidad: nubosidad ? parseFloat(nubosidad) : null,
        resolucion: resolucion ? parseFloat(resolucion) : null,
        ndviPromedio: ndviPromedio ? parseFloat(ndviPromedio) : null,
        ndviMin: ndviMin ? parseFloat(ndviMin) : null,
        ndviMax: ndviMax ? parseFloat(ndviMax) : null,
        areaVerde: areaVerde ? parseFloat(areaVerde) : null,
        areaProblema: areaProblema ? parseFloat(areaProblema) : null,
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
    console.error("Error al crear imagen:", error);
    return NextResponse.json(
      { error: "Error al crear imagen satelital" },
      { status: 500 }
    );
  }
}