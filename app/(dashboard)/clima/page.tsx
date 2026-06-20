"use client";

import React, { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Icon, KPI, Modal, Field, useToast, PageHeader, Tabs } from "@/components/mc";
import { ForecastChart, type DayForecast } from "@/components/clima/ForecastChart";
import { weatherTone } from "@/components/clima/weatherTone";
import { AnimatedWeatherIcon } from "@/components/clima/AnimatedWeatherIcon";
import { VentanaPulverizacion, type HoraPulver } from "@/components/clima/VentanaPulverizacion";

const RadarReal = dynamic(() => import("@/components/clima/RadarReal"), {
  ssr: false,
  loading: () => <div style={{ height: 300, display: "grid", placeItems: "center", color: "var(--mc-text-3)", fontSize: 13 }}>Cargando radar…</div>,
});
import {
  RegistrarLluviaModal,
  ReportarAlertaModal,
  type LoteOpt,
  type LluviaResult,
  type AlertaResult,
} from "@/components/clima/ClimaModales";
import { demo } from "@/lib/demo";
import { useLoteScope } from "@/components/LoteScope";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

const TABS = ["Inicio", "Alertas", "Registro de Lluvias"];

type ClimaActual = { temperatura: number; sensacion: number; humedad: number; rocio: number; viento: number; vientoDir: string; rafaga: number; deltaT: number; aptoPulverizacion: boolean; icono: string; cond?: string; descripcion: string };
type ClimaDia = { nombre: string; num: number; esHoy: boolean; icono: string; cond?: string; desc?: string; max: number; min: number; mm: number; probLluvia: number; viento: number };
type ClimaData = { actual: ClimaActual; dias: ClimaDia[]; horas?: HoraPulver[]; ubicacion?: { nombre?: string; lat?: number; lon?: number } };

// Aptitud de pulverización por día (a partir del viento máximo del día)
const ventDeViento = (v: number): "ok" | "warn" | "bad" => (v <= 15 ? "ok" : v <= 25 ? "warn" : "bad");
function climaADias(clima: ClimaData | null): DayForecast[] {
  if (!clima) return [];
  return clima.dias.map((d) => ({ d: d.esHoy ? "Hoy" : d.nombre, num: d.num, ic: d.icono, cond: (d as any).cond, desc: (d as any).desc, viento: d.viento, max: d.max, min: d.min, mm: d.mm, vent: ventDeViento(d.viento) }));
}

const DEMO_LOTES: LoteOpt[] = [
  { nombre: "Lote 1 - El Bajo", ha: 70 },
  { nombre: "Lote 2 - Norte", ha: 120 },
  { nombre: "Lote 4 - Sur", ha: 85 },
  { nombre: "Lote 7 - La Loma", ha: 95 },
];

export default function ClimaPage() {
  return (
    <Suspense>
      <ClimaInner />
    </Suspense>
  );
}

function ClimaInner() {
  const searchParams = useSearchParams();
  const toast = useToast();

  const { lotes: scopeLotes, loteActivo } = useLoteScope();
  const initialTab = TABS.includes(searchParams.get("tab") || "") ? (searchParams.get("tab") as string) : "Inicio";
  const [tab, setTab] = useState(initialTab);
  const [showLluvia, setShowLluvia] = useState(searchParams.get("modal") === "lluvia");
  const [showAlerta, setShowAlerta] = useState(searchParams.get("modal") === "alerta");
  const [detalle, setDetalle] = useState<DayForecast | null>(null);

  const [lotes, setLotes] = useState<LoteOpt[]>(demo(DEMO_LOTES, []));
  const [lluvias, setLluvias] = useState<LluviaRow[]>(demo(DEMO_LLUVIAS, []));
  const [alertas, setAlertas] = useState<AlertaRow[]>(demo(DEMO_ALERTAS, []));
  const [editLluvia, setEditLluvia] = useState<LluviaRow | null>(null);
  const [clima, setClima] = useState<ClimaData | null>(null);
  const [tieneCampo, setTieneCampo] = useState(false);
  const [histLluvia, setHistLluvia] = useState<{ promedioMensual: number[]; promedioAnual: number } | null>(null);

  // Lotes del alcance global para los modales (registrar lluvia, etc.)
  useEffect(() => {
    if (scopeLotes.length > 0) setLotes(scopeLotes.map((l) => ({ id: l.id, nombre: l.nombre, ha: l.hectareas || 0 })));
  }, [scopeLotes]);

  // Clima real del lote activo (o el primero con coordenadas si "Todos")
  useEffect(() => {
    const target = (loteActivo && loteActivo.centroLatitud && loteActivo.centroLongitud)
      ? loteActivo
      : scopeLotes.find((l) => l.centroLatitud && l.centroLongitud) || null;
    if (target) setTieneCampo(true); else setTieneCampo(false);
    const q = target ? `?lat=${target.centroLatitud}&lon=${target.centroLongitud}` : "";
    fetch(`/api/clima${q}`).then((r) => (r.ok ? r.json() : null)).then((c) => { if (c?.actual) setClima(c); }).catch(() => {});
    fetch(`/api/clima/historico-lluvia${q}`).then((r) => (r.ok ? r.json() : null)).then((h) => { if (Array.isArray(h?.promedioMensual)) setHistLluvia(h); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteActivo?.id, scopeLotes]);

  useEffect(() => {
    fetch("/api/registro-pluviometrico")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        const max = Math.max(...d.map((r: { milimetros: number }) => r.milimetros), 50);
        setLluvias(
          d.map((r: { id: string; fecha: string; milimetros: number; lote?: { nombre: string }; ubicacion?: string; observaciones?: string }) => ({
            id: r.id,
            fechaRaw: r.fecha,
            fecha: new Date(r.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) + " - " + new Date(r.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
            lugar: r.lote?.nombre || r.ubicacion || "Campo General",
            mm: r.milimetros,
            pct: Math.round((r.milimetros / max) * 100),
            tags: parseTags(r.observaciones),
          }))
        );
      })
      .catch(() => {});

    fetch("/api/alertas-climaticas")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        setAlertas(
          d.map((a: { id: string; titulo: string; tipo: string; severidad: string; ubicacion?: string; descripcion?: string }) => ({
            id: a.id,
            seccion: a.severidad === "Alta" || a.severidad === "Extrema" || a.severidad === "Severo - Daño" ? "critical" : a.severidad === "Baja" ? "info" : "warning",
            titulo: a.titulo,
            lugar: a.ubicacion || "Área General",
            icon: iconForTipo(a.tipo),
            color: a.severidad === "Baja" ? "#3aa6d9" : a.severidad === "Moderado" || a.severidad === "Media" ? "#d9a538" : "#c08a22",
            val: a.descripcion || a.tipo,
            chart: "icon",
          }))
        );
      })
      .catch(() => {});
  }, []);

  /* ---- Acciones ---- */
  const guardarLluvia = async (r: LluviaResult) => {
    const fechaISO = new Date(`${r.fecha}T${r.hora || "00:00"}`).toISOString();
    const obs = `Duración: ${r.duracion}h${r.condiciones.length ? " · Condiciones: " + r.condiciones.join(", ") : ""}`;
    let realId: string | undefined;
    try {
      if (r.loteId) {
        const res = await fetch("/api/registro-pluviometrico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fecha: fechaISO, milimetros: r.mm, loteId: r.loteId, ubicacion: r.loteNombre, observaciones: obs }),
        });
        if (res.ok) realId = (await res.json()).id;
      } else {
        const res = await fetch("/api/registro-pluviometrico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fecha: fechaISO, milimetros: r.mm, ubicacion: r.loteNombre, observaciones: obs }),
        });
        if (res.ok) realId = (await res.json()).id;
      }
    } catch {}

    const nueva: LluviaRow = {
      id: realId,
      fechaRaw: `${r.fecha}T${r.hora || "00:00"}`,
      fecha: new Date(`${r.fecha}T${r.hora || "00:00"}`).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) + " - " + (r.hora || ""),
      lugar: r.loteNombre,
      mm: r.mm,
      pct: Math.min(100, Math.round((r.mm / 50) * 100)),
      tags: r.condiciones.map((c) => condToTag(c)),
    };
    setLluvias((prev) => [nueva, ...prev]);
    toast.show(`Lluvia de ${r.mm} mm registrada en ${r.loteNombre}`);
    setShowLluvia(false);
  };

  const editarLluvia = async (r: LluviaResult) => {
    if (editLluvia?.id) {
      try {
        await fetch(`/api/registro-pluviometrico/${editLluvia.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milimetros: r.mm }),
        });
      } catch {}
    }
    setLluvias((prev) =>
      prev.map((x) =>
        x === editLluvia
          ? { ...x, mm: r.mm, pct: Math.min(100, Math.round((r.mm / 50) * 100)), tags: r.condiciones.map((c) => condToTag(c)) }
          : x
      )
    );
    toast.show(`Registro actualizado: ${r.mm} mm`);
    setEditLluvia(null);
  };

  const eliminarLluvia = async (row: LluviaRow) => {
    if (!confirm("¿Eliminar este registro de lluvia?")) return;
    if (row.id) {
      try {
        const res = await fetch(`/api/registro-pluviometrico/${row.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
      } catch {
        toast.show("No se pudo eliminar el registro", "err");
        return;
      }
    }
    setLluvias((prev) => prev.filter((x) => x !== row));
    toast.show("Registro de lluvia eliminado");
  };

  const guardarAlerta = async (r: AlertaResult) => {
    let realId: string | undefined;
    const fechaISO = new Date(`${r.fecha}T${r.hora || "00:00"}`).toISOString();
    try {
      const res = await fetch("/api/alertas-climaticas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: r.tipo,
          severidad: r.severidad,
          titulo: `${r.tipo} - ${r.severidad}`,
          descripcion: `Evento ${r.tipo.toLowerCase()} (${r.severidad}) · ${r.loteNombre} · duración aprox. ${r.duracion}h`,
          fechaInicio: fechaISO,
          ubicacion: r.loteNombre,
        }),
      });
      if (res.ok) realId = (await res.json()).id;
    } catch {}

    setAlertas((prev) => [
      {
        id: realId,
        seccion: r.severidad === "Severo - Daño" ? "critical" : r.severidad === "Leve" ? "info" : "warning",
        titulo: `${r.tipo} reportado`,
        lugar: `${r.loteNombre} · Hoy`,
        icon: iconForTipo(r.tipo),
        color: r.severidad === "Severo - Daño" ? "#c08a22" : r.severidad === "Leve" ? "#3aa6d9" : "#d9a538",
        val: `Severidad: ${r.severidad}`,
        chart: "icon",
      },
      ...prev,
    ]);
    toast.show(`Alerta de ${r.tipo} (${r.severidad}) registrada`);
    setShowAlerta(false);
    setTab("Alertas");
  };

  const gestionarTareas = async (a: AlertaRow) => {
    const lote = lotes.find((l) => l.id);
    try {
      if (lote?.id) {
        await fetch("/api/labores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "Monitoreo",
            fecha: new Date().toISOString().slice(0, 10),
            loteId: lote.id,
            superficieTrabajada: 0,
            descripcion: `Tarea por alerta climática: ${a.titulo}`,
          }),
        });
      }
    } catch {}
    toast.show(`Tarea creada para: ${a.titulo}`);
  };

  const alertasCount = alertas.length;
  const criticasCount = alertas.filter((a) => a.seccion === "critical").length;

  return (
    <div className="col gap-20">
      {toast.node}

      {showLluvia && <RegistrarLluviaModal lotes={lotes} onClose={() => setShowLluvia(false)} onSave={guardarLluvia} />}
      {editLluvia && (
        <RegistrarLluviaModal
          lotes={lotes}
          initial={{ mm: editLluvia.mm }}
          onClose={() => setEditLluvia(null)}
          onSave={editarLluvia}
        />
      )}
      {showAlerta && <ReportarAlertaModal lotes={lotes} onClose={() => setShowAlerta(false)} onSave={guardarAlerta} />}

      <PageHeader
        crumbs={["Agronomía", "Clima"]}
        title="Clima"
        subtitle="Pronóstico, alertas, ventana de pulverización y lluvias registradas."
        actions={
          <>
            <button className="mc-btn mc-btn--primary" onClick={() => setShowLluvia(true)}>
              <Icon name="droplet" size={14} />Registrar Lluvia
            </button>
            <button className="mc-btn" style={{ background: "#c08a22", color: "white" }} onClick={() => setShowAlerta(true)}>
              <Icon name="alert" size={14} />Registrar Alerta
            </button>
          </>
        }
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="grid g-cols-5">
        <KPI label="Temperatura" value={clima ? `${clima.actual.temperatura} °C` : "—"} delta={clima ? `Sensación ${clima.actual.sensacion}°` : "—"} trend="up" icon="thermometer" accent />
        <KPI label="Viento" value={clima ? `${clima.actual.viento} km/h` : "—"} delta={clima ? `${clima.actual.vientoDir} · ráfagas ${clima.actual.rafaga}` : "—"} trend="up" icon="wind" />
        <KPI label="Delta T" value={clima ? String(clima.actual.deltaT) : "—"} delta={clima ? (clima.actual.aptoPulverizacion ? "Apto pulverizar" : "Fuera de rango") : "—"} trend="up" icon="activity" />
        <KPI label="Lluvia prevista 7d" value={clima ? `${Math.round(clima.dias.reduce((s, d) => s + d.mm, 0))} mm` : "—"} delta={clima ? "pronóstico" : "—"} trend="up" icon="droplet" />
        <KPI label="Alertas Climáticas" value={String(alertasCount)} delta={`${criticasCount} críticas`} trend="warn" icon="alert" warn />
      </div>

      {tab === "Inicio" && <ClimaInicio actual={clima?.actual ?? null} onVerDetalle={setDetalle} dias={climaADias(clima)} lugar={clima?.ubicacion?.nombre || "tu campo"} horas={clima?.horas ?? []} lat={clima?.ubicacion?.lat ?? -33.3} lon={clima?.ubicacion?.lon ?? -61.5} marcador={tieneCampo} />}
      {tab === "Alertas" && <ClimaAlertas alertas={alertas} onGestionar={gestionarTareas} />}
      {tab === "Registro de Lluvias" && (
        <ClimaLluvias lluvias={lluvias} historico={histLluvia} onRegistrar={() => setShowLluvia(true)} onEditar={setEditLluvia} onEliminar={eliminarLluvia} />
      )}

      <Modal
        open={!!detalle}
        onClose={() => setDetalle(null)}
        title={`Detalle · ${detalle?.d || ""}`}
        subtitle="Pronóstico horario y aptitud para pulverización del día."
        headTone="blue"
        footer={<button className="mc-btn mc-btn--primary" onClick={() => setDetalle(null)}>Cerrar</button>}
      >
        {detalle && (
          <div className="col gap-12">
            <div style={{ textAlign: "center" }}><Icon name={detalle.ic} size={40} /></div>
            <div className="grid g-cols-2 gap-12">
              <Field label="Temperatura máxima"><input className="mc-input" value={`${detalle.max} °C`} readOnly /></Field>
              <Field label="Temperatura mínima"><input className="mc-input" value={`${detalle.min} °C`} readOnly /></Field>
              <Field label="Lluvia estimada"><input className="mc-input" value={`${detalle.mm} mm`} readOnly /></Field>
              <Field label="Aptitud pulverización">
                <input
                  className="mc-input"
                  value={detalle.vent === "ok" ? "Apto" : detalle.vent === "warn" ? "Marginal" : "No apto"}
                  readOnly
                />
              </Field>
            </div>
            <div className="text-xs text-muted">Datos estimados a partir del modelo de pronóstico extendido para Don Ramón, Pergamino.</div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ================= TAB INICIO ================= */
function ClimaInicio({ actual, onVerDetalle, dias, lugar, horas, lat, lon, marcador }: { actual: ClimaActual | null; onVerDetalle: (d: DayForecast) => void; dias: DayForecast[]; lugar: string; horas: HoraPulver[]; lat: number; lon: number; marcador: boolean }) {
  const tone = weatherTone(actual?.icono ?? "cloud");
  return (
    <>
      {actual && (
        <div className="mc-card" style={{ padding: 0, overflow: "hidden", border: "none" }}>
          <div style={{ background: tone.grad, color: "#fff", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative" }}>
              <span style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(255,255,255,0.20)", display: "grid", placeItems: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.18)", flexShrink: 0 }}>
                <AnimatedWeatherIcon cond={actual.cond || actual.icono} size={62} />
              </span>
              <div>
                <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>Ahora · {lugar}</div>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 52, fontWeight: 700, lineHeight: 1 }}>{actual.temperatura}°</div>
                <div style={{ fontSize: 13, opacity: 0.92, fontWeight: 600 }}>{actual.descripcion} · Sensación {actual.sensacion}°</div>
              </div>
            </div>
            <div className="row" style={{ gap: 10, position: "relative", flexWrap: "wrap" }}>
              {[
                { icon: "droplet", label: "Humedad", val: `${actual.humedad}%` },
                { icon: "wind", label: "Viento", val: `${actual.viento} km/h ${actual.vientoDir}` },
                { icon: "thermometer", label: "Rocío", val: `${actual.rocio}°` },
                { icon: "activity", label: "Delta T", val: `${actual.deltaT}${actual.aptoPulverizacion ? " · apto" : ""}` },
              ].map((m) => (
                <div key={m.label} style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 12, padding: "8px 12px", minWidth: 92, backdropFilter: "blur(2px)" }}>
                  <div className="row gap-6" style={{ alignItems: "center", fontSize: 11, opacity: 0.85, fontWeight: 600 }}><Icon name={m.icon} size={12} />{m.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, whiteSpace: "nowrap" }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="mc-card">
        <div className="mc-card__head">
          <div>
            <div className="mc-card__eyebrow">Pronóstico Open-Meteo · {lugar}</div>
            <div className="mc-card__title mt-4">Próximos {dias.length || 7} días</div>
          </div>
          <div className="row gap-12" style={{ alignItems: "center" }}>
            <div
              className="row gap-10 text-xs"
              style={{ alignItems: "center", padding: "6px 12px", background: "var(--mc-surface-2)", borderRadius: 999, border: "1px solid var(--mc-line)" }}
            >
              <span className="row gap-4" style={{ alignItems: "center" }}>
                <span style={{ width: 14, height: 3, background: "#c08a22", borderRadius: 2 }} />
                <span style={{ color: "var(--mc-text-2)", fontWeight: 600 }}>Máx</span>
              </span>
              <span style={{ width: 1, height: 12, background: "var(--mc-line)" }} />
              <span className="row gap-4" style={{ alignItems: "center" }}>
                <span style={{ width: 14, height: 3, background: "#3aa6d9", borderRadius: 2 }} />
                <span style={{ color: "var(--mc-text-2)", fontWeight: 600 }}>Mín</span>
              </span>
              <span style={{ width: 1, height: 12, background: "var(--mc-line)" }} />
              <span className="row gap-4" style={{ alignItems: "center" }}>
                <span style={{ width: 10, height: 10, background: "linear-gradient(180deg, #5fb6e5, #2c82c9)", borderRadius: 2 }} />
                <span style={{ color: "var(--mc-text-2)", fontWeight: 600 }}>Lluvia</span>
              </span>
            </div>
          </div>
        </div>
        {dias.length > 0 ? (
          <ForecastChart days={dias} onVerDetalle={onVerDetalle} />
        ) : (
          <div className="mc-empty"><div className="mc-empty__icon"><Icon name="cloud" size={22} /></div>Cargando pronóstico…</div>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1.3fr", gap: 14 }}>
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="mc-card__head" style={{ padding: "12px 16px", margin: 0, borderBottom: "1px solid var(--mc-line)" }}>
            <div className="mc-card__title" style={{ fontSize: 14 }}>Radar de lluvia</div>
            <span className="text-xs text-muted">En vivo · RainViewer</span>
          </div>
          <RadarReal lat={lat} lon={lon} marcador={marcador} />
        </div>
        <VentanaPulverizacion horas={horas} />
      </div>
    </>
  );
}

/* ================= TAB ALERTAS ================= */
type AlertaRow = {
  id?: string;
  seccion: "critical" | "warning" | "info";
  titulo: string;
  lugar: string;
  icon: string;
  color: string;
  val: string;
  chart: "temp" | "bar" | "drop" | "icon";
  pct?: number;
};

const DEMO_ALERTAS: AlertaRow[] = [
  { seccion: "critical", titulo: "Riesgo de Helada Inminente", lugar: "Lote Bajo · 04:00 AM", icon: "thermometer", color: "#3aa6d9", val: "-2.5°C", chart: "temp" },
  { seccion: "critical", titulo: "Reporte de Granizo Confirmado", lugar: "Campo Oeste · Hace 15 min", icon: "alert", color: "#3aa6d9", val: "Intensidad: ALTA (Daño visible)", chart: "icon" },
  { seccion: "critical", titulo: "Alerta de Tormenta Eléctrica", lugar: "Área General · En curso", icon: "bolt", color: "#c08a22", val: "Proximidad: < 5km (Riesgo personal)", chart: "icon" },
  { seccion: "warning", titulo: "Umbral de Isoca Superado", lugar: "Lote 4 (Soja)", icon: "leaf", color: "#d9a538", val: "8/10 por metro", chart: "bar", pct: 80 },
  { seccion: "warning", titulo: "Viento Excesivo para Pulverizar", lugar: "Actualmente", icon: "wind", color: "#c08a22", val: "Ráfagas: 45 km/h", chart: "icon" },
  { seccion: "warning", titulo: "Estrés Hídrico Detectado", lugar: "Lote de Maíz", icon: "droplet", color: "#a88032", val: "Agua Útil: 20% (Crítico)", chart: "icon" },
  { seccion: "info", titulo: "Lluvia Registrada (Automático)", lugar: "Hace 30 min", icon: "droplet", color: "#3aa6d9", val: "45 mm", chart: "drop" },
];

function ClimaAlertas({ alertas, onGestionar }: { alertas: AlertaRow[]; onGestionar: (a: AlertaRow) => void }) {
  const [filtro, setFiltro] = useState<"todos" | "critical" | "warning" | "info">("todos");

  const counts = {
    todos: alertas.length,
    critical: alertas.filter((a) => a.seccion === "critical").length,
    warning: alertas.filter((a) => a.seccion === "warning").length,
    info: alertas.filter((a) => a.seccion === "info").length,
  };

  const Section = ({ title, seccion, accentColor }: { title: string; seccion: AlertaRow["seccion"]; accentColor: string }) => {
    if (filtro !== "todos" && filtro !== seccion) return null;
    const items = alertas.filter((a) => a.seccion === seccion);
    if (items.length === 0) return null;
    return (
      <div>
        <div className="text-xs" style={{ textTransform: "uppercase", color: accentColor, fontWeight: 700, letterSpacing: "0.06em", padding: "10px 0 6px" }}>
          {title}
        </div>
        <div className="col gap-6">
          {items.map((a, i) => (
            <div
              key={i}
              style={{
                padding: "10px 14px",
                border: "1px solid var(--mc-line)",
                borderLeft: `4px solid ${accentColor}`,
                borderRadius: 10,
                display: "grid",
                gridTemplateColumns: "auto 1fr 1.2fr auto",
                gap: 14,
                alignItems: "center",
                background: "var(--mc-surface)",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${a.color}1a`, color: a.color, display: "grid", placeItems: "center" }}>
                <Icon name={a.icon} size={18} />
              </div>
              <div>
                <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>{a.titulo}</div>
                <div className="text-xs text-muted">{a.lugar}</div>
              </div>
              <div className="row gap-8" style={{ alignItems: "center" }}>
                {a.chart === "temp" && (
                  <svg width="100" height="36" viewBox="0 0 100 36">
                    <polyline fill="none" stroke="var(--mc-red)" strokeWidth="2" points="0,8 20,12 40,18 60,24 80,30 100,32" />
                  </svg>
                )}
                {a.chart === "bar" && (
                  <div style={{ flex: 1, maxWidth: 120 }}>
                    <div className="text-xs font-mono" style={{ color: "var(--mc-amber)", textAlign: "right", fontWeight: 700 }}>{a.pct}%</div>
                    <div className="mc-prog mt-2"><div className="mc-prog__bar" style={{ width: `${a.pct}%`, background: "var(--mc-amber)" }} /></div>
                    <div className="text-xs text-muted" style={{ textAlign: "right" }}>{a.val}</div>
                  </div>
                )}
                {a.chart === "drop" && (
                  <span className="mc-badge mc-badge--blue" style={{ fontSize: 12 }}>
                    <Icon name="droplet" size={11} />{a.val}
                  </span>
                )}
                {a.chart === "icon" && <span className="text-xs font-semi" style={{ color: a.color }}>{a.val}</span>}
              </div>
              <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => onGestionar(a)}>Gestionar Tareas</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const chip = (key: typeof filtro, label: string, cls: string) => (
    <button
      onClick={() => setFiltro(key)}
      style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", opacity: filtro === key || filtro === "todos" ? 1 : 0.5 }}
    >
      <span className={cls} style={key === "todos" ? { background: "#1a1f1c", color: "white" } : undefined}>● {label}</span>
    </button>
  );

  return (
    <div className="mc-card">
      <div className="row gap-8" style={{ marginBottom: 4, flexWrap: "wrap" }}>
        {chip("todos", `Todos (${counts.todos})`, "mc-badge")}
        {chip("critical", `Críticos (${counts.critical})`, "mc-badge mc-badge--red")}
        {chip("warning", `Alertas (${counts.warning})`, "mc-badge mc-badge--amber")}
        {chip("info", `Informativos (${counts.info})`, "mc-badge mc-badge--blue")}
      </div>
      <Section title="Críticos" seccion="critical" accentColor="var(--mc-red)" />
      <Section title="Alertas" seccion="warning" accentColor="var(--mc-amber)" />
      <Section title="Informativos" seccion="info" accentColor="var(--mc-blue)" />
      {alertas.length === 0 && (
        <div className="mc-empty"><div className="mc-empty__icon"><Icon name="shieldCheck" size={22} /></div>Sin alertas climáticas activas. Las que registres o detecte el sistema van a aparecer acá.</div>
      )}
    </div>
  );
}

/* ================= TAB REGISTRO DE LLUVIAS ================= */
type Tag = { label: string; color: "amber" | "blue" | "red" | "green" | "neutral"; icon: string };
type LluviaRow = { id?: string; fechaRaw?: string; fecha: string; lugar: string; mm: number; pct: number; tags: Tag[] };

const DEMO_LLUVIAS: LluviaRow[] = [
  { fecha: "22 Dic - 04:30 AM", lugar: "Campo El Amanecer (Lotes 1, 2)", mm: 45, pct: 85, tags: [{ label: "Granizo", color: "amber", icon: "alert" }, { label: "Torrencial", color: "blue", icon: "droplet" }] },
  { fecha: "15 Dic - 10:00 AM", lugar: "Campo La Cañada (Todo)", mm: 20, pct: 38, tags: [{ label: "Lluvia Mansa", color: "blue", icon: "droplet" }] },
  { fecha: "02 Dic", lugar: "Campo General", mm: 5, pct: 9, tags: [] },
];

function ClimaLluvias({
  lluvias,
  historico,
  onRegistrar,
  onEditar,
  onEliminar,
}: {
  lluvias: LluviaRow[];
  historico: { promedioMensual: number[]; promedioAnual: number } | null;
  onRegistrar: () => void;
  onEditar: (r: LluviaRow) => void;
  onEliminar: (r: LluviaRow) => void;
}) {
  const [scope, setScope] = useState<"30d" | "mensual" | "anual">("mensual");
  const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Series y resumen calculados desde las lluvias reales registradas
  const conFecha = lluvias.filter((l) => l.fechaRaw).map((l) => ({ d: new Date(l.fechaRaw as string), mm: l.mm }));
  const hoyD = new Date();
  const anioActual = hoyD.getFullYear();

  const dataMonth = monthLabels.map((_, m) => conFecha.filter((x) => x.d.getFullYear() === anioActual && x.d.getMonth() === m).reduce((s, x) => s + x.mm, 0));
  const data30 = Array.from({ length: 30 }).map((_, i) => {
    const dia = new Date(hoyD); dia.setDate(hoyD.getDate() - (29 - i));
    return conFecha.filter((x) => x.d.toDateString() === dia.toDateString()).reduce((s, x) => s + x.mm, 0);
  });
  const yearsBack = Array.from({ length: 6 }).map((_, i) => anioActual - 5 + i);
  const dataYear = yearsBack.map((y) => conFecha.filter((x) => x.d.getFullYear() === y).reduce((s, x) => s + x.mm, 0));
  const yearLabels = yearsBack.map(String);

  const dataset = scope === "30d" ? data30 : scope === "mensual" ? dataMonth : dataYear;
  const histset =
    scope === "mensual" && historico ? historico.promedioMensual :
    scope === "anual" && historico ? yearsBack.map(() => historico.promedioAnual) :
    [];
  const labels = scope === "30d" ? null : scope === "mensual" ? monthLabels : yearLabels;

  // Resumen
  const acumuladoAnio = Math.round(conFecha.filter((x) => x.d.getFullYear() === anioActual).reduce((s, x) => s + x.mm, 0));
  const mesesConDatos = new Set(conFecha.filter((x) => x.d.getFullYear() === anioActual).map((x) => x.d.getMonth())).size;
  const promedioMensual = mesesConDatos ? Math.round(acumuladoAnio / mesesConDatos) : 0;
  const ultimaLluvia = conFecha.length ? conFecha.map((x) => x.d.getTime()).sort((a, b) => b - a)[0] : null;
  const diasSinLluvia = ultimaLluvia ? Math.floor((hoyD.getTime() - ultimaLluvia) / 86400000) : null;
  // Comparación con el promedio histórico (acumulado del año a la fecha)
  const histAcumALaFecha = historico ? historico.promedioMensual.slice(0, hoyD.getMonth() + 1).reduce((s, v) => s + v, 0) : 0;
  const pctVsHist = historico && histAcumALaFecha > 0 ? Math.round(((acumuladoAnio - histAcumALaFecha) / histAcumALaFecha) * 100) : null;

  return (
    <>
      <div className="grid g-cols-3 gap-14">
        <div className="mc-card">
          <div className="row gap-14" style={{ alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--mc-blue-bg)", display: "grid", placeItems: "center", color: "var(--mc-blue)", flexShrink: 0 }}><Icon name="droplet" size={24} /></div>
            <div>
              <div className="text-xs text-muted">Acumulado del año</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-blue)", fontWeight: 700, lineHeight: 1.1 }}>{acumuladoAnio} mm</div>
              {pctVsHist != null ? (
                <div className="text-xs mt-4" style={{ color: pctVsHist >= 0 ? "var(--mc-green-700)" : "var(--mc-red)", fontWeight: 600 }}>
                  {pctVsHist >= 0 ? "+" : ""}{pctVsHist}% vs promedio histórico
                </div>
              ) : (
                <div className="text-xs mt-4 text-muted">Campaña {anioActual}</div>
              )}
            </div>
          </div>
        </div>
        <div className="mc-card">
          <div className="row gap-14" style={{ alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--mc-blue-bg)", display: "grid", placeItems: "center", color: "var(--mc-blue)", flexShrink: 0 }}><Icon name="calendar" size={24} /></div>
            <div>
              <div className="text-xs text-muted">Promedio mensual</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-ink)", fontWeight: 700, lineHeight: 1.1 }}>{promedioMensual} mm</div>
              <div className="text-xs mt-4 text-muted">{mesesConDatos ? `Sobre ${mesesConDatos} ${mesesConDatos === 1 ? "mes" : "meses"} con registro` : "Sin registros"}</div>
            </div>
          </div>
        </div>
        <div className="mc-card">
          <div className="row gap-14" style={{ alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--mc-red-bg)", display: "grid", placeItems: "center", color: "var(--mc-red)", flexShrink: 0 }}><Icon name="clock" size={24} /></div>
            <div>
              <div className="text-xs text-muted">Días sin lluvia</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-red)", fontWeight: 700, lineHeight: 1.1 }}>{diasSinLluvia != null ? `${diasSinLluvia} días` : "—"}</div>
              <div className="text-xs mt-4 text-muted">{diasSinLluvia != null && diasSinLluvia >= 7 ? "Suelo perdiendo humedad" : "Desde el último registro"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mc-card">
        <div className="mc-card__head">
          <div>
            <div className="mc-card__title">Acumulado de lluvias{historico ? " vs histórico" : ""}</div>
            <div className="row gap-12 text-xs text-muted mt-4">
              <span className="row gap-4"><span style={{ width: 14, height: 3, background: "var(--mc-blue)", borderRadius: 2, display: "inline-block" }} />mm registrados</span>
              {histset.length > 0 && <span className="row gap-4"><span style={{ width: 14, height: 0, borderTop: "2px dashed var(--mc-text-3)", display: "inline-block" }} />Promedio histórico (10 años)</span>}
            </div>
          </div>
          <div className="mc-seg">
            <button className={scope === "30d" ? "is-on" : ""} onClick={() => setScope("30d")}>Últ. 30 días</button>
            <button className={scope === "mensual" ? "is-on" : ""} onClick={() => setScope("mensual")}>Mensual</button>
            <button className={scope === "anual" ? "is-on" : ""} onClick={() => setScope("anual")}>Anual</button>
          </div>
        </div>
        {dataset.every((v) => v === 0) && histset.length === 0 ? (
          <div className="mc-empty"><div className="mc-empty__icon"><Icon name="droplet" size={22} /></div>Sin lluvias registradas en este período. Cargá un registro y el acumulado se grafica acá.</div>
        ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={dataset.map((v, i) => ({
              label: labels ? labels[i] : `${i + 1}`,
              mm: Math.round(v * 10) / 10,
              hist: histset.length > 0 ? Math.round((histset[i] ?? 0) * 10) / 10 : null,
            }))}
            margin={{ top: 12, right: 12, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradLluvia" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2c6bb8" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#5aa0e0" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b6760" }} axisLine={false} tickLine={false} interval={scope === "30d" ? 4 : 0} />
            <YAxis tick={{ fontSize: 11, fill: "#6b6760" }} axisLine={false} tickLine={false} width={42} tickFormatter={(v) => `${v}`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e0", fontSize: 13 }}
              cursor={{ fill: "rgba(44,107,184,0.07)" }}
              formatter={(val: any, name: string) => [`${val} mm`, name === "mm" ? "Registrado" : "Histórico"]}
            />
            <Bar dataKey="mm" fill="url(#gradLluvia)" radius={[5, 5, 0, 0]} maxBarSize={46} name="mm" />
            {histset.length > 0 && (
              <Line type="monotone" dataKey="hist" stroke="#9b968a" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: "#9b968a" }} name="hist" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        )}
      </div>

      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Histórico · Eventos de Lluvia Registrados</div>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={onRegistrar}>
            <Icon name="droplet" size={13} />Registrar Lluvia
          </button>
        </div>
        <div className="col gap-8">
          {lluvias.length === 0 && (
            <div className="mc-empty"><div className="mc-empty__icon"><Icon name="droplet" size={22} /></div>Todavía no registraste lluvias. Tocá “Registrar Lluvia” para cargar el primer evento.</div>
          )}
          {lluvias.map((r, i) => (
            <div
              key={i}
              style={{ padding: "10px 14px", border: "1px solid var(--mc-line)", borderRadius: 10, display: "grid", gridTemplateColumns: "170px 1fr 1.5fr auto auto auto", gap: 16, alignItems: "center" }}
            >
              <div className="font-mono text-sm" style={{ color: "var(--mc-ink)" }}>{r.fecha}</div>
              <div className="text-sm" style={{ color: "var(--mc-text)" }}>{r.lugar}</div>
              <div>
                <div className="row" style={{ alignItems: "center", gap: 8 }}>
                  <div className="mc-prog" style={{ flex: 1 }}><div className="mc-prog__bar" style={{ width: `${r.pct}%`, background: "var(--mc-blue)" }} /></div>
                  <span className="font-semi text-sm" style={{ color: "var(--mc-blue)", minWidth: 48, textAlign: "right" }}>{r.mm} mm</span>
                </div>
              </div>
              <div className="row gap-4">
                {r.tags.map((t, j) => (
                  <span key={j} className={`mc-badge mc-badge--${t.color}`}>
                    <Icon name={t.icon} size={10} />{t.label}
                  </span>
                ))}
              </div>
              <button className="mc-icon-btn" onClick={() => onEditar(r)} title="Editar registro">
                <Icon name="edit" size={13} />
              </button>
              <button className="mc-icon-btn" onClick={() => onEliminar(r)} title="Eliminar registro" style={{ color: "var(--mc-red)" }}>
                <Icon name="trash" size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ================= helpers ================= */
function condToTag(c: string): Tag {
  if (c === "Granizo") return { label: "Granizo", color: "amber", icon: "alert" };
  if (c === "Torrencial / Lavado") return { label: "Torrencial", color: "blue", icon: "droplet" };
  if (c === "Lluvia Mansa (Efectiva)") return { label: "Lluvia Mansa", color: "blue", icon: "droplet" };
  if (c === "Viento Fuerte") return { label: "Viento Fuerte", color: "amber", icon: "wind" };
  if (c === "Actividad Eléctrica") return { label: "Act. Eléctrica", color: "amber", icon: "bolt" };
  if (c === "Caminos Intransitables") return { label: "Caminos", color: "neutral", icon: "alert" };
  return { label: c, color: "neutral", icon: "droplet" };
}

function parseTags(obs?: string): Tag[] {
  if (!obs) return [];
  const m = obs.match(/Condiciones:\s*(.+)$/);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(condToTag);
}

function iconForTipo(tipo: string): string {
  const t = tipo.toLowerCase();
  if (t.includes("granizo")) return "alert";
  if (t.includes("viento")) return "wind";
  if (t.includes("helada")) return "thermometer";
  if (t.includes("inund") || t.includes("anega")) return "droplet";
  if (t.includes("eléctr") || t.includes("electr")) return "bolt";
  if (t.includes("incendio") || t.includes("fuego")) return "alert";
  return "alert";
}
