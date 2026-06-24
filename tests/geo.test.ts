import { describe, it, expect } from "vitest";
import * as turf from "@turf/turf";
import { cuadradoDesdeCentro, centroideAnillo } from "@/lib/geo";

describe("geo · cuadradoDesdeCentro", () => {
  const centro = { lat: -32.8, lng: -56.0 };

  it("genera un anillo cerrado de 5 puntos (4 vértices + cierre)", () => {
    const { geojson } = cuadradoDesdeCentro(centro, 50);
    const ring = geojson.coordinates[0];
    expect(ring).toHaveLength(5);
    expect(ring[0]).toEqual(ring[4]); // cerrado
  });

  it("el área real del polígono coincide con las hectáreas pedidas (±2%)", () => {
    for (const ha of [1, 10, 50, 120, 800]) {
      const { geojson } = cuadradoDesdeCentro(centro, ha);
      const areaHa = turf.area(turf.polygon(geojson.coordinates)) / 10000;
      expect(Math.abs(areaHa - ha) / ha).toBeLessThan(0.02);
    }
  });

  it("el centro del cuadrado es el punto pedido", () => {
    const { geojson } = cuadradoDesdeCentro(centro, 100);
    const c = centroideAnillo(geojson.coordinates[0].slice(0, 4));
    expect(c.lat).toBeCloseTo(centro.lat, 4);
    expect(c.lng).toBeCloseTo(centro.lng, 4);
  });

  it("el perímetro es ~4 lados y crece con la superficie", () => {
    const chico = cuadradoDesdeCentro(centro, 10);
    const grande = cuadradoDesdeCentro(centro, 160);
    // 160 ha = 16x el área de 10 ha → lado 4x → perímetro 4x
    expect(grande.perimetro / chico.perimetro).toBeCloseTo(4, 1);
  });

  it("nunca genera un área degenerada con hectáreas 0 o negativas", () => {
    const { geojson, perimetro } = cuadradoDesdeCentro(centro, 0);
    const areaM2 = turf.area(turf.polygon(geojson.coordinates));
    expect(areaM2).toBeGreaterThan(0);
    expect(perimetro).toBeGreaterThan(0);
  });

  it("ajusta la longitud por la latitud (un cuadrado real, no en grados)", () => {
    // En el ecuador y a -55° el mismo lado en metros da distinto ancho en grados.
    const ecuador = cuadradoDesdeCentro({ lat: 0, lng: 0 }, 100);
    const sur = cuadradoDesdeCentro({ lat: -55, lng: 0 }, 100);
    const anchoEc = ecuador.geojson.coordinates[0][1][0] - ecuador.geojson.coordinates[0][0][0];
    const anchoSur = sur.geojson.coordinates[0][1][0] - sur.geojson.coordinates[0][0][0];
    expect(anchoSur).toBeGreaterThan(anchoEc); // a mayor latitud, más grados de lng por metro
  });
});

describe("geo · centroideAnillo", () => {
  it("promedia las coordenadas del anillo", () => {
    const c = centroideAnillo([
      [-56, -33],
      [-54, -33],
      [-54, -31],
      [-56, -31],
    ]);
    expect(c.lng).toBeCloseTo(-55, 6);
    expect(c.lat).toBeCloseTo(-32, 6);
  });
});
