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
};

type Props = {
  lotes: LoteGeo[];
  selectedId?: string | null;
  layer: string; // "NDVI" | "Satélite" | "Cultivos"
  onSelect: (id: string) => void;
  onDrawn: (data: { geojson: GeoJSON.Polygon; hectareas: number; centro: { lat: number; lng: number }; perimetro: number }) => void;
};

function ndviColor(v: number) {
  if (!v || v <= 0) return "#9aa39a";
  if (v >= 0.75) return "#1f6e2a";
  if (v >= 0.65) return "#5e7733";
  if (v >= 0.55) return "#8ea65a";
  if (v >= 0.45) return "#d9a538";
  return "#c08a22";
}

function colorDe(l: LoteGeo, layer: string) {
  if (layer === "NDVI") return ndviColor(l.ndvi);
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

export default function MapaLibre({ lotes, selectedId, layer, onSelect, onDrawn }: Props) {
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
  onSelectRef.current = onSelect;
  onDrawnRef.current = onDrawn;
  drawingRef.current = drawing;

  // ---- init ----
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const conGeo = lotes.filter((l) => l.geojson?.coordinates?.[0]?.length);
    let center: [number, number] = [-61.5, -33.3];
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
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      map.addSource("lotes", { type: "geojson", data: fc(lotes, layer) });
      map.addLayer({ id: "lotes-fill", type: "fill", source: "lotes", paint: { "fill-color": ["get", "color"], "fill-opacity": ["case", ["==", ["get", "id"], selectedId ?? "__none__"], 0.62, 0.4] } as any });
      map.addLayer({ id: "lotes-line", type: "line", source: "lotes", paint: { "line-color": "#ffffff", "line-width": ["case", ["==", ["get", "id"], selectedId ?? "__none__"], 3.5, 1.6], "line-opacity": 0.95 } as any });
      map.addLayer({ id: "lotes-label", type: "symbol", source: "lotes", layout: { "text-field": ["get", "name"], "text-size": 13, "text-font": ["Open Sans Bold"] } as any, paint: { "text-color": "#fff", "text-halo-color": "rgba(0,0,0,0.55)", "text-halo-width": 1.4 } as any });
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

    return () => { map.remove(); mapRef.current = null; readyRef.current = false; };
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

  // ---- updates ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("lotes") as maplibregl.GeoJSONSource)?.setData(fc(lotes, layer));
  }, [lotes, layer, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getLayer("lotes-fill")) return;
    map.setPaintProperty("lotes-fill", "fill-opacity", ["case", ["==", ["get", "id"], selectedId ?? "__none__"], 0.62, 0.4] as any);
    map.setPaintProperty("lotes-line", "line-width", ["case", ["==", ["get", "id"], selectedId ?? "__none__"], 3.5, 1.6] as any);
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
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 500, display: "flex", gap: 8 }}>
        {!drawing ? (
          <>
            <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={iniciarDibujo}><Icon name="pen" size={13} />Dibujar lote</button>
            <button className="mc-glass mc-btn--sm" style={{ borderRadius: 9, padding: "6px 11px", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 12, color: "var(--mc-ink)", cursor: "pointer" }} onClick={toggleTerrain}>
              <Icon name="map" size={13} />{terrainOn ? "Vista plana" : "Relieve 3D"}
            </button>
          </>
        ) : (
          <div className="mc-glass" style={{ borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mc-ink)" }}>Tocá los vértices ({drawCount}) · doble click para cerrar</span>
            <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={finalizarDibujo} disabled={drawCount < 3}>Finalizar</button>
            <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={cancelarDibujo}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}
