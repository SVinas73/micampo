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
    const cuentaId = searchParams.get("cuentaId");

    const where: any = {
      userId: session.user.id,
    };

    if (cuentaId) {
      where.cuentaId = cuentaId;
    }

    const extractos = await prisma.extractoBancario.findMany({
      where,
      include: {
        cuenta: {
          select: {
            nombre: true,
          },
        },
        transaccion: {
          select: {
            id: true,
            descripcion: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
      take: 100,
    });

    return NextResponse.json(extractos);
  } catch (error) {
    console.error("Error al obtener extractos:", error);
    return NextResponse.json(
      { error: "Error al obtener extractos" },
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

    const { cuentaId, extractos } = await request.json();

    if (!cuentaId || !extractos || !Array.isArray(extractos)) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Crear extractos en batch
    const created = await prisma.extractoBancario.createMany({
      data: extractos.map((ext: any) => ({
        cuentaId,
        fecha: new Date(ext.fecha),
        descripcion: ext.descripcion,
        referencia: ext.referencia || null,
        debito: ext.debito ? parseFloat(ext.debito) : null,
        credito: ext.credito ? parseFloat(ext.credito) : null,
        saldo: parseFloat(ext.saldo),
        userId: session.user.id,
      })),
    });

    return NextResponse.json({ message: `${created.count} extractos importados` }, { status: 201 });
  } catch (error) {
    console.error("Error al crear extractos:", error);
    return NextResponse.json(
      { error: "Error al crear extractos" },
      { status: 500 }
    );
  }
}

