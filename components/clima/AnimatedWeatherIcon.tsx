"use client";

import React, { useId } from "react";

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

function Moon({ cx = 31, cy = 30, r = 14, maskId }: { cx?: number; cy?: number; r?: number; maskId: string }) {
  // Recorte de la media luna, relativo a la posición/tamaño de la luna.
  const cutX = cx + r * 0.46, cutY = cy - r * 0.3, cutR = r * 0.98;
  return (
    <>
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="64" height="64" fill="#fff" />
          <circle cx={cutX} cy={cutY} r={cutR} fill="#000" />
        </mask>
      </defs>
      <circle cx={cx} cy={cy} r={r + 6} fill="url(#wxMoonGlow)" />
      <circle className="wx-suncore" cx={cx} cy={cy} r={r} fill="url(#wxMoon)" stroke="#fff6da" strokeWidth="0.5" mask={`url(#${maskId})`} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
    </>
  );
}

function Stars({ pts }: { pts: { x: number; y: number; r: number }[] }) {
  return (
    <>
      {pts.map((p, i) => (
        <circle key={i} className="wx-twinkle" style={{ animationDelay: `${i * 0.5}s` }} cx={p.x} cy={p.y} r={p.r} fill="#fff7d6" />
      ))}
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

export function AnimatedWeatherIcon({ cond, size = 64, night = false }: { cond: WxCond | string; size?: number; night?: boolean }) {
  const c = condFrom(typeof cond === "string" ? cond : cond);
  const uid = useId();
  const estrellas = [{ x: 13, y: 15, r: 1.5 }, { x: 51, y: 13, r: 1.2 }, { x: 47, y: 31, r: 1.4 }, { x: 19, y: 35, r: 1.1 }];
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
          {night && (
            <>
              <radialGradient id="wxMoon" cx="38%" cy="34%" r="72%">
                <stop offset="0%" stopColor="#fdf8e6" />
                <stop offset="100%" stopColor="#e3d290" />
              </radialGradient>
              <radialGradient id="wxMoonGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fdf6dc" stopOpacity="0.45" />
                <stop offset="65%" stopColor="#e9dca6" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#e9dca6" stopOpacity="0" />
              </radialGradient>
            </>
          )}
        </defs>

        {c === "sun" && (night ? <><Stars pts={estrellas} /><Moon cx={31} cy={30} r={14} maskId={`${uid}-m`} /></> : <Sun cx={32} cy={30} r={13} />)}

        {c === "partly" && (
          <>
            {night ? <><Stars pts={[{ x: 15, y: 13, r: 1.3 }, { x: 53, y: 31, r: 1.2 }]} /><Moon cx={41} cy={20} r={11} maskId={`${uid}-mp`} /></> : <Sun cx={42} cy={22} r={9} />}
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
              <circle key={i} className="wx-flake" style={{ animationDelay: `${i * 0.45}s`, transformBox: "fill-box", transformOrigin: "center" }} cx={dx} cy="50" r="2.5" fill="#cfe2fb" stroke="#5b86bd" strokeWidth="1" />
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
