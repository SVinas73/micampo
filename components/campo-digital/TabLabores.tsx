"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, KPI, Modal, Field, useToast } from "@/components/mc";
import { useLoteScope } from "@/components/LoteScope";
import { NuevaOrdenLaborModal, type OrdenLabor } from "./labores-Wizard";

/* ============ Tipos y datos demo (Figma) ============ */
type LaborUI = {
  id: string;
  dbId?: string;
  tarea: string;
  tipo: string;
  lote: string;
  loteId?: string;
  cultivo: string;
  responsable: string;
  fecha: string; // dd/MM
  fechaISO: string;
  prioridad: "alta" | "media" | "baja";
  estado: string; // Programada | Hoy | En curso | Pausada | Atrasada | Completada
  motivoBloqueo?: string;
};

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
function iso(d: number) {
  const f = new Date();
  f.setDate(f.getDate() + d);
  return f.toISOString().slice(0, 10);
}
function corta(d: number) {
  const f = new Date();
  f.setDate(f.getDate() + d);
  return `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}`;
}
function hoyCorta() {
  return corta(0);
}

// Estados de ciclo de vida que NO dependen de la fecha (los fija el usuario).
const ESTADOS_FIJOS = ["Completada", "En curso", "Pausada"];

/** Estado según la fecha para una tarea abierta: vencida→Atrasada, hoy→Hoy, futura→Programada. */
function estadoPorFecha(fechaISO: string): string {
  const solo = (fechaISO || "").slice(0, 10);
  const hoy = hoyISO();
  if (!solo) return "Programada";
  return solo < hoy ? "Atrasada" : solo === hoy ? "Hoy" : "Programada";
}

/**
 * Deriva el estado a mostrar: respeta los estados de ciclo (Completada / En curso /
 * Pausada) y recalcula el resto por fecha. Así una tarea "Programada" cuya fecha ya
 * pasó se muestra como "Atrasada" (y no queda "Programada" en el pasado).
 */
function derivarEstado(estadoGuardado: string | undefined, fechaISO: string): string {
  if (estadoGuardado && ESTADOS_FIJOS.includes(estadoGuardado)) return estadoGuardado;
  if (estadoGuardado === "Bloqueada") return "Atrasada";
  return estadoPorFecha(fechaISO);
}

const TIPO_ICON: Record<string, { icon: string; color: string }> = {
  Pulverización: { icon: "flask", color: "#2c7ad9" },
  Siembra: { icon: "sprout", color: "#768f44" },
  Riego: { icon: "droplet", color: "#3aa6d9" },
  Cosecha: { icon: "wrench", color: "#d9a538" },
  Fertilización: { icon: "leaf", color: "#8a6d3b" },
  Monitoreo: { icon: "eye", color: "#475569" },
};

/* ========== TAB LABORES (Figma CDLabores) ========== */
export default function TabLabores() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lotes: scopeLotes, loteActivo, establecimientoId, loteId } = useLoteScope();
  const [laboresRaw, setLabores] = useState<LaborUI[]>([]);
  // Filtra las labores por el lote activo del alcance global
  const labores = useMemo(
    () => (loteActivo ? laboresRaw.filter((l) => l.loteId === loteActivo.id) : laboresRaw),
    [laboresRaw, loteActivo]
  );
  const [lotes, setLotes] = useState<{ id?: string; nombre: string; ha: number; tag?: string }[]>([]);
  const [view, setView] = useState<"kanban" | "tabla" | "calendario">("kanban");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [preselectLoteId, setPreselectLoteId] = useState<string | undefined>(undefined);
  const [calDate, setCalDate] = useState(() => new Date());
  const [dragId, setDragId] = useState<string | null>(null);
  const [reportar, setReportar] = useState<LaborUI | null>(null);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [reprogramar, setReprogramar] = useState<LaborUI | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState(hoyISO());
  const [verDetalle, setVerDetalle] = useState<LaborUI | { titulo: string; lote: string; detalle: string } | null>(null);
  const [filtroOpen, setFiltroOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [cronos, setCronos] = useState<Record<string, number>>({});

  /* Cronómetro de tareas en curso */
  useEffect(() => {
    const t = setInterval(() => {
      setCronos((prev) => {
        const next = { ...prev };
        labores.filter((l) => l.estado === "En curso").forEach((l) => {
          next[l.id] = (next[l.id] || 0) + 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [labores]);

  useEffect(() => {
    // Respeta el alcance Campo → Lote del sidebar (el endpoint filtra por él).
    const params = new URLSearchParams();
    if (establecimientoId && establecimientoId !== "todos") params.set("establecimientoId", establecimientoId);
    if (loteId && loteId !== "todos") params.set("loteId", loteId);
    const q = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/labores${q}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d)) return;
        setLabores(
          d.map((l: { id: string; tipo: string; descripcion?: string; fecha: string; estado?: string; prioridad?: string; operarios?: string; loteId?: string; lote?: { nombre: string; cultivo?: string | null }; motivoBloqueo?: string }) => {
            // Fecha en UTC (la fecha se guarda a medianoche UTC): evita el corrimiento de un día.
            const iso = l.fecha.slice(0, 10);
            const [, mm, dd] = iso.split("-");
            return {
              id: l.id, dbId: l.id, tarea: l.descripcion || l.tipo, tipo: l.tipo,
              lote: l.lote?.nombre || "—", loteId: l.loteId, cultivo: l.lote?.cultivo || "—",
              responsable: l.operarios || "Equipo",
              fecha: `${dd}/${mm}`,
              fechaISO: iso,
              prioridad: (l.prioridad === "Urgente" || l.prioridad === "Alta" ? "alta" : l.prioridad === "Baja" ? "baja" : "media") as "alta" | "media" | "baja",
              estado: derivarEstado(l.estado, l.fecha),
              motivoBloqueo: l.motivoBloqueo || undefined,
            };
          })
        );
      })
      .catch(() => {});
  }, [establecimientoId, loteId]);

  // Lotes para el dropdown — del alcance global
  useEffect(() => {
    if (scopeLotes.length > 0) setLotes(scopeLotes.map((l) => ({ id: l.id, nombre: l.nombre, ha: l.hectareas || 0, tag: l.cultivo || "Disponible" })));
  }, [scopeLotes]);

  // Abre el wizard "Nueva Labor" cuando se llega con ?nuevaLabor=<loteId|1>
  // (desde los botones "Nueva Tarea" de los lotes). Limpia el param al abrir.
  useEffect(() => {
    const nl = searchParams.get("nuevaLabor");
    if (!nl) return;
    setPreselectLoteId(nl !== "1" ? nl : undefined);
    setWizardOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("nuevaLabor");
    router.replace(`/campo-digital?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const patchLabor = async (l: LaborUI, cambios: Record<string, unknown>, msg: string) => {
    if (l.dbId) {
      const res = await fetch(`/api/labores/${l.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      }).catch(() => null);
      if (!res || !res.ok) { toast.show("No se pudo actualizar la labor", "err"); return; }
    }
    setLabores((prev) =>
      prev.map((x) => {
        if (x.id !== l.id) return x;
        const next = { ...x, ...(cambios as Partial<LaborUI>) };
        if (typeof cambios.fecha === "string") {
          const f = new Date((cambios.fecha as string) + "T12:00:00");
          next.fecha = `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}`;
          next.fechaISO = cambios.fecha as string;
        }
        if (cambios.motivoBloqueo === null) next.motivoBloqueo = undefined;
        return next;
      })
    );
    toast.show(msg);
  };

  const emitirOrden = async (orden: OrdenLabor) => {
    // Una labor por CADA lote seleccionado con id real (el wizard permite multi-lote).
    const conId = orden.lotes.filter((l) => l.id);
    if (conId.length === 0) { toast.show("Elegí al menos un lote guardado para emitir la orden", "err"); return; }
    const params = Object.entries(orden.parametros).map(([k, v]) => `${k.split(" (")[0]}: ${v}`).join(", ");
    const obs = `Operario: ${orden.operario} · ${orden.tractor} + ${orden.implemento} · Insumos: ${orden.insumos.map((i) => `${i.nombre} ${i.dosis} ${i.unidad}`).join(", ") || "—"}${params ? ` · Parámetros: ${params}` : ""} · Costo est: $${orden.costoTotal} USD`;
    // El costo total de la orden se reparte entre los lotes por hectáreas, para que
    // cada labor persista su parte como CostoLote (se propaga a Costos/Economía).
    const totalHa = conId.reduce((s, l) => s + (l.ha || 0), 0);
    try {
      const creadas: LaborUI[] = [];
      for (const lote of conId) {
        const costoLote = totalHa > 0 ? Math.round((orden.costoTotal * (lote.ha || 0)) / totalHa) : Math.round(orden.costoTotal / conId.length);
        const res = await fetch("/api/labores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: orden.actividad, fecha: hoyISO(), loteId: lote.id,
            superficieTrabajada: lote.ha || 0, descripcion: orden.actividad,
            observaciones: obs, prioridad: orden.prioridad, operarios: orden.operario,
            costoTotal: costoLote,
            // Maquinaria real (prorratea su costo al lote) y productos reales (descuentan stock).
            maquinaId: orden.maquinaId,
            productos: (orden.productos || []).map((p) => ({
              productoId: p.productoId, ubicacionId: p.ubicacionId,
              tipoProducto: p.tipoProducto, nombreProducto: p.nombreProducto,
              dosis: p.dosis, unidadDosis: p.unidadDosis,
            })),
          }),
        });
        if (!res.ok) continue;
        const d = await res.json();
        creadas.push({
          id: d.id, dbId: d.id, tarea: orden.actividad, tipo: orden.actividad,
          lote: lote.nombre || "—", loteId: lote.id, cultivo: "—",
          responsable: orden.operario, fecha: hoyCorta(), fechaISO: hoyISO(),
          prioridad: orden.prioridad === "Urgente" ? "alta" : "media", estado: "Hoy",
        });
      }
      if (creadas.length === 0) { toast.show("No se pudo emitir la orden", "err"); return; }
      setLabores((prev) => [...creadas, ...prev]);
      toast.show(`Orden "${orden.actividad}" emitida para ${creadas.length} lote(s)`);
      setWizardOpen(false);
    } catch {
      toast.show("No se pudo emitir la orden", "err");
    }
  };

  const visibles = useMemo(
    () => labores.filter((l) => filtroTipo === "Todos" || l.tipo === filtroTipo),
    [labores, filtroTipo]
  );
  const tareasHoy = labores.filter((l) => ["Hoy", "En curso", "Pausada"].includes(l.estado)).slice(0, 4);
  const completadasTotal = labores.filter((l) => l.estado === "Completada").length;
  // "Completados este mes" cuenta solo las del mes calendario actual.
  const mesActualISO = new Date().toISOString().slice(0, 7);
  const completadasMes = labores.filter((l) => l.estado === "Completada" && (l.fechaISO || "").slice(0, 7) === mesActualISO).length;
  const atrasadas = labores.filter((l) => l.estado === "Atrasada");
  const pctCompletadas = labores.length ? Math.round((completadasTotal / labores.length) * 100) : 0;
  // Deltas reales (sin números inventados)
  const enCursoN = labores.filter((l) => l.estado === "En curso").length;
  const paraHoyN = labores.filter((l) => l.estado === "Hoy").length;
  const mesActual = new Date().toLocaleDateString("es-AR", { month: "long" });

  const fmtCrono = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const colsKanban = [
    { key: "Programada", title: "Programadas", color: "var(--mc-text-3)" },
    { key: "Hoy", title: "Hoy / En curso", color: "var(--mc-green-600)" },
    { key: "Atrasada", title: "Atrasadas", color: "var(--mc-red)" },
    { key: "Completada", title: "Completadas", color: "var(--mc-green-700)" },
  ];
  const itemsCol = (key: string) =>
    key === "Hoy"
      ? visibles.filter((l) => ["Hoy", "En curso", "Pausada"].includes(l.estado))
      : visibles.filter((l) => l.estado === key);

  return (
    <>
      {toast.node}
      {wizardOpen && (
        <NuevaOrdenLaborModal
          lotesDisponibles={lotes}
          preselectLoteId={preselectLoteId}
          onClose={() => { setWizardOpen(false); setPreselectLoteId(undefined); }}
          onEmitir={emitirOrden}
          onBorrador={(o) => {
            try {
              localStorage.setItem("micampo:labor-borrador", JSON.stringify(o));
            } catch {}
            toast.show("Borrador guardado");
            setWizardOpen(false);
            setPreselectLoteId(undefined);
          }}
        />
      )}

      <div className="grid g-cols-5">
        <KPI label="Programadas" value={String(labores.filter((l) => l.estado === "Programada").length)} delta={`${paraHoyN} para hoy`} trend="up" icon="calendar" accent />
        <KPI label="Pendientes" value={String(labores.filter((l) => !["Completada"].includes(l.estado)).length)} delta={`${enCursoN} en curso`} trend="up" icon="wrench" />
        <KPI label="Atrasadas" value={String(atrasadas.length)} delta={atrasadas.slice(0, 2).map((l) => (l.lote || "").split(" - ")[0]).filter(Boolean).join(" + ") || "Ninguna"} trend="warn" icon="alert" warn />
        <KPI label="% Completadas" value={`${pctCompletadas}%`} delta={`${completadasTotal}/${labores.length} labores`} trend="up" icon="check" />
        <KPI label="Completados este mes" value={String(completadasMes)} delta={mesActual} trend="up" icon="activity" />
      </div>

      <div className="row gap-8" style={{ justifyContent: "space-between", flexWrap: "wrap", position: "relative" }}>
        <div className="mc-seg">
          <button className={view === "kanban" ? "is-on" : ""} onClick={() => setView("kanban")}><Icon name="grid" size={13} />Kanban</button>
          <button className={view === "tabla" ? "is-on" : ""} onClick={() => setView("tabla")}><Icon name="list" size={13} />Tabla</button>
          <button className={view === "calendario" ? "is-on" : ""} onClick={() => setView("calendario")}><Icon name="calendar" size={13} />Calendario</button>
        </div>
        <div className="row gap-8">
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setFiltroOpen(!filtroOpen)}>
            <Icon name="filter" size={13} />Filtros
          </button>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setWizardOpen(true)}>
            <Icon name="plus" size={13} />Nueva labor
          </button>
          {filtroOpen && (
            <>
              <div onClick={() => setFiltroOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
              <div style={{ position: "absolute", top: "100%", right: 120, marginTop: 6, zIndex: 51, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 10, boxShadow: "var(--sh-lg)", padding: 10, width: 200 }}>
                {["Todos", "Pulverización", "Siembra", "Riego", "Cosecha", "Fertilización"].map((t) => (
                  <button key={t} className="mc-btn mc-btn--ghost mc-btn--sm mc-btn--block" style={{ justifyContent: "flex-start", background: filtroTipo === t ? "var(--mc-green-50)" : undefined }} onClick={() => { setFiltroTipo(t); setFiltroOpen(false); }}>
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tareas para hoy + Labores bloqueados (Figma) */}
      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Tareas para Hoy</div>
            <span className="mc-badge mc-badge--green">{tareasHoy.length} activas</span>
          </div>
          <div className="col gap-10">
            {tareasHoy.map((l) => {
              const ti = TIPO_ICON[l.tipo] || { icon: "wrench", color: "#475569" };
              const enCurso = l.estado === "En curso";
              return (
                <div key={l.id} style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10, display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: ti.color, color: "white", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                    <Icon name={ti.icon} size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>{l.tarea}</div>
                    <div className="text-xs text-muted">{l.lote}</div>
                  </div>
                  <div className="row gap-6" style={{ alignItems: "center", fontSize: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#5E8F78", color: "white", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>
                      {(l.responsable || "—").split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "—"}
                    </div>
                    <div>
                      <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 12 }}>{l.responsable}</div>
                      <div className="text-xs text-muted">{l.cultivo && l.cultivo !== "—" ? l.cultivo : l.tipo}</div>
                    </div>
                  </div>
                  <div className="col gap-4" style={{ alignItems: "stretch" }}>
                    {enCurso && (
                      <div className="row gap-4" style={{ alignItems: "center", fontSize: 11, color: "var(--mc-green-700)", fontWeight: 600, fontFamily: "var(--ff-mono)" }}>
                        <Icon name="activity" size={11} />{fmtCrono(cronos[l.id] || 0)}
                      </div>
                    )}
                    <div className="row gap-4">
                      {enCurso ? (
                        <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => patchLabor(l, { estado: "Pausada" }, `${l.tarea} pausada`)}>
                          <Icon name="x" size={10} />Pausar
                        </button>
                      ) : (
                        <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => patchLabor(l, { estado: "En curso" }, `${l.tarea} iniciada`)}>
                          <Icon name="arrowRight" size={10} />Iniciar
                        </button>
                      )}
                      {enCurso && (
                        <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => patchLabor(l, { estado: "Completada" }, `${l.tarea} completada`)}>
                          <Icon name="check" size={10} />Finalizar
                        </button>
                      )}
                      <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => setVerDetalle(l)}>
                        <Icon name="eye" size={10} />Ver
                      </button>
                    </div>
                    <button className="mc-btn mc-btn--sm" style={{ background: "#c08a22", color: "white", padding: "4px 8px", fontSize: 11 }} onClick={() => { setReportar(l); setMotivoReporte(""); }}>
                      <Icon name="alert" size={10} />Reportar
                    </button>
                  </div>
                </div>
              );
            })}
            {tareasHoy.length === 0 && <div className="text-sm text-muted">No hay tareas activas para hoy.</div>}
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Labores Bloqueados / Alertas</div>
            <span className="mc-badge mc-badge--red">{labores.filter((l) => l.motivoBloqueo).length}</span>
          </div>
          <div className="col gap-10">
            {[
              ...labores.filter((l) => l.motivoBloqueo).map((l) => ({
                icon: TIPO_ICON[l.tipo]?.icon || "wrench", iconColor: TIPO_ICON[l.tipo]?.color || "#475569",
                titulo: l.tarea, lote: l.lote, alertaIcon: "alert", alertaTitulo: l.motivoBloqueo as string, alertaSub: "Reportado por el equipo", accion: "Reprogramar", labor: l as LaborUI | undefined,
              })),
            ].map((b, i) => (
              <div key={i} style={{ padding: 10, border: "1px solid var(--mc-line)", borderRadius: 10, display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: b.iconColor, color: "white", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                  <Icon name={b.icon} size={17} />
                </div>
                <div style={{ flex: "0 0 auto", minWidth: 100 }}>
                  <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13 }}>{b.titulo}</div>
                  <div className="text-xs text-muted">{b.lote}</div>
                </div>
                <div style={{ flex: 1, padding: "6px 10px", background: b.accion === "Solicitar" ? "var(--mc-amber-bg)" : "var(--mc-red-bg)", borderRadius: 8, minWidth: 0 }}>
                  <div className="row gap-4" style={{ alignItems: "center", fontSize: 12 }}>
                    <Icon name={b.alertaIcon} size={11} style={{ color: b.accion === "Solicitar" ? "var(--mc-amber)" : "var(--mc-red)" }} />
                    <span className="font-semi" style={{ color: b.accion === "Solicitar" ? "var(--mc-amber)" : "var(--mc-red)" }}>{b.alertaTitulo}</span>
                  </div>
                  <div className="text-xs" style={{ color: b.accion === "Solicitar" ? "var(--mc-amber)" : "var(--mc-red)", opacity: 0.8 }}>{b.alertaSub}</div>
                </div>
                <button
                  className="mc-btn mc-btn--secondary mc-btn--sm"
                  style={{ padding: "4px 10px", fontSize: 11, flex: "0 0 auto" }}
                  onClick={() => {
                    if (b.accion === "Reprogramar") {
                      setReprogramar(b.labor || labores.find((l) => l.tarea === b.titulo) || null);
                      setNuevaFecha(iso(2));
                    } else if (b.accion === "Solicitar") {
                      router.push("/logistica-inventario");
                    } else {
                      setVerDetalle({ titulo: b.titulo, lote: b.lote, detalle: `${b.alertaTitulo} — ${b.alertaSub}` });
                    }
                  }}
                >
                  <Icon name={b.accion === "Reprogramar" ? "calendar" : b.accion === "Solicitar" ? "box" : "arrowRight"} size={11} />
                  {b.accion}
                </button>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted mt-8" style={{ fontStyle: "italic" }}>
            * Estas tareas van de la mano con las Pausadas y Reportadas del bloque superior
          </div>
        </div>
      </div>

      {/* Vista Kanban con drag & drop */}
      {view === "kanban" && (
        <div className="grid g-cols-4 gap-12">
          {colsKanban.map((col) => {
            const items = itemsCol(col.key);
            return (
              <div
                key={col.key}
                className="mc-card"
                style={{ background: "var(--mc-surface-2)", padding: 12, minHeight: 400 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!dragId) return;
                  const l = labores.find((x) => x.id === dragId);
                  if (l) patchLabor(l, { estado: col.key === "Hoy" ? "Hoy" : col.key }, `"${l.tarea}" movida a ${col.title}`);
                  setDragId(null);
                }}
              >
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                  <div className="row gap-8">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }}></span>
                    <span className="font-semi" style={{ color: "var(--mc-ink)" }}>{col.title}</span>
                  </div>
                  <span className="mc-badge mc-badge--neutral">{items.length}</span>
                </div>
                <div className="col gap-8">
                  {items.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      style={{ background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 10, padding: 12, opacity: l.estado === "Completada" ? 0.7 : 1, cursor: "grab" }}
                    >
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        {l.estado === "Completada" ? (
                          <span className="mc-badge mc-badge--green"><Icon name="check" size={10} />Completada</span>
                        ) : (
                          <span className={`mc-badge mc-badge--${l.prioridad === "alta" ? "red" : l.prioridad === "media" ? "amber" : "neutral"}`} style={{ textTransform: "uppercase", fontSize: 10 }}>{l.prioridad}</span>
                        )}
                        <button className="mc-icon-btn" style={{ width: 22, height: 22, border: "none" }} onClick={() => setVerDetalle(l)}>
                          <Icon name="more" size={12} />
                        </button>
                      </div>
                      <div className="font-semi mt-8" style={{ color: "var(--mc-ink)", fontSize: 13.5 }}>{l.tarea}</div>
                      <div className="text-xs text-muted mt-4">{l.lote} · {l.cultivo}</div>
                      <div className="mc-divider" style={{ margin: "8px 0" }}></div>
                      <div className="row" style={{ justifyContent: "space-between", fontSize: 11.5 }}>
                        <span className="text-muted">{l.responsable}</span>
                        <span className="font-mono font-semi" style={{ color: "var(--mc-ink)" }}>{l.fecha}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista Tabla */}
      {view === "tabla" && (
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="mc-table">
            <thead>
              <tr><th>Tarea</th><th>Lote</th><th>Cultivo</th><th>Responsable</th><th>Fecha</th><th>Prioridad</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {visibles.map((l) => (
                <tr key={l.id}>
                  <td className="mc-cell--emph">{l.tarea}</td>
                  <td>{l.lote}</td>
                  <td>{l.cultivo}</td>
                  <td>{l.responsable}</td>
                  <td className="mc-cell--mono">{l.fecha}</td>
                  <td><span className={`mc-badge mc-badge--${l.prioridad === "alta" ? "red" : l.prioridad === "media" ? "amber" : "neutral"}`}>{l.prioridad}</span></td>
                  <td>
                    <span className={`mc-badge mc-badge--${l.estado === "Atrasada" ? "red" : ["Hoy", "En curso"].includes(l.estado) ? "green" : "neutral"}`}>
                      <span className="mc-badge__dot"></span>{l.estado}
                    </span>
                  </td>
                  <td>
                    <div className="row gap-4">
                      <button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none" }} title="Reprogramar" onClick={() => { setReprogramar(l); setNuevaFecha(l.fechaISO); }}>
                        <Icon name="calendar" size={13} />
                      </button>
                      <button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none" }} title="Completar" onClick={() => patchLabor(l, { estado: "Completada" }, `"${l.tarea}" completada`)}>
                        <Icon name="check" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista Calendario */}
      {view === "calendario" && (
        <CalendarioMes
          date={calDate}
          onPrev={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
          onNext={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
          labores={visibles}
        />
      )}

      {/* Modal Reportar */}
      <Modal
        open={!!reportar}
        onClose={() => setReportar(null)}
        title={`Reportar problema — ${reportar?.tarea || ""}`}
        subtitle="La labor se marcará como bloqueada y aparecerá en el panel de alertas."
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setReportar(null)}>Cancelar</button>
            <button
              className="mc-btn"
              style={{ background: "#c08a22", color: "white" }}
              onClick={() => {
                if (reportar) patchLabor(reportar, { estado: "Pausada", motivoBloqueo: motivoReporte || "Problema reportado en campo" }, "Labor reportada y bloqueada");
                setReportar(null);
              }}
            >
              <Icon name="alert" size={13} />Reportar
            </button>
          </>
        }
      >
        <Field label="Motivo del reporte">
          <textarea className="mc-textarea" placeholder="Ej: Viento por encima del umbral / falla de maquinaria / falta de insumo..." value={motivoReporte} onChange={(e) => setMotivoReporte(e.target.value)} />
        </Field>
      </Modal>

      {/* Modal Reprogramar */}
      <Modal
        open={!!reprogramar}
        onClose={() => setReprogramar(null)}
        title={`Reprogramar — ${reprogramar?.tarea || ""}`}
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setReprogramar(null)}>Cancelar</button>
            <button
              className="mc-btn mc-btn--primary"
              onClick={() => {
                if (reprogramar) patchLabor(reprogramar, { fecha: nuevaFecha, estado: estadoPorFecha(nuevaFecha), motivoBloqueo: null }, `"${reprogramar.tarea}" reprogramada`);
                setReprogramar(null);
              }}
            >
              <Icon name="calendar" size={13} />Reprogramar
            </button>
          </>
        }
      >
        <Field label="Nueva fecha">
          <input type="date" className="mc-input" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
        </Field>
      </Modal>

      {/* Modal Ver detalle */}
      <Modal
        open={!!verDetalle}
        onClose={() => setVerDetalle(null)}
        title={verDetalle && "tarea" in verDetalle ? verDetalle.tarea : verDetalle?.titulo || ""}
        footer={<button className="mc-btn mc-btn--secondary" onClick={() => setVerDetalle(null)}>Cerrar</button>}
      >
        {verDetalle && "tarea" in verDetalle ? (
          <div className="col gap-8 text-sm">
            <div><b>Lote:</b> {verDetalle.lote}</div>
            <div><b>Tipo:</b> {verDetalle.tipo}</div>
            <div><b>Responsable:</b> {verDetalle.responsable}</div>
            <div><b>Fecha:</b> {verDetalle.fecha}</div>
            <div><b>Estado:</b> {verDetalle.estado}</div>
            {verDetalle.motivoBloqueo && <div style={{ color: "var(--mc-red)" }}><b>Bloqueo:</b> {verDetalle.motivoBloqueo}</div>}
          </div>
        ) : (
          <div className="col gap-8 text-sm">
            <div><b>Lote:</b> {verDetalle?.lote}</div>
            <div style={{ color: "var(--mc-red)" }}>{verDetalle?.detalle}</div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ========== Calendario mensual (Figma) ========== */
function CalendarioMes({
  date, onPrev, onNext, labores,
}: {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  labores: LaborUI[];
}) {
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  // Offset del 1° según su día de semana (semana LUN-first) para alinear la grilla.
  const offsetInicio = (new Date(year, month, 1).getDay() + 6) % 7;
  const hoy = new Date();
  const COLORES: Record<string, string> = {
    Pulverización: "var(--mc-orange-500)", Siembra: "var(--mc-green-500)", Riego: "var(--mc-blue)",
    Cosecha: "var(--mc-amber)", Fertilización: "var(--mc-red)", Monitoreo: "var(--mc-green-700)",
  };
  const eventos: Record<number, { t: string; c: string }[]> = {};
  labores.forEach((l) => {
    const f = new Date(l.fechaISO + "T12:00:00");
    if (f.getFullYear() === year && f.getMonth() === month) {
      const d = f.getDate();
      if (!eventos[d]) eventos[d] = [];
      eventos[d].push({ t: l.tarea.length > 14 ? l.tarea.slice(0, 13) + "…" : l.tarea, c: COLORES[l.tipo] || "var(--mc-text-2)" });
    }
  });

  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div className="mc-card__title">{monthNames[month]} {year}</div>
        <div className="mc-seg">
          <button onClick={onPrev} title="Mes anterior">&lt;</button>
          <button className="is-on">Mes</button>
          <button onClick={onNext} title="Mes siguiente">&gt;</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((d) => (
          <div key={d} className="text-xs text-muted" style={{ textAlign: "center", padding: "8px 0", fontWeight: 600, letterSpacing: "0.06em" }}>{d}</div>
        ))}
        {Array.from({ length: offsetInicio }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const evs = eventos[day] || [];
          const isToday = day === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear();
          return (
            <div key={i} style={{ minHeight: 80, padding: 8, border: "1px solid var(--mc-line)", borderRadius: 8, background: isToday ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
              <div className="font-mono text-xs" style={{ color: isToday ? "var(--mc-green-700)" : "var(--mc-text-2)", fontWeight: isToday ? 700 : 500 }}>{day}</div>
              <div className="col gap-2 mt-4">
                {evs.map((e, j) => (
                  <div key={j} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: e.c, color: "white", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.t}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
