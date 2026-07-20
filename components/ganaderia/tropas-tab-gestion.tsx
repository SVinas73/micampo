"use client";

// Pestaña Gestión: radar de rutinas operativas (Gantt 24h construido con los
// movimientos reales del día), asignación rápida de rutinas y registro de
// movimientos de hoy/ayer.

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, useToast } from "@/components/mc";
import {
  LoteGeoAPI,
  MovTropaAPI,
  RutinaAPI,
  TropaAPI,
  codigoTropa,
  fechaStrMov,
  freqLabel,
  mapaColoresTropas,
  movAtrasado,
  parseHora,
  rutaDeRutina,
  rutinaActiva,
  toDateStr,
} from "./tropas-tipos";
import { KpiMovCard } from "./tropas-ui";
import { ModalAsignarRutina, ModalMoverTropa, ModalNuevoTraslado, ModalPlanificarMovimiento } from "./tropas-modales";

type Seg = { s: number; e: number; t: "potrero" | "ordeñe" | "movimiento" | "corral" | "alerta"; l: string };

const ACT: Record<Seg["t"], { bg: string; txt: string }> = {
  potrero: { bg: "#4ade80", txt: "#155724" },
  "ordeñe": { bg: "#60a5fa", txt: "#fff" },
  movimiento: { bg: "#fb923c", txt: "#fff" },
  corral: { bg: "#cbd5e1", txt: "#475569" },
  alerta: { bg: "repeating-linear-gradient(45deg,#ef444466,#ef444466 4px,#fb923c66 4px,#fb923c66 8px)", txt: "#7f1d1d" },
};

const tipoDeLugar = (l: string): Seg["t"] =>
  /sala|tambo|orde[ñn]/i.test(l) ? "ordeñe" : /corral|manga|encierr/i.test(l) ? "corral" : "potrero";

/** Línea de tiempo del día de una tropa a partir de sus movimientos reales. */
function segmentosDeTropa(t: TropaAPI, movsHoy: MovTropaAPI[]): { segs: Seg[]; alerta: boolean } {
  const movs = movsHoy
    .filter((m) => m.tropaId === t.id && m.estado !== "Cancelado")
    .sort((a, b) => (a.horario || "99").localeCompare(b.horario || "99"));
  const segs: Seg[] = [];
  let alerta = false;
  let loc = movs[0]?.origenNombre || t.lote?.nombre || "Sin ubicación";
  let h = 0;
  for (const m of movs) {
    const hm = parseHora(m.horario) ?? 12;
    const dur = Math.max(0.5, (m.duracionMin || 60) / 60);
    if (hm > h) segs.push({ s: h, e: hm, t: tipoDeLugar(loc), l: loc });
    const atrasado = movAtrasado(m);
    if (atrasado) alerta = true;
    segs.push({
      s: Math.max(h, hm),
      e: Math.min(24, Math.max(h, hm) + dur),
      t: atrasado ? "alerta" : "movimiento",
      l: atrasado ? `Atrasado → ${m.destinoNombre || "?"}` : m.estado === "En curso" ? "En Ruta" : `→ ${m.destinoNombre || "?"}`,
    });
    h = Math.min(24, Math.max(h, hm) + dur);
    loc = m.destinoNombre || loc;
  }
  if (h < 24) segs.push({ s: h, e: 24, t: tipoDeLugar(loc), l: loc });
  return { segs, alerta };
}

export function MovGestion({
  tropas,
  rutinas,
  movimientos,
  lotes,
  onRefresh,
  onGoToHistorial,
}: {
  tropas: TropaAPI[];
  rutinas: RutinaAPI[];
  movimientos: MovTropaAPI[];
  lotes: LoteGeoAPI[];
  onRefresh: () => void;
  onGoToHistorial?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [zoom, setZoom] = useState<"6h" | "12h" | "24h">("24h");
  const [modoSeg, setModoSeg] = useState(true);
  const [modalPlanif, setModalPlanif] = useState(false);
  const [modalTraslado, setModalTraslado] = useState(false);
  const [modalAsignar, setModalAsignar] = useState<TropaAPI | null>(null);
  const [modalMover, setModalMover] = useState<TropaAPI | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; html: string } | null>(null);
  const [busquedaTropa, setBusquedaTropa] = useState("");
  const [tropaSel, setTropaSel] = useState<string>("");
  const [rutinaSel, setRutinaSel] = useState<RutinaAPI | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [filtroRegTropa, setFiltroRegTropa] = useState("Todas");
  const ganttRef = useRef<HTMLDivElement>(null);

  const colores = useMemo(() => mapaColoresTropas(tropas), [tropas]);
  const now = new Date();
  const horaActual = now.getHours() + now.getMinutes() / 60;
  const zoomH = zoom === "6h" ? 6 : zoom === "12h" ? 12 : 24;
  const toPct = (h: number) => Math.max(0, Math.min(100, (h / zoomH) * 100));
  const toW = (s: number, e: number) => Math.max(0, Math.min(100 - toPct(s), toPct(e) - toPct(s)));

  const hoyStr = toDateStr(now);
  const ayer = new Date(now); ayer.setDate(ayer.getDate() - 1);
  const ayerStr = toDateStr(ayer);
  const movsHoy = useMemo(() => movimientos.filter((m) => fechaStrMov(m.fecha) === hoyStr), [movimientos, hoyStr]);
  const movsAyer = useMemo(() => movimientos.filter((m) => fechaStrMov(m.fecha) === ayerStr), [movimientos, ayerStr]);

  /* KPIs */
  const totalCabezas = tropas.reduce((s, t) => s + (t._count?.animales ?? t.animales?.length ?? 0), 0);
  const activosHoy = movsHoy.filter((m) => m.estado !== "Cancelado");
  const ejecutadosHoy = activosHoy.filter((m) => m.estado === "Ejecutado").length;
  const cabTransito = activosHoy.filter((m) => m.estado === "En curso").reduce((s, m) => s + (m.cabezas || 0), 0);
  const atrasados = movimientos.filter((m) => movAtrasado(m));
  const hace30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const movs30 = movimientos.filter((m) => fechaStrMov(m.fecha) >= toDateStr(hace30) && fechaStrMov(m.fecha) <= hoyStr);
  const cerrados30 = movs30.filter((m) => m.estado === "Ejecutado").length;
  const evaluables30 = cerrados30 + movs30.filter((m) => m.estado === "Cancelado" || movAtrasado(m)).length;
  const eficiencia = evaluables30 > 0 ? Math.round((cerrados30 / evaluables30) * 100) : null;

  const tickLabels = zoom === "6h" ? [0, 1, 2, 3, 4, 5, 6] : zoom === "12h" ? [0, 2, 4, 6, 8, 10, 12] : [0, 3, 6, 9, 12, 15, 18, 21, 24];

  const handleSegHover = (e: React.MouseEvent, seg: Seg, tropa: TropaAPI, cabTropa: number) => {
    if (!ganttRef.current) return;
    const rect = ganttRef.current.getBoundingClientRect();
    const fmtH = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 60,
      html: `${tropa.nombre} · ${seg.l} | ${fmtH(seg.s)} – ${seg.e === 24 ? "24:00" : fmtH(seg.e)} | ${cabTropa} cab.`,
    });
  };

  const tropasFiltradas = tropas.filter((t) => {
    const q = busquedaTropa.trim().toLowerCase();
    return !q || t.nombre.toLowerCase().includes(q) || (t.categoria || "").toLowerCase().includes(q);
  });
  const tropaSeleccionada = tropas.find((t) => t.id === tropaSel) || null;

  const confirmarPlan = async () => {
    if (!tropaSeleccionada || !rutinaSel) return;
    setConfirmando(true);
    try {
      const r = await fetch(`/api/tropas/${tropaSeleccionada.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rutinaId: rutinaSel.id }),
      });
      if (!r.ok) throw new Error();
      toast.show(`Rutina "${rutinaSel.nombre}" asignada a ${tropaSeleccionada.nombre}`);
      setRutinaSel(null);
      onRefresh();
    } catch {
      toast.show("No se pudo asignar la rutina", "err");
    } finally {
      setConfirmando(false);
    }
  };

  const badgeDeMov = (m: MovTropaAPI) => {
    if (movAtrasado(m)) return { badge: "Atrasado", bc: "#fde7e7", btc: "#c93434", dot: "#c93434", alerta: true };
    if (m.estado === "Ejecutado") return { badge: "Completado", bc: "#dcfce7", btc: "#16a34a", dot: "#4ade80", alerta: false };
    if (m.estado === "En curso") return { badge: "En Tránsito", bc: "#fff7ed", btc: "#fb923c", dot: "#fb923c", alerta: false };
    if (m.estado === "Cancelado") return { badge: "Cancelado", bc: "#f1f5f9", btc: "#64748b", dot: "#94a3b8", alerta: false };
    return { badge: "Planificado", bc: "#eff6ff", btc: "#2563eb", dot: "#60a5fa", alerta: false };
  };

  const MovEntry = ({ m }: { m: MovTropaAPI }) => {
    const b = badgeDeMov(m);
    return (
      <div style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--mc-line)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-2)", width: 42, textAlign: "right" }}>{m.horario || "—"}</div>
        </div>
        <div style={{ position: "relative", paddingLeft: 20, flex: 1, minWidth: 0 }}>
          <div style={{ position: "absolute", left: 0, top: 6, width: 10, height: 10, borderRadius: "50%", background: b.dot, flexShrink: 0 }} />
          <div style={{ position: "absolute", left: 4, top: 16, bottom: -12, width: 2, background: "var(--mc-line)" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 4 }}>
            {m.tropa?.nombre || "Tropa"}{m.motivo ? ` — ${m.motivo}` : ""}
          </div>
          <div style={{ fontSize: 12, color: "var(--mc-text-2)", marginBottom: 4 }}>
            {m.origenNombre || "—"} → {m.destinoNombre || "—"} &nbsp;·&nbsp; {m.cabezas || 0} cab.
            {m.responsable ? <> &nbsp;·&nbsp; {m.responsable}</> : null}
            {m.duracionMin ? ` · ${m.duracionMin} min` : ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, background: b.bc, color: b.btc }}>{b.badge}</span>
            {b.alerta && <Icon name="alert-triangle" size={13} style={{ color: "#c93434" }} />}
          </div>
        </div>
      </div>
    );
  };

  const fmtSep = (d: Date) =>
    d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" }).replace(/^\w/, (c) => c.toUpperCase());

  const regHoy = (filtroRegTropa === "Todas" ? movsHoy : movsHoy.filter((m) => m.tropaId === filtroRegTropa)).sort((a, b) => (b.horario || "").localeCompare(a.horario || ""));
  const regAyer = (filtroRegTropa === "Todas" ? movsAyer : movsAyer.filter((m) => m.tropaId === filtroRegTropa)).sort((a, b) => (b.horario || "").localeCompare(a.horario || ""));

  const exportarRegistro = () => {
    const filas = [
      ["Fecha", "Hora", "Tropa", "Origen", "Destino", "Cabezas", "Responsable", "Estado", "Motivo"],
      ...[...regHoy, ...regAyer].map((m) => [
        fechaStrMov(m.fecha), m.horario || "", m.tropa?.nombre || "", m.origenNombre || "", m.destinoNombre || "",
        String(m.cabezas || 0), m.responsable || "", m.estado, m.motivo || "",
      ]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `registro-movimientos-${hoyStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {toast.node}
      {modalPlanif && <ModalPlanificarMovimiento tropas={tropas} rutinas={rutinas} lotes={lotes} onClose={() => setModalPlanif(false)} onGuardado={onRefresh} />}
      {modalTraslado && <ModalNuevoTraslado tropas={tropas} lotes={lotes} onClose={() => setModalTraslado(false)} onGuardado={onRefresh} />}
      {modalAsignar && <ModalAsignarRutina tropa={modalAsignar} rutinas={rutinas} onClose={() => setModalAsignar(null)} onGuardado={onRefresh} />}
      {modalMover && <ModalMoverTropa tropa={modalMover} lotes={lotes} onClose={() => setModalMover(null)} onGuardado={onRefresh} />}

      {/* ── KPIs ── */}
      <div className="grid g-cols-5" style={{ gap: 10 }}>
        <KpiMovCard title="Tropas Activas" ico="users" val={String(tropas.length)} sub={`${totalCabezas.toLocaleString("es-AR")} cabezas gestionadas`} />
        <KpiMovCard
          title="Movimientos Hoy"
          ico="route"
          val={String(ejecutadosHoy)}
          valSuffix={`/ ${activosHoy.length}`}
          barPct={activosHoy.length ? (ejecutadosHoy / activosHoy.length) * 100 : 0}
          sub={activosHoy.length ? `de ${activosHoy.length} traslados completados` : "sin traslados programados"}
        />
        <KpiMovCard title="En Tránsito" ico="move-right" val={String(cabTransito)} valSuffix="cab." sub={cabTransito > 0 ? "Animales en arreo ahora" : "Sin arreos en curso"} pulse={cabTransito > 0} />
        <KpiMovCard title="Eficiencia Rutina" ico="clock" val={eficiencia !== null ? `${eficiencia}%` : "—"} trend={eficiencia !== null && eficiencia >= 80 ? "up" : undefined} sub={eficiencia !== null ? "Cumplimiento últimos 30 días" : "Sin movimientos recientes"} />
        <KpiMovCard
          title="Alertas"
          ico="alert-triangle"
          val={String(atrasados.length)}
          valSuffix={atrasados.length === 1 ? "Activa" : "Activas"}
          trend={atrasados.length > 0 ? "down" : "up"}
          sub={atrasados.length > 0 ? `${atrasados[0].tropa?.nombre || "Tropa"} con traslado atrasado` : "Todo en horario"}
        />
      </div>

      {/* ── Acciones ── */}
      <div className="row gap-8" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => router.push("/trazabilidad")}>DT-e</button>
        <button
          onClick={() => setModoSeg((p) => !p)}
          className="mc-btn mc-btn--ghost mc-btn--sm"
          style={{ border: `1.5px solid ${modoSeg ? "#16a34a" : "#94a3b8"}`, color: modoSeg ? "#16a34a" : "var(--mc-text-2)", background: modoSeg ? "#f0fdf4" : "transparent", fontWeight: 600 }}
        >
          <Icon name="eye" size={13} />{modoSeg ? "Modo Seguimiento" : "Modo Visualización"}
        </button>
        <button onClick={() => setModalPlanif(true)} className="mc-btn mc-btn--secondary"><Icon name="calendar" size={14} />Planificar Movimiento</button>
        <button onClick={() => setModalTraslado(true)} className="mc-btn mc-btn--primary"><Icon name="plus" size={14} />Nuevo Traslado</button>
      </div>

      {/* ── Gantt ── */}
      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }} ref={ganttRef}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--mc-line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>Radar de Rutinas Operativas</div>
            <div style={{ fontSize: 12, color: "#8a938d", marginTop: 2 }}>Ubicación y traslados del día por tropa</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {([["#4ade80", "Potrero"], ["#60a5fa", "Sala Ordeñe"], ["#fb923c", "En Movimiento"], ["#cbd5e1", "Corral"]] as const).map(([c, l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                  <span style={{ fontSize: 11, color: "var(--mc-text-2)" }}>{l}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", background: "var(--mc-surface-3)", borderRadius: 999, padding: 3, gap: 2 }}>
              {(["6h", "12h", "24h"] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  style={{ padding: "4px 12px", borderRadius: 999, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", background: zoom === z ? "#16a34a" : "transparent", color: zoom === z ? "white" : "var(--mc-text-2)", transition: "all .15s" }}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        </div>

        {tropas.length === 0 ? (
          <div className="mc-empty" style={{ padding: "40px 0" }}>
            <div className="mc-empty__icon"><Icon name="route" size={22} /></div>
            Creá tropas para ver su línea de tiempo diaria
          </div>
        ) : (
          <div style={{ position: "relative", overflowX: "auto" }}>
            {tooltip && (
              <div style={{ position: "absolute", left: tooltip.x, top: Math.max(4, tooltip.y), background: "#1e293b", color: "white", fontSize: 11, padding: "6px 10px", borderRadius: 8, zIndex: 100, pointerEvents: "none", whiteSpace: "nowrap", maxWidth: 320 }}>
                {tooltip.html}
              </div>
            )}
            <div style={{ minWidth: 680 }}>
              {/* Etiquetas de hora */}
              <div style={{ display: "flex", marginLeft: 140, paddingTop: 10, paddingBottom: 6, borderBottom: "1px solid var(--mc-line)", position: "relative" }}>
                {tickLabels.map((h) => (
                  <div key={h} style={{ flex: 1, fontSize: 10, color: "#94a3b8", fontWeight: 600, textAlign: "left" }}>{String(h).padStart(2, "0")}:00</div>
                ))}
                {horaActual <= zoomH && (
                  <div style={{ position: "absolute", left: toPct(horaActual) + "%", top: 0, transform: "translateX(-50%)", pointerEvents: "none", zIndex: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#c93434", background: "var(--mc-surface)", border: "1px solid #c93434", padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap", display: "block", textAlign: "center" }}>
                      {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>

              {/* Filas */}
              <div style={{ position: "relative" }}>
                {horaActual <= zoomH && (
                  <div style={{ position: "absolute", left: `calc(140px + ${(toPct(horaActual) / 100).toFixed(4)} * (100% - 140px))`, top: 0, bottom: 0, width: 1.5, background: "#c93434", zIndex: 5, opacity: 0.85, pointerEvents: "none" }} />
                )}
                {tropas.map((t, idx) => {
                  const cabT = t._count?.animales ?? t.animales?.length ?? 0;
                  const { segs, alerta } = segmentosDeTropa(t, movsHoy);
                  return (
                    <div key={t.id} className="mc-gantt-row" style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--mc-line)", borderLeft: alerta ? "3px solid #c93434" : "3px solid transparent", transition: "background .15s" }}>
                      <div style={{ width: 140, minWidth: 140, padding: "10px 12px", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mc-ink)", display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: colores[t.id], flexShrink: 0 }} />
                          {codigoTropa(idx)}
                        </div>
                        <div style={{ fontSize: 11, color: "#8a938d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.nombre}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: alerta ? "#fde7e7" : "var(--mc-surface-3)", color: alerta ? "#c93434" : "var(--mc-text-2)", display: "inline-block", marginTop: 2 }}>{cabT} cab.</div>
                      </div>
                      <div style={{ flex: 1, position: "relative", height: 52, margin: "4px 0" }}>
                        {segs.map((seg, i) => {
                          const left = toPct(seg.s);
                          const width = toW(seg.s, seg.e);
                          if (width <= 0) return null;
                          const a = ACT[seg.t];
                          const isAlerta = seg.t === "alerta";
                          return (
                            <div
                              key={i}
                              style={{
                                position: "absolute", left: left + "%", width: width + "%", top: 6, bottom: 6, borderRadius: 6,
                                background: a.bg, border: isAlerta ? "2px solid #ef4444" : "none",
                                display: "flex", alignItems: "center", paddingLeft: 6, overflow: "hidden", cursor: "pointer", boxSizing: "border-box",
                              }}
                              onMouseEnter={(e) => handleSegHover(e, seg, t, cabT)}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              <span style={{ fontSize: 10, fontWeight: 700, color: a.txt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{seg.l}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", gap: 4, paddingRight: 10, flexShrink: 0 }}>
                        <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ fontSize: 10, padding: "3px 8px", height: 26 }} onClick={() => setModalAsignar(t)}><Icon name="map-pin" size={11} /> Asignar</button>
                        {modoSeg && (
                          <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ fontSize: 10, padding: "3px 8px", height: 26 }} onClick={() => setModalMover(t)}>→ Mover</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Asignación Rápida + Registro ── */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, alignItems: "stretch" }}>
        {/* Asignación Rápida */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 22px 12px", borderBottom: "1px solid var(--mc-line)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>Control de Asignación Rápida</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 280, flex: 1 }}>
            {/* Izquierda: tropa */}
            <div style={{ padding: "20px 22px", borderRight: "1px solid var(--mc-line)", minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8a938d", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Seleccionar Tropa</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--mc-line)", borderRadius: 10, padding: "8px 12px", marginBottom: 12, background: "var(--mc-surface-2)" }}>
                <Icon name="search" size={14} style={{ color: "#94a3b8" }} />
                <input
                  value={busquedaTropa}
                  onChange={(e) => setBusquedaTropa(e.target.value)}
                  placeholder="Buscar tropa por nombre..."
                  style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: "var(--mc-ink)", fontFamily: "inherit", minWidth: 0 }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflowY: "auto", marginBottom: 14 }}>
                {tropasFiltradas.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin tropas que coincidan.</div>}
                {tropasFiltradas.map((t) => {
                  const sel = tropaSel === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTropaSel(t.id)}
                      style={{ padding: "10px 12px", background: sel ? "#f0fdf4" : "var(--mc-surface)", border: sel ? "1.5px solid #16a34a" : "1px solid var(--mc-line)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    >
                      <Icon name="beef" size={18} style={{ color: sel ? "#16a34a" : colores[t.id], flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mc-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.nombre}</div>
                        <div style={{ fontSize: 11, color: sel ? "#16a34a" : "var(--mc-text-3)", fontWeight: 600 }}>{t._count?.animales ?? 0} cabezas</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {rutinaSel ? (
                <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1.5px solid #16a34a", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Icon name="repeat" size={18} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rutinaSel.nombre}</div>
                      <div style={{ fontSize: 11, color: "var(--mc-text-2)" }}>Rutina seleccionada</div>
                    </div>
                  </div>
                  <button onClick={() => setRutinaSel(null)} style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="x" size={12} style={{ color: "var(--mc-text-2)" }} />
                  </button>
                </div>
              ) : (
                <div style={{ border: "2px dashed var(--mc-line-2)", borderRadius: 10, padding: "20px 16px", textAlign: "center", background: "var(--mc-surface-2)" }}>
                  <Icon name="repeat" size={22} style={{ color: "#94a3b8", marginBottom: 6 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mc-text-2)", marginBottom: 4 }}>Elegí una rutina de la biblioteca</div>
                  <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>y confirmá el plan del día</div>
                </div>
              )}
            </div>

            {/* Derecha: rutinas */}
            <div style={{ padding: "20px 22px", minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8a938d", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Rutinas Disponibles</div>
              {rutinas.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--mc-text-3)", lineHeight: 1.6 }}>
                  Sin rutinas creadas todavía.<br />Creálas desde la pestaña <strong>Rutinas</strong>.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                  {rutinas.map((r) => {
                    const sel = rutinaSel?.id === r.id;
                    const activa = rutinaActiva(r);
                    return (
                      <div
                        key={r.id}
                        className="mc-rutina-card"
                        onClick={() => setRutinaSel(r)}
                        style={{ padding: "12px 14px", borderRadius: 12, border: sel ? "2px solid #16a34a" : "1.5px solid var(--mc-line)", background: sel ? "#f0fdf4" : "var(--mc-surface)", display: "flex", alignItems: "center", gap: 10, transition: "all .15s", cursor: "pointer" }}
                      >
                        <Icon name="repeat" size={18} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nombre}</div>
                          <div style={{ fontSize: 11, color: "var(--mc-text-2)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {r.descripcion || rutaDeRutina(r).join(" → ") || freqLabel(r)}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: activa ? "#dcfce7" : "#fef3c7", color: activa ? "#16a34a" : "#d97706", flexShrink: 0 }}>
                          {activa ? "Activa" : "Pausada"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Footer */}
          <div style={{ padding: "12px 22px", background: "var(--mc-surface-2)", borderTop: "1px solid var(--mc-line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "#8a938d", minWidth: 0 }}>
              Tropa: <strong style={{ color: "var(--mc-ink)" }}>{tropaSeleccionada?.nombre || "—"}</strong>
              {rutinaSel && <> &nbsp;|&nbsp; Rutina: <strong style={{ color: "var(--mc-ink)" }}>{rutinaSel.nombre}</strong></>}
            </div>
            <button className="mc-btn mc-btn--primary" style={{ fontSize: 13 }} disabled={!tropaSeleccionada || !rutinaSel || confirmando} onClick={confirmarPlan}>
              <Icon name="check" size={14} />{confirmando ? "Asignando…" : "Confirmar Plan del Día"}
            </button>
          </div>
        </div>

        {/* Registro de Movimientos */}
        <div className="mc-card" style={{ padding: "18px 22px", overflowY: "auto", maxHeight: 560 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>Registro de Movimientos</div>
              <div style={{ fontSize: 12, color: "#8a938d", marginTop: 2 }}>Arreos y traslados de hoy y ayer</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <select className="mc-select" style={{ fontSize: 11, padding: "4px 8px" }} value={filtroRegTropa} onChange={(e) => setFiltroRegTropa(e.target.value)}>
                <option value="Todas">Todas las tropas</option>
                {tropas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ fontSize: 11 }} onClick={exportarRegistro} disabled={regHoy.length + regAyer.length === 0}>
                <Icon name="download" size={12} />Exportar
              </button>
            </div>
          </div>

          {/* Hoy */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8a938d", textTransform: "uppercase", letterSpacing: ".08em", whiteSpace: "nowrap" }}>HOY — {fmtSep(now)}</div>
            <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
          </div>
          {regHoy.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--mc-text-3)", textAlign: "center", padding: "10px 0 16px" }}>Sin movimientos registrados hoy.</div>
          ) : (
            <div style={{ borderLeft: "2px solid var(--mc-line)", marginLeft: 8 }}>
              {regHoy.map((m) => <MovEntry key={m.id} m={m} />)}
            </div>
          )}

          {/* Ayer */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 12px" }}>
            <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8a938d", textTransform: "uppercase", letterSpacing: ".08em", whiteSpace: "nowrap" }}>AYER — {fmtSep(ayer)}</div>
            <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
          </div>
          {regAyer.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--mc-text-3)", textAlign: "center", padding: "10px 0" }}>Sin movimientos registrados ayer.</div>
          ) : (
            <div style={{ borderLeft: "2px solid var(--mc-line)", marginLeft: 8 }}>
              {regAyer.map((m) => <MovEntry key={m.id} m={m} />)}
            </div>
          )}

          {onGoToHistorial && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button className="mc-btn mc-btn--secondary" style={{ fontSize: 12 }} onClick={onGoToHistorial}>Ver historial completo →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
