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
  wind: "linear-gradient(120deg, #4a6076 0%, #6f8aa0 100%)",
};

// Cielos nocturnos (oscuros) para cada condición.
const SKY_NIGHT: Record<WxCond, string> = {
  sun: "linear-gradient(160deg, #0a1430 0%, #182a4d 58%, #243a5e 120%)",
  partly: "linear-gradient(160deg, #0e1a36 0%, #1f3155 60%, #2a3f63 120%)",
  cloud: "linear-gradient(160deg, #19212f 0%, #2a3445 100%)",
  fog: "linear-gradient(160deg, #1d242d 0%, #353d48 100%)",
  rain: "linear-gradient(160deg, #0c1722 0%, #1b2937 100%)",
  snow: "linear-gradient(160deg, #1a2838 0%, #31465d 100%)",
  storm: "linear-gradient(160deg, #07071a 0%, #1a1830 100%)",
  wind: "linear-gradient(160deg, #161f2c 0%, #2a3846 100%)",
};

/* ---------- Luna realista: disco con halo + cráter recortado (creciente) ---------- */
function MoonSVG({ size = 120 }: { size?: number }) {
  const id = useId();
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} style={{ display: "block" }}>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdf6dc" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#e9dca6" stopOpacity="0.16" />
          <stop offset="80%" stopColor="#e9dca6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx="40%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#fdf8e6" />
          <stop offset="100%" stopColor="#dccd96" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect x="0" y="0" width="140" height="140" fill="#fff" />
          <circle cx="92" cy="54" r="44" fill="#000" />
        </mask>
      </defs>
      <circle cx="70" cy="70" r="66" fill={`url(#${id}-glow)`} className="wx-scene-pulse" />
      <circle cx="70" cy="70" r="44" fill={`url(#${id}-core)`} mask={`url(#${id}-mask)`} />
    </svg>
  );
}

/* ---------- Estrellas: titilan en el cielo nocturno despejado ---------- */
function StarsScene({ n = 22 }: { n?: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden>
      {Array.from({ length: n }).map((_, i) => {
        const x = (i * 67) % 100;
        const y = (i * 37) % 62; // mitad superior del cielo
        const s = i % 4 === 0 ? 3 : 2;
        return (
          <span key={i} className="wx-scene-star" style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDelay: `${-(i % 6) * 0.5}s` }} />
        );
      })}
    </div>
  );
}

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

/* ---------- Nube realista: cúmulos esponjosos con volumen (sin base) ---------- */
function CloudSVG({ w = 150, dark }: { w?: number; dark?: boolean }) {
  const id = useId();
  const top = dark ? "#d5dce4" : "#ffffff";
  const bot = dark ? "#9fabb9" : "#e3e9f0";
  return (
    <svg viewBox="0 0 140 84" width={w} style={{ display: "block", filter: `drop-shadow(0 2px 4px rgba(18,28,44,${dark ? 0.2 : 0.12}))` }}>
      <defs>
        {/* Volumen: iluminado arriba-izquierda, apenas más tenue hacia abajo */}
        <radialGradient id={`${id}-v`} cx="42%" cy="34%" r="82%">
          <stop offset="0%" stopColor={top} />
          <stop offset="62%" stopColor={top} />
          <stop offset="100%" stopColor={bot} />
        </radialGradient>
      </defs>
      {/* Cuerpo: varios lóbulos superpuestos → silueta "pomposa", sin base plana */}
      <g fill={`url(#${id}-v)`}>
        <ellipse cx="44" cy="56" rx="30" ry="23" />
        <circle cx="50" cy="42" r="23" />
        <circle cx="80" cy="37" r="29" />
        <circle cx="106" cy="51" r="22" />
        <ellipse cx="92" cy="58" rx="31" ry="21" />
        <ellipse cx="72" cy="62" rx="46" ry="18" />
      </g>
      {/* Brillo superior (luz pegando arriba) */}
      <ellipse cx="70" cy="34" rx="27" ry="14" fill="#ffffff" opacity={dark ? 0.16 : 0.5} />
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
  const n = heavy ? 60 : 42;
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

/* ---------- Icono "hero" FIJO arriba a la derecha, con movimiento, por condición ---------- */
function Hero({ c, night }: { c: WxCond; night: boolean }) {
  // Despejado: sol (impecable) o luna.
  if (c === "sun") {
    return night
      ? <div style={{ position: "absolute", top: -2, right: 12 }}><MoonSVG size={108} /></div>
      : <div style={{ position: "absolute", top: -8, right: 4 }}><SunSVG size={140} /></div>;
  }
  // Parcial: sol/luna con una nube adelante (sol con nube).
  if (c === "partly") {
    return (
      <div style={{ position: "absolute", top: -4, right: 8, width: 150, height: 118 }}>
        <div style={{ position: "absolute", top: 0, right: 0 }}>{night ? <MoonSVG size={80} /> : <SunSVG size={96} />}</div>
        <div className="wx-scene-hero" style={{ position: "absolute", top: 52, left: 0 }}><CloudSVG w={104} /></div>
      </div>
    );
  }
  // Tormenta: nube oscura + rayo DEBAJO de la nube, que destella como si cayera.
  if (c === "storm") {
    return (
      <div style={{ position: "absolute", top: 10, right: 12, width: 148 }}>
        <div className="wx-scene-hero"><CloudSVG w={148} dark /></div>
        <svg className="wx-strike" viewBox="0 0 24 48" width="26" height="52" style={{ position: "absolute", top: 54, left: 60, filter: "drop-shadow(0 0 8px rgba(255,226,122,0.95))" }}>
          <path d="M13 0 L3 26 H11 L8 48 L21 18 H12 Z" fill="#ffe27a" stroke="#fff6c8" strokeWidth="0.6" />
        </svg>
      </div>
    );
  }
  // Resto: nube fija (oscura para niebla/lluvia) con leve flotación.
  const dark = c === "rain" || c === "fog";
  const size = c === "wind" ? 128 : c === "snow" ? 138 : 148;
  return (
    <div className="wx-scene-hero" style={{ position: "absolute", top: 10, right: 12 }}>
      <CloudSVG w={size} dark={dark} />
    </div>
  );
}

export function WeatherScene({
  cond,
  windy,
  night = false,
  children,
  style,
  className,
}: {
  cond?: string | WxCond | null;
  windy?: boolean;
  night?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const c = condFrom(cond ?? "cloud");
  const cieloDespejado = c === "sun" || c === "partly";
  return (
    <div className={className} style={{ position: "relative", overflow: "hidden", background: (night ? SKY_NIGHT : SKY)[c], ...style }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden>
        {/* De noche con cielo despejado/parcial: estrellas titilando */}
        {night && cieloDespejado && <StarsScene n={c === "sun" ? 24 : 16} />}

        {/* Icono FIJO con movimiento, arriba a la derecha — presente en TODA condición */}
        <Hero c={c} night={night} />

        {/* Nubes que pasan (ambiance suave) cuando está nublado */}
        {c === "cloud" && <Clouds defs={[{ top: "20%", w: 116, dur: 44, delay: 0, opacity: 0.26 }, { top: "56%", w: 88, dur: 58, delay: -22, opacity: 0.2 }]} />}

        {/* Efectos de escena completa según la condición */}
        {c === "fog" && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="wx-scene-fogband" style={{ top: `${30 + i * 15}%`, animationDelay: `${-i * 1.3}s` }} />
        ))}
        {c === "rain" && <Rain />}
        {c === "storm" && (
          <>
            <Rain heavy />
            {/* Destello sincronizado con el rayo (el rayo va en el hero, bajo la nube) */}
            <div className="wx-strike" style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.5)" }} />
          </>
        )}
        {c === "snow" && <Snow />}
        {c === "wind" && <Wind />}
        {(windy && c !== "storm" && c !== "rain" && c !== "wind") && <Wind />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.12) 38%, rgba(0,0,0,0) 68%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
