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
    const moneda = searchParams.get("moneda") || "UYU";

    // Buscar el tipo de cambio más reciente
    const tipo = await prisma.tipoCambio.findFirst({
      where: {
        userId: session.user.id,
        monedaDestino: moneda,
      },
      orderBy: { fecha: "desc" },
    });

    if (!tipo) {
      // Si no existe, intentar obtener de API externa (ejemplo)
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
        const data = await response.json();
        
        if (data.rates && data.rates[moneda]) {
          const nuevoTipo = await prisma.tipoCambio.create({
            data: {
              monedaBase: "USD",
              monedaDestino: moneda,
              compra: data.rates[moneda],
              venta: data.rates[moneda],
              promedio: data.rates[moneda],
              fuente: "API",
              userId: session.user.id,
            },
          });
          return NextResponse.json(nuevoTipo);
        }
      } catch (apiError) {
        console.error("Error API externa:", apiError);
      }

      return NextResponse.json({ 
        error: "No hay tipo de cambio registrado",
        promedio: 1 
      }, { status: 404 });
    }

    return NextResponse.json(tipo);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener tipo de cambio actual" }, { status: 500 });
  }
}