"use client";

import React from "react";
import { condFrom, type WxCond } from "./AnimatedWeatherIcon";

/**
 * Escena de clima animada para encabezados de tarjetas.
 * Renderiza un cielo + elementos animados (sol, nubes, lluvia, nieve, viento,
 * tormenta) según la condición, manteniendo el texto blanco legible. Los hijos
 * se dibujan por encima de la escena.
 */

const SKY: Record<WxCond, string> = {
  sun: "linear-gradient(120deg, #2e6fae 0%, #4a90c2 42%, #e0a04a 118%)",
  partly: "linear-gradient(120deg, #3a73a8 0%, #5d97c0 55%, #b9c6a6 120%)",
  cloud: "linear-gradient(120deg, #56697e 0%, #74879b 100%)",
  fog: "linear-gradient(120deg, #67727f 0%, #8a949f 100%)",
  rain: "linear-gradient(120deg, #2c4760 0%, #3f5d78 100%)",
  snow: "linear-gradient(120deg, #5d7a93 0%, #86a3bb 100%)",
  storm: "linear-gradient(120deg, #272442 0%, #3e3a5b 100%)",
};

function Clouds({ n, opacity = 0.85 }: { n: number; opacity?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="wx-scene-cloud"
          style={{
            top: `${10 + i * 22}%`,
            left: `${-30 + i * 18}%`,
            width: 120 + i * 34,
            height: 30 + i * 6,
            opacity: opacity - i * 0.12,
            animationDuration: `${26 + i * 9}s`,
            animationDelay: `${-i * 6}s`,
          }}
        />
      ))}
    </>
  );
}

function Rain({ heavy }: { heavy?: boolean }) {
  const drops = heavy ? 34 : 20;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {Array.from({ length: drops }).map((_, i) => (
        <span
          key={i}
          className="wx-scene-rain"
          style={{
            left: `${(i * 100) / drops + (i % 3)}%`,
            animationDuration: `${0.6 + (i % 5) * 0.12}s`,
            animationDelay: `${-(i % 7) * 0.2}s`,
            height: heavy ? 16 : 12,
          }}
        />
      ))}
    </div>
  );
}

function Snow() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="wx-scene-snow"
          style={{
            left: `${(i * 100) / 22}%`,
            animationDuration: `${3 + (i % 4)}s`,
            animationDelay: `${-(i % 6) * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

function Wind() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="wx-scene-wind"
          style={{ top: `${18 + i * 13}%`, width: 40 + (i % 3) * 30, animationDuration: `${2.4 + (i % 3) * 0.7}s`, animationDelay: `${-i * 0.5}s` }}
        />
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
      {/* Capa de escena */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden>
        {(c === "sun" || c === "partly") && (
          <>
            <div className="wx-scene-sun" style={{ top: c === "sun" ? -40 : -30, right: c === "sun" ? -20 : 40 }} />
            <div className="wx-scene-rays" style={{ top: c === "sun" ? 6 : 12, right: c === "sun" ? 14 : 70 }} />
          </>
        )}
        {c === "partly" && <Clouds n={2} opacity={0.8} />}
        {c === "cloud" && <Clouds n={3} />}
        {c === "fog" && (
          <>
            <Clouds n={2} opacity={0.55} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="wx-scene-fog" style={{ top: `${28 + i * 16}%`, animationDelay: `${-i * 1.3}s` }} />
            ))}
          </>
        )}
        {c === "rain" && (<><Clouds n={3} opacity={0.7} /><Rain /></>)}
        {c === "storm" && (
          <>
            <Clouds n={3} opacity={0.75} />
            <Rain heavy />
            <div className="wx-scene-flash" />
            <svg className="wx-scene-bolt" viewBox="0 0 24 48" width="26" height="52" style={{ position: "absolute", top: "34%", left: "62%" }}>
              <path d="M13 0 L3 26 H11 L8 48 L21 18 H12 Z" fill="#ffe27a" />
            </svg>
          </>
        )}
        {c === "snow" && (<><Clouds n={2} opacity={0.6} /><Snow /></>)}
        {windy && c !== "storm" && c !== "rain" && <Wind />}
        {/* Vignette para legibilidad del texto */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0) 70%)" }} />
      </div>
      {/* Contenido */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
