import { NextResponse } from "next/server";
import { truecolorTilePng } from "@/lib/sentinel";

/**
 * GET /api/sentinel/truecolor/{z}/{x}/{y} — tile satelital Sentinel-2 ACTUAL (color natural, 10 m).
 *
 * Imagen satelital reciente (misma ventana temporal que el NDVI) para que la vista
 * satélite COINCIDA en el tiempo con NDVI/prescripción. Proxy server-side de la
 * Process API de Sentinel Hub con las credenciales OAuth del servidor.
 *
 * Degrada con elegancia: sin credenciales / error / zona sin datos → PNG
 * transparente 1×1 (nunca un tile roto ni un 400 en la consola del navegador).
 */
export const runtime = "nodejs";
export const maxDuration = 30;

// PNG transparente de 1×1 (fallback silencioso).
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

const WORLD = 20037508.342789244; // media circunferencia terrestre en EPSG:3857 (m)

// Tile XYZ (Web Mercator) → bbox [minX, minY, maxX, maxY] en EPSG:3857.
function tileBBox(z: number, x: number, y: number): [number, number, number, number] {
  const n = 2 ** z;
  const size = (2 * WORLD) / n;
  const minX = -WORLD + x * size;
  const maxX = -WORLD + (x + 1) * size;
  const maxY = WORLD - y * size;
  const minY = WORLD - (y + 1) * size;
  return [minX, minY, maxX, maxY];
}

function png(body: Buffer, cacheSeconds: number) {
  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
    },
  });
}

export async function GET(_req: Request, context: { params: Promise<{ z: string; x: string; y: string }> }) {
  try {
    const { z, x, y } = await context.params;
    const Z = parseInt(z, 10);
    const X = parseInt(x, 10);
    const Y = parseInt(y, 10); // tolera sufijos tipo ".png"
    if (!Number.isFinite(Z) || !Number.isFinite(X) || !Number.isFinite(Y) || Z < 0 || Z > 22) {
      return png(TRANSPARENT_PNG, 300);
    }
    const tile = await truecolorTilePng(tileBBox(Z, X, Y)).catch(() => null);
    return tile ? png(tile, 86400) : png(TRANSPARENT_PNG, 300);
  } catch {
    return png(TRANSPARENT_PNG, 300);
  }
}
