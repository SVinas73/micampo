"use client";

// Pestaña Resumen de Engorde: KPIs del hato, evolución de peso (chart real de
// pesadas), estado de corrales y alertas de bajo rendimiento. Datos reales.

import React, { useMemo, useRef, useState } from "react";
import { KPI, Icon, useToast } from "@/components/mc";
import {
  CorralAPI,
  coma,
  estadoCorral,
  evolucionHato,
  gdpReal,
  nfEng,
  proyFaenaLabel,
} from "./engorde-tipos";
import { ModalIngresoCorral } from "./engorde-modales";

type RacionLite = { id: string; nombre: string; etapaProductiva?: string | null; animalObjetivo?: string | null };

export function EngordeResumen({ corrales, raciones, onRefresh, onGoToCorrales }: { corrales: CorralAPI[]; raciones: RacionLite[]; onRefresh: () => void; onGoToCorrales?: () => void }) {
  const toast = useToast();
  const [rango, setRango] = useState(60);
  const [modalIngreso, setModalIngreso] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activos = useMemo(() => corrales.filter((c) => c.estado !== "Cerrado"), [corrales]);
  const totalCab = activos.reduce((s, c) => s + c.cabezas, 0);
  const gdps = activos.map((c) => gdpReal(c)).filter((g): g is number => g !== null);
  const gdpProm = gdps.length ? gdps.reduce((a, b) => a + b, 0) / gdps.length : null;
  const gdpObjProm = activos.filter((c) => c.gdpObjetivo).length ? activos.reduce((s, c) => s + (c.gdpObjetivo || 0), 0) / activos.filter((c) => c.gdpObjetivo).length : null;
  const listos = activos.filter((c) => estadoCorral(c) === "listo" || c.estado === "Listo");
  const listosCab = listos.reduce((s, c) => s + c.cabezas, 0);
  // Costo por kg ganado promedio ponderado
  const costos = activos.map((c) => { const g = gdpReal(c) ?? c.gdpObjetivo; const cd = c.costoDiario ?? c.racion?.costoTotal; return g && g > 0 && cd ? cd / g : null; }).filter((x): x is number => x !== null);
  const costoKgProm = costos.length ? costos.reduce((a, b) => a + b, 0) / costos.length : null;

  const data = useMemo(() => evolucionHato(activos, rango), [activos, rango]);
  const hayChart = data.length >= 2;

  // Chart geometry
  const W = 760, H = 230, padL = 38, padR = 12, padT = 16, padB = 26;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const vals = data.flatMap((d) => [d.peso, d.objetivo]);
  const minV = vals.length ? Math.floor(Math.min(...vals) / 10) * 10 - 10 : 200;
  const maxV = vals.length ? Math.ceil(Math.max(...vals) / 10) * 10 + 10 : 500;
  const xFor = (i: number) => padL + (data.length <= 1 ? 0 : (i / (data.length - 1)) * chartW);
  const yFor = (v: number) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH;
  const realPts = data.map((d, i) => [xFor(i), yFor(d.peso)] as [number, number]);
  const objPts = data.map((d, i) => [xFor(i), yFor(d.objetivo)] as [number, number]);
  const realPath = realPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const objPath = objPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const yTicks = Array.from({ length: 5 }, (_, i) => minV + ((maxV - minV) / 4) * i);
  const xLabelEvery = Math.max(1, Math.round(data.length / 6));
  const hov = hoverIdx != null ? data[hoverIdx] : null;
  const hovX = hoverIdx != null ? xFor(hoverIdx) : 0;
  const hovY = hov ? yFor(hov.peso) : 0;

  const estadoBadge = (c: CorralAPI) => { const g = gdpReal(c); const obj = c.gdpObjetivo; if (g == null || obj == null) return "mc-badge--neutral"; return g >= obj ? "mc-badge--green" : g >= obj * 0.85 ? "mc-badge--amber" : "mc-badge--red"; };
  const estadoTxt = (c: CorralAPI) => { const g = gdpReal(c); const obj = c.gdpObjetivo; if (g == null || obj == null) return "Sin datos"; return g >= obj ? "Óptimo" : g >= obj * 0.85 ? "Atención" : "Crítico"; };

  // Alertas: corrales con GDP < 85% del objetivo
  const alertas = activos.filter((c) => { const g = gdpReal(c); return g !== null && c.gdpObjetivo && g < c.gdpObjetivo * 0.85; });

  const exportar = () => {
    const filas = [["Corral", "Categoría", "Cabezas", "Peso act.", "GDP real", "GDP obj", "Estado", "Proy. faena"], ...activos.map((c) => [c.nombre, c.categoria || "", String(c.cabezas), String(c.pesoActual ?? ""), String(gdpReal(c) ?? ""), String(c.gdpObjetivo ?? ""), estadoTxt(c), proyFaenaLabel(c)])];
    const csv = filas.map((f) => f.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "engorde-resumen.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="col gap-16">
      {toast.node}
      {modalIngreso && <ModalIngresoCorral raciones={raciones} onClose={() => setModalIngreso(false)} onGuardado={() => { toast.show("Corral creado"); onRefresh(); }} />}

      <div className="grid g-cols-5">
        <KPI label="Animales en Engorde" value={nfEng.format(totalCab)} delta={`${activos.length} corrales activos`} icon="users" accent />
        <KPI label="GDP Promedio" value={gdpProm !== null ? `${coma(gdpProm, 2)} kg/día` : "—"} delta={gdpObjProm !== null ? `objetivo: ${coma(gdpObjProm, 2)} kg/día` : "sin objetivo"} trend={gdpProm !== null && gdpObjProm !== null && gdpProm < gdpObjProm ? "down" : "up"} icon="activity" warn={gdpProm !== null && gdpObjProm !== null && gdpProm < gdpObjProm} />
        <KPI label="Listos para Faena" value={nfEng.format(listosCab)} delta={`${listos.length} corrales completos`} trend="up" icon="check-circle" />
        <KPI label="Corrales" value={String(activos.length)} delta={`${activos.reduce((s, c) => s + (c.capacidad || 0), 0)} de capacidad`} icon="grid" />
        <KPI label="Costo por Kg Ganado" value={costoKgProm !== null ? `$${coma(costoKgProm, 2)}` : "—"} delta="USD · promedio del hato" icon="dollar" />
      </div>

      <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--ghost" onClick={exportar} disabled={activos.length === 0}><Icon name="download" size={14} />Exportar</button>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalIngreso(true)}><Icon name="plus" size={14} />Ingreso a Corral</button>
      </div>

      {/* Evolución de peso */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div>
            <div className="mc-card__title">Evolución de Peso del Engorde</div>
            <div className="text-xs text-muted mt-2">Peso promedio ponderado del hato (pesadas reales)</div>
          </div>
          <div className="mc-seg">
            {[30, 60, 90].map((r) => <button key={r} className={rango === r ? "is-on" : ""} onClick={() => setRango(r)}>{r}d</button>)}
          </div>
        </div>
        {!hayChart ? (
          <div className="mc-empty" style={{ padding: "36px 0" }}>
            <div className="mc-empty__icon"><Icon name="activity" size={20} /></div>
            Registrá al menos dos pesadas para ver la curva de evolución de peso.
          </div>
        ) : (
          <>
            <div className="row gap-16 mt-4" style={{ fontSize: 11, color: "var(--mc-text-3)" }}>
              <div className="row gap-4" style={{ alignItems: "center" }}><span style={{ width: 12, height: 2, background: "var(--mc-green-600)", display: "inline-block" }} />Peso real</div>
              <div className="row gap-4" style={{ alignItems: "center" }}><span style={{ width: 12, height: 0, borderTop: "1.5px dashed var(--mc-muted)", display: "inline-block" }} />Objetivo</div>
            </div>
            <div ref={wrapRef} style={{ position: "relative", marginTop: 8 }}>
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
                {yTicks.map((v, gi) => { const y = yFor(v); return (<g key={gi}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--mc-line)" strokeDasharray={gi === 0 ? "0" : "3,3"} strokeWidth={gi === 0 ? 1.5 : 1} /><text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--mc-text-3)">{Math.round(v)}</text></g>); })}
                <path d={objPath} fill="none" stroke="var(--mc-muted)" strokeWidth="1.5" strokeDasharray="4,3" />
                <path d={realPath} fill="none" stroke="var(--mc-green-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((d, i) => (i % xLabelEvery === 0 || i === data.length - 1) && <text key={i} x={xFor(i)} y={padT + chartH + 18} textAnchor="middle" fontSize="10" fill="var(--mc-text-3)">{d.fecha}</text>)}
                <circle cx={realPts[realPts.length - 1][0]} cy={realPts[realPts.length - 1][1]} r="5" fill="var(--mc-green-600)" stroke="var(--mc-surface)" strokeWidth="2" />
                <text x={realPts[realPts.length - 1][0]} y={realPts[realPts.length - 1][1] - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--mc-green-700)">Hoy</text>
                {hov && (<><line x1={hovX} y1={padT} x2={hovX} y2={padT + chartH} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" /><circle cx={hovX} cy={hovY} r="4.5" fill="var(--mc-surface)" stroke="var(--mc-green-600)" strokeWidth="2" /></>)}
                <rect x={padL} y={padT} width={chartW} height={chartH} fill="transparent" onMouseMove={(e) => { const rect = (e.currentTarget as SVGElement).getBoundingClientRect(); const relX = (e.clientX - rect.left) / rect.width; setHoverIdx(Math.max(0, Math.min(data.length - 1, Math.round(relX * (data.length - 1))))); }} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: "crosshair" }} />
              </svg>
              {hov && (
                <div style={{ position: "absolute", left: `${Math.min(94, Math.max(6, (hovX / W) * 100))}%`, top: `${Math.max(0, (hovY / H) * 100 - 14)}%`, transform: "translate(-50%,-100%)", background: "var(--mc-ink)", color: "#fff", borderRadius: 8, padding: "8px 11px", fontSize: 11.5, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.22)" }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{hov.fecha} · {hov.peso} kg promedio</div>
                  <div style={{ opacity: 0.85 }}>Objetivo: {hov.objetivo} kg</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
        {/* Estado de corrales */}
        <div className="mc-card">
          <div className="mc-card__head">
            <div>
              <div className="mc-card__title">Estado de Corrales</div>
              <div className="text-xs text-muted mt-2">{activos.length} corrales activos</div>
            </div>
          </div>
          {activos.length === 0 ? (
            <div className="mc-empty" style={{ padding: "30px 0" }}>
              <div className="mc-empty__icon"><Icon name="grid" size={20} /></div>
              Sin corrales de engorde. Creá el primero con “Ingreso a Corral”.
            </div>
          ) : (
            <div className="col gap-6">
              {activos.map((c) => {
                const g = gdpReal(c);
                const ocup = c.capacidad ? Math.round((c.cabezas / c.capacidad) * 100) : null;
                return (
                  <div key={c.id} onClick={onGoToCorrales} style={{ padding: "12px 14px", border: "1px solid var(--mc-line)", borderRadius: 10, cursor: onGoToCorrales ? "pointer" : "default" }}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13 }}>{c.nombre}</div>
                      <div className="row gap-8" style={{ alignItems: "center" }}>
                        <span className="mc-badge mc-badge--neutral">{c.cabezas} cab.</span>
                        <span className={`mc-badge ${estadoBadge(c)}`}>{estadoTxt(c)}</span>
                      </div>
                    </div>
                    <div className="row gap-12 mt-8" style={{ alignItems: "center" }}>
                      <div className="mc-prog" style={{ flex: 1 }}><div className="mc-prog__bar" style={{ width: `${Math.min(ocup ?? 0, 100)}%` }} /></div>
                      <span className="text-xs text-muted" style={{ flexShrink: 0 }}>{ocup !== null ? `${ocup}% ocup.` : "s/cap."}</span>
                      <span className="text-xs font-mono" style={{ flexShrink: 0, color: "var(--mc-text-2)" }}>{g !== null ? `${coma(g, 2)} kg/d` : "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="mc-card">
          <div className="mc-card__head">
            <div>
              <div className="mc-card__title">Alertas de Bajo Rendimiento</div>
              <div className="text-xs text-muted mt-2">Corrales por debajo del GDP objetivo</div>
            </div>
            {alertas.length > 0 && <span className="mc-badge mc-badge--red">{alertas.length}</span>}
          </div>
          {alertas.length === 0 ? (
            <div className="mc-empty" style={{ padding: "30px 0" }}>
              <div className="mc-empty__icon" style={{ background: "var(--mc-green-50)", color: "var(--mc-green-600)" }}><Icon name="check-circle" size={20} /></div>
              Todas las tropas cumplen su objetivo de GDP
            </div>
          ) : (
            <div className="col gap-8">
              {alertas.map((c) => {
                const g = gdpReal(c)!;
                const pct = c.gdpObjetivo ? Math.round((g / c.gdpObjetivo) * 100) : 0;
                return (
                  <div key={c.id} style={{ padding: "12px 14px", border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div className="row gap-8" style={{ alignItems: "center" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--mc-red-bg)", color: "var(--mc-red)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="alert-triangle" size={14} /></div>
                        <div>
                          <div className="font-semi" style={{ fontSize: 13, color: "var(--mc-ink)" }}>{c.nombre}</div>
                          <div className="text-xs text-muted mt-2">GDP {coma(g, 2)} kg/d · objetivo {coma(c.gdpObjetivo!, 2)} ({pct}%)</div>
                        </div>
                      </div>
                      <span className="mc-badge mc-badge--red" style={{ flexShrink: 0 }}>Crítico</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
