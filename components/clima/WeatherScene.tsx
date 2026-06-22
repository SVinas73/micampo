"use client";

import React, { useId } from "react";
import { condFrom, type WxCond } from "./AnimatedWeatherIcon";

/**
 * Escena de clima realista para encabezados de tarjetas.
 * Dibuja un cielo + sol, nubes, lluvia, nieve, viento o tormenta con SVG
 * (formas reales, no manchas), animados, manteniendo el texto blanco legible.
 */

const SKY: Record<WxCond, string> = {
  sun: "linear-gradient(120deg, #2e6fae 0%, #4a90c2 40%, #e0a04a 120%)",
  partly: "linear-gradient(120deg, #3a73a8 0%, #5d97c0 52%, #cdb38a 122%)",
  cloud: "linear-gradient(120deg, #51647a 0%, #738597 100%)",
  fog: "linear-gradient(120deg, #647280 0%, #8b95a1 100%)",
  rain: "linear-gradient(120deg, #294258 0%, #3b596f 100%)",
  snow: "linear-gradient(120deg, #5a7791 0%, #84a1b9 100%)",
  storm: "linear-gradient(120deg, #242140 0%, #3b3759 100%)",
};

/* ---------- Sol realista: disco con halo + rayos girando ---------- */
function SunSVG({ size = 150 }: { size?: number }) {
  const id = useId();
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} style={{ display: "block" }}>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff4cf" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#ffd778" stopOpacity="0.55" />
          <stop offset="72%" stopColor="#ffcf6a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#fff6da" />
          <stop offset="60%" stopColor="#ffd86b" />
          <stop offset="100%" stopColor="#f3ad3c" />
        </radialGradient>
      </defs>
      <circle cx="70" cy="70" r="68" fill={`url(#${id}-glow)`} className="wx-scene-pulse" />
      <g className="wx-scene-rays-g">
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x="68.5" y="6" width="3" height="15" rx="1.5" fill="#ffe49a" opacity="0.9"
            transform={`rotate(${i * 30} 70 70)`} />
        ))}
      </g>
      <circle cx="70" cy="70" r="30" fill={`url(#${id}-core)`} stroke="#ffe9a8" strokeWidth="1.5" />
    </svg>
  );
}

/* ---------- Nube realista: silueta esponjosa con volumen ---------- */
function CloudSVG({ w = 150, dark }: { w?: number; dark?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 130 78" width={w} style={{ display: "block", filter: "drop-shadow(0 5px 7px rgba(20,30,40,0.18))" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={dark ? "#cfd6de" : "#ffffff"} />
          <stop offset="100%" stopColor={dark ? "#9aa6b4" : "#e6ecf2"} />
        </linearGradient>
      </defs>
      <path
        d="M30 66 C14 66 6 56 9 45 C11 36 21 32 30 34 C32 20 45 12 58 16 C68 6 86 8 92 22 C95 21 99 20 103 21 C116 23 122 34 118 46 C124 49 126 56 122 62 C119 66 113 66 108 66 Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

function Clouds({ defs }: { defs: { top: string; w: number; dur: number; delay: number; dark?: boolean; opacity?: number }[] }) {
  return (
    <>
      {defs.map((d, i) => (
        <div key={i} className="wx-scene-cloud-wrap" style={{ top: d.top, opacity: d.opacity ?? 1, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}>
          <CloudSVG w={d.w} dark={d.dark} />
        </div>
      ))}
    </>
  );
}

function Rain({ heavy }: { heavy?: boolean }) {
  const n = heavy ? 38 : 24;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="wx-scene-raindrop" style={{
          left: `${(i * 100) / n + (i % 4)}%`,
          animationDuration: `${0.55 + (i % 5) * 0.1}s`,
          animationDelay: `${-(i % 7) * 0.18}s`,
          height: heavy ? 20 : 15,
        }} />
      ))}
    </div>
  );
}

function Snow() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden>
      {Array.from({ length: 26 }).map((_, i) => (
        <span key={i} className="wx-scene-flake" style={{ left: `${(i * 100) / 26}%`, animationDuration: `${3 + (i % 4)}s`, animationDelay: `${-(i % 6) * 0.5}s`, width: 5 + (i % 3) * 2, height: 5 + (i % 3) * 2 }} />
      ))}
    </div>
  );
}

function Wind() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="wx-scene-gust" style={{ top: `${22 + i * 14}%`, width: 50 + (i % 3) * 34, animationDuration: `${2.4 + (i % 3) * 0.7}s`, animationDelay: `${-i * 0.5}s` }} />
      ))}
    </div>
  );
}

export function WeatherScene({
  cond,
  windy,
  children,
  style,
  className,
}: {
  cond?: string | WxCond | null;
  windy?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const c = condFrom(cond ?? "cloud");
  return (
    <div className={className} style={{ position: "relative", overflow: "hidden", background: SKY[c], ...style }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden>
        {(c === "sun" || c === "partly") && (
          <div style={{ position: "absolute", top: c === "sun" ? -34 : -22, right: c === "sun" ? -8 : 56 }}>
            <SunSVG size={c === "sun" ? 168 : 120} />
          </div>
        )}
        {c === "partly" && <Clouds defs={[{ top: "44%", w: 130, dur: 32, delay: -4, opacity: 0.78 }, { top: "16%", w: 88, dur: 46, delay: -20, opacity: 0.7 }]} />}
        {c === "cloud" && <Clouds defs={[{ top: "12%", w: 150, dur: 38, delay: 0, opacity: 0.5 }, { top: "40%", w: 116, dur: 30, delay: -12, opacity: 0.42 }, { top: "60%", w: 92, dur: 52, delay: -26, opacity: 0.38 }]} />}
        {c === "fog" && (
          <>
            <Clouds defs={[{ top: "8%", w: 150, dur: 50, delay: 0, dark: true }]} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="wx-scene-fogband" style={{ top: `${30 + i * 15}%`, animationDelay: `${-i * 1.3}s` }} />
            ))}
          </>
        )}
        {c === "rain" && (<><Clouds defs={[{ top: "4%", w: 150, dur: 40, delay: 0, dark: true }, { top: "20%", w: 110, dur: 34, delay: -10, dark: true }]} /><Rain /></>)}
        {c === "storm" && (
          <>
            <Clouds defs={[{ top: "2%", w: 158, dur: 42, delay: 0, dark: true }, { top: "22%", w: 118, dur: 30, delay: -14, dark: true }]} />
            <Rain heavy />
            <div className="wx-scene-flash" />
            <svg className="wx-scene-bolt" viewBox="0 0 24 48" width="26" height="52" style={{ position: "absolute", top: "36%", left: "60%" }}>
              <path d="M13 0 L3 26 H11 L8 48 L21 18 H12 Z" fill="#ffe27a" />
            </svg>
          </>
        )}
        {c === "snow" && (<><Clouds defs={[{ top: "6%", w: 140, dur: 46, delay: 0, dark: true }]} /><Snow /></>)}
        {windy && c !== "storm" && c !== "rain" && <Wind />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.12) 38%, rgba(0,0,0,0) 68%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
