"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Icon, Modal, Field, useToast, AnimatedNumber, Sparkline } from "@/components/mc";
import { useLoteScope } from "@/components/LoteScope";
import { weatherTone } from "@/components/clima/weatherTone";
import { AnimatedWeatherIcon } from "@/components/clima/AnimatedWeatherIcon";
import { WeatherScene } from "@/components/clima/WeatherScene";
import { CapturaRapida } from "@/components/CapturaRapida";
import { BenchmarkCard } from "@/components/BenchmarkCard";

/* ============================================================
   MiCampo — Inicio (dashboard)
   Recreación fiel del MiCampo Design System (ui_kits/inicio):
   topbar + header serif, 5 KPIs planos, 2 tarjetas resumen,
   clima+agenda, salud de lotes + suelo, balance (área),
   rinde (barras), distribución (dona), actividades, alertas,
   acciones rápidas. Los datos reales (KPIs, balance, cultivos)
   se cargan por API y reemplazan a los de muestra cuando existen.
   ============================================================ */

const MC_OLIVE = "#5e7733", MC_OLIVE_L = "#8ea65a", MC_GOLD = "#d9a538", MC_GOLD_D = "#c08a22";

type BriefItem = {
  severidad: "alta" | "media" | "baja";
  icono: string;
  titulo: string;
  detalle: string;
  impacto?: string;
  accion: string;
  ruta: string;
};
type BriefData = { fecha: string; generadoPorIA: boolean; resumen: string; items: BriefItem[] };

const SEV_COLOR: Record<string, string> = { alta: "#c93434", media: "#d9a538", baja: "#5e7733" };

const capitalizar = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

type ClimaActual = { temperatura: number; sensacion: number; humedad: number; rocio: number; viento: number; vientoDir: string; rafaga: number; presion: number; deltaT: number; aptoPulverizacion: boolean; icono: string; descripcion: string };
type ClimaDia = { nombre: string; num: number; esHoy: boolean; icono: string; max: number; min: number; mm: number; probLluvia: number; viento: number; et0: number };
type ClimaData = { actual: ClimaActual; dias: ClimaDia[]; ubicacion?: { nombre?: string } };

type KpiCfg = { key: string; label: string; value: string; delta: string; trend: "up" | "down" | "warn"; icon: string; tone?: "accent" | "warn" };

const KPIS_BASE: KpiCfg[] = [
  { key: "hectareas", label: "Hectáreas productivas", value: "0 Ha", delta: "—", trend: "up", icon: "map", tone: "accent" },
  { key: "cabezas", label: "Cabezas de ganado", value: "0", delta: "—", trend: "up", icon: "cow" },
  { key: "ingresosMes", label: "Ingresos del mes", value: "$0", delta: "—", trend: "up", icon: "dollar" },
  { key: "labores", label: "Labores pendientes", value: "0", delta: "—", trend: "up", icon: "wrench" },
  { key: "agua", label: "Reserva agua útil", value: "0%", delta: "—", trend: "up", icon: "droplet" },
];

/* ---------- monotone cubic interpolation (curvas suaves) ---------- */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  const d = pts.map((p) => [p.x, p.y]);
  const n = d.length, dx: number[] = [], dy: number[] = [], m: number[] = [], tan: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = d[i + 1][0] - d[i][0]; dy[i] = d[i + 1][1] - d[i][1]; m[i] = dy[i] / dx[i]; }
  tan[0] = m[0];
  for (let i = 1; i < n - 1; i++) tan[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  tan[n - 1] = m[n - 2];
  let path = `M ${d[0][0]} ${d[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = d[i][0] + dx[i] / 3, y1 = d[i][1] + tan[i] * dx[i] / 3;
    const x2 = d[i + 1][0] - dx[i] / 3, y2 = d[i + 1][1] - tan[i + 1] * dx[i] / 3;
    path += ` C ${x1} ${y1} ${x2} ${y2} ${d[i + 1][0]} ${d[i + 1][1]}`;
  }
  return path;
}

/* ---------- Donut (anillo con segmentos redondeados) ---------- */
function Donut({ segments, size = 150, thickness = 16, gap = 2, rounded = true, children }: {
  segments: { value: number; color: string }[]; size?: number; thickness?: number; gap?: number; rounded?: boolean; children?: React.ReactNode;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--mc-surface-3)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const full = (s.value / total) * c;
          const len = Math.max(0.5, full - gap);
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color}
              strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
              strokeLinecap={rounded ? "round" : "butt"} />
          );
          offset += full;
          return el;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- Balance mensual (área línea ingresos/gastos) ---------- */
function BalanceArea({ meses, ingresos, gastos }: { meses: string[]; ingresos: number[]; gastos: number[] }) {
  const max = Math.max(10, ...ingresos, ...gastos);
  const W = 560, H = 170, padL = 36, padR = 14, padT = 14, padB = 26;
  const iW = W - padL - padR, iH = H - padT - padB, n = meses.length;
  const X = (i: number) => padL + (i / (n - 1)) * iW, Y = (v: number) => padT + iH * (1 - v / max);
  const pI = ingresos.map((v, i) => ({ x: X(i), y: Y(v) }));
  const pG = gastos.map((v, i) => ({ x: X(i), y: Y(v) }));
  const lineI = smoothPath(pI), lineG = smoothPath(pG);
  const areaI = lineI + ` L ${X(n - 1)} ${Y(0)} L ${X(0)} ${Y(0)} Z`;
  const areaG = lineG + ` L ${X(n - 1)} ${Y(0)} L ${X(0)} ${Y(0)} Z`;
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => Math.round(max * p));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block", maxWidth: 680, margin: "0 auto", maxHeight: 200 }}>
      <defs>
        <linearGradient id="mcba-i" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={MC_OLIVE} stopOpacity="0.26" /><stop offset="100%" stopColor={MC_OLIVE} stopOpacity="0" /></linearGradient>
        <linearGradient id="mcba-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={MC_GOLD} stopOpacity="0.20" /><stop offset="100%" stopColor={MC_GOLD} stopOpacity="0" /></linearGradient>
      </defs>
      {ticks.map((v, i) => { const y = Y(v); return (<g key={i}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--mc-line)" strokeDasharray={v === 0 ? "0" : "3,4"} /><text x={padL - 7} y={y + 3} fontSize="9.5" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">${v}M</text></g>); })}
      <path d={areaG} fill="url(#mcba-g)" />
      <path d={areaI} fill="url(#mcba-i)" />
      <path d={lineG} fill="none" stroke={MC_GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={lineI} fill="none" stroke={MC_OLIVE} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
      {pG.map((p, i) => (i === n - 1 ? <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke={MC_GOLD} strokeWidth="2.5" /> : null))}
      {pI.map((p, i) => i === n - 1
        ? <g key={i}><circle cx={p.x} cy={p.y} r="9" fill={MC_OLIVE} opacity="0.14" /><circle cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke={MC_OLIVE} strokeWidth="2.75" /></g>
        : <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" stroke={MC_OLIVE} strokeWidth="2.25" />)}
      {meses.map((mn, i) => <text key={i} x={X(i)} y={H - 8} fontSize="10.5" fontFamily="var(--ff-ui)" fontWeight={i === n - 1 ? 700 : 500} fill={i === n - 1 ? "var(--mc-ink)" : "var(--mc-text-3)"} textAnchor="middle">{mn}</text>)}
    </svg>
  );
}

/* ---------- Rinde por lote (barras real vs objetivo) ---------- */
function RindeBars() {
  const lotes = ["N1", "N2", "E1", "E2", "S1", "S2"];
  const real = [6.6, 5.8, 7.2, 4.9, 6.1, 5.4];
  const obj = [6.0, 6.2, 6.8, 5.5, 5.8, 5.6];
  const W = 460, H = 210, padL = 28, padR = 12, padT = 16, padB = 26, max = 8;
  const iW = W - padL - padR, iH = H - padT - padB, n = lotes.length;
  const band = iW / n, bw = 14, gap = 4;
  const Y = (v: number) => padT + iH * (1 - v / max);
  const maxIdx = real.indexOf(Math.max(...real));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
      <defs>
        <linearGradient id="mcbar-o" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={MC_OLIVE_L} /><stop offset="100%" stopColor={MC_OLIVE} /></linearGradient>
        <linearGradient id="mcbar-hi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={MC_GOLD} /><stop offset="100%" stopColor={MC_GOLD_D} /></linearGradient>
      </defs>
      {[0, 2, 4, 6, 8].map((v, i) => { const y = Y(v); return (<g key={i}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--mc-line)" strokeDasharray={v === 0 ? "0" : "3,4"} /><text x={padL - 6} y={y + 3} fontSize="9.5" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">{v}</text></g>); })}
      {lotes.map((lt, i) => {
        const cx = padL + band * i + band / 2;
        const xObj = cx - bw - gap / 2, xReal = cx + gap / 2, hi = i === maxIdx;
        return (
          <g key={i}>
            <rect x={xObj} y={Y(obj[i])} width={bw} height={Y(0) - Y(obj[i])} rx="4" fill="var(--mc-line-2)" opacity="0.7" />
            <rect x={xReal} y={Y(real[i])} width={bw} height={Y(0) - Y(real[i])} rx="4" fill={hi ? "url(#mcbar-hi)" : "url(#mcbar-o)"} />
            <text x={xReal + bw / 2} y={Y(real[i]) - 6} fontSize="9.5" fontFamily="var(--ff-mono)" fontWeight="700" fill={hi ? MC_GOLD_D : MC_OLIVE} textAnchor="middle">{real[i]}</text>
            <text x={cx} y={H - 8} fontSize="10.5" fontFamily="var(--ff-ui)" fontWeight="600" fill="var(--mc-text-2)" textAnchor="middle">{lt}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Tarjeta resumen con gradiente (campo / gastos) ---------- */
function SummaryCard({ tone, eyebrow, value, sub, badge, icon, onVer, spark }: {
  tone: "field" | "gold"; eyebrow: string; value: string; sub: string; badge?: string; icon: string; onVer?: () => void; spark?: number[];
}) {
  const isGold = tone === "gold";
  const bg = isGold ? "linear-gradient(135deg, #e9b94a 0%, #d9a538 100%)" : "var(--mc-field-grad)";
  const fg = isGold ? "#3a2a06" : "#fff";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -3 }}
      style={{ position: "relative", borderRadius: "var(--r-lg)", padding: "20px 22px", background: bg, color: fg, overflow: "hidden", minHeight: 124, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "var(--sh-md)" }}
    >
      <div style={{ position: "absolute", right: -20, top: -20, opacity: 0.16 }}><Icon name={icon} size={120} /></div>
      {spark && spark.some((v) => v > 0) && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, opacity: 0.5 }}>
          <Sparkline data={spark} color={isGold ? "#3a2a06" : "#ffffff"} width={520} height={46} />
        </div>
      )}
      <div className="row" style={{ justifyContent: "space-between", position: "relative" }}>
        <div className="row gap-8" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.02em" }}><Icon name={icon} size={16} />{eyebrow}</div>
        {badge && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: isGold ? "rgba(58,42,6,0.16)" : "rgba(255,255,255,0.18)" }}>{badge}</span>}
      </div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", position: "relative" }}>
        <div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 40, lineHeight: 1, letterSpacing: "-0.02em" }}><AnimatedNumber value={value} /></div>
          <div style={{ fontSize: 12, opacity: 0.82, marginTop: 4 }}>{sub}</div>
        </div>
        <button onClick={onVer} className="mc-icon-btn mc-icon-btn--circle" style={{ width: 38, height: 38, background: isGold ? "#3a2a06" : "rgba(255,255,255,0.16)", border: isGold ? "none" : "1px solid rgba(255,255,255,0.3)", color: isGold ? "#e9b94a" : "#fff" }}>
          <Icon name="arrowRight" size={17} />
        </button>
      </div>
    </motion.div>
  );
}

/* ---------- Clima de hoy + pronóstico 7 días + agenda semanal ---------- */
function ClimaSemana({ onVerAgenda, clima }: { onVerAgenda: () => void; clima: ClimaData | null }) {
  const a = clima?.actual ?? null;
  // 7 días: más no entra en el ancho de la card.
  const days = (clima?.dias ?? []).slice(0, 7).map((d) => ({ name: d.nombre, num: d.num, isToday: d.esHoy, ic: d.icono, cond: (d as { cond?: string }).cond, max: d.max, min: d.min, mm: d.mm, wind: `${d.viento} km/h` }));
  const hoyFecha = new Date().toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  const events: { titulo: string; inicio: number; dur: number; color: string; icon: string }[] = [];
  const rows: (typeof events)[] = [];
  const allTemps = days.flatMap((d) => [d.max, d.min]);
  const tempLow = allTemps.length ? Math.min(...allTemps) - 2 : 8;
  const tempHigh = allTemps.length ? Math.max(...allTemps) + 2 : 32;
  const tY = (t: number) => 34 * (1 - (t - tempLow) / (tempHigh - tempLow || 1)) + 38;

  const InfoCell = ({ icon, big, sub, highlight }: { icon: string; big: React.ReactNode; sub: string; highlight?: boolean }) => (
    <div style={{ padding: "12px 14px", borderRight: "1px solid rgba(255,255,255,0.12)", background: highlight ? "rgba(255,255,255,0.10)" : "transparent", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.20)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={icon} size={15} /></div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{big}</div>
        <div style={{ fontSize: 10.5, opacity: 0.78, marginTop: 3, whiteSpace: "nowrap" }}>{sub}</div>
      </div>
    </div>
  );

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <WeatherScene cond={(a as { cond?: string } | null)?.cond || a?.icono} windy={(a?.viento ?? 0) >= 25} style={{ color: "white", padding: "18px 22px 20px" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <Icon name="calendar" size={13} />
            <span style={{ fontSize: 10.5, opacity: 0.82, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{hoyFecha}</span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.9, padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)" }}>{a?.descripcion ?? "Cargando…"}</div>
        </div>
        <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingRight: 18, borderRight: "1px solid rgba(255,255,255,0.22)" }}>
            <span style={{ width: 66, height: 66, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "grid", placeItems: "center", boxShadow: "0 6px 16px rgba(0,0,0,0.22)", flexShrink: 0 }}>
              <AnimatedWeatherIcon cond={(a as { cond?: string } | null)?.cond || a?.icono || "cloud"} size={48} />
            </span>
            <div className="col" style={{ gap: 0 }}>
              <span style={{ fontFamily: "var(--ff-display)", fontSize: 56, lineHeight: 0.92, fontWeight: 600 }}>{a ? `${a.temperatura}°` : "—"}</span>
              <span style={{ fontSize: 11, opacity: 0.78, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600, marginTop: 2 }}>Ahora</span>
            </div>
          </div>
          <div className="mc-wx-info" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12, overflow: "hidden" }}>
            <InfoCell icon="thermometer" big={<span><span style={{ color: "#ffd28a" }}>{days[0]?.max ?? "—"}°</span><span style={{ opacity: 0.62, margin: "0 6px", fontSize: 13, fontFamily: "var(--ff-mono)", fontWeight: 500 }}>°C</span><span style={{ color: "#9ad8ff" }}>{days[0]?.min ?? "—"}°</span></span>} sub={a ? `Sens. ${a.sensacion}°` : ""} />
            <InfoCell icon="droplet" big={a ? `${a.humedad}%` : "—"} sub={a ? `Rocío ${a.rocio}°` : ""} />
            <InfoCell icon="wind" big={a ? `${a.viento} km/h` : "—"} sub={a ? `${a.vientoDir} · Ráf. ${a.rafaga}` : ""} />
            <InfoCell icon="activity" big={a ? `ΔT ${a.deltaT}` : "—"} sub={a ? (a.aptoPulverizacion ? "Apto pulver." : "Fuera de rango") : ""} highlight />
          </div>
        </div>
      </WeatherScene>

      <div style={{ position: "relative", borderBottom: "1px solid var(--mc-line)", background: "var(--mc-surface)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {days.map((d, i) => {
            const tone = weatherTone(d.ic);
            return (
            <div key={i} style={{ padding: "10px 4px", textAlign: "center", borderRight: i < 6 ? "1px solid var(--mc-line)" : "none", background: d.isToday ? "var(--mc-green-50)" : `linear-gradient(180deg, ${tone.soft} 0%, transparent 44%)`, minHeight: 168 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: d.isToday ? "var(--mc-green-700)" : "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.name}</div>
              <div style={{ fontSize: 10, color: d.isToday ? "var(--mc-green-700)" : "var(--mc-text-2)", fontWeight: 600, marginTop: 1 }}>{d.num}</div>
              <div style={{ marginTop: 4, display: "flex", justifyContent: "center" }}>
                <AnimatedWeatherIcon cond={d.cond || d.ic} size={42} />
              </div>
              <div style={{ height: 80 }} />
              {d.mm > 0 ? <div style={{ fontSize: 11, color: "var(--mc-blue)", fontWeight: 700, fontFamily: "var(--ff-mono)" }}>{d.mm}mm</div> : <div style={{ height: 17 }} />}
              <div style={{ fontSize: 9, color: "var(--mc-text-3)", marginTop: 2, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 2px" }}>{d.wind}</div>
            </div>
            );
          })}
        </div>
        <svg style={{ position: "absolute", top: 80, left: 0, width: "100%", height: 80, pointerEvents: "none" }} viewBox="0 0 700 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cl-max" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c08a22" stopOpacity="0.16" /><stop offset="100%" stopColor="#c08a22" stopOpacity="0" /></linearGradient>
            <linearGradient id="cl-min" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a93b8" stopOpacity="0.12" /><stop offset="100%" stopColor="#3a93b8" stopOpacity="0" /></linearGradient>
          </defs>
          <polygon points={`50,80 ${days.map((d, i) => `${i * 100 + 50},${tY(d.max)}`).join(" ")} 650,80`} fill="url(#cl-max)" />
          <polygon points={`50,80 ${days.map((d, i) => `${i * 100 + 50},${tY(d.min)}`).join(" ")} 650,80`} fill="url(#cl-min)" />
          <polyline fill="none" stroke="#c08a22" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" points={days.map((d, i) => `${i * 100 + 50},${tY(d.max)}`).join(" ")} />
          <polyline fill="none" stroke="#3a93b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" points={days.map((d, i) => `${i * 100 + 50},${tY(d.min)}`).join(" ")} />
          {days.map((d, i) => { const x = i * 100 + 50; return (<g key={i}><circle cx={x} cy={tY(d.max)} r="3" fill="#c08a22" stroke="white" strokeWidth="1.2" /><circle cx={x} cy={tY(d.min)} r="2.8" fill="#3a93b8" stroke="white" strokeWidth="1.1" /></g>); })}
        </svg>
        <div style={{ position: "absolute", top: 80, left: 0, width: "100%", height: 80, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", pointerEvents: "none" }}>
          {days.map((d, i) => (
            <div key={i} style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: `${tY(d.max) - 16}px`, fontFamily: "var(--ff-mono)", fontSize: 12, fontWeight: 800, color: "var(--mc-ink)", whiteSpace: "nowrap" }}>{d.max}°</span>
              <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: `${tY(d.min) + 6}px`, fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 700, color: "var(--mc-text-2)", whiteSpace: "nowrap" }}>{d.min}°</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "10px 14px 14px" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Agenda de la semana</div>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "2px 8px", fontSize: 11 }} onClick={onVerAgenda}>Ver calendario <Icon name="chevRight" size={11} /></button>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", pointerEvents: "none", zIndex: 0 }}>
            {days.map((d, i) => <div key={i} style={{ borderRight: i < 6 ? "1px dashed rgba(0,0,0,0.06)" : "none", background: "transparent" }} />)}
          </div>
          <div style={{ position: "relative", zIndex: 1, minHeight: 26 }}>
            {rows.length === 0 && <div style={{ fontSize: 11, color: "var(--mc-text-3)", padding: "5px 2px" }}>Sin eventos esta semana.</div>}
            {rows.map((row, ri) => (
              <div key={ri} style={{ position: "relative", height: 26, marginBottom: ri < rows.length - 1 ? 5 : 0 }}>
                {row.map((e, ei) => {
                  const isMulti = e.dur > 1;
                  const leftPct = isMulti ? ((e.inicio + 0.5) / 7) * 100 : (e.inicio / 7) * 100;
                  const widthPct = isMulti ? ((e.dur - 1) / 7) * 100 : (1 / 7) * 100;
                  return (
                    <div key={ei} style={{ position: "absolute", left: `calc(${leftPct}% + ${isMulti ? 0 : 4}px)`, width: `calc(${widthPct}% - ${isMulti ? 0 : 8}px)`, top: 0, bottom: 0, background: e.color, borderRadius: 999, display: "flex", alignItems: "center", gap: 6, padding: "0 11px", fontSize: 11, color: "white", fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", cursor: "pointer", boxShadow: `0 1px 4px ${e.color}55, inset 0 1px 0 rgba(255,255,255,0.18)` }}>
                      <Icon name={e.icon} size={10} /><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{e.titulo}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Salud de los lotes (dona) — real (alertas sanitarias) ---------- */
function FieldHealth() {
  const [conCultivo, setConCultivo] = useState(0);
  const [conAlerta, setConAlerta] = useState(0);
  useEffect(() => {
    Promise.all([
      fetch("/api/lotes").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/deteccion-enfermedades").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([lotes, alertas]) => {
      const cc = Array.isArray(lotes) ? lotes.filter((l: { cultivo?: string }) => l.cultivo).length : 0;
      const lotesAlerta = new Set(Array.isArray(alertas) ? alertas.filter((a: { estado?: string }) => a.estado !== "Resuelta").map((a: { loteId: string }) => a.loteId) : []);
      setConCultivo(cc);
      setConAlerta(lotesAlerta.size);
    });
  }, []);
  const sanos = Math.max(0, conCultivo - conAlerta);
  const vacio = conCultivo === 0;
  const pct = conCultivo > 0 ? Math.round((sanos / conCultivo) * 100) : 0;
  return (
    <div className="mc-card">
      <div className="mc-card__head"><div><div className="mc-card__eyebrow">Sanidad de los cultivos</div><div className="mc-card__title mt-4">Salud de los lotes</div></div><span className={`mc-badge ${vacio ? "mc-badge--neutral" : conAlerta > 0 ? "mc-badge--amber" : "mc-badge--green"}`}>{vacio ? "Sin datos" : conAlerta > 0 ? `${conAlerta} en alerta` : "Sin alertas"}</span></div>
      <div className="row" style={{ gap: 18, alignItems: "center" }}>
        <Donut segments={vacio ? [{ value: 1, color: "var(--mc-surface-3)" }] : [{ value: sanos, color: "#5e7733" }, { value: conAlerta, color: "#c93434" }].filter((s) => s.value > 0)} size={140} thickness={15} rounded={!vacio}>
          <span style={{ fontFamily: "var(--ff-display)", fontSize: 36, color: vacio ? "var(--mc-text-3)" : "var(--mc-ink)", lineHeight: 1 }}>{vacio ? "—" : `${pct}%`}</span>
          <span style={{ fontSize: 11, color: "var(--mc-text-3)", fontWeight: 600 }}>{vacio ? "Sin cultivos" : "saludables"}</span>
        </Donut>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
            <div className="row gap-8"><span style={{ width: 9, height: 9, borderRadius: "50%", background: "#5e7733" }} /><span style={{ color: "var(--mc-text-2)" }}>Saludables</span></div>
            <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{sanos}</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
            <div className="row gap-8"><span style={{ width: 9, height: 9, borderRadius: "50%", background: "#c93434" }} /><span style={{ color: "var(--mc-text-2)" }}>En alerta</span></div>
            <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{conAlerta}</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
            <div className="row gap-8"><span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--mc-surface-3)" }} /><span style={{ color: "var(--mc-text-2)" }}>Lotes con cultivo</span></div>
            <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{conCultivo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Salud del suelo (NPK + materia orgánica) — real ---------- */
function SoilHealth() {
  const [prom, setProm] = useState<{ n: number | null; p: number | null; k: number | null; mo: number | null } | null>(null);
  useEffect(() => {
    fetch("/api/analisis-suelo").then((r) => (r.ok ? r.json() : [])).then((d) => {
      if (!Array.isArray(d) || d.length === 0) { setProm(null); return; }
      const avg = (key: string) => {
        const vals = d.map((a: Record<string, number>) => a[key]).filter((v) => v != null);
        return vals.length ? Math.round((vals.reduce((s: number, v: number) => s + v, 0) / vals.length) * 10) / 10 : null;
      };
      setProm({ n: avg("nitrogeno"), p: avg("fosforo"), k: avg("potasio"), mo: avg("materiaOrganica") });
    }).catch(() => setProm(null));
  }, []);
  const cell = (label: string, v: number | null) => (
    <div className="mc-nutri" style={{ flex: 1, justifyContent: "center", background: v != null ? "var(--mc-green-50)" : "var(--mc-surface-3)", color: v != null ? "var(--mc-green-700)" : "var(--mc-text-3)" }}>{label} · {v ?? "—"}</div>
  );
  const moPct = prom?.mo != null ? Math.min(100, Math.round((prom.mo / 5) * 100)) : 0;
  return (
    <div className="mc-card">
      <div className="mc-card__head"><div><div className="mc-card__eyebrow">Promedio de tus análisis</div><div className="mc-card__title mt-4">Salud del suelo</div></div></div>
      <div className="row" style={{ gap: 8, marginBottom: 14 }}>
        {cell("N", prom?.n ?? null)}{cell("P", prom?.p ?? null)}{cell("K", prom?.k ?? null)}
      </div>
      <div className="row" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: "var(--mc-text-2)" }}>Materia orgánica</span>
        <span style={{ fontWeight: 600, color: prom?.mo != null ? "var(--mc-ink)" : "var(--mc-text-3)", fontFamily: "var(--ff-mono)" }}>{prom?.mo != null ? `${prom.mo}%` : "—"}</span>
      </div>
      <div className="mc-prog"><div className="mc-prog__bar" style={{ width: `${moPct}%` }} /></div>
      {!prom && <div className="text-xs text-muted mt-8">Sin análisis de suelo cargado. Cargalos en Cultivos → Análisis de Suelo.</div>}
    </div>
  );
}

/* ---------- Distribución de cultivos (dona) ---------- */
function CropDistribution({ cultivos }: { cultivos: { label: string; ha: string; pct: number; color: string }[] }) {
  const total = cultivos.reduce((s, c) => s + (parseFloat(c.ha) || 0), 0);
  const vacio = cultivos.length === 0;
  return (
    <div className="mc-card">
      <div className="mc-card__head"><div><div className="mc-card__eyebrow">Por superficie</div><div className="mc-card__title mt-4">Distribución de cultivos</div></div></div>
      <div className="row" style={{ gap: 20, alignItems: "center" }}>
        <Donut segments={vacio ? [{ value: 1, color: "var(--mc-surface-3)" }] : cultivos.map((c) => ({ value: c.pct, color: c.color }))} size={158} thickness={28} gap={2.5} rounded={!vacio}>
          <span style={{ fontFamily: "var(--ff-display)", fontSize: 30, color: vacio ? "var(--mc-text-3)" : "var(--mc-ink)", lineHeight: 1 }}>{Math.round(total) || 0}</span>
          <span style={{ fontSize: 10.5, color: "var(--mc-text-3)" }}>Ha totales</span>
        </Donut>
        <div style={{ flex: 1 }}>
          {vacio && <div className="text-sm text-muted" style={{ padding: "8px 0" }}>Cargá tus lotes y cultivos para ver la distribución.</div>}
          {cultivos.map((c) => (
            <div key={c.label} className="row" style={{ justifyContent: "space-between", padding: "5px 0", borderBottom: "1px dashed var(--mc-line)", fontSize: 13 }}>
              <div className="row gap-8"><span style={{ width: 9, height: 9, borderRadius: "50%", background: c.color }} /><span style={{ color: "var(--mc-ink)", fontWeight: 500 }}>{c.label}</span></div>
              <div className="row gap-16"><span style={{ color: "var(--mc-text-3)", fontFamily: "var(--ff-mono)", fontSize: 12 }}>{c.ha}</span><span style={{ fontWeight: 600, color: "var(--mc-ink)", width: 32, textAlign: "right" }}>{c.pct}%</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Últimas actividades ---------- */
function Actividades({ onVerTodo }: { onVerTodo: () => void }) {
  return (
    <div className="mc-card">
      <div className="mc-card__head"><div className="mc-card__title">Últimas actividades</div><button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVerTodo}>Ver todo <Icon name="chevRight" size={13} /></button></div>
      <div className="mc-empty">
        <div className="mc-empty__icon"><Icon name="timeline" size={22} /></div>
        Todavía no hay actividad registrada.
      </div>
    </div>
  );
}

/* ---------- Alertas activas ---------- */
function Alertas() {
  return (
    <div className="mc-card">
      <div className="mc-card__head"><div className="mc-card__title">Alertas activas</div><span className="mc-badge mc-badge--neutral"><span className="mc-badge__dot" />0 activas</span></div>
      <div className="mc-empty">
        <div className="mc-empty__icon"><Icon name="shieldCheck" size={22} /></div>
        Sin alertas activas.
      </div>
    </div>
  );
}

const QUICK_ACTS: { icon: string; label: string; href?: string; action?: "labor" }[] = [
  { icon: "droplet", label: "Cargar lluvia", href: "/clima?modal=lluvia" },
  { icon: "scale", label: "Pesada", href: "/animales?tab=Peso" },
  { icon: "flask", label: "Calcular dosis", href: "/calculadora-dosis?tab=Nuevo Cálculo" },
  { icon: "syringe", label: "Sanidad", href: "/animales?tab=Sanidad" },
  { icon: "sprout", label: "Nueva siembra", href: "/campo-digital?tab=Cultivos&modal=siembra" },
  { icon: "truck", label: "Mov. tropa", href: "/mov-tropas?modal=nuevo" },
  { icon: "wrench", label: "Nueva labor", action: "labor" },
  { icon: "map", label: "Nuevo lote", href: "/campo-digital?tab=Lotes&modal=nuevo" },
  { icon: "cow", label: "Nuevo animal", href: "/animales?modal=nuevo" },
  { icon: "dollar", label: "Registrar gasto", href: "/finanzas" },
  { icon: "upload", label: "Reportar plaga", href: "/campo-digital?tab=Detección de Enfermedades (IA)&modal=reportar" },
  { icon: "book", label: "Análisis suelo", href: "/campo-digital?tab=Cultivos&sub=Análisis de Suelo" },
];

function BriefDia({ brief, cargando, onIr }: { brief: BriefData | null; cargando: boolean; onIr: (ruta: string) => void }) {
  return (
    <div className="mc-card" style={{ overflow: "hidden", padding: 0 }}>
      <div className="mc-card__head" style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--mc-line)" }}>
        <div>
          <div className="mc-card__eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: "#5e7733", color: "#fff", display: "grid", placeItems: "center" }}>
              <Icon name="sparkles" size={11} />
            </span>
            Brief del día{brief?.generadoPorIA ? " · IA" : ""}
          </div>
          <div className="mc-card__title mt-4">Tu día en MiCampo</div>
        </div>
        {brief && <span className="mc-badge mc-badge--neutral"><span className="mc-badge__dot" />{brief.items.length} prioridad(es)</span>}
      </div>

      <div style={{ padding: "12px 20px 16px" }}>
        {cargando ? (
          <div className="text-sm text-muted" style={{ padding: "8px 0" }}>Analizando tu establecimiento…</div>
        ) : !brief || brief.items.length === 0 ? (
          <div className="row" style={{ gap: 10, alignItems: "center", padding: "8px 0" }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: "#eef1e6", color: "#5e7733", display: "grid", placeItems: "center" }}>
              <Icon name="check" size={16} />
            </span>
            <div className="text-sm" style={{ color: "var(--mc-text-2)" }}>
              {brief?.resumen || "Todo en orden: sin prioridades urgentes para hoy."}
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm" style={{ color: "var(--mc-text-2)", marginBottom: 12 }}>{brief.resumen}</div>
            <div className="col" style={{ gap: 8 }}>
              {brief.items.map((it, i) => (
                <button
                  key={i}
                  onClick={() => onIr(it.ruta)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 12px", width: "100%", textAlign: "left",
                    border: "1px solid var(--mc-line)", borderLeft: `3px solid ${SEV_COLOR[it.severidad] || "#5e7733"}`,
                    borderRadius: 10, background: "var(--mc-surface)", cursor: "pointer",
                  }}
                >
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: (SEV_COLOR[it.severidad] || "#5e7733") + "1a", color: SEV_COLOR[it.severidad] || "#5e7733", display: "grid", placeItems: "center" }}>
                    <Icon name={it.icono} size={15} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13.5 }}>{it.titulo}</span>
                      {it.impacto && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: "#fbeaea", color: "#c93434" }}>{it.impacto}</span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: "var(--mc-text-2)", marginTop: 2 }}>{it.detalle}</div>
                    <div className="text-xs" style={{ color: "#5e7733", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                      <Icon name="arrowRight" size={11} />{it.accion}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function InicioPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();

  const [kpiValues, setKpiValues] = useState<Record<string, Partial<KpiCfg>>>({});
  const [laborModal, setLaborModal] = useState(false);
  const [capturaOpen, setCapturaOpen] = useState(false);
  const [lotes, setLotes] = useState<{ id: string; nombre: string }[]>([]);
  const [laborForm, setLaborForm] = useState({ tipo: "Pulverización", loteId: "", fecha: new Date().toISOString().slice(0, 10) });
  const [balance, setBalance] = useState<{ meses: string[]; ingresos: number[]; gastos: number[] } | null>(null);
  const [cultivos, setCultivos] = useState<{ label: string; ha: string; pct: number; color: string }[] | null>(null);
  const [clima, setClima] = useState<ClimaData | null>(null);
  const { lotes: scopeLotes, establecimientoActivo } = useLoteScope();
  const [laboresPend, setLaboresPend] = useState(0);
  const [laboresAtr, setLaboresAtr] = useState(0);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [briefCargando, setBriefCargando] = useState(true);

  useEffect(() => {
    fetch("/api/brief")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBrief(d))
      .catch(() => {})
      .finally(() => setBriefCargando(false));
  }, []);

  // Hectáreas, cultivos y lotes del modal — derivados del alcance global (campo/lote)
  useEffect(() => {
    if (scopeLotes.length === 0) return;
    const totalHa = scopeLotes.reduce((s, l) => s + (l.hectareas || 0), 0);
    setKpiValues((p) => ({ ...p, hectareas: { value: `${Math.round(totalHa).toLocaleString("es-AR")} Ha`, delta: `${scopeLotes.length} ${scopeLotes.length === 1 ? "lote" : "lotes"}` } }));
    setLotes(scopeLotes.map((l) => ({ id: l.id, nombre: l.nombre })));
    const colores: Record<string, string> = { Trigo: "#d9a538", Maíz: "#c08a22", Soja: "#8ea65a", Cebada: "#5e7733", Alfalfa: "#aabd76", Girasol: "#e8b94a", Sorgo: "#c08a22" };
    const porCultivo = new Map<string, number>();
    scopeLotes.forEach((l) => { if (l.cultivo) porCultivo.set(l.cultivo, (porCultivo.get(l.cultivo) || 0) + (l.hectareas || 0)); });
    if (porCultivo.size > 0) {
      const tot = Array.from(porCultivo.values()).reduce((s, v) => s + v, 0) || 1;
      setCultivos(Array.from(porCultivo.entries()).sort((a, b) => b[1] - a[1]).map(([nombre, ha]) => ({ label: nombre, ha: `${Math.round(ha)} Ha`, pct: Math.round((ha / tot) * 100), color: colores[nombre] || "#7d8a76" })));
    } else {
      setCultivos([]);
    }
  }, [scopeLotes]);

  useEffect(() => {
    fetch("/api/dashboard/inicio").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d?.metricas) return;
      const v: Record<string, Partial<KpiCfg>> = {};
      const ing = d.metricas.ingresosMesActual ?? 0;
      const bal = d.metricas.balanceMesActual ?? 0;
      v.ingresosMes = {
        value: `$${Math.round(ing).toLocaleString("es-AR")}`,
        delta: ing > 0 ? `Balance $${Math.round(bal).toLocaleString("es-AR")}` : "Sin ingresos este mes",
        trend: bal >= 0 ? "up" : "down",
      };
      setKpiValues((p) => ({ ...p, ...v }));
    }).catch(() => {});

    fetch("/api/animales").then((r) => (r.ok ? r.json() : [])).then((d) => {
      if (Array.isArray(d) && d.length > 0) setKpiValues((p) => ({ ...p, cabezas: { value: d.length.toLocaleString("es-AR"), delta: "rodeo registrado" } }));
    }).catch(() => {});

    fetch("/api/labores").then((r) => (r.ok ? r.json() : [])).then((d) => {
      if (!Array.isArray(d) || d.length === 0) return;
      const pend = d.filter((l: { estado?: string }) => l.estado && l.estado !== "Completada").length;
      const atr = d.filter((l: { estado?: string }) => l.estado === "Atrasada").length;
      setLaboresPend(pend);
      setLaboresAtr(atr);
      if (pend > 0) setKpiValues((p) => ({ ...p, labores: { value: String(pend), delta: `${atr} atrasadas` } }));
    }).catch(() => {});

    fetch("/api/transacciones").then((r) => (r.ok ? r.json() : [])).then((d) => {
      if (!Array.isArray(d) || d.length === 0) return;
      const now = new Date(); const meses: string[] = [], ingresos: number[] = [], gastos: number[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        meses.push(m.toLocaleString("es", { month: "short" }).replace(".", ""));
        const enMes = d.filter((t: { fecha: string }) => { const f = new Date(t.fecha); return f.getFullYear() === m.getFullYear() && f.getMonth() === m.getMonth(); });
        ingresos.push(enMes.filter((t: { tipo: string }) => t.tipo === "ingreso").reduce((s: number, t: { monto: number | string }) => s + Number(t.monto), 0) / 1e6);
        gastos.push(enMes.filter((t: { tipo: string }) => t.tipo !== "ingreso").reduce((s: number, t: { monto: number | string }) => s + Number(t.monto), 0) / 1e6);
      }
      if (ingresos.some((v) => v > 0) || gastos.some((v) => v > 0)) setBalance({ meses, ingresos, gastos });
    }).catch(() => {});
  }, []);

  // Ubicación del clima: el ESTABLECIMIENTO activo del sidebar (centro propio, o el
  // promedio de los centroides de sus lotes si no tiene centro guardado). El clima
  // del inicio es por establecimiento, no por lote.
  const climaLoc = useMemo(() => {
    if (establecimientoActivo?.centroLatitud != null && establecimientoActivo?.centroLongitud != null)
      return { lat: establecimientoActivo.centroLatitud, lon: establecimientoActivo.centroLongitud };
    const conGeo = scopeLotes.filter((l) => l.centroLatitud != null && l.centroLongitud != null);
    if (conGeo.length) {
      const lat = conGeo.reduce((s, l) => s + (l.centroLatitud as number), 0) / conGeo.length;
      const lon = conGeo.reduce((s, l) => s + (l.centroLongitud as number), 0) / conGeo.length;
      return { lat, lon };
    }
    return null;
  }, [establecimientoActivo, scopeLotes]);

  useEffect(() => {
    const q = climaLoc ? `?lat=${climaLoc.lat}&lon=${climaLoc.lon}` : "";
    fetch(`/api/clima${q}`).then((r) => (r.ok ? r.json() : null)).then((c) => { if (c?.actual) setClima(c); }).catch(() => {});
  }, [climaLoc?.lat, climaLoc?.lon]);

  const kpis = useMemo(() => KPIS_BASE.map((k) => ({ ...k, ...(kpiValues[k.key] || {}) })), [kpiValues]);

  const cultivosData = cultivos && cultivos.length ? cultivos : [];
  const bal = balance || { meses: ["Nov", "Dic", "Ene", "Feb", "Mar", "Abr"], ingresos: [0, 0, 0, 0, 0, 0], gastos: [0, 0, 0, 0, 0, 0] };
  const ingTot = bal.ingresos[bal.ingresos.length - 1] || 0;
  const gasTot = bal.gastos[bal.gastos.length - 1] || 0;

  const nombre = session?.user?.name?.split(" ")[0] || "productor";
  const hoy = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  // Resumen del día, conectado a datos reales (labores + clima)
  const subtitulo = (() => {
    const partes: string[] = [`Hoy es ${hoy}`];
    if (laboresPend > 0) {
      partes.push(`tenés ${laboresPend} ${laboresPend === 1 ? "labor programada" : "labores programadas"}${laboresAtr > 0 ? `, ${laboresAtr} atrasada${laboresAtr > 1 ? "s" : ""}` : ""}`);
    } else {
      partes.push("no tenés labores pendientes");
    }
    const manana = clima?.dias?.[1];
    if (manana && (manana.mm >= 1 || manana.probLluvia >= 50)) {
      partes.push(`lluvia prevista mañana (${manana.probLluvia}%)`);
    }
    // Une con comas y la última con "y"
    if (partes.length === 1) return partes[0] + ".";
    if (partes.length === 2) return `${partes[0]}. ${capitalizar(partes[1])}.`;
    return `${partes[0]}. ${capitalizar(partes[1])} y ${partes[2]}.`;
  })();

  const crearLabor = async () => {
    if (!laborForm.loteId && lotes.length === 0) { toast.show("Creá un lote primero en Campo Digital", "err"); return; }
    try {
      const res = await fetch("/api/labores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: laborForm.tipo, fecha: laborForm.fecha, loteId: laborForm.loteId || lotes[0]?.id, descripcion: laborForm.tipo, superficieTrabajada: 0 }) });
      if (!res.ok) throw new Error();
      toast.show("Labor creada correctamente"); setLaborModal(false);
    } catch { toast.show("No se pudo crear la labor", "err"); }
  };

  const descargarReporte = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("MiCampo — Reporte Semanal", 14, 20);
    doc.setFontSize(11); doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 28);
    let y = 42; doc.setFontSize(13); doc.text("Indicadores principales", 14, y); y += 8; doc.setFontSize(10);
    kpis.forEach((k) => { doc.text(`- ${k.label}: ${k.value} (${k.delta})`, 16, y); y += 6; });
    doc.save("micampo-reporte-semanal.pdf");
    toast.show("Reporte semanal descargado");
  };

  return (
    <div className="col gap-20">
      {toast.node}

      {/* Topbar — búsqueda + acciones */}
      <div className="row" style={{ gap: 12 }}>
        <div className="mc-topsearch" style={{ maxWidth: 460, cursor: "pointer" }} onClick={() => router.push("/campo-digital")}>
          <Icon name="search" size={16} />
          <input placeholder="Buscar lotes, animales, labores, reportes…" />
        </div>
        <div className="row" style={{ marginLeft: "auto", gap: 8 }}>
          <button className="mc-icon-btn" title="Decisiones del día" onClick={() => router.push("/decisiones")}><Icon name="bell" size={16} /></button>
          <button className="mc-btn mc-btn--secondary" onClick={descargarReporte}><Icon name="download" size={15} />Reporte semanal</button>
          <button className="mc-btn mc-btn--secondary" onClick={() => setCapturaOpen(true)}><Icon name="camera" size={15} />Cargar por voz</button>
          <button className="mc-btn mc-btn--primary" onClick={() => setLaborModal(true)}><Icon name="plus" size={15} />Nueva labor</button>
        </div>
      </div>

      {/* Encabezado de página */}
      <div className="mc-topbar">
        <div>
          <div className="mc-crumbs"><span>MiCampo</span><span className="sep">/</span><strong>Inicio</strong></div>
          <h1 className="mc-title">Buen día, {nombre}.</h1>
          <div className="mc-subtitle">{subtitulo}</div>
        </div>
        <span className="mc-badge mc-badge--green" style={{ padding: "6px 12px" }}><span className="mc-badge__dot" />Campaña 2025/26 en curso</span>
      </div>

      {/* Brief del día — prioridades proactivas */}
      <BriefDia brief={brief} cargando={briefCargando} onIr={(ruta) => router.push(ruta)} />

      {/* KPIs */}
      <div className="grid g-cols-5">
        {kpis.map((k, i) => {
          const cls = k.tone === "accent" ? "mc-kpi mc-kpi--accent" : k.tone === "warn" ? "mc-kpi mc-kpi--warn" : "mc-kpi";
          const tcls = k.trend === "down" ? "mc-kpi__delta--down" : k.trend === "warn" ? "mc-kpi__delta--warn" : "mc-kpi__delta--up";
          const tIcon = k.trend === "down" ? "arrowDown" : k.trend === "warn" ? "alert" : "arrowUp";
          return (
            <motion.div
              className={cls}
              key={k.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={{ y: -2 }}
            >
              <span className="mc-kpi__glyph"><Icon name={k.icon} size={14} /></span>
              <div className="mc-kpi__label">{k.label}</div>
              <div className="mc-kpi__value"><AnimatedNumber value={k.value} /></div>
              <div className={`mc-kpi__delta ${k.delta === "—" ? "" : tcls}`}>{k.delta === "—" ? null : <Icon name={tIcon} size={12} />}{k.delta}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid g-cols-2">
        <SummaryCard
          tone="field"
          icon="leaf"
          eyebrow="Estado general de campos"
          value={scopeLotes.length === 0 ? "Sin datos" : `${scopeLotes.length} ${scopeLotes.length === 1 ? "lote" : "lotes"}`}
          sub={scopeLotes.length === 0 ? "Cargá tus lotes en Campo Digital" : `${Math.round(scopeLotes.reduce((s, l) => s + (l.hectareas || 0), 0)).toLocaleString("es-AR")} ha · ${scopeLotes.filter((l) => l.cultivo).length} con cultivo`}
          onVer={() => router.push("/campo-digital?tab=Lotes")}
        />
        <SummaryCard tone="gold" icon="dollar" eyebrow="Gastos del mes" value={`$${gasTot.toFixed(1)}M`} sub={`Margen bruto est. $${Math.max(0, ingTot - gasTot).toFixed(1)}M`} spark={bal.gastos} onVer={() => router.push("/finanzas")} />
      </div>

      {/* Clima + agenda | Salud lotes + suelo */}
      <div className="grid mc-2col-resp" style={{ gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)", gap: 14 }}>
        <ClimaSemana onVerAgenda={() => router.push("/calendario")} clima={clima} />
        <div className="col gap-16"><FieldHealth /><SoilHealth /></div>
      </div>

      {/* Balance mensual */}
      <div className="mc-card">
        <div className="mc-card__head"><div><div className="mc-card__eyebrow">Últimos 6 meses</div><div className="mc-card__title mt-4">Balance mensual</div></div><button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => router.push("/finanzas")}>Ver finanzas</button></div>
        <div className="row gap-10" style={{ marginBottom: 12 }}>
          <div style={{ flex: 1, padding: "8px 12px", borderRadius: 10, background: "var(--mc-green-50)", border: "1px solid var(--mc-green-200)" }}>
            <div className="row gap-4" style={{ fontSize: 10, color: "var(--mc-green-700)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5e7733" }} />Ingresos</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-green-700)", marginTop: 2 }}>${ingTot.toFixed(1)}M</div>
          </div>
          <div style={{ flex: 1, padding: "8px 12px", borderRadius: 10, background: "var(--mc-gold-50)", border: "1px solid var(--mc-gold-100)" }}>
            <div className="row gap-4" style={{ fontSize: 10, color: "var(--mc-gold-700)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d9a538" }} />Gastos</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-gold-700)", marginTop: 2 }}>${gasTot.toFixed(1)}M</div>
          </div>
        </div>
        <BalanceArea meses={bal.meses} ingresos={bal.ingresos} gastos={bal.gastos} />
      </div>

      {/* Rinde | Distribución */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="mc-card">
          <div className="mc-card__head">
            <div><div className="mc-card__eyebrow">Campaña 25/26 · t/Ha</div><div className="mc-card__title mt-4">Rinde por lote</div></div>
          </div>
          <div className="mc-empty">
            <div className="mc-empty__icon"><Icon name="chart" size={22} /></div>
            Sin datos de rinde todavía. Se completará al registrar cosechas.
          </div>
        </div>
        <CropDistribution cultivos={cultivosData} />
      </div>

      {/* Benchmark anónimo */}
      <BenchmarkCard />

      {/* Actividades | Alertas */}
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 1fr", gap: 14 }}>
        <Actividades onVerTodo={() => router.push("/campo-digital?tab=Labores")} />
        <Alertas />
      </div>

      {/* Acciones rápidas */}
      <div className="mc-card">
        <div className="mc-card__head"><div className="mc-card__title">Acciones rápidas</div></div>
        <div className="grid g-cols-6 gap-8" style={{ rowGap: 10 }}>
          {QUICK_ACTS.map((a, i) => (
            <button key={i} className="mc-card mc-quick" onClick={() => { if (a.action === "labor") setLaborModal(true); else if (a.href) router.push(a.href); }}>
              <div className="mc-quick__ic"><Icon name={a.icon} size={15} /></div>
              <div className="mc-quick__label">{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Captura rápida por voz / lenguaje natural */}
      <CapturaRapida open={capturaOpen} onClose={() => setCapturaOpen(false)} />

      {/* Modal Nueva Labor */}
      <Modal
        open={laborModal}
        onClose={() => setLaborModal(false)}
        title="Nueva labor"
        subtitle="Creá una labor rápida; podés completar los detalles en Campo Digital."
        footer={<>
          <button className="mc-btn mc-btn--ghost" onClick={() => setLaborModal(false)}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" onClick={crearLabor}><Icon name="check" size={14} /> Crear labor</button>
        </>}
      >
        <Field label="Tipo de labor">
          <select className="mc-select" value={laborForm.tipo} onChange={(e) => setLaborForm({ ...laborForm, tipo: e.target.value })}>
            {["Pulverización", "Siembra", "Cosecha", "Fertilización", "Riego", "Labranza"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Lote">
          <select className="mc-select" value={laborForm.loteId} onChange={(e) => setLaborForm({ ...laborForm, loteId: e.target.value })}>
            <option value="">{lotes.length ? "Seleccionar lote..." : "Sin lotes (creá uno en Campo Digital)"}</option>
            {lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </Field>
        <Field label="Fecha">
          <input type="date" className="mc-input" value={laborForm.fecha} onChange={(e) => setLaborForm({ ...laborForm, fecha: e.target.value })} />
        </Field>
      </Modal>
    </div>
  );
}
