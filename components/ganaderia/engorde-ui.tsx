"use client";

// Piezas compartidas de Engorde: arco de progreso, indicador de condición
// corporal y sparkline.

import React, { useState } from "react";

export function ArcProgress({ pct, size = 44, stroke = 4.5, color }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  const dashOffset = circ * (1 - clamped / 100);
  const arcColor = color || (pct >= 90 ? "#16a34a" : pct >= 60 ? "#b45309" : "#64748b");
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--mc-line)" strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={arcColor} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={dashOffset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: arcColor, lineHeight: 1 }}>{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}

export function CCIndicator({ cc }: { cc: number | null | undefined }) {
  if (cc == null) return <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>—</span>;
  return (
    <>
      <div className="row gap-4" style={{ justifyContent: "center" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} style={{ width: 10, height: 10, borderRadius: 2, background: n <= Math.floor(cc) ? "#00A738" : n === Math.ceil(cc) && cc % 1 > 0 ? "#86efac" : "var(--mc-line)" }} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: "var(--mc-muted)", textAlign: "center", marginTop: 2 }}>{cc}/5</div>
    </>
  );
}

export function EngSparkline({ data }: { data: number[] }) {
  const [hover, setHover] = useState(false);
  if (data.length < 2) return <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>—</span>;
  const w = 72, h = 26, pad = 3;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [pad + (i / (data.length - 1)) * (w - pad * 2), h - pad - ((v - min) / range) * (h - pad * 2)]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const rising = data[data.length - 1] > data[0];
  const color = rising ? "#dc2626" : "#16a34a"; // en conversión, subir es malo
  return (
    <div style={{ position: "relative", display: "inline-block" }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <svg width={w} height={h}>
        <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 2.4 : 1.4} fill={color} />)}
      </svg>
      {hover && (
        <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", background: "var(--mc-ink)", color: "#fff", borderRadius: 6, padding: "5px 8px", fontSize: 10.5, whiteSpace: "nowrap", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
          {data.map((v) => v.toFixed(1)).join(" · ")}
        </div>
      )}
    </div>
  );
}
