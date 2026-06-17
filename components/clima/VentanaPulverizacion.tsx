"use client";

import React from "react";
import { Icon } from "@/components/mc";

export type HoraPulver = { hora: string; viento: number; deltaT: number; estado: string; nivel: "ok" | "warn" | "bad" };

const COLOR: Record<HoraPulver["nivel"], { c: string; bg: string }> = {
  ok: { c: "var(--mc-green-600)", bg: "var(--mc-green-50)" },
  warn: { c: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
  bad: { c: "var(--mc-red)", bg: "var(--mc-red-bg)" },
};
const stateIcon = (n: HoraPulver["nivel"]) => (n === "ok" ? "check" : n === "bad" ? "x" : "alert");

export function VentanaPulverizacion({ horas }: { horas: HoraPulver[] }) {
  const condActual = horas[0];

  return (
    <div className="mc-card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="mc-card__head">
        <div>
          <div className="mc-card__title">Ventana de Pulverización Hoy (Horario)</div>
          <div className="text-xs text-muted mt-2">Próximas 6 horas · según viento y ΔT (Open-Meteo)</div>
        </div>
        {condActual && (
          <div className="col" style={{ alignItems: "flex-end", gap: 2 }}>
            <span className="text-xs text-muted">Condición ahora · {condActual.hora}</span>
            <span className={`mc-badge mc-badge--${condActual.nivel === "ok" ? "green" : condActual.nivel === "bad" ? "red" : "amber"}`} style={{ fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name={stateIcon(condActual.nivel)} size={12} /> {condActual.estado}
            </span>
          </div>
        )}
      </div>

      {horas.length === 0 ? (
        <div className="mc-empty" style={{ flex: 1 }}>
          <div className="mc-empty__icon"><Icon name="wind" size={22} /></div>
          Cargando ventana de pulverización…
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", gap: 8, flex: 1, alignItems: "stretch" }}>
          {horas.map((h, i) => {
            const isNow = i === 0;
            const col = COLOR[h.nivel];
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  padding: "14px 10px 12px",
                  borderRadius: 10,
                  border: `1.5px solid ${isNow ? col.c : `${col.c}55`}`,
                  background: `linear-gradient(180deg, ${col.bg} 0%, var(--mc-surface) 100%)`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  boxShadow: isNow ? `0 4px 14px ${col.c}25` : "none",
                  transform: isNow ? "translateY(-2px)" : "none",
                  transition: "transform 0.15s",
                }}
              >
                {isNow && (
                  <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", padding: "3px 10px", background: col.c, color: "white", borderRadius: 999, fontSize: 9, fontWeight: 800, letterSpacing: "0.08em" }}>
                    AHORA
                  </div>
                )}
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--mc-ink)", fontFamily: "var(--ff-mono)" }}>{h.hora}</div>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: col.c, display: "grid", placeItems: "center", color: "white" }}>
                    <Icon name={stateIcon(h.nivel)} size={12} />
                  </div>
                </div>
                <div className="col gap-4" style={{ flex: 1 }}>
                  <div className="row gap-6" style={{ alignItems: "center", padding: "5px 8px", background: "var(--mc-surface)", borderRadius: 6, border: "1px solid var(--mc-line)" }}>
                    <Icon name="wind" size={11} style={{ color: "var(--mc-text-2)" }} />
                    <span className="text-xs" style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{h.viento} km/h</span>
                  </div>
                  <div className="row gap-6" style={{ alignItems: "center", padding: "5px 8px", background: "var(--mc-surface)", borderRadius: 6, border: "1px solid var(--mc-line)" }}>
                    <Icon name="thermometer" size={11} style={{ color: "var(--mc-text-2)" }} />
                    <span className="text-xs" style={{ color: "var(--mc-ink)", fontWeight: 600, fontFamily: "var(--ff-mono)" }}>ΔT {h.deltaT}</span>
                  </div>
                </div>
                <div style={{ padding: "6px 8px", background: col.c, color: "white", borderRadius: 6, fontSize: 9, fontWeight: 800, textAlign: "center", letterSpacing: "0.05em" }}>
                  {h.estado}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
