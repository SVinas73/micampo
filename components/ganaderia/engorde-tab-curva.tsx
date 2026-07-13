"use client";

// Pestaña Curva de Engorde (IA): proyección de peso por corral (pesadas reales
// + proyección IA a la meta), recomendación IA (/api/engorde/curva-ia),
// ranking por eficiencia y simulador "¿qué pasa si...?". Datos reales.

import React, { useMemo, useRef, useState } from "react";
import { KPI, Icon, IABadge } from "@/components/mc";
import { CorralAPI, coma, diasAFaena, gdpReal } from "./engorde-tipos";

type RecIA = { analisis: string; recomendaciones: { texto: string; detalle: string }[]; corralesRiesgo: string[]; fuente: "ia" | "reglas"; simulado?: boolean } | null;

export function EngordeCurva({ corrales }: { corrales: CorralAPI[] }) {
  const activos = useMemo(() => corrales.filter((c) => c.estado !== "Cerrado"), [corrales]);
  const [corralChart, setCorralChart] = useState("todos");
  const [showObj, setShowObj] = useState(true);
  const [hov, setHov] = useState<{ x: number; y: number; day: number; peso: number; pct: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [ia, setIa] = useState<RecIA>(null);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState("");
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [selRecs, setSelRecs] = useState<number[]>([]);

  // Simulador
  const [simCorral, setSimCorral] = useState("");
  const [diasExtra, setDiasExtra] = useState(0);
  const [ajuste, setAjuste] = useState<"reducir" | "actual" | "aumentar">("actual");

  const corralOpts = [{ key: "todos", label: "Todos los corrales · promedio" }, ...activos.map((c) => ({ key: c.id, label: c.nombre }))];

  /** Serie (día desde ingreso, peso) de las pesadas reales de un corral. */
  function serieCorral(c: CorralAPI): [number, number][] {
    const ingreso = c.fechaIngreso ? new Date(c.fechaIngreso).getTime() : c.pesadas?.length ? new Date(c.pesadas[c.pesadas.length - 1].fecha).getTime() : Date.now();
    return (c.pesadas || [])
      .slice()
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map((p) => [Math.round((new Date(p.fecha).getTime() - ingreso) / (24 * 3600 * 1000)), p.pesoPromedio] as [number, number]);
  }

  // Datos del chart (real + IA proyectada)
  const chart = useMemo(() => {
    let real: [number, number][];
    let objPeso: number | null;
    let gdpObj: number | null;
    let gdpR: number | null;
    if (corralChart === "todos") {
      // Promedio ponderado por día
      const map = new Map<number, { sum: number; cab: number }>();
      for (const c of activos) {
        for (const [d, v] of serieCorral(c)) {
          const cur = map.get(d) || { sum: 0, cab: 0 };
          cur.sum += v * c.cabezas; cur.cab += c.cabezas; map.set(d, cur);
        }
      }
      real = Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([d, v]) => [d, Math.round((v.sum / v.cab) * 10) / 10]);
      objPeso = activos.filter((c) => c.pesoObjetivo).length ? Math.round(activos.reduce((s, c) => s + (c.pesoObjetivo || 0), 0) / activos.filter((c) => c.pesoObjetivo).length) : null;
      const gs = activos.map((c) => gdpReal(c)).filter((g): g is number => g !== null);
      gdpR = gs.length ? gs.reduce((a, b) => a + b, 0) / gs.length : null;
      gdpObj = activos.filter((c) => c.gdpObjetivo).length ? activos.reduce((s, c) => s + (c.gdpObjetivo || 0), 0) / activos.filter((c) => c.gdpObjetivo).length : null;
    } else {
      const c = activos.find((x) => x.id === corralChart);
      real = c ? serieCorral(c) : [];
      objPeso = c?.pesoObjetivo ?? null;
      gdpObj = c?.gdpObjetivo ?? null;
      gdpR = c ? gdpReal(c) : null;
    }
    // Proyección IA desde el último punto real al peso objetivo con GDP real (o objetivo)
    let ia: [number, number][] = [];
    if (real.length && objPeso && (gdpR || gdpObj)) {
      const [lastDay, lastPeso] = real[real.length - 1];
      const g = gdpR || gdpObj || 1;
      if (lastPeso < objPeso && g > 0) {
        const diasHasta = Math.ceil((objPeso - lastPeso) / g);
        ia = [[lastDay, lastPeso], [lastDay + diasHasta, objPeso]];
      }
    }
    return { real, ia, objPeso, gdpObj, gdpR };
  }, [corralChart, activos]);

  const hayDatos = chart.real.length >= 1;

  // Chart geometry
  const VW = 880, VH = 240, PL = 52, PR = 28, PT = 18, PB = 40;
  const CW = VW - PL - PR, CH = VH - PT - PB;
  const allDays = [...chart.real.map((p) => p[0]), ...chart.ia.map((p) => p[0])];
  const XMAX = Math.max(90, ...allDays, 1);
  const TODAY = chart.real.length ? chart.real[chart.real.length - 1][0] : 0;
  const allW = [...chart.real.map((p) => p[1]), ...chart.ia.map((p) => p[1]), chart.objPeso || 0].filter((x) => x > 0);
  const YMIN = allW.length ? Math.floor(Math.min(...allW) / 20) * 20 - 20 : 220;
  const YMAX = allW.length ? Math.ceil(Math.max(...allW) / 20) * 20 + 20 : 530;
  const cx = (d: number) => PL + (d / XMAX) * CW;
  const cy = (v: number) => PT + CH - ((v - YMIN) / (YMAX - YMIN)) * CH;
  const mkPath = (arr: [number, number][]) => arr.map(([d, v], i) => `${i === 0 ? "M" : "L"}${cx(d).toFixed(1)},${cy(v).toFixed(1)}`).join(" ");
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round(YMIN + ((YMAX - YMIN) / 4) * i));

  const onSvgMove = (e: React.MouseEvent) => {
    const svg = svgRef.current; if (!svg || !chart.real.length) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * VW;
    const day = Math.round(((px - PL) / CW) * XMAX);
    if (day < 0 || day > TODAY) { setHov(null); return; }
    const rp = chart.real;
    let peso = rp[rp.length - 1][1];
    for (let i = 0; i < rp.length - 1; i++) { const [d0, v0] = rp[i], [d1, v1] = rp[i + 1]; if (day >= d0 && day <= d1) { peso = Math.round(v0 + ((day - d0) / (d1 - d0 || 1)) * (v1 - v0)); break; } }
    setHov({ x: cx(day), y: cy(peso), day, peso, pct: ((e.clientX - r.left) / r.width) * 100 });
  };

  // KPIs
  const diasProm = (() => { const ds = activos.map((c) => diasAFaena(c)).filter((d): d is number => d !== null && d > 0); return ds.length ? Math.round(ds.reduce((a, b) => a + b, 0) / ds.length) : null; })();
  const pesoProy = chart.ia.length ? chart.ia[chart.ia.length - 1][1] : chart.objPeso;
  const precioProm = (() => { const ps = activos.map((c) => c.precioMercado).filter((p): p is number => p != null); return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null; })();
  const enRiesgo = activos.filter((c) => { const g = gdpReal(c); return g !== null && c.gdpObjetivo && g < c.gdpObjetivo * 0.9; });

  // Ranking por eficiencia
  const ranking = useMemo(() => activos.map((c) => { const g = gdpReal(c); const vs = g !== null && c.gdpObjetivo ? Math.round((g / c.gdpObjetivo) * 100) : null; return { c, g, vs }; }).filter((r) => r.vs !== null).sort((a, b) => (b.vs || 0) - (a.vs || 0)), [activos]);

  // Simulador — usa datos reales del corral seleccionado
  const simActivo = activos.find((c) => c.id === simCorral) || activos[0] || null;
  const rMults = { reducir: 0.88, actual: 1.0, aumentar: 1.14 };
  const simGdp = simActivo ? (gdpReal(simActivo) ?? simActivo.gdpObjetivo ?? 1) : 1;
  const simPeso = simActivo ? (simActivo.pesoActual ?? simActivo.pesoIngreso ?? 0) : 0;
  const simDiasPlan = simActivo ? (diasAFaena(simActivo) ?? 0) : 0;
  const simPrecio = simActivo?.precioMercado ?? 2.1;
  const gdpAdj = simGdp * rMults[ajuste];
  const diasTot = Math.max(0, simDiasPlan + diasExtra);
  const pesoFinal = Math.round(simPeso + gdpAdj * diasTot);
  const pesoBase = Math.round(simPeso + simGdp * simDiasPlan);
  const rCosto = ajuste === "aumentar" ? 5 : ajuste === "reducir" ? -2 : 0;
  const costoExtra = diasExtra !== 0 ? Math.round(diasExtra * (10 + rCosto)) : 0;
  const margenBase = Math.round(pesoBase * simPrecio - (simActivo?.costoDiario ?? 10) * simDiasPlan);
  const extraVal = Math.round((pesoFinal - pesoBase) * simPrecio);
  const margenFinal = Math.round(margenBase - costoExtra + extraVal);
  const margenDiff = margenFinal - margenBase;
  const margenPct = margenBase !== 0 ? Math.round((margenDiff / Math.abs(margenBase)) * 100) : 0;
  const barMax = Math.max(Math.abs(margenBase), Math.abs(margenFinal), 200);

  const pedirIA = async () => {
    setIaLoading(true); setIaError("");
    try {
      const r = await fetch("/api/engorde/curva-ia", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Error");
      setIa(d); setSelRecs([]); setDetalleOpen(true);
    } catch { setIaError("No se pudo generar el análisis. Reintentá en unos segundos."); } finally { setIaLoading(false); }
  };
  const toggleRec = (i: number) => setSelRecs((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  return (
    <div className="col gap-16">
      <div className="grid g-cols-5">
        <KPI label="Días Prom. a Faena" value={diasProm !== null ? String(diasProm) : "—"} delta="al ritmo actual" trend="up" icon="calendar" />
        <KPI label="Peso Proyectado" value={pesoProy ? `${Math.round(pesoProy)} kg` : "—"} delta="al cierre del ciclo" trend="up" icon="arrowUp" />
        <KPI label="Precio Mercado" value={precioProm !== null ? `$${coma(precioProm, 2)}/kg` : "—"} delta="referencia cargada" icon="dollar" />
        <KPI label="Corrales" value={String(activos.length)} delta="en engorde activo" icon="chart" accent />
        <KPI label="Corrales en Riesgo" value={String(enRiesgo.length)} delta="GDP insuficiente" trend={enRiesgo.length > 0 ? "down" : "up"} icon="alert-triangle" warn={enRiesgo.length > 0} />
      </div>

      {/* Proyección de Peso */}
      <div className="mc-card" style={{ padding: 0, overflow: "visible" }}>
        <div style={{ padding: "16px 20px 10px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="mc-card__title">Proyección de Peso</div>
            <div className="text-xs text-muted mt-2">Curva real + proyección IA hacia la meta</div>
          </div>
          <select value={corralChart} onChange={(e) => setCorralChart(e.target.value)} className="mc-select" style={{ minWidth: 220, fontSize: 12.5 }}>
            {corralOpts.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <div style={{ marginLeft: "auto", display: "flex", border: "1.5px solid var(--mc-line)", borderRadius: 8, overflow: "hidden" }}>
            {[{ v: false, l: "Real" }, { v: true, l: "Comparar objetivo" }].map((o) => (
              <button key={o.l} onClick={() => setShowObj(o.v)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: showObj === o.v ? 700 : 400, border: "none", background: showObj === o.v ? "var(--mc-green-600)" : "var(--mc-surface-2)", color: showObj === o.v ? "#fff" : "var(--mc-text-2)", cursor: "pointer" }}>{o.l}</button>
            ))}
          </div>
        </div>
        {!hayDatos ? (
          <div className="mc-empty" style={{ padding: "40px 0" }}><div className="mc-empty__icon"><Icon name="chart" size={20} /></div>Registrá pesadas de tus corrales para ver la proyección de peso.</div>
        ) : (
          <div style={{ position: "relative", padding: "0 6px 4px" }}>
            <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible", cursor: "crosshair" }} onMouseMove={onSvgMove} onMouseLeave={() => setHov(null)}>
              <defs>
                <linearGradient id="ecRealGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--mc-green-500)" stopOpacity="0.16" /><stop offset="100%" stopColor="var(--mc-green-500)" stopOpacity="0" /></linearGradient>
              </defs>
              {yTicks.map((v) => <g key={v}><line x1={PL} y1={cy(v)} x2={VW - PR} y2={cy(v)} stroke="var(--mc-line)" strokeWidth="1" /><text x={PL - 6} y={cy(v) + 4} fontSize="10" fill="var(--mc-text-3)" textAnchor="end">{v}</text></g>)}
              {[0, Math.round(XMAX * 0.25), Math.round(XMAX * 0.5), TODAY, Math.round(XMAX * 0.75), XMAX].filter((d, i, a) => a.indexOf(d) === i).map((d) => (
                <text key={d} x={cx(d)} y={VH - PB + 16} fontSize="10" fill={d === TODAY ? "var(--mc-green-600)" : "var(--mc-text-3)"} textAnchor="middle" fontWeight={d === TODAY ? "700" : "400"}>{d === TODAY ? "Hoy" : `Día ${d}`}</text>
              ))}
              {showObj && chart.objPeso && chart.real.length > 0 && <path d={mkPath([[chart.real[0][0], chart.real[0][1]], [XMAX, chart.objPeso]])} fill="none" stroke="var(--mc-muted)" strokeWidth="1.8" strokeDasharray="7 4" />}
              {chart.real.length > 1 && <path d={`${mkPath(chart.real)} L${cx(chart.real[chart.real.length - 1][0]).toFixed(1)},${(PT + CH).toFixed(1)} L${cx(chart.real[0][0]).toFixed(1)},${(PT + CH).toFixed(1)} Z`} fill="url(#ecRealGrad)" />}
              <path d={mkPath(chart.real)} fill="none" stroke="var(--mc-green-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {chart.ia.length > 1 && <path d={mkPath(chart.ia)} fill="none" stroke="#FF9D00" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />}
              {chart.real.length > 0 && <><line x1={cx(TODAY)} y1={PT} x2={cx(TODAY)} y2={PT + CH} stroke="var(--mc-green-600)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.45" /><circle cx={cx(TODAY)} cy={cy(chart.real[chart.real.length - 1][1])} r="5.5" fill="var(--mc-green-600)" stroke="var(--mc-surface)" strokeWidth="2" /></>}
              {chart.ia.length > 1 && <><rect x={cx(TODAY) + 8} y={cy(chart.ia[0][1]) - 10} width="26" height="15" rx="7.5" fill="#FF9D00" /><text x={cx(TODAY) + 21} y={cy(chart.ia[0][1]) + 3.5} textAnchor="middle" fontSize="9" fontWeight="800" fill="white">IA</text></>}
              {hov && <g><line x1={hov.x} y1={PT} x2={hov.x} y2={PT + CH} stroke="var(--mc-ink)" strokeWidth="1" opacity="0.12" /><circle cx={hov.x} cy={hov.y} r="4" fill="var(--mc-green-600)" stroke="var(--mc-surface)" strokeWidth="1.5" /></g>}
            </svg>
            {hov && (
              <div style={{ position: "absolute", top: 10, left: `${Math.min(Math.max(hov.pct, 8), 82)}%`, transform: "translateX(-50%)", background: "var(--mc-ink)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 11.5, pointerEvents: "none", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.22)", zIndex: 10 }}>
                <div style={{ fontWeight: 700 }}>Día {hov.day}</div>
                <div style={{ opacity: 0.8 }}>{hov.peso} kg</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 20, padding: "6px 52px", fontSize: 11.5, color: "var(--mc-text-2)", alignItems: "center", flexWrap: "wrap" }}>
              {[{ clr: "var(--mc-green-600)", dash: false, lbl: "Real" }, ...(showObj ? [{ clr: "var(--mc-muted)", dash: true, lbl: "Objetivo" }] : []), { clr: "#FF9D00", dash: true, lbl: "Proyección IA" }].map((l) => (
                <div key={l.lbl} style={{ display: "flex", alignItems: "center", gap: 6 }}><svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke={l.clr} strokeWidth={l.dash ? 1.8 : 2.5} strokeDasharray={l.dash ? "6 3" : undefined} /></svg><span>{l.lbl}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recomendación IA */}
      <div className="mc-card ia-card" style={{ padding: "16px 20px", position: "relative" }}>
        <div style={{ position: "absolute", top: 14, right: 14 }}><IABadge /></div>
        <div style={{ display: "flex", alignItems: detalleOpen ? "flex-start" : "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#FF9D00,#FFB800)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="sparkles" size={20} style={{ color: "#fff" }} /></div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--mc-ink)" }}>Recomendación IA</span>
              <span style={{ padding: "2px 10px", borderRadius: 999, background: "#FFF0D6", color: "#B86F00", fontSize: 11, fontWeight: 700 }}>{ia?.fuente === "reglas" || ia?.simulado ? "Basado en reglas" : "Basado en tus datos"}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--mc-text-2)", lineHeight: 1.6, margin: 0 }}>
              {ia ? ia.analisis : iaError || "Generá un análisis de eficiencia del engorde con proyecciones y recomendaciones basadas en tus corrales reales."}
            </p>
            {detalleOpen && ia && ia.recomendaciones.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--mc-line)" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--mc-text-2)", marginBottom: 8 }}>Recomendaciones</div>
                <div className="col gap-6">
                  {ia.recomendaciones.map((r, i) => (
                    <label key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${selRecs.includes(i) ? "#FF9D00" : "var(--mc-line)"}`, background: selRecs.includes(i) ? "#FFF7EC" : "var(--mc-surface)", cursor: "pointer" }}>
                      <input type="checkbox" checked={selRecs.includes(i)} onChange={() => toggleRec(i)} style={{ marginTop: 3, width: 15, height: 15, accentColor: "#FF9D00" }} />
                      <div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>{r.texto}</div><div style={{ fontSize: 11.5, color: "var(--mc-text-2)", marginTop: 2 }}>{r.detalle}</div></div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignSelf: "center" }}>
            {ia && ia.recomendaciones.length > 0 && <button className="mc-btn mc-btn--sm mc-btn--ghost" onClick={() => setDetalleOpen((v) => !v)}>{detalleOpen ? "Ocultar" : "Ver detalle"}</button>}
            <button className="mc-btn mc-btn--sm" onClick={pedirIA} disabled={iaLoading} style={{ background: "#FF9D00", color: "#fff", border: "none", fontWeight: 700, opacity: iaLoading ? 0.7 : 1 }}>{iaLoading ? "Analizando…" : ia ? "Regenerar" : "Generar análisis"}</button>
          </div>
        </div>
      </div>

      {/* Ranking + Simulador */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px" }}>
            <div className="mc-card__title">Ranking de Corrales por Eficiencia</div>
            <div className="text-xs text-muted mt-2">GDP real vs. objetivo</div>
          </div>
          {ranking.length === 0 ? (
            <div className="mc-empty" style={{ padding: "28px 0" }}><div className="mc-empty__icon"><Icon name="chart" size={20} /></div>Sin datos de GDP para rankear.</div>
          ) : (
            <table className="mc-table" style={{ fontSize: 12.5 }}>
              <thead><tr><th style={{ width: 28 }}>#</th><th>Corral</th><th className="mc-cell--num">GDP</th><th className="mc-cell--num">vs obj.</th><th style={{ width: 84, paddingRight: 16 }}></th></tr></thead>
              <tbody>
                {ranking.map((r, i) => { const isRed = (r.vs || 0) < 90; const isAmb = (r.vs || 0) >= 90 && (r.vs || 0) < 100; const bc = isRed ? "var(--mc-red)" : isAmb ? "var(--mc-amber)" : "var(--mc-green-600)"; return (
                  <tr key={r.c.id} style={{ background: isRed ? "var(--mc-red-bg)" : "transparent" }}>
                    <td style={{ color: "var(--mc-muted)", fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: isRed ? 700 : 500, color: isRed ? "var(--mc-red)" : "var(--mc-ink)" }}>{r.c.nombre}</td>
                    <td className="mc-cell--num font-mono">{coma(r.g!, 2)} kg/d</td>
                    <td className="mc-cell--num" style={{ color: bc, fontWeight: 700 }}>{r.vs}%</td>
                    <td style={{ paddingRight: 16 }}><div style={{ width: "100%", height: 6, background: "var(--mc-line)", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(Math.min(r.vs || 0, 110) / 110) * 100}%`, height: "100%", background: bc, borderRadius: 3 }} /></div></td>
                  </tr>
                ); })}
              </tbody>
            </table>
          )}
        </div>

        {/* Simulador */}
        <div className="mc-card ia-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div className="mc-card__title">Simulador ¿Qué pasa si...?</div><IABadge /></div>
            <div className="text-xs text-muted mt-2">Resultados en tiempo real sobre tus corrales</div>
          </div>
          {!simActivo ? (
            <div className="mc-empty" style={{ padding: "28px 0" }}><div className="mc-empty__icon"><Icon name="chart" size={20} /></div>Creá corrales para simular escenarios.</div>
          ) : (
            <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--mc-text-2)", display: "block", marginBottom: 5 }}>Corral a simular</label>
                <select value={simActivo.id} onChange={(e) => setSimCorral(e.target.value)} className="mc-select" style={{ width: "100%", fontSize: 13 }}>
                  {activos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--mc-text-2)" }}>Días extra de engorde</label>
                  <span style={{ fontSize: 14, fontWeight: 800, color: diasExtra > 0 ? "var(--mc-red)" : diasExtra < 0 ? "var(--mc-green-600)" : "var(--mc-text-3)" }}>{diasExtra > 0 ? "+" : ""}{diasExtra} días</span>
                </div>
                <input type="range" min="-10" max="30" step="1" value={diasExtra} onChange={(e) => setDiasExtra(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--mc-green-600)" }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--mc-text-2)", display: "block", marginBottom: 5 }}>Ajuste de ración</label>
                <div style={{ display: "flex", background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line)", borderRadius: 10, padding: 3, gap: 2 }}>
                  {([["reducir", "Reducir"], ["actual", "Actual"], ["aumentar", "Aumentar"]] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setAjuste(k)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", fontSize: 11.5, fontWeight: ajuste === k ? 700 : 500, cursor: "pointer", background: ajuste === k ? (k === "aumentar" ? "#FF9D00" : k === "reducir" ? "var(--mc-red)" : "var(--mc-green-600)") : "transparent", color: ajuste === k ? "#fff" : "var(--mc-text-2)" }}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: "var(--mc-surface-2)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--mc-line)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[{ lbl: "Peso proyectado", val: `${pesoFinal} kg`, clr: "var(--mc-ink)" }, { lbl: "Costo adic.", val: costoExtra === 0 ? "$0" : costoExtra > 0 ? "+$" + costoExtra : "-$" + Math.abs(costoExtra), clr: costoExtra > 0 ? "var(--mc-red)" : costoExtra < 0 ? "var(--mc-green-600)" : "var(--mc-text-3)" }, { lbl: "Margen final", val: `$${margenFinal}`, clr: margenFinal >= margenBase ? "var(--mc-green-600)" : "var(--mc-red)" }].map((s) => (
                    <div key={s.lbl} style={{ textAlign: "center" }}><div style={{ fontSize: 9.5, color: "var(--mc-text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.lbl}</div><div style={{ fontSize: 16, fontWeight: 800, color: s.clr }}>{s.val}</div></div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-text-2)", marginBottom: 8 }}>Margen: Actual vs. Simulado</div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 84 }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}><div style={{ fontSize: 12, fontWeight: 800, color: "var(--mc-green-700)" }}>${margenBase}</div><div style={{ width: "100%", background: "var(--mc-green-600)", borderRadius: "4px 4px 0 0", opacity: 0.75, height: `${(Math.abs(margenBase) / barMax) * 56}px` }} /><div style={{ fontSize: 10, color: "var(--mc-text-3)", marginTop: 2 }}>Actual</div></div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, minWidth: 44 }}><div style={{ fontSize: 11, fontWeight: 800, color: margenDiff >= 0 ? "var(--mc-green-600)" : "var(--mc-red)", textAlign: "center" }}>{margenDiff >= 0 ? "+" : ""}{margenDiff}$</div><div style={{ fontSize: 9.5, color: "var(--mc-muted)", textAlign: "center" }}>({margenPct >= 0 ? "+" : ""}{margenPct}%)</div></div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}><div style={{ fontSize: 12, fontWeight: 800, color: margenFinal >= margenBase ? "var(--mc-green-700)" : "var(--mc-red)" }}>${margenFinal}</div><div style={{ width: "100%", background: margenFinal >= margenBase ? "var(--mc-green-400)" : "var(--mc-red)", borderRadius: "4px 4px 0 0", height: `${(Math.max(0, margenFinal) / barMax) * 56}px` }} /><div style={{ fontSize: 10, color: "var(--mc-text-3)", marginTop: 2 }}>Simulado</div></div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "var(--mc-text-3)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>Simulación basada en el GDP histórico del corral y el precio de mercado cargado. Resultados estimados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
