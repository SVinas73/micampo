"use client";

// Mapa satelital REAL (Esri World Imagery, vía Leaflet) para el Panel de Gestión
// de Tropas: dibuja el polígono real de cada lote coloreado según la capa activa
// (ocupación/cantidades/descanso/raza/ruta) con tooltip de tropa y cabezas.

import { useEffect, useRef } from "react";
import L from "leaflet";

export type LoteMapaSat = {
  id: string;
  nombre: string;
  coordenadas?: string | null; // GeoJSON Polygon serializado
  color: string; // color base del relleno (sólido)
  label: string; // texto del tooltip
  selected?: boolean;
  clickable?: boolean;
};

/** Extrae el anillo exterior [ [lat,lng], ... ] de un GeoJSON Polygon serializado. */
function ringDe(coordenadas?: string | null): [number, number][] | null {
  if (!coordenadas) return null;
  let geo: unknown;
  try {
    geo = typeof coordenadas === "string" ? JSON.parse(coordenadas) : coordenadas;
  } catch {
    return null;
  }
  const g = geo as { type?: string; coordinates?: number[][][] } | number[][];
  let ring: unknown = null;
  if (Array.isArray(g)) ring = g;
  else if (g?.coordinates?.[0]) ring = g.coordinates[0];
  if (!Array.isArray(ring)) return null;
  const pts = (ring as unknown[])
    .map((c) => {
      if (Array.isArray(c) && c.length >= 2) return [Number(c[1]), Number(c[0])] as [number, number]; // [lng,lat] → [lat,lng]
      const o = c as { lat?: number; lng?: number };
      if (o && typeof o.lat === "number" && typeof o.lng === "number") return [o.lat, o.lng] as [number, number];
      return null;
    })
    .filter((p): p is [number, number] => !!p && isFinite(p[0]) && isFinite(p[1]));
  return pts.length >= 3 ? pts : null;
}

export default function TropasMapaSat({
  lotes,
  onSelect,
  height = 440,
}: {
  lotes: LoteMapaSat[];
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, attributionControl: false });
    mapRef.current = map;
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.setView([-33.5, -61.5], 6);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const fg = layerRef.current;
    if (!map || !fg) return;
    fg.clearLayers();
    const all: [number, number][] = [];
    for (const lote of lotes) {
      const ring = ringDe(lote.coordenadas);
      if (!ring) continue;
      all.push(...ring);
      const poly = L.polygon(ring, {
        color: lote.selected ? "#ffffff" : "#ffffffcc",
        weight: lote.selected ? 3 : 1.6,
        fillColor: lote.color,
        fillOpacity: 0.5,
        opacity: 0.95,
      }).addTo(fg);
      poly.bindTooltip(`<b>${lote.nombre}</b><br>${lote.label}`, { direction: "top", sticky: true, opacity: 0.95, className: "mc-map-tip" });
      if (lote.clickable && onSelect) poly.on("click", () => onSelect(lote.id));
    }
    if (all.length) {
      try {
        map.fitBounds(L.latLngBounds(all).pad(0.15));
      } catch {
        /* noop */
      }
    }
  }, [lotes, onSelect]);

  return <div ref={ref} style={{ width: "100%", height, borderRadius: 14, overflow: "hidden" }} />;
}
