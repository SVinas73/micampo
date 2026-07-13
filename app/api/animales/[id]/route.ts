import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Ficha completa de un animal (modal Ver Detalle)
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const animal = await prisma.animal.findUnique({
      where: { id: params.id },
      include: {
        tropa: { select: { id: true, nombre: true } },
        registrosPeso: { orderBy: { fecha: "asc" } },
        registrosLecheros: { orderBy: { fecha: "asc" } },
        historialReproductivo: true,
        eventosReproductivos: { orderBy: { fecha: "desc" } },
        tratamientos: { orderBy: { fechaInicio: "desc" } },
        eventosSanitarios: { orderBy: { fecha: "desc" }, take: 20 },
        eventosVida: { orderBy: { fecha: "desc" }, take: 50 },
        registroGenetico: {
          include: {
            padre: { select: { caravana: true, raza: true } },
            madre: { select: { caravana: true, raza: true } },
          },
        },
      },
    });

    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Animal no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(animal);
  } catch (error) {
    console.error("Error al obtener animal:", error);
    return NextResponse.json(
      { error: "Error al obtener animal" },
      { status: 500 }
    );
  }
}

// Editar / dar de baja / reactivar
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const animal = await prisma.animal.findUnique({
      where: { id: params.id },
    });

    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Animal no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      accion, // "baja" | "reactivar" | undefined (edición normal)
      motivoBaja,
      fechaBaja,
      observacionesBaja,
      ...campos
    } = body;

    if (accion === "baja") {
      const actualizado = await prisma.animal.update({
        where: { id: params.id },
        data: {
          estado: motivoBaja === "Venta" ? "Vendido" : motivoBaja === "Muerte" ? "Muerto" : "Baja",
          fechaBaja: fechaBaja ? new Date(fechaBaja) : new Date(),
          motivoBaja: motivoBaja || "Baja",
        },
      });
      await prisma.eventoVida.create({
        data: {
          animalId: params.id,
          tipoEvento: motivoBaja === "Venta" ? "Venta" : motivoBaja === "Muerte" ? "Muerte" : "Baja",
          titulo: `Baja del animal · ${motivoBaja || "sin motivo"}`,
          descripcion: observacionesBaja || null,
          importante: true,
          userId: session.user.id,
        },
      });
      return NextResponse.json(actualizado);
    }

    if (accion === "reactivar") {
      const actualizado = await prisma.animal.update({
        where: { id: params.id },
        data: { estado: "Activo", fechaBaja: null, motivoBaja: null },
      });
      await prisma.eventoVida.create({
        data: {
          animalId: params.id,
          tipoEvento: "Reactivacion",
          titulo: "Animal reactivado",
          userId: session.user.id,
        },
      });
      return NextResponse.json(actualizado);
    }

    // Edición general de campos permitidos
    const permitidos = [
      "caravana",
      "nombre",
      "categoria",
      "raza",
      "sexo",
      "rfid",
      "origen",
      "condicionNacimiento",
      "foto",
      "ubicacion",
      "tropaId",
      "madre",
      "padre",
    ] as const;
    const data: Record<string, unknown> = {};
    for (const k of permitidos) {
      if (k in campos) data[k] = campos[k] === "" ? null : campos[k];
    }
    if ("fechaNacimiento" in campos) {
      data.fechaNacimiento = campos.fechaNacimiento
        ? new Date(campos.fechaNacimiento)
        : null;
    }

    const actualizado = await prisma.animal.update({
      where: { id: params.id },
      data,
      include: { tropa: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar animal:", error);
    return NextResponse.json(
      { error: "Error al actualizar animal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const animal = await prisma.animal.findUnique({
      where: { id: params.id },
    });

    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Animal no encontrado" },
        { status: 404 }
      );
    }

    await prisma.animal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Animal eliminado" });
  } catch (error) {
    console.error("Error al eliminar animal:", error);
    return NextResponse.json(
      { error: "Error al eliminar animal" },
      { status: 500 }
    );
  }
}
