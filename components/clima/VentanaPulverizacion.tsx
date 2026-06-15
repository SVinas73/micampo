"use client";

import React from "react";
import { Icon } from "@/components/mc";

type Cond = { v: string; dt: number; e: string; c: string; bg: string };

export function VentanaPulverizacion() {
  const now = new Date();
  const horaActual = now.getHours();
  const minutosActual = now.getMinutes();
  const horaStr = `${String(horaActual).padStart(2, "0")}:${String(minutosActual).padStart(2, "0")}`;
  const startHour = horaActual + 1;

  const fullDay: Cond[] = [
    { v: "Calma", dt: 1.0, e: "INV. TERM.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "Calma", dt: 0.8, e: "INV. TERM.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "2 km/h", dt: 0.6, e: "INV. TERM.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "2 km/h", dt: 0.5, e: "INV. TERM.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "3 km/h", dt: 1.2, e: "INV. TERM.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "4 km/h", dt: 2.5, e: "ÓPTIMO", c: "var(--mc-green-700)", bg: "var(--mc-green-50)" },
    { v: "5 km/h", dt: 3.2, e: "ÓPTIMO", c: "var(--mc-green-700)", bg: "var(--mc-green-50)" },
    { v: "6 km/h", dt: 3.8, e: "ÓPTIMO", c: "var(--mc-green-700)", bg: "var(--mc-green-50)" },
    { v: "8 km/h", dt: 4.2, e: "ÓPTIMO", c: "var(--mc-green-700)", bg: "var(--mc-green-50)" },
    { v: "10 km/h", dt: 5.0, e: "BUENO", c: "var(--mc-green-600)", bg: "var(--mc-green-50)" },
    { v: "12 km/h", dt: 5.6, e: "BUENO", c: "var(--mc-green-600)", bg: "var(--mc-green-50)" },
    { v: "15 km/h", dt: 6.1, e: "MARGINAL", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "18 km/h", dt: 6.5, e: "RIESGO MOD.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "20 km/h", dt: 6.8, e: "RIESGO MOD.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "22 km/h", dt: 6.2, e: "RIESGO MOD.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "20 km/h", dt: 5.8, e: "RIESGO MOD.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "18 km/h", dt: 5.2, e: "RIESGO MOD.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "22 km/h", dt: 4.8, e: "RIESGO ALTO", c: "var(--mc-orange-700)", bg: "var(--mc-orange-50)" },
    { v: "25 km/h", dt: 4.5, e: "NO APTO", c: "var(--mc-red)", bg: "var(--mc-red-bg)" },
    { v: "Calma", dt: 3.8, e: "ALERTA INVERSIÓN", c: "#7c3aed", bg: "#ede9fe" },
    { v: "5 km/h", dt: 3.5, e: "ÓPTIMO", c: "var(--mc-green-700)", bg: "var(--mc-green-50)" },
    { v: "3 km/h", dt: 1.2, e: "INV. TERM.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "Calma", dt: 1.0, e: "INV. TERM.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { v: "Calma", dt: 0.8, e: "INV. TERM.", c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
  ];

  const slots = Array.from({ length: 6 }).map((_, i) => {
    const h = (startHour + i) % 24;
    const cond = fullDay[h];
    return { hora: `${String(h).padStart(2, "0")}:00 hs`, ...cond };
  });
  const condActual = fullDay[horaActual];

  const stateIcon = (e: string) => {
    if (e === "ÓPTIMO" || e === "BUENO") return "check";
    if (e === "NO APTO" || e === "RIESGO ALTO") return "x";
    return "alert";
  };
  const stateBadgeColor = (e: string) =>
    e === "ÓPTIMO" || e === "BUENO"
      ? "green"
      : e === "NO APTO"
        ? "red"
        : e === "RIESGO ALTO"
          ? "orange"
          : "amber";

  return (
    <div className="mc-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="mc-card__head">
        <div>
          <div className="mc-card__title">Ventana de Pulverización Hoy (Horario)</div>
          <div className="text-xs text-muted mt-2">Próximas 6 horas · Hoy</div>
        </div>
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <div className="col" style={{ alignItems: "flex-end", gap: 2 }}>
            <span className="text-xs text-muted">Condición Actual · {horaStr}</span>
            <span className={`mc-badge mc-badge--${stateBadgeColor(condActual.e)}`} style={{ fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name={stateIcon(condActual.e)} size={12} /> {condActual.e}
            </span>
          </div>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", gap: 8, flex: 1, alignItems: "stretch" }}>
        {slots.map((h, i) => {
          const isNow = i === 0;
          return (
            <div
              key={i}
              style={{
                position: "relative",
                padding: "14px 10px 12px",
                borderRadius: 10,
                border: `1.5px solid ${isNow ? h.c : `${h.c}55`}`,
                background: `linear-gradient(180deg, ${h.bg} 0%, var(--mc-surface) 100%)`,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                boxShadow: isNow ? `0 4px 14px ${h.c}25` : "none",
                transform: isNow ? "translateY(-2px)" : "none",
                transition: "transform 0.15s",
              }}
            >
              {isNow && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "3px 10px",
                    background: h.c,
                    color: "white",
                    borderRadius: 999,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                  }}
                >
                  AHORA
                </div>
              )}
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--mc-ink)", fontFamily: "var(--ff-mono)" }}>{h.hora}</div>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: h.c,
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  <Icon name={stateIcon(h.e)} size={12} />
                </div>
              </div>
              <div className="col gap-4" style={{ flex: 1 }}>
                <div
                  className="row gap-6"
                  style={{ alignItems: "center", padding: "5px 8px", background: "var(--mc-surface)", borderRadius: 6, border: "1px solid var(--mc-line)" }}
                >
                  <Icon name="wind" size={11} style={{ color: "var(--mc-text-2)" }} />
                  <span className="text-xs" style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{h.v}</span>
                </div>
                <div
                  className="row gap-6"
                  style={{ alignItems: "center", padding: "5px 8px", background: "var(--mc-surface)", borderRadius: 6, border: "1px solid var(--mc-line)" }}
                >
                  <Icon name="thermometer" size={11} style={{ color: "var(--mc-text-2)" }} />
                  <span className="text-xs" style={{ color: "var(--mc-ink)", fontWeight: 600, fontFamily: "var(--ff-mono)" }}>ΔT {h.dt}</span>
                </div>
              </div>
              <div style={{ padding: "6px 8px", background: h.c, color: "white", borderRadius: 6, fontSize: 9, fontWeight: 800, textAlign: "center", letterSpacing: "0.05em" }}>
                {h.e}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
