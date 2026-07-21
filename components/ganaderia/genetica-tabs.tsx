"use client";

// Tabs del módulo Genética: Resumen (mérito genético, distribución, ranking),
// Reproductores (catálogo con DEPs) y ROI Genético (retorno + sugerencia de
// cruza IA). Todo derivado de datos reales.

import React, { useState } from "react";
import { KPI, Icon, IABadge, useToast } from "@/components/mc";
import { AnimalRow } from "./tipos";
import {
  HembraLite,
  ROIAPI,
  ReproductorAPI,
  colorRaza,
  depLeche,
  depPeso,
  fmtDep,
  recomendarToros,
} from "./genetica-tipos";
import { ModalNuevoReproductor, ModalDetalleReproductor, ModalNuevoROI } from "./genetica-modales";

function UsoBar({ pct }: { pct: number }) {
  const color = pct > 70 ? "var(--mc-green-500)" : pct >= 40 ? "var(--mc-amber)" : "#94a3b8";
  return (
    <div className="row gap-8" style={{ alignItems: "center", justifyContent: "flex-end" }}>
      <div style={{ width: 70, height: 6, borderRadius: 3, background: "var(--mc-line)", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span className="font-mono" style={{ fontSize: 12, color: "var(--mc-text-2)", minWidth: 30, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

/* ============ RESUMEN ============ */

export function GeneticaResumen({ toros, torosSinRegistro, onRefresh }: { toros: ReproductorAPI[]; torosSinRegistro: AnimalRow[]; onRefresh: () => void }) {
  const toast = useToast();
  const [modalNuevo, setModalNuevo] = useState(false);
  const [hover, setHover] = useState<ReproductorAPI | null>(null);
  const [hoverRaza, setHoverRaza] = useState<string | null>(null);

  const conReg = toros.filter((t) => t.registroGenetico);
  const lecheVals = conReg.map((t) => depLeche(t)).filter((v): v is number => v != null);
  const pesoVals = conReg.map((t) => depPeso(t)).filter((v): v is number => v != null);
  const promLeche = lecheVals.length ? lecheVals.reduce((a, b) => a + b, 0) / lecheVals.length : null;
  const promPeso = pesoVals.length ? pesoVals.reduce((a, b) => a + b, 0) / pesoVals.length : null;
  const totalCrias = toros.reduce((s, t) => s + t.crias, 0);
  const destacados = [...toros].sort((a, b) => b.uso - a.uso || b.crias - a.crias).slice(0, 6);

  // Distribución por raza
  const conteo: Record<string, number> = {};
  toros.forEach((t) => { const r = t.raza || "Sin raza"; conteo[r] = (conteo[r] || 0) + 1; });
  const entradas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  const R = 68, CX = 82, CY = 82, STROKE = 22, circ = 2 * Math.PI * R;
  // Offsets acumulados del donut, precomputados para no reasignar en render
  const dashes = entradas.map(([, val]) => (toros.length ? val / toros.length : 0) * circ);
  const offsets = dashes.map((_, i) => dashes.slice(0, i).reduce((acc, d) => acc + d, 0));

  const top6Uso = [...toros].sort((a, b) => b.uso - a.uso).slice(0, 6);
  const maxUso = Math.max(1, ...top6Uso.map((t) => t.uso));

  // Scatter mérito genético
  const scatter = conReg.filter((t) => depLeche(t) != null && depPeso(t) != null);
  const W = 900, H = 340, padL = 54, padR = 24, padT = 24, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const xs = scatter.map((t) => depPeso(t)!), ys = scatter.map((t) => depLeche(t)!);
  const minX = scatter.length ? Math.min(...xs) - 3 : 0, maxX = scatter.length ? Math.max(...xs) + 3 : 10;
  const minY = scatter.length ? Math.min(...ys) - 3 : 0, maxY = scatter.length ? Math.max(...ys) + 3 : 10;
  const px = (v: number) => padL + ((v - minX) / (maxX - minX || 1)) * plotW;
  const py = (v: number) => padT + plotH - ((v - minY) / (maxY - minY || 1)) * plotH;
  const destIds = new Set(destacados.map((t) => t.id));

  return (
    <div className="col gap-20">
      {toast.node}
      {modalNuevo && <ModalNuevoReproductor torosSinRegistro={torosSinRegistro} onClose={() => setModalNuevo(false)} onGuardado={() => { toast.show("Reproductor agregado"); onRefresh(); }} />}

      <div className="grid g-cols-5">
        <KPI label="Toros Activos" value={String(toros.length)} delta={`${conReg.length} con registro genético`} trend="up" icon="users" />
        <KPI label="DEP Leche Promedio" value={promLeche != null ? fmtDep(Math.round(promLeche * 10) / 10) : "—"} delta="del catálogo con datos" trend="up" icon="droplet" />
        <KPI label="DEP Peso Promedio" value={promPeso != null ? `${fmtDep(Math.round(promPeso))} kg` : "—"} delta="del catálogo con datos" trend="up" icon="scale" />
        <KPI label="Crías Vinculadas" value={String(totalCrias)} delta="hijos registrados en el rodeo" trend="up" icon="cow" />
        <KPI label="Razas Representadas" value={String(entradas.length)} delta="en el catálogo genético" trend="up" icon="chart" />
      </div>

      <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalNuevo(true)}><Icon name="plus" size={14} />Nuevo Reproductor</button>
      </div>

      {toros.length === 0 ? (
        <div className="mc-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div className="mc-empty__icon" style={{ margin: "0 auto 12px" }}><Icon name="users" size={22} /></div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 6 }}>Sin reproductores en el catálogo</div>
          <div style={{ fontSize: 13, color: "var(--mc-text-2)", maxWidth: 420, margin: "0 auto 12px" }}>Cargá tus toros (categoría Toro) en Animales y registrá sus DEPs con “Nuevo Reproductor”.</div>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setModalNuevo(true)}><Icon name="plus" size={12} /> Nuevo Reproductor</button>
        </div>
      ) : (
        <>
          {/* Toros destacados */}
          <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="mc-card__head" style={{ padding: "16px 20px 10px", marginBottom: 0 }}>
              <div><div className="mc-card__title">Toros Destacados</div><div className="text-xs text-muted mt-2">Mayor uso y desempeño genético del catálogo</div></div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="mc-table">
                <thead><tr><th>ID</th><th>Nombre</th><th>Raza</th><th className="mc-cell--num">DEP Leche</th><th className="mc-cell--num">DEP Peso</th><th style={{ textAlign: "right" }}>% de Uso</th><th className="mc-cell--num">Crías</th></tr></thead>
                <tbody>
                  {destacados.map((t) => (
                    <tr key={t.id}>
                      <td className="mc-cell--mono">{t.id}</td>
                      <td className="mc-cell--emph">{t.nombre || "—"}</td>
                      <td>{t.raza || "—"}</td>
                      <td className="mc-cell--num font-semi" style={{ color: "var(--mc-green-700)" }}>{fmtDep(depLeche(t))}</td>
                      <td className="mc-cell--num">{depPeso(t) != null ? `${fmtDep(depPeso(t))} kg` : "—"}</td>
                      <td><UsoBar pct={t.uso} /></td>
                      <td className="mc-cell--num">{t.crias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mérito genético */}
          {scatter.length >= 2 && (
            <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="mc-card__head" style={{ padding: "16px 20px 10px", marginBottom: 0 }}>
                <div><div className="mc-card__title">Mapa de Mérito Genético</div><div className="text-xs text-muted mt-2">DEP Peso vs DEP Leche — identificá tus mejores reproductores</div></div>
              </div>
              <div style={{ padding: "6px 16px 16px", position: "relative" }}>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 340, display: "block", overflow: "visible" }}>
                  <defs><radialGradient id="cuadranteDP" cx="100%" cy="0%" r="100%"><stop offset="0%" stopColor="var(--mc-green-100)" stopOpacity="0.65" /><stop offset="100%" stopColor="var(--mc-green-100)" stopOpacity="0" /></radialGradient></defs>
                  {promPeso != null && promLeche != null && (<>
                    <rect x={px(promPeso)} y={padT} width={padL + plotW - px(promPeso)} height={py(promLeche) - padT} fill="url(#cuadranteDP)" />
                    <text x={W - padR - 6} y={padT + 16} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--mc-green-700)">Doble Propósito</text>
                    <line x1={padL} x2={W - padR} y1={py(promLeche)} y2={py(promLeche)} stroke="var(--mc-line)" strokeDasharray="4,4" />
                    <line x1={px(promPeso)} x2={px(promPeso)} y1={padT} y2={H - padB} stroke="var(--mc-line)" strokeDasharray="4,4" />
                  </>)}
                  <text x={padL} y={H - padB + 22} fontSize="10.5" fill="var(--mc-text-3)">DEP Peso →</text>
                  <text x={padL - 40} y={padT - 8} fontSize="10.5" fill="var(--mc-text-3)" transform={`rotate(-90 ${padL - 40} ${padT + plotH / 2})`} textAnchor="middle">DEP Leche →</text>
                  {scatter.filter((t) => !destIds.has(t.id)).map((t) => (
                    <circle key={t.id} cx={px(depPeso(t)!)} cy={py(depLeche(t)!)} r="4" fill="var(--mc-text-3)" opacity="0.35" onMouseEnter={() => setHover(t)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }} />
                  ))}
                  {scatter.filter((t) => destIds.has(t.id)).map((t) => (
                    <g key={t.id} onMouseEnter={() => setHover(t)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                      <circle cx={px(depPeso(t)!)} cy={py(depLeche(t)!)} r="7" fill={colorRaza(t.raza)} stroke="var(--mc-surface)" strokeWidth="2" />
                      <text x={px(depPeso(t)!) + 10} y={py(depLeche(t)!) + 4} fontSize="10.5" fontWeight="700" fill="var(--mc-ink)">{t.id}</text>
                    </g>
                  ))}
                </svg>
                {hover && (
                  <div style={{ position: "absolute", left: `${(px(depPeso(hover)!) / W) * 100}%`, top: `${(py(depLeche(hover)!) / H) * 100}%`, transform: "translate(-50%,-130%)", background: "#1e2a1f", color: "#fff", padding: "8px 12px", borderRadius: 9, fontSize: 11.5, pointerEvents: "none", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,.25)", zIndex: 10 }}>
                    <div style={{ fontWeight: 800 }}>{hover.nombre || hover.id} <span style={{ fontWeight: 500, opacity: 0.75 }}>· {hover.raza || "—"}</span></div>
                    <div style={{ opacity: 0.85, marginTop: 2 }}>DEP Leche {fmtDep(depLeche(hover))} · DEP Peso {fmtDep(depPeso(hover))} · Uso {hover.uso}%</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            {/* Distribución por raza */}
            <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="mc-card__head" style={{ padding: "16px 20px 10px", marginBottom: 0 }}>
                <div><div className="mc-card__title">Distribución por Raza</div><div className="text-xs text-muted mt-2">Composición racial del catálogo</div></div>
              </div>
              <div className="row gap-20" style={{ padding: "10px 22px 22px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <svg viewBox="0 0 164 164" style={{ width: 164, height: 164, transform: "rotate(-90deg)" }}>
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--mc-line)" strokeWidth={STROKE} />
                    {entradas.map(([raza], i) => {
                      const dash = dashes[i], offset = offsets[i];
                      const isHover = hoverRaza === raza;
                      return <circle key={raza} cx={CX} cy={CY} r={R} fill="none" stroke={colorRaza(raza)} strokeWidth={isHover ? STROKE + 5 : STROKE} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} opacity={hoverRaza && !isHover ? 0.35 : 1} style={{ transition: "all .18s ease", cursor: "pointer" }} onMouseEnter={() => setHoverRaza(raza)} onMouseLeave={() => setHoverRaza(null)} />;
                    })}
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 30, fontWeight: 800, color: "var(--mc-ink)" }}>{toros.length}</span>
                    <span style={{ fontSize: 10.5, color: "var(--mc-text-3)", fontWeight: 600 }}>toros</span>
                  </div>
                </div>
                <div className="col gap-10" style={{ flex: 1, minWidth: 140 }}>
                  {entradas.map(([raza, val]) => (
                    <div key={raza} className="row gap-8" style={{ alignItems: "center", cursor: "pointer", opacity: hoverRaza && hoverRaza !== raza ? 0.45 : 1 }} onMouseEnter={() => setHoverRaza(raza)} onMouseLeave={() => setHoverRaza(null)}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: colorRaza(raza), flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: "var(--mc-ink)", flex: 1 }}>{raza}</span>
                      <span className="text-xs text-muted">{Math.round((val / toros.length) * 100)}%</span>
                      <span className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ranking uso */}
            <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="mc-card__head" style={{ padding: "16px 20px 10px", marginBottom: 0 }}>
                <div><div className="mc-card__title">Ranking de Uso</div><div className="text-xs text-muted mt-2">Top reproductores por % de uso (crías)</div></div>
              </div>
              <div className="col gap-12" style={{ padding: "12px 22px 22px" }}>
                {top6Uso.map((t) => (
                  <div key={t.id}>
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: 5 }}>
                      <span className="text-sm" style={{ color: "var(--mc-ink)" }}><span className="font-semi">{t.id}</span> · {t.nombre || "—"}</span>
                      <span className="font-semi text-sm" style={{ color: "var(--mc-green-700)" }}>{t.uso}%</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 5, background: "var(--mc-line)", overflow: "hidden" }}>
                      <div style={{ width: `${(t.uso / maxUso) * 100}%`, height: "100%", borderRadius: 5, background: "linear-gradient(90deg, var(--mc-green-500), var(--mc-green-600))" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============ REPRODUCTORES ============ */

export function GeneticaReproductores({ toros, criasPorPadre }: { toros: ReproductorAPI[]; criasPorPadre: Record<string, AnimalRow[]> }) {
  const [filtro, setFiltro] = useState("Todos");
  const [detalle, setDetalle] = useState<ReproductorAPI | null>(null);
  // Familias de raza reales del catálogo (primer término: "Angus Negro" → "Angus").
  const familias = Array.from(new Set(toros.map((t) => (t.raza || "").split(" ")[0]).filter(Boolean))).sort();
  const razas = ["Todos", ...familias];
  const filtrados = toros.filter((t) => filtro === "Todos" || (t.raza || "").startsWith(filtro));

  const conReg = toros.filter((t) => t.registroGenetico);
  const lecheVals = conReg.map((t) => depLeche(t)).filter((v): v is number => v != null);
  const pesoVals = conReg.map((t) => depPeso(t)).filter((v): v is number => v != null);
  const promLeche = lecheVals.length ? (lecheVals.reduce((a, b) => a + b, 0) / lecheVals.length).toFixed(1) : "—";
  const promPeso = pesoVals.length ? Math.round(pesoVals.reduce((a, b) => a + b, 0) / pesoVals.length) : null;
  const razasRep = new Set(toros.map((t) => t.raza).filter(Boolean)).size;
  const totalCrias = toros.reduce((s, t) => s + t.crias, 0);

  return (
    <div className="col gap-20">
      <div className="grid g-cols-5">
        <KPI label="Reproductores en Catálogo" value={String(toros.length)} delta={`${razasRep} razas representadas`} trend="up" icon="users" />
        <KPI label="DEP Leche Promedio" value={promLeche !== "—" ? `+${promLeche}` : "—"} delta={lecheVals.length ? `${lecheVals.length} con datos` : "sin datos"} trend="up" icon="droplet" />
        <KPI label="DEP Peso Promedio" value={promPeso != null ? `+${promPeso} kg` : "—"} delta={pesoVals.length ? `${pesoVals.length} con datos` : "sin datos"} trend="up" icon="scale" />
        <KPI label="Con Registro Genético" value={String(conReg.length)} delta={`de ${toros.length} toros`} trend="up" icon="flask" />
        <KPI label="Crías Vinculadas" value={String(totalCrias)} delta="hijos en el rodeo" trend="up" icon="cow" />
      </div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
        <div><div style={{ fontSize: 18, fontWeight: 700, color: "var(--mc-ink)" }}>Catálogo de Reproductores</div><div className="text-xs text-muted mt-4">{toros.length} toros en el catálogo</div></div>
        <div className="mc-seg">{razas.map((r) => <button key={r} className={filtro === r ? "is-on" : ""} onClick={() => setFiltro(r)}>{r}</button>)}</div>
      </div>
      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        {filtrados.length === 0 ? (
          <div className="mc-empty" style={{ padding: "40px 0" }}><div className="mc-empty__icon"><Icon name="users" size={22} /></div>{toros.length === 0 ? "Sin reproductores. Agregá toros desde el Resumen." : "Sin toros para el filtro seleccionado."}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="mc-table">
              <thead><tr><th>ID</th><th>Nombre</th><th>Raza</th><th className="mc-cell--num">DEP Leche</th><th className="mc-cell--num">DEP Peso</th><th style={{ textAlign: "right" }}>% de Uso</th><th className="mc-cell--num">Crías</th><th></th></tr></thead>
              <tbody>
                {filtrados.map((t) => (
                  <tr key={t.id}>
                    <td className="mc-cell--mono">{t.id}</td>
                    <td className="mc-cell--emph">{t.nombre || "—"}</td>
                    <td>{t.raza || "—"}</td>
                    <td className="mc-cell--num font-semi" style={{ color: "var(--mc-green-700)" }}>{fmtDep(depLeche(t))}</td>
                    <td className="mc-cell--num">{depPeso(t) != null ? `${fmtDep(depPeso(t))} kg` : "—"}</td>
                    <td><UsoBar pct={t.uso} /></td>
                    <td className="mc-cell--num">{t.crias}</td>
                    <td><button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => setDetalle(t)}>Ver Detalle →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {detalle && <ModalDetalleReproductor toro={detalle} crias={criasPorPadre[detalle.caravana] || []} onClose={() => setDetalle(null)} />}
    </div>
  );
}

/* ============ ROI GENÉTICO ============ */

export function GeneticaROI({ toros, roi, hembras, onRefresh }: { toros: ReproductorAPI[]; roi: ROIAPI[]; hembras: HembraLite[]; onRefresh?: () => void }) {
  const [hembraSel, setHembraSel] = useState<HembraLite | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [modalNuevo, setModalNuevo] = useState(false);

  const totalRetorno = roi.reduce((s, r) => s + (r.ingresoTotal - r.inversionTotal), 0);
  const conRetorno = roi.map((r) => ({ r, retorno: r.ingresoTotal - r.inversionTotal }));
  const mejor = conRetorno.length ? conRetorno.reduce((b, x) => (x.retorno > b.retorno ? x : b)) : null;
  const negativos = conRetorno.filter((x) => x.retorno < 0).length;
  const inversionTotal = roi.reduce((s, r) => s + r.inversionTotal, 0);

  const q = busqueda.trim().toLowerCase();
  const resultados = q === "" ? [] : hembras.filter((h) => h.caravana.toLowerCase().includes(q) || (h.nombre || "").toLowerCase().includes(q));
  const recomendados = hembraSel ? recomendarToros(hembraSel, toros) : [];

  return (
    <div className="col gap-20">
      <div className="grid g-cols-5">
        <KPI label="Retorno Total del Programa" value={`${totalRetorno >= 0 ? "+" : "-"}$${Math.abs(Math.round(totalRetorno)).toLocaleString("es-AR")}`} delta="acumulado, todos los análisis" trend={totalRetorno >= 0 ? "up" : "down"} icon="chart" />
        <KPI label="Mejor ROI" value={mejor ? mejor.r.reproductor?.nombre || mejor.r.reproductor?.caravana || "—" : "—"} delta={mejor ? `+$${Math.round(mejor.retorno).toLocaleString("es-AR")}` : "sin análisis"} trend="up" icon="star" />
        <KPI label="Retorno Negativo" value={String(negativos)} delta={negativos > 0 ? "revisar antes de repetir" : "ninguno"} trend={negativos > 0 ? "down" : "up"} icon="alert-triangle" warn={negativos > 0} />
        <KPI label="Inversión Total" value={`$${Math.round(inversionTotal).toLocaleString("es-AR")}`} delta={`en ${roi.length} análisis`} icon="dollar" />
        <KPI label="Análisis de ROI" value={String(roi.length)} delta="reproductores evaluados" trend="up" icon="activity" />
      </div>
      {modalNuevo && <ModalNuevoROI toros={toros} onClose={() => setModalNuevo(false)} onGuardado={onRefresh} />}

      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
        <div><div style={{ fontSize: 18, fontWeight: 700, color: "var(--mc-ink)" }}>ROI Genético</div><div className="text-xs text-muted mt-4">Retorno de la inversión en genética premium</div></div>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalNuevo(true)} disabled={toros.length === 0}><Icon name="plus" size={14} />Nuevo Análisis ROI</button>
      </div>

      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        {roi.length === 0 ? (
          <div className="mc-empty" style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div className="mc-empty__icon"><Icon name="chart" size={22} /></div>
            <div>Sin análisis de ROI cargados. Registrá inversiones e ingresos por reproductor.</div>
            <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setModalNuevo(true)} disabled={toros.length === 0}><Icon name="plus" size={12} /> Nuevo Análisis ROI</button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="mc-table">
              <thead><tr><th>Reproductor</th><th>Período</th><th className="mc-cell--num">Inversión</th><th className="mc-cell--num">Crías</th><th className="mc-cell--num">Ingresos</th><th className="mc-cell--num">Retorno</th></tr></thead>
              <tbody>
                {roi.map((r) => {
                  const retorno = r.ingresoTotal - r.inversionTotal;
                  return (
                    <tr key={r.id}>
                      <td><div className="mc-cell--emph">{r.reproductor?.nombre || "—"}</div><div className="mc-cell--mono" style={{ fontSize: 11 }}>{r.reproductor?.caravana || ""}</div></td>
                      <td>{r.periodo}</td>
                      <td className="mc-cell--num">${Math.round(r.inversionTotal).toLocaleString("es-AR")}</td>
                      <td className="mc-cell--num">{r.numeroDescendientes}</td>
                      <td className="mc-cell--num">${Math.round(r.ingresoTotal).toLocaleString("es-AR")}</td>
                      <td className="mc-cell--num font-semi" style={{ color: retorno >= 0 ? "var(--mc-green-700)" : "var(--mc-red)" }}>{retorno >= 0 ? "+" : "-"}${Math.abs(Math.round(retorno)).toLocaleString("es-AR")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sugerencia de Cruza IA */}
      <div className="mc-card ia-card" style={{ padding: 20 }}>
        <div className="mc-card__title row gap-8" style={{ alignItems: "center" }}>Sugerencia de Cruza <IABadge /></div>
        <div className="text-xs text-muted mt-4">Elegí una hembra para ver los toros recomendados según objetivo genético y raza.</div>
        <div className="row gap-12" style={{ marginTop: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <span className="text-xs font-semi" style={{ color: "var(--mc-text-2)", paddingTop: 9 }}>Elegí una hembra</span>
          <div style={{ width: 300, maxWidth: "100%" }}>
            <div className="row" style={{ background: "var(--mc-surface-2)", border: "1px solid var(--mc-line-2)", borderRadius: 10, padding: "8px 12px" }}>
              <Icon name="search" size={14} style={{ color: "var(--mc-text-3)" }} />
              <input value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setHembraSel(null); }} placeholder="Buscar hembra por caravana o nombre…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "inherit" }} />
            </div>
            {hembraSel ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, border: "2px solid var(--mc-green-500)", background: "var(--mc-green-50)", marginTop: 8 }}>
                <div style={{ flex: 1 }}><span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{hembraSel.id}</span><span style={{ fontSize: 11.5, color: "var(--mc-text-3)", marginLeft: 8 }}>{hembraSel.nombre || ""} ({hembraSel.objetivo})</span></div>
                <Icon name="check" size={14} style={{ color: "var(--mc-green-600)" }} />
              </div>
            ) : busqueda && (
              <div className="col gap-6" style={{ maxHeight: 160, overflowY: "auto", marginTop: 8 }}>
                {resultados.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin resultados.</div>}
                {resultados.slice(0, 20).map((h) => (
                  <div key={h.id} onClick={() => setHembraSel(h)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, cursor: "pointer", border: "1px solid var(--mc-line)", background: "var(--mc-surface)" }}>
                    <div style={{ flex: 1 }}><span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{h.id}</span><span style={{ fontSize: 11.5, color: "var(--mc-text-3)", marginLeft: 8 }}>{h.nombre || ""} ({h.objetivo})</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {hembraSel && (
          recomendados.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--mc-text-3)", marginTop: 14 }}>No hay toros con DEPs cargados para recomendar. Registrá los DEPs de tus reproductores.</div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 16 }}>
              {recomendados.map((t) => (
                <div key={t.id} style={{ padding: 14, border: "1px solid var(--mc-line)", borderRadius: 10, background: "var(--mc-surface)" }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                    <div><div className="font-semi" style={{ color: "var(--mc-ink)" }}>{t.nombre || t.id}</div><div className="text-xs text-muted">{t.id} · {t.raza || "—"}</div></div>
                    <span className={`mc-badge mc-badge--${t.riesgo === "Medio" ? "amber" : "green"}`}>Consang. {t.riesgo}</span>
                  </div>
                  <div className="font-mono font-semi mt-8" style={{ color: "var(--mc-green-700)" }}>DEP {hembraSel.objetivo === "Leche" ? "Leche" : "Peso"} {hembraSel.objetivo === "Leche" ? fmtDep(depLeche(t)) : fmtDep(depPeso(t))}</div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
