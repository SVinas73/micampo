"use client";

// Pestaña Historial: tabla completa de movimientos con filtros (período,
// tipo, tropa, estado), selección múltiple, exportación CSV, paginación y
// modal de detalle con ruta visual y movimientos relacionados.

import React, { useMemo, useState } from "react";
import { Icon, useToast } from "@/components/mc";
import {
  MovTropaAPI,
  TIPOS_MOV,
  TipoMov,
  TropaAPI,
  dateLocalDeISO,
  fechaStrMov,
  fmtFechaLarga,
  movAtrasado,
  tipoDeMovimiento,
  toDateStr,
} from "./tropas-tipos";
import { KpiMovCard } from "./tropas-ui";

const TIPO_STYLE: Record<TipoMov, { bg: string; color: string }> = {
  Interno: { bg: "#f1f5f9", color: "#475569" },
  Venta: { bg: "#dbeafe", color: "#1d4ed8" },
  Compra: { bg: "#dcfce7", color: "#15803d" },
  Destete: { bg: "#fef3c7", color: "#d97706" },
  Sanitario: { bg: "#ede9fe", color: "#7c3aed" },
};

const AVATAR_PALETA = [
  { bg: "#dbeafe", clr: "#1d4ed8" },
  { bg: "#fef3c7", clr: "#d97706" },
  { bg: "#ede9fe", clr: "#7c3aed" },
  { bg: "#dcfce7", clr: "#15803d" },
  { bg: "#fce7f3", clr: "#be185d" },
];
const avatarDe = (nombre: string) => {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) % 997;
  return AVATAR_PALETA[h % AVATAR_PALETA.length];
};
const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const PERIODOS = ["Hoy", "Esta semana", "Este mes", "3 meses", "Este año", "Todo"] as const;
type Periodo = (typeof PERIODOS)[number];

function desdeDePeriodo(p: Periodo): string | null {
  const hoy = new Date();
  if (p === "Hoy") return toDateStr(hoy);
  if (p === "Esta semana") { const d = new Date(hoy); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toDateStr(d); }
  if (p === "Este mes") return toDateStr(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  if (p === "3 meses") return toDateStr(new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate()));
  if (p === "Este año") return toDateStr(new Date(hoy.getFullYear(), 0, 1));
  return null;
}

export function MovHistorial({
  tropas,
  movimientos,
  onRefresh,
}: {
  tropas: TropaAPI[];
  movimientos: MovTropaAPI[];
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [busqueda, setBusqueda] = useState("");
  const [showFiltros, setShowFiltros] = useState(false);
  const [detalle, setDetalle] = useState<MovTropaAPI | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [periodoActivo, setPeriodoActivo] = useState<Periodo>("Este año");
  const [tiposActivos, setTiposActivos] = useState<TipoMov[]>([...TIPOS_MOV]);
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [tropaFiltro, setTropaFiltro] = useState("Todas");
  const [accionando, setAccionando] = useState(false);

  const hoyStr = toDateStr(new Date());
  const hace12m = toDateStr(new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()));

  /* KPIs (últimos 12 meses) */
  const ultimos12 = movimientos.filter((m) => fechaStrMov(m.fecha) >= hace12m && fechaStrMov(m.fecha) <= hoyStr);
  const cabMovidas = ultimos12.filter((m) => m.estado === "Ejecutado").reduce((s, m) => s + (m.cabezas || 0), 0);
  const porTropa: Record<string, number> = {};
  ultimos12.forEach((m) => { porTropa[m.tropaId] = (porTropa[m.tropaId] || 0) + 1; });
  const masActivaId = Object.entries(porTropa).sort((a, b) => b[1] - a[1])[0];
  const masActiva = masActivaId ? tropas.find((t) => t.id === masActivaId[0]) : null;
  const porTipo: Record<string, number> = {};
  ultimos12.forEach((m) => { const t = tipoDeMovimiento(m); porTipo[t] = (porTipo[t] || 0) + 1; });
  const tipoTop = Object.entries(porTipo).sort((a, b) => b[1] - a[1])[0];
  const ultimoEjecutado = movimientos
    .filter((m) => m.estado === "Ejecutado")
    .sort((a, b) => fechaStrMov(b.fecha).localeCompare(fechaStrMov(a.fecha)))[0];
  const diasUltimo = ultimoEjecutado
    ? Math.floor((Date.now() - dateLocalDeISO(ultimoEjecutado.fecha).getTime()) / (24 * 3600 * 1000))
    : null;

  /* Filtros */
  const desde = desdeDePeriodo(periodoActivo);
  const filtrados = useMemo(() => {
    return movimientos
      .filter((m) => {
        const f = fechaStrMov(m.fecha);
        if (desde && f < desde) return false;
        if (!tiposActivos.includes(tipoDeMovimiento(m))) return false;
        if (estadoFiltro !== "Todos" && m.estado !== estadoFiltro) return false;
        if (tropaFiltro !== "Todas" && m.tropaId !== tropaFiltro) return false;
        if (busqueda) {
          const q = busqueda.toLowerCase();
          return (
            (m.tropa?.nombre || "").toLowerCase().includes(q) ||
            (m.origenNombre || "").toLowerCase().includes(q) ||
            (m.destinoNombre || "").toLowerCase().includes(q) ||
            (m.responsable || "").toLowerCase().includes(q) ||
            (m.motivo || "").toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => (fechaStrMov(b.fecha) + (b.horario || "")).localeCompare(fechaStrMov(a.fecha) + (a.horario || "")));
  }, [movimientos, desde, tiposActivos, estadoFiltro, tropaFiltro, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const pagSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((pagSegura - 1) * porPagina, pagSegura * porPagina);

  const activeFilterCount = (tiposActivos.length < TIPOS_MOV.length ? 1 : 0) + (estadoFiltro !== "Todos" ? 1 : 0) + (tropaFiltro !== "Todas" ? 1 : 0);
  const toggleTipo = (t: TipoMov) => { setPagina(1); setTiposActivos((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t])); };
  const toggleSel = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const clearFiltros = () => { setTiposActivos([...TIPOS_MOV]); setEstadoFiltro("Todos"); setTropaFiltro("Todas"); setPagina(1); };

  const exportarCSV = (movs: MovTropaAPI[], nombre: string) => {
    const filas = [
      ["Fecha", "Hora", "Tropa", "Tipo", "Origen", "Destino", "Cabezas", "Responsable", "Estado", "Motivo", "Notas"],
      ...movs.map((m) => [
        fechaStrMov(m.fecha), m.horario || "", m.tropa?.nombre || "", tipoDeMovimiento(m), m.origenNombre || "",
        m.destinoNombre || "", String(m.cabezas || 0), m.responsable || "", m.estado, m.motivo || "", m.notas || "",
      ]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  };

  const eliminarSeleccionados = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`¿Eliminar ${selected.length} movimiento(s) del historial? Esta acción no se puede deshacer.`)) return;
    setAccionando(true);
    try {
      await Promise.all(selected.map((id) => fetch(`/api/movimientos-tropa/${id}`, { method: "DELETE" })));
      toast.show(`${selected.length} movimiento(s) eliminados`);
      setSelected([]);
      onRefresh();
    } catch {
      toast.show("No se pudieron eliminar todos los movimientos", "err");
    } finally {
      setAccionando(false);
    }
  };

  const eliminarUno = async (m: MovTropaAPI) => {
    if (!window.confirm("¿Eliminar este movimiento del historial?")) return;
    setAccionando(true);
    try {
      const r = await fetch(`/api/movimientos-tropa/${m.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.show("Movimiento eliminado");
      setDetalle(null);
      onRefresh();
    } catch {
      toast.show("No se pudo eliminar", "err");
    } finally {
      setAccionando(false);
    }
  };

  const ejecutarUno = async (m: MovTropaAPI) => {
    setAccionando(true);
    try {
      const r = await fetch(`/api/movimientos-tropa/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "ejecutar" }),
      });
      if (!r.ok) throw new Error();
      toast.show("Movimiento ejecutado");
      setDetalle(null);
      onRefresh();
    } catch {
      toast.show("No se pudo ejecutar", "err");
    } finally {
      setAccionando(false);
    }
  };

  const crearRetorno = async (m: MovTropaAPI) => {
    setAccionando(true);
    try {
      const r = await fetch("/api/movimientos-tropa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tropaId: m.tropaId,
          fecha: hoyStr,
          origenNombre: m.destinoNombre,
          destinoNombre: m.origenNombre,
          motivo: `Retorno de ${m.destinoNombre || "destino"}`,
          estado: "Planificado",
          cabezas: m.cabezas || undefined,
          responsable: m.responsable || undefined,
        }),
      });
      if (!r.ok) throw new Error();
      toast.show("Movimiento de retorno planificado para hoy");
      setDetalle(null);
      onRefresh();
    } catch {
      toast.show("No se pudo crear el retorno", "err");
    } finally {
      setAccionando(false);
    }
  };

  const EstadoBadge = ({ m }: { m: MovTropaAPI }) => {
    if (movAtrasado(m)) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, background: "#fee2e2", color: "#b91c1c", fontSize: 10, fontWeight: 700 }}>
          <Icon name="alert-circle" size={10} />Atrasado
        </span>
      );
    }
    if (m.estado === "Ejecutado") return <span style={{ padding: "2px 9px", borderRadius: 999, background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 700 }}>Completado</span>;
    if (m.estado === "En curso") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, background: "#fef3c7", color: "#d97706", fontSize: 10, fontWeight: 700 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d97706", animation: "mc-pulse 1.4s infinite" }} />En curso
        </span>
      );
    }
    if (m.estado === "Cancelado") return <span style={{ padding: "2px 9px", borderRadius: 999, background: "#f1f5f9", color: "#64748b", fontSize: 10, fontWeight: 700 }}>Cancelado</span>;
    return <span style={{ padding: "2px 9px", borderRadius: 999, background: "#eff6ff", color: "#2563eb", fontSize: 10, fontWeight: 700 }}>Planificado</span>;
  };

  const RutaChip = ({ m }: { m: MovTropaAPI }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "nowrap" }}>
      <span style={{ padding: "2px 7px", borderRadius: 5, background: "var(--mc-surface-3)", border: "1px solid var(--mc-line)", fontSize: 11, fontWeight: 600, color: "var(--mc-text-2)", whiteSpace: "nowrap" }}>{m.origenNombre || "—"}</span>
      <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>→</span>
      <span style={{ padding: "2px 7px", borderRadius: 5, background: "var(--mc-surface-3)", border: "1px solid var(--mc-line)", fontSize: 11, fontWeight: 600, color: "var(--mc-text-2)", whiteSpace: "nowrap" }}>{m.destinoNombre || "—"}</span>
    </div>
  );

  /* Relacionados: anterior y siguiente movimiento de la misma tropa */
  const relacionados = (m: MovTropaAPI) => {
    const deTropa = movimientos
      .filter((x) => x.tropaId === m.tropaId)
      .sort((a, b) => (fechaStrMov(a.fecha) + (a.horario || "")).localeCompare(fechaStrMov(b.fecha) + (b.horario || "")));
    const i = deTropa.findIndex((x) => x.id === m.id);
    return { prev: i > 0 ? deTropa[i - 1] : null, next: i >= 0 && i < deTropa.length - 1 ? deTropa[i + 1] : null };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
      {toast.node}

      {/* KPIs */}
      <div className="grid g-cols-5" style={{ gap: 10 }}>
        <KpiMovCard title="Total Registros" ico="box" val={String(ultimos12.length)} sub="en los últimos 12 meses" />
        <KpiMovCard title="Cabezas Movidas" ico="move-right" val={cabMovidas.toLocaleString("es-AR")} sub="acumulado del período" />
        <KpiMovCard title="Tropa Más Activa" ico="chart" val={masActiva ? masActiva.nombre : "—"} sub={masActivaId ? `${masActivaId[1]} mov. en 12 meses` : "sin movimientos"} />
        <KpiMovCard title="Tipo Predominante" ico="tag" val={tipoTop ? tipoTop[0] : "—"} sub={tipoTop && ultimos12.length ? `${Math.round((tipoTop[1] / ultimos12.length) * 100)}% del total` : "sin datos"} />
        <KpiMovCard
          title="Último Movimiento"
          ico="clock"
          val={diasUltimo === null ? "—" : diasUltimo === 0 ? "Hoy" : `Hace ${diasUltimo} día${diasUltimo === 1 ? "" : "s"}`}
          sub={ultimoEjecutado ? `${ultimoEjecutado.tropa?.nombre || "Tropa"} · ${ultimoEjecutado.cabezas || 0} cab.` : "sin ejecuciones"}
        />
      </div>

      {/* Barra de acciones */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Icon name="search" size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              placeholder="Buscar tropa, lote, responsable..."
              className="mc-input"
              style={{ width: 280, paddingLeft: 32, fontSize: 12 }}
            />
          </div>
          <button
            onClick={() => setShowFiltros((p) => !p)}
            className="mc-btn mc-btn--ghost mc-btn--sm"
            style={{ borderRadius: 999, background: showFiltros ? "var(--mc-surface-3)" : "transparent", fontWeight: activeFilterCount > 0 ? 700 : 500 }}
          >
            <Icon name="filter" size={12} />Filtros
            {activeFilterCount > 0 && <span style={{ marginLeft: 4, padding: "0 5px", borderRadius: 999, background: "#16a34a", color: "white", fontSize: 9, fontWeight: 800 }}>{activeFilterCount}</span>}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{filtrados.length} registro{filtrados.length === 1 ? "" : "s"} encontrado{filtrados.length === 1 ? "" : "s"}</span>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => exportarCSV(filtrados, `historial-movimientos-${hoyStr}.csv`)} disabled={filtrados.length === 0}>
            <Icon name="download" size={12} />Exportar
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFiltros && (
        <div style={{ background: "var(--mc-surface-2)", borderRadius: 12, border: "1px solid var(--mc-line)", padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Período</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {PERIODOS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPeriodoActivo(p); setPagina(1); }}
                    style={{ padding: "4px 10px", borderRadius: 999, border: `1.5px solid ${periodoActivo === p ? "#16a34a" : "var(--mc-line)"}`, background: periodoActivo === p ? "#f0fdf4" : "var(--mc-surface)", color: periodoActivo === p ? "#16a34a" : "var(--mc-text-2)", fontSize: 11, fontWeight: periodoActivo === p ? 700 : 500, cursor: "pointer" }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Tipo</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {TIPOS_MOV.map((t) => (
                  <label key={t} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 12, color: "var(--mc-ink)" }}>
                    <input type="checkbox" checked={tiposActivos.includes(t)} onChange={() => toggleTipo(t)} style={{ accentColor: "#16a34a", width: 13, height: 13 }} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Tropa</div>
              <select value={tropaFiltro} onChange={(e) => { setTropaFiltro(e.target.value); setPagina(1); }} className="mc-select" style={{ fontSize: 12, padding: "5px 10px", minWidth: 140 }}>
                <option value="Todas">Todas</option>
                {tropas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Estado</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["Todos", "Ejecutado", "Planificado", "En curso", "Cancelado"].map((e) => (
                  <button
                    key={e}
                    onClick={() => { setEstadoFiltro(e); setPagina(1); }}
                    style={{ padding: "4px 10px", borderRadius: 999, border: `1.5px solid ${estadoFiltro === e ? "#16a34a" : "var(--mc-line)"}`, background: estadoFiltro === e ? "#f0fdf4" : "var(--mc-surface)", color: estadoFiltro === e ? "#16a34a" : "var(--mc-text-2)", fontSize: 11, fontWeight: estadoFiltro === e ? 700 : 500, cursor: "pointer" }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={clearFiltros} className="mc-btn mc-btn--ghost mc-btn--sm" style={{ marginLeft: "auto", alignSelf: "flex-end", fontSize: 11 }}>Limpiar filtros</button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "13px 18px 11px", borderBottom: "1px solid var(--mc-line)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>Historial de Movimientos</div>
          <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 2 }}>
            {filtrados.length} movimiento{filtrados.length === 1 ? "" : "s"} · {filtrados.reduce((s, m) => s + (m.cabezas || 0), 0).toLocaleString("es-AR")} cabezas
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ background: "var(--mc-surface-2)" }}>
                <th style={{ width: 32, padding: "9px 10px 9px 14px", textAlign: "left" }}>
                  <input
                    type="checkbox"
                    onChange={(e) => setSelected(e.target.checked ? visibles.map((r) => r.id) : [])}
                    checked={selected.length > 0 && selected.length === visibles.length}
                    style={{ accentColor: "#16a34a", width: 13, height: 13 }}
                  />
                </th>
                {["FECHA", "TROPA", "TIPO", "RUTA", "CAB.", "RESP.", "ESTADO", ""].map((h) => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: h === "CAB." ? "right" : "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", whiteSpace: "nowrap", borderBottom: "1px solid var(--mc-line)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "48px 0", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--mc-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="search" size={18} style={{ color: "var(--mc-text-3)" }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>Sin resultados</div>
                      <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>
                        {movimientos.length === 0 ? "Todavía no hay movimientos registrados." : "No hay registros que coincidan con los filtros activos."}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {visibles.map((r) => {
                const active = detalle?.id === r.id;
                const tipo = tipoDeMovimiento(r);
                const ts = TIPO_STYLE[tipo];
                const av = r.responsable ? avatarDe(r.responsable) : null;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setDetalle(active ? null : r)}
                    style={{ cursor: "pointer", background: active ? "#f0fdf4" : "transparent", borderLeft: active ? "3px solid #16a34a" : "3px solid transparent", transition: "background .1s", borderBottom: "1px solid var(--mc-line)" }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--mc-surface-2)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "10px 10px 10px 14px" }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSel(r.id)} style={{ accentColor: "#16a34a", width: 13, height: 13 }} />
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>{fmtFechaLarga(dateLocalDeISO(r.fecha))}</div>
                      <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>{r.horario ? `${r.horario} hs` : "—"}</div>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mc-ink)" }}>{r.tropa?.nombre || "—"}</div>
                      <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>{r.tropa?.categoria || ""}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "2px 9px", borderRadius: 999, background: ts.bg, color: ts.color, fontSize: 10, fontWeight: 700 }}>{tipo}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}><RutaChip m={r} /></td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--mc-ink)" }}>{r.cabezas || 0}</span>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {r.responsable ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: av!.bg, color: av!.clr, fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials(r.responsable)}</div>
                          <span style={{ fontSize: 11, color: "var(--mc-ink)" }}>{r.responsable}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}><EstadoBadge m={r} /></td>
                    <td style={{ padding: "10px 12px" }} onClick={(e) => e.stopPropagation()}>
                      <button className="mc-icon-btn" title="Ver detalle" onClick={() => setDetalle(active ? null : r)}><Icon name="eye" size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Footer paginación */}
        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>Mostrando {visibles.length} de {filtrados.length} registros</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagSegura <= 1} className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 8px" }}>
              <Icon name="chevron-left" size={12} />Ant.
            </button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const n = pagSegura <= 3 ? i + 1 : Math.min(totalPaginas - 4, pagSegura - 2) + i;
              if (n < 1 || n > totalPaginas) return null;
              return (
                <button key={n} onClick={() => setPagina(n)} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: pagSegura === n ? "#16a34a" : "transparent", color: pagSegura === n ? "white" : "var(--mc-text-2)" }}>
                  {n}
                </button>
              );
            })}
            {totalPaginas > 5 && <span style={{ fontSize: 12, color: "var(--mc-text-3)" }}>… {totalPaginas}</span>}
            <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagSegura >= totalPaginas} className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 8px" }}>
              Sig.<Icon name="chevron-right" size={12} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--mc-text-3)" }}>
            Filas por página:
            <select className="mc-select" style={{ fontSize: 11, padding: "3px 6px", width: 64 }} value={porPagina} onChange={(e) => { setPorPagina(parseInt(e.target.value)); setPagina(1); }}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {detalle && (() => {
        const tipo = tipoDeMovimiento(detalle);
        const ts = TIPO_STYLE[tipo];
        const rel = relacionados(detalle);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,12,.5)", zIndex: 8000, display: "grid", placeItems: "center" }} onClick={() => setDetalle(null)}>
            <div style={{ width: 640, maxWidth: "93vw", maxHeight: "86vh", background: "var(--mc-surface)", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,.3)", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0, background: "linear-gradient(135deg,#f0fdf4 0%,var(--mc-surface) 60%)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: ts.bg, color: ts.color }}>{tipo}</span>
                      <EstadoBadge m={detalle} />
                      {detalle.rutina && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-text-2)" }}>{detalle.rutina.nombre}</span>}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--mc-ink)", letterSpacing: "-.01em", marginBottom: 3 }}>{detalle.tropa?.nombre || "Tropa"}</div>
                    <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>
                      {fmtFechaLarga(dateLocalDeISO(detalle.fecha))}{detalle.horario ? ` · ${detalle.horario} hs` : ""} · {detalle.origenNombre || "—"} → {detalle.destinoNombre || "—"}
                    </div>
                  </div>
                  <button onClick={() => setDetalle(null)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>
                    <Icon name="x" size={13} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                {/* Mini stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { val: `${detalle.cabezas || 0} cab.`, lbl: "Cabezas" },
                    { val: detalle.tropa?.nombre || "—", lbl: "Tropa" },
                    { val: detalle.duracionMin ? `${detalle.duracionMin} min` : "—", lbl: "Duración est." },
                    { val: detalle.responsable || "—", lbl: "Responsable" },
                    { val: detalle.origenNombre || "—", lbl: "Origen" },
                    { val: detalle.destinoNombre || "—", lbl: "Destino" },
                  ].map(({ val, lbl }) => (
                    <div key={lbl} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--mc-surface-2)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{val}</div>
                      <div style={{ fontSize: 10, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>{lbl}</div>
                    </div>
                  ))}
                </div>

                {/* Ruta visual */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Ruta</div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto" }}>
                    {[detalle.origenNombre || "Origen", detalle.destinoNombre || "Destino"].map((nodo, i, arr) => (
                      <React.Fragment key={i}>
                        <div style={{ textAlign: "center", minWidth: 80 }}>
                          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#16a34a", border: "2px solid var(--mc-surface)", boxShadow: "0 0 0 2px #16a34a", margin: "0 auto 6px" }} />
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 2 }}>{nodo}</div>
                          <div style={{ fontSize: 9, color: "var(--mc-text-3)" }}>{i === 0 ? "Origen" : "Destino final"}</div>
                          {i === 0 && detalle.horario && <div style={{ fontSize: 9, color: "var(--mc-text-3)", marginTop: 1 }}>Salida: {detalle.horario}</div>}
                          {i === arr.length - 1 && detalle.duracionMin && <div style={{ fontSize: 9, color: "var(--mc-text-3)", marginTop: 1 }}>Llegada: +{detalle.duracionMin} min</div>}
                        </div>
                        {i < arr.length - 1 && (
                          <div style={{ flex: 1, display: "flex", alignItems: "center", paddingTop: 6, minWidth: 30 }}>
                            <div style={{ flex: 1, height: 1.5, background: "#16a34a", opacity: 0.4 }} />
                            <span style={{ fontSize: 12, color: "var(--mc-text-3)" }}>→</span>
                            <div style={{ flex: 1, height: 1.5, background: "#16a34a", opacity: 0.4 }} />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  {detalle.distanciaKm && <div style={{ fontSize: 11, color: "var(--mc-text-3)", textAlign: "center", marginTop: 6 }}>{detalle.distanciaKm} km estimados</div>}
                  {detalle.motivo && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Motivo</div>
                      <div style={{ fontSize: 12, color: "var(--mc-ink)" }}>{detalle.motivo}</div>
                    </div>
                  )}
                  {detalle.notas && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Notas</div>
                      <div style={{ fontSize: 12, color: "var(--mc-text-2)", background: "var(--mc-surface-2)", borderRadius: 8, padding: "8px 10px" }}>{detalle.notas}</div>
                    </div>
                  )}
                </div>

                {/* Relacionados */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Movimientos Relacionados de la Tropa</div>
                  {!rel.prev && !rel.next && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin otros movimientos registrados para esta tropa.</div>}
                  {([["←", rel.prev], ["→", rel.next]] as const).map(([dir, m]) =>
                    m ? (
                      <div
                        key={dir}
                        onClick={() => setDetalle(m)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--mc-line)", marginBottom: 6, cursor: "pointer", transition: "background .1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mc-surface-2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ fontSize: 14, color: "#94a3b8", flexShrink: 0 }}>{dir}</span>
                        <span style={{ fontSize: 11, color: "var(--mc-ink)" }}>
                          {fmtFechaLarga(dateLocalDeISO(m.fecha))} · {m.origenNombre || "?"} → {m.destinoNombre || "?"} · {m.cabezas || 0} cab. · {m.estado}
                        </span>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "12px 20px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                {detalle.estado === "Planificado" && (
                  <button className="mc-btn mc-btn--sm" style={{ flex: 1, justifyContent: "center", border: "1.5px solid #16a34a", color: "#16a34a", background: "transparent", fontSize: 11 }} disabled={accionando} onClick={() => ejecutarUno(detalle)}>
                    <Icon name="check" size={12} />Marcar Ejecutado
                  </button>
                )}
                <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ flex: 1, justifyContent: "center", color: "var(--mc-red)" }} disabled={accionando} onClick={() => eliminarUno(detalle)}>
                  <Icon name="trash" size={12} />Eliminar
                </button>
                {detalle.estado === "Ejecutado" && (
                  <button className="mc-btn mc-btn--sm" style={{ flex: 2, justifyContent: "center", border: "1.5px solid #16a34a", color: "#16a34a", background: "transparent", fontSize: 11 }} disabled={accionando} onClick={() => crearRetorno(detalle)}>
                    Crear retorno
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Barra de selección múltiple */}
      {selected.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,.92)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, zIndex: 9000, boxShadow: "0 8px 32px rgba(0,0,0,.25)" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>
            {selected.length} {selected.length === 1 ? "fila seleccionada" : "filas seleccionadas"}
          </span>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ color: "white", border: "1px solid rgba(255,255,255,.3)" }} onClick={() => exportarCSV(filtrados.filter((m) => selected.includes(m.id)), `movimientos-seleccion-${hoyStr}.csv`)}>
            <Icon name="download" size={12} />Exportar
          </button>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ color: "#fca5a5", border: "1px solid rgba(252,165,165,.3)" }} disabled={accionando} onClick={eliminarSeleccionados}>
            <Icon name="trash" size={12} />Eliminar
          </button>
          <button onClick={() => setSelected([])} style={{ background: "none", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", lineHeight: 1 }}><Icon name="x" size={16} /></button>
        </div>
      )}
    </div>
  );
}
