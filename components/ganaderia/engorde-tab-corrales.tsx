"use client";

// Pestaña Corrales: tabla de seguimiento con progreso a meta (arco), GDP,
// condición corporal, proyección de faena y expand con historial de pesadas.
// Mapa de ocupación y alertas. Datos reales de /api/corrales-engorde.

import React, { useMemo, useState } from "react";
import { KPI, Icon, useToast } from "@/components/mc";
import {
  CorralAPI,
  coma,
  estadoConf,
  estadoCorral,
  gdpColor,
  gdpReal,
  nfEng,
  pesoAnterior,
  proyFaenaLabel,
} from "./engorde-tipos";
import { ArcProgress, CCIndicator } from "./engorde-ui";
import { ModalIngresoCorral, ModalRegistrarPesaje } from "./engorde-modales";

type RacionLite = { id: string; nombre: string; etapaProductiva?: string | null; animalObjetivo?: string | null };

function ccDeCorral(c: CorralAPI): number | null {
  const nota = (c.pesadas || []).find((p) => /CC\s*([\d.]+)/i.test(p.notas || ""))?.notas;
  const m = nota ? /CC\s*([\d.]+)/i.exec(nota) : null;
  return m ? parseFloat(m[1]) : null;
}

export function EngordeCorrales({ corrales, raciones, focusId, onRefresh }: { corrales: CorralAPI[]; raciones: RacionLite[]; focusId?: string | null; onRefresh: () => void }) {
  const toast = useToast();
  const [modalPesaje, setModalPesaje] = useState<string | boolean>(false);
  const [modalIngreso, setModalIngreso] = useState(false);
  // Si llegamos desde el Resumen (click en un corral), abrimos su historial de
  // pesadas ya en el estado inicial (la pestaña se monta con focusId presente).
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => (focusId ? { [focusId]: true } : {}));
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const activos = useMemo(() => corrales.filter((c) => c.estado !== "Cerrado"), [corrales]);
  const pesoProm = activos.length ? Math.round(activos.reduce((s, c) => s + (c.pesoActual ?? c.pesoIngreso ?? 0), 0) / activos.length) : 0;
  const gdps = activos.map((c) => gdpReal(c)).filter((g): g is number => g !== null);
  const gdpHato = gdps.length ? coma(gdps.reduce((a, b) => a + b, 0) / gdps.length, 2) : "—";
  const listos = activos.filter((c) => estadoCorral(c) === "listo" || c.estado === "Listo");
  const listosCab = listos.reduce((s, c) => s + c.cabezas, 0);
  const carneProducida = coma(activos.reduce((s, c) => { const ant = pesoAnterior(c); const act = c.pesoActual ?? c.pesoIngreso; return s + (ant != null && act != null ? (act - ant) * c.cabezas : 0); }, 0) / 1000, 1);

  const alertas = activos.filter((c) => { const g = gdpReal(c); return g !== null && c.gdpObjetivo && g < c.gdpObjetivo * 0.85; });

  return (
    <div className="col gap-16">
      {toast.node}
      {modalPesaje && <ModalRegistrarPesaje corrales={activos} corralInicial={typeof modalPesaje === "string" ? modalPesaje : undefined} onClose={() => setModalPesaje(false)} onGuardado={() => { toast.show("Pesaje registrado"); onRefresh(); }} />}
      {modalIngreso && <ModalIngresoCorral raciones={raciones} onClose={() => setModalIngreso(false)} onGuardado={() => { toast.show("Corral creado"); onRefresh(); }} />}

      <div className="grid g-cols-5">
        <KPI label="Corrales Activos" value={String(activos.length)} delta={`${listos.length} listos para faena`} trend="up" icon="cow" accent />
        <KPI label="Peso Promedio" value={pesoProm ? String(pesoProm) : "—"} delta="kg promedio del hato" icon="activity" />
        <KPI label="GDP del Hato" value={gdpHato} delta="kg/día promedio" trend="up" icon="arrowUp" />
        <KPI label="Listos para Faena" value={nfEng.format(listosCab)} delta={`${listos.length} corrales completos`} trend="up" icon="check" />
        <KPI label="Carne Producida" value={carneProducida} delta="tn ganadas este ciclo" trend="up" icon="box" />
      </div>

      <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--secondary" onClick={() => setModalIngreso(true)}><Icon name="truck" size={14} />Ingreso a Corral</button>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalPesaje(true)} disabled={activos.length === 0}><Icon name="scale" size={14} />Registrar Pesaje</button>
      </div>

      {/* Tabla */}
      <div className="mc-card">
        <div className="mc-card__head" style={{ borderBottom: "1px solid var(--mc-line)", paddingBottom: 12, marginBottom: 4 }}>
          <div>
            <div className="mc-card__title">Seguimiento de Corrales & Proyección a Venta</div>
            <div className="text-xs text-muted mt-4">GDP, condición corporal y fecha estimada de faena</div>
          </div>
        </div>
        {activos.length === 0 ? (
          <div className="mc-empty" style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div className="mc-empty__icon" style={{ margin: 0 }}><Icon name="cow" size={22} /></div>
            <div>Sin corrales de engorde cargados</div>
            <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setModalIngreso(true)}><Icon name="plus" size={12} /> Crear el primer corral</button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--mc-surface-2)" }}>
                  {["Corral", "Cabezas", "Peso Ant.", "Peso Act.", "Meta", "Progreso", "GDP", "Cond. Corp.", "Estado", "Proy. Faena", ""].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: h === "Corral" ? "left" : "center", fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activos.map((c) => {
                  const ant = pesoAnterior(c);
                  const act = c.pesoActual ?? c.pesoIngreso ?? 0;
                  const diff = ant != null ? act - ant : null;
                  const g = gdpReal(c);
                  const ec = estadoConf[estadoCorral(c)];
                  const pctMeta = c.pesoObjetivo ? Math.round((act / c.pesoObjetivo) * 100) : 0;
                  const cc = ccDeCorral(c);
                  const pesadas = (c.pesadas || []).slice().sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                  return (
                    <React.Fragment key={c.id}>
                      <tr onClick={() => toggle(c.id)} style={{ cursor: "pointer", borderTop: "1px solid var(--mc-line)" }}>
                        <td style={{ padding: "10px 10px" }}>
                          <div className="row gap-6" style={{ alignItems: "center" }}>
                            <Icon name={expanded[c.id] ? "chevron-down" : "chevron-right"} size={13} style={{ color: "var(--mc-muted)", flexShrink: 0 }} />
                            <div>
                              <div className="font-semi" style={{ fontSize: 13 }}>{c.nombre}</div>
                              <div className="text-xs text-muted">{c.categoria || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 10px", fontWeight: 600, textAlign: "center" }}>{c.cabezas}</td>
                        <td style={{ padding: "10px 10px", color: "var(--mc-muted)", textAlign: "center" }}>{ant != null ? `${Math.round(ant)} kg` : "—"}</td>
                        <td style={{ padding: "10px 10px", fontWeight: 700, textAlign: "center" }}>{Math.round(act)} kg</td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>
                          {c.pesoObjetivo ? (<><div style={{ fontWeight: 700, color: "var(--mc-text-2)", fontSize: 13 }}>{c.pesoObjetivo} kg</div><div style={{ fontSize: 10, color: "var(--mc-muted)", marginTop: 1 }}>objetivo</div></>) : <span style={{ color: "var(--mc-text-3)" }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>
                          {c.pesoObjetivo ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                              <ArcProgress pct={pctMeta} size={44} stroke={4.5} />
                              <div style={{ textAlign: "left" }}><div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-2)" }}>{Math.round(act)}/{c.pesoObjetivo}</div><div style={{ fontSize: 10, color: "var(--mc-muted)" }}>faltan {Math.max(0, Math.round(c.pesoObjetivo - act))} kg</div></div>
                            </div>
                          ) : <span style={{ color: "var(--mc-text-3)" }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>
                          {g !== null ? (<><div style={{ fontWeight: 700, color: gdpColor(g) }}>{coma(g, 2)} <span style={{ fontSize: 11, fontWeight: 400 }}>kg/d</span></div>{diff != null && ant ? <div style={{ fontSize: 10, color: gdpColor(g) }}>{diff > 0 ? "+" : ""}{coma((diff / ant) * 100, 1)}%</div> : null}</>) : <span style={{ color: "var(--mc-text-3)" }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}><CCIndicator cc={cc} /></td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}><span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: ec.bg, color: ec.color }}>{ec.label}</span></td>
                        <td style={{ padding: "10px 10px", textAlign: "center", fontWeight: 600 }}>{proyFaenaLabel(c)}</td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>
                          <button className="mc-icon-btn" title="Registrar pesaje" onClick={(e) => { e.stopPropagation(); setModalPesaje(c.id); }}><Icon name="scale" size={14} /></button>
                        </td>
                      </tr>
                      {expanded[c.id] && (
                        <tr>
                          <td colSpan={11} style={{ padding: 0, background: "var(--mc-surface-2)", borderBottom: "1px solid var(--mc-line)" }}>
                            <div style={{ padding: "10px 10px 14px 34px" }}>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Historial de pesadas {pesadas.length ? `· ${pesadas.length}` : ""}</div>
                              {pesadas.length === 0 ? (
                                <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin pesadas registradas. Registrá una con el ícono de balanza.</div>
                              ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                                  <thead>
                                    <tr>{["Fecha", "Peso prom.", "GDP", "Consumo", "Cabezas"].map((h) => <th key={h} style={{ padding: "6px 8px", textAlign: h === "Fecha" ? "left" : "center", fontSize: 10, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>)}</tr>
                                  </thead>
                                  <tbody>
                                    {pesadas.map((p) => (
                                      <tr key={p.id} style={{ background: "var(--mc-surface)" }}>
                                        <td style={{ padding: "7px 8px", fontWeight: 600 }}>{new Date(p.fecha).toLocaleDateString("es-AR")}</td>
                                        <td style={{ padding: "7px 8px", textAlign: "center", fontWeight: 700 }}>{Math.round(p.pesoPromedio)} kg</td>
                                        <td style={{ padding: "7px 8px", textAlign: "center", color: gdpColor(p.gdp ?? null) }}>{p.gdp != null ? `${coma(p.gdp, 2)} kg/d` : "—"}</td>
                                        <td style={{ padding: "7px 8px", textAlign: "center" }}>{p.consumo != null ? `${coma(p.consumo, 1)} kg` : "—"}</td>
                                        <td style={{ padding: "7px 8px", textAlign: "center" }}>{p.cabezas ?? c.cabezas}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mapa de ocupación */}
      {activos.length > 0 && (
        <div className="mc-card">
          <div className="mc-card__head" style={{ borderBottom: "1px solid var(--mc-line)", paddingBottom: 12, marginBottom: 4 }}>
            <div className="row gap-8">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mc-green-50)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="grid" size={14} style={{ color: "#16a34a" }} /></div>
              <div>
                <div className="mc-card__title">Mapa de Ocupación</div>
                <div className="text-xs text-muted">Cabezas vs. capacidad por corral</div>
              </div>
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
            {activos.map((c) => {
              const ec = estadoConf[estadoCorral(c)];
              const occPct = c.capacidad ? Math.round((c.cabezas / c.capacidad) * 100) : null;
              return (
                <div key={c.id} style={{ padding: 12, borderRadius: 10, border: "1px solid var(--mc-line)", background: "var(--mc-surface)" }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>{c.nombre}</div>
                    <div style={{ width: 7, height: 7, borderRadius: 4, background: ec.color, marginTop: 3, flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--mc-muted)", marginTop: 2 }}>{c.categoria || "—"}</div>
                  <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: "var(--mc-line)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(occPct ?? 0, 100)}%`, background: (occPct ?? 0) >= 95 ? "#dc2626" : (occPct ?? 0) >= 80 ? "#c48410" : "#16a34a", borderRadius: 3 }} />
                  </div>
                  <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-ink)" }}>{c.cabezas}{c.capacidad ? `/${c.capacidad}` : ""}</span>
                    <span style={{ fontSize: 10, color: "var(--mc-muted)" }}>{occPct !== null ? `${occPct}%` : "s/cap."}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="mc-card">
          <div className="mc-card__head" style={{ borderBottom: "1px solid var(--mc-line)", paddingBottom: 12, marginBottom: 4 }}>
            <div className="row gap-8">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mc-red-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="alert-triangle" size={14} style={{ color: "#dc2626" }} /></div>
              <div>
                <div className="mc-card__title">Alertas de Bajo Rendimiento</div>
                <div className="text-xs text-muted">Corrales bajo objetivo de GDP</div>
              </div>
            </div>
            <span className="mc-badge mc-badge--red">{alertas.length}</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
            {alertas.map((c) => {
              const g = gdpReal(c)!;
              return (
                <div key={c.id} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--mc-red-bg)", border: "1px solid rgba(201,52,52,.2)" }}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                    <div><div style={{ fontWeight: 700, fontSize: 13, color: "var(--mc-ink)" }}>{c.nombre}</div><div style={{ fontSize: 11, color: "var(--mc-muted)" }}>{c.cabezas} cab. · {Math.round(c.pesoActual ?? 0)} kg</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: 800, color: "var(--mc-red)" }}>{coma(g, 2)} <span style={{ fontSize: 10, fontWeight: 400 }}>kg/d</span></div><div style={{ fontSize: 10, color: "var(--mc-red)" }}>obj. {coma(c.gdpObjetivo!, 2)}</div></div>
                  </div>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: "var(--mc-surface)" }}>
                    <div style={{ height: "100%", width: `${Math.min((g / (c.gdpObjetivo || 1)) * 100, 100)}%`, background: "#dc2626", borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
