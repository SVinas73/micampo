import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { geocodificarInverso } from "@/lib/geocoding";

// Proxy de geocodificación inversa (coordenadas → lugar) con caché + User-Agent.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const lat = parseFloat(sp.get("lat") || "");
  const lon = parseFloat(sp.get("lon") || "");
  const lugar = await geocodificarInverso(lat, lon);
  return NextResponse.json({ lugar });
}
