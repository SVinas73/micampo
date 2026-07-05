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
    <div className="mc-glass mc-floatcard" style={{ borderRadius: 14, padding: "10px 12px", minWidth: 0 }}>
      <div className="row gap-6" style={{ alignItems: "center", color: "var(--mc-text-2)", fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden" }}>
        <span style={{ width: 18, height: 18, borderRadius: 6, background: color + "22", color, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={icon} size={11} /></span>
        {label}
      </div>
      <div style={{ fontFamily: "var(--ff-display)", fontSize: 17, fontWeight: 700, color: "var(--mc-ink)", marginTop: 4, lineHeight: 1.05, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={value}>{value}</div>
    </div>
  );
}

export function LoteOverlay({
  lote,
  onClose,
  onEditar,
  onTarea,
  onNota,
  notaActiva,
  onFicha,
}: {
  lote: LoteUI;
  onClose: () => void;
  onEditar: () => void;
  onTarea: () => void;
  onNota?: () => void;
  notaActiva?: boolean;
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
  const [rinde, setRinde] = useState<null | { rendimientoEstimado: number; rangoMin: number; rangoMax: number; confianza: number; factores?: string[]; recomendacion?: string; simulado?: boolean; backtesting?: { precision: number; casos: { anio: number; predicho: number; real: number; errorPct: number }[] } | null }>(null);
  const [cargandoRinde, setCargandoRinde] = useState(false);
  const [rindeError, setRindeError] = useState<string | null>(null);
  const predecirRinde = () => {
    const id = lote.dbId || lote.id;
    if (!id) return;
    setCargandoRinde(true);
    setRindeError(null);
    fetch("/api/lotes/prediccion-rendimiento", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loteId: id }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.error) setRinde(d);
        else setRindeError(d?.error || "No se pudo estimar el rinde con los datos disponibles.");
      })
      .catch(() => setRindeError("No se pudo estimar el rinde en este momento."))
      .finally(() => setCargandoRinde(false));
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 600, pointerEvents: "none" }}>
      {/* Columna izquierda: header + chips. En clásico se corre del borde para no tapar las herramientas de dibujo de Leaflet; en 3D va pegada a la izquierda. */}
      <div style={{ position: "absolute", top: 16, left: 16, display: "flex", flexDirection: "column", gap: 12, width: 366, maxWidth: "calc(100% - 200px)", pointerEvents: "none" }}>
        {/* La X va AFUERA del card, pegada a su costado derecho. */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, pointerEvents: "none" }}>
          <motion.div
            {...fade(0)}
            className="mc-glass"
            style={{ borderRadius: 18, padding: 12, display: "flex", alignItems: "center", gap: 12, pointerEvents: "auto", flex: 1, minWidth: 0 }}
          >
            <CropImg cultivo={lote.cultivo} style={{ width: 60, height: 60, borderRadius: 14, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div className="row gap-6" style={{ alignItems: "center" }}>
                <span className="font-semi" style={{ fontSize: 15.5, color: "var(--mc-ink)" }}>{lote.name}</span>
                {lote.ndvi > 0
                  ? <span className={`mc-badge mc-badge--${lote.sano ? "green" : "orange"}`} style={{ fontSize: 10 }}>{lote.sano ? "Saludable" : "Atención"}</span>
                  : <span className="mc-badge mc-badge--neutral" style={{ fontSize: 10 }}>Sin datos</span>}
              </div>
              <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                {c ? `${c.lat.toFixed(4)}° , ${c.lng.toFixed(4)}°` : lote.campo}
              </div>
              <div className="row gap-8" style={{ marginTop: 6 }}>
                <span className="row gap-4 text-xs" style={{ alignItems: "center", color: "var(--mc-text-2)", fontWeight: 600 }}><Icon name="map" size={12} />{lote.ha} ha</span>
                <span className="row gap-4 text-xs" style={{ alignItems: "center", color: "var(--mc-text-2)", fontWeight: 600 }}><Icon name="sprout" size={12} />{lote.cultivo || "Sin cultivo"}</span>
              </div>
            </div>
          </motion.div>
          <motion.button
            {...fade(0)}
            onClick={onClose}
            aria-label="Cerrar ficha del lote"
            className="mc-glass mc-icon-btn"
            style={{ width: 32, height: 32, border: "none", borderRadius: 10, flexShrink: 0, pointerEvents: "auto", cursor: "pointer" }}
          >
            <Icon name="x" size={14} />
          </motion.button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, pointerEvents: "auto" }}>
          <motion.div {...fade(1)} style={{ minWidth: 0 }}><StatChip icon="map" label="Superficie" value={`${lote.ha} ha`} color="#5e7733" /></motion.div>
          <motion.div {...fade(2)} style={{ minWidth: 0 }}><StatChip icon="leaf" label="NDVI" value={lote.ndvi > 0 ? lote.ndvi.toFixed(2) : "—"} color="#768f44" /></motion.div>
          <motion.div {...fade(3)} style={{ minWidth: 0 }}><StatChip icon="droplet" label="Agua útil" value={lote.aguaUtil > 0 ? `${lote.aguaUtil}%` : "—"} color="#2c6bb8" /></motion.div>
          <motion.div {...fade(4)} style={{ minWidth: 0 }}><StatChip icon="activity" label="Estadio" value={lote.estadio && lote.estadio !== "—" ? lote.estadio : "—"} color="#d9a538" /></motion.div>
          {onFicha && (
            <motion.button
              {...fade(5)}
              onClick={onFicha}
              className="mc-glass mc-floatcard"
              style={{ gridColumn: "span 2", pointerEvents: "auto", borderRadius: 14, padding: "11px 14px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 700, fontSize: 13, color: "var(--mc-green-800)" }}
            >
              <Icon name="list" size={15} /> Ver ficha completa
            </motion.button>
          )}
        </div>
      </div>

      {/* Columna abajo-izquierda: tendencia NDVI (real) + predicción de rinde */}
      <div style={{ position: "absolute", bottom: 30, left: 16, display: "flex", flexDirection: "column", gap: 10, width: 250, pointerEvents: "none" }}>
        {tienePts && (
          <motion.div {...fade(4)} className="mc-glass mc-floatcard" style={{ borderRadius: 16, padding: 13, pointerEvents: "auto" }}>
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
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 700, color: "var(--mc-ink)", lineHeight: 1 }}>{serie!.actual?.toFixed(2) ?? "—"}</div>
                <div className="text-xs text-muted">actual</div>
              </div>
              {serie!.variacionPct != null && <AnomaliaBadge anomalia={serie!.anomalia} pct={serie!.variacionPct} />}
            </div>
            {serie!.anomalia === "caida" && (
              <div style={{ marginTop: 8, padding: "7px 9px", borderRadius: 9, background: "rgba(192,83,42,0.12)", color: "#a8431f", fontSize: 11, fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
                <Icon name="alert" size={12} /> Caída de vigor: revisá estrés hídrico o sanidad.
              </div>
            )}
          </motion.div>
        )}

        <motion.div {...fade(3)} className="mc-glass mc-floatcard--b" style={{ borderRadius: 16, padding: 12, pointerEvents: "auto" }}>
          {!rinde ? (
            <>
              <button
                onClick={predecirRinde}
                disabled={cargandoRinde}
                style={{ width: "100%", borderRadius: 10, padding: "9px 10px", border: "none", background: "var(--mc-green-700)", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Icon name="activity" size={13} /> {cargandoRinde ? "Estimando…" : "Predecir rinde (IA)"}
              </button>
              {rindeError && <div className="text-xs" style={{ color: "var(--mc-red)", marginTop: 6, textAlign: "center" }}>{rindeError}</div>}
            </>
          ) : (
            <div>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="text-xs text-muted">Rinde estimado {rinde.simulado ? "" : "· IA"}</span>
                <span className="text-xs text-muted">{rinde.confianza}% conf.</span>
              </div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 700, color: "var(--mc-ink)", marginTop: 2 }}>
                {(rinde.rendimientoEstimado / 1000).toFixed(1)} <span style={{ fontSize: 12, color: "var(--mc-text-2)" }}>t/ha</span>
              </div>
              <div className="text-xs text-muted">rango {(rinde.rangoMin / 1000).toFixed(1)}–{(rinde.rangoMax / 1000).toFixed(1)} t/ha</div>
              {rinde.backtesting && (
                <div style={{ marginTop: 6, fontSize: 11, color: "var(--mc-green-700)", fontWeight: 600, display: "flex", gap: 5, alignItems: "center" }} title={rinde.backtesting.casos.map((c) => `${c.anio}: predicho ${c.predicho}, real ${c.real} (±${c.errorPct}%)`).join(" · ")}>
                  <Icon name="check" size={12} /> Precisión histórica: ±{100 - rinde.backtesting.precision}% ({rinde.backtesting.casos.length} campañas)
                </div>
              )}
              {rinde.recomendacion && (
                <div style={{ marginTop: 6, fontSize: 11, color: "var(--mc-text-2)", display: "flex", gap: 5 }}>
                  <Icon name="sprout" size={12} /> {rinde.recomendacion}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Acciones rápidas (arriba-derecha, en columna para no solaparse) */}
      <motion.div
        {...fade(2)}
        style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 8, width: 152, pointerEvents: "auto" }}
      >
        <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ justifyContent: "center" }} onClick={onTarea}><Icon name="plus" size={13} />Labor</button>
        <button className="mc-glass mc-btn--sm" style={{ borderRadius: 10, padding: "6px 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 12.5, color: "var(--mc-ink)", cursor: "pointer" }} onClick={onEditar}><Icon name="edit" size={13} />Editar</button>
        {onNota && (
          notaActiva ? (
            <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ justifyContent: "center" }} onClick={onNota} title="Tocá un punto del mapa para ubicar la nota"><Icon name="pen" size={13} />Tocá el punto…</button>
          ) : (
            <button className="mc-glass mc-btn--sm" style={{ borderRadius: 10, padding: "6px 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 12.5, color: "var(--mc-ink)", cursor: "pointer" }} onClick={onNota} title="Marcar una nota en un punto del mapa"><Icon name="pen" size={13} />Nota</button>
          )
        )}
      </motion.div>
    </div>
  );
}
