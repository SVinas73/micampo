"use client";

// Piezas compartidas de Producción Lechera: donut de estado del rodeo,
// gráfico de barras de producción, ficha de vaca (modal) y drawer de alerta.

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/mc";
import {
  RegLecheroAPI,
  VacaLechera,
  fechaStrDe,
  hoyStr,
  nfLt,
  plEstBadge,
  wood,
  WoodParams,
} from "./lechera-tipos";

/** Navega a la ficha completa del animal en el módulo Animales. */
export function useAbrirFicha() {
  const router = useRouter();
  return (caravana: string) => {
    sessionStorage.setItem("mc-ficha-pendiente", caravana);
    router.push("/animales");
  };
}

/* ============ KPI card estilo panel ============ */

export function PLKpiCard({ title, ico, val, sub, color }: { title: string; ico: string; val: React.ReactNode; sub: React.ReactNode; color?: string }) {
  return (
    <div className="mc-card mc-kpi-hover" style={{ padding: "16px 18px", transition: "all .2s", cursor: "default", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a938d", textTransform: "uppercase", letterSpacing: ".06em", lineHeight: 1.3 }}>{title}</div>
        <Icon name={ico} size={16} style={{ color: "#8a938d", flexShrink: 0 }} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", marginBottom: 4, color: color || "var(--mc-ink)" }}>{val}</div>
      <div style={{ fontSize: 12, color: "var(--mc-text-2)", lineHeight: 1.3 }}>{sub}</div>
    </div>
  );
}

/* ============ DONUT ESTADO DEL RODEO ============ */

export function PLDonut({ segs, total }: { segs: { lbl: string; n: number; color: string; bg: string; ico: string }[]; total: number }) {
  const [hovSeg, setHovSeg] = useState<number | null>(null);
  const visibles = segs.filter((s) => s.n > 0);
  const cx = 85, cy = 85, ro = 70, ri = 45;
  const tot = visibles.reduce((a, s) => a + s.n, 0);
  const TWO_PI = 2 * Math.PI;
  const makeSeg = (sa: number, ea: number) => {
    const s1 = sa - Math.PI / 2, e1 = ea - Math.PI / 2;
    const ox1 = (cx + ro * Math.cos(s1)).toFixed(2), oy1 = (cy + ro * Math.sin(s1)).toFixed(2);
    const ox2 = (cx + ro * Math.cos(e1)).toFixed(2), oy2 = (cy + ro * Math.sin(e1)).toFixed(2);
    const ix1 = (cx + ri * Math.cos(e1)).toFixed(2), iy1 = (cy + ri * Math.sin(e1)).toFixed(2);
    const ix2 = (cx + ri * Math.cos(s1)).toFixed(2), iy2 = (cy + ri * Math.sin(s1)).toFixed(2);
    const lg = ea - sa > Math.PI ? 1 : 0;
    return `M${ox1},${oy1} A${ro},${ro} 0 ${lg} 1 ${ox2},${oy2} L${ix1},${iy1} A${ri},${ri} 0 ${lg} 0 ${ix2},${iy2} Z`;
  };
  const angles = visibles.map((s) => (tot > 0 ? (s.n / tot) * TWO_PI : 0));
  const starts = angles.map((_, i) => angles.slice(0, i).reduce((acc, a) => acc + a, 0));
  const paths = visibles.map((s, i) => ({
    ...s,
    i,
    d: makeSeg(starts[i], Math.min(starts[i] + angles[i], TWO_PI - 0.0001)),
  }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 10, padding: "9px 11px", position: "relative", border: `1px solid ${s.color}30` }}>
            <Icon name={s.ico} size={15} style={{ color: s.color, position: "absolute", top: 8, right: 8, opacity: 0.55 }} />
            <div style={{ fontSize: 21, fontWeight: 800, color: s.color, letterSpacing: "-.02em", lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 11, color: "var(--mc-text-2)", marginTop: 2, fontWeight: 500 }}>{s.lbl}</div>
          </div>
        ))}
      </div>
      {tot === 0 ? (
        <div style={{ textAlign: "center", padding: "18px 0", fontSize: 12, color: "var(--mc-text-3)" }}>
          Sin vacas registradas todavía.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg width={170} height={170} style={{ overflow: "visible", display: "block" }}>
            {paths.map((p, i) => (
              <path
                key={i}
                d={p.d}
                fill={p.color}
                style={{ cursor: "pointer", transformOrigin: `${cx}px ${cy}px`, transform: hovSeg === i ? "scale(1.06)" : "scale(1)", transition: "transform .15s", filter: hovSeg === i ? "drop-shadow(0 3px 8px rgba(0,0,0,0.18))" : "none" }}
                onMouseEnter={() => setHovSeg(i)}
                onMouseLeave={() => setHovSeg(null)}
              />
            ))}
            <text x={cx} y={cy - 7} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--mc-ink)" fontFamily="inherit">{total}</text>
            <text x={cx} y={cy + 9} textAnchor="middle" fontSize={10} fill="var(--mc-text-3)" fontFamily="inherit">vacas</text>
          </svg>
          {hovSeg !== null && paths[hovSeg] && (
            <div style={{ marginTop: 2, padding: "3px 10px", background: paths[hovSeg].bg, borderRadius: 6, border: `1px solid ${paths[hovSeg].color}50`, textAlign: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: paths[hovSeg].color }}>{paths[hovSeg].lbl}: {paths[hovSeg].n} vacas</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-around", width: "100%", marginTop: 8, flexWrap: "wrap", gap: 4 }}>
            {visibles.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "var(--mc-text-3)" }}>{s.lbl.split(" ").slice(0, 2).join(" ")} <b style={{ color: "var(--mc-ink)" }}>{s.n}</b></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ BAR CHART DE PRODUCCIÓN ============ */

type BarDatum = { label: string; dayLabel?: string; total: number; t1?: number; t2?: number; isToday?: boolean; isRecent?: boolean };

/** Series reales por período a partir de los registros lecheros. */
export function seriesProduccion(registros: RegLecheroAPI[]): { dias: BarDatum[]; semanas: BarDatum[]; meses: BarDatum[] } {
  const DIAS_L = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const MES_L = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const hoy = hoyStr();
  const porDia = new Map<string, { total: number; t1: number; t2: number }>();
  for (const r of registros) {
    const f = fechaStrDe(r.fecha);
    if (!porDia.has(f)) porDia.set(f, { total: 0, t1: 0, t2: 0 });
    const d = porDia.get(f)!;
    d.total += r.litros;
    if ((r.turno || "") === "Mañana" || (r.turno || "").includes("1er")) d.t1 += r.litros;
    else d.t2 += r.litros;
  }

  const dias: BarDatum[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const v = porDia.get(f);
    dias.push({
      label: String(d.getDate()).padStart(2, "0"),
      dayLabel: DIAS_L[d.getDay()],
      total: v ? Math.round(v.total) : 0,
      t1: v ? Math.round(v.t1) : 0,
      t2: v ? Math.round(v.t2) : 0,
      isToday: f === hoy,
      isRecent: i <= 9,
    });
  }

  const semanas: BarDatum[] = [];
  for (let w = 7; w >= 0; w--) {
    const fin = new Date();
    fin.setDate(fin.getDate() - w * 7);
    const ini = new Date(fin);
    ini.setDate(ini.getDate() - 6);
    let total = 0, t1 = 0, t2 = 0;
    porDia.forEach((v, f) => {
      const d = new Date(f + "T00:00:00");
      if (d >= new Date(ini.getFullYear(), ini.getMonth(), ini.getDate()) && d <= fin) {
        total += v.total; t1 += v.t1; t2 += v.t2;
      }
    });
    semanas.push({ label: `${ini.getDate()} ${MES_L[ini.getMonth()]}`, total: Math.round(total), t1: Math.round(t1), t2: Math.round(t2), isRecent: w === 0 });
  }

  const meses: BarDatum[] = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m, 1);
    const pref = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    let total = 0;
    porDia.forEach((v, f) => { if (f.startsWith(pref)) total += v.total; });
    meses.push({ label: MES_L[d.getMonth()], total: Math.round(total), isToday: m === 0 });
  }

  return { dias, semanas, meses };
}

export function PLBarChart({
  registros,
  period,
  setPeriod,
}: {
  registros: RegLecheroAPI[];
  period: string;
  setPeriod: (p: string) => void;
}) {
  const [tooltip, setTooltip] = useState<number | null>(null);
  const series = useMemo(() => seriesProduccion(registros), [registros]);
  const data = period === "Día" ? series.dias : period === "Semana" ? series.semanas : series.meses;
  const conDatos = data.some((d) => d.total > 0);
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  // Objetivo real: promedio de los períodos con datos +5%
  const conVal = data.filter((d) => d.total > 0);
  const objetivo = conVal.length ? Math.round((conVal.reduce((s, d) => s + d.total, 0) / conVal.length) * 1.05) : null;
  const maxEje = Math.max(maxVal, objetivo || 0);
  const barPct = (v: number) => Math.round((v / maxEje) * 100);

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "visible" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>Producción {period === "Día" ? "Diaria" : period === "Semana" ? "Semanal" : "Mensual"}</div>
          <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>
            {period === "Día" ? "Últimos 30 días" : period === "Semana" ? "Últimas 8 semanas" : "Últimos 6 meses"}
          </div>
        </div>
        <div style={{ display: "flex", borderRadius: 8, border: "1px solid var(--mc-line)", overflow: "hidden" }}>
          {["Día", "Semana", "Mes"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{ padding: "5px 14px", border: "none", background: period === p ? "var(--mc-green-600)" : "var(--mc-surface)", color: period === p ? "white" : "var(--mc-text-2)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", transition: "all .15s" }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 18px 12px" }}>
        {!conDatos ? (
          <div className="mc-empty" style={{ padding: "36px 0" }}>
            <div className="mc-empty__icon"><Icon name="droplets" size={20} /></div>
            Sin registros de ordeñe en el período. Registrá el primer ordeñe para ver la curva de producción.
          </div>
        ) : (
          <>
            <div style={{ position: "relative", height: 180 }}>
              {objetivo !== null && (
                <div style={{ position: "absolute", left: 0, right: 0, top: `${(1 - objetivo / maxEje) * 100}%`, borderTop: "1.5px dashed #b3b0a6", zIndex: 2, pointerEvents: "none" }}>
                  <span style={{ position: "absolute", right: 0, top: -14, fontSize: 9, fontWeight: 700, color: "#8a938d", background: "var(--mc-surface)", padding: "1px 5px", borderRadius: 4 }}>
                    Objetivo: {nfLt.format(objetivo)} lt (prom. +5%)
                  </span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: "100%", position: "relative", zIndex: 1 }}>
                {data.map((d, i) => {
                  const isHov = tooltip === i;
                  return (
                    <div
                      key={i}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", position: "relative", cursor: "pointer" }}
                      onMouseEnter={() => setTooltip(i)}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {d.isToday && <div style={{ position: "absolute", top: -16, fontSize: 8, fontWeight: 800, color: "var(--mc-green-600)", whiteSpace: "nowrap" }}>Hoy</div>}
                      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                        <div
                          style={{
                            width: "100%", height: `${barPct(d.total)}%`, minHeight: d.total > 0 ? 2 : 0,
                            background: d.isToday ? "var(--mc-green-600)" : d.isRecent ? "#6ee7a8" : "#c6f4d8",
                            borderRadius: "3px 3px 0 0",
                            border: d.isToday ? "2px solid var(--mc-green-700)" : "none",
                            transition: "all .15s", opacity: isHov ? 0.8 : 1,
                          }}
                        />
                      </div>
                      {isHov && d.total > 0 && (
                        <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "white", borderRadius: 8, padding: "8px 10px", fontSize: 10, lineHeight: 1.5, whiteSpace: "nowrap", zIndex: 50, boxShadow: "0 4px 14px rgba(0,0,0,.25)" }}>
                          <div style={{ fontWeight: 700, marginBottom: 3 }}>{d.dayLabel || ""} {d.label} · {nfLt.format(d.total)} lt</div>
                          {(d.t1 || 0) > 0 && <div>Ordeñe mañana: {nfLt.format(d.t1 || 0)} lt</div>}
                          {(d.t2 || 0) > 0 && <div>Otros turnos: {nfLt.format(d.t2 || 0)} lt</div>}
                          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1e293b" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, marginTop: 4 }}>
              {data.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 7.5, color: "#94a3b8", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {period === "Día" ? (i % 5 === 0 || d.isToday ? d.label : "") : d.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============ REGISTRAR OBSERVACIÓN ============ */

export function ModalRegistrarObservacion({ vaca, onClose, onGuardado }: { vaca: VacaLechera; onClose: () => void; onGuardado?: () => void }) {
  const [fecha, setFecha] = useState(hoyStr());
  const [texto, setTexto] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      const r = await fetch("/api/eventos-vida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: vaca.dbId,
          fecha,
          tipoEvento: "Manejo",
          titulo: "Observación de ordeñe",
          descripcion: texto,
        }),
      });
      if (!r.ok) throw new Error();
      setGuardado(true);
      onGuardado && onGuardado();
      setTimeout(onClose, 800);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 9200, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div className="mc-card" style={{ width: 420, maxWidth: "92vw", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mc-line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="mc-card__title">Registrar Observación</div>
            <div className="text-xs text-muted mt-2">Vaca #{vaca.caravana}</div>
          </div>
          <button onClick={onClose} className="mc-icon-btn" style={{ width: 28, height: 28 }}><Icon name="x" size={14} /></button>
        </div>
        <div style={{ padding: "16px 20px" }}>
          {guardado ? (
            <div className="row gap-8" style={{ alignItems: "center", color: "var(--mc-green-700)" }}>
              <Icon name="check-circle" size={16} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Observación guardada</span>
            </div>
          ) : (
            <div className="col gap-10">
              <div className="mc-field">
                <label className="mc-label">Fecha</label>
                <input type="date" className="mc-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="mc-field">
                <label className="mc-label">Observación</label>
                <textarea className="mc-input" rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej: se detectó cojera leve en pata trasera izquierda..." style={{ resize: "vertical" }} />
              </div>
            </div>
          )}
        </div>
        {!guardado && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--mc-line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={onClose} className="mc-btn mc-btn--ghost">Cancelar</button>
            <button onClick={guardar} className="mc-btn mc-btn--primary" disabled={!texto.trim() || guardando}><Icon name="check" size={14} /> Guardar</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ FICHA DE VACA (modal grande) ============ */

export function PLVacaModal({ vaca, esperada, onClose }: { vaca: VacaLechera; esperada: WoodParams; onClose: () => void }) {
  const [modalObs, setModalObs] = useState(false);
  const abrirFicha = useAbrirFicha();
  const badge = plEstBadge(vaca.estado);

  // Serie real de los últimos 14 días (con huecos en cero si no hubo registro)
  const serie14 = useMemo(() => {
    const out: { fecha: string; label: string; real: number | null; exp: number | null }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dia = vaca.serie.find((s) => s.fecha === f);
      const delDia = vaca.del !== null ? Math.max(1, vaca.del - i) : null;
      out.push({
        fecha: f,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        real: dia ? dia.litros : null,
        exp: delDia !== null ? wood(delDia, esperada) : null,
      });
    }
    return out;
  }, [vaca, esperada]);

  const reales = serie14.filter((s) => s.real !== null);
  const avg7 = vaca.prom7;
  const pColor = vaca.pct === null ? "var(--mc-ink)" : vaca.pct < 75 ? "var(--mc-red)" : vaca.pct < 90 ? "var(--mc-amber)" : "var(--mc-green-700)";
  const lactN = vaca.lactancia > 0 ? `${vaca.lactancia}º Parto` : "Sin partos";

  const svgW = 310, svgH = 120;
  const vals = serie14.flatMap((s) => [s.real ?? 0, s.exp ?? 0]);
  const maxV = Math.max(...vals, 10) + 3;
  const xp = (i: number) => 16 + (i / 13) * (svgW - 32);
  const yp = (v: number) => svgH - (v / maxV) * svgH * 0.85 - 8;
  const ptsDe = (get: (s: (typeof serie14)[0]) => number | null) =>
    serie14.map((s, i) => (get(s) !== null ? `${xp(i)},${yp(get(s)!)}` : null)).filter(Boolean).join(" ");

  const stateDesc: Record<string, string> = {
    "En pico": "Primeras semanas, producción óptima",
    "Bajo curva": "Por debajo de la curva esperada",
    Declinando: "Declinación gradual de producción",
    "Próx. seca": "Próxima al período de secado",
    Media: "Fase media de lactancia",
    Seca: "En período de descanso",
    "Sin datos": "Sin fecha de parto registrada",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,12,.58)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "min(880px,97vw)", background: "var(--mc-surface)", borderRadius: 18, boxShadow: "0 32px 80px rgba(0,0,0,0.30)", display: "flex", flexDirection: "column", maxHeight: "92vh", overflow: "hidden", position: "relative" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,var(--mc-green-700),var(--mc-green-400))", borderRadius: "18px 18px 0 0", flexShrink: 0 }} />
        {/* Header */}
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "var(--mc-ink)", color: "white" }}>Vaca #{vaca.caravana}</span>
                <span style={{ padding: "3px 11px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--mc-surface-3)", color: "var(--mc-text-2)", border: "1px solid var(--mc-line)" }}>{vaca.lote}</span>
                <span style={{ padding: "3px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.tc, border: `1px solid ${badge.b}` }}>{vaca.estado}</span>
                <span style={{ padding: "3px 11px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--mc-surface-3)", color: "var(--mc-text-2)", border: "1px solid var(--mc-line)" }}>{lactN}</span>
              </div>
              <div style={{ fontSize: 21, fontWeight: 800, color: "var(--mc-ink)", letterSpacing: "-.02em" }}>{vaca.raza}</div>
            </div>
            <div style={{ display: "flex", gap: 0, background: "var(--mc-surface-2)", borderRadius: 12, border: "1px solid var(--mc-line)", overflow: "hidden", flexShrink: 0 }}>
              {[
                { val: vaca.hoy !== null ? `${Math.round(vaca.hoy)} lt` : "—", lbl: "Último día", c: "var(--mc-green-700)" },
                { val: avg7 !== null ? `${avg7} lt` : "—", lbl: "Prom. 7d", c: "var(--mc-ink)" },
                { val: vaca.del !== null ? `${vaca.del} DEL` : "—", lbl: "Días en Leche", c: "var(--mc-ink)" },
                { val: vaca.pct !== null ? `${vaca.pct}%` : "—", lbl: "Vs curva", c: pColor },
              ].map((s, i) => (
                <div key={i} style={{ padding: "10px 18px", textAlign: "center", borderLeft: i > 0 ? "1px solid var(--mc-line)" : "none", minWidth: 80 }}>
                  <div style={{ fontSize: 19, fontWeight: 800, color: s.c, letterSpacing: "-.01em", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "var(--mc-text-3)", marginTop: 3, whiteSpace: "nowrap" }}>{s.lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ fontSize: 11, whiteSpace: "nowrap" }} onClick={() => abrirFicha(vaca.caravana)}>Ficha en Animales →</button>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={14} /></button>
            </div>
          </div>
        </div>

        {/* Body 3 col */}
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", minHeight: 0 }}>
          {/* Izquierda: datos */}
          <div style={{ padding: 20, borderRight: "1px solid var(--mc-line)", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Datos de Lactancia</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { val: vaca.hoy !== null ? `${Math.round(vaca.hoy)} lt` : "—", lbl: "Último día", accent: true },
                  { val: avg7 !== null ? `${avg7} lt` : "—", lbl: "Promedio 7 días" },
                  { val: vaca.del !== null ? `${vaca.del} días` : "—", lbl: "Días en Leche" },
                  { val: vaca.pct !== null ? `${vaca.pct}%` : "—", lbl: "Vs curva esperada", col: pColor },
                  { val: lactN, lbl: "Lactancia" },
                  { val: vaca.lote, lbl: "Lote" },
                ].map((s: { val: string; lbl: string; accent?: boolean; col?: string }, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: "var(--mc-surface-2)", borderRadius: 10, border: "1px solid var(--mc-line)" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.col || (s.accent ? "var(--mc-green-700)" : "var(--mc-ink)"), lineHeight: 1.1, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "12px 14px", background: badge.bg, borderRadius: 12, border: `1px solid ${badge.b}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Estado actual</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, fontSize: 13, fontWeight: 700, background: "var(--mc-surface)", color: badge.tc, border: `1px solid ${badge.b}` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: badge.tc }} />{vaca.estado}
              </span>
              <div style={{ fontSize: 11, color: "var(--mc-text-2)", marginTop: 8, lineHeight: 1.5 }}>{stateDesc[vaca.estado] || "En lactancia."}</div>
            </div>
          </div>

          {/* Centro: gráfico 14 días */}
          <div style={{ padding: 20, borderRight: "1px solid var(--mc-line)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>Producción últimos 14 días</div>
            <div style={{ background: "var(--mc-surface-2)", borderRadius: 12, padding: "14px 12px 10px", border: "1px solid var(--mc-line)", flex: 1, display: "flex", flexDirection: "column" }}>
              {reales.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--mc-text-3)", textAlign: "center", padding: "20px 0" }}>
                  Sin ordeñes registrados en los últimos 14 días.
                </div>
              ) : (
                <>
                  <svg width="100%" viewBox={`0 0 ${svgW} ${svgH + 22}`} style={{ overflow: "visible", display: "block", flex: 1 }}>
                    {[0, 10, 20, 30].filter((v) => v < maxV).map((v) => (
                      <g key={v}>
                        <line x1={18} y1={yp(v)} x2={svgW - 8} y2={yp(v)} stroke="var(--mc-line)" strokeWidth={0.8} />
                        <text x={16} y={yp(v) + 3} textAnchor="end" fontSize={8} fill="var(--mc-text-3)">{v}</text>
                      </g>
                    ))}
                    {vaca.del !== null && <polyline points={ptsDe((s) => s.exp)} fill="none" stroke="var(--mc-muted)" strokeWidth={1.5} strokeDasharray="5,3" />}
                    <polyline points={ptsDe((s) => s.real)} fill="none" stroke="var(--mc-green-600)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    {serie14.map((s, i) => {
                      if (s.real === null) return null;
                      const last = i === serie14.length - 1 || !serie14.slice(i + 1).some((x) => x.real !== null);
                      return (
                        <g key={i}>
                          <circle cx={xp(i)} cy={yp(s.real)} r={last ? 7 : 3} fill={last ? "var(--mc-green-600)" : "var(--mc-surface)"} stroke="var(--mc-green-600)" strokeWidth={last ? 0 : 1.5} />
                          {last && <text x={xp(i)} y={yp(s.real) - 12} textAnchor="middle" fontSize={9} fill="var(--mc-green-700)" fontWeight={700}>{Math.round(s.real)} lt</text>}
                        </g>
                      );
                    })}
                    {serie14.map((s, i) => i % 3 === 0 && <text key={i} x={xp(i)} y={svgH + 18} textAnchor="middle" fontSize={8} fill="var(--mc-text-3)">{s.label}</text>)}
                  </svg>
                  <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                    {vaca.del !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--mc-text-3)" }}>
                        <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="var(--mc-muted)" strokeWidth="1.5" strokeDasharray="4,2" /></svg>Esperado
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--mc-green-700)" }}>
                      <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="var(--mc-green-600)" strokeWidth="2.5" strokeLinecap="round" /></svg>Real
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Derecha: lactancia actual + anterior */}
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>Historial</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ padding: 12, background: "var(--mc-green-50)", border: "1.5px solid var(--mc-green-200)", borderRadius: 12, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, bottom: 0, background: "var(--mc-green-600)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: "var(--mc-green-600)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>{vaca.lactancia || "—"}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>Lactancia actual</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--mc-text-2)", lineHeight: 1.7, paddingLeft: 32 }}>
                  <div>{vaca.del !== null ? `${vaca.del} DEL` : "Sin fecha de parto"}</div>
                  <div>Pico registrado: <b>{vaca.puntosDEL.length ? `${Math.round(Math.max(...vaca.puntosDEL.map((p) => p.litros)))} lt` : "—"}</b></div>
                  <div style={{ color: "var(--mc-text-3)" }}>
                    Acumulado: {vaca.puntosDEL.length ? `${nfLt.format(Math.round(vaca.puntosDEL.reduce((s, p) => s + p.litros, 0)))} lt registrados` : "sin registros"}
                  </div>
                </div>
              </div>
              {vaca.delAnterior.length > 0 && (
                <div style={{ padding: 12, background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line)", borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: "var(--mc-surface-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mc-text-2)" }}>{Math.max(0, vaca.lactancia - 1) || "—"}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>Lactancia anterior</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--mc-text-2)", lineHeight: 1.7, paddingLeft: 32 }}>
                    <div>Pico registrado: <b>{Math.round(Math.max(...vaca.delAnterior.map((p) => p.litros)))} lt</b></div>
                    <div style={{ color: "var(--mc-text-3)" }}>{vaca.delAnterior.length} días con registro</div>
                  </div>
                </div>
              )}
              {vaca.delAnterior.length === 0 && vaca.lactancia <= 1 && (
                <div style={{ fontSize: 11, color: "var(--mc-text-3)", padding: "4px 2px" }}>Primera lactancia registrada en el sistema.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => setModalObs(true)} className="mc-btn mc-btn--ghost" style={{ flex: 1, fontSize: 12 }}>📋 Registrar observación</button>
          <button className="mc-btn mc-btn--primary" style={{ flex: 1, fontSize: 12 }} onClick={() => abrirFicha(vaca.caravana)}>Ver ficha en Animales →</button>
        </div>
        {modalObs && <ModalRegistrarObservacion vaca={vaca} onClose={() => setModalObs(false)} />}
      </div>
    </div>
  );
}

/* ============ DRAWER DE VACA EN ALERTA (Resumen) ============ */

export function PLVacaDrawer({ vaca, esperada, onClose }: { vaca: VacaLechera; esperada: WoodParams; onClose: () => void }) {
  const [modalObs, setModalObs] = useState(false);
  const abrirFicha = useAbrirFicha();

  const mini = vaca.serie.slice(-7);
  const svgW = 220, svgH = 60;
  const expVals = mini.map((d, i) => (vaca.del !== null ? wood(Math.max(1, vaca.del - (mini.length - 1 - i)), esperada) : 0));
  const maxV = Math.max(...mini.map((d) => d.litros), ...expVals, 10) + 4;
  const pts = (arr: number[]) => arr.map((v, i) => `${(i / Math.max(1, arr.length - 1)) * svgW},${svgH - (v / maxV) * svgH}`).join(" ");
  const desvio = vaca.pct !== null ? `${vaca.pct - 100}%` : "—";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,12,.45)", zIndex: 8000, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div style={{ width: 480, maxWidth: "94vw", maxHeight: "88vh", background: "var(--mc-surface)", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "var(--mc-surface-3)", color: "var(--mc-ink)" }}>Vaca #{vaca.caravana}</span>
              <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>{vaca.lote}</span>
              <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>Caída Brusca</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ fontSize: 11 }} onClick={() => abrirFicha(vaca.caravana)}>Ver ficha completa →</button>
              <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={13} /></button>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { val: vaca.prom7 !== null ? `${vaca.prom7} lt` : "—", lbl: "Promedio 7d" },
              { val: vaca.hoy !== null ? `${Math.round(vaca.hoy)} lt` : "—", lbl: "Producción último día", red: true },
              { val: desvio, lbl: "Desvío vs curva", red: true },
              { val: vaca.del !== null ? `${vaca.del} DEL` : "—", lbl: "Días en leche" },
              { val: vaca.lactancia ? `${vaca.lactancia}º Parto` : "—", lbl: "Lactancia" },
              { val: vaca.lote, lbl: "Lote actual" },
            ].map((s: { val: string; lbl: string; red?: boolean }, i) => (
              <div key={i} style={{ background: "var(--mc-surface-2)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.red ? "#c93434" : "var(--mc-ink)", letterSpacing: "-.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
          {mini.length > 1 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 8 }}>Producción últimos {mini.length} registros</div>
              <div style={{ background: "var(--mc-surface-2)", borderRadius: 10, padding: "12px 16px" }}>
                <svg width="100%" viewBox={`0 0 ${svgW} ${svgH + 10}`} style={{ overflow: "visible" }}>
                  {vaca.del !== null && <polyline points={pts(expVals)} fill="none" stroke="#d9d6cc" strokeWidth="1.5" strokeDasharray="4,3" />}
                  <polyline points={pts(mini.map((d) => d.litros))} fill="none" stroke="#c93434" strokeWidth="2" />
                  {mini.map((d, i) => (
                    <circle key={i} cx={(i / Math.max(1, mini.length - 1)) * svgW} cy={svgH - (d.litros / maxV) * svgH} r={i === mini.length - 1 ? 5 : 3} fill={i === mini.length - 1 ? "#c93434" : "var(--mc-surface)"} stroke="#c93434" strokeWidth="1.5" />
                  ))}
                </svg>
                <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                  {vaca.del !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--mc-text-3)" }}>
                      <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="#d9d6cc" strokeWidth="2" strokeDasharray="4,3" /></svg>Esperado
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#c93434" }}>
                    <div style={{ width: 18, height: 2, background: "#c93434" }} />Real
                  </div>
                </div>
              </div>
            </div>
          )}
          <div style={{ position: "relative", borderRadius: 10, padding: "12px 14px", background: "linear-gradient(var(--mc-surface),var(--mc-surface)) padding-box,linear-gradient(135deg,#00FF00 0%,#FF9D00 100%) border-box", border: "3px solid transparent" }}>
            <div style={{ position: "absolute", top: -10, right: 12, width: 28, height: 28, borderRadius: "50%", background: "var(--mc-surface)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,.12)" }}>
              <Icon name="sparkles" size={14} style={{ color: "#FF9D00" }} />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon name="brain" size={16} style={{ color: "#c48410", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7a5010", marginBottom: 4 }}>Sugerencia MiCampo</div>
                <div style={{ fontSize: 12, color: "#7a5010", lineHeight: 1.5 }}>
                  La caída sostenida puede indicar inicio de mastitis o problema nutricional. Revisar RCS individual y consumo de ración, y registrar una observación para hacer seguimiento.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 8, flexShrink: 0 }}>
          <button className="mc-btn mc-btn--ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => setModalObs(true)}>📋 Registrar observación</button>
          <button className="mc-btn mc-btn--primary" style={{ flex: 1, fontSize: 12 }} onClick={() => abrirFicha(vaca.caravana)}>Ver ficha en Animales →</button>
        </div>
        {modalObs && <ModalRegistrarObservacion vaca={vaca} onClose={() => setModalObs(false)} />}
      </div>
    </div>
  );
}
