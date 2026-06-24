import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buscarLugares } from "@/lib/geocoding";

// Proxy de geocodificación directa: corre en el servidor con User-Agent válido
// y caché. Requiere sesión para evitar abuso del proxy.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q") || "";
  const resultados = await buscarLugares(q);
  return NextResponse.json({ resultados });
}
