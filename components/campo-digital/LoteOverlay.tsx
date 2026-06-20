"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/mc";
import type { LoteUI } from "./lotes-data";
import { cropImage, CULTIVO_COLOR } from "./cropImage";

/** Imagen de cultivo con fallback a gradiente del color del cultivo. */
function CropImg({ cultivo, style }: { cultivo?: string | null; style?: React.CSSProperties }) {
  const [err, setErr] = useState(false);
  const src = cropImage(cultivo);
  const color = (cultivo && CULTIVO_COLOR[cultivo]) || "#5e7733";
  if (!src || err) {
    return (
      <div style={{ ...style, background: `linear-gradient(150deg, ${color} 0%, ${color}aa 100%)`, display: "grid", placeItems: "center", color: "#fff" }}>
        <Icon name={cultivo ? "sprout" : "leaf"} size={(Number(style?.width) || 48) * 0.42} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={cultivo || "cultivo"} onError={() => setErr(true)} style={{ ...style, objectFit: "cover" }} />;
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
}: {
  lote: LoteUI;
  onClose: () => void;
  onNota: () => void;
  onEditar: () => void;
  onTarea: () => void;
}) {
  const c = centroide(lote);
  const cultivoColor = (lote.cultivo && CULTIVO_COLOR[lote.cultivo]) || "#5e7733";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 600, pointerEvents: "none" }}>
      {/* Header flotante */}
      <motion.div
        {...fade(0)}
        className="mc-glass"
        style={{ position: "absolute", top: 16, left: 16, borderRadius: 18, padding: 12, display: "flex", alignItems: "center", gap: 12, maxWidth: 360, pointerEvents: "auto" }}
      >
        <CropImg cultivo={lote.cultivo} style={{ width: 64, height: 64, borderRadius: 14, flexShrink: 0 }} />
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
        <button onClick={onClose} className="mc-icon-btn" style={{ width: 30, height: 30, border: "none", marginLeft: 4, alignSelf: "flex-start" }}>
          <Icon name="x" size={14} />
        </button>
      </motion.div>

      {/* Chips de datos flotantes */}
      <div style={{ position: "absolute", top: 120, left: 16, display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 340, pointerEvents: "auto" }}>
        <motion.div {...fade(1)}><StatChip icon="map" label="Superficie" value={`${lote.ha} ha`} color="#5e7733" /></motion.div>
        <motion.div {...fade(2)}><StatChip icon="leaf" label="NDVI" value={lote.ndvi > 0 ? lote.ndvi.toFixed(2) : "—"} color="#768f44" /></motion.div>
        <motion.div {...fade(3)}><StatChip icon="droplet" label="Agua útil" value={lote.aguaUtil > 0 ? `${lote.aguaUtil}%` : "—"} color="#2c6bb8" /></motion.div>
        <motion.div {...fade(4)}><StatChip icon="activity" label="Estadio" value={lote.estadio && lote.estadio !== "—" ? lote.estadio : "—"} color="#d9a538" /></motion.div>
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
      </motion.div>

      {/* Acciones rápidas (arriba-derecha) */}
      <motion.div
        {...fade(2)}
        style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8, pointerEvents: "auto" }}
      >
        <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={onTarea}><Icon name="plus" size={13} />Labor</button>
        <button className="mc-glass mc-btn--sm" style={{ borderRadius: 10, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 12.5, color: "var(--mc-ink)", cursor: "pointer" }} onClick={onNota}><Icon name="pen" size={13} />Nota</button>
        <button className="mc-glass mc-btn--sm" style={{ borderRadius: 10, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 12.5, color: "var(--mc-ink)", cursor: "pointer" }} onClick={onEditar}><Icon name="edit" size={13} />Editar</button>
      </motion.div>
    </div>
  );
}
