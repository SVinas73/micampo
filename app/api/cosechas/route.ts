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

    const cosechas = await prisma.cosecha.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
        siembra: {
          select: {
            cultivo: true,
            variedad: true,
          },
        },
      },
      orderBy: {
        fechaCosecha: "desc",
      },
    });

    return NextResponse.json(cosechas);
  } catch (error) {
    console.error("Error al obtener cosechas:", error);
    return NextResponse.json(
      { error: "Error al obtener cosechas" },
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

    const { fechaCosecha, rendimiento, calidad, precioVenta, siembraId, loteId, humedad, observaciones } = await request.json();

    if (!fechaCosecha || !rendimiento || !loteId) {
      return NextResponse.json(
        { error: "Faltan fecha, rendimiento o lote" },
        { status: 400 }
      );
    }

    // Si no viene siembraId, lo resolvemos con la última siembra del lote.
    let siembraIdFinal: string | undefined = siembraId;
    if (!siembraIdFinal) {
      const ultima = await prisma.siembra.findFirst({
        where: { loteId, userId: session.user.id },
        orderBy: { fechaSiembra: "desc" },
        select: { id: true },
      });
      siembraIdFinal = ultima?.id;
    }
    if (!siembraIdFinal) {
      return NextResponse.json(
        { error: "Este lote no tiene una siembra registrada. Cargá la siembra antes de la cosecha." },
        { status: 400 }
      );
    }

    const cosecha = await prisma.cosecha.create({
      data: {
        fechaCosecha: new Date(fechaCosecha),
        rendimiento: parseFloat(rendimiento),
        calidad: calidad || null,
        humedad: humedad != null && humedad !== "" && !isNaN(parseFloat(String(humedad))) ? parseFloat(String(humedad)) : null,
        observaciones: observaciones || null,
        precioVenta: precioVenta ? parseFloat(precioVenta) : null,
        siembraId: siembraIdFinal,
        loteId,
        userId: session.user.id,
      },
      include: {
        lote: {
          select: {
            nombre: true,
          },
        },
        siembra: {
          select: {
            cultivo: true,
            variedad: true,
          },
        },
      },
    });

    return NextResponse.json(cosecha, { status: 201 });
  } catch (error) {
    console.error("Error al crear cosecha:", error);
    return NextResponse.json(
      { error: "Error al crear cosecha" },
      { status: 500 }
    );
  }
}