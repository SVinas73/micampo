"use client";

import React from "react";

export type DayForecast = {
  d: string;
  num: number;
  ic: string;
  max: number;
  min: number;
  mm: number;
  vent: "ok" | "warn" | "bad";
};

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
    ok: { color: "#4f9d52", label: "APTO", icon: "✓", bg: "rgba(79,157,82,0.12)" },
    warn: { color: "#d9a538", label: "MARG.", icon: "⚠", bg: "rgba(217,165,56,0.12)" },
    bad: { color: "#d13a3a", label: "NO APTO", icon: "✗", bg: "rgba(209,58,58,0.12)" },
  };

  return (
    <div style={{ width: "100%", position: "relative", paddingTop: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`, position: "relative" }}>
        {days.map((d, i) => {
          const isToday = i === 0;
          const sp = spray[d.vent];
          return (
            <div
              key={i}
              style={{
                position: "relative",
                padding: "10px 4px 14px",
                textAlign: "center",
                borderRight: i < N - 1 ? "1px solid var(--mc-line)" : "none",
                background: isToday ? "rgba(79,157,82,0.05)" : "transparent",
                minHeight: 290,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {isToday && (
                <span style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, background: "#4f9d52" }} />
              )}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: isToday ? 800 : 700,
                  color: isToday ? "#4f9d52" : "var(--mc-ink)",
                  letterSpacing: "0.04em",
                }}
              >
                {isToday ? "HOY" : d.d}
              </div>
              <div
                style={{
                  fontSize: 32,
                  lineHeight: 1,
                  marginTop: 6,
                  fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
                }}
              >
                {d.ic}
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
                  {sp.icon}
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
            <stop offset="0%" stopColor="#e7892b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#e7892b" stopOpacity="0" />
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

        <polygon
          points={`50,${OVERLAY_H} ${days.map((d, i) => `${i * 100 + 50},${tY(d.max)}`).join(" ")} ${(N - 1) * 100 + 50},${OVERLAY_H}`}
          fill="url(#fcMaxArea)"
        />
        <polygon
          points={`50,${OVERLAY_H} ${days.map((d, i) => `${i * 100 + 50},${tY(d.min)}`).join(" ")} ${(N - 1) * 100 + 50},${OVERLAY_H}`}
          fill="url(#fcMinArea)"
        />

        <polyline
          fill="none"
          stroke="#3aa6d9"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={days.map((d, i) => `${i * 100 + 50},${tY(d.min)}`).join(" ")}
        />
        <polyline
          fill="none"
          stroke="#e7892b"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={days.map((d, i) => `${i * 100 + 50},${tY(d.max)}`).join(" ")}
        />

        {days.map((d, i) => {
          const x = i * 100 + 50;
          return (
            <g key={`d${i}`}>
              <circle cx={x} cy={tY(d.max)} r="6" fill="#e7892b" stroke="white" strokeWidth="2" filter="url(#fcDotShadow)" />
              <circle cx={x} cy={tY(d.min)} r="5" fill="#3aa6d9" stroke="white" strokeWidth="2" filter="url(#fcDotShadow)" />
            </g>
          );
        })}
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
