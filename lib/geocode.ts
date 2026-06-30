/**
 * Geocodificación de lugares con la API gratuita de Open-Meteo (sin API key).
 * Convierte "Canelones, Uruguay" → { lat, lon, nombre }. Se usa para darle a cada
 * establecimiento sus coordenadas reales cuando no tiene centro guardado ni lotes
 * con geo, así el clima sale por su ubicación real (no por un default).
 */
export async function geocodeUbicacion(
  query: string,
  pais = "Uruguay"
): Promise<{ lat: number; lon: number; nombre: string } | null> {
  const q = (query || "").trim();
  if (!q) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=es&format=json`;
    const r = await fetch(url, { next: { revalidate: 86400 } });
    if (!r.ok) return null;
    const d = await r.json();
    const results: Array<{ latitude: number; longitude: number; name: string; admin1?: string; country?: string }> = d?.results || [];
    if (!results.length) return null;
    // Preferí un resultado del país indicado (Uruguay) si lo hay.
    const hit = results.find((x) => (x.country || "").toLowerCase() === pais.toLowerCase()) || results[0];
    return {
      lat: hit.latitude,
      lon: hit.longitude,
      nombre: [hit.name, hit.admin1, hit.country].filter(Boolean).join(", "),
    };
  } catch {
    return null;
  }
}
