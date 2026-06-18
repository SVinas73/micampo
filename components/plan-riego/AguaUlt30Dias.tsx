"use client";

import React from "react";
import { Icon, IABadge } from "@/components/mc";

export type EventoAgua = {
  tipo: string;
  fecha: string;
  icon: string;
  color: string;
  val: string;
  status: string;
  iaIcon?: boolean;
};

export default function AguaUlt30Dias({ eventos, totalMm, lluviaMm, riegoMm, histMm }: { eventos: EventoAgua[]; totalMm?: number; lluviaMm?: number; riegoMm?: number; histMm?: number | null }) {
  const total = totalMm ?? 0;
  const pctVsHist = histMm && histMm > 0 ? Math.round(((total - histMm) / histMm) * 100) : null;
  return (
    <div className="mc-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="mc-card__eyebrow">Agua Últ. 30 Días</div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 42, color: "var(--mc-blue)", fontWeight: 800, lineHeight: 1, marginTop: 4 }}>
            {total} mm
          </div>
          <div className="row gap-12 mt-6 text-xs">
            <span className="row gap-4" style={{ color: "var(--mc-blue)" }}><Icon name="droplet" size={11} />Lluvia: {lluviaMm ?? 0}mm</span>
            <span className="row gap-4" style={{ color: "var(--mc-green-700)" }}><Icon name="droplet" size={11} />Riego: {riegoMm ?? 0}mm</span>
          </div>
        </div>
        {histMm != null && (
          <div style={{ padding: "8px 12px", background: "var(--mc-blue-bg)", borderRadius: 10, textAlign: "right" }}>
            <div className="text-xs text-muted">prom. histórico</div>
            <div className="font-semi" style={{ color: "var(--mc-blue)", fontSize: 14 }}>{histMm} mm</div>
            {pctVsHist != null && <div className="text-xs" style={{ color: pctVsHist >= 0 ? "var(--mc-green-700)" : "var(--mc-red)", fontWeight: 600 }}>{pctVsHist >= 0 ? "+" : ""}{pctVsHist}%</div>}
          </div>
        )}
      </div>

      <div className="mc-divider"></div>

      {eventos.length === 0 ? (
        <div className="mc-empty" style={{ marginTop: 14 }}>
          <div className="mc-empty__icon"><Icon name="droplet" size={20} /></div>
          Sin lluvias ni riegos en los últimos 30 días. Registrá riegos y lluvias y aparecen acá.
        </div>
      ) : (
      <div style={{ position: "relative", marginTop: 14 }}>
        <div style={{ position: "absolute", left: 14, top: 8, bottom: 8, width: 2, background: "var(--mc-line)" }}></div>
        {eventos.map((e, i) => (
          <div key={i} className="row gap-12" style={{ alignItems: "flex-start", paddingBottom: i < eventos.length - 1 ? 16 : 0, position: "relative" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: e.color, color: "white", display: "grid", placeItems: "center", border: "3px solid var(--mc-surface)", flexShrink: 0, zIndex: 1 }}>
              <Icon name={e.icon} size={13} />
            </div>
            <div className="row" style={{ flex: 1, justifyContent: "space-between", alignItems: "flex-start", gap: 8, paddingTop: 2 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row gap-4" style={{ alignItems: "center" }}>
                  <span className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{e.tipo}</span>
                  {e.iaIcon && <IABadge />}
                </div>
                <div className="text-xs text-muted">{e.fecha}</div>
                {e.status && (
                  <div className="text-xs mt-2" style={{ color: e.status === "ejecutado" ? "var(--mc-green-700)" : "var(--mc-text-3)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {e.status === "ejecutado" ? <><Icon name="check" size={12} /> Ejecutado</> : e.status}
                  </div>
                )}
              </div>
              <span className="mc-badge mc-badge--blue" style={{ fontSize: 11, flexShrink: 0 }}>{e.val}</span>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
