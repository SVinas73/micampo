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
    // Alcance (sidebar): lista de lotes del establecimiento activo. Si viene `loteIds`,
    // se restringe a esos lotes (esto excluye registros de lotes ya borrados, cuyo
    // loteId quedó en null → no aparece "un campo que no existe").
    const loteIdsParam = searchParams.get("loteIds");
    const loteIds = loteIdsParam !== null ? loteIdsParam.split(",").filter(Boolean) : null;
    const dias = parseInt(searchParams.get("dias") || "90");

    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - dias);

    const where: any = {
      userId: session.user.id,
      fecha: {
        gte: fechaDesde,
      },
    };

    if (loteId) {
      where.loteId = loteId;
    } else if (loteIds !== null) {
      // Incluye también las lluvias "Campo General" (sin lote) del usuario, que si no
      // quedarían invisibles al filtrar por los lotes del establecimiento.
      where.OR = [{ loteId: { in: loteIds } }, { loteId: null }];
    }

    const registros = await prisma.registroPluviometrico.findMany({
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

    return NextResponse.json(registros);
  } catch (error) {
    console.error("Error al obtener registros pluviométricos:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
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
      fecha,
      milimetros,
      loteId,
      ubicacion,
      metodo,
      observaciones,
    } = await request.json();

    if (!fecha || milimetros === undefined) {
      return NextResponse.json(
        { error: "Fecha y milímetros son requeridos" },
        { status: 400 }
      );
    }

    const registro = await prisma.registroPluviometrico.create({
      data: {
        fecha: new Date(fecha),
        milimetros: parseFloat(milimetros),
        loteId: loteId || null,
        ubicacion: ubicacion || null,
        metodo: metodo || "Manual",
        observaciones: observaciones || null,
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

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    console.error("Error al crear registro:", error);
    return NextResponse.json(
      { error: "Error al crear registro pluviométrico" },
      { status: 500 }
    );
  }
}