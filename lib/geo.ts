/**
 * Utilidades geométricas puras para lotes. Sin dependencias de React ni de red,
 * para que sean fáciles de testear: un error de hectáreas o de coordenadas acá
 * es plata real del productor.
 */

export type Punto = { lat: number; lng: number };
export type PoligonoLote = {
  geojson: { type: "Polygon"; coordinates: number[][][] };
  hectareas: number;
  centro: Punto;
  perimetro: number; // metros
};

const M_POR_GRADO_LAT = 111320;

/**
 * Genera un polígono cuadrado aproximado a partir de un centro (lat/lng) y la
 * superficie en hectáreas. Permite crear un lote por coordenadas/búsqueda sin
 * dibujarlo a mano; el lote aparece igual en el mapa, centrado en el punto.
 */
export function cuadradoDesdeCentro(centro: Punto, hectareas: number): PoligonoLote {
  const areaM2 = Math.max(100, (hectareas || 1) * 10000);
  const lado = Math.sqrt(areaM2); // metros
  const medio = lado / 2;
  const dLat = medio / M_POR_GRADO_LAT;
  const dLng = medio / (M_POR_GRADO_LAT * Math.cos((centro.lat * Math.PI) / 180) || 1);
  const ring: number[][] = [
    [centro.lng - dLng, centro.lat - dLat],
    [centro.lng + dLng, centro.lat - dLat],
    [centro.lng + dLng, centro.lat + dLat],
    [centro.lng - dLng, centro.lat + dLat],
    [centro.lng - dLng, centro.lat - dLat],
  ];
  return { geojson: { type: "Polygon", coordinates: [ring] }, hectareas, centro, perimetro: Math.round(lado * 4) };
}

/** Centroide simple (promedio) de un anillo de coordenadas [lng, lat][]. */
export function centroideAnillo(ring: number[][]): Punto {
  const n = ring.length || 1;
  return {
    lng: ring.reduce((s, p) => s + p[0], 0) / n,
    lat: ring.reduce((s, p) => s + p[1], 0) / n,
  };
}
