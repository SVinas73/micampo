"use client";

import React from "react";
import { Icon } from "@/components/mc";
import type { GanttEvent, WeatherDay } from "./data";

function InfoCell({
  icon,
  big,
  sub,
  highlight,
}: {
  icon: string;
  big: React.ReactNode;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRight: "1px solid rgba(255,255,255,0.12)",
        background: highlight ? "rgba(255,255,255,0.10)" : "transparent",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: "rgba(255,255,255,0.20)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={15} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {big}
        </div>
        <div style={{ fontSize: 10.5, opacity: 0.78, marginTop: 3, whiteSpace: "nowrap" }}>{sub}</div>
      </div>
    </div>
  );
}

export function ClimaConGantt({
  weather,
  events,
  campoNombre,
  onVerCalendario,
}: {
  weather: WeatherDay[];
  events: GanttEvent[];
  campoNombre?: string;
  onVerCalendario: () => void;
}) {
  const today = new Date();
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const days = weather.map((w, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return { name: dayNames[d.getDay()], num: d.getDate(), isToday: i === 0, ...w };
  });

  // Cabecera "ahora"
  const monthsShort = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const dayShort = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const headerDate = `${dayShort[today.getDay()]} ${today.getDate()} ${monthsShort[today.getMonth()]} · ${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
  const now = days[0];
  const condicionTxt =
    now.ic === "🌧️" ? "Lluvia" : now.ic === "🌦️" ? "Chaparrones aislados" : now.ic === "☀️" ? "Despejado" : "Parcialmente nublado";

  // Acomodo de eventos en filas sin solaparse
  const rows: GanttEvent[][] = [];
  events.forEach((e) => {
    let placed = false;
    for (const r of rows) {
      if (!r.some((x) => !(e.inicio + e.dur <= x.inicio || x.inicio + x.dur <= e.inicio))) {
        r.push(e);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([e]);
  });

  // Curva de temperatura
  const minT = Math.min(...days.map((d) => d.min));
  const maxT = Math.max(...days.map((d) => d.max));
  const tempLow = Math.min(10, minT - 2);
  const tempHigh = Math.max(30, maxT + 2);
  const tY = (t: number) => 60 * (1 - (t - tempLow) / (tempHigh - tempLow)) + 6;

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Hoy — cabecera con gradiente */}
      <div style={{ background: "linear-gradient(135deg, #2d5f4a 0%, #4a7c64 100%)", color: "white", padding: "18px 22px 20px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 10, opacity: 0.78, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
            {campoNombre || "Don Ramón"} · {headerDate}
          </div>
          <div
            style={{
              fontSize: 11,
              opacity: 0.85,
              padding: "3px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.22)",
            }}
          >
            {condicionTxt}
          </div>
        </div>
        <div className="row" style={{ alignItems: "stretch", gap: 14 }}>
          {/* Temperatura grande a la izquierda */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingRight: 18, borderRight: "1px solid rgba(255,255,255,0.22)" }}>
            <span style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif", fontSize: 38, lineHeight: 1 }}>
              {now.ic}
            </span>
            <div className="col">
              <span style={{ fontFamily: "var(--ff-display)", fontSize: 56, lineHeight: 0.92, fontWeight: 600 }}>{now.max}°</span>
              <span style={{ fontSize: 11, opacity: 0.78, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600, marginTop: 2 }}>
                Ahora
              </span>
            </div>
          </div>
          {/* Barra de 4 celdas */}
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <InfoCell
              icon="thermometer"
              big={
                <span>
                  <span style={{ color: "#ffd28a" }}>{now.max}°</span>
                  <span style={{ opacity: 0.62, margin: "0 6px", fontSize: 13, fontFamily: "var(--ff-mono)", fontWeight: 500 }}>°C</span>
                  <span style={{ color: "#9ad8ff" }}>{now.min}°</span>
                </span>
              }
              sub={`Sens. ${now.max - 1}°`}
            />
            <InfoCell icon="droplet" big="68%" sub={`Rocío ${now.min + 2}°`} />
            <InfoCell icon="wind" big={now.wind.split(" ").slice(0, 2).join(" ")} sub={`${now.wind.split(" ").slice(2).join(" ")} · Ráf. 18`} />
            <InfoCell icon="activity" big="ΔT 5.2" sub="✓ Apto pulver." highlight />
          </div>
        </div>
      </div>

      {/* Pronóstico 7 días + curva de temperatura */}
      <div style={{ position: "relative", borderBottom: "1px solid var(--mc-line)", background: "var(--mc-surface)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {days.map((d, i) => (
            <div
              key={i}
              style={{
                padding: "10px 4px 10px",
                textAlign: "center",
                borderRight: i < 6 ? "1px solid var(--mc-line)" : "none",
                background: d.isToday ? "var(--mc-green-50)" : "transparent",
                position: "relative",
                minHeight: 168,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: d.isToday ? "var(--mc-green-700)" : "var(--mc-text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {d.name}
              </div>
              <div style={{ fontSize: 10, color: d.isToday ? "var(--mc-green-700)" : "var(--mc-text-2)", fontWeight: 600, marginTop: 1 }}>
                {d.num}
              </div>
              <div style={{ fontSize: 30, lineHeight: 1, marginTop: 6, fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" }}>
                {d.ic}
              </div>
              {/* espacio para la curva */}
              <div style={{ height: 80 }} />
              {d.mm > 0 ? (
                <div style={{ fontSize: 11, color: "var(--mc-blue)", fontWeight: 700, fontFamily: "var(--ff-mono)" }}>💧 {d.mm}mm</div>
              ) : (
                <div style={{ height: 17 }} />
              )}
              <div
                style={{
                  fontSize: 9,
                  color: "var(--mc-text-3)",
                  marginTop: 2,
                  lineHeight: 1.4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  padding: "0 2px",
                }}
              >
                {d.wind}
              </div>
            </div>
          ))}
        </div>
        {/* Curva SVG continua de máximas y mínimas */}
        <svg
          style={{ position: "absolute", top: 70, left: 0, width: "100%", height: 80, pointerEvents: "none" }}
          viewBox="0 0 700 80"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="ic-max-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e7892b" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#e7892b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ic-min-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3aa6d9" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3aa6d9" stopOpacity="0" />
            </linearGradient>
            <filter id="ic-dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.35" />
            </filter>
          </defs>
          <polygon points={`50,80 ${days.map((d, i) => `${i * 100 + 50},${tY(d.max)}`).join(" ")} 650,80`} fill="url(#ic-max-area)" />
          <polygon points={`50,80 ${days.map((d, i) => `${i * 100 + 50},${tY(d.min)}`).join(" ")} 650,80`} fill="url(#ic-min-area)" />
          <polyline
            fill="none"
            stroke="#e7892b"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={days.map((d, i) => `${i * 100 + 50},${tY(d.max)}`).join(" ")}
          />
          <polyline
            fill="none"
            stroke="#3aa6d9"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={days.map((d, i) => `${i * 100 + 50},${tY(d.min)}`).join(" ")}
          />
          {days.map((d, i) => {
            const x = i * 100 + 50;
            return (
              <g key={i}>
                <circle cx={x} cy={tY(d.max)} r="5" fill="#e7892b" stroke="white" strokeWidth="1.8" filter="url(#ic-dot-shadow)" />
                <circle cx={x} cy={tY(d.min)} r="4.5" fill="#3aa6d9" stroke="white" strokeWidth="1.6" filter="url(#ic-dot-shadow)" />
              </g>
            );
          })}
        </svg>
        {/* Etiquetas numéricas en HTML para que no se estiren */}
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 0,
            width: "100%",
            height: 80,
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
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
                  top: `${tY(d.max) - 18}px`,
                  fontFamily: "var(--ff-mono)",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--mc-ink)",
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
                  top: `${tY(d.min) + 8}px`,
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--mc-text-2)",
                  whiteSpace: "nowrap",
                }}
              >
                {d.min}°
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gantt de la semana */}
      <div style={{ padding: "10px 14px 14px" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Agenda de la semana
          </div>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "2px 8px", fontSize: 11 }} onClick={onVerCalendario}>
            Ver calendario <Icon name="chevRight" size={11} />
          </button>
        </div>
        <div style={{ position: "relative" }}>
          {/* Guías de columna */}
          <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", pointerEvents: "none", zIndex: 0 }}>
            {days.map((d, i) => (
              <div
                key={i}
                style={{
                  borderRight: i < 6 ? "1px dashed rgba(0,0,0,0.06)" : "none",
                  background: d.isToday ? "rgba(79,157,82,0.06)" : "transparent",
                }}
              />
            ))}
          </div>
          {/* Filas de eventos */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {rows.map((row, ri) => (
              <div key={ri} style={{ position: "relative", height: 26, marginBottom: ri < rows.length - 1 ? 5 : 0 }}>
                {row.map((e, ei) => {
                  const isMulti = e.dur > 1;
                  const leftPct = isMulti ? ((e.inicio + 0.5) / 7) * 100 : (e.inicio / 7) * 100;
                  const widthPct = isMulti ? ((e.dur - 1) / 7) * 100 : (1 / 7) * 100;
                  const left = `calc(${leftPct}% + ${isMulti ? 0 : 4}px)`;
                  const width = `calc(${widthPct}% - ${isMulti ? 0 : 8}px)`;
                  return (
                    <div
                      key={ei}
                      onClick={onVerCalendario}
                      style={{
                        position: "absolute",
                        left,
                        width,
                        top: 0,
                        bottom: 0,
                        background: e.color,
                        borderRadius: 999,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "0 11px",
                        fontSize: 11,
                        color: "white",
                        fontWeight: 600,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        boxShadow: `0 1px 4px ${e.color}55, inset 0 1px 0 rgba(255,255,255,0.18)`,
                      }}
                    >
                      <Icon name={e.icon} size={10} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{e.titulo}</span>
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
