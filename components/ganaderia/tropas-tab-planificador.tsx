"use client";

// Pestaña Planificador: calendario semanal/mensual de movimientos reales,
// arrastre de rutinas al calendario para planificar, popover con acciones
// (completar / eliminar) y resumen de la semana.

import React, { useMemo, useState } from "react";
import { Icon, useToast } from "@/components/mc";
import {
  LoteGeoAPI,
  MovTropaAPI,
  RutinaAPI,
  TropaAPI,
  fechaStrMov,
  freqLabel,
  mapaColoresTropas,
  parseHora,
  rutinaActiva,
  toDateStr,
} from "./tropas-tipos";
import { KpiMovCard } from "./tropas-ui";
import { ModalPlanificarMovimiento } from "./tropas-modales";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_C = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const DIAS_S = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function lunesDeSemana(offset: number): Date {
  const hoy = new Date();
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dow + offset * 7);
  return d;
}

export function MovPlanificador({
  tropas,
  rutinas,
  movimientos,
  lotes,
  onRefresh,
}: {
  tropas: TropaAPI[];
  rutinas: RutinaAPI[];
  movimientos: MovTropaAPI[];
  lotes: LoteGeoAPI[];
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [vista, setVista] = useState<"semana" | "mes">("semana");
  const [semOffset, setSemOffset] = useState(0);
  const [mesOffset, setMesOffset] = useState(0);
  const [modal, setModal] = useState<{ fecha?: string; rutina?: string } | null>(null);
  const [popover, setPopover] = useState<{ mov: MovTropaAPI; x: number; y: number } | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [accionando, setAccionando] = useState(false);

  const colores = useMemo(() => mapaColoresTropas(tropas), [tropas]);
  const hoy = useMemo(() => new Date(), []);
  const hoyStr = toDateStr(hoy);

  const colDe = (tropaId: string) => {
    const border = colores[tropaId] || "#94a3b8";
    return { bg: border + "1e", border, text: border };
  };

  /* Semana actual visible */
  const curDays = useMemo(() => {
    const base = lunesDeSemana(semOffset);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(base); d.setDate(d.getDate() + i); return d; });
  }, [semOffset]);
  const curDayStrs = curDays.map(toDateStr);

  const movsDeDia = (ds: string) =>
    movimientos
      .filter((m) => fechaStrMov(m.fecha) === ds && m.estado !== "Cancelado")
      .sort((a, b) => (a.horario || "99").localeCompare(b.horario || "99"));

  const curEvs = useMemo(
    () => movimientos.filter((m) => curDayStrs.includes(fechaStrMov(m.fecha)) && m.estado !== "Cancelado"),
    [movimientos, curDayStrs]
  );

  const wkTitle = () => {
    const a = curDays[0], b = curDays[6];
    if (vista === "mes") {
      const m = new Date(hoy.getFullYear(), hoy.getMonth() + mesOffset, 1);
      return `${MESES[m.getMonth()]} ${m.getFullYear()}`;
    }
    if (a.getMonth() === b.getMonth()) return `Semana del ${a.getDate()} al ${b.getDate()} de ${MESES[a.getMonth()]} ${a.getFullYear()}`;
    return `${a.getDate()} ${MESES[a.getMonth()]} – ${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}`;
  };

  /* Mes visible: grilla de semanas empezando en lunes */
  const mesGrid = useMemo(() => {
    const primero = new Date(hoy.getFullYear(), hoy.getMonth() + mesOffset, 1);
    const start = new Date(primero);
    start.setDate(1 - ((primero.getDay() + 6) % 7));
    const semanas: Date[][] = [];
    const cursor = new Date(start);
    do {
      semanas.push(Array.from({ length: 7 }, () => { const d = new Date(cursor); cursor.setDate(cursor.getDate() + 1); return d; }));
    } while (cursor.getMonth() === primero.getMonth() && semanas.length < 6);
    return { primero, semanas };
  }, [hoy, mesOffset]);

  /* KPIs (sobre la semana visible) */
  const completadosSem = curEvs.filter((m) => m.estado === "Ejecutado").length;
  const cabSem = curEvs.reduce((s, m) => s + (m.cabezas || 0), 0);
  const lotesSem = new Set<string>();
  curEvs.forEach((m) => { if (m.origenNombre) lotesSem.add(m.origenNombre); if (m.destinoNombre) lotesSem.add(m.destinoNombre); });
  const kmSem = curEvs.reduce((s, m) => s + (m.distanciaKm || 0), 0);

  const proximo = useMemo(() => {
    const ahora = hoy.getHours() + hoy.getMinutes() / 60;
    return movimientos
      .filter((m) => m.estado === "Planificado")
      .filter((m) => {
        const f = fechaStrMov(m.fecha);
        if (f > hoyStr) return true;
        if (f < hoyStr) return false;
        const h = parseHora(m.horario);
        return h === null || h >= ahora;
      })
      .sort((a, b) => (fechaStrMov(a.fecha) + (a.horario || "99")).localeCompare(fechaStrMov(b.fecha) + (b.horario || "99")))[0] || null;
  }, [movimientos, hoyStr, hoy]);

  const conflictos = useMemo(() => {
    let n = 0;
    const porTropaDia: Record<string, number[]> = {};
    curEvs.forEach((m) => {
      const h = parseHora(m.horario);
      if (h === null) return;
      const k = `${m.tropaId}|${fechaStrMov(m.fecha)}`;
      (porTropaDia[k] = porTropaDia[k] || []).push(h);
    });
    Object.values(porTropaDia).forEach((hs) => {
      hs.sort((a, b) => a - b);
      for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] < 1) n++;
    });
    return n;
  }, [curEvs]);

  const sbStyle = (m: MovTropaAPI) =>
    m.estado === "Ejecutado"
      ? { bg: "#dcfce7", color: "#15803d", label: "Completado" }
      : m.estado === "En curso"
      ? { bg: "#fef3c7", color: "#d97706", label: "En curso" }
      : { bg: "var(--mc-surface-3)", color: "#64748b", label: "Pendiente" };

  const openPlan = (opts: { fecha?: string; rutina?: string } = {}) => setModal(opts);

  const completarMov = async (m: MovTropaAPI) => {
    setAccionando(true);
    try {
      const r = await fetch(`/api/movimientos-tropa/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "ejecutar" }),
      });
      if (!r.ok) throw new Error();
      toast.show("Movimiento marcado como completado");
      setPopover(null);
      onRefresh();
    } catch {
      toast.show("No se pudo completar el movimiento", "err");
    } finally {
      setAccionando(false);
    }
  };

  const eliminarMov = async (m: MovTropaAPI) => {
    setAccionando(true);
    try {
      const r = await fetch(`/api/movimientos-tropa/${m.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.show("Movimiento eliminado");
      setPopover(null);
      onRefresh();
    } catch {
      toast.show("No se pudo eliminar", "err");
    } finally {
      setAccionando(false);
    }
  };

  const exportarSemana = () => {
    const filas = [
      ["Fecha", "Hora", "Tropa", "Origen", "Destino", "Cabezas", "Estado", "Rutina", "Responsable"],
      ...curEvs.map((m) => [
        fechaStrMov(m.fecha), m.horario || "", m.tropa?.nombre || "", m.origenNombre || "", m.destinoNombre || "",
        String(m.cabezas || 0), m.estado, m.rutina?.nombre || "", m.responsable || "",
      ]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan-semana-${curDayStrs[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dropHandlers = (ds: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; if (dragOverDate !== ds) setDragOverDate(ds); },
    onDragLeave: () => setDragOverDate((p) => (p === ds ? null : p)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverDate(null);
      const rid = e.dataTransfer.getData("text/plain");
      if (rid) openPlan({ fecha: ds, rutina: rid });
    },
  });

  const wkShort = `${curDays[0].getDate()} ${MESES[curDays[0].getMonth()].slice(0, 3)} – ${curDays[6].getDate()} ${MESES[curDays[6].getMonth()].slice(0, 3)} ${curDays[0].getFullYear()}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {toast.node}
      {modal && (
        <ModalPlanificarMovimiento
          tropas={tropas}
          rutinas={rutinas}
          lotes={lotes}
          fechaInicial={modal.fecha}
          rutinaInicial={modal.rutina}
          onClose={() => setModal(null)}
          onGuardado={onRefresh}
        />
      )}

      {/* ── KPIs ── */}
      <div className="grid g-cols-5" style={{ gap: 10 }}>
        <KpiMovCard
          title="Esta Semana"
          ico="calendar"
          val={String(curEvs.length)}
          barPct={curEvs.length ? (completadosSem / curEvs.length) * 100 : 0}
          sub={curEvs.length ? `${completadosSem} completados · ${curEvs.length - completadosSem} pendientes` : "sin movimientos planificados"}
        />
        <KpiMovCard title="Cabezas Plan." ico="move-right" val={cabSem.toLocaleString("es-AR")} valSuffix="cab." sub="en movimiento esta semana" />
        <KpiMovCard
          title="Próximo Arreo"
          ico="clock"
          val={proximo ? (fechaStrMov(proximo.fecha) === hoyStr ? `Hoy ${proximo.horario || ""}` : `${parseInt(fechaStrMov(proximo.fecha).slice(8, 10))} ${MESES[parseInt(fechaStrMov(proximo.fecha).slice(5, 7)) - 1].slice(0, 3)}`) : "—"}
          sub={proximo ? `${proximo.tropa?.nombre || "Tropa"} · ${proximo.origenNombre || "?"} → ${proximo.destinoNombre || "?"}` : "Nada planificado"}
        />
        <KpiMovCard title="Lotes" ico="map-pin" val={String(lotesSem.size)} sub={`de ${lotes.length} lotes involucrados`} />
        <KpiMovCard
          title="Conflictos"
          ico="shieldCheck"
          val={conflictos === 0 ? "0 detectados" : String(conflictos)}
          trend={conflictos === 0 ? "up" : "down"}
          sub={conflictos === 0 ? "Sin superposiciones" : "Movimientos superpuestos de una misma tropa"}
        />
      </div>

      {/* ── Acciones ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={exportarSemana} disabled={curEvs.length === 0}><Icon name="download" size={12} />Exportar</button>
        <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => openPlan()}><Icon name="plus" size={12} />Planificar Movimiento</button>
      </div>

      {/* ── Layout principal ── */}
      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) 308px", gap: 14, alignItems: "start" }}>
        {/* Calendario */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "5px 8px" }} onClick={() => (vista === "semana" ? setSemOffset((p) => p - 1) : setMesOffset((p) => p - 1))}>
                <Icon name="chevron-left" size={13} />
              </button>
              <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ fontSize: 11 }} onClick={() => (vista === "semana" ? setSemOffset(0) : setMesOffset(0))}>
                {vista === "semana" ? "Semana actual" : "Mes actual"}
              </button>
              <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "5px 8px" }} onClick={() => (vista === "semana" ? setSemOffset((p) => p + 1) : setMesOffset((p) => p + 1))}>
                <Icon name="chevron-right" size={13} />
              </button>
            </div>
            <div style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", minWidth: 160 }}>{wkTitle()}</div>
            <div style={{ display: "flex", background: "var(--mc-surface-3)", borderRadius: 20, padding: 3, gap: 2 }}>
              {([["semana", "Semana"], ["mes", "Mes"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setVista(v)} style={{ padding: "4px 12px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: vista === v ? "#16a34a" : "transparent", color: vista === v ? "white" : "var(--mc-text-2)", transition: "all .15s" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Vista semana */}
          {vista === "semana" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", overflowX: "auto" }}>
              {curDays.map((day, i) => {
                const isToday = toDateStr(day) === hoyStr;
                return (
                  <div key={"h" + i} style={{ padding: "8px 4px", textAlign: "center", borderRight: i < 6 ? "1px solid var(--mc-line)" : "none", borderBottom: "1px solid var(--mc-line)", background: isToday ? "#f7fef8" : "transparent" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: ".07em", marginBottom: 3 }}>{DIAS_C[i]}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", background: isToday ? "#16a34a" : "transparent", fontSize: 14, fontWeight: 800, color: isToday ? "white" : "var(--mc-ink)" }}>{day.getDate()}</div>
                    {isToday && <div style={{ fontSize: 8, fontWeight: 700, color: "#16a34a", marginTop: 2, letterSpacing: ".04em" }}>HOY</div>}
                  </div>
                );
              })}
              {curDays.map((day, ci) => {
                const ds = toDateStr(day);
                const dayEvs = movsDeDia(ds);
                const isToday = ds === hoyStr;
                return (
                  <div
                    key={"e" + ci}
                    style={{
                      borderRight: ci < 6 ? "1px solid var(--mc-line)" : "none",
                      background: dragOverDate === ds ? "#f0fdf4" : isToday ? "#f0fdf408" : "transparent",
                      boxShadow: dragOverDate === ds ? "inset 0 0 0 2px #16a34a" : "none",
                      padding: "6px 5px", display: "flex", flexDirection: "column", gap: 4, minHeight: 180, cursor: "pointer",
                    }}
                    onClick={() => openPlan({ fecha: ds })}
                    {...dropHandlers(ds)}
                  >
                    {dayEvs.length === 0 && (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 80 }}>
                        <div style={{ fontSize: 9, color: "#d1d5db", textAlign: "center", lineHeight: 1.6, userSelect: "none" }}>Sin<br />movimientos</div>
                      </div>
                    )}
                    {dayEvs.map((ev) => {
                      const col = colDe(ev.tropaId);
                      const done = ev.estado === "Ejecutado";
                      const enCurso = ev.estado === "En curso";
                      return (
                        <div
                          key={ev.id}
                          style={{ background: col.bg, borderRadius: 8, border: `1px solid ${col.border}33`, borderLeft: `3px solid ${col.border}`, padding: "5px 7px", cursor: "pointer", overflow: "hidden", opacity: done ? 0.6 : 1, transition: "box-shadow .12s,transform .12s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,.13)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
                          onClick={(e) => { e.stopPropagation(); setPopover({ mov: ev, x: e.clientX, y: e.clientY }); }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: col.text, fontVariantNumeric: "tabular-nums" }}>{ev.horario || "—"}</span>
                            {done && <Icon name="check" size={9} style={{ color: col.text }} />}
                            {enCurso && <span style={{ width: 5, height: 5, borderRadius: "50%", background: col.border, display: "inline-block", animation: "mc-pulse 1.4s infinite", flexShrink: 0 }} />}
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-ink)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ev.tropa?.nombre || "Tropa"}{ev.rutina ? ` · ${ev.rutina.nombre}` : ""}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--mc-text-2)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ev.origenNombre || "?"} → {ev.destinoNombre || "?"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Vista mes */}
          {vista === "mes" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--mc-line)" }}>
                {DIAS_C.map((d) => (
                  <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: ".07em" }}>{d}</div>
                ))}
              </div>
              {mesGrid.semanas.map((week, wi) => (
                <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: wi < mesGrid.semanas.length - 1 ? "1px solid var(--mc-line)" : "none" }}>
                  {week.map((day, di) => {
                    const ds = toDateStr(day);
                    const isToday = ds === hoyStr;
                    const isMonth = day.getMonth() === mesGrid.primero.getMonth();
                    const devs = movsDeDia(ds);
                    const vis = devs.slice(0, 3);
                    const extra = devs.length - 3;
                    return (
                      <div
                        key={di}
                        style={{ minHeight: 76, padding: "6px 5px 4px", borderRight: di < 6 ? "1px solid var(--mc-line)" : "none", background: isToday ? "#f0fdf4" : "var(--mc-surface)", cursor: "pointer", transition: "background .1s", boxShadow: dragOverDate === ds ? "inset 0 0 0 2px #16a34a" : "none" }}
                        onClick={() => openPlan({ fecha: ds })}
                        {...dropHandlers(ds)}
                      >
                        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", marginBottom: 3, background: isToday ? "#16a34a" : "transparent", fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? "white" : isMonth ? "var(--mc-ink)" : "#c0c5ce" }}>
                          {day.getDate()}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {vis.map((me) => {
                            const col = colDe(me.tropaId);
                            return (
                              <div
                                key={me.id}
                                style={{ display: "flex", alignItems: "center", gap: 3, padding: "1px 4px", borderRadius: 3, background: col.bg, cursor: "pointer", overflow: "hidden" }}
                                onClick={(e) => { e.stopPropagation(); setPopover({ mov: me, x: e.clientX, y: e.clientY }); }}
                              >
                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: col.border, flexShrink: 0 }} />
                                <div style={{ fontSize: 9, fontWeight: 700, color: col.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {me.tropa?.nombre || "Tropa"} · {me.horario || ""}
                                </div>
                              </div>
                            );
                          })}
                          {extra > 0 && <div style={{ fontSize: 9, color: "var(--mc-text-2)", padding: "1px 4px", background: "var(--mc-surface-3)", borderRadius: 3 }}>+{extra} más</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Rutinas disponibles */}
          <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid var(--mc-line)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>Rutinas Disponibles</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Arrastrá una rutina al calendario o hacé click</div>
            </div>
            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5, maxHeight: 280, overflowY: "auto" }}>
              {rutinas.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--mc-text-3)", padding: "8px 4px" }}>Sin rutinas creadas.</div>
              )}
              {rutinas.map((r) => {
                const paused = !rutinaActiva(r);
                const tropaAsig = tropas.find((t) => t.rutinaId === r.id);
                const col = tropaAsig ? colDe(tropaAsig.id) : { bg: "var(--mc-surface-3)", border: "#94a3b8", text: "#64748b" };
                const cabs = tropaAsig ? tropaAsig._count?.animales ?? 0 : 0;
                return (
                  <div
                    key={r.id}
                    draggable={!paused}
                    onDragStart={(e) => { if (paused) return; e.dataTransfer.setData("text/plain", r.id); e.dataTransfer.effectAllowed = "copy"; }}
                    style={{ padding: "9px 11px", borderRadius: 10, border: "1px solid var(--mc-line)", background: paused ? "var(--mc-surface-2)" : "var(--mc-surface)", opacity: paused ? 0.7 : 1, cursor: paused ? "not-allowed" : "grab", transition: "all .14s", display: "flex", alignItems: "center", gap: 9 }}
                    onClick={() => { if (!paused) openPlan({ rutina: r.id }); }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: paused ? "var(--mc-surface-3)" : col.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {r.emoji ? <span style={{ fontSize: 15 }}>{r.emoji}</span> : <Icon name="repeat" size={14} style={{ color: paused ? "#94a3b8" : col.border }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: !paused ? "#dcfce7" : "#fef3c7", color: !paused ? "#15803d" : "#d97706" }}>
                          {!paused ? "Activa" : "Pausada"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nombre}</div>
                      <div style={{ fontSize: 10, color: "var(--mc-text-2)" }}>{freqLabel(r)}{cabs ? ` · ${cabs} cab.` : ""}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "8px 12px 10px", borderTop: "1px solid var(--mc-line)" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", fontStyle: "italic", lineHeight: 1.5 }}>
                Para agregar rutinas, usá la pestaña <strong style={{ color: "var(--mc-text-2)", fontStyle: "normal" }}>Rutinas</strong>
              </div>
            </div>
          </div>

          {/* Resumen semana */}
          <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid var(--mc-line)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>Esta Semana</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{wkShort}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--mc-line)", borderBottom: "1px solid var(--mc-line)" }}>
              {[
                { v: String(curEvs.length), l: "movimientos" },
                { v: cabSem.toLocaleString("es-AR"), l: "cab." },
                { v: String(lotesSem.size), l: "lotes" },
                { v: kmSem > 0 ? `${Math.round(kmSem)}km` : "—", l: "estimados" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "9px 12px", background: "var(--mc-surface)" }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--mc-ink)", letterSpacing: "-.02em" }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: "var(--mc-text-2)" }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "4px 0", maxHeight: 220, overflowY: "auto" }}>
              {curEvs.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)", padding: "10px 14px" }}>Semana sin movimientos.</div>}
              {[...curEvs]
                .sort((a, b) => (fechaStrMov(a.fecha) + (a.horario || "")).localeCompare(fechaStrMov(b.fecha) + (b.horario || "")))
                .map((ev) => {
                  const col = colDe(ev.tropaId);
                  const sb = sbStyle(ev);
                  const d = new Date(fechaStrMov(ev.fecha) + "T00:00:00");
                  return (
                    <div
                      key={ev.id}
                      style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", cursor: "pointer", transition: "background .1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mc-surface-2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={(e) => setPopover({ mov: ev, x: e.clientX, y: e.clientY })}
                    >
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: col.border, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {DIAS_S[d.getDay()]} {ev.horario || ""} · {ev.tropa?.nombre || "Tropa"} · {ev.origenNombre || "?"}→{ev.destinoNombre || "?"}
                        </div>
                      </div>
                      <div style={{ padding: "2px 6px", borderRadius: 4, background: sb.bg, color: sb.color, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{sb.label}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Popover de evento ── */}
      {popover && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 8990 }} onClick={() => setPopover(null)} />
          <div
            style={{
              position: "fixed",
              left: Math.min(popover.x + 12, (typeof window !== "undefined" ? window.innerWidth : 1200) - 296),
              top: Math.min(popover.y - 8, (typeof window !== "undefined" ? window.innerHeight : 800) - 300),
              width: 278, zIndex: 9000,
              background: "var(--mc-surface)", borderRadius: 14,
              boxShadow: "0 12px 40px rgba(0,0,0,.22),0 2px 8px rgba(0,0,0,.1)",
              border: "1px solid var(--mc-line)", overflow: "hidden",
            }}
          >
            {(() => {
              const ev = popover.mov;
              const col = colDe(ev.tropaId);
              const sb = sbStyle(ev);
              const d = new Date(fechaStrMov(ev.fecha) + "T00:00:00");
              return (
                <>
                  <div style={{ padding: "11px 13px", background: col.bg, borderBottom: `1px solid ${col.border}33`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: col.border, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: col.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ev.rutina?.nombre || ev.motivo || "Traslado"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      <span style={{ padding: "2px 7px", borderRadius: 4, background: sb.bg, color: sb.color, fontSize: 9, fontWeight: 700 }}>{sb.label}</span>
                      <button onClick={() => setPopover(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#94a3b8", lineHeight: 1, padding: "0 2px" }}><Icon name="x" size={13} /></button>
                    </div>
                  </div>
                  <div style={{ padding: "11px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", gap: 7 }}>
                      <Icon name="calendar" size={12} style={{ flexShrink: 0, color: "var(--mc-text-3)" }} />
                      <span style={{ fontSize: 11, color: "var(--mc-ink)" }}>{DIAS_S[d.getDay()]} — {d.getDate()} de {MESES[d.getMonth()]} {d.getFullYear()}</span>
                    </div>
                    <div style={{ display: "flex", gap: 7 }}>
                      <Icon name="clock" size={12} style={{ flexShrink: 0, color: "var(--mc-text-3)" }} />
                      <span style={{ fontSize: 11, color: "var(--mc-ink)" }}>{ev.horario || "Sin horario"}{ev.duracionMin ? ` · ${ev.duracionMin} min estimados` : ""}</span>
                    </div>
                    {ev.responsable && (
                      <div style={{ display: "flex", gap: 7 }}>
                        <Icon name="users" size={12} style={{ flexShrink: 0, color: "var(--mc-text-3)" }} />
                        <span style={{ fontSize: 11, color: "var(--mc-ink)" }}>{ev.responsable}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <Icon name="map-pin" size={12} style={{ flexShrink: 0, color: "var(--mc-text-3)" }} />
                      {[ev.origenNombre || "?", ev.destinoNombre || "?"].map((l, i, arr) => (
                        <React.Fragment key={i}>
                          <span style={{ padding: "2px 6px", borderRadius: 4, background: col.bg, border: `1px solid ${col.border}44`, fontSize: 10, fontWeight: 600, color: col.text }}>{l}</span>
                          {i < arr.length - 1 && <span style={{ color: "#94a3b8", fontSize: 11 }}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 7 }}>
                      <span style={{ fontSize: 12 }}><Icon name="cow" size={16} /></span>
                      <span style={{ fontSize: 11, color: "var(--mc-ink)" }}>{ev.tropa?.nombre || "Tropa"} · {ev.cabezas || 0} cab.</span>
                    </div>
                    {ev.notas && <div style={{ fontSize: 10.5, color: "var(--mc-text-2)", background: "var(--mc-surface-2)", borderRadius: 8, padding: "6px 9px" }}>{ev.notas}</div>}
                    {ev.estado === "Ejecutado" && (
                      <div style={{ padding: "5px 9px", borderRadius: 8, background: "#f0fdf4", fontSize: 10, color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Icon name="check" size={11} /> Movimiento ejecutado</div>
                    )}
                  </div>
                  <div style={{ padding: "9px 13px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 5 }}>
                    {ev.estado !== "Ejecutado" && (
                      <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ flex: 1, justifyContent: "center", fontSize: 11, color: "#16a34a" }} disabled={accionando} onClick={() => completarMov(ev)}>
                        Completar
                      </button>
                    )}
                    <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ flex: 1, justifyContent: "center", fontSize: 11, color: "var(--mc-red)" }} disabled={accionando} onClick={() => eliminarMov(ev)}>
                      Eliminar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
