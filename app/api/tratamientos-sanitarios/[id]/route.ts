import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const tratamiento = await prisma.tratamientoSanitario.findUnique({
      where: { id: params.id },
    });
    if (!tratamiento || tratamiento.userId !== session.user.id) {
      return NextResponse.json({ error: "Tratamiento no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { accion } = body; // "aplicarDosis" | "completar" | "cerrar" | edición

    if (accion === "aplicarDosis") {
      const aplicadas = Math.min(tratamiento.dosisTotales, tratamiento.dosisAplicadas + 1);
      const completado = aplicadas >= tratamiento.dosisTotales;

      let finRetiro = tratamiento.finRetiro;
      if (tratamiento.retiroHoras && tratamiento.retiroHoras > 0) {
        // El retiro corre desde la última aplicación
        finRetiro = new Date(Date.now() + tratamiento.retiroHoras * 3600 * 1000);
      }

      const enRetiro = finRetiro && finRetiro > new Date();
      const actualizado = await prisma.tratamientoSanitario.update({
        where: { id: params.id },
        data: {
          dosisAplicadas: aplicadas,
          finRetiro,
          proximaDosis: completado ? null : new Date(Date.now() + 24 * 3600 * 1000),
          estado: completado ? (enRetiro ? "En retiro" : "Completado") : "En curso",
          fechaFin: completado ? new Date() : null,
        },
        include: { animal: { select: { caravana: true, nombre: true } } },
      });

      await prisma.eventoVida.create({
        data: {
          animalId: tratamiento.animalId,
          tipoEvento: "Tratamiento",
          referenciaId: tratamiento.id,
          referenciaModelo: "TratamientoSanitario",
          titulo: `Dosis ${aplicadas}/${tratamiento.dosisTotales} aplicada · ${tratamiento.diagnostico}`,
          userId: session.user.id,
        },
      });

      return NextResponse.json(actualizado);
    }

    if (accion === "completar" || accion === "cerrar") {
      const actualizado = await prisma.tratamientoSanitario.update({
        where: { id: params.id },
        data: {
          estado: accion === "completar" ? "Completado" : "Cerrado",
          fechaFin: new Date(),
          proximaDosis: null,
        },
      });
      return NextResponse.json(actualizado);
    }

    // Edición general
    const permitidos = [
      "diagnostico",
      "severidad",
      "notas",
      "medicamento",
      "dosis",
      "via",
      "responsable",
      "estado",
      "marcaColor",
    ] as const;
    const data: Record<string, unknown> = {};
    for (const k of permitidos) {
      if (k in body) data[k] = body[k] === "" ? null : body[k];
    }
    if ("proximaDosis" in body) data.proximaDosis = body.proximaDosis ? new Date(body.proximaDosis) : null;
    if ("proximoControl" in body) data.proximoControl = body.proximoControl ? new Date(body.proximoControl) : null;

    const actualizado = await prisma.tratamientoSanitario.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar tratamiento:", error);
    return NextResponse.json({ error: "Error al actualizar tratamiento" }, { status: 500 });
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

    const tratamiento = await prisma.tratamientoSanitario.findUnique({
      where: { id: params.id },
    });
    if (!tratamiento || tratamiento.userId !== session.user.id) {
      return NextResponse.json({ error: "Tratamiento no encontrado" }, { status: 404 });
    }

    await prisma.tratamientoSanitario.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Tratamiento eliminado" });
  } catch (error) {
    console.error("Error al eliminar tratamiento:", error);
    return NextResponse.json({ error: "Error al eliminar tratamiento" }, { status: 500 });
  }
}
