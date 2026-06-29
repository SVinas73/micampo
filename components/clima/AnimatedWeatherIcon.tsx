"use client";

import React from "react";

/**
 * Íconos de clima animados (SVG + CSS), en la paleta de MiCampo.
 * Condiciones: sun, partly, cloud, fog, rain, snow, storm.
 * Liviano y nítido (no necesita three.js para íconos de este tamaño).
 */

export type WxCond = "sun" | "partly" | "cloud" | "fog" | "rain" | "snow" | "storm" | "wind";

export function condFrom(input?: string | null): WxCond {
  const k = (input || "").toLowerCase();
  if (["sun", "partly", "cloud", "fog", "rain", "snow", "storm", "wind"].includes(k)) return k as WxCond;
  if (k.includes("torm") || k.includes("bolt") || k.includes("storm")) return "storm";
  // "chubascos de nieve" / "nevadas" → nieve
  if (k.includes("niev") || k.includes("neva") || k.includes("snow")) return "snow";
  if (k.includes("lluv") || k.includes("llov") || k.includes("chubas") || k.includes("rain") || k.includes("droplet")) return "rain";
  if (k.includes("niebla") || k.includes("fog") || k.includes("bruma") || k.includes("neblina")) return "fog";
  if (k.includes("vien") || k.includes("ráfag") || k.includes("rafag") || k.includes("wind")) return "wind";
  if (k.includes("parcial") || k.includes("partly") || k.includes("nubes y sol") || k.includes("algo de sol")) return "partly";
  if (k.includes("despej") || k.includes("sol") || k.includes("clear")) return "sun";
  return "cloud";
}

const SUN = "#f0a32f";
const SUN_2 = "#ffd778";
const DROP = "#3a93d6";
const BOLT = "#e8a13a";

function Sun({ cx = 32, cy = 26, r = 11 }: { cx?: number; cy?: number; r?: number }) {
  const rays = Array.from({ length: 8 });
  return (
    <>
      <g className="wx-rays" style={{ transformBox: "view-box", transformOrigin: `${cx}px ${cy}px` }}>
        {rays.map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x1 = cx + Math.cos(a) * (r + 4);
          const y1 = cy + Math.sin(a) * (r + 4);
          const x2 = cx + Math.cos(a) * (r + 9);
          const y2 = cy + Math.sin(a) * (r + 9);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={SUN} strokeWidth="2.4" strokeLinecap="round" />;
        })}
      </g>
      <circle className="wx-suncore" cx={cx} cy={cy} r={r} fill="url(#wxSun)" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
    </>
  );
}

function Cloud({ x = 0, y = 0, scale = 1, dark = false }: { x?: number; y?: number; scale?: number; dark?: boolean }) {
  return (
    <g className="wx-cloud" transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="23" cy="34" r="10" fill={`url(#${dark ? "wxCloudD" : "wxCloud"})`} />
      <circle cx="37" cy="31" r="13" fill={`url(#${dark ? "wxCloudD" : "wxCloud"})`} />
      <circle cx="46" cy="37" r="9" fill={`url(#${dark ? "wxCloudD" : "wxCloud"})`} />
      <rect x="19" y="36" width="30" height="11" rx="5.5" fill={`url(#${dark ? "wxCloudD" : "wxCloud"})`} />
    </g>
  );
}

export function AnimatedWeatherIcon({ cond, size = 64 }: { cond: WxCond | string; size?: number }) {
  const c = condFrom(typeof cond === "string" ? cond : cond);
  const drops = (color: string) =>
    [22, 32, 42].map((dx, i) => (
      <line key={i} className="wx-drop" style={{ animationDelay: `${i * 0.35}s` }} x1={dx} y1="48" x2={dx - 2} y2="53" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    ));

  return (
    <span className="wx" style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="wxSun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SUN_2} />
            <stop offset="100%" stopColor={SUN} />
          </linearGradient>
          <linearGradient id="wxCloud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#d7e0ea" />
          </linearGradient>
          <linearGradient id="wxCloudD" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c2cedd" />
            <stop offset="100%" stopColor="#8f9fb3" />
          </linearGradient>
        </defs>

        {c === "sun" && <Sun cx={32} cy={30} r={13} />}

        {c === "partly" && (
          <>
            <Sun cx={42} cy={22} r={9} />
            <Cloud x={-4} y={4} scale={0.92} />
          </>
        )}

        {c === "cloud" && <Cloud y={2} scale={1.02} />}

        {c === "fog" && (
          <>
            <Cloud y={-2} scale={0.98} />
            {[50, 54, 58].map((yy, i) => (
              <line key={i} className="wx-fogline" style={{ animationDelay: `${i * 0.5}s` }} x1="16" y1={yy} x2="48" y2={yy} stroke="#aeb9c7" strokeWidth="2.4" strokeLinecap="round" />
            ))}
          </>
        )}

        {c === "rain" && (
          <>
            <Cloud y={-2} scale={1} />
            {drops(DROP)}
          </>
        )}

        {c === "snow" && (
          <>
            <Cloud y={-2} scale={1} />
            {[22, 32, 42].map((dx, i) => (
              <circle key={i} className="wx-flake" style={{ animationDelay: `${i * 0.45}s`, transformBox: "fill-box", transformOrigin: "center" }} cx={dx} cy="50" r="2.4" fill="#f4f9ff" stroke="#cfe3f5" strokeWidth="0.5" />
            ))}
          </>
        )}

        {c === "wind" && (
          <>
            <Cloud x={-3} y={-3} scale={0.9} />
            <g className="wx-gust" fill="none" stroke="#dce8f3" strokeWidth="2.6" strokeLinecap="round">
              <path d="M14 42 H40 a4.5 4.5 0 1 0 -4.5 -4.5" />
              <path d="M14 50 H31 a3.6 3.6 0 1 1 -3.6 3.6" />
              <path d="M14 58 H24" opacity="0.8" />
            </g>
          </>
        )}

        {c === "storm" && (
          <>
            <Cloud y={-2} scale={1} dark />
            <polygon className="wx-bolt" points="33,46 28,55 32,55 29,62 38,52 33,52 36,46" fill={BOLT} stroke="#fff" strokeWidth="0.5" />
            <line className="wx-drop" style={{ animationDelay: "0.2s" }} x1="22" y1="48" x2="20" y2="53" stroke={DROP} strokeWidth="2.4" strokeLinecap="round" />
            <line className="wx-drop" style={{ animationDelay: "0.6s" }} x1="44" y1="48" x2="42" y2="53" stroke={DROP} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
}
