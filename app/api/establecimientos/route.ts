import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const establecimientos = await prisma.establecimiento.findMany({
      where: { userId: session.user.id },
      orderBy: { nombre: "asc" },
      include: { _count: { select: { lotes: true } }, lotes: { select: { hectareas: true } } },
    });

    return NextResponse.json(
      establecimientos.map((e) => {
        // Si no se cargó la superficie total, se deriva sumando las hectáreas de los lotes.
        const haLotes = e.lotes.reduce((s, l) => s + (l.hectareas || 0), 0);
        return {
        id: e.id,
        nombre: e.nombre,
        direccion: e.direccion,
        ciudad: e.ciudad,
        provincia: e.provincia,
        pais: e.pais,
        cuit: e.cuit,
        hectareasTotales: e.hectareasTotales ?? (haLotes > 0 ? haLotes : null),
        coordenadas: e.coordenadas ? JSON.parse(e.coordenadas) : null,
        centroLatitud: e.centroLatitud,
        centroLongitud: e.centroLongitud,
        perimetro: e.perimetro,
        lotesCount: e._count.lotes,
        };
      })
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener establecimientos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const data = await request.json();
    if (!data.nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

    const establecimiento = await prisma.establecimiento.create({
      data: {
        nombre: data.nombre,
        direccion: data.direccion || null,
        ciudad: data.ciudad || null,
        provincia: data.provincia || null,
        pais: data.pais || "Uruguay",
        cuit: data.cuit || null,
        hectareasTotales: data.hectareasTotales ? parseFloat(data.hectareasTotales) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(establecimiento, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al crear establecimiento" }, { status: 500 });
  }
}
