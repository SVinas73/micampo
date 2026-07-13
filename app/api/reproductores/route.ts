import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Reproductores (toros) del catálogo genético: animales categoría "Toro" con su
// registro genético (DEPs/EBV) y el conteo de crías vinculadas por caravana.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const toros = await prisma.animal.findMany({
      where: {
        userId: session.user.id,
        OR: [{ categoria: "Toro" }, { registroGenetico: { isNot: null } }],
      },
      select: {
        id: true,
        caravana: true,
        nombre: true,
        raza: true,
        categoria: true,
        sexo: true,
        estado: true,
        fechaBaja: true,
        registroGenetico: {
          select: {
            valorGeneticoEstimado: true,
            gananciaEsperada: true,
            pesoAdultoEsperado: true,
            produccionLecheEsperada: true,
            razaPura: true,
            registroGenealogia: true,
            temperamento: true,
            facilidadParto: true,
            habilidadMaterna: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Solo machos / reproductores activos
    const reproductores = toros.filter((t) => t.sexo === "Macho" && !t.fechaBaja);

    // Conteo de crías por caravana de padre
    const caravanas = reproductores.map((t) => t.caravana);
    let criasPorPadre: Record<string, number> = {};
    if (caravanas.length > 0) {
      const crias = await prisma.animal.groupBy({
        by: ["padre"],
        where: { userId: session.user.id, padre: { in: caravanas } },
        _count: { _all: true },
      });
      criasPorPadre = Object.fromEntries(crias.map((c) => [c.padre as string, c._count._all]));
    }

    const maxCrias = Math.max(1, ...Object.values(criasPorPadre));

    const out = reproductores.map((t) => ({
      id: t.id,
      caravana: t.caravana,
      nombre: t.nombre,
      raza: t.raza,
      registroGenetico: t.registroGenetico,
      crias: criasPorPadre[t.caravana] || 0,
      uso: Math.round(((criasPorPadre[t.caravana] || 0) / maxCrias) * 100),
    }));

    return NextResponse.json(out);
  } catch (error) {
    console.error("Error al obtener reproductores:", error);
    return NextResponse.json({ error: "Error al obtener reproductores" }, { status: 500 });
  }
}
