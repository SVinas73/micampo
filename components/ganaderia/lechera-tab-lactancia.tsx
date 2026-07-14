"use client";

// Pestaña Estado de Lactancia: tabla de vacas por DEL/estado con búsqueda y
// filtros, donut de composición del rodeo y calendario de próximos 14 días
// (secados, partos esperados, alertas nutricionales). Todo derivado de datos.

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/mc";
import {
  VacaLechera,
  WoodParams,
  plDelColor,
  plEstBadge,
  plVsCfg,
} from "./lechera-tipos";
import { PLDonut, PLVacaModal } from "./lechera-ui";

const KPI_INFO = "Días En Leche — tiempo desde el último parto";

export function PLEstadoLactancia({ vacas, esperada }: { vacas: VacaLechera[]; esperada: WoodParams }) {
  const [pill, setPill] = useState<"Todas" | "Solo alertas" | "Por DEL">("Todas");
  const [busq, setBusq] = useState("");
  const [modal, setModal] = useState<VacaLechera | null>(null);
  const [pagina, setPagina] = useState(1);
  const porPagina = 12;

  // Solo vacas del ciclo lechero (con parto o registros)
  const lecheras = useMemo(() => vacas.filter((v) => v.ultimoParto !== null || v.serie.length > 0), [vacas]);
  const enOrdenne = lecheras.filter((v) => v.enOrdenne);
  const secas = lecheras.filter((v) => !v.enOrdenne && v.ultimoParto !== null);
  const proxSecar = enOrdenne.filter((v) => v.del !== null && v.del >= 270);
  const bajoCurva = enOrdenne.filter((v) => v.estado === "Bajo curva");
  const conDel = enOrdenne.filter((v) => v.del !== null);
  const delProm = conDel.length ? Math.round(conDel.reduce((s, v) => s + (v.del || 0), 0) / conDel.length) : null;

  const filtered = useMemo(() => {
    const q = busq.trim().toLowerCase();
    let rows = enOrdenne.filter((v) => {
      const ms = !q || v.caravana.toLowerCase().includes(q) || v.lote.toLowerCase().includes(q);
      const mf =
        pill === "Todas" ||
        (pill === "Solo alertas" && (v.estado === "Bajo curva" || v.estado === "Próx. seca")) ||
        pill === "Por DEL";
      return ms && mf;
    });
    if (pill === "Por DEL") rows = [...rows].sort((a, b) => (a.del ?? 9999) - (b.del ?? 9999));
    return rows;
  }, [enOrdenne, busq, pill]);

  const totalPag = Math.max(1, Math.ceil(filtered.length / porPagina));
  const pag = Math.min(pagina, totalPag);
  const visibles = filtered.slice((pag - 1) * porPagina, pag * porPagina);

  // Donut composición
  const donutSegs = [
    { lbl: "En Ordeñe", n: enOrdenne.length, color: "var(--mc-green-600)", bg: "var(--mc-green-50)", ico: "droplets" },
    { lbl: "Secas", n: secas.length, color: "var(--mc-muted)", bg: "var(--mc-surface-3)", ico: "cloud" },
    { lbl: "Próx. Secar", n: proxSecar.length, color: "var(--mc-amber)", bg: "var(--mc-amber-bg)", ico: "clock" },
    { lbl: "Bajo Curva", n: bajoCurva.length, color: "var(--mc-red)", bg: "var(--mc-red-bg)", ico: "alert-triangle" },
  ];

  // Próximos 14 días: secados (DEL alto), partos esperados, alertas nutricionales
  const [ahora] = useState(() => Date.now());
  const eventos = useMemo(() => {
    type Ev = { fecha: string; orden: number; desc: string; detail: string; tipo: string; color: "green" | "amber" | "red" | "blue" };
    const out: Ev[] = [];
    const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    const en14 = ahora + 14 * 24 * 3600 * 1000;

    lecheras.forEach((v) => {
      // Secado sugerido cuando alcanza ~305 DEL (60 días antes del parto)
      if (v.enOrdenne && v.del !== null && v.del >= 290 && v.ultimoParto) {
        const diasHasta = Math.max(0, 305 - v.del);
        const f = new Date(ahora + diasHasta * 24 * 3600 * 1000);
        if (f.getTime() <= en14) out.push({ fecha: fmt(f), orden: f.getTime(), desc: `Secar vaca #${v.caravana}`, detail: `${v.lote} · ${v.del} DEL`, tipo: "Secado", color: "amber" });
      }
      // Parto esperado
      if (v.fechaEsperadaParto) {
        const f = new Date(v.fechaEsperadaParto);
        if (f.getTime() >= ahora - 24 * 3600 * 1000 && f.getTime() <= en14) {
          out.push({ fecha: fmt(f), orden: f.getTime(), desc: `Parto esperado #${v.caravana}`, detail: v.lote, tipo: "Reincorporación", color: "blue" });
        }
      }
      // Alerta nutricional: bajo curva
      if (v.estado === "Bajo curva") {
        out.push({ fecha: "Hoy", orden: ahora, desc: `Revisar vaca #${v.caravana}`, detail: `Bajo curva · ${v.pct ?? "?"}% esperado`, tipo: "Alerta nutricional", color: "red" });
      }
    });
    return out.sort((a, b) => a.orden - b.orden).slice(0, 8);
  }, [lecheras, ahora]);

  const exportarCSV = () => {
    const filas = [
      ["Caravana", "Lote", "DEL", "Último (lt)", "Vs esperado %", "Estado"],
      ...filtered.map((v) => [v.caravana, v.lote, v.del !== null ? String(v.del) : "", v.hoy !== null ? String(Math.round(v.hoy)) : "", v.pct !== null ? String(v.pct) : "", v.estado]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "estado-lactancia.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {modal && <PLVacaModal vaca={modal} esperada={esperada} onClose={() => setModal(null)} />}

      {/* KPIs — mismo diseño que Agronomía (mc-kpi canónico): valor en tinta 34px
          display; el color/severidad va por modificador de card y en el delta. */}
      <div className="grid g-cols-5" style={{ gap: 10 }}>
        {[
          { lbl: "En Ordeñe", ico: "droplets", val: `${enOrdenne.length} vacas`, sub: "activas en lactancia", cls: "mc-kpi mc-kpi--accent" as const, dcls: "" },
          { lbl: "Secas", ico: "cloud", val: `${secas.length} vacas`, sub: "en período de descanso", cls: "mc-kpi" as const, dcls: "" },
          { lbl: "Próx. a Secar", ico: "clock", val: `${proxSecar.length} vacas`, sub: "≥270 DEL", cls: "mc-kpi mc-kpi--warn" as const, dcls: "mc-kpi__delta--warn" },
          { lbl: "Días en Leche Prom.", ico: "activity", val: delProm !== null ? `${delProm} días` : "—", sub: "desde el último parto · rodeo", cls: "mc-kpi" as const, del: true, dcls: "" },
          { lbl: "Bajo Curva", ico: "alert-triangle", val: `${bajoCurva.length} vacas`, sub: "produciendo <80% esp.", cls: "mc-kpi" as const, dcls: bajoCurva.length > 0 ? "mc-kpi__delta--down" : "" },
        ].map((k, i) => (
          <div key={i} className={k.cls} style={{ position: "relative" }}>
            <div className="mc-kpi__label">
              {k.lbl}
              {k.del && <span title={KPI_INFO} style={{ marginLeft: 3, cursor: "help", color: "var(--mc-text-3)", display: "inline-flex", alignItems: "center" }}><Icon name="info" size={11} /></span>}
            </div>
            <div className="mc-kpi__value">{k.val}</div>
            <div className={`mc-kpi__delta ${k.dcls}`}>{k.sub}</div>
            <div className="mc-kpi__glyph"><Icon name={k.ico} size={14} /></div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={exportarCSV} disabled={filtered.length === 0}><Icon name="download" size={13} />Exportar</button>
      </div>

      {/* Layout 65/35 */}
      <div className="grid" style={{ gridTemplateColumns: "minmax(0,65fr) minmax(280px,35fr)", gap: 14, alignItems: "start" }}>
        {/* Tabla */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--mc-ink)" }}>Estado de Lactancia</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>{enOrdenne.length} vacas en ordeñe</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {(["Todas", "Solo alertas", "Por DEL"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPill(p); setPagina(1); }}
                    style={{ padding: "4px 11px", borderRadius: 999, border: `1px solid ${pill === p ? "var(--mc-green-600)" : "var(--mc-line)"}`, background: pill === p ? "var(--mc-green-600)" : "transparent", color: pill === p ? "white" : "var(--mc-text-2)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <Icon name="search" size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--mc-text-3)", pointerEvents: "none" }} />
                <input value={busq} onChange={(e) => { setBusq(e.target.value); setPagina(1); }} placeholder="Buscar vaca..." style={{ width: 140, border: "1px solid var(--mc-line)", borderRadius: 8, padding: "6px 8px 6px 26px", fontSize: 12, fontFamily: "inherit", outline: "none", color: "var(--mc-ink)", background: "var(--mc-surface)" }} />
              </div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
              <thead>
                <tr style={{ background: "var(--mc-surface-2)" }}>
                  {["VACA", "LOTE", "DEL", "ÚLTIMO", "VS ESPERADO", "ESTADO", ""].map((h, hi) => (
                    <th key={hi} style={{ padding: "9px 12px", fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", textAlign: "left", borderBottom: "1px solid var(--mc-line)", whiteSpace: "nowrap" }}>
                      {h === "DEL" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>DEL<span title={KPI_INFO} style={{ cursor: "help", display: "inline-flex", color: "var(--mc-text-3)" }}><Icon name="info" size={11} /></span></span> : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--mc-text-3)" }}>{enOrdenne.length === 0 ? "No hay vacas en ordeñe. Registrá partos y ordeñes para ver el estado de lactancia." : "Sin resultados"}</td></tr>}
                {visibles.map((v) => {
                  const isDr = modal?.dbId === v.dbId;
                  const vs = v.pct !== null ? plVsCfg(v.pct) : null;
                  const bg = plEstBadge(v.estado);
                  const dw = v.del !== null ? Math.min(Math.round((v.del / 305) * 100), 100) : 0;
                  return (
                    <tr key={v.dbId} onClick={() => setModal(v)} style={{ background: isDr ? "var(--mc-green-50)" : "var(--mc-surface)", borderLeft: isDr ? "3px solid var(--mc-green-600)" : "3px solid transparent", borderBottom: "1px solid var(--mc-line)", cursor: "pointer", transition: "background .1s" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 800, fontFamily: "var(--ff-mono)", fontSize: 13, color: "var(--mc-ink)" }}>#{v.caravana}</div>
                        <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 1 }}>{v.raza}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--mc-surface-3)", color: "var(--mc-text-2)", border: "1px solid var(--mc-line)" }}>{v.lote}</span>
                      </td>
                      <td style={{ padding: "10px 12px", minWidth: 80 }}>
                        <div style={{ fontWeight: 700, color: "var(--mc-ink)" }}>{v.del !== null ? `${v.del} d` : "—"}</div>
                        {v.del !== null && (
                          <div style={{ marginTop: 4, height: 4, background: "var(--mc-line)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ width: `${dw}%`, height: "100%", background: plDelColor(v.del), borderRadius: 999 }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--mc-ink)" }}>{v.hoy !== null ? `${Math.round(v.hoy)} lt` : "—"}</td>
                      <td style={{ padding: "10px 12px", minWidth: 110 }}>
                        {vs ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 40, height: 5, background: "var(--mc-line)", borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
                              <div style={{ width: `${Math.min(v.pct!, 100)}%`, height: "100%", background: vs.bc, borderRadius: 999 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: vs.c, whiteSpace: "nowrap" }}>{vs.pre} {v.pct}%</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--mc-text-3)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: bg.bg, color: bg.tc, border: `1px solid ${bg.b}` }}>{v.estado}</span>
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ fontSize: 11, padding: "4px 9px" }} onClick={(e) => { e.stopPropagation(); setModal(v); }}>Ver ficha →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > porPagina && (
            <div style={{ padding: "10px 18px", borderTop: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Mostrando {visibles.length} de {filtered.length} vacas</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pag <= 1} className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 8px" }}><Icon name="chevron-left" size={12} /></button>
                <span style={{ fontSize: 12, color: "var(--mc-text-2)", padding: "4px 8px", fontWeight: 600 }}>{pag} / {totalPag}</span>
                <button onClick={() => setPagina((p) => Math.min(totalPag, p + 1))} disabled={pag >= totalPag} className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 8px" }}><Icon name="chevron-right" size={12} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="mc-card">
            <div className="mc-card__head">
              <div>
                <div className="mc-card__title">Estado del Rodeo</div>
                <div className="text-xs text-muted mt-2">Composición actual del rodeo lechero</div>
              </div>
            </div>
            <PLDonut segs={donutSegs} total={lecheras.length} />
          </div>
          <div className="mc-card">
            <div className="mc-card__head">
              <div>
                <div className="mc-card__title">Próximos 14 días</div>
                <div className="text-xs text-muted mt-2">Secados, partos y alertas</div>
              </div>
              <Icon name="calendar" size={15} style={{ color: "var(--mc-text-3)" }} />
            </div>
            {eventos.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--mc-text-3)", padding: "12px 0" }}>Sin eventos programados en los próximos 14 días.</div>
            ) : (
              <div className="mc-timeline" style={{ paddingLeft: 12 }}>
                {eventos.map((evt, ei) => {
                  const dotC = { green: "var(--mc-green-500)", amber: "var(--mc-amber)", red: "var(--mc-red)", blue: "var(--mc-blue)" };
                  return (
                    <div key={ei} className="mc-tl-item" style={{ gridTemplateColumns: "24px 1fr", paddingLeft: 0 }}>
                      <div className="mc-tl-item__dot" style={{ background: dotC[evt.color] }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", marginBottom: 2 }}>{evt.fecha}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mc-ink)", lineHeight: 1.3 }}>{evt.desc}</div>
                        <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 1 }}>{evt.detail}</div>
                        <span className={`mc-badge mc-badge--${evt.color}`} style={{ marginTop: 5, display: "inline-flex" }}>{evt.tipo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
