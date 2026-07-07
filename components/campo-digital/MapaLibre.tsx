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
  humedad?: number;
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

export type RxMapa = { fc: GeoJSON.FeatureCollection; contorno?: { type: "Polygon"; coordinates: number[][][] } | null };

type Props = {
  lotes: LoteGeo[];
  notas?: NotaGeo[];
  // Panel de capas GIS: overlays independientes sobre la vista elegida.
  satVisible?: boolean; // imagen satelital base
  ndviVisible?: boolean; // raster NDVI real (Sentinel-2 / NASA GIBS)
  rx?: RxMapa | null; // mapa de prescripción (vector + dosis) generado desde la ficha
  rxVisible?: boolean;
  // Rendimiento: por defecto NDVI/topo/relieve se acotan a los campos. Con true se
  // muestran en TODO el mapa (opción por pestaña de vista).
  capaCompleta?: boolean;
  // Muestra la imagen satelital ACTUAL (Sentinel-2 color natural) sobre los campos,
  // para que la vista satélite coincida en el tiempo con NDVI/prescripción.
  satActual?: boolean;
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
  onEliminarNota?: (id: string) => void;
  onCampoConLotes?: () => void;
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

/** BBox [minLng,minLat,maxLng,maxLat] que encierra TODOS los lotes/campos creados,
 *  con un margen chico. Se usa para acotar los rasters (NDVI/topo/relieve/satélite
 *  actual) a los campos por defecto → menos tiles, más fluido. Null si no hay geometría. */
function boundsDeCampos(lotes: LoteGeo[], ests?: { id: string; nombre: string; coordenadas?: GeoJSON.Polygon | null }[]): [number, number, number, number] | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, hay = false;
  const add = (ring: number[][]) => ring.forEach((p) => {
    if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; hay = true;
  });
  lotes.forEach((l) => { const r = l.geojson?.coordinates?.[0]; if (r?.length) add(r); });
  (ests || []).forEach((e) => { const r = e.coordenadas?.coordinates?.[0]; if (r?.length) add(r); });
  if (!hay) return null;
  const dx = (maxX - minX) * 0.06 || 0.01, dy = (maxY - minY) * 0.06 || 0.01;
  return [minX - dx, minY - dy, maxX + dx, maxY + dy];
}

/** Polígono "mundo con huecos": un rectángulo enorme con los lotes/campos recortados
 *  como huecos. Se usa como MÁSCARA para mostrar los rasters (NDVI/topo/relieve) SOLO
 *  sobre los campos (afuera se atenúa). Vacío si no hay geometría. */
function mascaraFc(lotes: LoteGeo[], ests?: { id: string; nombre: string; coordenadas?: GeoJSON.Polygon | null }[]): GeoJSON.FeatureCollection {
  const huecos: number[][][] = [];
  lotes.forEach((l) => { const r = l.geojson?.coordinates?.[0]; if (r && r.length >= 4) huecos.push(r); });
  (ests || []).forEach((e) => { const r = e.coordenadas?.coordinates?.[0]; if (r && r.length >= 4) huecos.push(r); });
  if (!huecos.length) return { type: "FeatureCollection", features: [] };
  const mundo: number[][] = [[-179.9, -85], [179.9, -85], [179.9, 85], [-179.9, 85], [-179.9, -85]];
  return { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Polygon", coordinates: [mundo, ...huecos] }, properties: {} }] };
}

function ndviColor(v: number) {
  if (!v || v <= 0) return "#9aa39a";
  if (v >= 0.75) return "#1f6e2a";
  if (v >= 0.65) return "#5e7733";
  if (v >= 0.55) return "#8ea65a";
  if (v >= 0.45) return "#d9a538";
  return "#c08a22";
}

// Humedad de suelo real (Open-Meteo, m³/m³) → rampa azul. Sin dato → gris.
function moistureColor(v?: number) {
  if (v == null || v <= 0) return "#9aa39a";
  if (v >= 0.33) return "#08519c"; // muy húmedo
  if (v >= 0.25) return "#4292c6"; // húmedo
  if (v >= 0.17) return "#9ecae1"; // medio
  return "#deebf7"; // seco
}

function colorDe(l: LoteGeo, layer: string) {
  // En NDVI el color lo pone el raster satelital (los rellenos van casi transparentes).
  if (layer === "NDVI") return ndviColor(l.ndvi);
  if (layer === "Humedad") return moistureColor(l.humedad);
  // Vista Cultivos: tonalidad fuerte por cultivo; lote vacío blanquecino.
  if (l.vacio || !l.cultivoColor) return "#f5f2ea";
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

export type NotaGeo = { id: string; lat: number; lng: number; texto: string; prioridad: string; loteNombre: string };

// Color del punto de nota según su prioridad.
function colorNota(prioridad?: string | null): string {
  if (prioridad === "Crítica") return "#d13a3a";
  if (prioridad === "Moderada") return "#d9a538";
  if (prioridad === "No urgente") return "#5e7733";
  return "#64748b"; // notas viejas sin prioridad
}

/** Cada nota en SU coordenada real, con color por prioridad. */
function notasFc(notas: NotaGeo[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: notas.map((n) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [n.lng, n.lat] },
      properties: { id: n.id, name: n.loteNombre, nota: n.texto, prioridad: n.prioridad, color: colorNota(n.prioridad) },
    })),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/** Tarjeta HTML estilizada para el tooltip de nota (color según prioridad). */
function notaPopupHtml(nombre: string, nota: string, prioridad?: string | null): string {
  const c = colorNota(prioridad);
  return (
    `<div style="font-family:inherit;min-width:150px">` +
      `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">` +
        `<span style="width:8px;height:8px;border-radius:50%;background:${c};display:inline-block;flex:none"></span>` +
        `<span style="font-weight:700;font-size:12px;color:#324428;letter-spacing:.01em">${escapeHtml(nombre)}</span>` +
        (prioridad ? `<span style="font-size:9.5px;font-weight:700;color:${c};border:1px solid ${c}55;border-radius:999px;padding:1px 7px">${escapeHtml(prioridad)}</span>` : "") +
      `</div>` +
      `<div style="font-size:12px;line-height:1.4;color:#3a4433;white-space:pre-wrap">${escapeHtml(nota)}</div>` +
    `</div>`
  );
}

// Con Sentinel configurado (instance id presente), el raster NDVI se sirve desde
// nuestro proxy server-side (/api/sentinel/ndvi/z/x/y), que usa la Process API con
// las credenciales OAuth del servidor y devuelve Sentinel-2 real a 10 m coloreado.
// No depende de las capas WMS de la instancia (por eso ya no hay 400 en consola).
const SENTINEL_INSTANCE = process.env.NEXT_PUBLIC_SENTINEL_INSTANCE_ID || "";

function fillOpacity(layer: string, selectedId: string | null): any {
  // Vista NDVI: el color lo pone el raster NDVI real → lotes apenas delineados.
  if (layer === "NDVI") {
    return ["case", ["==", ["get", "id"], selectedId ?? "__none__"], 0.18, 0.04];
  }
  const transparente = layer === "Satélite" || layer === "Topografía" || layer === "Relieve";
  const base = transparente ? 0.12 : 0.46;
  const sel = transparente ? 0.38 : 0.66;
  return ["case", ["==", ["get", "id"], selectedId ?? "__none__"], sel, base];
}

export default function MapaLibre({ lotes, notas = [], satVisible = true, ndviVisible = false, rx = null, rxVisible = false, capaCompleta = false, satActual = false, selectedId, layer, onSelect, onDrawn, armarDibujo, onDibujoIniciado, volarA, establecimientos, modoNota, onPuntoNota, onEliminarNota, onCampoConLotes }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [terrainOn, setTerrainOn] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const drawPtsRef = useRef<[number, number][]>([]);
  const [drawCount, setDrawCount] = useState(0);
  const onSelectRef = useRef(onSelect);
  const onDrawnRef = useRef(onDrawn);
  const drawingRef = useRef(false);
  const layerRef = useRef(layer);
  const lotesRef = useRef(lotes);
  const notasRef = useRef(notas);
  const ndviVisRef = useRef(ndviVisible);
  ndviVisRef.current = ndviVisible;
  // Acotado de rasters a los campos (rendimiento) + imagen satelital actual.
  const capaCompletaRef = useRef(capaCompleta);
  const satActualRef = useRef(satActual);
  const boundsRef = useRef<[number, number, number, number] | null>(null);
  capaCompletaRef.current = capaCompleta;
  satActualRef.current = satActual;
  boundsRef.current = boundsDeCampos(lotes, establecimientos);
  // Lupita de aumento para el dibujo de lotes (mini-mapa circular junto al cursor).
  const lensRef = useRef<HTMLDivElement>(null);
  const lensMapRef = useRef<maplibregl.Map | null>(null);
  const establecimientosRef = useRef(establecimientos);
  const modoNotaRef = useRef(false);
  const onPuntoNotaRef = useRef(onPuntoNota);
  const onEliminarNotaRef = useRef(onEliminarNota);
  onEliminarNotaRef.current = onEliminarNota;
  modoNotaRef.current = !!modoNota;
  onPuntoNotaRef.current = onPuntoNota;
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const campoMarkersRef = useRef<maplibregl.Marker[]>([]);
  const notaPopupRef = useRef<maplibregl.Popup | null>(null);
  onSelectRef.current = onSelect;
  onDrawnRef.current = onDrawn;
  drawingRef.current = drawing;
  layerRef.current = layer;
  lotesRef.current = lotes;
  notasRef.current = notas;
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
      el.onclick = () => { if (!drawingRef.current && !modoNotaRef.current) onSelectRef.current(l.id); };
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

  // (Re)crea las capas raster acotables: satélite ACTUAL (Sentinel-2), NDVI, topo y
  // relieve. Por defecto van acotadas al bbox de los campos (menos tiles → más
  // fluido); con capaCompleta se muestran en todo el mapa. Idempotente.
  const removerCapasRaster = (map: maplibregl.Map) => {
    if (map.getLayer("mascara-fill")) map.removeLayer("mascara-fill");
    if (map.getSource("mascara")) map.removeSource("mascara");
    ["truecolor", "ndvi", "topo", "relieve-hs", "relieve"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
  };
  const agregarCapasRaster = (map: maplibregl.Map) => {
    removerCapasRaster(map);
    const campos = boundsRef.current || undefined;                  // bbox de mis campos
    const acot = capaCompletaRef.current ? undefined : campos;      // acotado según toggle
    const antes = map.getLayer("etiquetas") ? "etiquetas" : undefined;
    const conBounds = (b?: [number, number, number, number]) => (b ? { bounds: b } : {});

    // Imagen satelital ACTUAL (Sentinel-2 color natural) sobre los campos → coincide con NDVI.
    if (SENTINEL_INSTANCE) {
      map.addSource("truecolor", { type: "raster", tiles: [`${location.origin}/api/sentinel/truecolor/{z}/{x}/{y}`], tileSize: 256, minzoom: 9, maxzoom: 17, ...conBounds(campos), attribution: "© Copernicus Sentinel-2" } as any);
      map.addLayer({ id: "truecolor", type: "raster", source: "truecolor", layout: { visibility: satActualRef.current && satVisible ? "visible" : "none" }, paint: { "raster-opacity": 1 } as any }, antes);
    }

    // NDVI (Sentinel-2 con credenciales; NASA MODIS sin ellas).
    if (SENTINEL_INSTANCE) {
      map.addSource("ndvi", { type: "raster", tiles: [`${location.origin}/api/sentinel/ndvi/{z}/{x}/{y}`], tileSize: 256, minzoom: 9, maxzoom: 17, ...conBounds(acot), attribution: "NDVI © Copernicus Sentinel-2" } as any);
      map.addLayer({ id: "ndvi", type: "raster", source: "ndvi", layout: { visibility: ndviVisRef.current ? "visible" : "none" }, paint: { "raster-opacity": 0.9 } as any }, antes);
    } else {
      map.addSource("ndvi", { type: "raster", tiles: ["https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png"], tileSize: 256, maxzoom: 9, ...conBounds(acot), attribution: "NDVI © NASA GIBS / MODIS Terra" } as any);
      map.addLayer({ id: "ndvi", type: "raster", source: "ndvi", layout: { visibility: ndviVisRef.current ? "visible" : "none" }, paint: { "raster-opacity": 0.8 } as any }, antes);
    }

    // Topografía (OpenTopoMap).
    map.addSource("topo", { type: "raster", tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 17, ...conBounds(acot), attribution: "© OpenTopoMap (CC-BY-SA)" } as any);
    map.addLayer({ id: "topo", type: "raster", source: "topo", layout: { visibility: layerRef.current === "Topografía" ? "visible" : "none" }, paint: { "raster-opacity": 0.92 } as any }, antes);

    // Relieve (sombreado Esri + tinte hipsométrico).
    const relieveOn = layerRef.current === "Relieve";
    map.addSource("relieve-hs", { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 16, ...conBounds(acot), attribution: "© Esri — Sombreado de relieve" } as any);
    map.addLayer({ id: "relieve-hs", type: "raster", source: "relieve-hs", layout: { visibility: relieveOn ? "visible" : "none" }, paint: { "raster-opacity": 1 } as any }, antes);
    map.addSource("relieve", { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 8, ...conBounds(acot), attribution: "© Esri" } as any);
    map.addLayer({ id: "relieve", type: "raster", source: "relieve", layout: { visibility: relieveOn ? "visible" : "none" }, paint: { "raster-opacity": 0.45 } as any }, antes);

    // MÁSCARA: encima de los rasters (NDVI/topo/relieve) para mostrarlos SOLO sobre
    // los campos; afuera se atenúa. Solo cuando la vista es una de esas y NO es "todo
    // el mapa". Los huecos son los lotes/campos reales → recorte exacto (no un rectángulo).
    const vistaRaster = layerRef.current === "NDVI" || layerRef.current === "Topografía" || layerRef.current === "Relieve";
    const mascaraOn = vistaRaster && !capaCompletaRef.current && !!boundsRef.current;
    map.addSource("mascara", { type: "geojson", data: mascaraFc(lotesRef.current, establecimientosRef.current) });
    map.addLayer({ id: "mascara-fill", type: "fill", source: "mascara", layout: { visibility: mascaraOn ? "visible" : "none" }, paint: { "fill-color": "#0b1016", "fill-opacity": 0.62 } as any }, antes);
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
            maxzoom: 15,
          },
        },
        layers: [
          { id: "satelite", type: "raster", source: "satelite" },
          { id: "hillshade", type: "hillshade", source: "dem", paint: { "hillshade-exaggeration": 0.4 } as any },
          { id: "etiquetas", type: "raster", source: "etiquetas", paint: { "raster-opacity": 0.9 } as any },
        ],
        // Arranca en vista PLANA (sin terreno 3D): carga más rápido y fluido.
        // El usuario puede activar "Relieve 3D" con el toggle.
      } as any,
      center,
      zoom: 13.5,
      pitch: 0,
      bearing: 0,
      maxPitch: 80,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

    map.on("load", () => {
      // Capas raster (satélite actual / NDVI / topo / relieve), acotadas a los campos
      // por defecto para que cargue más rápido. Ver agregarCapasRaster().
      agregarCapasRaster(map);

      // Envolvente de cada campo (establecimiento)
      map.addSource("campos", { type: "geojson", data: boundariesFc(lotes, establecimientosRef.current) });
      map.addLayer({ id: "campos-fill", type: "fill", source: "campos", paint: { "fill-color": "#f0c75e", "fill-opacity": 0.06 } as any });
      map.addLayer({ id: "campos-line", type: "line", source: "campos", paint: { "line-color": "#f3cf6a", "line-width": 2.4, "line-dasharray": [3, 2], "line-opacity": 0.92 } as any });

      map.addSource("lotes", { type: "geojson", data: fc(lotes, layer) });
      map.addLayer({ id: "lotes-fill", type: "fill", source: "lotes", paint: { "fill-color": ["get", "color"], "fill-opacity": fillOpacity(layerRef.current, selectedId ?? null) } as any });
      map.addLayer({ id: "lotes-line", type: "line", source: "lotes", paint: { "line-color": layerRef.current === "Topografía" || layerRef.current === "Relieve" ? "#111111" : "#ffffff", "line-width": ["case", ["==", ["get", "id"], selectedId ?? "__none__"], 3.5, 1.6], "line-opacity": 0.95 } as any });

      // Indicador de nota: punto rojo pulsante en el centroide de los lotes con nota
      map.addSource("notas", { type: "geojson", data: notasFc(notasRef.current) });
      map.addLayer({ id: "notas-halo", type: "circle", source: "notas", paint: { "circle-radius": 11, "circle-color": ["get", "color"], "circle-opacity": 0.18 } as any });
      map.addLayer({ id: "notas-dot", type: "circle", source: "notas", paint: { "circle-radius": 6, "circle-color": ["get", "color"], "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } as any });

      // Capa de PRESCRIPCIÓN (vector + dosis) sobre el satélite: zonas coloreadas,
      // contorno rojo del lote y dosis numérica nítida en cada zona.
      map.addSource("rx", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("rx-contorno", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "rx-fill", type: "fill", source: "rx", layout: { visibility: "none" }, paint: { "fill-color": ["get", "color"], "fill-opacity": 0.82 } as any });
      map.addLayer({ id: "rx-line", type: "line", source: "rx", layout: { visibility: "none" }, paint: { "line-color": "#5b5244", "line-width": 0.8, "line-opacity": 0.8 } as any });
      map.addLayer({ id: "rx-borde", type: "line", source: "rx-contorno", layout: { visibility: "none" }, paint: { "line-color": "#d92b2b", "line-width": 2.6 } as any });
      map.addLayer({
        id: "rx-label", type: "symbol", source: "rx",
        // Sin dosis sobre recortes ínfimos (astillas del suavizado): ensucian el mapa.
        filter: [">=", ["coalesce", ["get", "areaHa"], 1], 0.3],
        layout: {
          visibility: "none",
          "text-field": ["to-string", ["get", "dosis"]],
          "text-font": ["Noto Sans Bold"],
          "text-size": 14,
          "text-allow-overlap": true,
        } as any,
        paint: { "text-color": "#1c2417", "text-halo-color": "#ffffff", "text-halo-width": 1.8 } as any,
      });
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
        map.fitBounds(b, { padding: 80, maxZoom: 15, duration: 0 });
      }

      map.on("click", "lotes-fill", (e) => {
        if (drawingRef.current || modoNotaRef.current || e.defaultPrevented) return;
        // Si el click cayó sobre una NOTA, la maneja el popup de la nota (no selecciona lote).
        if (map.queryRenderedFeatures(e.point, { layers: ["notas-dot"] }).length > 0) return;
        const id = e.features?.[0]?.properties?.id;
        if (id) onSelectRef.current(String(id));
      });
      // Mientras se DIBUJA, la cruz nunca se pierde (aunque el mouse pase por otro lote).
      map.on("mouseenter", "lotes-fill", () => { if (!drawingRef.current && !modoNotaRef.current) map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "lotes-fill", () => { if (!drawingRef.current && !modoNotaRef.current) map.getCanvas().style.cursor = ""; });

      // Tooltip de nota: anclado a la COORDENADA real de la nota (no al cursor).
      const mostrarNota = (e: maplibregl.MapLayerMouseEvent) => {
        const f = e.features?.[0];
        const nombre = f?.properties?.name ? String(f.properties.name) : "";
        const nota = f?.properties?.nota ? String(f.properties.nota) : "";
        const prioridad = f?.properties?.prioridad ? String(f.properties.prioridad) : "";
        if (!nota) { ocultarNota(); return; }
        if (!notaPopupRef.current) {
          notaPopupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 14, className: "mc-nota-popup", maxWidth: "260px" });
        }
        const coords = f?.geometry?.type === "Point" ? (f.geometry.coordinates as [number, number]) : [e.lngLat.lng, e.lngLat.lat] as [number, number];
        notaPopupRef.current.setLngLat(coords).setHTML(notaPopupHtml(nombre, nota, prioridad)).addTo(map);
      };
      const ocultarNota = () => { notaPopupRef.current?.remove(); };
      map.on("mouseenter", "notas-dot", () => { if (!drawingRef.current && !modoNotaRef.current) map.getCanvas().style.cursor = "pointer"; });
      map.on("mousemove", "notas-dot", mostrarNota);
      map.on("mouseleave", "notas-dot", () => { ocultarNota(); if (!drawingRef.current && !modoNotaRef.current) map.getCanvas().style.cursor = ""; });

      // Click en una nota → popup persistente con la nota completa y botón ELIMINAR.
      map.on("click", "notas-dot", (e) => {
        if (drawingRef.current || modoNotaRef.current) return;
        const f = e.features?.[0];
        if (!f) return;
        e.preventDefault();
        ocultarNota();
        const id = String(f.properties?.id || "");
        const nombre = String(f.properties?.name || "");
        const nota = String(f.properties?.nota || "");
        const prioridad = String(f.properties?.prioridad || "");
        const coords = f.geometry?.type === "Point" ? (f.geometry.coordinates as [number, number]) : [e.lngLat.lng, e.lngLat.lat] as [number, number];
        const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 14, className: "mc-nota-popup", maxWidth: "280px" });
        popup
          .setLngLat(coords)
          .setHTML(
            notaPopupHtml(nombre, nota, prioridad) +
            `<button class="mc-nota-del" data-id="${escapeHtml(id)}" style="margin-top:8px;width:100%;padding:6px 10px;border:1px solid #d13a3a44;border-radius:8px;background:#d13a3a12;color:#d13a3a;font-size:11.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px">🗑 Eliminar nota</button>`
          )
          .addTo(map);
        popup.getElement()?.querySelector<HTMLButtonElement>(".mc-nota-del")?.addEventListener("click", () => {
          popup.remove();
          if (id) onEliminarNotaRef.current?.(id);
        });
      });

      // Ajuste fino: arrastrar cualquier vértice ya marcado para reubicarlo.
      let dragIdx: number | null = null;
      let dragMovio = false;
      map.on("mousedown", "draw-pts", (e) => {
        if (!drawingRef.current || !e.features?.length) return;
        e.preventDefault();
        const [vx, vy] = (e.features[0].geometry as GeoJSON.Point).coordinates;
        let best = 0, bestD = Infinity;
        drawPtsRef.current.forEach((p, i) => {
          const d = (p[0] - vx) ** 2 + (p[1] - vy) ** 2;
          if (d < bestD) { bestD = d; best = i; }
        });
        dragIdx = best;
        dragMovio = false;
        map.dragPan.disable();
      });
      map.on("mousemove", (e) => {
        if (dragIdx == null) return;
        dragMovio = true;
        drawPtsRef.current[dragIdx] = [e.lngLat.lng, e.lngLat.lat];
        repaintDraw();
      });
      map.on("mouseup", () => {
        if (dragIdx == null) return;
        dragIdx = null;
        map.dragPan.enable();
      });

      // dibujo por click / marcar nota
      map.on("click", (e) => {
        if (modoNotaRef.current && onPuntoNotaRef.current) { onPuntoNotaRef.current(e.lngLat.lat, e.lngLat.lng); return; }
        if (!drawingRef.current) return;
        // Si el click cierra un arrastre de vértice, no agrega un punto nuevo.
        if (dragMovio) { dragMovio = false; return; }
        drawPtsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
        setDrawCount(drawPtsRef.current.length);
        repaintDraw();
      });
      map.on("dblclick", (e) => {
        if (!drawingRef.current) return;
        e.preventDefault();
        finalizarDibujo();
      });

      // Lupa de aumento mientras se dibuja: lente circular que SIGUE al cursor y
      // muestra la imagen satelital ampliada (+3 zoom) centrada en la cruz.
      map.on("mousemove", (e) => {
        const lens = lensRef.current;
        if (!drawingRef.current) { if (lens) lens.style.display = "none"; return; }
        if (!lens) return;
        // ¿Reaparece tras estar oculta? Entonces el mapa de la lente se creó en un
        // contenedor de 0px y hay que recalcular su tamaño, si no no dibuja nada.
        const reaparece = lens.style.display !== "block";
        lens.style.display = "block";
        const SIZE = 148, GAP = 16;
        const cont = map.getContainer();
        const w = cont.clientWidth, h = cont.clientHeight;
        // Por defecto arriba-derecha del cursor; se reacomoda si se saldría del mapa.
        let lx = e.point.x + GAP;
        let ly = e.point.y - SIZE - GAP;
        if (lx + SIZE > w - 4) lx = e.point.x - SIZE - GAP;
        if (ly < 4) ly = Math.min(h - SIZE - 4, e.point.y + GAP);
        lens.style.left = `${Math.max(4, lx)}px`;
        lens.style.top = `${Math.max(4, ly)}px`;
        const lm = lensMapRef.current;
        if (lm) {
          if (reaparece) lm.resize();
          lm.jumpTo({ center: e.lngLat, zoom: Math.min(19, map.getZoom() + 3) });
        }
      });
      map.on("mouseout", () => { if (lensRef.current) lensRef.current.style.display = "none"; });

      readyRef.current = true;
      setReady(true);
    });

    return () => { markersRef.current.forEach((m) => m.remove()); markersRef.current = []; campoMarkersRef.current.forEach((m) => m.remove()); campoMarkersRef.current = []; notaPopupRef.current?.remove(); notaPopupRef.current = null; lensMapRef.current?.remove(); lensMapRef.current = null; map.remove(); mapRef.current = null; readyRef.current = false; };
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
      // Los marcadores vuelven a ser interactivos y se apaga la cruz forzada.
      map.getContainer().classList.remove("mc-dibujando");
    }
    // Apaga y destruye la lupita.
    if (lensRef.current) lensRef.current.style.display = "none";
    lensMapRef.current?.remove();
    lensMapRef.current = null;
  };

  const iniciarDibujo = () => {
    const map = mapRef.current; if (!map) return;
    drawPtsRef.current = [];
    setDrawCount(0);
    setDrawing(true);
    map.doubleClickZoom.disable();
    map.getCanvas().style.cursor = "crosshair";
    // Modo dibujo TOTAL: nada interrumpe la cruz (los marcadores de lote no
    // interceptan el mouse y el cursor queda forzado por CSS).
    map.getContainer().classList.add("mc-dibujando");
    // Lupa: mini-mapa satelital con aumento, que sigue al cursor. El source va con
    // maxzoom 19 (máximo de Esri) para que MapLibre AMPLÍE (overzoom) esos tiles al
    // acercarse en vez de pedir tiles inexistentes → la lente siempre muestra algo.
    if (lensRef.current && !lensMapRef.current) {
      lensMapRef.current = new maplibregl.Map({
        container: lensRef.current.querySelector(".mc-lupa__mapa") as HTMLElement,
        style: {
          version: 8,
          sources: {
            satelite: {
              type: "raster",
              tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
              tileSize: 256,
              maxzoom: 19,
            },
          },
          layers: [{ id: "satelite", type: "raster", source: "satelite" }],
        } as any,
        center: map.getCenter(),
        zoom: Math.min(19, map.getZoom() + 3),
        interactive: false,
        attributionControl: false,
      });
      // El contenedor arranca oculto (0px): al primer render la lente se ajusta sola.
      requestAnimationFrame(() => lensMapRef.current?.resize());
    }
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

  // Cursor de "marcar nota"
  useEffect(() => {
    const map = mapRef.current;
    if (map && ready && !drawingRef.current) map.getCanvas().style.cursor = modoNota ? "crosshair" : "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoNota, ready]);

  // Re-crea las capas raster cuando cambian el acotado (rendimiento), la imagen
  // satelital actual o el bbox de los campos (nuevo/movido lote).
  const boundsKey = boundsRef.current?.map((n) => n.toFixed(3)).join(",") ?? "";
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    agregarCapasRaster(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capaCompleta, satActual, boundsKey, ready]);

  // ---- updates ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("lotes") as maplibregl.GeoJSONSource)?.setData(fc(lotes, layer));
    (map.getSource("notas") as maplibregl.GeoJSONSource)?.setData(notasFc(notas));
    (map.getSource("campos") as maplibregl.GeoJSONSource)?.setData(boundariesFc(lotes, establecimientosRef.current));
    // Con NDVI activo, los rellenos van casi transparentes para que se lea el raster.
    if (map.getLayer("lotes-fill")) map.setPaintProperty("lotes-fill", "fill-opacity", fillOpacity(ndviVisible ? "NDVI" : layer, selectedId ?? null) as any);
    if (map.getLayer("ndvi")) map.setLayoutProperty("ndvi", "visibility", ndviVisible ? "visible" : "none");
    if (map.getLayer("topo")) map.setLayoutProperty("topo", "visibility", layer === "Topografía" ? "visible" : "none");
    if (map.getLayer("relieve")) map.setLayoutProperty("relieve", "visibility", layer === "Relieve" ? "visible" : "none");
    if (map.getLayer("relieve-hs")) map.setLayoutProperty("relieve-hs", "visibility", layer === "Relieve" ? "visible" : "none");
    // En Relieve dejamos casi apagada la imagen satelital para que domine el sombreado del terreno.
    if (map.getLayer("satelite")) {
      map.setLayoutProperty("satelite", "visibility", satVisible ? "visible" : "none");
      map.setPaintProperty("satelite", "raster-opacity", layer === "Relieve" ? 0.18 : 1);
    }
    if (map.getLayer("etiquetas")) map.setLayoutProperty("etiquetas", "visibility", satVisible ? "visible" : "none");
    // Imagen satelital ACTUAL (Sentinel-2) sobre los campos, cuando está activada.
    if (map.getLayer("truecolor")) map.setLayoutProperty("truecolor", "visibility", satActualRef.current && satVisible ? "visible" : "none");
    // Máscara "solo sobre mis campos" para las vistas raster (NDVI/topo/relieve).
    (map.getSource("mascara") as maplibregl.GeoJSONSource)?.setData(mascaraFc(lotes, establecimientosRef.current));
    if (map.getLayer("mascara-fill")) {
      const vistaRaster = layer === "NDVI" || layer === "Topografía" || layer === "Relieve";
      map.setLayoutProperty("mascara-fill", "visibility", vistaRaster && !capaCompletaRef.current && !!boundsRef.current ? "visible" : "none");
    }
    if (map.getLayer("lotes-line")) map.setPaintProperty("lotes-line", "line-color", layer === "Topografía" || layer === "Relieve" ? "#111111" : "#ffffff");
    // Capa de prescripción (vector + dosis)
    const rxOn = rxVisible && !!rx?.fc?.features?.length;
    (map.getSource("rx") as maplibregl.GeoJSONSource)?.setData(rx?.fc || { type: "FeatureCollection", features: [] });
    (map.getSource("rx-contorno") as maplibregl.GeoJSONSource)?.setData(
      rx?.contorno ? { type: "FeatureCollection", features: [{ type: "Feature", geometry: rx.contorno, properties: {} }] } : { type: "FeatureCollection", features: [] }
    );
    ["rx-fill", "rx-line", "rx-borde", "rx-label"].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", rxOn ? "visible" : "none");
    });
    renderMarkers();
    renderCampoMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes, notas, layer, ready, satVisible, ndviVisible, rx, rxVisible]);

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
        // Mantiene la inclinación actual (plana o 3D según el toggle del usuario).
        map.fitBounds(b, { padding: 120, maxZoom: 15.5, duration: 900 });
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

      {/* Lupita de aumento (solo visible mientras se dibuja) */}
      <div ref={lensRef} className="mc-lupa" style={{ display: "none" }} aria-hidden>
        <div className="mc-lupa__mapa" />
        <div className="mc-lupa__cruz" />
      </div>

      {/* Controles dibujo / terreno */}
      {!drawing ? (
        /* Arriba-derecha, debajo de las acciones del lote (Labor/Nota/Editar) cuando hay uno seleccionado */
        <div style={{ position: "absolute", top: selectedId ? 156 : 14, right: 16, zIndex: 500, display: "flex", flexDirection: "column", gap: 8, width: 152 }}>
          <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ justifyContent: "center" }} onClick={iniciarDibujo}><Icon name="pen" size={13} />Dibujar lote</button>
          {onCampoConLotes && (
            <button className="mc-glass mc-btn--sm" style={{ borderRadius: 10, padding: "6px 11px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 12, color: "var(--mc-ink)", cursor: "pointer", textAlign: "center", lineHeight: 1.2 }} onClick={onCampoConLotes} title="Crear un establecimiento dibujando sus lotes">
              <Icon name="building" size={13} />Campo con lotes
            </button>
          )}
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
