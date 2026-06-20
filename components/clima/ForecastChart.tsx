"use client";

import React from "react";
import { Icon } from "@/components/mc";
import { weatherTone } from "./weatherTone";

export type DayForecast = {
  d: string;
  num: number;
  ic: string;
  max: number;
  min: number;
  mm: number;
  vent: "ok" | "warn" | "bad";
};

// Curva suave (monotone cubic) para líneas prolijas sin sobrepicos
function smooth(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return pts.length ? `M ${pts[0].x} ${pts[0].y}` : "";
  const n = pts.length, dx: number[] = [], dy: number[] = [], m: number[] = [], t: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1].x - pts[i].x; dy[i] = pts[i + 1].y - pts[i].y; m[i] = dy[i] / dx[i]; }
  t[0] = m[0];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  let p = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = pts[i].x + dx[i] / 3, y1 = pts[i].y + t[i] * dx[i] / 3;
    const x2 = pts[i + 1].x - dx[i] / 3, y2 = pts[i + 1].y - t[i + 1] * dx[i] / 3;
    p += ` C ${x1} ${y1} ${x2} ${y2} ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return p;
}

/* Forecast 10-day chart — HTML grid + SVG curve overlay so emojis render reliably */
export function ForecastChart({
  days,
  onVerDetalle,
}: {
  days: DayForecast[];
  onVerDetalle: (d: DayForecast) => void;
}) {
  const N = days.length;
  const tempMin = 10,
    tempMax = 35;
  const maxMM = 30;
  const OVERLAY_H = 160;
  const tY = (t: number) => OVERLAY_H * (1 - (t - tempMin) / (tempMax - tempMin)) * 0.55 + 26;
  const VBX = N * 100;

  const spray: Record<DayForecast["vent"], { color: string; label: string; icon: string; bg: string }> = {
    ok: { color: "#768f44", label: "APTO", icon: "check", bg: "rgba(79,157,82,0.12)" },
    warn: { color: "#d9a538", label: "MARG.", icon: "alert", bg: "rgba(217,165,56,0.12)" },
    bad: { color: "#d13a3a", label: "NO APTO", icon: "x", bg: "rgba(209,58,58,0.12)" },
  };

  return (
    <div style={{ width: "100%", position: "relative", paddingTop: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`, position: "relative" }}>
        {days.map((d, i) => {
          const isToday = i === 0;
          const sp = spray[d.vent];
          const tone = weatherTone(d.ic);
          return (
            <div
              key={i}
              style={{
                position: "relative",
                padding: "10px 4px 14px",
                textAlign: "center",
                borderRight: i < N - 1 ? "1px solid var(--mc-line)" : "none",
                background: `linear-gradient(180deg, ${tone.soft} 0%, transparent 46%)`,
                minHeight: 290,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {isToday && (
                <span style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, background: "#768f44" }} />
              )}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: isToday ? 800 : 700,
                  color: isToday ? "#768f44" : "var(--mc-ink)",
                  letterSpacing: "0.04em",
                }}
              >
                {isToday ? "HOY" : d.d}
              </div>
              <div
                style={{
                  width: 46,
                  height: 46,
                  marginTop: 8,
                  borderRadius: "50%",
                  background: tone.grad,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: `0 4px 12px ${tone.ring}`,
                }}
              >
                <Icon name={d.ic} size={26} />
              </div>
              <div style={{ flex: 1, minHeight: 174 }} />
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px 4px 4px",
                  borderRadius: 999,
                  background: sp.bg,
                  border: `1.5px solid ${sp.color}`,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: sp.color,
                    color: "white",
                    fontSize: 11,
                    fontWeight: 800,
                    display: "grid",
                    placeItems: "center",
                    lineHeight: 1,
                  }}
                >
                  <Icon name={sp.icon} size={11} />
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: sp.color, letterSpacing: "0.04em" }}>
                  {sp.label}
                </span>
              </div>
              <button
                className="mc-btn mc-btn--ghost mc-btn--sm"
                style={{ marginTop: 6, fontSize: 10, padding: "3px 8px" }}
                onClick={() => onVerDetalle(d)}
              >
                Ver Detalles
              </button>
            </div>
          );
        })}
      </div>

      <svg
        style={{ position: "absolute", top: 60, left: 0, width: "100%", height: OVERLAY_H, pointerEvents: "none" }}
        viewBox={`0 0 ${VBX} ${OVERLAY_H}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="fcRainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5fb6e5" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#2c82c9" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="fcMaxArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c08a22" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#c08a22" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fcMinArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3aa6d9" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#3aa6d9" stopOpacity="0" />
          </linearGradient>
          <filter id="fcDotShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.3" />
          </filter>
        </defs>

        {days.map((d, i) => {
          if (d.mm === 0) return null;
          const cx = i * 100 + 50;
          const bh = (d.mm / maxMM) * OVERLAY_H * 0.45;
          const by = OVERLAY_H - bh;
          return (
            <g key={`r${i}`}>
              <rect x={cx - 22} y={by} width="44" height={bh} fill="url(#fcRainGrad)" rx="3" />
              <rect x={cx - 22} y={by} width="44" height="3" fill="#5fb6e5" rx="1.5" />
            </g>
          );
        })}

        {(() => {
          const ptsMax = days.map((d, i) => ({ x: i * 100 + 50, y: tY(d.max) }));
          const ptsMin = days.map((d, i) => ({ x: i * 100 + 50, y: tY(d.min) }));
          const dMax = smooth(ptsMax), dMin = smooth(ptsMin);
          const areaMax = `${dMax} L ${(N - 1) * 100 + 50},${OVERLAY_H} L 50,${OVERLAY_H} Z`;
          const areaMin = `${dMin} L ${(N - 1) * 100 + 50},${OVERLAY_H} L 50,${OVERLAY_H} Z`;
          return (
            <>
              <path d={areaMax} fill="url(#fcMaxArea)" />
              <path d={areaMin} fill="url(#fcMinArea)" />
              <path d={dMin} fill="none" stroke="#3aa6d9" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
              <path d={dMax} fill="none" stroke="#c08a22" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            </>
          );
        })()}
      </svg>

      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          width: "100%",
          height: OVERLAY_H,
          display: "grid",
          gridTemplateColumns: `repeat(${N}, 1fr)`,
          pointerEvents: "none",
        }}
      >
        {days.map((d, i) => (
          <div key={i} style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "50%", top: tY(d.max), transform: "translate(-50%, -50%)", width: 7, height: 7, borderRadius: "50%", background: "#c08a22", border: "1.5px solid #fff", boxShadow: "0 1px 2px rgba(0,0,0,0.18)" }} />
            <span style={{ position: "absolute", left: "50%", top: tY(d.min), transform: "translate(-50%, -50%)", width: 6, height: 6, borderRadius: "50%", background: "#3aa6d9", border: "1.5px solid #fff", boxShadow: "0 1px 2px rgba(0,0,0,0.18)" }} />
            <span
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                top: tY(d.max) - 22,
                fontSize: 14,
                fontWeight: 800,
                color: "var(--mc-ink)",
                fontFamily: "var(--ff-mono)",
                whiteSpace: "nowrap",
              }}
            >
              {d.max}°
            </span>
            <span
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                top: tY(d.min) + 8,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--mc-ink)",
                fontFamily: "var(--ff-mono)",
                whiteSpace: "nowrap",
              }}
            >
              {d.min}°
            </span>
            {d.mm > 0 && (
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  color: "white",
                  padding: "2px 8px",
                  background: "#2c82c9",
                  borderRadius: 6,
                  fontFamily: "var(--ff-mono)",
                  whiteSpace: "nowrap",
                }}
              >
                {d.mm}mm
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
