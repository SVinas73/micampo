"use client";

/* ============================================================
   RadarReal — radar de precipitación REAL sobre el campo.
   Usa RainViewer (gratis, sin API key): tiles de radar de lluvia
   de las últimas ~2h + nowcast, animados sobre un mapa Leaflet
   centrado en el lote del usuario. Play/pausa y timestamp real.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

type Frame = { time: number; path: string };

export default function RadarReal({ lat, lon, marcador = false }: { lat: number; lon: number; marcador?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const hostRef = useRef<string>("https://tilecache.rainviewer.com");
  const framesRef = useRef<Frame[]>([]);
  const layersRef = useRef<Record<number, L.TileLayer>>({});
  const [playing, setPlaying] = useState(true);
  const [idx, setIdx] = useState(0);
  const [ts, setTs] = useState<string>("");
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
      L.circleMarker([lat, lon], { radius: 7, color: "#fff", weight: 2, fillColor: "#c93434", fillOpacity: 1 })
        .addTo(map)
        .bindTooltip("Tu campo", { permanent: false });
    }

    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((r) => r.json())
      .then((data) => {
        hostRef.current = data.host || "https://tilecache.rainviewer.com";
        const past: Frame[] = data?.radar?.past || [];
        const now: Frame[] = data?.radar?.nowcast || [];
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

  const showFrame = (i: number) => {
    const map = mapRef.current;
    const frames = framesRef.current;
    if (!map || !frames.length) return;
    const f = frames[i];
    if (!layersRef.current[i]) {
      layersRef.current[i] = L.tileLayer(`${hostRef.current}${f.path}/256/{z}/{x}/{y}/4/1_1.png`, { opacity: 0, maxNativeZoom: 9, maxZoom: 19, tileSize: 256 });
      layersRef.current[i].addTo(map);
    }
    Object.entries(layersRef.current).forEach(([k, lyr]) => lyr.setOpacity(Number(k) === i ? 0.7 : 0));
    setTs(new Date(f.time * 1000).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
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
      <div style={{ position: "absolute", left: 12, bottom: 12, right: 12, zIndex: 500, display: "flex", alignItems: "center", gap: 10, background: "rgba(16,20,14,0.82)", color: "#fff", padding: "8px 12px", borderRadius: 999, backdropFilter: "blur(6px)" }}>
        <button onClick={() => setPlaying((p) => !p)} style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--mc-green-600)", color: "#fff", border: "none", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
          {playing ? "❙❙" : "▶"}
        </button>
        <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>Radar de lluvia · {ts || "—"}</span>
        <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.25)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((idx + 1) / total) * 100}%`, background: "#5fb6e5", borderRadius: 999, transition: "width .3s" }} />
        </div>
      </div>
    </div>
  );
}
