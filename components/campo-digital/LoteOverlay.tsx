"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/mc";
import type { LoteUI } from "./lotes-data";
import { cropImageCandidates, CULTIVO_COLOR } from "./cropImage";

type SeriePunto = { fecha: string; ndvi: number };
type SerieNdvi = {
  disponible?: boolean;
  serie?: SeriePunto[];
  actual?: number | null;
  media?: number | null;
  variacionPct?: number | null;
  anomalia?: "normal" | "caida" | "suba" | null;
};

/** Mini gráfico de línea (sparkline) para la serie NDVI. */
function Sparkline({ pts, color }: { pts: number[]; color: string }) {
  if (pts.length < 2) return null;
  const W = 132, H = 34, pad = 3;
  const min = Math.min(...pts), max = Math.max(...pts);
  const rng = max - min || 1;
  const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / rng) * (H - pad * 2);
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${d} L${x(pts.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <path d={area} fill={color} opacity={0.16} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1])} r={2.8} fill={color} />
    </svg>
  );
}

/** Imagen de cultivo: prueba varias extensiones y cae a un gradiente del color. */
export function CropImg({ cultivo, style }: { cultivo?: string | null; style?: React.CSSProperties }) {
  const candidatos = cropImageCandidates(cultivo);
  const [idx, setIdx] = useState(0);
  const color = (cultivo && CULTIVO_COLOR[cultivo]) || "#5e7733";
  const src = candidatos[idx];
  if (!src) {
    return (
      <div style={{ ...style, background: `linear-gradient(150deg, ${color} 0%, ${color}aa 100%)`, display: "grid", placeItems: "center", color: "#fff" }}>
        <Icon name={cultivo ? "sprout" : "leaf"} size={(Number(style?.width) || 48) * 0.42} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={cultivo || "cultivo"} onError={() => setIdx((i) => i + 1)} style={{ ...style, objectFit: "cover" }} />;
}

function centroide(l: LoteUI): { lat: number; lng: number } | null {
  const ring = l.geojson?.coordinates?.[0];
  if (!ring || ring.length === 0) return null;
  const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const lng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  return { lat, lng };
}

const fade = (i: number) => ({
  initial: { opacity: 0, y: 14, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.4, delay: 0.05 + i * 0.06, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
});

function AnomaliaBadge({ anomalia, pct }: { anomalia: SerieNdvi["anomalia"]; pct: number }) {
  const cfg =
    anomalia === "caida" ? { bg: "rgba(192,83,42,0.14)", fg: "#a8431f", icon: "arrowDown", txt: `${pct}% vs media` }
    : anomalia === "suba" ? { bg: "rgba(94,119,51,0.16)", fg: "#3f5a1e", icon: "arrowUp", txt: `+${pct}% vs media` }
    : { bg: "rgba(120,130,120,0.14)", fg: "var(--mc-text-2)", icon: "activity", txt: "estable" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 8, background: cfg.bg, color: cfg.fg, fontSize: 11, fontWeight: 700 }}>
      <Icon name={cfg.icon} size={11} /> {cfg.txt}
    </span>
  );
}

function StatChip({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="mc-glass mc-floatcard" style={{ borderRadius: 14, padding: "10px 13px", minWidth: 96 }}>
      <div className="row gap-6" style={{ alignItems: "center", color: "var(--mc-text-2)", fontSize: 11, fontWeight: 600 }}>
        <span style={{ width: 18, height: 18, borderRadius: 6, background: color + "22", color, display: "grid", placeItems: "center" }}><Icon name={icon} size={11} /></span>
        {label}
      </div>
      <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 700, color: "var(--mc-ink)", marginTop: 4, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

export function LoteOverlay({
  lote,
  onClose,
  onNota,
  onEditar,
  onTarea,
  onFicha,
}: {
  lote: LoteUI;
  onClose: () => void;
  onNota: () => void;
  onEditar: () => void;
  onTarea: () => void;
  onFicha?: () => void;
}) {
  const c = centroide(lote);
  const cultivoColor = (lote.cultivo && CULTIVO_COLOR[lote.cultivo]) || "#5e7733";

  // Serie temporal NDVI + anomalía (Sentinel Hub Statistics API)
  const [serie, setSerie] = useState<SerieNdvi | null>(null);
  useEffect(() => {
    setSerie(null);
    const geojson = lote.geojson;
    const id = lote.dbId || lote.id;
    if (!geojson?.coordinates?.[0]?.length || !id) return;
    let cancel = false;
    fetch("/api/lotes/ndvi-serie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, geojson }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancel) setSerie(d); })
      .catch(() => {});
    return () => { cancel = true; };
  }, [lote.dbId, lote.id, lote.geojson]);

  const tienePts = (serie?.serie?.length ?? 0) >= 2;

  // Predicción de rendimiento (IA) — bajo demanda
  const [rinde, setRinde] = useState<null | { rendimientoEstimado: number; rangoMin: number; rangoMax: number; confianza: number; factores?: string[]; recomendacion?: string; simulado?: boolean }>(null);
  const [cargandoRinde, setCargandoRinde] = useState(false);
  const predecirRinde = () => {
    const id = lote.dbId || lote.id;
    if (!id) return;
    setCargandoRinde(true);
    fetch("/api/lotes/prediccion-rendimiento", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loteId: id }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.error) setRinde(d); })
      .finally(() => setCargandoRinde(false));
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 600, pointerEvents: "none" }}>
      {/* Columna izquierda: header + chips (sin solaparse) */}
      <div style={{ position: "absolute", top: 16, left: 16, display: "flex", flexDirection: "column", gap: 12, maxWidth: 344, pointerEvents: "none" }}>
        <motion.div
          {...fade(0)}
          className="mc-glass"
          style={{ borderRadius: 18, padding: 12, display: "flex", alignItems: "center", gap: 12, pointerEvents: "auto" }}
        >
          <CropImg cultivo={lote.cultivo} style={{ width: 60, height: 60, borderRadius: 14, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div className="row gap-6" style={{ alignItems: "center" }}>
              <span className="font-semi" style={{ fontSize: 15.5, color: "var(--mc-ink)" }}>{lote.name}</span>
              <span className={`mc-badge mc-badge--${lote.sano ? "green" : "orange"}`} style={{ fontSize: 10 }}>{lote.sano ? "Saludable" : "Atención"}</span>
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>
              {c ? `${c.lat.toFixed(4)}° , ${c.lng.toFixed(4)}°` : lote.campo}
            </div>
            <div className="row gap-8" style={{ marginTop: 6 }}>
              <span className="row gap-4 text-xs" style={{ alignItems: "center", color: "var(--mc-text-2)", fontWeight: 600 }}><Icon name="map" size={12} />{lote.ha} ha</span>
              <span className="row gap-4 text-xs" style={{ alignItems: "center", color: "var(--mc-text-2)", fontWeight: 600 }}><Icon name="sprout" size={12} />{lote.cultivo || "Sin cultivo"}</span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar ficha del lote" className="mc-icon-btn" style={{ width: 30, height: 30, border: "none", marginLeft: 4, alignSelf: "flex-start" }}>
            <Icon name="x" size={14} />
          </button>
        </motion.div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, pointerEvents: "auto" }}>
          <motion.div {...fade(1)}><StatChip icon="map" label="Superficie" value={`${lote.ha} ha`} color="#5e7733" /></motion.div>
          <motion.div {...fade(2)}><StatChip icon="leaf" label="NDVI" value={lote.ndvi > 0 ? lote.ndvi.toFixed(2) : "—"} color="#768f44" /></motion.div>
          <motion.div {...fade(3)}><StatChip icon="droplet" label="Agua útil" value={lote.aguaUtil > 0 ? `${lote.aguaUtil}%` : "—"} color="#2c6bb8" /></motion.div>
          <motion.div {...fade(4)}><StatChip icon="activity" label="Estadio" value={lote.estadio && lote.estadio !== "—" ? lote.estadio : "—"} color="#d9a538" /></motion.div>
        </div>
      </div>

      {/* Tarjeta de cultivo (abajo-izquierda) */}
      <motion.div
        {...fade(3)}
        className="mc-glass-dark mc-floatcard--b"
        style={{ position: "absolute", bottom: 16, left: 16, borderRadius: 18, padding: 14, width: 300, pointerEvents: "auto", overflow: "hidden" }}
      >
        <div className="row gap-12" style={{ alignItems: "center" }}>
          <CropImg cultivo={lote.cultivo} style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row gap-6" style={{ alignItems: "center" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: lote.vacio ? "#b8b2a3" : "#7ec47f" }} />
              <span style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>{lote.vacio ? "Sin sembrar" : "Activo"}</span>
            </div>
            <div className="font-semi" style={{ fontSize: 16, marginTop: 2 }}>{lote.cultivo || "Sin cultivo"}</div>
            {lote.variety && <div style={{ fontSize: 11.5, opacity: 0.78 }}>{lote.variety}</div>}
          </div>
        </div>
        <div className="grid g-cols-2 gap-8" style={{ marginTop: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: 10, padding: "8px 10px" }}>
            <div style={{ fontSize: 10.5, opacity: 0.78 }}>Estado vegetativo</div>
            <div className="font-semi" style={{ fontSize: 13, marginTop: 2 }}>{lote.estadio && lote.estadio !== "—" ? lote.estadio : "—"}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: 10, padding: "8px 10px" }}>
            <div style={{ fontSize: 10.5, opacity: 0.78 }}>Salud (NDVI)</div>
            <div className="font-semi" style={{ fontSize: 13, marginTop: 2 }}>{lote.ndvi > 0 ? lote.ndvi.toFixed(2) : "—"}</div>
          </div>
        </div>

        {/* Predicción de rendimiento (IA) */}
        {!rinde ? (
          <button
            onClick={predecirRinde}
            disabled={cargandoRinde}
            style={{ marginTop: 10, width: "100%", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Icon name="activity" size={13} /> {cargandoRinde ? "Estimando…" : "Predecir rinde (IA)"}
          </button>
        ) : (
          <div style={{ marginTop: 10, padding: "9px 11px", borderRadius: 10, background: "rgba(255,255,255,0.10)" }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 10.5, opacity: 0.8 }}>Rinde estimado {rinde.simulado ? "" : "· IA"}</span>
              <span style={{ fontSize: 10.5, opacity: 0.8 }}>{rinde.confianza}% conf.</span>
            </div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 19, fontWeight: 700, marginTop: 2 }}>
              {(rinde.rendimientoEstimado / 1000).toFixed(1)} <span style={{ fontSize: 12, opacity: 0.8 }}>t/ha</span>
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.72 }}>rango {(rinde.rangoMin / 1000).toFixed(1)}–{(rinde.rangoMax / 1000).toFixed(1)} t/ha</div>
            {rinde.recomendacion && (
              <div style={{ marginTop: 6, fontSize: 11, opacity: 0.9, display: "flex", gap: 5 }}>
                <Icon name="sprout" size={12} /> {rinde.recomendacion}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Tendencia NDVI + anomalía (abajo-derecha) */}
      {tienePts && (
        <motion.div
          {...fade(4)}
          className="mc-glass mc-floatcard"
          style={{ position: "absolute", bottom: 16, right: 16, borderRadius: 16, padding: 13, width: 234, pointerEvents: "auto" }}
        >
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="row gap-6" style={{ alignItems: "center", color: "var(--mc-text-2)", fontSize: 11, fontWeight: 700 }}>
              <Icon name="activity" size={12} /> Tendencia NDVI · 180 d
            </div>
            <span className="mc-badge mc-badge--neutral" style={{ fontSize: 9.5 }}>Satélite</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <Sparkline pts={serie!.serie!.map((p) => p.ndvi)} color={serie!.anomalia === "caida" ? "#c0532a" : "#5e7733"} />
          </div>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 700, color: "var(--mc-ink)", lineHeight: 1 }}>
                {serie!.actual?.toFixed(2) ?? "—"}
              </div>
              <div className="text-xs text-muted">actual</div>
            </div>
            {serie!.variacionPct != null && (
              <AnomaliaBadge anomalia={serie!.anomalia} pct={serie!.variacionPct} />
            )}
          </div>
          {serie!.anomalia === "caida" && (
            <div style={{ marginTop: 8, padding: "7px 9px", borderRadius: 9, background: "rgba(192,83,42,0.12)", color: "#a8431f", fontSize: 11, fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
              <Icon name="alert" size={12} /> Caída de vigor: revisá estrés hídrico o sanidad.
            </div>
          )}
        </motion.div>
      )}

      {/* Acciones rápidas (arriba-derecha, en columna para no solaparse) */}
      <motion.div
        {...fade(2)}
        style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 8, width: 152, pointerEvents: "auto" }}
      >
        {onFicha && <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ justifyContent: "center" }} onClick={onFicha}><Icon name="list" size={13} />Ficha completa</button>}
        <button className="mc-glass mc-btn--sm" style={{ borderRadius: 10, padding: "6px 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 12.5, color: "var(--mc-ink)", cursor: "pointer" }} onClick={onTarea}><Icon name="plus" size={13} />Labor</button>
        <button className="mc-glass mc-btn--sm" style={{ borderRadius: 10, padding: "6px 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 12.5, color: "var(--mc-ink)", cursor: "pointer" }} onClick={onNota}><Icon name="pen" size={13} />Nota</button>
        <button className="mc-glass mc-btn--sm" style={{ borderRadius: 10, padding: "6px 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 12.5, color: "var(--mc-ink)", cursor: "pointer" }} onClick={onEditar}><Icon name="edit" size={13} />Editar</button>
      </motion.div>
    </div>
  );
}
