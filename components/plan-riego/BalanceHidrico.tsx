"use client";

import React from "react";
import { Icon, IABadge } from "@/components/mc";

export type PuntoBalance = { dia: string; sinRiego: number; conRiego: number };
export type SugerenciaIA = { fecha: string; mm: number; motivo: string; costoUSD: number };

function Legend({ color, label, mode }: { color: string; label: string; mode: "line" | "dashed" | "dotted" | "bar" }) {
  let line: React.ReactNode;
  if (mode === "line") line = <span style={{ width: 16, height: 3, background: color, borderRadius: 1 }} />;
  else if (mode === "dashed") line = <span style={{ width: 16, height: 0, borderTop: `2px dashed ${color}` }} />;
  else if (mode === "dotted") line = <span style={{ width: 16, height: 0, borderTop: `2.5px dotted ${color}` }} />;
  else line = <span style={{ width: 12, height: 12, background: "rgba(44,130,201,0.2)", border: `2px solid ${color}`, borderRadius: 2 }} />;
  return (
    <span
      className="row gap-4 text-xs"
      style={{ alignItems: "center", padding: "4px 8px", background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)", borderRadius: 999, color: "var(--mc-text-2)", fontWeight: 600 }}
    >
      {line}
      {label}
    </span>
  );
}

function BHKpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "blue" | "red" | "orange" | "green" }) {
  const map = {
    blue: { bg: "#eff6ff", border: "#bfdbfe", txt: "#1e40af", fg: "#2c82c9" },
    red: { bg: "#fef2f2", border: "#fecaca", txt: "#991b1b", fg: "#dc2626" },
    orange: { bg: "linear-gradient(135deg, #FFF8EC, #FFF0DD)", border: "#FF9D00", txt: "#a85f00", fg: "#a85f00" },
    green: { bg: "#f0fdf4", border: "#bbf7d0", txt: "#166534", fg: "#22a261" },
  } as const;
  const c = map[tone];
  return (
    <div style={{ padding: "10px 12px", background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 10, minHeight: 70 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: c.txt, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        {tone === "orange" && <IABadge />}
      </div>
      <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 800, color: c.fg, lineHeight: 1.1, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: c.txt, opacity: 0.8, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export default function BalanceHidrico({
  balance,
  sugerencias,
  estrategia,
  onEstrategia,
  onEstrategiaCommit,
  costoEvento,
  onAprobar,
  cargando,
}: {
  balance: PuntoBalance[];
  sugerencias: SugerenciaIA[];
  estrategia: number;
  onEstrategia: (v: number) => void;
  onEstrategiaCommit: (v: number) => void;
  costoEvento: number;
  onAprobar: () => void;
  cargando?: boolean;
}) {
  const W = 900, H = 360;
  const padL = 56, padR = 30, padT = 40, padB = 56;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const days = balance.map((b) => b.dia);
  const dx = innerW / Math.max(1, days.length - 1);
  const yPct = (p: number) => padT + innerH * (1 - p / 100);

  const sinRiego = balance.map((b) => b.sinRiego);
  const conRiego = balance.map((b) => b.conRiego);

  const smoothPath = (vals: number[]) => {
    const pts = vals.map((v, i) => [padL + i * dx, yPct(v)]);
    if (pts.length === 0) return "";
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 2)];
      const p1 = pts[i - 1];
      const p2 = pts[i];
      const p3 = pts[Math.min(pts.length - 1, i + 1)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  };

  const sinRiegoPath = smoothPath(sinRiego);
  const conRiegoPath = smoothPath(conRiego);

  // Bloques IA en los días 3 y 5 (SÁB / LUN) cuando existen.
  const iaBars = [3, 5]
    .filter((d) => d < conRiego.length)
    .map((d, idx) => ({ day: d, level: conRiego[d], label: `+${sugerencias[idx]?.mm ?? 15}mm` }));

  const humedadActual = conRiego[0] ?? 82;

  return (
    <div className="mc-card ia-card" style={{ border: "none", padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px 0" }}>
        <div className="row" style={{ alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div className="row gap-8" style={{ alignItems: "center" }}>
              <div className="mc-card__title">Balance Hídrico Proyectado</div>
              <IABadge />
            </div>
            <div className="text-xs text-muted mt-2">Próximos 7 días · Don Ramón · Maíz Lote 4 (V6)</div>
          </div>
          <div className="row gap-6" style={{ flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
            <Legend color="var(--mc-blue)" label="Humedad Actual" mode="line" />
            <Legend color="var(--mc-text-3)" label="Proyección sin Riego" mode="dashed" />
            <Legend color="var(--mc-blue)" label="Proyección con Riego Sugerido" mode="dotted" />
            <Legend color="#2c82c9" label="IA Sugerencia Riego" mode="bar" />
          </div>
        </div>

        <div className="grid g-cols-4 gap-8" style={{ marginBottom: 8 }}>
          <BHKpi label="Humedad actual" value={`${humedadActual}%`} sub="Capacidad campo" tone="blue" />
          <BHKpi label="Agua útil" value="120 mm" sub="Suelo perfil 1m" tone="blue" />
          <BHKpi label="Déficit proyectado" value={`-${Math.max(0, 47 - (sinRiego[4] ?? 22))} mm`} sub="día 4-5 sin riego" tone="red" />
          <BHKpi label="Próximo riego IA" value="Sáb 25" sub={`+${sugerencias[0]?.mm ?? 15} mm sugeridos`} tone="orange" />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block", padding: "0 8px" }}>
        <defs>
          <linearGradient id="bhConRiegoArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c82c9" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2c82c9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bhIABarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c82c9" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#2c82c9" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {[0, 20, 40, 60, 80, 100].map((p) => {
          const y = yPct(p);
          return (
            <g key={p}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--mc-line)" strokeDasharray={p === 0 ? "0" : "2,3"} />
              <text x={padL - 8} y={y + 4} fontSize="11" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">{p}%</text>
            </g>
          );
        })}

        {/* Banda zona roja 0-30% */}
        <rect x={padL} y={yPct(30)} width={innerW} height={yPct(0) - yPct(30)} fill="var(--mc-red)" opacity="0.07" />
        <text x={padL + 10} y={yPct(15)} fontSize="11" fontFamily="var(--ff-ui)" fill="var(--mc-red)" fontWeight="700" letterSpacing="0.04em">
          ZONA ROJA · PUNTO DE MARCHITEZ (PELIGRO)
        </text>

        {/* Bloques azules IA con tooltip */}
        {iaBars.map((s, i) => {
          const x = padL + s.day * dx;
          const barW = 38;
          const barTop = yPct(s.level);
          const barBot = yPct(0);
          const barH = barBot - barTop;
          return (
            <g key={i}>
              <title>IA Sugiere: Riego {s.label} (Evita estrés severo)</title>
              <rect x={x - barW / 2} y={barTop} width={barW} height={barH} fill="url(#bhIABarFill)" stroke="#2c82c9" strokeWidth="2" rx={3} />
              <line x1={x - barW / 2} y1={barTop} x2={x + barW / 2} y2={barTop} stroke="#2c82c9" strokeWidth="3" />
              <g transform={`translate(${x - 38}, ${barTop - 36})`}>
                <rect width="76" height="26" rx="13" fill="#FF9D00" />
                <path d="M 50 6 L 51.3 12.7 L 58 14 L 51.3 15.3 L 50 22 L 48.7 15.3 L 42 14 L 48.7 12.7 Z" fill="white" />
                <text x="22" y="17" fontSize="11" fontFamily="var(--ff-ui)" fill="white" fontWeight="800" textAnchor="middle" letterSpacing="0.04em">{s.label}</text>
              </g>
              <circle cx={x} cy={barTop} r="4" fill="#2c82c9" stroke="white" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* Proyección sin riego — punteada gris descendente */}
        <path d={sinRiegoPath} fill="none" stroke="var(--mc-text-3)" strokeWidth="2" strokeDasharray="6,4" />

        {/* Proyección con riego — área + línea punteada azul */}
        <path d={`${conRiegoPath} L${padL + (days.length - 1) * dx},${yPct(0)} L${padL},${yPct(0)} Z`} fill="url(#bhConRiegoArea)" />
        <path d={conRiegoPath} fill="none" stroke="#2c82c9" strokeWidth="2.5" strokeDasharray="2,4" />

        {/* Humedad actual — segmento sólido azul */}
        <line x1={padL} y1={yPct(humedadActual)} x2={padL + dx * 0.3} y2={yPct(humedadActual)} stroke="var(--mc-blue)" strokeWidth="3.5" />
        <circle cx={padL} cy={yPct(humedadActual)} r="6" fill="var(--mc-blue)" stroke="white" strokeWidth="2" />

        {conRiego.map((v, i) => (
          <circle key={i} cx={padL + i * dx} cy={yPct(v)} r="3.5" fill="white" stroke="#2c82c9" strokeWidth="1.5" />
        ))}

        {days.map((d, i) => (
          <text key={d + i} x={padL + i * dx} y={H - padB + 22} fontSize="11" fontFamily="var(--ff-ui)" fontWeight={i === 0 ? "800" : "600"} fill={i === 0 ? "#768f44" : "var(--mc-ink)"} textAnchor="middle">{d}</text>
        ))}
      </svg>

      {/* Footer estrategia */}
      <div className="row gap-12" style={{ alignItems: "center", padding: "14px 18px", background: "var(--mc-surface-2)", borderTop: "1px solid var(--mc-line)", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="row gap-6 mb-6" style={{ alignItems: "center" }}>
            <span className="text-xs text-muted font-semi" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Estrategia de Riego IA</span>
            <IABadge />
            {cargando && <span className="text-xs text-muted">· recalculando…</span>}
          </div>
          <div className="row gap-10" style={{ alignItems: "center" }}>
            <span className="text-xs text-muted" style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="droplet" size={12} /> Ahorrar Agua</span>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="range"
                min={0}
                max={100}
                value={estrategia}
                onChange={(e) => onEstrategia(Number(e.target.value))}
                onMouseUp={(e) => onEstrategiaCommit(Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => onEstrategiaCommit(Number((e.target as HTMLInputElement).value))}
                style={{ width: "100%", accentColor: "var(--mc-blue)", cursor: "pointer" }}
              />
              <div className="row" style={{ justifyContent: "space-between", marginTop: 4 }}>
                <span className="text-xs text-muted">0%</span>
                <span className="font-mono font-semi" style={{ color: "var(--mc-blue)", fontSize: 13 }}>{estrategia}%</span>
                <span className="text-xs text-muted">100%</span>
              </div>
            </div>
            <span className="text-xs text-muted" style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="wheat" size={12} /> Maximizar Rinde</span>
          </div>
        </div>
        <div className="text-right" style={{ borderLeft: "1px solid var(--mc-line)", paddingLeft: 14, minWidth: 130 }}>
          <div className="text-xs text-muted">COSTO ESTIMADO DEL EVENTO</div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)" }}>${costoEvento} USD</div>
        </div>
        <button className="mc-btn mc-btn--primary" onClick={onAprobar} disabled={cargando}>
          <Icon name="check" size={13} />Aprobar Orden de Riego
        </button>
      </div>
    </div>
  );
}
