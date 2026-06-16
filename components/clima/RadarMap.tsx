"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/mc";

export function RadarMap() {
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(70);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => {
        setPct((p) => (p >= 100 ? 0 : p + 5));
      }, 400);
    } else if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing]);

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
      <div
        style={{
          height: 300,
          background: "linear-gradient(135deg, #768f44 0%, #3aa6d9 50%, #d9a538 100%)",
          position: "relative",
        }}
      >
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="storm1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff3030" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#c08a22" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#d9a538" stopOpacity="0.2" />
            </radialGradient>
            <radialGradient id="storm2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3aa6d9" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#3aa6d9" stopOpacity="0" />
            </radialGradient>
            <pattern id="aerialField" patternUnits="userSpaceOnUse" width="80" height="60">
              <rect width="80" height="60" fill="#768f44" />
              <rect x="0" y="0" width="40" height="30" fill="#5fae62" />
              <rect x="40" y="30" width="40" height="30" fill="#6db870" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#aerialField)" />
          <ellipse cx={180 + (pct - 70) * 0.6} cy="120" rx="80" ry="50" fill="url(#storm1)" />
          <ellipse cx={120 + (pct - 70) * 0.6} cy="200" rx="60" ry="40" fill="url(#storm2)" />
          <ellipse cx={280 + (pct - 70) * 0.6} cy="180" rx="50" ry="35" fill="url(#storm2)" />
        </svg>

        <div
          style={{
            position: "absolute",
            left: "45%",
            top: "40%",
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "var(--mc-red)",
            border: "3px solid white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            display: "grid",
            placeItems: "center",
            color: "white",
          }}
        >
          <Icon name="map" size={14} />
        </div>
        <div
          style={{
            position: "absolute",
            left: "calc(45% + 35px)",
            top: "calc(40% - 4px)",
            background: "rgba(255,255,255,0.95)",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--mc-ink)",
          }}
        >
          Tu Lote
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 12,
            background: "rgba(0,0,0,0.65)",
            color: "white",
            padding: "8px 12px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={() => setPlaying((p) => !p)}
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "none",
              background: "white",
              color: "#111",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              flexShrink: 0,
            }}
            title={playing ? "Pausar" : "Reproducir"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff3030" }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>En vivo · Última act: Hace 2 min</span>
          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "white", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>

        <button
          className="mc-icon-btn"
          style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.95)", border: "none", boxShadow: "var(--sh-sm)" }}
          title="Expandir"
        >
          <Icon name="search" size={14} />
        </button>
      </div>
    </div>
  );
}
