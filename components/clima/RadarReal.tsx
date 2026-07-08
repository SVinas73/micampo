"use client";

/* ============================================================
   RadarReal — radar de precipitación REAL sobre el campo.
   Usa RainViewer (gratis, sin API key): tiles de radar de lluvia
   de las últimas ~2h + nowcast, animados sobre un mapa Leaflet
   centrado en el lote del usuario. Play/pausa y timestamp real.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Icon } from "@/components/mc";

type Frame = { time: number; path: string };

export default function RadarReal({ lat, lon, marcador = false }: { lat: number; lon: number; marcador?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const hostRef = useRef<string>("https://tilecache.rainviewer.com");
  const framesRef = useRef<Frame[]>([]);
  const pastLenRef = useRef(0);
  const layersRef = useRef<Record<number, L.TileLayer>>({});
  const [playing, setPlaying] = useState(true);
  const [idx, setIdx] = useState(0);
  const [ts, setTs] = useState<string>("");
  const [esPronostico, setEsPronostico] = useState(false);
  const idxRef = useRef(0);

  // Init mapa + carga de frames de RainViewer
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { center: [lat, lon], zoom: 7, zoomControl: true, attributionControl: false });
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap, © CARTO",
    }).addTo(map);

    if (marcador) {
      markerRef.current = L.circleMarker([lat, lon], { radius: 7, color: "#fff", weight: 2, fillColor: "#c93434", fillOpacity: 1 })
        .addTo(map)
        .bindTooltip("Tu campo", { permanent: false });
    }

    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((r) => r.json())
      .then((data) => {
        hostRef.current = data.host || "https://tilecache.rainviewer.com";
        const past: Frame[] = data?.radar?.past || [];
        const now: Frame[] = data?.radar?.nowcast || [];
        pastLenRef.current = past.length;
        framesRef.current = [...past, ...now];
        if (framesRef.current.length) {
          idxRef.current = Math.max(0, past.length - 1); // arranca en el más reciente observado
          setIdx(idxRef.current);
          showFrame(idxRef.current);
        }
      })
      .catch(() => {});

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-centra el radar y mueve el marcador al cambiar de establecimiento/lote.
  useEffect(() => {
    if (mapRef.current) mapRef.current.setView([lat, lon]);
    markerRef.current?.setLatLng([lat, lon]);
  }, [lat, lon]);

  const showFrame = (i: number) => {
    const map = mapRef.current;
    const frames = framesRef.current;
    if (!map || !frames.length) return;
    const f = frames[i];
    if (!layersRef.current[i]) {
      // color scheme 4 (Universal Blue → Red), smooth=1, snow=1
      layersRef.current[i] = L.tileLayer(`${hostRef.current}${f.path}/256/{z}/{x}/{y}/4/1_1.png`, { opacity: 0, maxNativeZoom: 9, maxZoom: 19, tileSize: 256 });
      layersRef.current[i].addTo(map);
    }
    Object.entries(layersRef.current).forEach(([k, lyr]) => lyr.setOpacity(Number(k) === i ? 0.82 : 0));
    setTs(new Date(f.time * 1000).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
    setEsPronostico(i >= pastLenRef.current);
  };

  // Animación
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const frames = framesRef.current;
      if (!frames.length) return;
      idxRef.current = (idxRef.current + 1) % frames.length;
      setIdx(idxRef.current);
      showFrame(idxRef.current);
    }, 700);
    return () => clearInterval(t);
  }, [playing]);

  const total = framesRef.current.length || 1;

  return (
    <div style={{ position: "relative", height: 300 }}>
      <div ref={ref} style={{ position: "absolute", inset: 0, borderRadius: "inherit" }} />

      {/* Solo se muestra el chip cuando es pronóstico (nowcast); el pasado no necesita etiqueta. */}
      {esPronostico && (
        <div style={{ position: "absolute", top: 12, left: 52, zIndex: 500, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(217,165,56,0.92)", backdropFilter: "blur(6px)", boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
          Pronóstico (nowcast) · {ts || "—"}
        </div>
      )}

      {/* Leyenda de intensidad */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 500, padding: "7px 10px", borderRadius: 12, background: "rgba(16,20,14,0.78)", color: "#fff", backdropFilter: "blur(6px)", boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.8, marginBottom: 4, letterSpacing: "0.04em" }}>INTENSIDAD</div>
        <div style={{ width: 130, height: 7, borderRadius: 999, background: "linear-gradient(90deg, #9fd6f0 0%, #3a93d6 35%, #2c4fb8 60%, #7e3fbf 80%, #c93434 100%)" }} />
        <div className="row" style={{ justifyContent: "space-between", fontSize: 9, opacity: 0.85, marginTop: 3 }}>
          <span>Llovizna</span><span>Lluvia</span><span>Tormenta</span>
        </div>
      </div>

      {/* Control de reproducción */}
      <div style={{ position: "absolute", left: 12, bottom: 12, right: 12, zIndex: 500, display: "flex", alignItems: "center", gap: 11, background: "rgba(16,20,14,0.80)", color: "#fff", padding: "8px 12px", borderRadius: 14, backdropFilter: "blur(8px)", boxShadow: "0 4px 16px rgba(0,0,0,0.28)" }}>
        <button onClick={() => setPlaying((p) => !p)} title={playing ? "Pausar" : "Reproducir"} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--mc-green-600)", color: "#fff", border: "none", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name={playing ? "pause" : "play"} size={15} />
        </button>
        <span style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>{ts || "—"}</span>
        <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.22)", borderRadius: 999, overflow: "hidden", position: "relative" }}>
          {/* marca de "ahora" (fin de observado) */}
          {total > 1 && <span style={{ position: "absolute", left: `${(pastLenRef.current / total) * 100}%`, top: -2, bottom: -2, width: 2, background: "rgba(255,255,255,0.6)" }} />}
          <div style={{ height: "100%", width: `${((idx + 1) / total) * 100}%`, background: esPronostico ? "#d9a538" : "#5fb6e5", borderRadius: 999, transition: "width .3s" }} />
        </div>
      </div>
    </div>
  );
}
