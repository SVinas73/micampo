"use client";

/* ============================================================
   MapaNDVI — mapa satelital real (Leaflet) para el módulo Lotes.
   - Base satelital Esri World Imagery (gratis, sin API key).
   - Dibujo de lotes (polígonos) con leaflet-draw → calcula
     hectáreas y centroide reales y los devuelve por onDrawn.
   - Dibuja los lotes existentes (con geometría) coloreados por NDVI.
   - Capa NDVI real de Sentinel Hub si está configurado el env
     NEXT_PUBLIC_SENTINEL_INSTANCE_ID (WMS, capa "NDVI").
   Sin lotes ni geometría, el mapa arranca vacío (en 0).
   ============================================================ */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-draw";

export type LoteGeo = {
  id: string;
  name: string;
  ndvi: number;
  vacio?: boolean;
  cultivoColor?: string | null;
  geojson?: GeoJSON.Polygon | null;
};

type Props = {
  lotes: LoteGeo[];
  selectedId?: string | null;
  layer: string; // "NDVI" | "Satélite" | "Cultivos"
  onSelect: (id: string) => void;
  onDrawn: (data: { geojson: GeoJSON.Polygon; hectareas: number; centro: { lat: number; lng: number }; perimetro: number }) => void;
};

const SENTINEL_INSTANCE = process.env.NEXT_PUBLIC_SENTINEL_INSTANCE_ID || "";

// Escala NDVI (0–1) → color (oliva DS). Para lotes sin medición (0) usa gris.
function ndviColor(v: number) {
  if (!v || v <= 0) return "#9aa39a";
  if (v >= 0.75) return "#1f6e2a";
  if (v >= 0.65) return "#5e7733";
  if (v >= 0.55) return "#8ea65a";
  if (v >= 0.45) return "#d9a538";
  return "#c08a22";
}

export default function MapaNDVI({ lotes, selectedId, layer, onSelect, onDrawn }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const lotesLayerRef = useRef<L.FeatureGroup | null>(null);
  const ndviLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const onDrawnRef = useRef(onDrawn);
  const onSelectRef = useRef(onSelect);
  onDrawnRef.current = onDrawn;
  onSelectRef.current = onSelect;

  // Init del mapa (una sola vez)
  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = L.map(ref.current, { center: [-33.5, -61.5], zoom: 6, zoomControl: true, attributionControl: true });
    mapRef.current = map;

    const satelite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "Imágenes © Esri, Maxar, Earthstar Geographics" }
    ).addTo(map);

    const labels = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, opacity: 0.9 }
    );

    // Capa NDVI real (Sentinel Hub) si está configurada
    if (SENTINEL_INSTANCE) {
      ndviLayerRef.current = L.tileLayer.wms(`https://services.sentinel-hub.com/ogc/wms/${SENTINEL_INSTANCE}`, {
        layers: "NDVI",
        format: "image/png",
        transparent: true,
        maxcc: 20,
        version: "1.3.0",
        attribution: "NDVI © Sentinel Hub / Copernicus Sentinel-2",
      } as L.WMSOptions);
    }

    const drawn = new L.FeatureGroup().addTo(map);
    const lotesFg = new L.FeatureGroup().addTo(map);
    lotesLayerRef.current = lotesFg;

    // Controles de capas base
    L.control.layers({ Satélite: satelite }, { Lugares: labels }, { collapsed: true }).addTo(map);

    // Herramienta de dibujo de lotes
    const drawControl = new (L as any).Control.Draw({
      position: "topright",
      draw: {
        polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: "#d9a538", weight: 3, fillOpacity: 0.1 } },
        rectangle: { shapeOptions: { color: "#d9a538", weight: 3 } },
        polyline: false, circle: false, marker: false, circlemarker: false,
      },
      edit: { featureGroup: drawn, remove: true },
    });
    map.addControl(drawControl);

    map.on((L as any).Draw.Event.CREATED, (e: any) => {
      const lyr = e.layer;
      drawn.addLayer(lyr);
      const latlngs = (lyr.getLatLngs()[0] as L.LatLng[]);
      const areaM2 = (L as any).GeometryUtil.geodesicArea(latlngs);
      const hectareas = Math.round((areaM2 / 10000) * 100) / 100;
      // perímetro
      let perim = 0;
      for (let i = 0; i < latlngs.length; i++) perim += latlngs[i].distanceTo(latlngs[(i + 1) % latlngs.length]);
      const centro = lyr.getBounds().getCenter();
      const coords = latlngs.map((p) => [p.lng, p.lat]);
      coords.push(coords[0]);
      const geojson: GeoJSON.Polygon = { type: "Polygon", coordinates: [coords] };
      onDrawnRef.current({ geojson, hectareas, centro: { lat: centro.lat, lng: centro.lng }, perimetro: Math.round(perim) });
      // se quita la figura provisional; el lote se vuelve a dibujar al guardarse
      drawn.removeLayer(lyr);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Capa NDVI según el toggle
  useEffect(() => {
    const map = mapRef.current;
    const ndvi = ndviLayerRef.current;
    if (!map || !ndvi) return;
    if (layer === "NDVI") { if (!map.hasLayer(ndvi)) ndvi.addTo(map); }
    else if (map.hasLayer(ndvi)) map.removeLayer(ndvi);
  }, [layer]);

  // Dibujar los lotes existentes
  useEffect(() => {
    const map = mapRef.current;
    const fg = lotesLayerRef.current;
    if (!map || !fg) return;
    fg.clearLayers();

    const conGeo = lotes.filter((l) => l.geojson && l.geojson.coordinates?.[0]?.length);
    conGeo.forEach((l) => {
      const ring = l.geojson!.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
      const sel = l.id === selectedId;
      const fill =
        layer === "Cultivos" ? (l.vacio ? "#9aa39a" : l.cultivoColor || "#5e7733") :
        layer === "NDVI" && SENTINEL_INSTANCE ? "transparent" :
        ndviColor(l.ndvi);
      const poly = L.polygon(ring, {
        color: sel ? "#ffffff" : "#1a1f1c",
        weight: sel ? 3.5 : 1.5,
        opacity: 0.95,
        fillColor: fill,
        fillOpacity: fill === "transparent" ? 0 : sel ? 0.5 : 0.4,
      });
      poly.on("click", () => onSelectRef.current(l.id));
      poly.bindTooltip(`${l.name}${l.ndvi ? ` · NDVI ${l.ndvi.toFixed(2)}` : ""}`, { sticky: true });
      fg.addLayer(poly);
    });

    if (conGeo.length > 0) {
      try { map.fitBounds(fg.getBounds().pad(0.2)); } catch {}
    }
  }, [lotes, selectedId, layer]);

  return <div ref={ref} style={{ width: "100%", height: "100%", minHeight: 600 }} />;
}
