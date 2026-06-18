"use client";

import React, { useMemo, useState } from "react";
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

type Lluvia = { t: number; mm: number; lugar: string };
type Riego = { t: number; mm: number; estado: string; ia: boolean };

export default function AguaUlt30Dias({ lluvias, riegos, histMm }: { lluvias: Lluvia[]; riegos: Riego[]; histMm: number | null }) {
  const [periodo, setPeriodo] = useState<7 | 15 | 30>(30);

  const { total, lluviaMm, riegoMm, eventos, histPeriodo, pctVsHist } = useMemo(() => {
    const desde = Date.now() - periodo * 86400000;
    const lls = lluvias.filter((l) => l.t >= desde);
    const rgs = riegos.filter((r) => r.t >= desde);
    const lluviaMm = Math.round(lls.reduce((s, l) => s + l.mm, 0));
    const riegoMm = Math.round(rgs.reduce((s, r) => s + r.mm, 0));
    const fmt = (t: number) => new Date(t).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
    const eventos: (EventoAgua & { t: number })[] = [
      ...lls.map((l) => ({ t: l.t, tipo: "Lluvia", fecha: fmt(l.t), icon: "droplet", color: "#3aa6d9", val: `+${Math.round(l.mm)} mm`, status: l.lugar })),
      ...rgs.map((r) => ({ t: r.t, tipo: r.ia ? "Riego IA" : "Riego", fecha: fmt(r.t), icon: "droplet", color: "#768f44", val: `+${Math.round(r.mm)} mm`, status: r.estado, iaIcon: r.ia })),
    ].sort((a, b) => b.t - a.t).slice(0, 8);
    const histPeriodo = histMm != null ? Math.round((histMm * periodo) / 30) : null;
    const total = lluviaMm + riegoMm;
    const pctVsHist = histPeriodo && histPeriodo > 0 ? Math.round(((total - histPeriodo) / histPeriodo) * 100) : null;
    return { total, lluviaMm, riegoMm, eventos, histPeriodo, pctVsHist };
  }, [lluvias, riegos, histMm, periodo]);

  return (
    <div className="mc-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div className="mc-card__eyebrow">Agua Últ. {periodo} Días</div>
        <div className="mc-seg">
          {([7, 15, 30] as const).map((p) => (
            <button key={p} className={periodo === p ? "is-on" : ""} onClick={() => setPeriodo(p)}>{p}d</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 42, color: "var(--mc-blue)", fontWeight: 800, lineHeight: 1 }}>
            {total} mm
          </div>
          <div className="row gap-12 mt-6 text-xs">
            <span className="row gap-4" style={{ color: "var(--mc-blue)" }}><Icon name="droplet" size={11} />Lluvia: {lluviaMm}mm</span>
            <span className="row gap-4" style={{ color: "var(--mc-green-700)" }}><Icon name="droplet" size={11} />Riego: {riegoMm}mm</span>
          </div>
        </div>
        {histPeriodo != null && (
          <div style={{ padding: "8px 12px", background: "var(--mc-blue-bg)", borderRadius: 10, textAlign: "right" }}>
            <div className="text-xs text-muted">prom. histórico</div>
            <div className="font-semi" style={{ color: "var(--mc-blue)", fontSize: 14 }}>{histPeriodo} mm</div>
            {pctVsHist != null && <div className="text-xs" style={{ color: pctVsHist >= 0 ? "var(--mc-green-700)" : "var(--mc-red)", fontWeight: 600 }}>{pctVsHist >= 0 ? "+" : ""}{pctVsHist}%</div>}
          </div>
        )}
      </div>

      <div className="mc-divider"></div>

      {eventos.length === 0 ? (
        <div className="mc-empty" style={{ marginTop: 14 }}>
          <div className="mc-empty__icon"><Icon name="droplet" size={20} /></div>
          Sin lluvias ni riegos en los últimos {periodo} días. Registrá riegos y lluvias y aparecen acá.
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
