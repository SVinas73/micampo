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
    const animalId = searchParams.get("animalId");
    const tipoMovimiento = searchParams.get("tipoMovimiento");

    const where: any = {
      userId: session.user.id,
    };

    if (animalId) {
      where.animalId = animalId;
    }

    if (tipoMovimiento) {
      where.tipoMovimiento = tipoMovimiento;
    }

    const movimientos = await prisma.movimientoAnimal.findMany({
      where,
      include: {
        animal: {
          select: {
            caravana: true,
            tipo: true,
            raza: true,
          },
        },
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(movimientos);
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    return NextResponse.json(
      { error: "Error al obtener movimientos" },
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
      animalId,
      fecha,
      tipoMovimiento,
      origenTipo,
      origenId,
      origenNombre,
      destinoTipo,
      destinoId,
      destinoNombre,
      motivo,
      pesoMovimiento,
      precioVenta,
      comprador,
      observaciones,
      responsable,
    } = await request.json();

    if (!animalId || !tipoMovimiento || !motivo) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Obtener animal
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
    });

    if (!animal || animal.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Animal no encontrado" },
        { status: 404 }
      );
    }

    // Calcular carga animal si es traslado entre lotes
    let cargaAnimalAntes = null;
    let cargaAnimalDespues = null;

    if (tipoMovimiento === "Traslado" && origenId && destinoId) {
      // Obtener lote origen y destino
      const loteOrigen = await prisma.lote.findUnique({
        where: { id: origenId },
      });

      const loteDestino = await prisma.lote.findUnique({
        where: { id: destinoId },
      });

      if (loteOrigen && loteDestino) {
        // Calcular UA (Unidad Animal = 450 kg)
        const pesoAnimal = pesoMovimiento ? parseFloat(pesoMovimiento) : 450;
        const ua = pesoAnimal / 450;

        // Carga origen (UA/ha)
        cargaAnimalAntes = ua / loteOrigen.hectareas;
        cargaAnimalDespues = ua / loteDestino.hectareas;
      }
    }

    const fechaMovimiento = fecha ? new Date(fecha) : new Date();

    const movimiento = await prisma.movimientoAnimal.create({
      data: {
        animalId,
        fecha: fechaMovimiento,
        tipoMovimiento,
        origenTipo: origenTipo || null,
        origenId: origenId || null,
        origenNombre: origenNombre || null,
        destinoTipo: destinoTipo || null,
        destinoId: destinoId || null,
        destinoNombre: destinoNombre || null,
        motivo,
        pesoMovimiento: pesoMovimiento ? parseFloat(pesoMovimiento) : null,
        precioVenta: precioVenta ? parseFloat(precioVenta) : null,
        comprador: comprador || null,
        cargaAnimalAntes,
        cargaAnimalDespues,
        observaciones: observaciones || null,
        responsable: responsable || null,
        userId: session.user.id,
      },
      include: {
        animal: {
          select: {
            caravana: true,
            tipo: true,
          },
        },
      },
    });

    // Crear evento de vida
    let tituloEvento = "";
    let descripcionEvento = "";
    let importante = false;

    switch (tipoMovimiento) {
      case "Traslado":
        tituloEvento = `Traslado: ${origenNombre || "Origen"} → ${destinoNombre || "Destino"}`;
        descripcionEvento = `Motivo: ${motivo}`;
        break;
      case "Venta":
        tituloEvento = `Venta: $${precioVenta || "N/A"}`;
        descripcionEvento = `Comprador: ${comprador || "No especificado"}`;
        importante = true;
        break;
      case "Muerte":
        tituloEvento = "Muerte del animal";
        descripcionEvento = `Motivo: ${motivo}`;
        importante = true;
        break;
      default:
        tituloEvento = `${tipoMovimiento}: ${motivo}`;
        descripcionEvento = observaciones || "";
    }

    await prisma.eventoVida.create({
      data: {
        animalId,
        fecha: fechaMovimiento,
        tipoEvento: "Movimiento",
        referenciaId: movimiento.id,
        referenciaModelo: "MovimientoAnimal",
        titulo: tituloEvento,
        descripcion: descripcionEvento,
        valorNumerico: precioVenta ? parseFloat(precioVenta) : pesoMovimiento ? parseFloat(pesoMovimiento) : null,
        unidad: precioVenta ? "USD" : "kg",
        ubicacion: destinoNombre || null,
        importante,
        alerta: tipoMovimiento === "Muerte",
        userId: session.user.id,
      },
    });

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    console.error("Error al crear movimiento:", error);
    return NextResponse.json(
      { error: "Error al crear movimiento" },
      { status: 500 }
    );
  }
}