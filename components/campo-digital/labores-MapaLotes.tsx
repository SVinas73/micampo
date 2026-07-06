"use client";

/* ============================================================
   Mapa satelital REAL (vista plana) para elegir lotes en el wizard de Nueva Labor.
   - Base: imagen satelital de Esri (la misma del módulo Lotes) + etiquetas.
   - Dibuja los polígonos reales de cada lote; click para seleccionar/deseleccionar.
   - Sin dibujo/notas: es un selector liviano, no el mapa completo de Lotes.
   ============================================================ */

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type LoteGeoSel = {
  idx: number;
  nombre: string;
  ha: number;
  geojson: { type: "Polygon"; coordinates: number[][][] };
};

function fc(lotes: LoteGeoSel[], sel: Set<number>): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: lotes
      .filter((l) => l.geojson?.coordinates?.[0]?.length)
      .map((l) => ({
        type: "Feature",
        geometry: l.geojson as GeoJSON.Polygon,
        properties: { idx: l.idx, name: l.nombre, sel: sel.has(l.idx) ? 1 : 0 },
      })),
  };
}

export default function MapaLotesSelector({
  lotes,
  seleccionados,
  onToggle,
}: {
  lotes: LoteGeoSel[];
  seleccionados: Set<number>;
  onToggle: (idx: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const onToggleRef = useRef(onToggle);
  const selRef = useRef(seleccionados);
  const lotesRef = useRef(lotes);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  onToggleRef.current = onToggle;
  selRef.current = seleccionados;
  lotesRef.current = lotes;

  const conGeo = () => lotesRef.current.filter((l) => l.geojson?.coordinates?.[0]?.length);

  const fitBounds = () => {
    const map = mapRef.current; if (!map) return;
    const ls = conGeo();
    if (!ls.length) return;
    const b = new maplibregl.LngLatBounds();
    ls.forEach((l) => l.geojson.coordinates[0].forEach((p) => b.extend(p as [number, number])));
    try { map.fitBounds(b, { padding: 56, maxZoom: 15, duration: 0 }); } catch { /* bounds vacío */ }
  };

  const renderMarkers = () => {
    const map = mapRef.current; if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    conGeo().forEach((l) => {
      const ring = l.geojson.coordinates[0];
      const lng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
      const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
      const el = document.createElement("div");
      el.className = "mc-lote-marker";
      el.textContent = `${l.nombre} · ${l.ha} ha`;
      el.style.cursor = "pointer";
      el.onclick = () => onToggleRef.current(l.idx);
      markersRef.current.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(map));
    });
  };

  // init
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const first = conGeo()[0]?.geojson.coordinates[0];
    const center: [number, number] = first
      ? [first.reduce((s, p) => s + p[0], 0) / first.length, first.reduce((s, p) => s + p[1], 0) / first.length]
      : [-56.0, -32.8];

    const map = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        sources: {
          sat: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "© Esri World Imagery" },
          etiquetas: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"], tileSize: 256 },
        },
        layers: [
          { id: "sat", type: "raster", source: "sat" },
          { id: "etiquetas", type: "raster", source: "etiquetas", paint: { "raster-opacity": 0.9 } as maplibregl.RasterLayerSpecification["paint"] },
        ],
      },
      center,
      zoom: 12.5,
      pitch: 0, // vista plana
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), "bottom-right");

    map.on("load", () => {
      map.addSource("lotes", { type: "geojson", data: fc(lotesRef.current, selRef.current) });
      map.addLayer({
        id: "lotes-fill", type: "fill", source: "lotes",
        paint: { "fill-color": ["case", ["==", ["get", "sel"], 1], "#5e9c48", "#cdd7c8"], "fill-opacity": ["case", ["==", ["get", "sel"], 1], 0.5, 0.2] } as maplibregl.FillLayerSpecification["paint"],
      });
      map.addLayer({
        id: "lotes-line", type: "line", source: "lotes",
        paint: { "line-color": ["case", ["==", ["get", "sel"], 1], "#2e7d32", "#ffffff"], "line-width": ["case", ["==", ["get", "sel"], 1], 3.2, 1.6], "line-opacity": 0.95 } as maplibregl.LineLayerSpecification["paint"],
      });
      map.on("click", "lotes-fill", (e) => {
        const idx = e.features?.[0]?.properties?.idx;
        if (idx != null) onToggleRef.current(Number(idx));
      });
      map.on("mouseenter", "lotes-fill", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "lotes-fill", () => { map.getCanvas().style.cursor = ""; });
      renderMarkers();
      fitBounds();
      readyRef.current = true;
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // updates: selección y lista de lotes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (map.getSource("lotes") as maplibregl.GeoJSONSource)?.setData(fc(lotes, seleccionados));
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes, seleccionados]);

  return <div ref={ref} style={{ position: "absolute", inset: 0 }} />;
}
