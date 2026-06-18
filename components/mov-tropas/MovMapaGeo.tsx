"use client";

/* ============================================================
   MovMapaGeo — mapa geográfico REAL de movimientos de tropa.
   Geolocaliza cada movimiento usando el centroide del lote cuyo
   nombre coincide con el origen/destino, y dibuja marcadores +
   flechas (origen→destino) con la cantidad de cabezas. Los
   tramos a destinos externos (sin lote) se listan aparte.
   ============================================================ */

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";

type LoteGeo = { nombre: string; lat: number; lng: number };
type Mov = { o: string; d: string; n: number; t: string };

export default function MovMapaGeo({ lotes, movs }: { lotes: LoteGeo[]; movs: Mov[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Geolocaliza un nombre de origen/destino contra los lotes
  const geoloc = useMemo(() => {
    return (nombre: string): LoteGeo | null => {
      if (!nombre) return null;
      const n = nombre.toLowerCase();
      // coincidencia por inclusión (el lote puede ser parte del texto "Campo · Potrero X")
      const exacto = lotes.find((l) => n.includes(l.nombre.toLowerCase()) || l.nombre.toLowerCase().includes(n.split("·").pop()!.trim()));
      return exacto || null;
    };
  }, [lotes]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { center: [-33.5, -61.5], zoom: 6, zoomControl: true, attributionControl: false });
    mapRef.current = map;
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Esri" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current, fg = layerRef.current;
    if (!map || !fg) return;
    fg.clearLayers();

    const usados = new Map<string, LoteGeo>();
    const pts: [number, number][] = [];

    movs.forEach((m) => {
      const a = geoloc(m.o), b = geoloc(m.d);
      if (a) usados.set(a.nombre, a);
      if (b) usados.set(b.nombre, b);
      if (a && b && a.nombre !== b.nombre) {
        const venta = m.t === "Venta";
        const color = venta ? "#2c6bb8" : "#5e7733";
        const w = Math.max(2, Math.min(7, m.n / 15));
        L.polyline([[a.lat, a.lng], [b.lat, b.lng]], { color, weight: w, opacity: 0.8 }).addTo(fg);
        // flecha + etiqueta en el punto medio
        const mid: [number, number] = [(a.lat + b.lat) / 2, (a.lng + b.lng) / 2];
        const ang = (Math.atan2(b.lat - a.lat, b.lng - a.lng) * 180) / Math.PI;
        L.marker(mid, {
          icon: L.divIcon({
            className: "",
            html: `<div style="transform:rotate(${-ang}deg);color:${color};font-size:18px;line-height:1;font-weight:900">➤</div>`,
            iconSize: [18, 18], iconAnchor: [9, 9],
          }),
        }).addTo(fg);
        L.marker(mid, {
          icon: L.divIcon({
            className: "",
            html: `<div style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;white-space:nowrap;transform:translateY(-16px)">${m.n} cab.</div>`,
            iconSize: [0, 0],
          }),
        }).addTo(fg);
        pts.push([a.lat, a.lng], [b.lat, b.lng]);
      }
    });

    usados.forEach((l) => {
      L.circleMarker([l.lat, l.lng], { radius: 8, color: "#fff", weight: 2, fillColor: "#5e7733", fillOpacity: 1 }).addTo(fg).bindTooltip(l.nombre, { permanent: false, direction: "top" });
      L.marker([l.lat, l.lng], { icon: L.divIcon({ className: "", html: `<div style="background:rgba(16,20,14,0.82);color:#fff;font-size:10px;font-weight:600;padding:2px 7px;border-radius:6px;white-space:nowrap;transform:translate(12px,-8px)">${l.nombre}</div>`, iconSize: [0, 0] }) }).addTo(fg);
    });

    if (pts.length > 0) { try { map.fitBounds(L.latLngBounds(pts).pad(0.3)); } catch {} }
    else if (usados.size > 0) { const arr = Array.from(usados.values()); try { map.fitBounds(L.latLngBounds(arr.map((l) => [l.lat, l.lng])).pad(0.4)); } catch {} }
  }, [movs, geoloc]);

  const geolocalizables = movs.filter((m) => geoloc(m.o) && geoloc(m.d) && geoloc(m.o)!.nombre !== geoloc(m.d)!.nombre).length;
  const externos = movs.length - geolocalizables;

  return (
    <div style={{ position: "relative", minHeight: 360 }}>
      <div ref={ref} style={{ position: "absolute", inset: 0, borderRadius: "inherit" }} />
      {externos > 0 && (
        <div style={{ position: "absolute", left: 12, bottom: 12, zIndex: 500, background: "rgba(255,255,255,0.94)", padding: "6px 10px", borderRadius: 8, fontSize: 11, color: "var(--mc-text-2)", boxShadow: "var(--sh-sm)" }}>
          {externos} movimiento{externos > 1 ? "s" : ""} a destino externo (sin lote ubicado)
        </div>
      )}
    </div>
  );
}
