"use client";

/* ============================================================
   MapaLibre — mapa satelital con terreno 3D (MapLibre GL).
   - Base: imágenes satelitales reales (Esri World Imagery).
   - Relieve 3D real (DEM terrarium, AWS Open Data) + hillshade.
   - Polígonos de lotes coloreados por cultivo/NDVI, seleccionables.
   - Dibujo de lotes por click (área/centroide/perímetro reales con Turf).
   Drop-in de MapaNDVI: mismas props.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import { Icon } from "@/components/mc";

export type LoteGeo = {
  id: string;
  name: string;
  ndvi: number;
  vacio?: boolean;
  cultivoColor?: string | null;
  geojson?: GeoJSON.Polygon | null;
  establecimientoId?: string | null;
  establecimientoNombre?: string | null;
};

/** Polígono envolvente (convex hull) de cada establecimiento a partir de sus lotes. */
function camposFc(lotes: LoteGeo[]): GeoJSON.FeatureCollection {
  const grupos = new Map<string, { nombre: string; pts: number[][] }>();
  lotes.forEach((l) => {
    if (!l.establecimientoId || !l.geojson?.coordinates?.[0]?.length) return;
    const g = grupos.get(l.establecimientoId) || { nombre: l.establecimientoNombre || "Campo", pts: [] };
    l.geojson.coordinates[0].forEach((p) => g.pts.push(p));
    grupos.set(l.establecimientoId, g);
  });
  const feats: GeoJSON.Feature[] = [];
  grupos.forEach((g, id) => {
    if (g.pts.length < 3) return;
    try {
      const fcPts = turf.featureCollection(g.pts.map((p) => turf.point(p)));
      const hull = turf.convex(fcPts, { concavity: Infinity });
      if (hull) {
        // Buffer pequeño para que el campo encierre a sus lotes con holgura
        const buffered = turf.buffer(hull, 0.06, { units: "kilometers" }) || hull;
        buffered.properties = { id, nombre: g.nombre };
        feats.push(buffered);
      }
    } catch { /* ignora grupos degenerados */ }
  });
  return { type: "FeatureCollection", features: feats };
}

function centroideAnillo(coords: number[][]): [number, number] {
  const lng = coords.reduce((s, p) => s + p[0], 0) / coords.length;
  const lat = coords.reduce((s, p) => s + p[1], 0) / coords.length;
  return [lng, lat];
}

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
};

/** Contornos de los campos: usa el límite dibujado del establecimiento si existe;
 *  si no, cae al envolvente (convex hull) de sus lotes. */
function boundariesFc(lotes: LoteGeo[], ests?: { id: string; nombre: string; coordenadas?: GeoJSON.Polygon | null }[]): GeoJSON.FeatureCollection {
  const feats: GeoJSON.Feature[] = [];
  const conLimite = new Set<string>();
  (ests || []).forEach((e) => {
    if (e.coordenadas?.coordinates?.[0]?.length) {
      conLimite.add(e.id);
      feats.push({ type: "Feature", geometry: e.coordenadas, properties: { id: e.id, nombre: e.nombre } });
    }
  });
  // Para los establecimientos sin límite dibujado, usar el hull de sus lotes
  const hull = camposFc(lotes.filter((l) => !l.establecimientoId || !conLimite.has(l.establecimientoId)));
  return { type: "FeatureCollection", features: [...feats, ...hull.features] };
}

function ndviColor(v: number) {
  if (!v || v <= 0) return "#9aa39a";
  if (v >= 0.75) return "#1f6e2a";
  if (v >= 0.65) return "#5e7733";
  if (v >= 0.55) return "#8ea65a";
  if (v >= 0.45) return "#d9a538";
  return "#c08a22";
}

function moistureColor(v: number) {
  if (!v || v <= 0) return "#9aa39a";
  if (v >= 0.7) return "#08519c";
  if (v >= 0.55) return "#4292c6";
  if (v >= 0.4) return "#9ecae1";
  return "#deebf7";
}

function colorDe(l: LoteGeo, layer: string) {
  if (layer === "NDVI") return ndviColor(l.ndvi);
  if (layer === "Humedad") return moistureColor(l.ndvi);
  if (l.vacio || !l.cultivoColor) return "#9aa39a";
  return l.cultivoColor;
}

function fc(lotes: LoteGeo[], layer: string): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: lotes
      .filter((l) => l.geojson?.coordinates?.[0]?.length)
      .map((l) => ({
        type: "Feature",
        geometry: l.geojson as GeoJSON.Polygon,
        properties: { id: l.id, name: l.name, color: colorDe(l, layer) },
      })),
  };
}

const SENTINEL_INSTANCE = process.env.NEXT_PUBLIC_SENTINEL_INSTANCE_ID || "";
// ID de la capa NDVI dentro de la instancia de Sentinel Hub. El default "3_NDVI"
// es el ID de la plantilla estándar de Sentinel Hub; se puede sobreescribir.
const SENTINEL_LAYER = process.env.NEXT_PUBLIC_SENTINEL_NDVI_LAYER || "3_NDVI";

function ndviWmsUrl(): string {
  const hoy = new Date();
  const desde = new Date(hoy.getTime() - 90 * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const time = `${fmt(desde)}/${fmt(hoy)}`;
  return (
    `https://services.sentinel-hub.com/ogc/wms/${SENTINEL_INSTANCE}` +
    `?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${SENTINEL_LAYER}` +
    `&FORMAT=image/png&TRANSPARENT=true&MAXCC=30&PRIORITY=mostRecent` +
    `&TIME=${time}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`
  );
}

function fillOpacity(layer: string, selectedId: string | null): any {
  // Con NDVI satelital real, los lotes quedan apenas delineados (se ve la imagen NDVI)
  if (layer === "NDVI" && SENTINEL_INSTANCE) {
    return ["case", ["==", ["get", "id"], selectedId ?? "__none__"], 0.18, 0.04];
  }
  const transparente = layer === "Satélite" || layer === "Topografía";
  const base = transparente ? 0.12 : 0.46;
  const sel = transparente ? 0.38 : 0.66;
  return ["case", ["==", ["get", "id"], selectedId ?? "__none__"], sel, base];
}

export default function MapaLibre({ lotes, selectedId, layer, onSelect, onDrawn, armarDibujo, onDibujoIniciado, volarA, establecimientos }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [terrainOn, setTerrainOn] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const drawPtsRef = useRef<[number, number][]>([]);
  const [drawCount, setDrawCount] = useState(0);
  const onSelectRef = useRef(onSelect);
  const onDrawnRef = useRef(onDrawn);
  const drawingRef = useRef(false);
  const layerRef = useRef(layer);
  const lotesRef = useRef(lotes);
  const establecimientosRef = useRef(establecimientos);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const campoMarkersRef = useRef<maplibregl.Marker[]>([]);
  onSelectRef.current = onSelect;
  onDrawnRef.current = onDrawn;
  drawingRef.current = drawing;
  layerRef.current = layer;
  lotesRef.current = lotes;
  establecimientosRef.current = establecimientos;

  // Markers HTML con el nombre de cada lote (no dependen de glyphs)
  const renderMarkers = () => {
    const map = mapRef.current; if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    lotesRef.current.filter((l) => l.geojson?.coordinates?.[0]?.length).forEach((l) => {
      const ring = l.geojson!.coordinates[0];
      const lng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
      const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
      const el = document.createElement("div");
      el.className = "mc-lote-marker";
      el.textContent = l.name;
      el.onclick = () => { if (!drawingRef.current) onSelectRef.current(l.id); };
      markersRef.current.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(map));
    });
  };

  // Etiquetas de los campos (establecimientos) en el borde superior de su envolvente
  const renderCampoMarkers = () => {
    const map = mapRef.current; if (!map) return;
    campoMarkersRef.current.forEach((m) => m.remove());
    campoMarkersRef.current = [];
    const fc = boundariesFc(lotesRef.current, establecimientosRef.current);
    fc.features.forEach((f) => {
      const poly = f.geometry as GeoJSON.Polygon;
      const ring = poly?.coordinates?.[0];
      if (!ring?.length) return;
      const c = centroideAnillo(ring);
      const top = ring.reduce((a, p) => (p[1] > a[1] ? p : a), ring[0]);
      const el = document.createElement("div");
      el.className = "mc-campo-marker";
      el.textContent = String((f.properties as any)?.nombre || "Campo");
      campoMarkersRef.current.push(new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([c[0], top[1]]).addTo(map));
    });
  };

  // ---- init ----
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const conGeo = lotes.filter((l) => l.geojson?.coordinates?.[0]?.length);
    let center: [number, number] = [-56.0, -32.8];
    if (conGeo.length) {
      const ring = conGeo[0].geojson!.coordinates[0];
      center = [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
    }

    const map = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        sources: {
          satelite: {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "© Esri World Imagery",
          },
          etiquetas: {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
          },
          dem: {
            type: "raster-dem",
            tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 13,
          },
        },
        layers: [
          { id: "satelite", type: "raster", source: "satelite" },
          { id: "hillshade", type: "hillshade", source: "dem", paint: { "hillshade-exaggeration": 0.4 } as any },
          { id: "etiquetas", type: "raster", source: "etiquetas", paint: { "raster-opacity": 0.9 } as any },
        ],
        terrain: { source: "dem", exaggeration: 1.3 },
      } as any,
      center,
      zoom: 13.5,
      pitch: 55,
      bearing: -17,
      maxPitch: 80,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

    map.on("load", () => {
      // Capa NDVI real (Sentinel Hub) — solo si está configurada
      if (SENTINEL_INSTANCE) {
        map.addSource("ndvi", { type: "raster", tiles: [ndviWmsUrl()], tileSize: 256, attribution: "NDVI © Sentinel Hub / Copernicus Sentinel-2" });
        map.addLayer({ id: "ndvi", type: "raster", source: "ndvi", layout: { visibility: layerRef.current === "NDVI" ? "visible" : "none" }, paint: { "raster-opacity": 0.85 } as any }, "etiquetas");
      }

      // Capa de Topografía (OpenTopoMap: relieve + curvas de nivel)
      map.addSource("topo", { type: "raster", tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 17, attribution: "© OpenTopoMap (CC-BY-SA)" });
      map.addLayer({ id: "topo", type: "raster", source: "topo", layout: { visibility: layerRef.current === "Topografía" ? "visible" : "none" }, paint: { "raster-opacity": 0.92 } as any }, "etiquetas");

      // Envolvente de cada campo (establecimiento)
      map.addSource("campos", { type: "geojson", data: boundariesFc(lotes, establecimientosRef.current) });
      map.addLayer({ id: "campos-fill", type: "fill", source: "campos", paint: { "fill-color": "#f0c75e", "fill-opacity": 0.06 } as any });
      map.addLayer({ id: "campos-line", type: "line", source: "campos", paint: { "line-color": "#f3cf6a", "line-width": 2.4, "line-dasharray": [3, 2], "line-opacity": 0.92 } as any });

      map.addSource("lotes", { type: "geojson", data: fc(lotes, layer) });
      map.addLayer({ id: "lotes-fill", type: "fill", source: "lotes", paint: { "fill-color": ["get", "color"], "fill-opacity": fillOpacity(layerRef.current, selectedId ?? null) } as any });
      map.addLayer({ id: "lotes-line", type: "line", source: "lotes", paint: { "line-color": "#ffffff", "line-width": ["case", ["==", ["get", "id"], selectedId ?? "__none__"], 3.5, 1.6], "line-opacity": 0.95 } as any });
      renderMarkers();
      renderCampoMarkers();
      map.addSource("draw", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "draw-fill", type: "fill", source: "draw", paint: { "fill-color": "#5e7733", "fill-opacity": 0.3 } });
      map.addLayer({ id: "draw-line", type: "line", source: "draw", paint: { "line-color": "#d9a538", "line-width": 2.5, "line-dasharray": [2, 1] } });
      map.addLayer({ id: "draw-pts", type: "circle", source: "draw", filter: ["==", "$type", "Point"], paint: { "circle-radius": 5, "circle-color": "#d9a538", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });

      // fit a los lotes
      if (conGeo.length) {
        const b = new maplibregl.LngLatBounds();
        conGeo.forEach((l) => l.geojson!.coordinates[0].forEach((p) => b.extend(p as [number, number])));
        map.fitBounds(b, { padding: 80, pitch: 50, maxZoom: 15, duration: 0 });
      }

      map.on("click", "lotes-fill", (e) => {
        if (drawingRef.current) return;
        const id = e.features?.[0]?.properties?.id;
        if (id) onSelectRef.current(String(id));
      });
      map.on("mouseenter", "lotes-fill", () => { if (!drawingRef.current) map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "lotes-fill", () => { map.getCanvas().style.cursor = ""; });

      // dibujo por click
      map.on("click", (e) => {
        if (!drawingRef.current) return;
        drawPtsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
        setDrawCount(drawPtsRef.current.length);
        repaintDraw();
      });
      map.on("dblclick", (e) => {
        if (!drawingRef.current) return;
        e.preventDefault();
        finalizarDibujo();
      });

      readyRef.current = true;
      setReady(true);
    });

    return () => { markersRef.current.forEach((m) => m.remove()); markersRef.current = []; campoMarkersRef.current.forEach((m) => m.remove()); campoMarkersRef.current = []; map.remove(); mapRef.current = null; readyRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const repaintDraw = () => {
    const map = mapRef.current; if (!map) return;
    const pts = drawPtsRef.current;
    const feats: GeoJSON.Feature[] = pts.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: p }, properties: {} }));
    if (pts.length >= 2) feats.push({ type: "Feature", geometry: { type: "LineString", coordinates: pts }, properties: {} });
    if (pts.length >= 3) feats.push({ type: "Feature", geometry: { type: "Polygon", coordinates: [[...pts, pts[0]]] }, properties: {} });
    (map.getSource("draw") as maplibregl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: feats });
  };

  const finalizarDibujo = () => {
    const pts = drawPtsRef.current;
    if (pts.length < 3) { cancelarDibujo(); return; }
    const ring = [...pts, pts[0]];
    const poly = turf.polygon([ring]);
    const hectareas = Math.round((turf.area(poly) / 10000) * 100) / 100;
    const c = turf.centroid(poly).geometry.coordinates as [number, number];
    const perimetro = Math.round(turf.length(turf.lineString(ring), { units: "kilometers" }) * 1000);
    onDrawnRef.current({ geojson: { type: "Polygon", coordinates: [ring] }, hectareas, centro: { lat: c[1], lng: c[0] }, perimetro });
    cancelarDibujo();
  };

  const cancelarDibujo = () => {
    drawPtsRef.current = [];
    setDrawCount(0);
    setDrawing(false);
    const map = mapRef.current;
    if (map) {
      (map.getSource("draw") as maplibregl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });
      map.doubleClickZoom.enable();
      map.getCanvas().style.cursor = "";
    }
  };

  const iniciarDibujo = () => {
    const map = mapRef.current; if (!map) return;
    drawPtsRef.current = [];
    setDrawCount(0);
    setDrawing(true);
    map.doubleClickZoom.disable();
    map.getCanvas().style.cursor = "crosshair";
  };

  // Disparador externo: el botón "Nuevo lote" del header arma el dibujo
  useEffect(() => {
    if (!ready || !armarDibujo || drawingRef.current) return;
    iniciarDibujo();
    onDibujoIniciado?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, armarDibujo]);

  // Volar a un lugar buscado (buscador del mapa)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !volarA) return;
    map.flyTo({ center: [volarA.lng, volarA.lat], zoom: 14.5, duration: 1200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volarA?.nonce, ready]);

  // ---- updates ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("lotes") as maplibregl.GeoJSONSource)?.setData(fc(lotes, layer));
    (map.getSource("campos") as maplibregl.GeoJSONSource)?.setData(boundariesFc(lotes, establecimientosRef.current));
    if (map.getLayer("lotes-fill")) map.setPaintProperty("lotes-fill", "fill-opacity", fillOpacity(layer, selectedId ?? null) as any);
    if (map.getLayer("ndvi")) map.setLayoutProperty("ndvi", "visibility", layer === "NDVI" ? "visible" : "none");
    if (map.getLayer("topo")) map.setLayoutProperty("topo", "visibility", layer === "Topografía" ? "visible" : "none");
    renderMarkers();
    renderCampoMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes, layer, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getLayer("lotes-fill")) return;
    map.setPaintProperty("lotes-fill", "fill-opacity", fillOpacity(layerRef.current, selectedId ?? null) as any);
    map.setPaintProperty("lotes-line", "line-width", ["case", ["==", ["get", "id"], selectedId ?? "__none__"], 3.5, 1.6] as any);
    // Volar hacia el lote seleccionado
    if (selectedId) {
      const lote = lotesRef.current.find((l) => l.id === selectedId);
      const ring = lote?.geojson?.coordinates?.[0];
      if (ring && ring.length) {
        const b = new maplibregl.LngLatBounds();
        ring.forEach((p) => b.extend(p as [number, number]));
        map.fitBounds(b, { padding: 120, maxZoom: 15.5, pitch: 52, bearing: -17, duration: 900 });
      }
    }
  }, [selectedId, ready]);

  const toggleTerrain = () => {
    const map = mapRef.current; if (!map) return;
    if (terrainOn) { map.setTerrain(null); map.easeTo({ pitch: 0, duration: 500 }); }
    else { map.setTerrain({ source: "dem", exaggeration: 1.3 }); map.easeTo({ pitch: 55, duration: 500 }); }
    setTerrainOn(!terrainOn);
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={ref} style={{ position: "absolute", inset: 0 }} />

      {/* Controles dibujo / terreno */}
      {!drawing ? (
        /* Arriba-derecha, debajo de las acciones del lote (Labor/Nota/Editar) cuando hay uno seleccionado */
        <div style={{ position: "absolute", top: selectedId ? 156 : 14, right: 16, zIndex: 500, display: "flex", flexDirection: "column", gap: 8, width: 152 }}>
          <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ justifyContent: "center" }} onClick={iniciarDibujo}><Icon name="pen" size={13} />Dibujar lote</button>
          <button className="mc-glass mc-btn--sm" style={{ borderRadius: 10, padding: "6px 11px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 12, color: "var(--mc-ink)", cursor: "pointer" }} onClick={toggleTerrain}>
            <Icon name="map" size={13} />{terrainOn ? "Vista plana" : "Relieve 3D"}
          </button>
        </div>
      ) : (
        /* Modo dibujo: panel inferior centrado */
        <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", zIndex: 500, display: "flex", gap: 8 }}>
          <div className="mc-glass" style={{ borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mc-ink)" }}>Tocá los vértices ({drawCount}) · doble click para cerrar</span>
            <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={finalizarDibujo} disabled={drawCount < 3}>Finalizar</button>
            <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={cancelarDibujo}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
