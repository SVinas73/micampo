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
    const tipo = searchParams.get("tipo");
    const estado = searchParams.get("estado");

    const where: any = { userId: session.user.id };
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const transferencias = await prisma.transferencia.findMany({
      where,
      include: {
        detalles: {
          include: {
            _count: true,
          },
        },
        transporteInfo: true,
      },
      orderBy: { fechaSolicitud: "desc" },
    });

    return NextResponse.json(transferencias);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener transferencias" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Generar código único
    const count = await prisma.transferencia.count({
      where: { userId: session.user.id },
    });
    const codigo = `TR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const transferencia = await prisma.transferencia.create({
      data: {
        codigo,
        tipo: data.tipo,
        subtipo: data.subtipo,
        origen: data.origen,
        origenId: data.origenId,
        destino: data.destino,
        destinoId: data.destinoId,
        fechaSolicitud: data.fechaSolicitud || new Date(),
        fechaSalida: data.fechaSalida,
        fechaLlegada: data.fechaLlegada,
        estado: data.estado || "Pendiente",
        remito: data.remito,
        documentoUrl: data.documentoUrl,
        observaciones: data.observaciones,
        responsableOrigen: data.responsableOrigen,
        responsableDestino: data.responsableDestino,
        userId: session.user.id,
      },
    });

    // Crear transporte si viene
    if (data.transporte) {
      await prisma.registroTransporte.create({
        data: {
          transferenciaId: transferencia.id,
          patente: data.transporte.patente,
          tipoVehiculo: data.transporte.tipoVehiculo,
          marca: data.transporte.marca,
          modelo: data.transporte.modelo,
          chofer: data.transporte.chofer,
          cedulaChofer: data.transporte.cedulaChofer,
          telefono: data.transporte.telefono,
          empresaTransporte: data.transporte.empresaTransporte,
          horaSalida: data.transporte.horaSalida,
          horaLlegada: data.transporte.horaLlegada,
          observaciones: data.transporte.observaciones,
          userId: session.user.id,
        },
      });
    }

    // Crear detalles
    if (data.detalles && data.detalles.length > 0) {
      await prisma.detalleTransferencia.createMany({
        data: data.detalles.map((detalle: any) => ({
          transferenciaId: transferencia.id,
          tipoItem: detalle.tipoItem,
          itemId: detalle.itemId,
          itemNombre: detalle.itemNombre,
          cantidadSolicitada: detalle.cantidadSolicitada,
          cantidadEnviada: detalle.cantidadEnviada,
          cantidadRecibida: detalle.cantidadRecibida,
          unidadMedida: detalle.unidadMedida,
          loteNumero: detalle.loteNumero,
          estadoItem: detalle.estadoItem,
          observaciones: detalle.observaciones,
          userId: session.user.id,
        })),
      });
    }

    return NextResponse.json(transferencia, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear transferencia" }, { status: 500 });
  }
}