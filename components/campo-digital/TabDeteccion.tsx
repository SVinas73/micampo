"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon, KPI, SubTabs, IABadge, useToast } from "@/components/mc";
import { useLoteScope } from "@/components/LoteScope";
import { ReportarPlagaModal } from "./deteccion-ReportarModal";
import { prescripcionPara } from "@/lib/tratamientos";

/* ========== Tipos ========== */
type Lesion = { etiqueta: string; confianza: number; x: number; y: number; w: number; h: number };
type Analisis = {
  enfermedad: string;
  nombreCientifico: string;
  confianzaGlobal: number;
  severidad: string;
  lesiones: Lesion[];
  recomendacion: { producto: string; dosis: string; ventanaAplicacion: string; costoEstimadoHa: string };
  analisis: string;
  simulado?: boolean;
};

type AlertaInfo = {
  id?: string;
  lote: string;
  loteId?: string;
  enfermedad: string;
  estadio: string;
  img: string;
  imgBg: string;
  imagenUrl?: string | null;
  deteccion: string;
  afect: string;
  riesgo: string;
  riesgoColor: "red" | "amber" | "green";
  perdida: string;
  proy: string;
  recom: string;
  iaIcon?: boolean;
  // Estrategia de control sugerida por IA (se completa cuando el motor de IA
  // del sistema esté conectado; mientras tanto queda indefinida).
  estrategia?: { producto: string; dosis: string; ventana: string; costo: string; analisis: string };
};

// Reduce una imagen (dataURL) a una miniatura JPEG liviana para guardarla con la
// alerta y mostrar "lo detectado" sin almacenar la foto completa.
function hacerThumb(dataUrl: string, max = 220): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * escala));
      const h = Math.max(1, Math.round(img.height * escala));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, w, h);
      try { resolve(c.toDataURL("image/jpeg", 0.7)); } catch { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function TabDeteccion() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [sub, setSub] = useState("Información");
  const [reportarOpen, setReportarOpen] = useState(searchParams.get("modal") === "reportar");
  // Lotes del alcance global (respeta el establecimiento/lote activo)
  const { lotes: scopeLotes, establecimientoId, loteId } = useLoteScope();
  const lotes = useMemo(() => scopeLotes.map((l) => ({ id: l.id, nombre: l.nombre, cultivo: l.cultivo ?? undefined })), [scopeLotes]);
  const [alertas, setAlertas] = useState<AlertaInfo[]>([]);
  // Métricas reales de las detecciones vigentes (para los KPIs, sin datos inventados).
  const [stats, setStats] = useState({ confianza: 0, lotesAfectados: 0, areaTotal: 0, deteccionesIA: 0, conteo: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  // Carga las alertas VIGENTES del alcance activo (excluye Resueltas/Falsas).
  const cargarAlertas = useCallback(() => {
    const params = new URLSearchParams();
    if (establecimientoId && establecimientoId !== "todos") params.set("establecimientoId", establecimientoId);
    if (loteId && loteId !== "todos") params.set("loteId", loteId);
    const q = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/deteccion-enfermedades${q}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d)) return;
        const vigentes = d.filter((a: { estado?: string }) => !["Resuelta", "Falsa"].includes(a.estado || ""));
        // Estadísticas reales
        const conf = vigentes.map((a: { confianza?: number }) => a.confianza).filter((c: number | undefined): c is number => typeof c === "number");
        setStats({
          conteo: vigentes.length,
          confianza: conf.length ? Math.round(conf.reduce((s: number, c: number) => s + c, 0) / conf.length) : 0,
          lotesAfectados: new Set(vigentes.map((a: { loteId?: string }) => a.loteId).filter(Boolean)).size,
          areaTotal: Math.round(vigentes.reduce((s: number, a: { areaAfectada?: number }) => s + (a.areaAfectada || 0), 0)),
          deteccionesIA: vigentes.filter((a: { metodoDeteccion?: string }) => (a.metodoDeteccion || "").includes("IA")).length,
        });
        setAlertas(
          vigentes.slice(0, 6).map((a: { id: string; lote?: { nombre: string; cultivo?: string }; loteId: string; plaga: string; severidad: string; areaAfectada?: number; recomendacion?: string; metodoDeteccion?: string; imagenUrl?: string | null }) => {
            const sevColor: "red" | "amber" | "green" = a.severidad === "Alta" || a.severidad === "Crítica" ? "red" : a.severidad === "Media" ? "amber" : "green";
            return {
              id: a.id,
              lote: `${a.lote?.nombre || "Lote"} (${a.lote?.cultivo || "—"})`,
              loteId: a.loteId,
              enfermedad: a.plaga,
              estadio: "—",
              img: "leaf",
              imgBg: "linear-gradient(135deg,#6db870,#768f44)",
              imagenUrl: a.imagenUrl || null,
              deteccion: a.metodoDeteccion || "Manual",
              afect: `${a.areaAfectada || 0} Ha afectadas · Reciente`,
              riesgo: `${a.severidad.toUpperCase()}`,
              riesgoColor: sevColor,
              perdida: "—",
              proy: a.recomendacion || "",
              recom: a.recomendacion || "Monitoreo",
              iaIcon: a.metodoDeteccion?.includes("IA"),
            };
          })
        );
      })
      .catch(() => {});
  }, [establecimientoId, loteId]);

  useEffect(() => { cargarAlertas(); }, [cargarAlertas]);

  const agregarALabores = async (a: AlertaInfo) => {
    if (a.loteId) {
      // Superficie real del lote (para que el costo/economía de la labor no quede en 0).
      const haLote = scopeLotes.find((l) => l.id === a.loteId)?.hectareas || 0;
      await fetch("/api/labores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Pulverización", fecha: new Date().toISOString().slice(0, 10), loteId: a.loteId,
          superficieTrabajada: haLote, descripcion: `Control: ${a.enfermedad}`, prioridad: "Urgente",
          observaciones: `Recomendación IA: ${a.recom}`,
        }),
      }).catch(() => {});
    }
    toast.show(`"${a.recom}" agregado a Labores para ${a.lote}`);
  };

  // Marca la alerta como Resuelta: deja de estar activa y desaparece de la lista.
  const resolverAlerta = async (a: AlertaInfo) => {
    if (!a.id) { toast.show("Esta alerta aún no está guardada", "err"); return; }
    setAlertas((prev) => prev.filter((x) => x.id !== a.id));
    try {
      await fetch(`/api/alertas-plagas/${a.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Resuelta", fechaResolucion: new Date().toISOString() }),
      });
      cargarAlertas();
    } catch { cargarAlertas(); }
    toast.show(`Alerta de "${a.enfermedad}" marcada como resuelta`);
  };

  // Elimina la alerta del sistema (para errores / falsos positivos). Distinto de
  // Resolver: no queda en el historial, se borra.
  const eliminarAlerta = async (a: AlertaInfo) => {
    if (!a.id) { toast.show("Esta alerta aún no está guardada", "err"); return; }
    if (!window.confirm(`¿Eliminar la alerta de "${a.enfermedad}"? Se borra del sistema. Usá esto solo si fue un error o un falso positivo.`)) return;
    setAlertas((prev) => prev.filter((x) => x.id !== a.id));
    try { await fetch(`/api/alertas-plagas/${a.id}`, { method: "DELETE" }); cargarAlertas(); } catch { cargarAlertas(); }
    toast.show("Alerta eliminada");
  };

  const generarAlerta = async (data: { loteId?: string; plaga: string; tipo: string; incidencia: number; observaciones: string; imagenUrl?: string | null }) => {
    if (data.loteId) {
      const res = await fetch("/api/deteccion-enfermedades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, metodoDeteccion: "Manual" }),
      }).catch(() => null);
      if (!res || !res.ok) { toast.show("No se pudo guardar la alerta", "err"); return; }
    }
    const sevColor: "red" | "amber" | "green" = data.incidencia >= 50 ? "red" : data.incidencia >= 20 ? "amber" : "green";
    setAlertas((prev) => [
      {
        lote: `${lotes.find((l) => l.id === data.loteId)?.nombre || "Lote"} (${data.tipo})`,
        loteId: data.loteId, enfermedad: data.plaga, estadio: "—", img: "bug",
        imgBg: "linear-gradient(135deg,#6db870,#768f44)", deteccion: "Reporte Manual",
        afect: `${data.incidencia}% incidencia · Ahora`, riesgo: `${data.incidencia >= 50 ? "ALTA" : data.incidencia >= 20 ? "MEDIA" : "BAJA"} (${data.incidencia}%)`,
        riesgoColor: sevColor, perdida: "Por evaluar", proy: data.observaciones || "", recom: "Evaluación agronómica",
      },
      ...prev,
    ]);
    toast.show(`Alerta de "${data.plaga}" generada`);
    setReportarOpen(false);
  };

  return (
    <>
      {toast.node}
      {reportarOpen && <ReportarPlagaModal lotes={lotes} onClose={() => setReportarOpen(false)} onConfirm={generarAlerta} />}

      <div className="grid g-cols-5">
        <KPI label="Alertas Activas" value={String(alertas.length)} delta={alertas.length ? `${alertas.filter((a) => a.riesgoColor === "red").length} críticas` : "Sin alertas"} trend="warn" icon="alert" warn />
        <KPI label="Confianza IA" value={stats.confianza > 0 ? `${stats.confianza}%` : "—"} delta={stats.deteccionesIA ? `${stats.deteccionesIA} detección(es) IA` : "Sin detecciones IA"} trend="up" icon="target" accent ia />
        <KPI label="Lotes afectados" value={String(stats.lotesAfectados)} delta={stats.conteo ? `${stats.conteo} alerta(s) vigente(s)` : "Sin alertas"} trend="warn" icon="leaf" />
        <KPI label="Área afectada" value={stats.areaTotal > 0 ? `${stats.areaTotal.toLocaleString("es-AR")} Ha` : "0 Ha"} delta="bajo monitoreo" trend="warn" icon="alert" />
        <KPI label="Detecciones IA" value={String(stats.deteccionesIA)} delta={stats.conteo ? `de ${stats.conteo} alerta(s)` : "—"} trend="up" icon="check" />
      </div>

      {/* Subtabs + acciones del submódulo a la misma altura (acciones a la derecha) */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <SubTabs tabs={["Información", "Análisis (IA)"]} active={sub} onChange={setSub} />
        <div className="row gap-8">
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => { setSub("Análisis (IA)"); setTimeout(() => fileRef.current?.click(), 100); }}>
            <Icon name="upload" size={13} />Cargar Imagen de Lote
          </button>
          <button className="mc-btn mc-btn--sm" style={{ background: "#c08a22", color: "white" }} onClick={() => setReportarOpen(true)}>
            <Icon name="alert" size={13} />Reportar Plaga
          </button>
        </div>
      </div>

      {sub === "Información" && <EnfermedadesInfo alertas={alertas} onAgregar={agregarALabores} onResolver={resolverAlerta} onEliminar={eliminarAlerta} />}
      {sub === "Análisis (IA)" && <EnfermedadesAnalisisIA fileRef={fileRef} lotes={lotes} toast={toast} onGuardado={cargarAlertas} />}
    </>
  );
}

/* ========== SUBTAB INFORMACIÓN (Figma EnfermedadesInfo) ========== */
function EnfermedadesInfo({ alertas, onAgregar, onResolver, onEliminar }: { alertas: AlertaInfo[]; onAgregar: (a: AlertaInfo) => void; onResolver: (a: AlertaInfo) => void; onEliminar: (a: AlertaInfo) => void }) {
  const [enlarged, setEnlarged] = useState<AlertaInfo | null>(null);
  // Alerta elegida por el usuario: la "Estrategia de Control" muestra la suya.
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null);
  // Miniatura: foto real analizada si existe; si no, ícono de hoja como respaldo.
  const Thumb = ({ a, size }: { a: AlertaInfo; size: number }) =>
    a.imagenUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a.imagenUrl} alt={a.enfermedad} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)" }}><Icon name={a.img} size={size} /></div>
    );

  return (
    <>
      {enlarged && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "grid", placeItems: "center" }} onClick={() => setEnlarged(null)}>
          <div style={{ background: "var(--mc-surface)", borderRadius: 14, padding: 20, width: 460, maxWidth: "92vw", boxShadow: "0 12px 48px rgba(0,0,0,0.35)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "100%", aspectRatio: "16/10", background: enlarged.imgBg, borderRadius: 10, position: "relative", marginBottom: 14, overflow: "hidden" }}>
              {enlarged.imagenUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={enlarged.imagenUrl} alt={enlarged.enfermedad} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 64 }}><Icon name={enlarged.img} size={64} /></div>
              )}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "14px 16px" }}>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{enlarged.deteccion}</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{enlarged.afect}</div>
              </div>
            </div>
            <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 15 }}>{enlarged.enfermedad}</div>
            <div className="text-xs text-muted mt-2">{enlarged.lote} · {enlarged.estadio}</div>
            <button onClick={() => setEnlarged(null)} className="mc-btn mc-btn--secondary mc-btn--sm mt-12" style={{ width: "100%", justifyContent: "center" }}>Cerrar</button>
          </div>
        </div>
      )}
      <div className="grid mc-2col-resp" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <div className="mc-card ia-card">
          <div className="mc-card__head"><div className="mc-card__title">Alertas Activas</div><IABadge /></div>
          <div className="col gap-8 mc-hscroll">
            {alertas.map((a, i) => {
              const sel = !!a.id && a.id === seleccionadaId;
              return (
              <div key={i} onClick={() => setSeleccionadaId(a.id ?? null)} title="Elegí esta alerta para ver su estrategia de control" style={{ padding: "10px 12px", border: `1px solid ${sel ? "var(--mc-green-600)" : "var(--mc-line)"}`, borderRadius: 10, display: "grid", gridTemplateColumns: "120px minmax(160px, 1fr) 100px 120px 130px 150px", gap: 10, alignItems: "center", minWidth: 660, cursor: "pointer", background: sel ? "var(--mc-green-50)" : undefined, boxShadow: sel ? "0 2px 10px rgba(118,143,68,0.18)" : undefined, transition: "border-color .15s, background .15s" }}>
                <div style={{ width: 120, height: 80, borderRadius: 8, background: a.imgBg, position: "relative", overflow: "hidden", cursor: "pointer", flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); setEnlarged(a); }}>
                  <Thumb a={a} size={32} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.65)", padding: "4px 6px" }}>
                    <div style={{ color: "white", fontSize: 9, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.deteccion}</div>
                  </div>
                </div>
                <div>
                  <div className="row gap-4" style={{ alignItems: "center" }}>
                    {a.iaIcon && <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg, #6b46c1, #768f44)", display: "grid", placeItems: "center" }}><Icon name="sprout" size={10} style={{ color: "white" }} /></div>}
                    <div className="font-semi text-xs" style={{ color: "var(--mc-ink)" }}>{a.lote}</div>
                  </div>
                  <div className="text-xs text-muted">{a.enfermedad}</div>
                  <span className="mc-badge mc-badge--green mt-2" style={{ fontSize: 9 }}>Estado: {a.estadio}</span>
                </div>
                <div className="col gap-4" style={{ alignItems: "flex-start" }}>
                  <span className={`mc-badge mc-badge--${a.riesgoColor}`} style={{ fontSize: 10, whiteSpace: "nowrap" }}>{a.riesgo}</span>
                  <div className="text-xs text-muted" style={{ fontSize: 9 }}>{a.afect.split(" · ")[1] || ""}</div>
                </div>
                <div className="col gap-2">
                  <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 11 }}>{a.afect.split(" · ")[0]}</div>
                </div>
                <div className="col gap-2">
                  <div className="text-xs text-muted" style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Riesgo Pérdida</div>
                  <div className="font-semi" style={{ color: "var(--mc-red)", fontSize: 13 }}>{a.perdida}</div>
                  <div className="text-xs text-muted" style={{ fontSize: 9 }}>{a.proy}</div>
                </div>
                <div className="col gap-6">
                  <div style={{ padding: "5px 8px", fontSize: 10, borderRadius: 6, background: a.riesgoColor === "red" ? "var(--mc-green-50)" : "var(--mc-surface-2)", border: "1px solid var(--mc-line)", color: "var(--mc-green-700)", fontWeight: 600, textAlign: "center" }}>
                    Rec: {a.recom.length > 24 ? a.recom.slice(0, 24) + "…" : a.recom}
                  </div>
                  <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ padding: "5px 8px", fontSize: 10, width: "100%", justifyContent: "center" }} onClick={(e) => { e.stopPropagation(); onAgregar(a); }}>
                    <Icon name="plus" size={10} />Agregar a Labores
                  </button>
                  <div className="row gap-4">
                    <button className="mc-btn mc-btn--sm" style={{ padding: "5px 8px", fontSize: 10, flex: 1, justifyContent: "center", background: "var(--mc-green-50)", color: "var(--mc-green-700)", border: "1px solid var(--mc-green-200)" }} onClick={(e) => { e.stopPropagation(); onResolver(a); }} title="Marcar la alerta como resuelta (queda en el historial, deja de estar activa)">
                      <Icon name="check" size={10} />Resolver
                    </button>
                    <button className="mc-icon-btn" style={{ width: 28, height: 28, border: "1px solid var(--mc-line)", color: "var(--mc-red)", flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); onEliminar(a); }} title="Eliminar la alerta (para errores o falsos positivos)">
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className="col gap-14">
          {(() => {
            const rank = { red: 3, amber: 2, green: 1 } as const;
            // Muestra la estrategia de la alerta ELEGIDA; si no hay elegida, la más prioritaria.
            const elegida = alertas.find((a) => a.id && a.id === seleccionadaId);
            const prioritaria = elegida || [...alertas].sort((a, b) => rank[b.riesgoColor] - rank[a.riesgoColor])[0];
            return prioritaria ? <EstrategiaControl alerta={prioritaria} /> : <EstrategiaVacia />;
          })()}
          <Probabilidades />
        </div>
      </div>
    </>
  );
}

function EstrategiaControl({ alerta }: { alerta: AlertaInfo }) {
  // Si el motor de IA aún no completó la estrategia, la derivamos del catálogo de
  // tratamientos (producto/dosis/costo reales) según la enfermedad y la probabilidad.
  const e = useMemo(() => {
    if (alerta.estrategia) return alerta.estrategia;
    // Si la alerta trae un %, se usa; si viene de la API con solo severidad, se deriva de ella.
    const m = alerta.riesgo.match(/(\d+)%/);
    const prob = m ? Number(m[1])
      : /CR[IÍ]TICA|ALTA/i.test(alerta.riesgo) ? 75
      : /MEDIA/i.test(alerta.riesgo) ? 45
      : /BAJA/i.test(alerta.riesgo) ? 20
      : 50;
    const p = prescripcionPara({ amenaza: alerta.enfermedad, probabilidad: prob });
    return { producto: p.producto, dosis: p.dosis, ventana: "Esta semana", costo: `US$${Math.round(p.costoHa)}/ha`, analisis: p.resumen };
  }, [alerta]);
  return (
    <div className="mc-card ia-card">
      <div className="mc-card__head">
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mc-green-100)", display: "grid", placeItems: "center", color: "var(--mc-green-700)" }}>
            <Icon name="flask" size={15} />
          </div>
          <div className="mc-card__title">Estrategia de Control Sugerida</div>
        </div>
        <IABadge />
      </div>
      <div className="text-xs text-muted">Tratamiento prioritario para {alerta.enfermedad}</div>
      <div className="font-semi mt-4" style={{ color: "var(--mc-ink)", fontSize: 16 }}>{e?.producto || alerta.recom}</div>
      <div className="text-xs text-muted">{alerta.lote} · {alerta.riesgo}</div>
      <div className="grid g-cols-3 gap-8 mt-12">
        <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 16 }}><Icon name="droplet" size={16} /></div>
          <div className="text-xs text-muted">Dosis</div>
          <div className="font-semi text-sm">{e?.dosis || "—"}</div>
        </div>
        <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 16 }}><Icon name="sun" size={16} /></div>
          <div className="text-xs text-muted">Ventana Óptima</div>
          <div className="font-semi text-sm">{e?.ventana || "—"}</div>
        </div>
        <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Icon name="dollar" size={16} /></div>
          <div className="text-xs text-muted">Costo Estimado</div>
          <div className="font-semi text-sm">{e?.costo || "—"}</div>
        </div>
      </div>
      <div className="text-xs mt-8" style={{ padding: 8, background: "var(--mc-green-50)", borderRadius: 6, color: "var(--mc-text)" }}>
        <span className="font-semi" style={{ color: "var(--mc-green-700)" }}>Análisis IA:</span>{" "}
        {e?.analisis || "La recomendación detallada se generará con el motor de IA al analizar esta detección."}
      </div>
    </div>
  );
}

function EstrategiaVacia() {
  return (
    <div className="mc-card ia-card">
      <div className="mc-card__head">
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mc-surface-3)", display: "grid", placeItems: "center", color: "var(--mc-text-3)" }}>
            <Icon name="flask" size={15} />
          </div>
          <div className="mc-card__title">Estrategia de Control Sugerida</div>
        </div>
        <IABadge />
      </div>
      <div className="mc-empty" style={{ marginTop: 4 }}>
        <div className="mc-empty__icon"><Icon name="shieldCheck" size={22} /></div>
        Sin estrategia de control. Cuando se reporte o detecte una plaga, la IA sugiere acá el tratamiento, la dosis y la ventana de aplicación.
      </div>
    </div>
  );
}

type Prescripcion = { producto: string; principioActivo: string; dosis: string; costoHa: number; perdidaPotencialHa: number; ahorroHa: number; roi: number; resumen: string };
type RiesgoClima = { amenaza: string; cultivo: string; lote: string; nivel: "Alto" | "Medio" | "Bajo"; probabilidad: number; ventana: string; causa: string; prescripcion?: Prescripcion };

function Probabilidades() {
  const [riesgosRaw, setRiesgosRaw] = useState<RiesgoClima[]>([]);
  const [cargando, setCargando] = useState(true);
  const [simulado, setSimulado] = useState(false);
  const { lotes: scopeLotes, loteActivo } = useLoteScope();

  useEffect(() => {
    fetch("/api/lotes/presion-plagas")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.riesgos)) setRiesgosRaw(d.riesgos);
        setSimulado(Boolean(d?.simulado));
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  // Acota los riesgos al alcance Campo → Lote del sidebar (por nombre de lote).
  const riesgos = useMemo(() => {
    const nombres = new Set((loteActivo ? [loteActivo] : scopeLotes).map((l) => l.nombre));
    return nombres.size === 0 ? riesgosRaw : riesgosRaw.filter((r) => nombres.has(r.lote));
  }, [riesgosRaw, scopeLotes, loteActivo]);

  const colorDe = (n: string) => (n === "Alto" ? "#d13a3a" : n === "Medio" ? "#d9a538" : "#768f44");
  const lightDe = (n: string) => (n === "Alto" ? "#e85f5f" : n === "Medio" ? "#e8b859" : "#6db870");

  return (
    <div className="mc-card ia-card">
      <div className="mc-card__head">
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <div className="mc-card__title">Presión pronosticada</div>
          <IABadge />
        </div>
        <span className="text-xs text-muted">Clima · próx. 5d</span>
      </div>
      {cargando ? (
        <div className="text-sm text-muted" style={{ padding: "20px 4px", textAlign: "center" }}>Analizando el pronóstico…</div>
      ) : riesgos.length === 0 ? (
        <div className="mc-empty" style={{ marginTop: 4 }}>
          <div className="mc-empty__icon"><Icon name="shieldCheck" size={22} /></div>
          Sin presión significativa pronosticada para los próximos días según el clima de tus lotes.
        </div>
      ) : (
        <div className="col gap-10">
          {riesgos.map((p, i) => {
            const color = colorDe(p.nivel); const colorLight = lightDe(p.nivel);
            return (
              <div key={i} style={{ padding: "12px 14px", background: `${color}14`, borderRadius: 10, border: `1px solid ${color}30`, borderLeft: `4px solid ${color}` }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div className="row gap-10" style={{ alignItems: "center", flex: 1, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: color, color: "white", display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13, lineHeight: 1.2 }}>{p.amenaza}</div>
                      <div className="text-xs text-muted">{p.cultivo} · {p.ventana}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{Math.round(p.probabilidad)}%</div>
                </div>
                <div style={{ height: 6, background: `${color}20`, borderRadius: 999, marginTop: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${p.probabilidad}%`, background: `linear-gradient(90deg, ${color}, ${colorLight})`, borderRadius: 999 }}></div>
                </div>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 8, fontSize: 11 }}>
                  <span style={{ color, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="cloud" size={13} /> {p.causa}</span>
                  <span style={{ padding: "2px 8px", background: "var(--mc-surface)", border: `1px solid ${color}40`, borderRadius: 999, fontSize: 10, fontWeight: 700, color }}>{p.lote}</span>
                </div>
                {p.prescripcion && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--mc-green-50)", border: "1px solid var(--mc-green-200)", borderRadius: 9 }}>
                    <div className="row gap-6" style={{ alignItems: "center", marginBottom: 4 }}>
                      <Icon name="flask" size={13} style={{ color: "var(--mc-green-700)" }} />
                      <span className="font-semi text-xs" style={{ color: "var(--mc-green-700)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Acción recomendada</span>
                      <span className="mc-badge mc-badge--green" style={{ marginLeft: "auto", fontSize: 10 }}>ROI {p.prescripcion.roi}x</span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--mc-ink)", lineHeight: 1.45 }}>{p.prescripcion.resumen}</div>
                    <div className="row gap-10 mt-4" style={{ fontSize: 10.5, color: "var(--mc-text-2)" }}>
                      <span><b style={{ color: "var(--mc-ink)" }}>Costo</b> US${p.prescripcion.costoHa}/ha</span>
                      <span><b style={{ color: "var(--mc-ink)" }}>Evita perder</b> US${Math.round(p.prescripcion.ahorroHa)}/ha</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="text-xs text-muted" style={{ textAlign: "center" }}>
            {simulado ? "Estimación por reglas climáticas" : "Refinado con IA"} · fuente Open-Meteo
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== SUBTAB ANÁLISIS IA — visión real (foto del lote → diagnóstico) ========== */
function EnfermedadesAnalisisIA({
  fileRef, lotes, toast, onGuardado,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  lotes: { id?: string; nombre: string; cultivo?: string }[];
  toast: ReturnType<typeof useToast>;
  onGuardado?: () => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [modo, setModo] = useState<"Cajas" | "Mapa de Calor" | "Alto Contraste">("Cajas");
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<Analisis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loteId, setLoteId] = useState("");
  const [creandoLabor, setCreandoLabor] = useState(false);

  useEffect(() => {
    if (!loteId && lotes.find((l) => l.id)) setLoteId(lotes.find((l) => l.id)!.id!);
  }, [lotes, loteId]);

  const loteSel = lotes.find((l) => l.id === loteId);

  const analizar = (file: File) => {
    setAnalizando(true);
    setError(null);
    setResultado(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImgUrl(dataUrl);
      const thumb = await hacerThumb(dataUrl);
      try {
        const res = await fetch("/api/deteccion-enfermedades/analizar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl, mediaType: file.type, loteId, cultivo: loteSel?.cultivo, thumb }),
        });
        const d = await res.json();
        if (!res.ok || d.error) {
          setError(d.error || "No se pudo analizar la imagen");
        } else {
          setResultado(d);
          if (d.guardado) onGuardado?.();
          toast.show(
            d.guardado
              ? `Detección guardada: ${d.enfermedad} (${d.confianzaGlobal}%) — ya figura en Información`
              : `Detección: ${d.enfermedad} (${d.confianzaGlobal}%)`
          );
        }
      } catch {
        setError("No se pudo analizar la imagen");
      }
      setAnalizando(false);
    };
    reader.readAsDataURL(file);
  };

  const agregarLabor = async () => {
    if (!resultado) return;
    if (!loteId) {
      toast.show("Elegí el lote de la foto antes de guardar", "err");
      return;
    }
    setCreandoLabor(true);
    try {
      const res = await fetch("/api/labores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Pulverización",
          fecha: new Date().toISOString().split("T")[0],
          loteId,
          descripcion: `Tratamiento ${resultado.enfermedad} — ${resultado.recomendacion.producto}`,
          observaciones: `Detección IA (${resultado.confianzaGlobal}% conf.) · ${resultado.recomendacion.dosis} · ${resultado.recomendacion.costoEstimadoHa} · ${resultado.recomendacion.ventanaAplicacion}`,
          estado: "Programada",
          prioridad: resultado.severidad === "Alta" ? "Urgente" : "Normal",
        }),
      });
      if (!res.ok) throw new Error();
      toast.show("Tratamiento agendado en Labores");
    } catch {
      toast.show("No se pudo crear la labor", "err");
    } finally {
      setCreandoLabor(false);
    }
  };

  const datos = resultado;

  return (
    <div className="grid mc-2col-resp" style={{ gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) analizar(f);
        }}
      />
      <div className="mc-card ia-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Detección por foto</div>
          <div className="row gap-8" style={{ alignItems: "center" }}>
            {lotes.some((l) => l.id) && (
              <select
                className="mc-select"
                style={{ padding: "5px 8px", fontSize: 12, maxWidth: 150 }}
                value={loteId}
                onChange={(e) => setLoteId(e.target.value)}
              >
                <option value="">Lote…</option>
                {lotes.filter((l) => l.id).map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            )}
            <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => fileRef.current?.click()}>
              <Icon name="camera" size={12} />{imgUrl ? "Cambiar" : "Foto"}
            </button>
          </div>
        </div>

        {imgUrl ? (
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", background: "#000", borderRadius: 10, overflow: "hidden" }}>
            <img src={imgUrl} alt="Lote analizado" style={{ width: "100%", height: "100%", objectFit: "cover", filter: modo === "Alto Contraste" ? "contrast(1.6) saturate(1.5)" : "none" }} />
            {analizando && (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.45)", color: "white", fontWeight: 600 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", margin: "0 auto 10px", animation: "mcspin 0.8s linear infinite" }}></div>
                  Analizando con IA…
                </div>
              </div>
            )}
            {datos && !analizando && datos.lesiones.map((b, i) => {
              if (modo === "Cajas") {
                return <div key={i} style={{ position: "absolute", left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%`, border: "2px solid #ff6b1a", borderRadius: 3, background: "rgba(255,107,26,0.12)" }} title={`${b.etiqueta} · ${b.confianza}%`} />;
              }
              if (modo === "Mapa de Calor") {
                return <div key={i} style={{ position: "absolute", left: `${(b.x - 0.03) * 100}%`, top: `${(b.y - 0.03) * 100}%`, width: `${(b.w + 0.06) * 100}%`, height: `${(b.h + 0.06) * 100}%`, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,40,0,${0.4 + b.confianza / 300}) 0%, rgba(255,150,0,0.3) 50%, transparent 75%)` }} />;
              }
              return null;
            })}
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{ width: "100%", aspectRatio: "16/10", border: "2px dashed var(--mc-line)", borderRadius: 10, background: "var(--mc-surface-2)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mc-text-2)" }}
          >
            <div style={{ textAlign: "center" }}>
              <Icon name="camera" size={30} />
              <div className="text-sm" style={{ marginTop: 8, fontWeight: 600 }}>Sacá o cargá una foto de la planta</div>
              <div className="text-xs text-muted mt-4">La IA detecta la enfermedad, marca las lesiones y te sugiere el tratamiento.</div>
            </div>
          </button>
        )}

        {datos && imgUrl && (
          <div className="row gap-8 mt-12" style={{ justifyContent: "center" }}>
            {(["Cajas", "Mapa de Calor", "Alto Contraste"] as const).map((m) => (
              <button key={m} className={`mc-btn mc-btn--sm ${modo === m ? "mc-btn--slate" : "mc-btn--secondary"}`} onClick={() => setModo(m)}>{m}</button>
            ))}
          </div>
        )}
        {error && <div className="text-xs mt-8" style={{ textAlign: "center", color: "var(--mc-red)" }}>{error}</div>}
      </div>

      <div className="col gap-14">
        <div className="mc-card ia-card">
          <div className="mc-card__head"><div className="mc-card__title">Resultado del análisis</div><IABadge /></div>
          {!datos ? (
            <div className="mc-empty" style={{ minHeight: 140 }}>
              <div className="mc-empty__icon"><Icon name="eye" size={20} /></div>
              <div className="mc-empty__text">El diagnóstico de la IA va a aparecer acá cuando analices una foto.</div>
            </div>
          ) : (
            <div className="row gap-16" style={{ alignItems: "center" }}>
              <DonutConfianza pct={datos.confianzaGlobal} />
              <div style={{ flex: 1 }}>
                <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 16 }}>
                  {datos.enfermedad}{" "}
                  {datos.nombreCientifico && <span style={{ fontStyle: "italic", color: "var(--mc-text-2)", fontSize: 13 }}>({datos.nombreCientifico})</span>}
                </div>
                <span className={`mc-badge mt-4 ${datos.severidad === "Alta" ? "mc-badge--red" : datos.severidad === "Media" ? "mc-badge--amber" : "mc-badge--green"}`}>⬤ Severidad {datos.severidad}</span>
                <div className="col gap-4 mt-12">
                  {datos.lesiones.slice(0, 3).map((l, i) => (
                    <div key={i} className="row gap-6" style={{ alignItems: "center", fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mc-orange-500)" }}></span>
                      <span>{l.etiqueta} - <span className="font-semi">{l.confianza}%</span></span>
                    </div>
                  ))}
                </div>
                {datos.lesiones.length > 3 && (
                  <div className="text-xs text-muted mt-8">+{datos.lesiones.length - 3} lesiones detectadas (marcadas en la imagen).</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mc-card ia-card">
          <div className="mc-card__head">
            <div className="row gap-8" style={{ alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mc-green-100)", display: "grid", placeItems: "center", color: "var(--mc-green-700)" }}>
                <Icon name="flask" size={15} />
              </div>
              <div className="mc-card__title">Recomendación</div>
            </div>
            <IABadge />
          </div>
          {!datos ? (
            <div className="mc-empty" style={{ minHeight: 140 }}>
              <div className="mc-empty__icon"><Icon name="flask" size={20} /></div>
              <div className="mc-empty__text">La estrategia de control y su costo por hectárea van a aparecer acá.</div>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted">Estrategia de control sugerida</div>
              <div className="font-semi mt-4" style={{ color: "var(--mc-ink)", fontSize: 16 }}>{datos.recomendacion.producto}</div>
              <div className="grid g-cols-3 gap-8 mt-12">
                <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 16 }}><Icon name="droplet" size={16} /></div>
                  <div className="text-xs text-muted">Dosis</div>
                  <div className="font-semi text-sm">{datos.recomendacion.dosis}</div>
                </div>
                <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 16 }}><Icon name="sun" size={16} /></div>
                  <div className="text-xs text-muted">Ventana</div>
                  <div className="font-semi text-sm">{datos.recomendacion.ventanaAplicacion}</div>
                </div>
                <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center" }}><Icon name="dollar" size={16} /></div>
                  <div className="text-xs text-muted">Costo</div>
                  <div className="font-semi text-sm">{datos.recomendacion.costoEstimadoHa}</div>
                </div>
              </div>
              <div className="text-xs mt-8" style={{ padding: 8, background: "var(--mc-green-50)", borderRadius: 6, color: "var(--mc-text)" }}>
                <span className="font-semi" style={{ color: "var(--mc-green-700)" }}>Análisis IA:</span> {datos.analisis}
              </div>
              <button className="mc-btn mc-btn--primary mc-btn--sm mt-12" style={{ width: "100%", justifyContent: "center" }} onClick={agregarLabor} disabled={creandoLabor || !loteId}>
                <Icon name="plus" size={12} />{creandoLabor ? "Agendando…" : "Agregar tratamiento a Labores"}
              </button>
              <a
                className="mc-btn mc-btn--secondary mc-btn--sm mt-8"
                style={{ width: "100%", justifyContent: "center" }}
                href={`/calculadora-dosis?producto=${encodeURIComponent(datos.recomendacion.producto || "")}&dosis=${encodeURIComponent(datos.recomendacion.dosis || "")}${loteId ? `&loteId=${loteId}` : ""}`}
              >
                <Icon name="beaker" size={12} />Calcular dosis exacta
              </a>
              {!loteId && <div className="text-xs text-muted mt-4" style={{ textAlign: "center" }}>Elegí el lote arriba para poder agendar.</div>}
            </>
          )}
        </div>
      </div>
      <style jsx global>{`@keyframes mcspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DonutConfianza({ pct }: { pct: number }) {
  const c = 75, r = 58, sw = 12;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="150" height="150" viewBox="0 0 150 150">
      <defs>
        <linearGradient id="confGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#768f44" />
          <stop offset="100%" stopColor="#7ec47f" />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--mc-line)" strokeWidth={sw} opacity="0.5" />
      <circle cx={c} cy={c} r={r} fill="none" stroke="url(#confGrad)" strokeWidth={sw} strokeDasharray={`${(pct / 100) * circ} ${circ}`} transform={`rotate(-90 ${c} ${c})`} strokeLinecap="round" />
      <text x={c} y={c - 2} textAnchor="middle" fontSize="30" fontFamily="var(--ff-display)" fontWeight="800" fill="var(--mc-ink)">{pct}%</text>
      <text x={c} y={c + 16} textAnchor="middle" fontSize="9" fontFamily="var(--ff-ui)" fontWeight="700" fill="var(--mc-text-2)" letterSpacing="0.08em">Confianza Global</text>
    </svg>
  );
}
