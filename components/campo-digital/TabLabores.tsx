"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Icon, KPI, Modal, Field, useToast } from "@/components/mc";
import { demo } from "@/lib/demo";
import { useSetHeaderActions } from "./ActionsContext";
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

const DEMO_LABORES: LaborUI[] = [
  { id: "d1", tarea: "Pulverización", tipo: "Pulverización", lote: "Lote 2 - Norte", cultivo: "Soja", responsable: "Juan Pérez", fecha: hoyCorta(), fechaISO: hoyISO(), prioridad: "alta", estado: "En curso" },
  { id: "d2", tarea: "Siembra Maíz", tipo: "Siembra", lote: "Lote 4 - El Bajo", cultivo: "Maíz", responsable: "M. Gómez", fecha: hoyCorta(), fechaISO: hoyISO(), prioridad: "media", estado: "Hoy" },
  { id: "d3", tarea: "Riego Sector A", tipo: "Riego", lote: "Pivote 1", cultivo: "Maíz", responsable: "C. López", fecha: hoyCorta(), fechaISO: hoyISO(), prioridad: "media", estado: "Hoy" },
  { id: "d4", tarea: "Fertilización", tipo: "Fertilización", lote: "Lote Sur 1", cultivo: "Trigo", responsable: "Equipo", fecha: corta(-2), fechaISO: iso(-2), prioridad: "alta", estado: "Atrasada" },
  { id: "d5", tarea: "Monitoreo plagas", tipo: "Monitoreo", lote: "Lote Sur 2", cultivo: "Alfalfa", responsable: "C. Martínez", fecha: corta(-1), fechaISO: iso(-1), prioridad: "media", estado: "Atrasada" },
  { id: "d6", tarea: "Siembra trigo", tipo: "Siembra", lote: "Lote Este 1", cultivo: "Trigo", responsable: "M. Gómez", fecha: corta(4), fechaISO: iso(4), prioridad: "media", estado: "Programada" },
  { id: "d7", tarea: "Cosecha maíz", tipo: "Cosecha", lote: "Lote Este 1", cultivo: "Maíz", responsable: "Equipo", fecha: corta(7), fechaISO: iso(7), prioridad: "baja", estado: "Programada" },
  { id: "d8", tarea: "Pulverización Norte 2", tipo: "Pulverización", lote: "Norte 2", cultivo: "Soja", responsable: "C. Martínez", fecha: corta(-3), fechaISO: iso(-3), prioridad: "media", estado: "Completada" },
  { id: "d9", tarea: "Siembra alfalfa", tipo: "Siembra", lote: "Sur 2", cultivo: "Alfalfa", responsable: "Equipo", fecha: corta(-6), fechaISO: iso(-6), prioridad: "media", estado: "Completada" },
];

const BLOQUEADAS_DEMO = [
  { icon: "flask", iconColor: "#2c7ad9", titulo: "Pulverización", lote: "Lote 2 - Norte", alertaIcon: "wind", alertaTitulo: "Viento: 32 km/h", alertaSub: "Riesgo de Deriva", accion: "Reprogramar" },
  { icon: "sprout", iconColor: "#768f44", titulo: "Siembra Maíz", lote: "Lote 4 - El Bajo", alertaIcon: "building", alertaTitulo: "Sin Stock: Semilla", alertaSub: "Faltan 20 bolsas", accion: "Solicitar" },
  { icon: "wrench", iconColor: "#d9a538", titulo: "Cosecha Soja", lote: "Lote 7 - Sur", alertaIcon: "alert", alertaTitulo: "Cosechadora Averiada", alertaSub: "En taller mecánico", accion: "Ver Detalle" },
];

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
  const [labores, setLabores] = useState<LaborUI[]>(demo(DEMO_LABORES, []));
  const [lotes, setLotes] = useState<{ id?: string; nombre: string; ha: number; tag?: string }[]>(demo([
    { nombre: "Lote 4 - La Loma", ha: 75, tag: "Rastrojo de Maiz" },
    { nombre: "Lote 5 - El Bajo", ha: 50, tag: "Barbecho Químico" },
    { nombre: "Lote 8 - Norte", ha: 110, tag: "Cultivo en Pie" },
  ], []));
  const [view, setView] = useState<"kanban" | "tabla" | "calendario">("kanban");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [calDate, setCalDate] = useState(() => new Date());
  const [dragId, setDragId] = useState<string | null>(null);
  const [reportar, setReportar] = useState<LaborUI | null>(null);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [reprogramar, setReprogramar] = useState<LaborUI | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState(hoyISO());
  const [verDetalle, setVerDetalle] = useState<LaborUI | { titulo: string; lote: string; detalle: string } | null>(null);
  const [filtroOpen, setFiltroOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [cronos, setCronos] = useState<Record<string, number>>(demo<Record<string, number>>({ d1: 6330 }, {}));

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
    fetch("/api/labores")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        setLabores(
          d.map((l: { id: string; tipo: string; descripcion?: string; fecha: string; estado?: string; prioridad?: string; operarios?: string; loteId?: string; lote?: { nombre: string }; motivoBloqueo?: string }) => {
            const f = new Date(l.fecha);
            const estado = l.estado || (f < new Date(hoyISO()) ? "Atrasada" : "Programada");
            return {
              id: l.id, dbId: l.id, tarea: l.descripcion || l.tipo, tipo: l.tipo,
              lote: l.lote?.nombre || "—", loteId: l.loteId, cultivo: "—",
              responsable: l.operarios || "Equipo",
              fecha: `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}`,
              fechaISO: l.fecha.slice(0, 10),
              prioridad: (l.prioridad === "Urgente" ? "alta" : "media") as "alta" | "media",
              estado: estado === "Bloqueada" ? "Atrasada" : estado,
              motivoBloqueo: l.motivoBloqueo || undefined,
            };
          })
        );
      })
      .catch(() => {});
    fetch("/api/lotes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d) && d.length > 0)
          setLotes(d.map((l: { id: string; nombre: string; hectareas: number; cultivo?: string }) => ({ id: l.id, nombre: l.nombre, ha: l.hectareas, tag: l.cultivo || "Disponible" })));
      })
      .catch(() => {});
  }, []);

  useSetHeaderActions(
    <button className="mc-btn mc-btn--primary" onClick={() => setWizardOpen(true)}>
      <Icon name="plus" size={14} />Nueva Tarea
    </button>,
    []
  );

  const patchLabor = async (l: LaborUI, cambios: Record<string, unknown>, msg: string) => {
    if (l.dbId) {
      await fetch(`/api/labores/${l.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      }).catch(() => {});
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
    const loteSel = orden.lotes[0];
    try {
      let dbId: string | undefined;
      if (loteSel?.id) {
        const res = await fetch("/api/labores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: orden.actividad,
            fecha: hoyISO(),
            loteId: loteSel.id,
            superficieTrabajada: orden.haNetas,
            descripcion: orden.actividad,
            observaciones: `Operario: ${orden.operario} · ${orden.tractor} + ${orden.implemento} · Insumos: ${orden.insumos.map((i) => i.nombre).join(", ") || "—"} · Costo est: $${orden.costoTotal} USD`,
            prioridad: orden.prioridad,
            operarios: orden.operario,
          }),
        });
        if (res.ok) dbId = (await res.json()).id;
      }
      setLabores((prev) => [
        {
          id: dbId || `n${Date.now()}`, dbId, tarea: orden.actividad, tipo: orden.actividad,
          lote: loteSel?.nombre || "—", loteId: loteSel?.id, cultivo: "—",
          responsable: orden.operario, fecha: hoyCorta(), fechaISO: hoyISO(),
          prioridad: orden.prioridad === "Urgente" ? "alta" : "media", estado: "Hoy",
        },
        ...prev,
      ]);
      toast.show(`Orden "${orden.actividad}" emitida y notificada (${orden.haNetas} Ha · $${orden.costoTotal.toLocaleString("es-AR")} USD)`);
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
  const completadasMes = labores.filter((l) => l.estado === "Completada").length;
  const atrasadas = labores.filter((l) => l.estado === "Atrasada");
  const pctCompletadas = labores.length ? Math.round((completadasMes / labores.length) * 100) : 0;

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
          onClose={() => setWizardOpen(false)}
          onEmitir={emitirOrden}
          onBorrador={(o) => {
            try {
              localStorage.setItem("micampo:labor-borrador", JSON.stringify(o));
            } catch {}
            toast.show("Borrador guardado");
            setWizardOpen(false);
          }}
        />
      )}

      <div className="grid g-cols-5">
        <KPI label="Programadas" value={String(labores.filter((l) => l.estado === "Programada").length)} delta="próx. 30 días" trend="up" icon="calendar" accent />
        <KPI label="Pendientes" value={String(labores.filter((l) => !["Completada"].includes(l.estado)).length)} delta="Sin asignar: 2" trend="up" icon="wrench" />
        <KPI label="Atrasadas" value={String(atrasadas.length)} delta={atrasadas.slice(0, 2).map((l) => l.lote.split(" - ")[0]).join(" + ") || "Ninguna"} trend="warn" icon="alert" warn />
        <KPI label="% Completadas" value={`${pctCompletadas}%`} delta="vs 76% mes ant." trend="up" icon="check" />
        <KPI label="Completados este mes" value={String(completadasMes)} delta="98% a tiempo" trend="up" icon="activity" />
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
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setWizardOpen(true)}>
            <Icon name="plus" size={13} />Nueva labor
          </button>
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
                      {l.responsable.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 12 }}>{l.responsable}</div>
                      <div className="text-xs text-muted">{l.tipo === "Pulverización" ? "Mosquito Metalfor" : l.tipo === "Siembra" ? "John Deere 6J" : "Pivote Valley"}</div>
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
                    <button className="mc-btn mc-btn--sm" style={{ background: "#e7892b", color: "white", padding: "4px 8px", fontSize: 11 }} onClick={() => { setReportar(l); setMotivoReporte(""); }}>
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
            <span className="mc-badge mc-badge--red">{demo(BLOQUEADAS_DEMO, []).length + labores.filter((l) => l.motivoBloqueo).length}</span>
          </div>
          <div className="col gap-10">
            {[
              ...labores.filter((l) => l.motivoBloqueo).map((l) => ({
                icon: TIPO_ICON[l.tipo]?.icon || "wrench", iconColor: TIPO_ICON[l.tipo]?.color || "#475569",
                titulo: l.tarea, lote: l.lote, alertaIcon: "alert", alertaTitulo: l.motivoBloqueo as string, alertaSub: "Reportado por el equipo", accion: "Reprogramar", labor: l as LaborUI | undefined,
              })),
              ...demo(BLOQUEADAS_DEMO, []).map((b) => ({ ...b, labor: undefined as LaborUI | undefined })),
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
                      const target = b.labor || labores.find((l) => l.tarea === b.titulo) || null;
                      setReprogramar(target);
                      setNuevaFecha(iso(2));
                      if (!target) toast.show("Labor de ejemplo: usá la tabla para reprogramar labores reales");
                    } else if (b.accion === "Solicitar") {
                      toast.show("Solicitud de insumos enviada a Logística e Inventario");
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
              style={{ background: "#e7892b", color: "white" }}
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
                if (reprogramar) patchLabor(reprogramar, { fecha: nuevaFecha, estado: "Programada", motivoBloqueo: null }, `"${reprogramar.tarea}" reprogramada`);
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
