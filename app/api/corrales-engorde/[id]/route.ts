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

    const corral = await prisma.corralEngorde.findUnique({
      where: { id: params.id },
      include: { pesadas: { orderBy: { fecha: "desc" }, take: 1 } },
    });
    if (!corral || corral.userId !== session.user.id) {
      return NextResponse.json({ error: "Corral no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { accion, ...campos } = body;
    const num = (v: unknown) => (v === undefined || v === null || v === "" ? null : parseFloat(String(v)));
    const int = (v: unknown) => (v === undefined || v === null || v === "" ? null : parseInt(String(v)));

    // Registrar una pesada → recalcula gdp/pesoActual/estado
    if (accion === "pesada") {
      const pesoPromedio = num(campos.pesoPromedio);
      if (pesoPromedio === null) {
        return NextResponse.json({ error: "Peso requerido" }, { status: 400 });
      }
      const fecha = campos.fecha ? new Date(campos.fecha) : new Date();
      const anterior = corral.pesadas[0] || null;
      let gdp: number | null = num(campos.gdp);
      if (gdp === null && anterior) {
        const dias = Math.max(1, (fecha.getTime() - new Date(anterior.fecha).getTime()) / (24 * 3600 * 1000));
        gdp = Math.round(((pesoPromedio - anterior.pesoPromedio) / dias) * 100) / 100;
      }
      await prisma.pesadaCorral.create({
        data: {
          corralId: corral.id,
          fecha,
          pesoPromedio,
          cabezas: int(campos.cabezas) ?? corral.cabezas,
          gdp,
          consumo: num(campos.consumo),
          notas: campos.notas || null,
          userId: session.user.id,
        },
      });
      // Estado según peso objetivo
      let estado = corral.estado;
      if (corral.pesoObjetivo) {
        estado = pesoPromedio >= corral.pesoObjetivo ? "Listo" : "Activo";
      }
      const actualizado = await prisma.corralEngorde.update({
        where: { id: corral.id },
        data: { pesoActual: pesoPromedio, ...(gdp !== null ? { gdpObjetivo: corral.gdpObjetivo } : {}), estado },
        include: { racion: { select: { id: true, nombre: true } }, pesadas: { orderBy: { fecha: "desc" }, take: 30 } },
      });
      return NextResponse.json(actualizado);
    }

    // Edición general
    const data: Record<string, unknown> = {};
    for (const k of ["nombre", "categoria", "estado", "notas"] as const) {
      if (k in campos) data[k] = campos[k] === "" ? null : campos[k];
    }
    for (const k of ["pesoIngreso", "pesoActual", "pesoObjetivo", "gdpObjetivo", "consumoDiario", "costoDiario", "precioMercado"] as const) {
      if (k in campos) data[k] = num(campos[k]);
    }
    for (const k of ["capacidad", "cabezas"] as const) {
      if (k in campos) data[k] = int(campos[k]);
    }
    if ("racionId" in campos) data.racionId = campos.racionId || null;
    if ("fechaIngreso" in campos) data.fechaIngreso = campos.fechaIngreso ? new Date(campos.fechaIngreso) : null;
    if ("fechaFaenaEst" in campos) data.fechaFaenaEst = campos.fechaFaenaEst ? new Date(campos.fechaFaenaEst) : null;

    const actualizado = await prisma.corralEngorde.update({
      where: { id: corral.id },
      data,
      include: { racion: { select: { id: true, nombre: true } }, pesadas: { orderBy: { fecha: "desc" }, take: 30 } },
    });
    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar corral:", error);
    return NextResponse.json({ error: "Error al actualizar corral" }, { status: 500 });
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

    const corral = await prisma.corralEngorde.findUnique({ where: { id: params.id } });
    if (!corral || corral.userId !== session.user.id) {
      return NextResponse.json({ error: "Corral no encontrado" }, { status: 404 });
    }

    await prisma.corralEngorde.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Corral eliminado" });
  } catch (error) {
    console.error("Error al eliminar corral:", error);
    return NextResponse.json({ error: "Error al eliminar corral" }, { status: 500 });
  }
}
