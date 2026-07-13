"use client";

// Pestaña Calidad: evolución de RCS/grasa/proteína de los análisis de
// laboratorio (boletas tipo "calidad"), semáforo del último análisis e
// historial. Modal para registrar un análisis nuevo. Datos reales.

import React, { useMemo, useState } from "react";
import { Icon, useToast } from "@/components/mc";
import { BoletaAPI } from "./lechera-tipos";
import { PLModalCalidad } from "./lechera-modales";

const MES_ABREV = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const fmtCorto = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MES_ABREV[d.getMonth()]}`;
};

export function PLCalidad({ boletas, onRefresh }: { boletas: BoletaAPI[]; onRefresh: () => void }) {
  const toast = useToast();
  const [chartView, setChartView] = useState<"RCS" | "Grasa" | "Proteína" | "Todos">("Todos");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [modal, setModal] = useState(false);
  const [ahora] = useState(() => Date.now());

  // Análisis de calidad ordenados asc (con datos de RCS/grasa/proteína)
  const analisis = useMemo(
    () =>
      boletas
        .filter((b) => b.tipo === "calidad" && (b.ccs != null || b.grasa != null || b.proteina != null))
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .slice(-16),
    [boletas]
  );

  const ultimo = analisis.length ? analisis[analisis.length - 1] : null;
  const hayDatos = analisis.length > 0;

  // Próximo análisis: 30 días después del último
  const proxDias = ultimo ? Math.ceil((new Date(ultimo.fecha).getTime() + 30 * 24 * 3600 * 1000 - ahora) / (24 * 3600 * 1000)) : null;
  const diasUltimo = ultimo ? Math.floor((ahora - new Date(ultimo.fecha).getTime()) / (24 * 3600 * 1000)) : null;

  const kpis = [
    { label: "RCS", ico: "microscope", val: ultimo?.ccs != null ? `${Math.round(ultimo.ccs)} mil` : "—", sub: ultimo?.ccs != null ? (ultimo.ccs < 200 ? "cél/ml · Buena calidad (<200k)" : "cél/ml · Alto (≥200k)") : "sin análisis", color: ultimo?.ccs != null ? (ultimo.ccs < 200 ? "var(--mc-green-700)" : "var(--mc-red)") : undefined },
    { label: "Grasa", ico: "droplets", val: ultimo?.grasa != null ? `${ultimo.grasa.toFixed(1).replace(".", ",")}%` : "—", sub: ultimo?.grasa != null ? (ultimo.grasa >= 3.5 ? "objetivo >3,5% · ✓ cumple" : "objetivo >3,5% · ✗") : "sin análisis", color: ultimo?.grasa != null ? (ultimo.grasa >= 3.5 ? "var(--mc-green-700)" : "var(--mc-red)") : undefined },
    { label: "Proteína", ico: "bolt", val: ultimo?.proteina != null ? `${ultimo.proteina.toFixed(1).replace(".", ",")}%` : "—", sub: ultimo?.proteina != null ? (ultimo.proteina >= 3.0 ? "objetivo >3,0% · ✓ cumple" : "objetivo >3,0% · ✗") : "sin análisis", color: ultimo?.proteina != null ? (ultimo.proteina >= 3.0 ? "var(--mc-green-700)" : "var(--mc-red)") : undefined },
    { label: "Temperatura Tanque", ico: "thermometer", val: ultimo?.temperatura != null ? `${ultimo.temperatura.toFixed(1).replace(".", ",")}°C` : "—", sub: ultimo?.temperatura != null ? (ultimo.temperatura <= 6 ? "máx. permitido: 6°C · ok" : "máx. 6°C · ✗") : "sin análisis", color: ultimo?.temperatura != null ? (ultimo.temperatura <= 6 ? "var(--mc-green-700)" : "var(--mc-red)") : undefined },
    { label: "Próximo Análisis", ico: "calendar", val: proxDias !== null ? (proxDias <= 0 ? "Pendiente" : `En ${proxDias} días`) : "—", sub: diasUltimo !== null ? `último análisis: hace ${diasUltimo} días` : "sin análisis previos", color: "var(--mc-amber)" },
  ];

  // Geometría chart
  const N = analisis.length;
  const SW = 620, SH = 210, pL = 52, pR = 52, pT = 16, pB = 36;
  const cW = SW - pL - pR, cH = SH - pT - pB;
  const RCS_MAX = Math.max(370, ...analisis.map((a) => a.ccs || 0)), RCS_MIN = 0, PC_MAX = 5.0, PC_MIN = 2.5;
  const xp = (i: number) => pL + (N > 1 ? (i / (N - 1)) * cW : cW / 2);
  const yR = (v: number) => pT + cH - ((v - RCS_MIN) / (RCS_MAX - RCS_MIN)) * cH;
  const yP = (v: number) => pT + cH - ((v - PC_MIN) / (PC_MAX - PC_MIN)) * cH;
  const mkPath = (pts: [number, number][]) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  const showRCS = chartView === "RCS" || chartView === "Todos";
  const showGr = chartView === "Grasa" || chartView === "Todos";
  const showPr = chartView === "Proteína" || chartView === "Todos";

  const rcsC: [number, number][] = analisis.map((a, i) => (a.ccs != null ? [xp(i), yR(a.ccs)] : null)).filter((p): p is [number, number] => p !== null);
  const grC: [number, number][] = analisis.map((a, i) => (a.grasa != null ? [xp(i), yP(a.grasa)] : null)).filter((p): p is [number, number] => p !== null);
  const prC: [number, number][] = analisis.map((a, i) => (a.proteina != null ? [xp(i), yP(a.proteina)] : null)).filter((p): p is [number, number] => p !== null);

  const handleSvgMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * SW;
    let best = 0, bestD = 9999;
    analisis.forEach((_, i) => { const d = Math.abs(xp(i) - svgX); if (d < bestD) { bestD = d; best = i; } });
    setHoverIdx(bestD < 28 ? best : null);
  };

  const semaforo = ultimo
    ? [
        { ico: "flask", label: "RCS", val: ultimo.ccs != null ? `${Math.round(ultimo.ccs * 1000).toLocaleString("es-AR")} cél/ml` : "—", range: "Límite: 200.000", ok: ultimo.ccs == null || ultimo.ccs < 200 },
        { ico: "droplet", label: "Grasa", val: ultimo.grasa != null ? `${ultimo.grasa.toFixed(1).replace(".", ",")}%` : "—", range: "Mínimo: 3,5%", ok: ultimo.grasa == null || ultimo.grasa >= 3.5 },
        { ico: "bolt", label: "Proteína", val: ultimo.proteina != null ? `${ultimo.proteina.toFixed(1).replace(".", ",")}%` : "—", range: "Mínimo: 3,0%", ok: ultimo.proteina == null || ultimo.proteina >= 3.0 },
        { ico: "thermometer", label: "Temperatura", val: ultimo.temperatura != null ? `${ultimo.temperatura.toFixed(1).replace(".", ",")}°C` : "—", range: "Máximo: 6°C", ok: ultimo.temperatura == null || ultimo.temperatura <= 6 },
      ]
    : [];
  const todoOk = semaforo.every((s) => s.ok);

  const historial = useMemo(() => [...analisis].reverse().slice(0, 6), [analisis]);

  const exportarCSV = () => {
    const filas = [
      ["Fecha", "Laboratorio", "N° informe", "RCS (k)", "Grasa %", "Proteína %", "Temp °C"],
      ...[...analisis].reverse().map((a) => [fmtCorto(a.fecha), a.industria || "", a.numero || "", a.ccs != null ? String(a.ccs) : "", a.grasa != null ? String(a.grasa) : "", a.proteina != null ? String(a.proteina) : "", a.temperatura != null ? String(a.temperatura) : ""]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "calidad-leche.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="col gap-16">
      {toast.node}
      {modal && <PLModalCalidad onClose={() => setModal(false)} onGuardado={() => { toast.show("Análisis registrado"); onRefresh(); }} />}

      {/* KPIs */}
      <div className="grid g-cols-5">
        {kpis.map((k, i) => (
          <div key={i} className="mc-kpi">
            <span className="mc-kpi__glyph"><Icon name={k.ico} size={14} /></span>
            <div className="mc-kpi__label">{k.label}</div>
            <div className="mc-kpi__value" style={{ color: k.color }}>{k.val}</div>
            <div className="mc-kpi__delta">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--secondary" onClick={exportarCSV} disabled={!hayDatos}><Icon name="download" size={14} />Exportar historial</button>
        <button className="mc-btn mc-btn--primary" onClick={() => setModal(true)}><Icon name="plus" size={14} />Registrar Análisis</button>
      </div>

      {/* Evolución */}
      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--mc-ink)" }}>Evolución de Calidad</div>
            <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 1 }}>Análisis registrados</div>
          </div>
          <div style={{ display: "flex", background: "var(--mc-surface-3)", borderRadius: "var(--r-pill)", border: "1px solid var(--mc-line)", padding: 3, gap: 2 }}>
            {(["RCS", "Grasa", "Proteína", "Todos"] as const).map((v) => {
              const on = chartView === v;
              const col = v === "RCS" ? "var(--mc-green-700)" : v === "Grasa" ? "var(--mc-blue)" : v === "Proteína" ? "var(--mc-amber)" : "var(--mc-ink)";
              return <button key={v} onClick={() => setChartView(v)} style={{ padding: "5px 11px", border: "none", borderRadius: "var(--r-pill)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: on ? "var(--mc-surface)" : "transparent", color: on ? col : "var(--mc-text-3)", boxShadow: on ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>{v}</button>;
            })}
          </div>
        </div>
        <div style={{ padding: "16px 20px 12px" }}>
          {!hayDatos ? (
            <div className="mc-empty" style={{ padding: "36px 0" }}>
              <div className="mc-empty__icon"><Icon name="microscope" size={20} /></div>
              Sin análisis de calidad registrados. Cargá el primer resultado de laboratorio con “Registrar Análisis”.
            </div>
          ) : (
            <>
              <svg viewBox={`0 0 ${SW} ${SH}`} width="100%" height="auto" style={{ overflow: "visible", display: "block" }} onMouseMove={handleSvgMove} onMouseLeave={() => setHoverIdx(null)}>
                <defs><clipPath id="calClip"><rect x={pL} y={pT} width={cW} height={cH} /></clipPath></defs>
                {showRCS && (
                  <>
                    <line x1={pL} y1={yR(200)} x2={pL + cW} y2={yR(200)} stroke="rgba(201,52,52,0.45)" strokeWidth={1} strokeDasharray="5 3" />
                    <text x={pL + cW + 4} y={yR(200) + 4} fontSize={9} fill="rgba(201,52,52,.8)" fontFamily="var(--ff-mono)">200k</text>
                  </>
                )}
                {[2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((v) => (
                  <g key={v}>
                    <line x1={pL} y1={yP(v)} x2={pL + cW} y2={yP(v)} stroke="var(--mc-line)" strokeWidth={1} />
                    {(showGr || showPr) && <text x={pL - 4} y={yP(v) + 4} textAnchor="end" fontSize={9} fill="var(--mc-text-3)" fontFamily="var(--ff-mono)">{v}%</text>}
                  </g>
                ))}
                {showRCS && [0, 100, 200, 300].map((v) => <text key={v} x={pL + cW + (showGr || showPr ? 36 : 4)} y={yR(v) + 4} fontSize={9} fill="var(--mc-text-3)" fontFamily="var(--ff-mono)">{v}k</text>)}
                <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="var(--mc-line-2)" strokeWidth={1} />
                {analisis.map((a, i) => (N <= 8 || i % 2 === 0) && <text key={i} x={xp(i)} y={pT + cH + 13} textAnchor="middle" fontSize={9} fill="var(--mc-text-3)">{fmtCorto(a.fecha)}</text>)}
                {showGr && grC.length > 1 && <path d={mkPath(grC)} fill="none" stroke="var(--mc-blue)" strokeWidth={2} strokeLinecap="round" clipPath="url(#calClip)" />}
                {showPr && prC.length > 1 && <path d={mkPath(prC)} fill="none" stroke="var(--mc-amber)" strokeWidth={2} strokeLinecap="round" clipPath="url(#calClip)" />}
                {showRCS && rcsC.length > 1 && <path d={mkPath(rcsC)} fill="none" stroke="var(--mc-green-600)" strokeWidth={2.5} strokeLinecap="round" clipPath="url(#calClip)" />}
                {analisis.map((a, i) => {
                  const hi = hoverIdx === i;
                  return (
                    <g key={i}>
                      {showRCS && a.ccs != null && <circle cx={xp(i)} cy={yR(a.ccs)} r={hi ? 6 : a.ccs >= 200 ? 5 : 4} fill={a.ccs >= 200 ? "var(--mc-red)" : "var(--mc-surface)"} stroke={a.ccs >= 200 ? "var(--mc-red)" : "var(--mc-green-600)"} strokeWidth={2} />}
                      {showGr && a.grasa != null && <circle cx={xp(i)} cy={yP(a.grasa)} r={hi ? 5 : 3} fill="var(--mc-surface)" stroke="var(--mc-blue)" strokeWidth={2} />}
                      {showPr && a.proteina != null && <circle cx={xp(i)} cy={yP(a.proteina)} r={hi ? 5 : 3} fill="var(--mc-surface)" stroke="var(--mc-amber)" strokeWidth={2} />}
                    </g>
                  );
                })}
                {hoverIdx !== null && analisis[hoverIdx] && (() => {
                  const a = analisis[hoverIdx], ox = xp(hoverIdx), flip = ox > SW * 0.6;
                  const rows = [showRCS && a.ccs != null && ["RCS", `${Math.round(a.ccs)}k cél/ml`, "var(--mc-green-600)"], showGr && a.grasa != null && ["Grasa", `${a.grasa.toFixed(1)}%`, "var(--mc-blue)"], showPr && a.proteina != null && ["Proteína", `${a.proteina.toFixed(1)}%`, "var(--mc-amber)"]].filter(Boolean) as [string, string, string][];
                  const th = 18 + rows.length * 15 + 14;
                  return (
                    <g>
                      <line x1={ox} y1={pT} x2={ox} y2={pT + cH} stroke="var(--mc-text-3)" strokeWidth={1} strokeDasharray="2 2" opacity={0.3} />
                      <g transform={`translate(${flip ? ox - 158 : ox + 10},${pT + 6})`}>
                        <rect x={0} y={0} width={148} height={th} rx={7} fill="var(--mc-surface)" stroke="var(--mc-line)" strokeWidth={1} style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.10))" }} />
                        <text x={74} y={15} textAnchor="middle" fontSize={9.5} fill="var(--mc-text-3)" fontWeight="600">{fmtCorto(a.fecha)}{a.industria ? ` · ${a.industria}` : ""}</text>
                        {rows.map(([k, v, col], j) => (
                          <g key={k}>
                            <circle cx={12} cy={26 + j * 15} r={3} fill={col} />
                            <text x={20} y={30 + j * 15} fontSize={10} fill="var(--mc-ink)">{k}: {v}</text>
                          </g>
                        ))}
                      </g>
                    </g>
                  );
                })()}
              </svg>
              <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                {showRCS && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="var(--mc-green-600)" strokeWidth="2.5" strokeLinecap="round" /></svg><span style={{ fontSize: 11, color: "var(--mc-text-2)" }}>RCS</span></div>}
                {showGr && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="var(--mc-blue)" strokeWidth="2" strokeLinecap="round" /></svg><span style={{ fontSize: 11, color: "var(--mc-text-2)" }}>Grasa %</span></div>}
                {showPr && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="var(--mc-amber)" strokeWidth="2" strokeLinecap="round" /></svg><span style={{ fontSize: 11, color: "var(--mc-text-2)" }}>Proteína %</span></div>}
                {showRCS && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--mc-red)" }} /><span style={{ fontSize: 11, color: "var(--mc-text-2)" }}>RCS ≥ 200k</span></div>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Semáforo + Historial */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, alignItems: "stretch" }}>
        <div className="mc-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>Calidad Actual</div>
            {ultimo && <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{fmtCorto(ultimo.fecha)}</div>}
          </div>
          {ultimo ? (
            <>
              <div className="col gap-8">
                {semaforo.map((s, i) => {
                  const color = s.ok ? "var(--mc-green-600)" : "var(--mc-red)";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)" }}>
                      <Icon name={s.ico} size={14} style={{ color: "var(--mc-text-3)", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>{s.val}</div>
                        <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>{s.label} · {s.range}</div>
                      </div>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 0 3px ${color}33` }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12 }}>
                <span className={`mc-badge ${todoOk ? "mc-badge--green" : "mc-badge--red"}`} style={{ fontSize: 12, padding: "5px 12px" }}>{todoOk ? "✓ Calidad Aprobada" : "⚠ Calidad Observada"}</span>
              </div>
            </>
          ) : (
            <div className="mc-empty" style={{ padding: "24px 0" }}>
              <div className="mc-empty__icon"><Icon name="flask" size={20} /></div>
              Sin análisis registrados
            </div>
          )}
        </div>

        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--mc-line)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>Historial</div>
            <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 1 }}>Últimos {historial.length} análisis</div>
          </div>
          {historial.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "var(--mc-text-3)" }}>Sin registros todavía.</div>
          ) : (
            historial.map((r, i) => {
              const ok = (r.ccs == null || r.ccs < 200) && (r.grasa == null || r.grasa >= 3.5) && (r.proteina == null || r.proteina >= 3.0);
              return (
                <div key={r.id} style={{ padding: "9px 14px", borderBottom: i < historial.length - 1 ? "1px solid var(--mc-line)" : "none", background: ok ? "transparent" : "var(--mc-amber-bg)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)", fontFamily: "var(--ff-mono)" }}>{fmtCorto(r.fecha)}</span>
                    {r.industria && <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>· {r.industria}</span>}
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: ok ? "var(--mc-green-50)" : "var(--mc-amber-bg)", color: ok ? "var(--mc-green-700)" : "var(--mc-amber)", border: `1px solid ${ok ? "var(--mc-green-200)" : "rgba(196,132,16,.2)"}` }}>{ok ? "✓ Ok" : "⚠ Atención"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--mc-text-3)", fontFamily: "var(--ff-mono)" }}>
                    {r.ccs != null ? `RCS ${Math.round(r.ccs)}k` : ""}{r.grasa != null ? ` · Gr ${r.grasa.toFixed(1)}` : ""}{r.proteina != null ? ` · Pr ${r.proteina.toFixed(1)}` : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
