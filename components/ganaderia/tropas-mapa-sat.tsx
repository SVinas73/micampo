"use client";

// Mapa satelital REAL (Esri World Imagery, vía Leaflet) para el Panel de Gestión
// de Tropas: dibuja el polígono real de cada lote coloreado según la capa activa
// (ocupación/cantidades/descanso/raza/ruta) con tooltip de tropa y cabezas.
// Robusto ante formatos de geometría (Polygon/MultiPolygon/Feature/array crudo,
// orden lat-lng o lng-lat) y ante el tamaño del contenedor (invalidateSize +
// ResizeObserver). Lotes sin polígono caen a un marcador en su centro.

import { useEffect, useRef } from "react";
import L from "leaflet";
import { centroDeLote, ringDeCoordenadas } from "./tropas-tipos";

export type LoteMapaSat = {
  id: string;
  nombre: string;
  coordenadas?: string | null; // GeoJSON serializado (Polygon/MultiPolygon/Feature) o array de puntos
  centroLatitud?: number | null;
  centroLongitud?: number | null;
  color: string; // color base del relleno
  label: string; // texto del tooltip
  selected?: boolean;
  clickable?: boolean;
  etiqueta?: string | null; // texto corto sobre el lote (nombre de tropa / cabezas)
};

export type RutaMapaSat = {
  a: [number, number]; // [lat, lng] origen
  b: [number, number]; // [lat, lng] destino
  color: string;
  label: string;
};

export default function TropasMapaSat({
  lotes,
  rutas = [],
  onSelect,
  height = 440,
}: {
  lotes: LoteMapaSat[];
  rutas?: RutaMapaSat[];
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || mapRef.current) return;
    const map = L.map(el, { zoomControl: true, attributionControl: false });
    mapRef.current = map;
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.setView([-33.5, -61.5], 5);

    // El contenedor puede montarse con tamaño 0 (dynamic import / layout tardío):
    // recalcular tamaño y re-encuadrar cuando se estabiliza.
    const refit = () => {
      map.invalidateSize();
      if (boundsRef.current) map.fitBounds(boundsRef.current.pad(0.15));
    };
    requestAnimationFrame(refit);
    const ro = new ResizeObserver(() => refit());
    ro.observe(el);

    return () => {
      ro.disconnect();
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
      const ring = ringDeCoordenadas(lote.coordenadas);
      if (ring) {
        all.push(...ring);
        const poly = L.polygon(ring, {
          color: lote.selected ? "#ffffff" : "#ffffffcc",
          weight: lote.selected ? 3.5 : 1.8,
          fillColor: lote.color,
          fillOpacity: 0.45,
          opacity: 0.95,
        }).addTo(fg);
        poly.bindTooltip(`<b>${lote.nombre}</b><br>${lote.label}`, { direction: "top", sticky: true, opacity: 0.95 });
        if (lote.clickable && onSelect) poly.on("click", () => onSelect(lote.id));
        // Etiqueta permanente sobre el lote (nombre + dato de la capa)
        const c = centroDeLote(lote);
        if (c) {
          L.marker(c, {
            interactive: false,
            icon: L.divIcon({
              className: "",
              html: `<div style="transform:translate(-50%,-50%);background:rgba(15,23,42,.78);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;border:1px solid rgba(255,255,255,.35)">${lote.nombre}${lote.etiqueta ? ` · ${lote.etiqueta}` : ""}</div>`,
              iconSize: [0, 0],
            }),
          }).addTo(fg);
        }
      } else if (typeof lote.centroLatitud === "number" && typeof lote.centroLongitud === "number") {
        // Sin polígono dibujado: marcador en el centro para que el lote igual se vea
        const c: [number, number] = [lote.centroLatitud, lote.centroLongitud];
        all.push(c);
        const m = L.circleMarker(c, { radius: 9, color: "#ffffff", weight: 2, fillColor: lote.color, fillOpacity: 0.85 }).addTo(fg);
        m.bindTooltip(`<b>${lote.nombre}</b><br>${lote.label}<br><i>Sin contorno dibujado</i>`, { direction: "top", opacity: 0.95 });
        if (lote.clickable && onSelect) m.on("click", () => onSelect(lote.id));
      }
    }

    // Rutas del día (origen → destino) sobre el satélite
    for (const r of rutas) {
      all.push(r.a, r.b);
      L.polyline([r.a, r.b], { color: r.color, weight: 3.5, opacity: 0.9, dashArray: "8 6" }).addTo(fg);
      const mid: [number, number] = [(r.a[0] + r.b[0]) / 2, (r.a[1] + r.b[1]) / 2];
      const ang = (Math.atan2(r.b[0] - r.a[0], r.b[1] - r.a[1]) * 180) / Math.PI;
      L.marker(mid, {
        interactive: false,
        icon: L.divIcon({
          className: "",
          html: `<div style="transform:rotate(${-ang}deg);display:flex;line-height:0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${r.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(fg);
      L.marker(mid, {
        interactive: false,
        icon: L.divIcon({
          className: "",
          html: `<div style="transform:translate(-50%,-160%);background:${r.color};color:#fff;font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px;white-space:nowrap">${r.label}</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(fg);
    }

    if (all.length) {
      const b = L.latLngBounds(all);
      boundsRef.current = b;
      try {
        map.invalidateSize();
        map.fitBounds(b.pad(0.15));
      } catch {
        /* noop */
      }
    }
  }, [lotes, rutas, onSelect]);

  return <div ref={ref} style={{ width: "100%", height, minHeight: height, borderRadius: 14, overflow: "hidden", position: "relative", zIndex: 0 }} />;
}
