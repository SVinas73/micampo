/**
 * Ubicación única para el clima: SIEMPRE el establecimiento activo del sidebar.
 * Usa el centro guardado del establecimiento o, si no tiene, el promedio de los
 * centroides de sus lotes. Compartida por el Inicio y el módulo Clima para que
 * ambos muestren EXACTAMENTE el mismo pronóstico (mismas coordenadas → mismo dato).
 */
type Geo = { centroLatitud?: number | null; centroLongitud?: number | null };

export function ubicacionClima(
  establecimiento: Geo | null | undefined,
  lotes: Geo[]
): { lat: number; lon: number } | null {
  if (establecimiento?.centroLatitud != null && establecimiento?.centroLongitud != null) {
    return { lat: establecimiento.centroLatitud, lon: establecimiento.centroLongitud };
  }
  const conGeo = lotes.filter((l) => l.centroLatitud != null && l.centroLongitud != null);
  if (conGeo.length) {
    const lat = conGeo.reduce((s, l) => s + (l.centroLatitud as number), 0) / conGeo.length;
    const lon = conGeo.reduce((s, l) => s + (l.centroLongitud as number), 0) / conGeo.length;
    return { lat, lon };
  }
  return null;
}
