"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon, KPI, SubTabs, IABadge, useToast } from "@/components/mc";
import { demo } from "@/lib/demo";
import { useSetHeaderActions } from "./ActionsContext";
import { ReportarPlagaModal } from "./deteccion-ReportarModal";

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
  lote: string;
  loteId?: string;
  enfermedad: string;
  estadio: string;
  img: string;
  imgBg: string;
  deteccion: string;
  afect: string;
  riesgo: string;
  riesgoColor: "red" | "amber" | "green";
  perdida: string;
  proy: string;
  recom: string;
  iaIcon?: boolean;
};

const ALERTAS_DEMO: AlertaInfo[] = [
  { lote: "Lote 4 (Maíz)", enfermedad: "Roya Común", estadio: "R1 (Floración)", img: "wheat", imgBg: "linear-gradient(135deg,#c0392b,#922b21)", deteccion: "Detección Satelital IVN", afect: "15 Ha afectadas · Hace 2h", riesgo: "ALTA (35%)", riesgoColor: "red", perdida: "$4.500 USD", proy: "Proyección a cosecha", recom: "Aplicar Fungicida (Triazol)", iaIcon: true },
  { lote: "Lote 2 (Maíz)", enfermedad: "Oruga Cogollera", estadio: "V8 (Vegetativo)", img: "bug", imgBg: "linear-gradient(135deg,#6db870,#4f9d52)", deteccion: "Foto de Monitoreo (Dron)", afect: "8 Ha afectadas · Ayer", riesgo: "MEDIA (15%)", riesgoColor: "amber", perdida: "$1.200 USD", proy: "Daño foliar progresivo", recom: "Monitoreo + Insecticida" },
  { lote: "Lote 7 (Soja)", enfermedad: "Mancha Marrón", estadio: "R3 (Form. Vainas)", img: "sprout", imgBg: "linear-gradient(135deg,#d9a538,#c48410)", deteccion: "Detección Satelital IVN", afect: "20 Ha afectadas · Hace 4h", riesgo: "BAJA (5%)", riesgoColor: "green", perdida: "$500 USD", proy: "Impacto leve", recom: "Monitoreo Intensivo", iaIcon: true },
  { lote: "Lote 1 (Trigo)", enfermedad: "Pulgón Verde", estadio: "Z31 (Primer Nudo)", img: "wheat", imgBg: "linear-gradient(135deg,#a88032,#d9a538)", deteccion: "Foto de Campo", afect: "30 Ha afectadas · Hace 1h", riesgo: "ALTA (40%)", riesgoColor: "red", perdida: "$3.200 USD", proy: "Rápida propagación", recom: "Aplicar Insecticida Sistémico" },
  { lote: "Lote 5 (Girasol)", enfermedad: "Esclerotinia", estadio: "R5 (Llenado Grano)", img: "leaf", imgBg: "linear-gradient(135deg,#e8b94a,#d9a538)", deteccion: "Detección Satelital IVN", afect: "12 Ha afectadas · Ayer", riesgo: "MEDIA (20%)", riesgoColor: "amber", perdida: "$2.100 USD", proy: "Riesgo de vuelco", recom: "Evaluar Daño y Cosecha Anticipada", iaIcon: true },
];

export default function TabDeteccion() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [sub, setSub] = useState("Información");
  const [reportarOpen, setReportarOpen] = useState(searchParams.get("modal") === "reportar");
  const [lotes, setLotes] = useState<{ id?: string; nombre: string; cultivo?: string }[]>([]);
  const [alertas, setAlertas] = useState<AlertaInfo[]>(demo(ALERTAS_DEMO, []));
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/lotes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d) && d.length > 0)
          setLotes(d.map((l: { id: string; nombre: string; cultivo?: string }) => ({ id: l.id, nombre: l.nombre, cultivo: l.cultivo })));
      })
      .catch(() => {});

    fetch("/api/deteccion-enfermedades")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        setAlertas(
          d.slice(0, 6).map((a: { lote?: { nombre: string; cultivo?: string }; loteId: string; plaga: string; severidad: string; areaAfectada?: number; recomendacion?: string; metodoDeteccion?: string }) => {
            const sevColor: "red" | "amber" | "green" = a.severidad === "Alta" || a.severidad === "Crítica" ? "red" : a.severidad === "Media" ? "amber" : "green";
            return {
              lote: `${a.lote?.nombre || "Lote"} (${a.lote?.cultivo || "—"})`,
              loteId: a.loteId,
              enfermedad: a.plaga,
              estadio: "—",
              img: "leaf",
              imgBg: "linear-gradient(135deg,#6db870,#4f9d52)",
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
  }, []);

  useSetHeaderActions(
    <>
      <button className="mc-btn mc-btn--primary" onClick={() => { setSub("Análisis (IA)"); setTimeout(() => fileRef.current?.click(), 100); }}>
        <Icon name="upload" size={14} />Cargar Imagen de Lote
      </button>
      <button className="mc-btn" style={{ background: "#e7892b", color: "white" }} onClick={() => setReportarOpen(true)}>
        <Icon name="alert" size={14} />Reportar Plaga
      </button>
    </>,
    []
  );

  const agregarALabores = async (a: AlertaInfo) => {
    if (a.loteId) {
      await fetch("/api/labores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Pulverización", fecha: new Date().toISOString().slice(0, 10), loteId: a.loteId,
          superficieTrabajada: 0, descripcion: `Control: ${a.enfermedad}`, prioridad: "Urgente",
          observaciones: `Recomendación IA: ${a.recom}`,
        }),
      }).catch(() => {});
    }
    toast.show(`"${a.recom}" agregado a Labores para ${a.lote}`);
  };

  const generarAlerta = async (data: { loteId?: string; plaga: string; tipo: string; incidencia: number; observaciones: string }) => {
    if (data.loteId) {
      await fetch("/api/deteccion-enfermedades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    const sevColor: "red" | "amber" | "green" = data.incidencia >= 50 ? "red" : data.incidencia >= 20 ? "amber" : "green";
    setAlertas((prev) => [
      {
        lote: `${lotes.find((l) => l.id === data.loteId)?.nombre || "Lote"} (${data.tipo})`,
        loteId: data.loteId, enfermedad: data.plaga, estadio: "—", img: "bug",
        imgBg: "linear-gradient(135deg,#6db870,#4f9d52)", deteccion: "Reporte Manual",
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
        <KPI label="Alertas Activas" value={String(alertas.length)} delta={demo("2 críticas", "—")} trend="warn" icon="alert" warn />
        <KPI label="Confianza IA" value={demo("96%", "—")} delta={demo("Alta precisión", "—")} trend="up" icon="target" accent ia />
        <KPI label="Vigor Promedio (NDVI)" value={demo("0.78", "—")} delta={demo("(Alto)", "—")} trend="up" icon="leaf" />
        <KPI label="Riesgo Economico" value={demo("$1.250", "—")} delta={demo("USD/Ha potencial", "—")} trend="warn" icon="dollar" />
        <KPI label="Monitoreo Semanal" value={demo("85%", "—")} delta={demo("17/20 lotes", "—")} trend="up" icon="check" />
      </div>

      <SubTabs tabs={["Información", "Análisis (IA)"]} active={sub} onChange={setSub} />

      {sub === "Información" && <EnfermedadesInfo alertas={alertas} onAgregar={agregarALabores} />}
      {sub === "Análisis (IA)" && <EnfermedadesAnalisisIA fileRef={fileRef} lotes={lotes} toast={toast} onAgregar={() => toast.show("Tratamiento agregado a Labores")} />}
    </>
  );
}

/* ========== SUBTAB INFORMACIÓN (Figma EnfermedadesInfo) ========== */
function EnfermedadesInfo({ alertas, onAgregar }: { alertas: AlertaInfo[]; onAgregar: (a: AlertaInfo) => void }) {
  const [enlarged, setEnlarged] = useState<AlertaInfo | null>(null);

  return (
    <>
      {enlarged && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "grid", placeItems: "center" }} onClick={() => setEnlarged(null)}>
          <div style={{ background: "var(--mc-surface)", borderRadius: 14, padding: 20, width: 460, maxWidth: "92vw", boxShadow: "0 12px 48px rgba(0,0,0,0.35)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "100%", aspectRatio: "16/10", background: enlarged.imgBg, borderRadius: 10, position: "relative", marginBottom: 14, overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 64 }}><Icon name={enlarged.img} size={64} /></div>
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
      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <div className="mc-card ia-card">
          <div className="mc-card__head"><div className="mc-card__title">Alertas Activas</div><IABadge /></div>
          <div className="col gap-8">
            {alertas.map((a, i) => (
              <div key={i} style={{ padding: "10px 12px", border: "1px solid var(--mc-line)", borderRadius: 10, display: "grid", gridTemplateColumns: "120px 1fr 100px 120px 130px 150px", gap: 10, alignItems: "center" }}>
                <div style={{ width: 120, height: 80, borderRadius: 8, background: a.imgBg, position: "relative", overflow: "hidden", cursor: "pointer", flexShrink: 0 }} onClick={() => setEnlarged(a)}>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)", fontSize: 32 }}><Icon name={a.img} size={32} /></div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.65)", padding: "4px 6px" }}>
                    <div style={{ color: "white", fontSize: 9, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.deteccion}</div>
                  </div>
                </div>
                <div>
                  <div className="row gap-4" style={{ alignItems: "center" }}>
                    {a.iaIcon && <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg, #6b46c1, #4f9d52)", display: "grid", placeItems: "center" }}><Icon name="sprout" size={10} style={{ color: "white" }} /></div>}
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
                  <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ padding: "5px 8px", fontSize: 10, width: "100%", justifyContent: "center" }} onClick={() => onAgregar(a)}>
                    <Icon name="plus" size={10} />Agregar a Labores
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col gap-14">
          <EstrategiaControl />
          <Probabilidades />
        </div>
      </div>
    </>
  );
}

function EstrategiaControl() {
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
      <div className="text-xs text-muted">Estrategia de Control Sugerida</div>
      <div className="font-semi mt-4" style={{ color: "var(--mc-ink)", fontSize: 16 }}>Fungicida (Triazol + Estrob.)</div>
      <div className="text-xs text-muted">Tratamiento Prioritario para Roya</div>
      <div className="grid g-cols-3 gap-8 mt-12">
        <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 16 }}><Icon name="droplet" size={16} /></div>
          <div className="text-xs text-muted">Dosis</div>
          <div className="font-semi text-sm">400 cc/Ha</div>
        </div>
        <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 16 }}><Icon name="sun" size={16} /></div>
          <div className="text-xs text-muted">Venta Óptima</div>
          <div className="font-semi text-sm">Próx. 4hs</div>
        </div>
        <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Icon name="dollar" size={16} /></div>
          <div className="text-xs text-muted">Costo Estimado</div>
          <div className="font-semi text-sm">$28/Ha</div>
        </div>
      </div>
      <div className="text-xs mt-8" style={{ padding: 8, background: "var(--mc-green-50)", borderRadius: 6, color: "var(--mc-text)" }}>
        <span className="font-semi" style={{ color: "var(--mc-green-700)" }}>Análisis IA:</span> Eficacia contra la roya en ensayos de campo. La combinación Triazol + Estrobilurina ofrece control preventivo, curativo y antirresistencia.
      </div>
    </div>
  );
}

function Probabilidades() {
  const probs = demo([
    { rank: 1, nombre: "Roya Común", cientifico: "Puccinia sorghi", pct: 88, color: "#d13a3a", colorLight: "#e85f5f", tinte: "rgba(209,58,58,0.08)", tendencia: "up", deltaText: "+12% vs ayer", lotes: ["Lote 4", "Lote 7"] },
    { rank: 2, nombre: "Tizón del Maíz", cientifico: "Exserohilum turcicum", pct: 42, color: "#d9a538", colorLight: "#e8b859", tinte: "rgba(217,165,56,0.08)", tendencia: "flat", deltaText: "Estable", lotes: ["Lote 2"] },
    { rank: 3, nombre: "Cercospora", cientifico: "Mancha Gris", pct: 15, color: "#4f9d52", colorLight: "#6db870", tinte: "rgba(79,157,82,0.08)", tendencia: "down", deltaText: "Bajando", lotes: ["Lote 5 (Sector Norte)"] },
  ], [] as { rank: number; nombre: string; cientifico: string; pct: number; color: string; colorLight: string; tinte: string; tendencia: string; deltaText: string; lotes: string[] }[]);
  return (
    <div className="mc-card ia-card">
      <div className="mc-card__head">
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <div className="mc-card__title">Probabilidades</div>
          <IABadge />
        </div>
        <span className="text-xs text-muted">Análisis predictivo · 7d</span>
      </div>
      <div className="col gap-10">
        {probs.map((p, i) => (
          <div key={i} style={{ padding: "12px 14px", background: p.tinte, borderRadius: 10, border: `1px solid ${p.color}30`, borderLeft: `4px solid ${p.color}` }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div className="row gap-10" style={{ alignItems: "center", flex: 1, minWidth: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: p.color, color: "white", display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{p.rank}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13, lineHeight: 1.2 }}>{p.nombre} ({p.cientifico})</div>
                </div>
              </div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, fontWeight: 800, color: p.color, lineHeight: 1 }}>{p.pct}%</div>
            </div>
            <div style={{ height: 6, background: `${p.color}20`, borderRadius: 999, marginTop: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${p.pct}%`, background: `linear-gradient(90deg, ${p.color}, ${p.colorLight})`, borderRadius: 999 }}></div>
            </div>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 8, fontSize: 11 }}>
              <span style={{ color: p.color, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name={p.tendencia === "up" ? "arrowUp" : p.tendencia === "down" ? "arrowDown" : "arrowRight"} size={13} /> Tendencia: {p.deltaText}</span>
              <div className="row gap-4" style={{ alignItems: "center" }}>
                <span className="text-xs text-muted" style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="map" size={12} /> Afectados:</span>
                {p.lotes.map((l, j) => (
                  <span key={j} style={{ padding: "2px 8px", background: "var(--mc-surface)", border: `1px solid ${p.color}40`, borderRadius: 999, fontSize: 10, fontWeight: 700, color: p.color }}>{l}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== SUBTAB ANÁLISIS IA (Figma EnfermedadesAnalisisIA) ========== */
function EnfermedadesAnalisisIA({
  fileRef, lotes, toast, onAgregar,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  lotes: { id?: string; nombre: string; cultivo?: string }[];
  toast: ReturnType<typeof useToast>;
  onAgregar: () => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [modo, setModo] = useState<"Cajas" | "Mapa de Calor" | "Alto Contraste">("Cajas");
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<Analisis | null>(null);

  const analizar = (file: File) => {
    setAnalizando(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImgUrl(dataUrl);
      try {
        const res = await fetch("/api/deteccion-enfermedades/analizar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl, mediaType: file.type, cultivo: lotes[0]?.cultivo }),
        });
        const d = await res.json();
        setResultado(d);
        if (d.simulado) toast.show("Análisis demo (configurá ANTHROPIC_API_KEY para IA real)");
        else toast.show(`Detección completada: ${d.enfermedad} (${d.confianzaGlobal}%)`);
      } catch {
        toast.show("No se pudo analizar la imagen", "err");
      }
      setAnalizando(false);
    };
    reader.readAsDataURL(file);
  };

  const datos = resultado;

  return (
    <div className="grid" style={{ gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
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
          <div className="mc-card__title">Detección</div>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={12} />Cargar Imagen
          </button>
        </div>
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", background: imgUrl ? "#000" : "linear-gradient(135deg, #4f9d52, #5fae62)", borderRadius: 10, overflow: "hidden" }}>
          {imgUrl ? (
            <img src={imgUrl} alt="Lote analizado" style={{ width: "100%", height: "100%", objectFit: "cover", filter: modo === "Alto Contraste" ? "contrast(1.6) saturate(1.5)" : "none" }} />
          ) : (
            <>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #4f9d52 0%, #6db870 50%, #5fae62 100%)" }}></div>
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 400 250" preserveAspectRatio="none">
                <line x1="200" y1="0" x2="200" y2="250" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                {[40, 80, 120, 160, 200].map((y) => (
                  <g key={y}>
                    <line x1="200" y1={y} x2="60" y2={y - 10} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                    <line x1="200" y1={y} x2="340" y2={y - 10} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                  </g>
                ))}
              </svg>
            </>
          )}

          {analizando && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.4)", color: "white", fontWeight: 600 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", margin: "0 auto 10px", animation: "mcspin 0.8s linear infinite" }}></div>
                Analizando con IA...
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
        <div className="row gap-8 mt-12" style={{ justifyContent: "center" }}>
          {(["Cajas", "Mapa de Calor", "Alto Contraste"] as const).map((m) => (
            <button key={m} className={`mc-btn mc-btn--sm ${modo === m ? "mc-btn--slate" : "mc-btn--secondary"}`} onClick={() => setModo(m)}>{m}</button>
          ))}
        </div>
        {!imgUrl && <div className="text-xs text-muted mt-8" style={{ textAlign: "center" }}>Cargá una imagen del lote para detectar enfermedades con IA.</div>}
      </div>

      <div className="col gap-14">
        <div className="mc-card ia-card">
          <div className="mc-card__head"><div className="mc-card__title">Resultados del Analisis:</div><IABadge /></div>
          <div className="row gap-16" style={{ alignItems: "center" }}>
            <DonutConfianza pct={datos?.confianzaGlobal ?? 96} />
            <div style={{ flex: 1 }}>
              <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 16 }}>
                {datos?.enfermedad ?? "Roya Común"}{" "}
                <span style={{ fontStyle: "italic", color: "var(--mc-text-2)", fontSize: 13 }}>({datos?.nombreCientifico ?? "Puccinia sorghi"})</span>
              </div>
              <span className="mc-badge mc-badge--amber mt-4">⬤ Severidad {datos?.severidad ?? "Media"}</span>
              <div className="col gap-4 mt-12">
                {(datos?.lesiones ?? [{ etiqueta: "Lesión A (Foco Principal)", confianza: 98 }, { etiqueta: "Lesión B (Esporulación)", confianza: 92 }, { etiqueta: "Lesión C (Inicial)", confianza: 85 }]).slice(0, 3).map((l, i) => (
                  <div key={i} className="row gap-6" style={{ alignItems: "center", fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mc-orange-500)" }}></span>
                    <span>{l.etiqueta} - <span className="font-semi">{l.confianza}%</span></span>
                  </div>
                ))}
              </div>
              {(datos?.lesiones.length ?? 8) > 3 && (
                <button className="mc-btn mc-btn--ghost mc-btn--sm mt-8" style={{ padding: 0, color: "var(--mc-green-700)", textDecoration: "underline" }}>
                  Ver {(datos?.lesiones.length ?? 8) - 3} detecciones más...
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mc-card ia-card">
          <div className="mc-card__head">
            <div className="row gap-8" style={{ alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mc-green-100)", display: "grid", placeItems: "center", color: "var(--mc-green-700)" }}>
                <Icon name="flask" size={15} />
              </div>
              <div className="mc-card__title">Recomendacion</div>
            </div>
            <IABadge />
          </div>
          <div className="text-xs text-muted">Estrategia de Control Sugerida</div>
          <div className="font-semi mt-4" style={{ color: "var(--mc-ink)", fontSize: 16 }}>{datos?.recomendacion.producto ?? "Fungicida (Triazol + Estrob.)"}</div>
          <div className="text-xs text-muted">Tratamiento Prioritario</div>
          <div className="grid g-cols-3 gap-8 mt-12">
            <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 16 }}><Icon name="droplet" size={16} /></div>
              <div className="text-xs text-muted">Dosis</div>
              <div className="font-semi text-sm">{datos?.recomendacion.dosis ?? "400 cc/Ha"}</div>
            </div>
            <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 16 }}><Icon name="sun" size={16} /></div>
              <div className="text-xs text-muted">Venta Óptima</div>
              <div className="font-semi text-sm">{datos?.recomendacion.ventanaAplicacion ?? "Próx. 4hs"}</div>
            </div>
            <div style={{ padding: 8, background: "var(--mc-surface-2)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center" }}><Icon name="dollar" size={16} /></div>
              <div className="text-xs text-muted">Costo Estimado</div>
              <div className="font-semi text-sm">{datos?.recomendacion.costoEstimadoHa ?? "$28/Ha"}</div>
            </div>
          </div>
          <div className="text-xs mt-8" style={{ padding: 8, background: "var(--mc-green-50)", borderRadius: 6, color: "var(--mc-text)" }}>
            <span className="font-semi" style={{ color: "var(--mc-green-700)" }}>Análisis IA:</span> {datos?.analisis ?? "Eficacia contra la roya en ensayos de campo. La combinación Triazol + Estrobilurina ofrece control preventivo, curativo y antirresistencia."}
          </div>
          {datos && (
            <button className="mc-btn mc-btn--primary mc-btn--sm mt-12" style={{ width: "100%", justifyContent: "center" }} onClick={onAgregar}>
              <Icon name="plus" size={12} />Agregar tratamiento a Labores
            </button>
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
          <stop offset="0%" stopColor="#4f9d52" />
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
