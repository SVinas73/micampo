"use client";

// Pestaña Curvas: curva de lactancia (modelo de Wood ajustado a datos reales),
// recomendación IA (/api/produccion-lechera/recomendacion), ranking de vacas
// vs su curva esperada y proyecciones. Todo derivado de datos reales.

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Icon, SubTabs } from "@/components/mc";
import {
  VacaLechera,
  WoodParams,
  fitWood,
  integrarWood,
  nfLt,
  wood,
} from "./lechera-tipos";

type RecomendacionIA = {
  analisis: string;
  acciones: { titulo: string; detalle: string }[];
  fuente: "ia" | "reglas";
  simulado?: boolean;
} | null;

export function PLCurvas({ vacas, esperada }: { vacas: VacaLechera[]; esperada: WoodParams }) {
  const [selVaca, setSelVaca] = useState("rodeo");
  const [tooltip, setTooltip] = useState<{ del: number; real: string; exp: string; ox: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [rankVista, setRankVista] = useState("Mejores");
  const [iaExpanded, setIaExpanded] = useState(false);
  const [iaChecked, setIaChecked] = useState<boolean[]>([]);
  const [ia, setIa] = useState<RecomendacionIA>(null);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState("");

  const enOrdenne = useMemo(() => vacas.filter((v) => v.enOrdenne && v.puntosDEL.length > 0), [vacas]);

  // Curva del rodeo: ajuste de Wood sobre todos los puntos (DEL, litros) reales
  const paramsRodeo = useMemo(() => {
    const pts = enOrdenne.flatMap((v) => v.puntosDEL);
    return fitWood(pts) || esperada;
  }, [enOrdenne, esperada]);

  const paramsPorVaca = useMemo(() => {
    const m = new Map<string, WoodParams>();
    for (const v of enOrdenne) {
      const p = fitWood(v.puntosDEL);
      if (p) m.set(v.dbId, p);
    }
    return m;
  }, [enOrdenne]);

  const vacaOpts = useMemo(
    () => [{ val: "rodeo", lbl: "Rodeo completo (promedio)" }, ...enOrdenne.filter((v) => paramsPorVaca.has(v.dbId)).map((v) => ({ val: v.dbId, lbl: `Vaca #${v.caravana}` }))],
    [enOrdenne, paramsPorVaca]
  );

  const isRodeo = selVaca === "rodeo";
  const realParams = isRodeo ? paramsRodeo : paramsPorVaca.get(selVaca) || paramsRodeo;
  const selVacaObj = enOrdenne.find((v) => v.dbId === selVaca);
  const curDEL = isRodeo
    ? (() => { const ds = enOrdenne.filter((v) => v.del !== null).map((v) => v.del!); return ds.length ? Math.round(ds.reduce((a, b) => a + b, 0) / ds.length) : 127; })()
    : selVacaObj?.del ?? 127;

  const hayDatos = enOrdenne.length > 0;

  // Geometría del chart
  const SW = 680, SH = 240, pL = 52, pR = 24, pT = 18, pB = 36;
  const cW = SW - pL - pR, cH = SH - pT - pB;
  const Y_MAX = 35, DEL_MAX = 305;
  const xs = (d: number) => pL + (d / DEL_MAX) * cW;
  const ys = (v: number) => pT + cH - (v / Y_MAX) * cH;
  const DELS = Array.from({ length: 61 }, (_, i) => (i + 1) * 5);

  const makeLine = (p: WoodParams) => DELS.map((t, i) => `${i === 0 ? "M" : "L"}${xs(t).toFixed(1)},${ys(wood(t, p)).toFixed(1)}`).join(" ");
  const makeBand = (top: WoodParams, bot: WoodParams) => {
    const fwd = DELS.map((t, i) => `${i === 0 ? "M" : "L"}${xs(t).toFixed(1)},${ys(wood(t, top)).toFixed(1)}`);
    const bwd = [...DELS].reverse().map((t) => `L${xs(t).toFixed(1)},${ys(wood(t, bot)).toFixed(1)}`);
    return [...fwd, ...bwd, "Z"].join(" ");
  };

  const curRealY = wood(curDEL, realParams);
  const peakDELexp = esperada.b / esperada.c;
  const peakYexp = wood(peakDELexp, esperada);

  // Persistencia real: caída mensual promedio desde el pico
  const peakDELreal = realParams.b / realParams.c;
  const peakYreal = wood(peakDELreal, realParams);
  const persistEndDEL = Math.min(curDEL, DEL_MAX);
  const monthsSincePeak = persistEndDEL > peakDELreal ? (persistEndDEL - peakDELreal) / 30 : 0;
  const persistEndY = wood(persistEndDEL, realParams);
  const totalDropPct = peakYreal > 0 ? Math.max(0, ((peakYreal - persistEndY) / peakYreal) * 100) : 0;
  const avgMonthlyDropPct = monthsSincePeak > 0.15 ? totalDropPct / monthsSincePeak : null;
  const persistTone =
    avgMonthlyDropPct == null ? { bg: "var(--mc-surface-2)", fg: "var(--mc-text-3)" } :
    avgMonthlyDropPct <= 6 ? { bg: "var(--mc-green-50)", fg: "var(--mc-green-700)" } :
    avgMonthlyDropPct <= 9 ? { bg: "var(--mc-amber-bg)", fg: "var(--mc-amber)" } :
    { bg: "var(--mc-red-bg)", fg: "var(--mc-red)" };

  const acumHastaHoy = integrarWood(realParams, persistEndDEL);
  const acum305Esperado = integrarWood(esperada, DEL_MAX);

  // KPIs de rodeo derivados
  const persistencia = avgMonthlyDropPct == null ? null : Math.max(0, Math.round(100 - avgMonthlyDropPct * 3));
  const picoRodeo = wood(peakDELreal, paramsRodeo);
  const delAlPico = Math.round(paramsRodeo.b / paramsRodeo.c);
  const proyeccionAnual = Math.round(integrarWood(paramsRodeo, DEL_MAX));
  const bajoCurva7 = vacas.filter((v) => v.enOrdenne && v.estado === "Bajo curva").length;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * SW;
      const del = Math.max(5, Math.min(DEL_MAX, ((svgX - pL) / cW) * DEL_MAX));
      const dr = Math.round(del / 5) * 5 || 5;
      setTooltip({ del: dr, real: wood(dr, realParams).toFixed(1), exp: wood(dr, esperada).toFixed(1), ox: xs(dr) });
    },
    [realParams, esperada, cW]
  );

  // Ranking: vacas vs su curva esperada (por % del esperado hoy)
  const ranking = useMemo(() => {
    const rows = vacas
      .filter((v) => v.enOrdenne && v.pct !== null && v.hoy !== null)
      .map((v) => ({ v, pct: v.pct!, diff: v.pct!, ok: v.pct! >= 100, hoy: Math.round(v.hoy!) }));
    const mejores = [...rows].sort((a, b) => b.pct - a.pct).slice(0, 5);
    const peores = [...rows].sort((a, b) => a.pct - b.pct).slice(0, 5);
    return { mejores, peores };
  }, [vacas]);
  const rankList = rankVista === "Mejores" ? ranking.mejores : ranking.peores;

  const pedirIA = async () => {
    setIaLoading(true);
    setIaError("");
    try {
      const r = await fetch("/api/produccion-lechera/recomendacion", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Error");
      setIa(d);
      setIaChecked(new Array((d.acciones || []).length).fill(false));
      setIaExpanded(true);
    } catch {
      setIaError("No se pudo generar la recomendación. Reintentá en unos segundos.");
    } finally {
      setIaLoading(false);
    }
  };

  return (
    <div className="col gap-16">
      {/* KPIs */}
      <div className="grid g-cols-5">
        <div className="mc-kpi">
          <span className="mc-kpi__glyph"><Icon name="activity" size={14} /></span>
          <div className="mc-kpi__label">Persistencia</div>
          <div className="mc-kpi__value" style={{ color: "var(--mc-green-600)" }}>{persistencia !== null ? persistencia : "—"}<span style={{ fontSize: "0.55em", fontWeight: 500, color: "var(--mc-muted)", marginLeft: 1 }}>{persistencia !== null ? "%" : ""}</span></div>
          <div className="mc-kpi__delta">tasa de sostenimiento post-pico</div>
        </div>
        <div className="mc-kpi">
          <span className="mc-kpi__glyph"><Icon name="arrowUp" size={14} /></span>
          <div className="mc-kpi__label">Pico de Producción</div>
          <div className="mc-kpi__value">{hayDatos ? picoRodeo.toFixed(1).replace(".", ",") : "—"}<span style={{ fontSize: "0.55em", fontWeight: 500, color: "var(--mc-muted)", marginLeft: 3 }}>{hayDatos ? "lt" : ""}</span></div>
          <div className="mc-kpi__delta">promedio del rodeo ajustado</div>
        </div>
        <div className="mc-kpi">
          <span className="mc-kpi__glyph"><Icon name="calendar" size={14} /></span>
          <div className="mc-kpi__label">DEL al Pico</div>
          <div className="mc-kpi__value">{hayDatos && delAlPico > 0 ? delAlPico : "—"}<span style={{ fontSize: "0.55em", fontWeight: 500, color: "var(--mc-muted)", marginLeft: 3 }}>{hayDatos && delAlPico > 0 ? "días" : ""}</span></div>
          <div className="mc-kpi__delta">tiempo promedio hasta el pico</div>
        </div>
        <div className="mc-kpi">
          <span className="mc-kpi__glyph"><Icon name="chart" size={14} /></span>
          <div className="mc-kpi__label">Proyección Anual</div>
          <div className="mc-kpi__value">{hayDatos ? nfLt.format(proyeccionAnual) : "—"}<span style={{ fontSize: "0.55em", fontWeight: 500, color: "var(--mc-muted)", marginLeft: 3 }}>{hayDatos ? "lt" : ""}</span></div>
          <div className="mc-kpi__delta">estimado por vaca (305 días)</div>
        </div>
        <div className={`mc-kpi ${bajoCurva7 > 0 ? "mc-kpi--warn" : ""}`}>
          <span className="mc-kpi__glyph"><Icon name="alert" size={14} /></span>
          <div className="mc-kpi__label">Bajo Curva</div>
          <div className="mc-kpi__value" style={{ color: bajoCurva7 > 0 ? "var(--mc-red)" : undefined }}>{bajoCurva7}<span style={{ fontSize: "0.55em", fontWeight: 500, color: "var(--mc-muted)", marginLeft: 3 }}>vacas</span></div>
          <div className="mc-kpi__delta">produciendo por debajo de lo esperado</div>
        </div>
      </div>

      {!hayDatos ? (
        <div className="mc-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div className="mc-empty__icon" style={{ margin: "0 auto 12px" }}><Icon name="chart" size={22} /></div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 6 }}>Todavía no hay suficientes datos para la curva de lactancia</div>
          <div style={{ fontSize: 13, color: "var(--mc-text-2)", maxWidth: 460, margin: "0 auto" }}>
            Registrá partos (fecha de parto) y ordeñes diarios de tus vacas. Con al menos 5 puntos de producción por vaca, el sistema ajusta el modelo de Wood a tus datos reales.
          </div>
        </div>
      ) : (
        <>
          {/* Curva de Lactancia */}
          <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>Curva de Lactancia</div>
                <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>Días en leche (DEL) vs Producción (lt/vaca/día) · modelo de Wood ajustado</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <select value={selVaca} onChange={(e) => setSelVaca(e.target.value)} className="mc-select" style={{ width: 230, fontSize: 12 }}>
                  {vacaOpts.map((o) => <option key={o.val} value={o.val}>{o.lbl}</option>)}
                </select>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5px 14px", borderRadius: 10, background: persistTone.bg, minWidth: 118 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Persistencia</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: persistTone.fg }}>{avgMonthlyDropPct == null ? "—" : `-${avgMonthlyDropPct.toFixed(1)}%/mes`}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: "16px 20px 0", position: "relative" }} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
              <svg ref={svgRef} viewBox={`0 0 ${SW} ${SH}`} width="100%" height="auto" style={{ overflow: "visible", display: "block" }}>
                <defs>
                  <clipPath id="plCrvClip"><rect x={pL} y={pT} width={cW} height={cH} /></clipPath>
                </defs>
                {[5, 10, 15, 20, 25, 30, 35].map((v) => (
                  <g key={v}>
                    <line x1={pL} y1={ys(v)} x2={pL + cW} y2={ys(v)} stroke="var(--mc-line)" strokeWidth={1} />
                    <text x={pL - 6} y={ys(v) + 4} textAnchor="end" fontSize={9} fill="var(--mc-text-3)" fontFamily="var(--ff-mono)">{v} lt</text>
                  </g>
                ))}
                <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="var(--mc-line-2)" strokeWidth={1} />
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 305].map((d) => (
                  <g key={d}>
                    <line x1={xs(d)} y1={pT + cH} x2={xs(d)} y2={pT + cH + 4} stroke="var(--mc-line-2)" strokeWidth={1} />
                    <text x={xs(d)} y={pT + cH + 14} textAnchor="middle" fontSize={9} fill="var(--mc-text-3)">{d === 0 ? "0" : `${d} DEL`}</text>
                  </g>
                ))}
                <g clipPath="url(#plCrvClip)">
                  <path d={makeBand(esperada, realParams)} fill="rgba(201,52,52,0.08)" stroke="none" />
                  <path d={makeBand(realParams, esperada)} fill="rgba(0,167,56,0.08)" stroke="none" />
                </g>
                <path d={makeLine(esperada)} fill="none" stroke="#b3b0a6" strokeWidth={1.5} strokeDasharray="7 4" clipPath="url(#plCrvClip)" />
                {!isRodeo && <path d={makeLine(paramsRodeo)} fill="none" stroke="var(--mc-muted)" strokeWidth={1.5} opacity={0.7} clipPath="url(#plCrvClip)" />}
                <path d={makeLine(realParams)} fill="none" stroke="var(--mc-green-600)" strokeWidth={2.5} strokeLinecap="round" clipPath="url(#plCrvClip)" />

                {/* Puntos reales de la vaca/rodeo seleccionado */}
                {(isRodeo ? enOrdenne.flatMap((v) => v.puntosDEL) : selVacaObj?.puntosDEL || []).filter((p) => p.del <= DEL_MAX).map((p, i) => (
                  <circle key={i} cx={xs(p.del)} cy={ys(Math.min(p.litros, Y_MAX))} r={1.6} fill="var(--mc-green-600)" opacity={isRodeo ? 0.25 : 0.55} clipPath="url(#plCrvClip)" />
                ))}

                {/* Marcador DEL actual */}
                {curDEL <= DEL_MAX && (() => {
                  const ox = xs(curDEL), oy = ys(Math.min(curRealY, Y_MAX));
                  const flip = ox > SW * 0.62;
                  return (
                    <g>
                      <line x1={ox} y1={pT} x2={ox} y2={pT + cH} stroke="var(--mc-green-600)" strokeWidth={1} strokeDasharray="3 3" opacity={0.45} />
                      <circle cx={ox} cy={oy} r={6} fill="var(--mc-surface)" stroke="var(--mc-green-600)" strokeWidth={2.5} />
                      <g transform={`translate(${flip ? ox - 150 : ox + 10},${oy - 28})`}>
                        <rect x={0} y={0} width={140} height={24} rx={5} fill="var(--mc-ink)" opacity={0.86} />
                        <text x={70} y={15.5} textAnchor="middle" fontSize={10} fill="white">DEL {curDEL} · {curRealY.toFixed(1)} lt {isRodeo ? "prom." : ""}</text>
                      </g>
                    </g>
                  );
                })()}

                {/* Pico esperado */}
                {peakDELexp > 0 && peakDELexp <= DEL_MAX && (() => {
                  const px = xs(peakDELexp), py = ys(peakYexp);
                  const flip = px > SW * 0.72;
                  return (
                    <g>
                      <path d={`M${px.toFixed(1)},${(py - 6).toFixed(1)} L${(px + 6).toFixed(1)},${py.toFixed(1)} L${px.toFixed(1)},${(py + 6).toFixed(1)} L${(px - 6).toFixed(1)},${py.toFixed(1)} Z`} fill="var(--mc-surface)" stroke="#8b5cf6" strokeWidth={2} />
                      <g transform={`translate(${flip ? px - 124 : px + 9},${py - 28})`}>
                        <rect x={0} y={0} width={116} height={20} rx={5} fill="#8b5cf6" />
                        <text x={58} y={13.5} textAnchor="middle" fontSize={9.5} fill="white" fontWeight={700}>Pico esp.: {Math.round(peakDELexp)}d · {peakYexp.toFixed(1)} lt</text>
                      </g>
                    </g>
                  );
                })()}

                {/* Tooltip */}
                {tooltip && (() => {
                  const flip = tooltip.ox > SW * 0.58;
                  return (
                    <g>
                      <line x1={tooltip.ox} y1={pT} x2={tooltip.ox} y2={pT + cH} stroke="var(--mc-text-3)" strokeWidth={1} strokeDasharray="2 2" opacity={0.35} />
                      <g transform={`translate(${flip ? tooltip.ox - 150 : tooltip.ox + 10},${pT + 6})`}>
                        <rect x={0} y={0} width={140} height={56} rx={7} fill="var(--mc-surface)" stroke="var(--mc-line)" strokeWidth={1} style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.10))" }} />
                        <text x={70} y={16} textAnchor="middle" fontSize={10} fill="var(--mc-text-3)">DEL {tooltip.del}</text>
                        <circle cx={14} cy={30} r={3} fill="var(--mc-green-600)" />
                        <text x={22} y={34} fontSize={10} fill="var(--mc-ink)">{isRodeo ? "Rodeo" : "Real"}: {tooltip.real} lt</text>
                        <circle cx={14} cy={44} r={3} fill="#b3b0a6" />
                        <text x={22} y={48} fontSize={10} fill="var(--mc-ink)">Esperado: {tooltip.exp} lt</text>
                      </g>
                    </g>
                  );
                })()}
              </svg>

              <div style={{ display: "flex", gap: 18, alignItems: "center", padding: "10px 2px 12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="26" height="10"><line x1="0" y1="5" x2="26" y2="5" stroke="#b3b0a6" strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round" /></svg>
                  <span style={{ fontSize: 11, color: "var(--mc-text-2)" }}>Curva esperada (Wood)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="26" height="10"><line x1="0" y1="5" x2="26" y2="5" stroke="var(--mc-green-600)" strokeWidth="2.5" strokeLinecap="round" /></svg>
                  <span style={{ fontSize: 11, color: "var(--mc-text-2)" }}>Curva real (ajustada)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2.5px solid var(--mc-green-600)", background: "var(--mc-surface)" }} />
                  <span style={{ fontSize: 11, color: "var(--mc-text-2)" }}>Posición actual</span>
                </div>
                {!isRodeo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="26" height="10"><line x1="0" y1="5" x2="26" y2="5" stroke="var(--mc-muted)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    <span style={{ fontSize: 11, color: "var(--mc-text-2)" }}>Promedio rodeo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Producción Acumulada */}
            <div style={{ padding: "14px 20px 16px", borderTop: "1px solid var(--mc-line)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ minWidth: 170 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Producción Acumulada</div>
                <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>DEL {persistEndDEL} de {DEL_MAX} · litros totales estimados</div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--mc-text-2)", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                  <span><strong style={{ color: "var(--mc-ink)" }}>{nfLt.format(Math.round(acumHastaHoy))} lt</strong> acumulados hasta hoy</span>
                  <span>Proyección a 305d (esperada): <strong style={{ color: "var(--mc-ink)" }}>{nfLt.format(Math.round(acum305Esperado))} lt</strong></span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "var(--mc-line)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (acumHastaHoy / acum305Esperado) * 100).toFixed(1)}%`, height: "100%", background: "var(--mc-green-600)", borderRadius: 4 }} />
                </div>
              </div>
            </div>
          </div>

          {/* IA Recommendation */}
          <div style={{ position: "relative", background: "linear-gradient(var(--mc-surface),var(--mc-surface)) padding-box,linear-gradient(135deg,#00FF00 0%,#FF9D00 100%) border-box", border: "3px solid transparent", borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ position: "absolute", top: -10, right: 12, width: 28, height: 28, borderRadius: "50%", background: "var(--mc-surface)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.12)", zIndex: 1 }}>
              <Icon name="sparkles" size={14} style={{ color: "#FF9D00" }} />
            </div>
            <div style={{ display: "flex", alignItems: iaExpanded ? "flex-start" : "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Icon name="brain" size={24} style={{ color: "#FF9D00" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>Recomendación IA</div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "rgba(255,157,0,0.12)", color: "#c07800", display: "inline-block", marginTop: 2 }}>
                    {ia?.fuente === "reglas" || ia?.simulado ? "Basado en reglas (sin IA)" : "Basado en tus datos"}
                  </span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                {ia ? (
                  <>
                    <div style={{ fontSize: 13, color: "var(--mc-text-2)", lineHeight: 1.5 }}>{ia.analisis}</div>
                    {iaExpanded && ia.acciones.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                        {ia.acciones.map((acc, i) => (
                          <label key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", background: iaChecked[i] ? "rgba(255,157,0,0.14)" : "rgba(255,157,0,0.05)", borderRadius: 10, borderLeft: `3px solid ${iaChecked[i] ? "#FF9D00" : "rgba(255,157,0,0.35)"}`, cursor: "pointer", transition: "all .15s" }}>
                            <input type="checkbox" checked={!!iaChecked[i]} onChange={() => setIaChecked((p) => { const n = [...p]; n[i] = !n[i]; return n; })} style={{ width: 16, height: 16, accentColor: "#FF9D00", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
                            <span style={{ fontSize: 12, color: iaChecked[i] ? "var(--mc-text-3)" : "var(--mc-text-2)", textDecoration: iaChecked[i] ? "line-through" : "none", lineHeight: 1.5 }}>
                              <strong style={{ color: iaChecked[i] ? "var(--mc-text-3)" : "var(--mc-ink)" }}>{acc.titulo}:</strong> {acc.detalle}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--mc-text-2)", lineHeight: 1.5 }}>
                    {iaError || "Generá una recomendación personalizada analizando la curva de lactancia y la producción real de tu rodeo."}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                {ia && ia.acciones.length > 0 && (
                  <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => setIaExpanded(!iaExpanded)} style={{ fontSize: 12, minWidth: 130 }}>{iaExpanded ? "Ocultar detalle" : "Ver detalle"}</button>
                )}
                <button onClick={pedirIA} disabled={iaLoading} style={{ fontSize: 12, minWidth: 130, padding: "6px 12px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer", background: "#FF9D00", color: "white", fontFamily: "inherit", fontWeight: 600, opacity: iaLoading ? 0.7 : 1 }}>
                  {iaLoading ? "Analizando…" : ia ? "Regenerar" : "Generar recomendación"}
                </button>
              </div>
            </div>
          </div>

          {/* Ranking + Proyecciones */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>Vacas vs Su Curva Esperada</div>
                  <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 1 }}>Producción real vs proyección individual</div>
                </div>
                <SubTabs tabs={["Mejores", "Peores"]} active={rankVista} onChange={setRankVista} />
              </div>
              <div>
                {rankList.length === 0 && <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "var(--mc-text-3)" }}>Sin vacas con fecha de parto y ordeñes suficientes.</div>}
                {rankList.map((r, i) => (
                  <div
                    key={r.v.dbId}
                    onClick={() => setSelVaca(paramsPorVaca.has(r.v.dbId) ? r.v.dbId : "rodeo")}
                    style={{ display: "grid", gridTemplateColumns: "68px 1fr 28px", gap: 10, padding: "11px 18px", borderBottom: i < rankList.length - 1 ? "1px solid var(--mc-line)" : "none", cursor: "pointer", background: selVaca === r.v.dbId ? "var(--mc-green-50)" : "transparent", transition: "background 0.12s" }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--ff-mono)", color: "var(--mc-ink)" }}>#{r.v.caravana}</div>
                      <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 1 }}>{r.v.del ?? "—"} DEL</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: "var(--mc-text-2)" }}>{r.hoy} lt último</span>
                        <span style={{ fontWeight: 700, color: r.ok ? "var(--mc-green-700)" : "var(--mc-red)" }}>{r.pct - 100 >= 0 ? "+" : ""}{r.pct - 100}% {r.ok ? "↑" : "↓"}</span>
                      </div>
                      <div style={{ height: 5, background: "var(--mc-line)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(r.diff, 100)}%`, background: r.ok ? "var(--mc-green-600)" : "var(--mc-red)", borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>{r.diff}% del esperado</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={r.ok ? "arrowUp" : "arrowDown"} size={14} style={{ color: r.ok ? "var(--mc-green-600)" : "var(--mc-red)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proyecciones */}
            <div className="mc-card">
              <div className="mc-card__head">
                <div>
                  <div className="mc-card__title">Proyecciones</div>
                  <div className="text-xs text-muted mt-2">Producción estimada del rodeo</div>
                </div>
                <Icon name="arrowUp" size={15} style={{ color: "var(--mc-green-600)" }} />
              </div>
              <div className="col gap-14">
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Esta lactancia (promedio por vaca)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    {[
                      { label: "Proyección real", value: `${nfLt.format(proyeccionAnual)} lt`, color: "var(--mc-ink)" },
                      { label: "Curva esperada", value: `${nfLt.format(Math.round(acum305Esperado))} lt`, color: "var(--mc-text-2)" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ padding: "9px 10px", background: "var(--mc-surface-2)", borderRadius: 9, border: "1px solid var(--mc-line)" }}>
                        <div style={{ fontSize: 10, color: "var(--mc-text-3)", marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const dif = proyeccionAnual - Math.round(acum305Esperado);
                    const pct = acum305Esperado > 0 ? (dif / acum305Esperado) * 100 : 0;
                    const ok = dif >= 0;
                    return (
                      <span className={`mc-badge ${ok ? "mc-badge--green" : "mc-badge--amber"}`}>
                        <span className="mc-badge__dot" style={{ marginRight: 5 }} />
                        {ok ? "Por encima" : "Por debajo"} de la curva esperada ({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)
                      </span>
                    );
                  })()}
                </div>

                <div style={{ height: 1, background: "var(--mc-line)" }} />

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Factores del rodeo</div>
                  <div className="col gap-6">
                    {[
                      { icon: "activity", label: "Persistencia", value: persistencia !== null ? `${persistencia}%` : "—", detail: avgMonthlyDropPct !== null && avgMonthlyDropPct <= 6 ? "buena" : "revisar", ok: avgMonthlyDropPct !== null && avgMonthlyDropPct <= 6 },
                      { icon: "arrowUp", label: "Pico prom.", value: `${picoRodeo.toFixed(1)} lt`, detail: picoRodeo >= 26 ? "sólido" : "área de mejora", ok: picoRodeo >= 26 },
                      { icon: "calendar", label: "DEL al pico", value: `${delAlPico} días`, detail: delAlPico <= 45 && delAlPico > 0 ? "óptimo" : "objetivo <45 días", ok: delAlPico <= 45 && delAlPico > 0 },
                      { icon: "alert-triangle", label: "Vacas bajo curva", value: `${bajoCurva7}`, detail: bajoCurva7 === 0 ? "sin alertas" : "requieren seguimiento", ok: bajoCurva7 === 0 },
                    ].map((f) => (
                      <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: f.ok ? "var(--mc-green-50)" : "var(--mc-amber-bg)", border: `1px solid ${f.ok ? "var(--mc-green-200)" : "rgba(196,132,16,.2)"}` }}>
                        <Icon name={f.icon} size={14} style={{ color: f.ok ? "var(--mc-green-600)" : "var(--mc-amber)", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--mc-ink)" }}>{f.label}:</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: f.ok ? "var(--mc-green-700)" : "var(--mc-amber)", marginLeft: 4 }}>{f.value}</span>
                          <span style={{ fontSize: 11, color: "var(--mc-text-3)", marginLeft: 4 }}>({f.detail})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
