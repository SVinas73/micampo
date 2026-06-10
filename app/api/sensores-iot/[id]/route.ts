import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const sensor = await prisma.sensorIoT.findUnique({
      where: { id: params.id },
    });

    if (!sensor || sensor.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sensor no encontrado" },
        { status: 404 }
      );
    }

    await prisma.sensorIoT.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Sensor eliminado" });
  } catch (error) {
    console.error("Error al eliminar sensor:", error);
    return NextResponse.json(
      { error: "Error al eliminar sensor" },
      { status: 500 }
    );
  }
}