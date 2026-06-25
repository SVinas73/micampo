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

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet-draw";
import { Icon } from "@/components/mc";

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
  armarDibujo?: boolean;
  onDibujoIniciado?: () => void;
  volarA?: { lat: number; lng: number; nonce: number } | null;
  establecimientos?: { id: string; nombre: string; coordenadas?: GeoJSON.Polygon | null }[];
  modoNota?: boolean;
  onPuntoNota?: (lat: number, lng: number) => void;
};

const SENTINEL_INSTANCE = process.env.NEXT_PUBLIC_SENTINEL_INSTANCE_ID || "";
// ID de la capa NDVI dentro de tu instancia de Sentinel Hub. El default "3_NDVI"
// es el ID de la plantilla estándar de Sentinel Hub; se puede sobreescribir.
const SENTINEL_LAYER = process.env.NEXT_PUBLIC_SENTINEL_NDVI_LAYER || "3_NDVI";

// Escala NDVI (0–1) → color (oliva DS). Para lotes sin medición (0) usa gris.
function ndviColor(v: number) {
  if (!v || v <= 0) return "#9aa39a";
  if (v >= 0.75) return "#1f6e2a";
  if (v >= 0.65) return "#5e7733";
  if (v >= 0.55) return "#8ea65a";
  if (v >= 0.45) return "#d9a538";
  return "#c08a22";
}

// Escala de humedad (proxy por vigor NDVI) → rampa azul. 0/sin dato → gris.
function moistureColor(v: number) {
  if (!v || v <= 0) return "#9aa39a";
  if (v >= 0.7) return "#08519c";
  if (v >= 0.55) return "#4292c6";
  if (v >= 0.4) return "#9ecae1";
  return "#deebf7";
}

export default function MapaNDVI({ lotes, selectedId, layer, onSelect, onDrawn, armarDibujo, onDibujoIniciado, volarA, establecimientos, modoNota, onPuntoNota }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const topoLayerRef = useRef<L.TileLayer | null>(null);
  const modoNotaRef = useRef(false);
  const onPuntoNotaRef = useRef(onPuntoNota);
  modoNotaRef.current = !!modoNota;
  onPuntoNotaRef.current = onPuntoNota;
  const lotesLayerRef = useRef<L.FeatureGroup | null>(null);
  const camposLayerRef = useRef<L.FeatureGroup | null>(null);
  const ndviLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const polyDrawOptsRef = useRef<any>(null);
  const drawHandlerRef = useRef<any>(null);
  const drawnRef = useRef<L.FeatureGroup | null>(null);
  const editLayerRef = useRef<any>(null);
  const [editando, setEditando] = useState(false);
  const onDrawnRef = useRef(onDrawn);
  const onSelectRef = useRef(onSelect);
  onDrawnRef.current = onDrawn;
  onSelectRef.current = onSelect;

  // Init del mapa (una sola vez)
  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = L.map(ref.current, { center: [-33.5, -61.5], zoom: 6, zoomControl: false, attributionControl: true });
    map.attributionControl.setPosition("bottomleft");
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;

    const satelite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "Imágenes © Esri, Maxar, Earthstar Geographics" }
    ).addTo(map);

    const labels = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, opacity: 0.9 }
    ).addTo(map); // nombres de lugares visibles por defecto (orientación al delimitar)

    // Capa de Topografía (OpenTopoMap: relieve + curvas de nivel). Se activa al elegir "Topografía".
    topoLayerRef.current = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      attribution: "© OpenTopoMap (CC-BY-SA)",
    });

    // Capa NDVI real (Sentinel Hub) si está configurada
    if (SENTINEL_INSTANCE) {
      // Ventana temporal: últimos 90 días, para mostrar el estado actual del campo
      const hoy = new Date();
      const desde = new Date(hoy.getTime() - 90 * 86400000);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      ndviLayerRef.current = L.tileLayer.wms(`https://services.sentinel-hub.com/ogc/wms/${SENTINEL_INSTANCE}`, {
        layers: SENTINEL_LAYER,
        format: "image/png",
        transparent: true,
        maxcc: 30,
        time: `${fmt(desde)}/${fmt(hoy)}`,
        priority: "mostRecent",
        version: "1.3.0",
        attribution: "NDVI © Sentinel Hub / Copernicus Sentinel-2",
      } as L.WMSOptions);
    }

    const camposFg = new L.FeatureGroup().addTo(map); // contornos de establecimientos (debajo de los lotes)
    camposLayerRef.current = camposFg;
    const lotesFg = new L.FeatureGroup().addTo(map);
    lotesLayerRef.current = lotesFg;
    const drawn = new L.FeatureGroup().addTo(map);
    drawnRef.current = drawn;

    // Controles de capas base
    L.control.layers({ Satélite: satelite }, { Lugares: labels }, { collapsed: true, position: "bottomright" }).addTo(map);

    // Herramienta de dibujo de lotes
    const polygonOpts = { allowIntersection: false, showArea: true, shapeOptions: { color: "#d9a538", weight: 3, fillOpacity: 0.1 } };
    polyDrawOptsRef.current = polygonOpts;
    const drawControl = new (L as any).Control.Draw({
      position: "topleft",
      draw: {
        polygon: polygonOpts,
        rectangle: { shapeOptions: { color: "#d9a538", weight: 3 } },
        polyline: false, circle: false, marker: false, circlemarker: false,
      },
      edit: { featureGroup: drawn, remove: true },
    });
    map.addControl(drawControl);

    // Al cerrar el polígono: queda EDITABLE (se pueden arrastrar los vértices)
    // hasta que el usuario confirme. Así no hay que rehacerlo de cero.
    map.on((L as any).Draw.Event.CREATED, (e: any) => {
      const lyr = e.layer;
      drawn.addLayer(lyr);
      editLayerRef.current = lyr;
      try { lyr.editing?.enable(); } catch { /* leaflet-draw sin edición */ }
      setEditando(true);
    });

    // Modo "Nota": el próximo click en el mapa marca el punto de la nota.
    map.on("click", (e: any) => {
      if (modoNotaRef.current && onPuntoNotaRef.current) onPuntoNotaRef.current(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Cursor de "marcar nota"
  useEffect(() => {
    const map = mapRef.current;
    if (map) map.getContainer().style.cursor = modoNota ? "crosshair" : "";
  }, [modoNota]);

  // Volar a un lugar buscado (buscador del mapa)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !volarA) return;
    map.flyTo([volarA.lat, volarA.lng], 15, { duration: 1.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volarA?.nonce]);

  // Contornos de establecimientos (línea punteada), igual que en la vista 3D.
  useEffect(() => {
    const map = mapRef.current;
    const fg = camposLayerRef.current;
    if (!map || !fg) return;
    fg.clearLayers();
    (establecimientos || []).forEach((e) => {
      const ring = e.coordenadas?.coordinates?.[0];
      if (!ring?.length) return;
      const latlngs = ring.map(([lng, lat]) => [lat, lng] as [number, number]);
      const poly = L.polygon(latlngs, { color: "#f3cf6a", weight: 2.5, dashArray: "6 6", fill: false, opacity: 0.95 });
      // Etiqueta permanente con el nombre del campo (no interactiva → no estorba al dibujar),
      // igual que el marcador del establecimiento en 3D.
      poly.bindTooltip(e.nombre, { permanent: true, direction: "top", className: "mc-campo-tip", opacity: 1 });
      fg.addLayer(poly);
    });
  }, [establecimientos]);

  // Disparador externo: arma el dibujo de polígono. Sirve para "Nuevo lote" y para
  // re-armar tras buscar un lugar (así no se pierde el cursor de delimitación).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !armarDibujo) return;
    // cancelar una edición en curso antes de iniciar un nuevo dibujo
    if (editLayerRef.current) {
      try { editLayerRef.current.editing?.disable(); } catch {}
      drawnRef.current?.removeLayer(editLayerRef.current);
      editLayerRef.current = null;
      setEditando(false);
    }
    try {
      if (drawHandlerRef.current) drawHandlerRef.current.disable(); // evita apilar handlers
      const handler = new (L as any).Draw.Polygon(map, polyDrawOptsRef.current);
      drawHandlerRef.current = handler;
      handler.enable();
      onDibujoIniciado?.();
    } catch { /* leaflet-draw no disponible */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armarDibujo]);

  // Capas raster según el toggle (NDVI satelital y Topografía)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const ndvi = ndviLayerRef.current;
    if (ndvi) {
      if (layer === "NDVI") { if (!map.hasLayer(ndvi)) ndvi.addTo(map); }
      else if (map.hasLayer(ndvi)) map.removeLayer(ndvi);
    }
    const topo = topoLayerRef.current;
    if (topo) {
      if (layer === "Topografía") { if (!map.hasLayer(topo)) topo.addTo(map); }
      else if (map.hasLayer(topo)) map.removeLayer(topo);
    }
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
        layer === "Satélite" || layer === "Topografía" ? "transparent" :
        layer === "Cultivos" ? (l.vacio ? "#9aa39a" : l.cultivoColor || "#5e7733") :
        layer === "Humedad" ? moistureColor(l.ndvi) :
        layer === "NDVI" && SENTINEL_INSTANCE ? "transparent" :
        ndviColor(l.ndvi);
      const poly = L.polygon(ring, {
        color: sel ? "#ffffff" : "#1a1f1c",
        weight: sel ? 3.5 : 1.5,
        opacity: 0.95,
        fillColor: fill,
        fillOpacity: fill === "transparent" ? 0 : sel ? 0.5 : 0.4,
      });
      poly.on("click", () => { if (!modoNotaRef.current) onSelectRef.current(l.id); });
      // Etiqueta permanente con el nombre del lote (igual que en 3D), no interactiva
      poly.bindTooltip(l.name, { permanent: true, direction: "center", className: "mc-lote-tip", opacity: 1 });
      fg.addLayer(poly);
    });

    // Volar al lote seleccionado; si no hay, encuadrar todos
    const sel = selectedId ? conGeo.find((l) => l.id === selectedId) : null;
    if (sel) {
      const ring = sel.geojson!.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
      try { map.flyToBounds(L.latLngBounds(ring).pad(0.4), { maxZoom: 16, duration: 0.9 }); } catch {}
    } else if (conGeo.length > 0) {
      try { map.fitBounds(fg.getBounds().pad(0.2)); } catch {}
    }
  }, [lotes, selectedId, layer]);

  const confirmarDibujo = () => {
    const lyr = editLayerRef.current;
    if (!lyr) { setEditando(false); return; }
    try { lyr.editing?.disable(); } catch {}
    const latlngs = lyr.getLatLngs()[0] as L.LatLng[];
    const areaM2 = (L as any).GeometryUtil.geodesicArea(latlngs);
    const hectareas = Math.round((areaM2 / 10000) * 100) / 100;
    let perim = 0;
    for (let i = 0; i < latlngs.length; i++) perim += latlngs[i].distanceTo(latlngs[(i + 1) % latlngs.length]);
    const centro = lyr.getBounds().getCenter();
    const coords = latlngs.map((p) => [p.lng, p.lat]);
    coords.push(coords[0]);
    const geojson: GeoJSON.Polygon = { type: "Polygon", coordinates: [coords] };
    onDrawnRef.current({ geojson, hectareas, centro: { lat: centro.lat, lng: centro.lng }, perimetro: Math.round(perim) });
    drawnRef.current?.removeLayer(lyr);
    editLayerRef.current = null;
    setEditando(false);
  };

  const cancelarDibujo = () => {
    const lyr = editLayerRef.current;
    if (lyr) { try { lyr.editing?.disable(); } catch {} drawnRef.current?.removeLayer(lyr); }
    editLayerRef.current = null;
    setEditando(false);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 600 }}>
      <div ref={ref} style={{ width: "100%", height: "100%", minHeight: 600 }} />
      {editando && (
        <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.96)", border: "1px solid var(--mc-line)", borderRadius: 12, boxShadow: "var(--sh-lg)", padding: "8px 12px" }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--mc-ink)" }}>Arrastrá los puntos para ajustar el contorno</span>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={confirmarDibujo}><Icon name="check" size={13} />Confirmar contorno</button>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={cancelarDibujo}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
