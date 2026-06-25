"use client";

import React from "react";
import { Icon } from "@/components/mc";
import { AnimatedWeatherIcon } from "./AnimatedWeatherIcon";

export type DayForecast = {
  d: string;
  num: number;
  ic: string;
  cond?: string;
  desc?: string;
  viento?: number;
  max: number;
  min: number;
  mm: number;
  vent: "ok" | "warn" | "bad";
};

const SPRAY: Record<DayForecast["vent"], { color: string; label: string; icon: string; bg: string }> = {
  ok: { color: "#5e7733", label: "Apto", icon: "check", bg: "rgba(94,119,51,0.12)" },
  warn: { color: "#d9a538", label: "Marginal", icon: "alert", bg: "rgba(217,165,56,0.14)" },
  bad: { color: "#c93434", label: "No apto", icon: "x", bg: "rgba(201,52,52,0.12)" },
};

/* Pronóstico extendido — tarjetas limpias por día, con íconos animados */
export function ForecastChart({
  days,
  onVerDetalle,
}: {
  days: DayForecast[];
  onVerDetalle: (d: DayForecast) => void;
}) {
  return (
    <div
      className="mc-hscroll"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${days.length || 1}, minmax(118px, 1fr))`,
        gap: 12,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      {days.map((d, i) => {
        const isToday = i === 0;
        const sp = SPRAY[d.vent];
        return (
          <div
            key={i}
            style={{
              borderRadius: 16,
              padding: "16px 10px 14px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: isToday
                ? "linear-gradient(180deg, rgba(94,119,51,0.10) 0%, rgba(94,119,51,0.02) 100%)"
                : "var(--mc-surface-2)",
              border: isToday ? "1.5px solid rgba(94,119,51,0.35)" : "1px solid var(--mc-line)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: isToday ? "var(--mc-green-700)" : "var(--mc-ink)", letterSpacing: "0.02em" }}>
              {isToday ? "Hoy" : d.d}
            </div>
            <div style={{ fontSize: 11, color: "var(--mc-text-3)", fontWeight: 600 }}>{d.num}</div>

            <div style={{ margin: "4px 0 2px" }}>
              <AnimatedWeatherIcon cond={d.cond || d.ic} size={62} />
            </div>

            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, fontFamily: "var(--ff-mono)" }}>
              <span style={{ fontSize: 19, fontWeight: 800, color: "#c08a22" }}>{d.max}°</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#3a93b8" }}>{d.min}°</span>
            </div>

            {d.desc && (
              <div style={{ fontSize: 11.5, color: "var(--mc-text-2)", fontWeight: 600, minHeight: 28, display: "flex", alignItems: "center" }}>{d.desc}</div>
            )}

            <div className="row gap-10" style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 2 }}>
              {d.viento != null && (
                <span className="row gap-3" style={{ alignItems: "center" }}><Icon name="wind" size={11} />{d.viento}</span>
              )}
              {d.mm > 0 && (
                <span className="row gap-3" style={{ alignItems: "center", color: "var(--mc-blue)", fontWeight: 700 }}><Icon name="droplet" size={11} />{d.mm}mm</span>
              )}
            </div>

            <span
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px 3px 4px",
                borderRadius: 999,
                background: sp.bg,
                border: `1px solid ${sp.color}`,
              }}
            >
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: sp.color, color: "#fff", display: "grid", placeItems: "center" }}>
                <Icon name={sp.icon} size={10} />
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: sp.color, letterSpacing: "0.02em" }}>{sp.label}</span>
            </span>

            <button
              className="mc-btn mc-btn--ghost mc-btn--sm"
              style={{ marginTop: 8, fontSize: 10.5, padding: "3px 10px" }}
              onClick={() => onVerDetalle(d)}
            >
              Ver detalle
            </button>
          </div>
        );
      })}
    </div>
  );
}
