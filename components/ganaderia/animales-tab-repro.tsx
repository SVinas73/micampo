"use client";

// Tab Reproducción: seguimiento de ciclo activo por animal, proyección anual
// de partos (burbujas estacionales) y eficiencia reproductiva (Sankey).
// Todos los números se calculan del rodeo real.

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/mc";
import { AnimalRow } from "./tipos";
import {
  ModalRegistrarCelo,
  ModalRegistrarInseminacion,
  ModalDiagnosticoGestacion,
  ModalPerdidaGestacion,
  ModalTratamientoGestacion,
  ModalPartoRegistro,
  ModalDetalleCicloReproductivo,
} from "./animales-repro-modales";

export function badgeCicloFor(a: AnimalRow): { label: string; bg: string; text: string } {
  if (a.cicloEstado === "celo") return { label: "Celo Registrado", bg: "#f1f5f9", text: "#475569" };
  if (a.cicloEstado === "inseminada") return { label: "Inseminada", bg: "#dbeafe", text: "#1d4ed8" };
  if (a.cicloEstado === "perdida") return { label: "Pérdida", bg: "#fee2e2", text: "#b91c1c" };
  if (a.cicloEstado === "prenada") {
    const diasParaParto = 283 - a.dia;
    if (diasParaParto <= 15) return { label: "Próxima", bg: "#fef3c7", text: "#92400e" };
    return { label: "Preñada", bg: "#dcfce7", text: "#166534" };
  }
  return { label: a.cicloEstado, bg: "#f1f5f9", text: "#475569" };
}

export function AnimRepro({
  animales,
  onGuardado,
}: {
  animales: AnimalRow[];
  onGuardado?: () => void;
}) {
  const [filtCat, setFiltCat] = useState("Todas");
  const [modalCelo, setModalCelo] = useState(false);
  const [modalInsem, setModalInsem] = useState<AnimalRow | null>(null);
  const [modalDiagnostico, setModalDiagnostico] = useState<AnimalRow | null>(null);
  const [modalPerdida, setModalPerdida] = useState<AnimalRow | null>(null);
  const [modalTratamiento, setModalTratamiento] = useState<AnimalRow | null>(null);
  const [modalParto, setModalParto] = useState<AnimalRow | null>(null);
  const [modalDetalleCiclo, setModalDetalleCiclo] = useState<AnimalRow | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [hovBub, setHovBub] = useState<number | null>(null);
  const [hovFlow, setHovFlow] = useState<number | null>(null);
  const [hovNode, setHovNode] = useState<string | null>(null);

  const hembras = animales.filter((a) => a.sexo === "H" && a.activo);

  const activos = hembras.filter((a) => {
    if (a.cicloEstado === "vacia" || a.cicloEstado === "sin-datos") return false;
    if (a.cicloEstado === "perdida") return (a.perdidaHace ?? 0) <= 7;
    return true;
  });

  const filtradas = filtCat === "Todas" ? activos : activos.filter((a) => (filtCat === "Vaca" ? a.categoria === "Vaca" : a.categoria === "Vaquillona"));

  const buildAcciones = (a: AnimalRow) => {
    const siempre = [{ key: "detalle", label: "Ver Detalle", icon: "eye", onClick: () => setModalDetalleCiclo(a) }];
    const tratamiento = { key: "tratamiento", label: "Tratamiento", icon: "syringe", onClick: () => setModalTratamiento(a) };
    const contextual: { key: string; label: string; icon: string; onClick: () => void }[] = [];
    const extra: { key: string; label: string; icon: string; onClick: () => void }[] = [];
    if (a.cicloEstado === "celo") contextual.push({ key: "inseminar", label: "Inseminar", icon: "cow", onClick: () => setModalInsem(a) });
    if (a.cicloEstado === "inseminada") contextual.push({ key: "diagnosticar", label: "Diagnosticar", icon: "activity", onClick: () => setModalDiagnostico(a) });
    if (a.cicloEstado === "prenada") {
      contextual.push({ key: "parto", label: "Parto", icon: "cow", onClick: () => setModalParto(a) });
      extra.push({ key: "perdida", label: "Pérdida", icon: "alert", onClick: () => setModalPerdida(a) });
    }
    const total = siempre.length + 1 + contextual.length + extra.length;
    if (total > 3) return { inline: [...siempre, ...contextual], mas: [tratamiento, ...extra] };
    return { inline: [...siempre, tratamiento, ...contextual], mas: [] as typeof extra };
  };

  // ── Proyección anual de partos: partos esperados por mes (fechaEsperadaParto real) ──
  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const mesesParto = useMemo(() => {
    const counts = Array(12).fill(0) as number[];
    for (const a of hembras) {
      const f = a.api.historialReproductivo?.fechaEsperadaParto;
      if (f && a.cicloEstado === "prenada") counts[new Date(f).getMonth()] += 1;
    }
    return MESES.map((m, i) => ({ m, n: counts[i] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hembras]);
  const totalPartosProy = mesesParto.reduce((a, b) => a + b.n, 0);

  // ── Sankey: eficiencia reproductiva real ──
  const vientres = hembras.filter((a) => ["Vaca", "Vaquillona"].includes(a.categoria)).length || hembras.length;
  const enServicio = hembras.filter((a) => ["inseminada", "prenada"].includes(a.cicloEstado) || a.api.historialReproductivo?.ultimoServicio).length;
  const prenadas = hembras.filter((a) => a.cicloEstado === "prenada").length;
  const perdidas = hembras.filter((a) => (a.api.eventosReproductivos || []).some((e) => e.tipo === "Aborto")).length;

  // Bubble geometry
  const minN = Math.min(...mesesParto.map((m) => m.n));
  const maxN2 = Math.max(1, ...mesesParto.map((m) => m.n));
  const getR = (n: number) => 13 + ((n - minN) / Math.max(1, maxN2 - minN)) * 19;
  const seasonOf = (i: number) => {
    if ([2, 3, 4].includes(i)) return { label: "Otoño", dot: "#f97316" };
    if ([5, 6, 7].includes(i)) return { label: "Invierno", dot: "#3b82f6" };
    if ([8, 9, 10].includes(i)) return { label: "Primavera", dot: "#22c55e" };
    return { label: "Verano", dot: "#eab308" };
  };
  const getGrad = (n: number) => {
    if (n >= 40) return { c1: "#052e16", c2: "#166534", c3: "#22c55e", glow: "#16a34a" };
    if (n >= 20) return { c1: "#14532d", c2: "#16a34a", c3: "#4ade80", glow: "#22c55e" };
    if (n >= 10) return { c1: "#166534", c2: "#22c55e", c3: "#86efac", glow: "#4ade80" };
    return { c1: "#78350f", c2: "#d97706", c3: "#fbbf24", glow: "#f59e0b" };
  };
  const VW = 560, VH = 172;
  const COL_W = VW / 12;
  const CYb = 78;

  // Sankey geometry (valores reales)
  const skW = 350, skH = 230;
  const COLS = [10, 110, 206, 290];
  const NW = 22;
  const TOTAL = Math.max(1, vientres);
  const PAD_T = 32, PAD_B = 30;
  const DRAWABLE = skH - PAD_T - PAD_B;
  const s = (v: number) => (v / TOTAL) * DRAWABLE;
  const GAP = 8;

  const rechazo = Math.max(0, vientres - enServicio);
  const fallas = Math.max(0, enServicio - prenadas);
  const partosEstimados = Math.max(0, prenadas - perdidas);
  const nodes: Record<string, { col: number; val: number; label: string; color: string }> = {
    VT: { col: 0, val: vientres, label: "Vientres Totales", color: "#1e3a2a" },
    ES: { col: 1, val: enServicio, label: "En Servicio", color: "#15803d" },
    RC: { col: 1, val: rechazo, label: "Sin servicio", color: "#b91c1c" },
    PC: { col: 2, val: prenadas, label: "Preñez Conf.", color: "#16a34a" },
    FP: { col: 2, val: fallas, label: "Fallas", color: "#b45309" },
    PE: { col: 3, val: partosEstimados, label: "Partos Estimados", color: "#15803d" },
    PG: { col: 3, val: perdidas, label: "Pérd. Gest.", color: "#ea580c" },
  };
  const yPos: Record<string, number> = {
    VT: PAD_T,
    ES: PAD_T,
    RC: PAD_T + s(enServicio) + GAP,
    PC: PAD_T,
    FP: PAD_T + s(prenadas) + GAP,
    PE: PAD_T,
    PG: PAD_T + s(partosEstimados) + GAP,
  };
  const flows = [
    { id: 0, src: "VT", tgt: "ES", val: enServicio, c1: "#166534", c2: "#22c55e", srcOff: 0 },
    { id: 1, src: "VT", tgt: "RC", val: rechazo, c1: "#ef4444", c2: "#fca5a5", srcOff: s(enServicio) },
    { id: 2, src: "ES", tgt: "PC", val: prenadas, c1: "#166534", c2: "#4ade80", srcOff: 0 },
    { id: 3, src: "ES", tgt: "FP", val: fallas, c1: "#d97706", c2: "#fde68a", srcOff: s(prenadas) },
    { id: 4, src: "PC", tgt: "PE", val: partosEstimados, c1: "#15803d", c2: "#4ade80", srcOff: 0 },
    { id: 5, src: "PC", tgt: "PG", val: perdidas, c1: "#ea580c", c2: "#fdba74", srcOff: s(partosEstimados) },
  ].filter((f) => f.val > 0);

  const makePath = (f: (typeof flows)[number]) => {
    const sn = nodes[f.src];
    const tn = nodes[f.tgt];
    const fh = s(f.val);
    const sx = COLS[sn.col] + NW;
    const tx = COLS[tn.col];
    const sy1 = yPos[f.src] + f.srcOff;
    const sy2 = sy1 + fh;
    const ty1 = yPos[f.tgt];
    const ty2 = ty1 + fh;
    const mx = sx + (tx - sx) * 0.45;
    return `M${sx} ${sy1} C${mx} ${sy1} ${mx} ${ty1} ${tx} ${ty1} L${tx} ${ty2} C${mx} ${ty2} ${mx} ${sy2} ${sx} ${sy2} Z`;
  };
  const eficienciaGlobal = vientres > 0 ? Math.round((partosEstimados / vientres) * 1000) / 10 : 0;

  return (
    <div className="col gap-16">
      {modalCelo && <ModalRegistrarCelo animales={hembras} onClose={() => setModalCelo(false)} onGuardado={onGuardado} />}
      {modalInsem && <ModalRegistrarInseminacion animales={animales} animalPrefill={modalInsem} onClose={() => setModalInsem(null)} onGuardado={onGuardado} />}
      {modalDiagnostico && <ModalDiagnosticoGestacion animal={modalDiagnostico} onClose={() => setModalDiagnostico(null)} onGuardado={onGuardado} />}
      {modalPerdida && <ModalPerdidaGestacion animal={modalPerdida} onClose={() => setModalPerdida(null)} onGuardado={onGuardado} />}
      {modalTratamiento && <ModalTratamientoGestacion animal={modalTratamiento} onClose={() => setModalTratamiento(null)} onGuardado={onGuardado} />}
      {modalParto && <ModalPartoRegistro animal={modalParto} onClose={() => setModalParto(null)} onGuardado={onGuardado} />}
      {modalDetalleCiclo && <ModalDetalleCicloReproductivo animal={modalDetalleCiclo} badge={badgeCicloFor(modalDetalleCiclo)} onClose={() => setModalDetalleCiclo(null)} />}

      {/* Botón de acción */}
      <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
        <button onClick={() => setModalCelo(true)} className="mc-btn mc-btn--primary mc-btn--sm"><Icon name="heart" size={13} /> Registrar Celo</button>
        <button onClick={() => setModalInsem(hembras[0] || null)} disabled={hembras.length === 0} className="mc-btn mc-btn--secondary mc-btn--sm"><Icon name="star" size={13} /> Registrar Inseminación</button>
      </div>

      {/* Seguimiento de Ciclo Activo */}
      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="row" style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--mc-line)", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="mc-card__title">Seguimiento de Ciclo Activo</div>
            <div className="text-xs text-muted mt-4">Servicio, gestación y parto por animal</div>
          </div>
          <div className="row gap-6">
            {["Todas", "Vacas", "Vaquillonas"].map((c) => {
              const val = c === "Vacas" ? "Vaca" : c === "Vaquillonas" ? "Vaquillona" : "Todas";
              return (
                <button key={c} onClick={() => setFiltCat(val)} className="mc-btn mc-btn--sm" style={{ padding: "4px 10px", fontSize: 11, background: filtCat === val ? "var(--mc-green-600)" : "transparent", color: filtCat === val ? "#fff" : "var(--mc-muted)", border: "1px solid var(--mc-line)" }}>{c}</button>
              );
            })}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--mc-surface-2)" }}>
                {["Animal", "Estado", "Progreso de Gestación", "Fecha Parto", "Acciones"].map((h) => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="mc-empty" style={{ border: "none", margin: 10 }}>
                      <div style={{ fontWeight: 600 }}>Sin ciclos reproductivos activos</div>
                      <div className="text-xs mt-4">Registrá un celo o una inseminación para empezar el seguimiento.</div>
                    </div>
                  </td>
                </tr>
              )}
              {filtradas.map((a, i) => {
                const sm = badgeCicloFor(a);
                const prog = a.dia ? Math.round((a.dia / 283) * 100) : 0;
                const { inline, mas } = buildAcciones(a);
                return (
                  <tr key={a.dbId} style={{ borderTop: "1px solid var(--mc-line)", background: i % 2 === 0 ? "var(--mc-surface)" : "var(--mc-surface-2)" }}>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <div className="row gap-8">
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>🐄</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>{a.nombre || a.id}</div>
                          <div style={{ fontSize: 11, color: "var(--mc-muted)" }}>{a.id} · {a.categoria}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: sm.bg, color: sm.text, whiteSpace: "nowrap" }}>{sm.label}</span>
                    </td>
                    <td style={{ padding: "10px 14px", minWidth: 180 }}>
                      {a.cicloEstado === "prenada" ? (
                        <div>
                          <div className="row" style={{ justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: 11, color: "var(--mc-muted)" }}>Día {a.dia} / 283</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>{prog}%</span>
                          </div>
                          <div style={{ height: 9, borderRadius: 5, background: "#e2e8f0", overflow: "hidden", position: "relative" }}>
                            <div style={{ height: "100%", width: `${prog}%`, borderRadius: 5, background: "linear-gradient(90deg,#166534,#22c55e)" }} />
                          </div>
                          <div className="row" style={{ justifyContent: "space-between", marginTop: 3 }}>
                            <span style={{ fontSize: 9, color: "#94a3b8" }}>Servicio</span>
                            <span style={{ fontSize: 9, color: "#94a3b8" }}>Parto</span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mc-ink)" }}>{a.cicloEstado === "prenada" ? a.parto : "—"}</div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div className="row gap-6" style={{ flexWrap: "wrap" }}>
                        {inline.map((act) => {
                          const acColor: Record<string, { border: string; color: string; bg: string }> = {
                            detalle: { border: "1px solid var(--mc-line-2)", color: "var(--mc-text-2)", bg: "var(--mc-surface)" },
                            tratamiento: { border: "1.5px solid #FF9D00", color: "#a85f00", bg: "transparent" },
                            inseminar: { border: "1.5px solid var(--mc-blue)", color: "var(--mc-blue)", bg: "transparent" },
                            diagnosticar: { border: "1.5px solid var(--mc-blue)", color: "var(--mc-blue)", bg: "transparent" },
                            parto: { border: "1.5px solid var(--mc-green-600)", color: "var(--mc-green-600)", bg: "transparent" },
                            perdida: { border: "1.5px solid var(--mc-red)", color: "var(--mc-red)", bg: "transparent" },
                          };
                          const c = acColor[act.key] || acColor.detalle;
                          return (
                            <button key={act.key} style={{ width: 28, height: 28, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: "pointer", border: c.border, color: c.color, background: c.bg }} title={act.label} onClick={act.onClick}><Icon name={act.icon} size={13} /></button>
                          );
                        })}
                        {mas.length > 0 && (
                          <div style={{ position: "relative" }}>
                            <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ width: 28, height: 28, padding: 0, justifyContent: "center", fontWeight: 800 }} title="Más acciones" onClick={() => setMenuAbierto(menuAbierto === a.dbId ? null : a.dbId)}>⋯</button>
                            {menuAbierto === a.dbId && (
                              <div style={{ position: "absolute", top: "110%", right: 0, background: "var(--mc-surface)", border: "1px solid var(--mc-line-2)", borderRadius: 10, boxShadow: "var(--sh-md)", zIndex: 20, minWidth: 150, overflow: "hidden" }}>
                                {mas.map((act) => (
                                  <button key={act.key} onClick={() => { act.onClick(); setMenuAbierto(null); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", border: "none", background: "transparent", cursor: "pointer", fontSize: 12.5, color: "var(--mc-ink)", textAlign: "left" }}>
                                    <Icon name={act.icon} size={13} /> {act.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secundarios 50/50 */}
      <div className="grid g-cols-2">
        {/* Proyección Anual de Partos */}
        <div className="mc-card" style={{ padding: 20 }}>
          <div className="mc-card__head" style={{ marginBottom: 10 }}>
            <div>
              <div className="mc-card__title">Proyección Anual de Partos</div>
              <div className="text-xs text-muted mt-4">Distribución estacional esperada</div>
            </div>
            <span style={{ fontSize: 11, color: "var(--mc-muted)" }}>Total: {totalPartosProy} partos</span>
          </div>
          {totalPartosProy === 0 ? (
            <div className="mc-empty" style={{ padding: 24 }}>
              <div style={{ fontSize: 12.5 }}>Sin preñeces confirmadas — la proyección aparece al confirmar diagnósticos.</div>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ overflow: "visible", display: "block" }}>
                <defs>
                  <filter id="bubShadow" x="-60%" y="-60%" width="220%" height="220%">
                    <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0f2a1a" floodOpacity="0.28" />
                  </filter>
                  {mesesParto.map((m, i) => {
                    const g = getGrad(m.n);
                    return (
                      <radialGradient key={i} id={`rg${i}`} cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor={g.c3} stopOpacity="0.9" />
                        <stop offset="55%" stopColor={g.c2} />
                        <stop offset="100%" stopColor={g.c1} />
                      </radialGradient>
                    );
                  })}
                </defs>

                {mesesParto.map((m, i) => {
                  const cx = COL_W * i + COL_W / 2;
                  const r = m.n > 0 ? getR(m.n) : 6;
                  const g = getGrad(m.n);
                  const hov = hovBub === i;
                  const scale = hov ? 1.08 : 1;
                  const fontSize = r >= 26 ? 13 : r >= 20 ? 11.5 : 10;
                  return (
                    <g key={i} transform={`translate(${cx},${CYb})`} onMouseEnter={() => setHovBub(i)} onMouseLeave={() => setHovBub(null)} style={{ cursor: "pointer" }}>
                      <g style={{ transform: `scale(${scale})`, transformOrigin: "0 0", transition: "transform .2s" }} filter={m.n > 0 ? "url(#bubShadow)" : undefined}>
                        {(m.n >= 40 || hov) && m.n > 0 && <circle r={r + 7} fill={g.glow} opacity={hov ? 0.22 : 0.13} />}
                        {m.n > 0 ? (
                          <>
                            <circle r={r + 2} fill="none" stroke={g.c2} strokeWidth={hov ? 2 : 1} opacity={hov ? 0.7 : 0.3} />
                            <circle r={r} fill={`url(#rg${i})`} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                            <ellipse cx={-r * 0.28} cy={-r * 0.28} rx={r * 0.28} ry={r * 0.18} fill="white" opacity={0.35} />
                            <text y={fontSize * 0.35} textAnchor="middle" fontSize={fontSize} fontWeight="800" fill="#fff">{m.n}</text>
                          </>
                        ) : (
                          <circle r={5} fill="none" stroke="var(--mc-line-2)" strokeWidth="1.5" strokeDasharray="2,2" />
                        )}
                      </g>
                    </g>
                  );
                })}

                {mesesParto.map((m, i) => {
                  const se = seasonOf(i);
                  const r = m.n > 0 ? getR(m.n) : 6;
                  const barW = COL_W - 6;
                  const pctMes = totalPartosProy > 0 ? ((m.n / totalPartosProy) * 100).toFixed(0) : "0";
                  return (
                    <g key={i}>
                      <text x={COL_W * i + COL_W / 2} y={CYb + r + 20} textAnchor="middle" fontSize={10.5} fontWeight="700" fill={hovBub === i ? "#14532d" : "#334155"}>{m.m}</text>
                      <rect x={COL_W * i + 3} y={CYb + r + 28} width={barW} height={6} rx={3} fill={se.dot} opacity={hovBub === i ? 1 : 0.75} />
                      <text x={COL_W * i + COL_W / 2} y={CYb + r + 46} textAnchor="middle" fontSize={9} fontWeight="700" fill="#94a3b8">{pctMes}%</text>
                    </g>
                  );
                })}
              </svg>

              <div className="row gap-16" style={{ marginTop: 10, flexWrap: "wrap" }}>
                {([["≥40 — Pico", "#166534"], ["20–39 — Alto", "#22c55e"], ["10–19 — Moderado", "#4ade80"], ["<10 — Bajo", "#d97706"]] as [string, string][]).map(([l, c]) => (
                  <div key={l} className="row gap-4">
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                    <span style={{ fontSize: 10, color: "var(--mc-muted)" }}>{l}</span>
                  </div>
                ))}
              </div>
              <div className="row gap-16" style={{ marginTop: 6, flexWrap: "wrap" }}>
                {([["Verano", "#eab308"], ["Otoño", "#f97316"], ["Invierno", "#3b82f6"], ["Primavera", "#22c55e"]] as [string, string][]).map(([l, c]) => (
                  <div key={l} className="row gap-4">
                    <div style={{ width: 12, height: 6, borderRadius: 3, background: c }} />
                    <span style={{ fontSize: 10, color: "var(--mc-muted)" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Eficiencia Reproductiva — Sankey */}
        <div className="mc-card ia-card" style={{ flex: 1 }}>
          <div className="mc-card__head">
            <div>
              <div className="mc-card__title">Eficiencia Reproductiva</div>
              <div className="text-xs text-muted mt-4">Servicio → preñez → parto esperado</div>
            </div>
            <span style={{ fontSize: 11, color: "var(--mc-muted)" }}>Ciclo actual</span>
          </div>
          {vientres === 0 ? (
            <div className="mc-empty" style={{ padding: 24 }}>
              <div style={{ fontSize: 12.5 }}>Registrá vientres (vacas / vaquillonas) para ver el flujo reproductivo.</div>
            </div>
          ) : (
            <>
              <div style={{ position: "relative" }}>
                <svg width="100%" viewBox={`0 0 ${skW} ${skH}`} style={{ marginTop: 6, overflow: "visible", display: "block" }}>
                  <defs>
                    {flows.map((f) => (
                      <linearGradient key={f.id} id={`skG2_${f.id}`} x1="0" x2="1">
                        <stop offset="0%" stopColor={f.c1} style={{ stopOpacity: hovFlow === f.id ? 0.9 : hovFlow !== null || hovNode !== null ? (hovNode && (hovNode === f.src || hovNode === f.tgt) ? 0.72 : 0.08) : 0.45, transition: "stop-opacity .18s ease" }} />
                        <stop offset="100%" stopColor={f.c2} style={{ stopOpacity: hovFlow === f.id ? 0.6 : hovFlow !== null || hovNode !== null ? (hovNode && (hovNode === f.src || hovNode === f.tgt) ? 0.42 : 0.04) : 0.22, transition: "stop-opacity .18s ease" }} />
                      </linearGradient>
                    ))}
                    {Object.entries(nodes).map(([id, n]) => (
                      <linearGradient key={id} id={`nG_${id}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={n.color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={n.color} />
                      </linearGradient>
                    ))}
                  </defs>

                  {flows.map((f) => (
                    <path key={f.id} d={makePath(f)} fill={`url(#skG2_${f.id})`} stroke={hovFlow === f.id ? f.c1 : "none"} strokeWidth={hovFlow === f.id ? 1.5 : 0} onMouseEnter={() => setHovFlow(f.id)} onMouseLeave={() => setHovFlow(null)} style={{ cursor: "pointer", transition: "stroke-width .18s ease" }} />
                  ))}

                  {Object.entries(nodes).filter(([, n]) => n.val > 0).map(([id, n]) => {
                    const x = COLS[n.col];
                    const h = Math.max(s(n.val), 6);
                    const hov = hovNode === id;
                    return (
                      <g key={id} onMouseEnter={() => setHovNode(id)} onMouseLeave={() => setHovNode(null)} style={{ cursor: "pointer" }}>
                        <rect x={x} y={yPos[id]} width={NW} height={h} rx={4} fill={`url(#nG_${id})`} stroke={hov ? "#fff" : "none"} strokeWidth={hov ? 1.5 : 0} style={{ transition: "stroke-width .15s ease" }} />
                        <rect x={x + 1.5} y={yPos[id] + 1.5} width={NW - 3} height={Math.min(h * 0.35, 10)} rx={3} fill="white" opacity={0.18} pointerEvents="none" />
                      </g>
                    );
                  })}

                  {Object.keys(nodes).filter((id) => nodes[id].val > 0).map((id) => {
                    const n = nodes[id];
                    const x = COLS[n.col] + NW / 2;
                    const h = s(n.val);
                    const pct = ((n.val / TOTAL) * 100).toFixed(0);
                    const arriba = ["VT", "ES", "PC", "PE"].includes(id);
                    const hov = hovNode === id;
                    const nameY = arriba ? yPos[id] - 20 : yPos[id] + h + 15;
                    const valY = arriba ? yPos[id] - 7 : yPos[id] + h + 28;
                    const boxY = nameY - 10;
                    const boxW = Math.min(86, Math.max(56, n.label.length * 5.0));
                    return (
                      <g key={id} onMouseEnter={() => setHovNode(id)} onMouseLeave={() => setHovNode(null)} style={{ cursor: "pointer" }}>
                        <rect x={x - boxW / 2} y={boxY} width={boxW} height={26} rx={7} fill={hov ? "#f0fdf4" : "rgba(255,255,255,0.9)"} stroke={hov ? n.color : "#e2e8f0"} strokeWidth={hov ? 1.2 : 1} style={{ transition: "all .15s" }} />
                        <text x={x} y={nameY} textAnchor="middle" fontSize={8} fontWeight="700" fill={hov ? n.color : "#475569"}>{n.label}</text>
                        <text x={x} y={valY} textAnchor="middle" fontSize={9.5} fontWeight="800" fill={n.color}>{n.val} <tspan fontSize={7.5} fontWeight="700" fill="#94a3b8">· {pct}%</tspan></text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="row gap-8" style={{ marginTop: 10, flexWrap: "wrap" }}>
                {([["#166534", "Servicio / Preñez"], ["#b91c1c", "Sin servicio"], ["#b45309", "Fallas de preñez"], ["#ea580c", "Pérdida gestacional"]] as [string, string][]).map(([c, l]) => (
                  <div key={l} className="row gap-4">
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                    <span style={{ fontSize: 10, color: "var(--mc-muted)" }}>{l}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10, padding: "8px 12px", background: "linear-gradient(90deg,#f0fdf4,var(--mc-surface))", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#166534" }}>Eficiencia global</span>
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>{partosEstimados}/{vientres} vientres</span>
                  </div>
                  <div className="row gap-6" style={{ alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#15803d" }}>{eficienciaGlobal}%</span>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>Obj. 85%</span>
                  </div>
                </div>
                <div className="mc-prog mt-8" style={{ height: 5, position: "relative" }}>
                  <div className="mc-prog__bar" style={{ width: `${Math.min(100, eficienciaGlobal)}%`, background: "linear-gradient(90deg,#052e16,#16a34a,#4ade80)" }} />
                  <div style={{ position: "absolute", left: "85%", top: 0, height: "100%", width: 1.5, background: "#94a3b8" }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** KPIs del tab Reproducción, calculados del rodeo. */
export function kpisRepro(animales: AnimalRow[]) {
  const hembras = animales.filter((a) => a.sexo === "H" && a.activo);
  const enServicio = hembras.filter((a) => ["inseminada", "prenada"].includes(a.cicloEstado)).length;
  const prenadas = hembras.filter((a) => a.cicloEstado === "prenada").length;
  const tasaPrenez = enServicio > 0 ? Math.round((prenadas / enServicio) * 100) : 0;
  const perdidas = hembras.filter((a) => (a.api.eventosReproductivos || []).some((e) => e.tipo === "Aborto")).length;
  const abortosPct = prenadas + perdidas > 0 ? Math.round((perdidas / (prenadas + perdidas)) * 1000) / 10 : 0;
  // Días abiertos promedio: desde el último parto hasta hoy (vacas sin preñez) o hasta el servicio fecundante
  const conParto = hembras.filter((a) => a.api.historialReproductivo?.ultimoParto);
  const diasAbiertos = conParto.length > 0
    ? Math.round(
        conParto.reduce((s, a) => {
          const parto = new Date(a.api.historialReproductivo!.ultimoParto!).getTime();
          const fin = a.api.historialReproductivo?.ultimoServicio && a.cicloEstado === "prenada"
            ? new Date(a.api.historialReproductivo.ultimoServicio).getTime()
            : Date.now();
          return s + Math.max(0, (fin - parto) / (24 * 3600 * 1000));
        }, 0) / conParto.length
      )
    : 0;
  const serviciosIA = hembras.filter((a) => (a.api.eventosReproductivos || []).some((e) => e.tipo === "Servicio" && e.tipoServicio === "IA")).length;
  const prenadasIA = hembras.filter((a) => a.cicloEstado === "prenada" && (a.api.eventosReproductivos || []).some((e) => e.tipo === "Servicio" && e.tipoServicio === "IA")).length;
  const efectividadIA = serviciosIA > 0 ? Math.round((prenadasIA / serviciosIA) * 100) : 0;
  return { enServicio, prenadas, tasaPrenez, abortosPct, perdidas, diasAbiertos, efectividadIA, serviciosIA };
}
