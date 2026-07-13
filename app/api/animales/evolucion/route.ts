import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Serie mensual del inventario del hato (para "Evolución de Ganado"),
// desglosada por categoría y por raza. Calculada con altas (nacimiento/creación)
// y bajas reales de cada animal — sin datos inventados.
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const meses = Math.min(36, Math.max(6, parseInt(searchParams.get("meses") || "24")));

    const animales = await prisma.animal.findMany({
      where: { userId: session.user.id },
      select: {
        categoria: true,
        raza: true,
        fechaNacimiento: true,
        createdAt: true,
        fechaBaja: true,
        estado: true,
      },
    });

    const hoy = new Date();
    const serie: {
      m: number;
      y: number;
      total: number;
      categorias: Record<string, number>;
      razas: Record<string, number>;
    }[] = [];

    for (let i = meses - 1; i >= 0; i--) {
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0, 23, 59, 59);
      const punto = {
        m: finMes.getMonth(),
        y: finMes.getFullYear(),
        total: 0,
        categorias: {} as Record<string, number>,
        razas: {} as Record<string, number>,
      };
      for (const a of animales) {
        const alta = a.fechaNacimiento ? new Date(a.fechaNacimiento) : new Date(a.createdAt);
        const baja = a.fechaBaja ? new Date(a.fechaBaja) : null;
        const activoEnMes = alta <= finMes && (!baja || baja > finMes);
        if (!activoEnMes) continue;
        punto.total += 1;
        const cat = a.categoria || "Sin categoría";
        const raza = a.raza || "Sin raza";
        punto.categorias[cat] = (punto.categorias[cat] || 0) + 1;
        punto.razas[raza] = (punto.razas[raza] || 0) + 1;
      }
      serie.push(punto);
    }

    return NextResponse.json({ serie, meses });
  } catch (error) {
    console.error("Error al calcular evolución:", error);
    return NextResponse.json({ error: "Error al calcular evolución" }, { status: 500 });
  }
}
