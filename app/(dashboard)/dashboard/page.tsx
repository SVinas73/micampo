"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon, Badge, Modal, Field, Alerta, useToast } from "@/components/mc";
import { demo } from "@/lib/demo";

/* ============ KPIs disponibles ============ */
type KpiCfg = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "warn";
  icon: string;
  accent?: boolean;
  warn?: boolean;
};

const ALL_KPIS_BASE: Record<string, KpiCfg> = {
  hectareas: { label: "Hectáreas productivas", value: demo("558 Ha", "—"), delta: demo("+3.2% vs campaña ant.", "—"), trend: "up", icon: "map", accent: true },
  cabezas: { label: "Cabezas de ganado", value: demo("1,284", "0"), delta: demo("+24 últ. 30d", "—"), trend: "up", icon: "cow" },
  ingresosMes: { label: "Ingresos del mes", value: demo("$8.6M", "—"), delta: demo("+12% vs mes ant.", "—"), trend: "up", icon: "dollar" },
  labores: { label: "Labores pendientes", value: demo("17", "0"), delta: demo("3 atrasadas", "—"), trend: "warn", icon: "wrench", warn: true },
  litros: { label: "Litros prom. diario", value: demo("4,820 L", "—"), delta: demo("+180L vs ayer", "—"), trend: "up", icon: "droplet" },
  margen: { label: "Margen bruto est.", value: demo("$2.8M", "—"), delta: demo("+0.4M ajuste", "—"), trend: "up", icon: "activity" },
  prenez: { label: "Preñez rodeo", value: demo("78%", "—"), delta: demo("Tacto parcial", "—"), trend: "up", icon: "heart" },
  agua: { label: "Reserva agua útil", value: demo("62%", "—"), delta: demo("-4 pts vs ayer", "—"), trend: "down", icon: "droplet" },
  ingresosProy: { label: "Ingresos proy. campaña", value: demo("$48.2M", "—"), delta: demo("+18% est.", "—"), trend: "up", icon: "dollar" },
  hectareasSemb: { label: "Hectáreas sembradas", value: demo("426 Ha", "—"), delta: demo("76% del campo", "—"), trend: "up", icon: "sprout" },
  alertas: { label: "Alertas activas", value: demo("5", "0"), delta: demo("2 críticas", "—"), trend: "warn", icon: "alert" },
  rinde: { label: "Rinde promedio est.", value: demo("6.6 t/Ha", "—"), delta: demo("+0.4 vs ant.", "—"), trend: "up", icon: "activity" },
};

const DEFAULT_KPI_ORDER = ["hectareas", "cabezas", "ingresosMes", "labores"];

/* ============ Acciones rápidas (18) ============ */
const QUICK_ACTS: { id: string; icon: string; label: string; href?: string }[] = [
  { id: "lluvia", icon: "droplet", label: "Cargar lluvia", href: "/clima?modal=lluvia" },
  { id: "pesada", icon: "scale", label: "Pesada", href: "/animales?tab=Peso" },
  { id: "dosis", icon: "flask", label: "Calcular dosis", href: "/calculadora-dosis?tab=Nuevo Cálculo" },
  { id: "sanidad", icon: "syringe", label: "Sanidad", href: "/animales?tab=Sanidad" },
  { id: "siembra", icon: "sprout", label: "Nueva siembra", href: "/campo-digital?tab=Cultivos&modal=siembra" },
  { id: "tropa", icon: "truck", label: "Mov. tropa", href: "/mov-tropas?modal=nuevo" },
  { id: "labor", icon: "wrench", label: "Nueva labor" },
  { id: "lote", icon: "map", label: "Nuevo lote", href: "/campo-digital?tab=Lotes&modal=nuevo" },
  { id: "animal", icon: "cow", label: "Nuevo animal", href: "/animales?modal=nuevo" },
  { id: "racion", icon: "leaf", label: "Nueva ración", href: "/animales?tab=Nutrición" },
  { id: "gasto", icon: "dollar", label: "Registrar gasto", href: "/finanzas" },
  { id: "plaga", icon: "upload", label: "Reportar plaga", href: "/campo-digital?tab=Detección de Enfermedades (IA)&modal=reportar" },
  { id: "alerta", icon: "alert", label: "Registrar alerta", href: "/clima?modal=alerta" },
  { id: "suelo", icon: "book", label: "Análisis de suelo", href: "/campo-digital?tab=Cultivos&sub=Análisis de Suelo" },
  { id: "insumos", icon: "building", label: "Ingreso insumos", href: "/logistica-inventario" },
  { id: "notif", icon: "bell", label: "Notificación" },
  { id: "cerrar", icon: "check", label: "Cerrar labor", href: "/campo-digital?tab=Labores" },
  { id: "agenda", icon: "calendar", label: "Ver agenda", href: "/calendario" },
];

type LaborApi = { id: string; tipo: string; fecha: string; estado?: string; lote?: { nombre: string } };

const TIPO_COLOR: Record<string, { color: string; icon: string }> = {
  Siembra: { color: "#768f44", icon: "sprout" },
  Pulverización: { color: "#e7892b", icon: "flask" },
  Riego: { color: "#3aa6d9", icon: "droplet" },
  Cosecha: { color: "#d9a538", icon: "wrench" },
  Fertilización: { color: "#8a6d3b", icon: "leaf" },
  Labranza: { color: "#7d6a55", icon: "wrench" },
  Sanidad: { color: "#c14a3a", icon: "syringe" },
  Monitoreo: { color: "#475569", icon: "eye" },
};

export default function InicioPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();

  const [editKpis, setEditKpis] = useState(false);
  const [kpiOrder, setKpiOrder] = useState<string[]>(DEFAULT_KPI_ORDER);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState<string | false>(false);
  const [kpiValues, setKpiValues] = useState<Record<string, Partial<KpiCfg>>>({});
  const [bellOpen, setBellOpen] = useState(false);
  const [laborModal, setLaborModal] = useState(false);
  const [lotes, setLotes] = useState<{ id: string; nombre: string }[]>([]);
  const [laborForm, setLaborForm] = useState({ tipo: "Pulverización", loteId: "", fecha: new Date().toISOString().slice(0, 10) });
  const [labores, setLabores] = useState<LaborApi[]>([]);
  const [balance, setBalance] = useState<{ meses: string[]; ingresos: number[]; gastos: number[] } | null>(null);
  const [editActs, setEditActs] = useState(false);
  const [hiddenActs, setHiddenActs] = useState<string[]>([]);
  const [cultivos, setCultivos] = useState<{ nombre: string; ha: number; color: string }[] | null>(null);

  /* ---- carga inicial ---- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("micampo:kpis");
      if (saved) setKpiOrder(JSON.parse(saved));
      const acts = localStorage.getItem("micampo:quickacts");
      if (acts) setHiddenActs(JSON.parse(acts));
    } catch {}

    fetch("/api/dashboard/inicio")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.metricas) return;
        const v: Record<string, Partial<KpiCfg>> = {};
        if (d.metricas.litrosDiariosPromedio) v.litros = { value: `${d.metricas.litrosDiariosPromedio.toLocaleString("es-AR")} L` };
        if (d.metricas.balanceMesActual) v.ingresosMes = { value: `$${Math.round(d.metricas.balanceMesActual).toLocaleString("es-AR")}` };
        if (typeof d.metricas.alertasActivas === "number" && d.metricas.alertasActivas > 0) v.alertas = { value: String(d.metricas.alertasActivas) };
        setKpiValues(v);
      })
      .catch(() => {});

    fetch("/api/lotes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d)) return;
        setLotes(d.map((l: { id: string; nombre: string }) => ({ id: l.id, nombre: l.nombre })));
        if (d.length > 0) {
          const totalHa = d.reduce((s: number, l: { hectareas?: number }) => s + (l.hectareas || 0), 0);
          setKpiValues((prev) => ({ ...prev, hectareas: { value: `${Math.round(totalHa).toLocaleString("es-AR")} Ha`, delta: `${d.length} lotes` } }));
          const colores: Record<string, string> = { Maíz: "#d9a538", Soja: "#768f44", Trigo: "#a88032", Alfalfa: "#aabd76", Girasol: "#e8b94a", Sorgo: "#e7892b" };
          const porCultivo = new Map<string, number>();
          d.forEach((l: { cultivo?: string; hectareas?: number }) => {
            if (l.cultivo) porCultivo.set(l.cultivo, (porCultivo.get(l.cultivo) || 0) + (l.hectareas || 0));
          });
          if (porCultivo.size > 0)
            setCultivos(Array.from(porCultivo.entries()).map(([nombre, ha]) => ({ nombre, ha, color: colores[nombre] || "#7d8a76" })).sort((a, b) => b.ha - a.ha));
        }
      })
      .catch(() => {});

    fetch("/api/animales")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) setKpiValues((prev) => ({ ...prev, cabezas: { value: d.length.toLocaleString("es-AR"), delta: "rodeo registrado" } }));
      })
      .catch(() => {});

    fetch("/api/labores")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        setLabores(d);
        const pendientes = d.filter((l: LaborApi) => l.estado && !["Completada"].includes(l.estado)).length;
        const atrasadas = d.filter((l: LaborApi) => l.estado === "Atrasada").length;
        if (pendientes > 0) setKpiValues((prev) => ({ ...prev, labores: { value: String(pendientes), delta: `${atrasadas} atrasadas` } }));
      })
      .catch(() => {});

    fetch("/api/transacciones")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        const now = new Date();
        const meses: string[] = [];
        const ingresos: number[] = [];
        const gastos: number[] = [];
        for (let i = 5; i >= 0; i--) {
          const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
          meses.push(m.toLocaleString("es", { month: "short" }).replace(".", ""));
          const enMes = d.filter((t: { fecha: string }) => {
            const f = new Date(t.fecha);
            return f.getFullYear() === m.getFullYear() && f.getMonth() === m.getMonth();
          });
          ingresos.push(enMes.filter((t: { tipo: string }) => t.tipo === "ingreso").reduce((s: number, t: { monto: number | string }) => s + Number(t.monto), 0) / 1e6);
          gastos.push(enMes.filter((t: { tipo: string }) => t.tipo !== "ingreso").reduce((s: number, t: { monto: number | string }) => s + Number(t.monto), 0) / 1e6);
        }
        if (ingresos.some((v) => v > 0) || gastos.some((v) => v > 0)) setBalance({ meses, ingresos, gastos });
      })
      .catch(() => {});
  }, []);

  const ALL_KPIS = useMemo(() => {
    const merged: Record<string, KpiCfg> = {};
    for (const k of Object.keys(ALL_KPIS_BASE)) merged[k] = { ...ALL_KPIS_BASE[k], ...(kpiValues[k] || {}) };
    return merged;
  }, [kpiValues]);

  const persistKpis = (order: string[]) => {
    setKpiOrder(order);
    try {
      localStorage.setItem("micampo:kpis", JSON.stringify(order));
    } catch {}
  };

  const onDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const next = [...kpiOrder];
    const [m] = next.splice(draggedIdx, 1);
    next.splice(idx, 0, m);
    persistKpis(next);
    setDraggedIdx(null);
  };

  const swapKpi = (oldKey: string, newKey: string) => {
    persistKpis(kpiOrder.map((k) => (k === oldKey ? newKey : k)));
    setPickerOpen(false);
  };

  /* ---- próximas tareas (reales o demo) ---- */
  const proximasTareas = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reales = labores
      .filter((l) => l.estado !== "Completada")
      .map((l) => ({ ...l, f: new Date(l.fecha) }))
      .filter((l) => l.f.getTime() >= today.getTime() - 2 * 86400000)
      .sort((a, b) => a.f.getTime() - b.f.getTime())
      .slice(0, 4)
      .map((l) => ({
        tipo: l.tipo,
        lote: l.lote?.nombre || "—",
        fecha: l.f.toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
        estado: l.estado || "Programada",
      }));
    if (reales.length > 0) return reales;
    return demo([
      { tipo: "Riego programado", lote: "Lote 4 - El Bajo", fecha: "21 jun · 08:00", estado: "Próxima" },
      { tipo: "Fertilización", lote: "Norte 1", fecha: "22 jun · 09:30", estado: "Próxima" },
      { tipo: "Monitoreo de plagas", lote: "Este 1", fecha: "23 jun · 10:00", estado: "Próxima" },
      { tipo: "Pesada mensual", lote: "Tropa A", fecha: "25 jun · 07:00", estado: "Próxima" },
    ], [] as { tipo: string; lote: string; fecha: string; estado: string }[]);
  }, [labores]);

  const ganttEvents = useMemo(() => proximasTareas.map((t) => t.tipo), [proximasTareas]);

  const crearLabor = async () => {
    if (!laborForm.loteId && lotes.length === 0) {
      toast.show("Creá un lote primero en Campo Digital", "err");
      return;
    }
    try {
      const res = await fetch("/api/labores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: laborForm.tipo, fecha: laborForm.fecha, loteId: laborForm.loteId || lotes[0]?.id, descripcion: laborForm.tipo, superficieTrabajada: 0 }),
      });
      if (!res.ok) throw new Error();
      toast.show("Labor creada correctamente");
      setLaborModal(false);
    } catch {
      toast.show("No se pudo crear la labor", "err");
    }
  };

  const descargarReporte = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("MiCampo — Reporte Semanal", 14, 20);
    doc.setFontSize(11);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 28);
    let y = 40;
    doc.setFontSize(13);
    doc.text("Indicadores principales", 14, y);
    y += 8;
    doc.setFontSize(10);
    kpiOrder.forEach((k) => {
      const c = ALL_KPIS[k];
      doc.text(`- ${c.label}: ${c.value} (${c.delta})`, 16, y);
      y += 6;
    });
    y += 6;
    doc.setFontSize(13);
    doc.text("Próximas tareas", 14, y);
    y += 8;
    doc.setFontSize(10);
    if (ganttEvents.length === 0) doc.text("Sin labores programadas.", 16, y);
    ganttEvents.slice(0, 12).forEach((e) => {
      doc.text(`- ${e}`, 16, y);
      y += 6;
    });
    doc.save("micampo-reporte-semanal.pdf");
    toast.show("Reporte semanal descargado");
  };

  const toggleAct = (id: string) => {
    const next = hiddenActs.includes(id) ? hiddenActs.filter((a) => a !== id) : [...hiddenActs, id];
    setHiddenActs(next);
    try {
      localStorage.setItem("micampo:quickacts", JSON.stringify(next));
    } catch {}
  };

  const nombre = session?.user?.name?.split(" ")[0] || "productor";
  const rango = (() => {
    const a = new Date();
    const b = new Date();
    b.setDate(b.getDate() + 6);
    const f = (d: Date) => d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    return `${f(a)} – ${f(b)} ${b.getFullYear()}`;
  })();

  return (
    <div className="mc-inicio">
      {toast.node}

      {/* ===== HERO ===== */}
      <div className="mc-hero">
        <div className="mc-hero__bg" />
        <div className="mc-hero__content">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h1 className="mc-hero__title">Buen día, {nombre}</h1>
              <p className="mc-hero__sub">Esto es lo que está pasando hoy en tu campo.</p>
            </div>
            <div className="row gap-8" style={{ position: "relative" }}>
              <div className="mc-hero__chip">
                <Icon name="calendar" size={14} /> {rango}
              </div>
              <button className="mc-hero__icon" onClick={() => setBellOpen(!bellOpen)} title="Notificaciones">
                <Icon name="bell" size={16} />
                <span className="mc-hero__dot" />
              </button>
              <button className="mc-hero__icon mc-hero__icon--primary" onClick={() => setLaborModal(true)} title="Nueva labor">
                <Icon name="plus" size={18} />
              </button>
              {bellOpen && (
                <>
                  <div onClick={() => setBellOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
                  <div className="mc-pop">
                    <div className="mc-card__title" style={{ marginBottom: 10 }}>Notificaciones</div>
                    <div className="col gap-8">
                      {demo(
                        <>
                          <Alerta nivel="red" title="Plaga detectada" body="Chinches verdes en Lote Norte 1 · superó umbral" />
                          <Alerta nivel="orange" title="Ventana de pulverización cerrada" body="Viento >20km/h las próximas 12hs" />
                          <Alerta nivel="blue" title="Cosecha lista" body="Maíz Lote Este 1 · humedad 14.5%" />
                        </>,
                        <div className="text-sm text-muted">Sin notificaciones.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* KPIs glass editables */}
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 16, marginBottom: 8, gap: 8 }}>
            {editKpis && <Badge tone="blue"><span className="inline-flex items-center gap-1">Arrastrá para reordenar · <Icon name="pen" size={12} /> para cambiar</span></Badge>}
            <button className="mc-hero__edit" onClick={() => setEditKpis(!editKpis)}>
              <Icon name={editKpis ? "check" : "edit"} size={13} />
              {editKpis ? "Listo" : "Editar KPIs"}
            </button>
          </div>
          <div className="mc-hero__kpis">
            {kpiOrder.map((k, idx) => {
              const cfg = ALL_KPIS[k];
              return (
                <div
                  key={k}
                  className="mc-gkpi"
                  draggable={editKpis}
                  onDragStart={() => setDraggedIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(idx)}
                  style={{ cursor: editKpis ? "grab" : "default", opacity: draggedIdx === idx ? 0.5 : 1 }}
                >
                  <div className="mc-gkpi__top">
                    <span className="mc-gkpi__icon"><Icon name={cfg.icon} size={16} /></span>
                    {editKpis && (
                      <button className="mc-gkpi__edit" onClick={(e) => { e.stopPropagation(); setPickerOpen(k); }}>
                        <Icon name="edit" size={11} />
                      </button>
                    )}
                  </div>
                  <div className="mc-gkpi__label">{cfg.label}</div>
                  <div className="mc-gkpi__value">{cfg.value}</div>
                  <div className={`mc-gkpi__delta mc-gkpi__delta--${cfg.trend}`}>
                    <Icon name={cfg.trend === "down" ? "arrowDown" : cfg.trend === "warn" ? "alert" : "arrowUp"} size={11} />
                    {cfg.delta}
                  </div>
                  {pickerOpen === k && (
                    <KpiPicker all={ALL_KPIS} current={k} used={kpiOrder} onPick={(nk) => swapKpi(k, nk)} onClose={() => setPickerOpen(false)} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="row gap-8" style={{ marginTop: 14, justifyContent: "flex-end" }}>
            <button className="mc-hero__btn" onClick={descargarReporte}>
              <Icon name="download" size={14} /> Reporte semanal
            </button>
            <button className="mc-hero__btn mc-hero__btn--primary" onClick={() => setLaborModal(true)}>
              <Icon name="plus" size={14} /> Nueva labor
            </button>
          </div>
        </div>
      </div>

      {/* ===== FILA 1: Salud del campo + Clima ===== */}
      <div className="grid" style={{ gridTemplateColumns: "1.15fr 1fr", gap: 14 }}>
        <SaludCampo onVer={() => router.push("/campo-digital?tab=Detección de Enfermedades (IA)")} />
        <ClimaHoy />
      </div>

      {/* ===== FILA 2: Suelo + Distribución de cultivos ===== */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1.1fr", gap: 14 }}>
        <ResumenSuelo onVer={() => router.push("/campo-digital?tab=Cultivos&sub=Análisis de Suelo")} />
        <DistribucionCultivos cultivos={cultivos} onVer={() => router.push("/campo-digital?tab=Cultivos")} />
      </div>

      {/* ===== FILA 3: Próximas tareas + Tendencia ===== */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1.3fr", gap: 14 }}>
        <ProximasTareas tareas={proximasTareas} onVer={() => router.push("/campo-digital?tab=Labores")} onNueva={() => setLaborModal(true)} />
        <Tendencia balance={balance} />
      </div>

      {/* ===== FILA 4: Actividades + Alertas ===== */}
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 1fr", gap: 14 }}>
        <UltimasActividades onVerTodo={() => router.push("/campo-digital?tab=Labores")} />
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Alertas activas</div>
            <span className="mc-badge mc-badge--red"><span className="mc-badge__dot"></span>{demo("5", "0")} activas</span>
          </div>
          <div className="col gap-8">
            {demo(
              <>
                <Alerta nivel="red" title="Plaga detectada" body="Chinches verdes en Lote Norte 1 · superó umbral" />
                <Alerta nivel="orange" title="Ventana de pulverización cerrada" body="Viento >20km/h las próximas 12hs" />
                <Alerta nivel="amber" title="Stock bajo" body="Urea · quedan 4 días de consumo" />
                <Alerta nivel="blue" title="Cosecha lista" body="Maíz Lote Este 1 · humedad 14.5%" />
              </>,
              <div className="text-sm text-muted">Sin alertas activas.</div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Acciones rápidas ===== */}
      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Acciones rápidas</div>
          <button className={`mc-btn mc-btn--sm ${editActs ? "mc-btn--primary" : "mc-btn--ghost"}`} onClick={() => setEditActs(!editActs)}>
            {editActs ? "Listo" : "Personalizar"}
          </button>
        </div>
        <div className="grid g-cols-6 gap-8" style={{ rowGap: 10 }}>
          {QUICK_ACTS.filter((a) => editActs || !hiddenActs.includes(a.id)).map((a) => (
            <button
              key={a.id}
              className="mc-card mc-quick"
              style={{ padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, cursor: "pointer", position: "relative", opacity: editActs && hiddenActs.includes(a.id) ? 0.4 : 1 }}
              onClick={() => {
                if (editActs) { toggleAct(a.id); return; }
                if (a.id === "labor") setLaborModal(true);
                else if (a.id === "notif") setBellOpen(true);
                else if (a.href) router.push(a.href);
              }}
            >
              {editActs && (
                <span style={{ position: "absolute", top: 6, right: 6, color: hiddenActs.includes(a.id) ? "var(--mc-text-3)" : "var(--mc-green-600)" }}>
                  <Icon name={hiddenActs.includes(a.id) ? "x" : "check"} size={12} />
                </span>
              )}
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center" }}>
                <Icon name={a.icon} size={15} />
              </div>
              <div className="text-sm font-semi" style={{ color: "var(--mc-ink)", fontSize: 12.5 }}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Nueva Labor */}
      <Modal
        open={laborModal}
        onClose={() => setLaborModal(false)}
        title="Nueva labor"
        subtitle="Creá una labor rápida; podés completar los detalles en Campo Digital."
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setLaborModal(false)}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={crearLabor}><Icon name="check" size={14} /> Crear labor</button>
          </>
        }
      >
        <Field label="Tipo de labor">
          <select className="mc-select" value={laborForm.tipo} onChange={(e) => setLaborForm({ ...laborForm, tipo: e.target.value })}>
            {["Pulverización", "Siembra", "Cosecha", "Fertilización", "Riego", "Labranza"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Lote">
          <select className="mc-select" value={laborForm.loteId} onChange={(e) => setLaborForm({ ...laborForm, loteId: e.target.value })}>
            <option value="">{lotes.length ? "Seleccionar lote..." : "Sin lotes (creá uno en Campo Digital)"}</option>
            {lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </Field>
        <Field label="Fecha">
          <input type="date" className="mc-input" value={laborForm.fecha} onChange={(e) => setLaborForm({ ...laborForm, fecha: e.target.value })} />
        </Field>
      </Modal>

      <style jsx global>{`
        .mc-inicio { display: flex; flex-direction: column; gap: 16px; }
        /* HERO */
        .mc-hero { position: relative; border-radius: 22px; overflow: hidden; padding: 26px 28px 24px; color: #eef6ee; box-shadow: 0 12px 36px -14px rgba(10,40,18,0.5); }
        .mc-hero__bg { position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(120% 80% at 80% -10%, rgba(120,200,120,0.30), transparent 55%),
            radial-gradient(90% 70% at 10% 110%, rgba(20,80,40,0.55), transparent 60%),
            linear-gradient(160deg, #1f4d2c 0%, #20582f 45%, #2c6a3a 100%);
        }
        .mc-hero__bg::after { content: ""; position: absolute; inset: 0;
          background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 34px 34px; -webkit-mask-image: radial-gradient(ellipse 80% 90% at 70% 0%, #000, transparent 75%); mask-image: radial-gradient(ellipse 80% 90% at 70% 0%, #000, transparent 75%); }
        .mc-hero__content { position: relative; z-index: 1; }
        .mc-hero__title { font-family: var(--ff-display); font-weight: 400; font-size: 34px; line-height: 1; margin: 0; letter-spacing: -0.01em; }
        .mc-hero__sub { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }
        .mc-hero__chip { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22); }
        .mc-hero__icon { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22); color: #fff; cursor: pointer; position: relative; transition: 0.15s; }
        .mc-hero__icon:hover { background: rgba(255,255,255,0.24); }
        .mc-hero__icon--primary { background: #59e069; color: #06310f; border-color: transparent; }
        .mc-hero__icon--primary:hover { background: #6cf07d; }
        .mc-hero__dot { position: absolute; top: 9px; right: 10px; width: 7px; height: 7px; border-radius: 50%; background: #ff6b5e; border: 1.5px solid #235a31; }
        .mc-hero__edit { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22); color: #fff; cursor: pointer; }
        .mc-hero__edit:hover { background: rgba(255,255,255,0.24); }
        .mc-hero__kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 1100px) { .mc-hero__kpis { grid-template-columns: repeat(2, 1fr); } }
        .mc-hero__btn { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; padding: 9px 16px; border-radius: 10px; cursor: pointer; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22); color: #fff; transition: 0.15s; }
        .mc-hero__btn:hover { background: rgba(255,255,255,0.24); }
        .mc-hero__btn--primary { background: #59e069; color: #06310f; border-color: transparent; }
        .mc-hero__btn--primary:hover { background: #6cf07d; }
        /* GLASS KPI */
        .mc-gkpi { position: relative; padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.20); backdrop-filter: blur(6px); transition: 0.18s; }
        .mc-gkpi:hover { background: rgba(255,255,255,0.16); transform: translateY(-2px); }
        .mc-gkpi__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .mc-gkpi__icon { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,0.18); display: grid; place-items: center; color: #d7f7da; }
        .mc-gkpi__edit { width: 22px; height: 22px; border-radius: 6px; border: none; background: #59e069; color: #06310f; display: grid; place-items: center; cursor: pointer; }
        .mc-gkpi__label { font-size: 12px; opacity: 0.82; }
        .mc-gkpi__value { font-family: var(--ff-display); font-size: 30px; line-height: 1.05; margin-top: 2px; }
        .mc-gkpi__delta { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; margin-top: 6px; font-variant-numeric: tabular-nums; }
        .mc-gkpi__delta--up { color: #9af0a6; }
        .mc-gkpi__delta--down { color: #ffb3ab; }
        .mc-gkpi__delta--warn { color: #ffd28a; }
        .mc-pop { position: absolute; right: 0; top: 48px; width: 340px; z-index: 51; background: var(--mc-surface); border: 1px solid var(--mc-line); border-radius: 12px; box-shadow: var(--sh-lg); padding: 12px; color: var(--mc-ink); }
        /* mini health legend bar */
        .mc-hbar { height: 8px; border-radius: 999px; overflow: hidden; display: flex; }
      `}</style>
    </div>
  );
}

/* ============ KPI PICKER ============ */
function KpiPicker({ all, current, used, onPick, onClose }: { all: Record<string, KpiCfg>; current: string; used: string[]; onPick: (k: string) => void; onClose: () => void }) {
  const keys = Object.keys(all).filter((k) => k === current || !used.includes(k));
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 12, boxShadow: "var(--sh-md)", padding: 6, zIndex: 51, maxHeight: 280, overflowY: "auto", color: "var(--mc-ink)" }}>
        <div className="text-xs text-muted" style={{ padding: "6px 10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Reemplazar por</div>
        {keys.map((k) => (
          <button key={k} onClick={() => onPick(k)} style={{ width: "100%", padding: "8px 10px", display: "flex", alignItems: "center", gap: 10, border: "none", background: k === current ? "var(--mc-green-50)" : "transparent", color: "var(--mc-ink)", borderRadius: 6, cursor: "pointer", textAlign: "left" }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center" }}><Icon name={all[k].icon} size={12} /></span>
            <span style={{ flex: 1, fontSize: 13 }}>{all[k].label}</span>
            {k === current && <Icon name="check" size={13} style={{ color: "var(--mc-green-700)" }} />}
          </button>
        ))}
      </div>
    </>
  );
}

/* ============ SALUD DEL CAMPO (donut) ============ */
function SaludCampo({ onVer }: { onVer: () => void }) {
  const score = 86;
  const segs = [
    { label: "Excelente", pct: 35, color: "#5e7733" },
    { label: "Bueno", pct: 40, color: "#768f44" },
    { label: "Regular", pct: 15, color: "#c48410" },
    { label: "Pobre", pct: 10, color: "#c93434" },
  ];
  const r = 70, cx = 90, cy = 90, sw = 18, gap = 4;
  let cum = 0;
  const arcs = segs.map((s) => {
    const a0 = cum * 3.6 - 90;
    cum += s.pct;
    const a1 = cum * 3.6 - 90;
    const gr = (gap / (2 * Math.PI * r)) * 360;
    const p = (ang: number) => [cx + r * Math.cos((ang * Math.PI) / 180), cy + r * Math.sin((ang * Math.PI) / 180)];
    const [x1, y1] = p(a0 + gr / 2);
    const [x2, y2] = p(a1 - gr / 2);
    return { ...s, d: `M ${x1} ${y1} A ${r} ${r} 0 ${s.pct > 50 ? 1 : 0} 1 ${x2} ${y2}` };
  });
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div>
          <div className="mc-card__title">Salud del campo</div>
          <div className="text-xs text-muted">Análisis IA de vegetación y suelo</div>
        </div>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVer}>Ver <Icon name="chevRight" size={13} /></button>
      </div>
      <div className="row gap-16" style={{ alignItems: "center" }}>
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--mc-surface-2)" strokeWidth={sw} />
          {arcs.map((a, i) => <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={sw} strokeLinecap="round" />)}
          <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="var(--ff-display)" fontSize="40" fontWeight="700" fill="var(--mc-ink)">{score}</text>
          <text x={cx} y={cy + 18} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--mc-green-700)">Bueno</text>
        </svg>
        <div className="col gap-8" style={{ flex: 1 }}>
          {segs.map((s) => (
            <div key={s.label} className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
              <span className="row gap-8"><span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color }} />{s.label}</span>
              <span className="font-semi font-mono">{s.pct}%</span>
            </div>
          ))}
          <div className="text-xs mt-8" style={{ color: "var(--mc-green-700)", fontWeight: 600 }}>↑ 12% de mejora vs. semana pasada</div>
        </div>
      </div>
    </div>
  );
}

/* ============ CLIMA HOY + pronóstico ============ */
function ClimaHoy() {
  const dias = [
    { d: "Dom", ic: "sun", max: 21, min: 14 },
    { d: "Lun", ic: "cloud", max: 22, min: 15 },
    { d: "Mar", ic: "droplet", max: 24, min: 16 },
    { d: "Mié", ic: "cloud", max: 23, min: 15 },
    { d: "Jue", ic: "cloud", max: 25, min: 17 },
  ];
  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px 16px", background: "linear-gradient(135deg, #2d5f4a, #4a7c64)", color: "white" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="font-semi" style={{ fontSize: 15 }}>Clima hoy</div>
            <div className="text-xs row gap-4" style={{ opacity: 0.85, alignItems: "center" }}><Icon name="map" size={12} />Don Ramón · Parcialmente nublado</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 46, lineHeight: 1, marginTop: 10 }}>22°<span style={{ fontSize: 16 }}>C</span></div>
          </div>
          <Icon name="cloud" size={44} />
        </div>
        <div className="grid g-cols-3 gap-8" style={{ marginTop: 14 }}>
          {[{ l: "Humedad", v: "48%", ic: "droplet" }, { l: "Viento", v: "9 km/h", ic: "wind" }, { l: "Lluvia", v: "10%", ic: "cloud" }].map((m) => (
            <div key={m.l} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 10px" }}>
              <div className="row gap-4" style={{ fontSize: 10.5, opacity: 0.8 }}><Icon name={m.ic} size={11} />{m.l}</div>
              <div className="font-semi" style={{ fontSize: 15, marginTop: 2 }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", padding: "12px 8px" }}>
        {dias.map((d) => (
          <div key={d.d} style={{ textAlign: "center", padding: "4px 0" }}>
            <div className="text-xs text-muted" style={{ fontWeight: 600 }}>{d.d}</div>
            <div style={{ margin: "4px 0" }}><Icon name={d.ic} size={24} /></div>
            <div className="font-mono" style={{ fontSize: 12 }}><span className="font-semi">{d.max}°</span> <span className="text-muted">{d.min}°</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ RESUMEN DE SUELO ============ */
function ResumenSuelo({ onVer }: { onVer: () => void }) {
  const nutri = [
    { l: "Nitrógeno", k: "N", nivel: "Medio", color: "#c48410", pct: 60 },
    { l: "Fósforo", k: "P", nivel: "Alto", color: "#5e7733", pct: 85 },
    { l: "Potasio", k: "K", nivel: "Medio", color: "#c48410", pct: 62 },
  ];
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div>
          <div className="mc-card__title">Resumen de suelo</div>
          <div className="text-xs text-muted">Promedio de todos los lotes</div>
        </div>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVer}>Ver <Icon name="chevRight" size={13} /></button>
      </div>
      <div className="grid g-cols-3 gap-8">
        {nutri.map((n) => (
          <div key={n.k} style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10, textAlign: "center" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${n.color}1f`, color: n.color, display: "grid", placeItems: "center", margin: "0 auto 6px", fontWeight: 700 }}>{n.k}</div>
            <div className="text-xs text-muted">{n.l}</div>
            <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{n.nivel}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", fontSize: 12.5 }}>
          <span className="text-muted">Materia orgánica</span>
          <span className="font-semi font-mono">2.8%</span>
        </div>
        <div className="mc-prog mt-4"><div className="mc-prog__bar" style={{ width: "70%" }} /></div>
        <div className="text-xs" style={{ color: "var(--mc-green-700)", marginTop: 4 }}>Buen nivel</div>
      </div>
    </div>
  );
}

/* ============ DISTRIBUCIÓN DE CULTIVOS (donut) ============ */
function DistribucionCultivos({ cultivos, onVer }: { cultivos: { nombre: string; ha: number; color: string }[] | null; onVer: () => void }) {
  const data = cultivos && cultivos.length ? cultivos : demo([
    { nombre: "Maíz", ha: 45.2, color: "#d9a538" },
    { nombre: "Soja", ha: 32.8, color: "#768f44" },
    { nombre: "Trigo", ha: 25.6, color: "#a88032" },
    { nombre: "Cebada", ha: 12.5, color: "#aabd76" },
    { nombre: "Otros", ha: 9.5, color: "#cbd5c5" },
  ], [] as { nombre: string; ha: number; color: string }[]);
  const total = data.reduce((s, c) => s + c.ha, 0);
  const r = 64, cx = 84, cy = 84, sw = 20, gap = 3;
  let cum = 0;
  const arcs = data.map((c) => {
    const pct = (c.ha / total) * 100;
    const a0 = cum * 3.6 - 90;
    cum += pct;
    const a1 = cum * 3.6 - 90;
    const gr = (gap / (2 * Math.PI * r)) * 360;
    const p = (ang: number) => [cx + r * Math.cos((ang * Math.PI) / 180), cy + r * Math.sin((ang * Math.PI) / 180)];
    const [x1, y1] = p(a0 + gr / 2);
    const [x2, y2] = p(a1 - gr / 2);
    return { ...c, pct, d: `M ${x1} ${y1} A ${r} ${r} 0 ${pct > 50 ? 1 : 0} 1 ${x2} ${y2}` };
  });
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div>
          <div className="mc-card__title">Distribución de cultivos</div>
          <div className="text-xs text-muted">Por superficie</div>
        </div>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVer}>Ver detalle <Icon name="chevRight" size={13} /></button>
      </div>
      <div className="row gap-16" style={{ alignItems: "center" }}>
        <svg width="168" height="168" viewBox="0 0 168 168" style={{ flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--mc-surface-2)" strokeWidth={sw} />
          {arcs.map((a, i) => <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={sw} strokeLinecap="round" />)}
          <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="var(--ff-display)" fontSize="26" fontWeight="700" fill="var(--mc-ink)">{Math.round(total)}</text>
          <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--mc-text-2)">Ha totales</text>
        </svg>
        <div className="col gap-6" style={{ flex: 1 }}>
          {arcs.map((c) => (
            <div key={c.nombre} className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
              <span className="row gap-8"><span style={{ width: 9, height: 9, borderRadius: "50%", background: c.color }} />{c.nombre}</span>
              <span><span className="font-mono text-muted">{c.ha.toLocaleString("es-AR")} ha</span> <span className="font-semi" style={{ marginLeft: 6 }}>{Math.round(c.pct)}%</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ PRÓXIMAS TAREAS ============ */
function ProximasTareas({ tareas, onVer, onNueva }: { tareas: { tipo: string; lote: string; fecha: string; estado: string }[]; onVer: () => void; onNueva: () => void }) {
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div className="mc-card__title">Próximas tareas</div>
        <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={onNueva}><Icon name="plus" size={12} />Nueva</button>
      </div>
      <div className="col gap-8">
        {tareas.map((t, i) => {
          const c = TIPO_COLOR[t.tipo.split(" ")[0]] || { color: "#5E8F78", icon: "wrench" };
          return (
            <div key={i} className="row gap-12" style={{ padding: "10px 12px", border: "1px solid var(--mc-line)", borderRadius: 10, alignItems: "center" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${c.color}1f`, color: c.color, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={c.icon} size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{t.tipo}</div>
                <div className="text-xs text-muted">{t.lote}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="font-mono text-xs" style={{ color: "var(--mc-text-2)" }}>{t.fecha}</div>
                <span className="mc-badge mc-badge--green" style={{ fontSize: 9, marginTop: 2 }}>{t.estado}</span>
              </div>
            </div>
          );
        })}
      </div>
      <button className="mc-btn mc-btn--secondary mc-btn--block mt-12" onClick={onVer}>Ver todas las tareas</button>
    </div>
  );
}

/* ============ TENDENCIA (línea) ============ */
function Tendencia({ balance }: { balance: { meses: string[]; ingresos: number[]; gastos: number[] } | null }) {
  const usaBalance = !!balance;
  const labels = balance?.meses || ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const serieA = balance?.ingresos || demo([72, 68, 64, 62, 52, 58, 62], [0, 0, 0, 0, 0, 0, 0]);
  const serieB = balance?.gastos || demo([55, 58, 52, 50, 48, 51, 55], [0, 0, 0, 0, 0, 0, 0]);
  const titulo = usaBalance ? "Balance mensual" : "Tendencia de humedad del suelo";
  const sub = usaBalance ? "Ingresos vs. gastos (M$)" : "Actual vs. pronóstico (%)";
  const W = 520, H = 200, padL = 34, padR = 14, padT = 16, padB = 28;
  const iw = W - padL - padR, ih = H - padT - padB;
  const max = Math.max(...serieA, ...serieB, usaBalance ? 1 : 100) * (usaBalance ? 1.1 : 1);
  const min = usaBalance ? 0 : 0;
  const n = labels.length;
  const px = (i: number) => padL + (i / (n - 1)) * iw;
  const py = (v: number) => padT + ih * (1 - (v - min) / (max - min));
  const line = (s: number[]) => s.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`).join(" ");
  const area = (s: number[]) => `${line(s)} L ${px(n - 1)} ${padT + ih} L ${px(0)} ${padT + ih} Z`;

  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div>
          <div className="mc-card__title">{titulo}</div>
          <div className="text-xs text-muted">{sub}</div>
        </div>
        <div className="row gap-12 text-xs">
          <span className="row gap-4"><span style={{ width: 10, height: 3, background: "#768f44", borderRadius: 2 }} />{usaBalance ? "Ingresos" : "Actual"}</span>
          <span className="row gap-4"><span style={{ width: 10, height: 3, background: "#9aa6b2", borderRadius: 2 }} />{usaBalance ? "Gastos" : "Pronóstico"}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        <defs>
          <linearGradient id="trendA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#768f44" stopOpacity="0.25" /><stop offset="100%" stopColor="#768f44" stopOpacity="0" /></linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padT + ih * p;
          return <line key={i} x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--mc-line)" strokeDasharray={i === 4 ? "0" : "2,3"} />;
        })}
        <path d={area(serieA)} fill="url(#trendA)" />
        <path d={line(serieA)} fill="none" stroke="#768f44" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={line(serieB)} fill="none" stroke="#9aa6b2" strokeWidth="2" strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" />
        {serieA.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r={i === n - 1 ? 4.5 : 3} fill="#768f44" />)}
        {labels.map((l, i) => <text key={i} x={px(i)} y={H - 8} fontSize="10" fontFamily="var(--ff-ui)" fill="var(--mc-text-2)" textAnchor="middle">{l}</text>)}
      </svg>
    </div>
  );
}

/* ============ ÚLTIMAS ACTIVIDADES ============ */
function UltimasActividades({ onVerTodo }: { onVerTodo: () => void }) {
  const activs = demo([
    { tipo: "user", inicial: "S", color: "#5E8F78", quien: "Santiago", verb: "registró", obj: "20mm de lluvia", lote: "Lote 2", emoji: "droplet", time: "Hace 2 horas" },
    { tipo: "user", inicial: "J", color: "#d9a538", quien: "Joaquin", verb: "finalizó", obj: "Siembra", lote: "Lote 1", emoji: "truck", time: "Hace 5 horas" },
    { tipo: "system", inicial: "", color: "#3f4443", quien: "Sistema", verb: "detectó", obj: "Alerta de Isoca", lote: "Lote 3", emoji: "bug", time: "Ayer" },
    { tipo: "user", inicial: "S", color: "#5E8F78", quien: "Santiago", verb: "cargó", obj: "Foto de Cultivo", lote: "Lote 4", emoji: "camera", time: "Ayer" },
    { tipo: "user", inicial: "M", color: "#e7892b", quien: "Manuel", verb: "aplicó", obj: "Pulverización", lote: "Lote N1", emoji: "droplet", time: "Hace 2 días" },
    { tipo: "system", inicial: "", color: "#3f4443", quien: "Sistema", verb: "completó", obj: "Análisis IA de NDVI", lote: "Todos", emoji: "chart", time: "Hace 2 días" },
  ], [] as { tipo: string; inicial: string; color: string; quien: string; verb: string; obj: string; lote: string; emoji: string; time: string }[]);
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div className="mc-card__title">Últimas Actividades</div>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVerTodo}>Ver todo <Icon name="chevRight" size={13} /></button>
      </div>
      <div className="mc-actividades">
        {activs.map((a, i) => (
          <div key={i} className="mc-act-row">
            <div className="mc-act-row__avatar" style={{ background: a.color }}>{a.tipo === "system" ? <Icon name="bolt" size={14} /> : a.inicial}</div>
            <div className="mc-act-row__content">
              <div className="mc-act-row__text">
                <span style={{ color: "var(--mc-ink)", fontWeight: 500 }}>{a.quien}</span> {a.verb}{" "}
                <span style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{a.obj}</span> en{" "}
                <span style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{a.lote}</span>
                <span style={{ marginLeft: 6 }}><Icon name={a.emoji} size={13} /></span>
              </div>
            </div>
            <div className="mc-act-row__time">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
