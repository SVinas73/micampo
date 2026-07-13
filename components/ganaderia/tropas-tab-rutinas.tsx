"use client";

// Pestaña Rutinas: biblioteca de rutinas de movimiento (cards/tabla) con
// activar/pausar, edición y detalle. KPIs derivados de rutinas y movimientos.

import React, { useMemo, useState } from "react";
import { Icon, useToast } from "@/components/mc";
import {
  LoteGeoAPI,
  MovTropaAPI,
  RutinaAPI,
  TropaAPI,
  dateLocalDeISO,
  fechaStrMov,
  fmtFechaLarga,
  freqLabel,
  movAtrasado,
  parseRutinaConfig,
  toDateStr,
} from "./tropas-tipos";
import { KpiMovCard } from "./tropas-ui";
import { DrawerVerRutina, ModalNuevaRutina } from "./tropas-modales";

const ICONO_TIPO: Record<string, string> = { rotacion: "repeat", sanidad: "shield", descanso: "map-pin", fija: "route" };

export function MovRutinas({
  rutinas,
  tropas,
  movimientos,
  lotes,
  onRefresh,
}: {
  rutinas: RutinaAPI[];
  tropas: TropaAPI[];
  movimientos: MovTropaAPI[];
  lotes: LoteGeoAPI[];
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [modalNueva, setModalNueva] = useState(false);
  const [rutinaEditar, setRutinaEditar] = useState<RutinaAPI | null>(null);
  const [rutinaVer, setRutinaVer] = useState<RutinaAPI | null>(null);
  const [filtro, setFiltro] = useState<"Todas" | "Activas" | "Pausadas">("Todas");
  const [vista, setVista] = useState<"cards" | "tabla">("cards");
  const [togglando, setTogglando] = useState<string | null>(null);

  const activas = rutinas.filter((r) => r.estado === "activa");
  const hoyStr = toDateStr(new Date());

  /* Próxima ejecución: siguiente movimiento planificado ligado a una rutina */
  const proxima = useMemo(
    () =>
      movimientos
        .filter((m) => m.rutinaId && m.estado === "Planificado" && fechaStrMov(m.fecha) >= hoyStr)
        .sort((a, b) => (fechaStrMov(a.fecha) + (a.horario || "")).localeCompare(fechaStrMov(b.fecha) + (b.horario || "")))[0] || null,
    [movimientos, hoyStr]
  );

  const cabProgramadas = tropas
    .filter((t) => t.rutinaId && activas.some((r) => r.id === t.rutinaId))
    .reduce((s, t) => s + (t._count?.animales ?? t.animales?.length ?? 0), 0);

  const movsRutina = movimientos.filter((m) => m.rutinaId);
  const ejecutadas = movsRutina.filter((m) => m.estado === "Ejecutado").length;
  const vencidas = movsRutina.filter((m) => movAtrasado(m)).length;
  const evaluables = ejecutadas + vencidas + movsRutina.filter((m) => m.estado === "Cancelado").length;
  const cumplimiento = evaluables > 0 ? Math.round((ejecutadas / evaluables) * 100) : null;

  const filtradas = rutinas.filter((r) =>
    filtro === "Todas" ? true : filtro === "Activas" ? r.estado === "activa" : r.estado !== "activa"
  );

  const tropasDe = (r: RutinaAPI) => tropas.filter((t) => t.rutinaId === r.id);

  const toggleEstado = async (r: RutinaAPI) => {
    const nuevo = r.estado === "activa" ? "pausada" : "activa";
    setTogglando(r.id);
    try {
      const resp = await fetch(`/api/rutinas-tropa/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo }),
      });
      if (!resp.ok) throw new Error();
      toast.show(`Rutina "${r.nombre}" ${nuevo === "activa" ? "activada" : "pausada"}`);
      onRefresh();
    } catch {
      toast.show("No se pudo cambiar el estado", "err");
    } finally {
      setTogglando(null);
    }
  };

  const RutinaCard = ({ r }: { r: RutinaAPI }) => {
    const on = r.estado === "activa";
    const tone = on ? "green" : "amber";
    const tBg = on ? "#dcfce7" : "#fef3c7";
    const tClr = on ? "#15803d" : "#92400e";
    const cfg = parseRutinaConfig(r);
    const secuencia = cfg.secuencia || [];
    const asignadas = tropasDe(r);
    return (
      <div
        className="mc-card"
        style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, transition: "box-shadow .15s,transform .15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--sh-lg)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: tBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {r.emoji ? <span style={{ fontSize: 15 }}>{r.emoji}</span> : <Icon name={ICONO_TIPO[r.tipo] || "repeat"} size={15} style={{ color: tClr }} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", letterSpacing: ".06em", textTransform: "uppercase" }}>{r.tipo}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)", lineHeight: 1.2 }}>{r.nombre}</div>
            </div>
          </div>
          <span className={`mc-badge mc-badge--${tone}`}>{on ? "Activa" : "Pausada"}</span>
        </div>

        <div style={{ fontSize: 11, color: "var(--mc-text-2)", display: "flex", alignItems: "center", gap: 5 }}>
          <Icon name="repeat" size={11} style={{ color: "var(--mc-text-3)" }} />
          {freqLabel(r)}
          {asignadas.length > 0 && (
            <span style={{ marginLeft: 8, color: "var(--mc-text-3)" }}>
              · {asignadas.map((t) => t.nombre).join(", ")}
            </span>
          )}
        </div>

        {/* Secuencia de lotes con horarios */}
        <div style={{ background: "var(--mc-surface-2)", borderRadius: 10, padding: "10px 12px" }}>
          {secuencia.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{r.descripcion || "Sin ruta configurada"}</div>
          ) : (
            secuencia.map((paso, j) => (
              <React.Fragment key={j}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: tClr, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{paso.lugar}</span>
                  {(paso.inicio || paso.fin) && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-text-3)", fontFamily: "var(--ff-mono)", flexShrink: 0 }}>
                      {paso.inicio || "—"}{paso.fin ? `–${paso.fin}` : ""}
                    </span>
                  )}
                </div>
                {j < secuencia.length - 1 && (
                  <div style={{ display: "flex", alignItems: "stretch", padding: "3px 0 3px 3px" }}>
                    <div style={{ width: 1, background: "var(--mc-line)", margin: "0 3px", minHeight: 10 }} />
                    <span style={{ fontSize: 9, color: "var(--mc-text-3)", paddingLeft: 6, lineHeight: "14px" }}>↓ traslado</span>
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--mc-line)", paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="mc-icon-btn" title="Editar" onClick={() => setRutinaEditar(r)}><Icon name="edit" size={13} /></button>
            <button className="mc-icon-btn" title="Ver detalle" onClick={() => setRutinaVer(r)}><Icon name="eye" size={13} /></button>
          </div>
          <button onClick={() => toggleEstado(r)} disabled={togglando === r.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: 34, height: 18, borderRadius: 999, background: on ? "#16a34a" : "#cbd5e1", position: "relative", transition: "background .2s" }}>
              <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: on ? "#16a34a" : "var(--mc-text-3)" }}>{on ? "Activa" : "Pausada"}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {toast.node}
      {modalNueva && <ModalNuevaRutina lotes={lotes} tropas={tropas} onClose={() => setModalNueva(false)} onGuardado={onRefresh} />}
      {rutinaEditar && <ModalNuevaRutina rutina={rutinaEditar} lotes={lotes} tropas={tropas} onClose={() => setRutinaEditar(null)} onGuardado={onRefresh} />}
      {rutinaVer && (
        <DrawerVerRutina
          rutina={rutinaVer}
          movimientos={movimientos}
          onClose={() => setRutinaVer(null)}
          onEdit={() => { const r = rutinaVer; setRutinaVer(null); setRutinaEditar(r); }}
        />
      )}

      {/* ── KPIs ── */}
      <div className="grid g-cols-5" style={{ gap: 10 }}>
        <KpiMovCard title="Rutinas Activas" ico="repeat" val={String(activas.length)} sub={`de ${rutinas.length} rutinas configuradas`} />
        <KpiMovCard
          title="Próxima Ejecución"
          ico="calendar"
          val={proxima ? fmtFechaLarga(dateLocalDeISO(proxima.fecha)).replace(/ de \d{4}$/, "") : "—"}
          sub={proxima ? `${proxima.rutina?.nombre || "Rutina"} · ${proxima.tropa?.nombre || ""} · ${proxima.cabezas || 0} cab.` : "Sin ejecuciones planificadas"}
        />
        <KpiMovCard title="Cab. Programadas" ico="move-right" val={String(cabProgramadas)} valSuffix="cab." sub="en rutinas activas" />
        <KpiMovCard
          title="Cumplimiento"
          ico="check"
          val={cumplimiento !== null ? `${cumplimiento}%` : "—"}
          valColor={cumplimiento !== null && cumplimiento >= 80 ? "#16a34a" : undefined}
          sub={evaluables > 0 ? `${ejecutadas} de ${evaluables} ejecuciones en plazo` : "Sin ejecuciones registradas"}
        />
        <KpiMovCard
          title="Alertas"
          ico="shield"
          val={`${vencidas} Vencida${vencidas === 1 ? "" : "s"}`}
          valColor={vencidas > 0 ? "#c93434" : "#16a34a"}
          sub={vencidas > 0 ? "Ejecuciones de rutina atrasadas" : "Todas las rutinas al día"}
          subColor={vencidas > 0 ? "#c93434" : undefined}
        />
      </div>

      {/* ── Acciones ── */}
      <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalNueva(true)}><Icon name="plus" size={14} />Nueva Rutina</button>
      </div>

      {/* ── Rutinas ── */}
      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--mc-ink)" }}>Rutinas de Movimiento</div>
            <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 2 }}>
              {rutinas.length} rutina{rutinas.length === 1 ? "" : "s"} configurada{rutinas.length === 1 ? "" : "s"} · {activas.length} activa{activas.length === 1 ? "" : "s"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "var(--mc-surface-3)", borderRadius: 999, padding: 3, gap: 2 }}>
              {(["Todas", "Activas", "Pausadas"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  style={{ padding: "3px 11px", borderRadius: 999, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", background: filtro === f ? "var(--mc-surface)" : "transparent", color: filtro === f ? "var(--mc-green-600)" : "var(--mc-text-3)", boxShadow: filtro === f ? "0 1px 3px rgba(0,0,0,.1)" : "none", transition: "all .15s" }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", background: "var(--mc-surface-3)", borderRadius: 8, padding: 3, gap: 2 }}>
              <button onClick={() => setVista("cards")} style={{ padding: "3px 8px", borderRadius: 6, border: "none", cursor: "pointer", background: vista === "cards" ? "var(--mc-surface)" : "transparent", color: vista === "cards" ? "var(--mc-green-600)" : "var(--mc-text-3)", boxShadow: vista === "cards" ? "0 1px 3px rgba(0,0,0,.1)" : "none" }} title="Cards">
                <Icon name="grid" size={12} />
              </button>
              <button onClick={() => setVista("tabla")} style={{ padding: "3px 8px", borderRadius: 6, border: "none", cursor: "pointer", background: vista === "tabla" ? "var(--mc-surface)" : "transparent", color: vista === "tabla" ? "var(--mc-green-600)" : "var(--mc-text-3)", boxShadow: vista === "tabla" ? "0 1px 3px rgba(0,0,0,.1)" : "none" }} title="Tabla">
                <Icon name="list" size={12} />
              </button>
            </div>
          </div>
        </div>
        <div style={{ padding: 14 }}>
          {filtradas.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--mc-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="repeat" size={22} style={{ color: "var(--mc-text-3)" }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>Sin rutinas</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>
                {rutinas.length === 0 ? "Creá tu primera rutina de arreo para automatizar la planificación." : "No hay rutinas con el filtro seleccionado."}
              </div>
              {rutinas.length === 0 ? (
                <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setModalNueva(true)}><Icon name="plus" size={12} /> Nueva Rutina</button>
              ) : (
                <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => setFiltro("Todas")}>Ver todas</button>
              )}
            </div>
          ) : vista === "cards" ? (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {filtradas.map((r) => <RutinaCard key={r.id} r={r} />)}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="mc-table">
                <thead>
                  <tr><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Frecuencia</th><th>Ruta</th><th>Tropas</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {filtradas.map((r) => {
                    const ruta = (parseRutinaConfig(r).secuencia || []).map((s) => s.lugar);
                    const asignadas = tropasDe(r);
                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600, color: "var(--mc-ink)" }}>{r.emoji ? `${r.emoji} ` : ""}{r.nombre}</td>
                        <td style={{ fontSize: 12, textTransform: "capitalize" }}>{r.tipo}</td>
                        <td><span className={`mc-badge mc-badge--${r.estado === "activa" ? "green" : "amber"}`}>{r.estado === "activa" ? "Activa" : "Pausada"}</span></td>
                        <td style={{ fontSize: 12, color: "var(--mc-text-2)" }}>{freqLabel(r)}</td>
                        <td style={{ fontSize: 12 }}>{ruta.length ? ruta.join(" → ") : "—"}</td>
                        <td style={{ fontSize: 12 }}>{asignadas.length ? asignadas.map((t) => t.nombre).join(", ") : "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="mc-icon-btn" title="Editar" onClick={() => setRutinaEditar(r)}><Icon name="edit" size={13} /></button>
                            <button className="mc-icon-btn" title="Ver" onClick={() => setRutinaVer(r)}><Icon name="eye" size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
