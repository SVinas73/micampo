"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon, KPI, SubTabs, IABadge, Modal, Field, useToast } from "@/components/mc";
import { demo } from "@/lib/demo";
import { useLoteScope } from "@/components/LoteScope";
import { useSetHeaderActions } from "./ActionsContext";
import { NuevaSiembraModal, NuevaCosechaModal, type SiembraData, type CosechaData } from "./cultivos-Modales";
import { CropImg } from "./LoteOverlay";

/* ========== TAB CULTIVOS (Figma CDCultivos) ========== */

type DistCultivo = { nombre: string; ha: number; pct: number; color: string; icon: string };
const CULTIVO_COLOR: Record<string, string> = { Maíz: "#c08a22", Soja: "#768f44", Trigo: "#d9a538", Sorgo: "#8ea65a", Girasol: "#e8b94a", Cebada: "#5e7733", Alfalfa: "#aabd76" };
const CULTIVO_ICON: Record<string, string> = { Maíz: "wheat", Soja: "sprout", Trigo: "wheat", Sorgo: "leaf", Girasol: "sun", Cebada: "wheat", Alfalfa: "leaf" };

type PlanActivo = {
  id?: string;
  titulo: string;
  emoji: string;
  costo: string;
  lotes: string;
  ha: string;
  fecha: string;
  insumo: string;
  densidad: string;
  steps: number;
  color: string;
};

type PlanIA = {
  id?: string;
  sugerencia: string;
  confianza: number;
  nivel: string;
  color: string;
  lotes: string;
  razon: string;
  proy: string;
  beneficio: string;
};

const PLANES_ACTIVOS_DEMO: PlanActivo[] = [
  { titulo: "Maíz Tardío - Lotes Norte", emoji: "wheat", costo: "$45.500 USD", lotes: "4, 5, 8", ha: "320 Ha", fecha: "20-25 Oct", insumo: "Híbrido DK-7210", densidad: "70 pl/Ha", steps: 3, color: "#d9a538" },
  { titulo: "Soja Primera - Lotes Sur", emoji: "sprout", costo: "$62.000 USD", lotes: "9, 12, 15", ha: "450 Ha", fecha: "05-10 Nov", insumo: "Semilla SY 5x1", densidad: "280k pl/Ha", steps: 2, color: "#768f44" },
  { titulo: "Girasol - Lotes Oeste", emoji: "leaf", costo: "$55.000 USD", lotes: "1, 3, 7", ha: "280 Ha", fecha: "15-20 Nov", insumo: "Semilla P245", densidad: "60k pl/Ha", steps: 4, color: "#c08a22" },
];

const PLANES_IA_DEMO: PlanIA[] = [
  { sugerencia: "Rotación a Maíz Tardío", confianza: 92, nivel: "Alta", color: "#768f44", lotes: "Lotes 3 y 7 (Vienen de Soja de 1ra)", razon: "Compactación severa y déficit de N en suelo.", proy: "Margen proyectado: +15% vs. repetir Soja", beneficio: "Beneficio Maíz: aporte clave de rastrojo y mejora estructural." },
  { sugerencia: "Siembra de Cultivo de Cobertura", confianza: 92, nivel: "Alta", color: "#3aa6d9", lotes: "Lotes 2 y 8 (Previo a Soja de 2da)", razon: "Alto riesgo de erosión y presión de malezas invernales.", proy: "Ahorro estimado: $30 USD/Ha en herbicidas", beneficio: "Beneficio Cobertura: protección del suelo, retención de humedad y supresión de malezas." },
  { sugerencia: "Aplicación de Nitrógeno Variable", confianza: 85, nivel: "Media", color: "#c08a22", lotes: "Lotes 5 y 9 (Maíz en V6)", razon: "Variabilidad significativa de N en suelo y zonas de bajo potencial.", proy: "Aumento de rinde estimado: +8% por eficiencia de uso", beneficio: "Beneficio Dosis Variable: optimización de insumos, reducción de costos y menor impacto ambiental." },
];

export default function TabCultivos({ initialSub }: { initialSub?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const navegar = (tab: string) => router.push(`/campo-digital?tab=${encodeURIComponent(tab)}`);
  const { lotes: scopeLotes } = useLoteScope();
  const subParam = searchParams.get("sub");
  const [sub, setSub] = useState(
    initialSub || (subParam && ["Estados", "Planificador de Siembra (IA)", "Análisis de Suelo"].includes(subParam) ? subParam : "Estados")
  );
  const [siembraOpen, setSiembraOpen] = useState(searchParams.get("modal") === "siembra");
  const [cosechaOpen, setCosechaOpen] = useState(false);
  const [analisisOpen, setAnalisisOpen] = useState(false);
  const [lotes, setLotes] = useState<{ id?: string; nombre: string; ha: number; cultivo?: string | null }[]>([]);
  const [distribucion, setDistribucion] = useState<DistCultivo[]>([]);

  useEffect(() => {
    const d = scopeLotes;
    if (d.length > 0) setLotes(d.map((l) => ({ id: l.id, nombre: l.nombre, ha: l.hectareas || 0, cultivo: l.cultivo })));
    // Distribución real por cultivo (0 si no hay lotes con cultivo sembrado)
    const porCultivo = new Map<string, number>();
    d.forEach((l) => {
      if (l.cultivo) porCultivo.set(l.cultivo, (porCultivo.get(l.cultivo) || 0) + (l.hectareas || 0));
    });
    const tot = Array.from(porCultivo.values()).reduce((s, v) => s + v, 0) || 1;
    setDistribucion(
      Array.from(porCultivo.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([nombre, ha]) => ({ nombre, ha: Math.round(ha), pct: Math.round((ha / tot) * 100), color: CULTIVO_COLOR[nombre] || "#5e7733", icon: CULTIVO_ICON[nombre] || "leaf" }))
    );
  }, [scopeLotes]);

  /* ---- Header actions según sub-tab (Figma) ---- */
  useSetHeaderActions(
    sub === "Análisis de Suelo" ? (
      <button className="mc-btn" style={{ background: "#c08a22", color: "white" }} onClick={() => setAnalisisOpen(true)}>
        <Icon name="plus" size={14} />Nuevo Analisis
      </button>
    ) : (
      <>
        <button className="mc-btn mc-btn--primary" onClick={() => setSiembraOpen(true)}>
          <Icon name="sprout" size={14} />Plan de Siembra
        </button>
        <button className="mc-btn mc-btn--primary" onClick={() => setCosechaOpen(true)}>
          <Icon name="plus" size={14} />Nueva Cosecha
        </button>
      </>
    ),
    [sub]
  );

  const guardarSiembra = async (data: SiembraData) => {
    try {
      if (data.loteId) {
        await fetch("/api/siembras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loteId: data.loteId,
            cultivo: data.cultivo,
            variedad: data.variedad || null,
            fechaSiembra: data.fecha,
            hectareas: lotes.find((l) => l.id === data.loteId)?.ha || 0,
            densidad: data.densidad ? parseFloat(data.densidad) : null,
            costoSemilla: data.inversion ? parseFloat(data.inversion) : null,
            observaciones: `Destino: ${data.destinos.join(", ") || "—"} · Recomendación IA insumos: ${data.usarIA ? "Sí" : "No"}`,
          }),
        }).catch(() => {});
      }
      toast.show(`Siembra de ${data.cultivo} en ${data.loteNombre} guardada`);
      setSiembraOpen(false);
    } catch {
      toast.show("No se pudo guardar la siembra", "err");
    }
  };

  const guardarCosecha = async (data: CosechaData) => {
    try {
      if (data.loteId) {
        await fetch("/api/cosechas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loteId: data.loteId,
            fechaCosecha: new Date().toISOString().slice(0, 10),
            rendimiento: parseFloat(data.rendimiento) || 0,
            humedad: parseFloat(data.humedad) || null,
            observaciones: `Impurezas ${data.impurezas}% · ${data.costoTipo} $${data.costoLabor}/Ha · Destino: ${data.destinos.join(", ") || "—"} · Remito: ${data.remito || "—"}${data.cerrarLote ? " · Lote cerrado" : ""}`,
          }),
        }).catch(() => {});
      }
      toast.show(`Cosecha de ${data.cultivo} registrada: ${data.rendimiento} Tn${data.cerrarLote ? " · Lote cerrado" : ""}`);
      setCosechaOpen(false);
    } catch {
      toast.show("No se pudo registrar la cosecha", "err");
    }
  };

  return (
    <>
      {toast.node}
      {siembraOpen && <NuevaSiembraModal lotes={lotes} onClose={() => setSiembraOpen(false)} onConfirm={guardarSiembra} />}
      {cosechaOpen && (
        <NuevaCosechaModal
          cultivosListos={demo([
            { loteId: lotes[1]?.id, lote: "Lote 4", cultivo: "Maíz", estado: "Listo para cosecha", madurez: 100, humedad: 14 },
            { loteId: lotes[2]?.id, lote: "Lote 2", cultivo: "Soja", estado: "En crecimiento", madurez: 85, humedad: 18 },
          ], [] as { loteId?: string; lote: string; cultivo: string; estado: string; madurez: number; humedad: number }[])}
          onClose={() => setCosechaOpen(false)}
          onConfirm={guardarCosecha}
        />
      )}
      <NuevoAnalisisModal open={analisisOpen} onClose={() => setAnalisisOpen(false)} lotes={lotes} toast={toast} />

      {sub === "Estados" && (
        <div className="grid g-cols-5">
          <KPI label="Superficie Sembrada" value={demo("235 Ha", "—")} delta={demo("84% del campo", "—")} trend="up" icon="sprout" accent />
          <KPI label="Cosecha Total" value={demo("2.300 Tn", "—")} delta={demo("+14% vs anterior", "—")} trend="up" icon="wrench" />
          <KPI label="Próxima Cosecha" value={demo("Lote 5", "—")} delta={demo("06 oct · Soja", "—")} trend="up" icon="calendar" />
          <KPI label="Lotes Listos" value={demo("3", "0")} delta={demo("Para sembrar", "—")} trend="up" icon="check" />
          <KPI label="Lotes Vacíos" value={demo("5", "0")} delta={demo("Sin asignar", "—")} trend="warn" icon="alert" />
        </div>
      )}
      {sub === "Planificador de Siembra (IA)" && (
        <div className="grid g-cols-5">
          <KPI label="Planes Generados" value={demo("3", "0")} delta={demo("2 esta semana", "—")} trend="up" icon="sprout" accent />
          <KPI label="Planes Aprobados" value={demo("2", "0")} delta={demo("67% conversión", "—")} trend="up" icon="check" />
          <KPI label="Superficie Planificada" value={demo("850 Ha", "—")} delta={demo("Campaña 25/26", "—")} trend="up" icon="map" />
          <KPI label="Inversión Estimada" value={demo("$162.500 USD", "—")} delta={demo("0 ejecutado", "—")} trend="up" icon="dollar" />
          <KPI label="Próxima Siembra" value={demo("03/12/25", "—")} delta={demo("Maíz Tardío", "—")} trend="up" icon="calendar" />
        </div>
      )}
      {sub === "Análisis de Suelo" && (
        <div className="grid g-cols-5">
          <KPI label="Análisis del Año" value={demo("14", "0")} delta={demo("+3 este mes", "—")} trend="up" icon="leaf" accent />
          <KPI label="Lotes Críticos" value={demo("2", "0")} delta={demo("P bajo · Norte/Oeste", "—")} trend="warn" icon="alert" warn />
          <KPI label="Lotes Óptimos" value={demo("9", "0")} delta={demo("64% del total", "—")} trend="up" icon="check" />
          <KPI label="pH Promedio" value={demo("6.4", "—")} delta={demo("Rango óptimo", "—")} trend="up" icon="activity" />
          <KPI label="MO Promedio" value={demo("2.6%", "—")} delta={demo("-0.1 vs 23/24", "—")} trend="down" icon="sprout" />
        </div>
      )}

      <SubTabs tabs={["Estados", "Planificador de Siembra (IA)", "Análisis de Suelo"]} active={sub} onChange={setSub} />

      {sub === "Estados" && <CultivosEstados lotesReales={lotes} onNuevaTarea={() => navegar("Labores")} onVerMapa={() => navegar("Lotes")} distribucion={distribucion} />}
      {sub === "Planificador de Siembra (IA)" && <CultivosPlanificador toast={toast} lotes={lotes} onEditar={() => setSiembraOpen(true)} />}
      {sub === "Análisis de Suelo" && <CultivosAnalisisSuelo toast={toast} onVerMapa={() => navegar("Lotes")} />}
    </>
  );
}

/* ========== ESTADOS (Figma CultivosEstados) ========== */
const ESTADO_COLOR: Record<string, { color: string; bg: string }> = {
  Maíz: { color: "#d9a538", bg: "#fdf6e3" }, Soja: { color: "#768f44", bg: "#f1faf2" }, Trigo: { color: "#c08a22", bg: "#fbf3e6" },
  Girasol: { color: "#e8b94a", bg: "#fdf7e6" }, Cebada: { color: "#8aa353", bg: "#f3f8ec" }, Sorgo: { color: "#b5762f", bg: "#fbf0e6" }, Alfalfa: { color: "#aabd76", bg: "#f5f9ec" },
};

function CultivosEstados({ lotesReales, onNuevaTarea, onVerMapa, distribucion }: { lotesReales: { id?: string; nombre: string; ha: number; cultivo?: string | null }[]; onNuevaTarea: (lote: string) => void; onVerMapa: () => void; distribucion: DistCultivo[] }) {
  const [filtro, setFiltro] = useState(false);
  const [soloActivos, setSoloActivos] = useState(false);
  const base = lotesReales.map((l) => {
    const c = l.cultivo ? (ESTADO_COLOR[l.cultivo] || { color: "#5e7733", bg: "#f1faf2" }) : { color: "#9aa39a", bg: "var(--mc-surface-2)" };
    return {
      id: l.nombre, cultivo: l.cultivo || "Sin cultivo", color: c.color, bg: c.bg,
      siembra: "—", semilla: "—", densidad: "—", inversion: "—",
      estadio: l.cultivo ? "Vegetativo" : "—", agua: "—", gdd: "—", fertilizacion: "—", monitoreo: "—",
      cosechaFecha: "—", rinde: "—", destino: "—", progress: l.cultivo ? 35 : 0, has: Math.round(l.ha), activo: !!l.cultivo,
    };
  });
  const lotesEstados = soloActivos ? base.filter((l) => l.activo) : base;
  return (
    <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
      <div className="mc-card">
        <div className="mc-card__head" style={{ position: "relative" }}>
          <div className="mc-card__title">Estados de los Cultivos</div>
          <button className="mc-icon-btn" onClick={() => setFiltro(!filtro)}>
            <Icon name="filter" size={13} />
          </button>
          {filtro && (
            <>
              <div onClick={() => setFiltro(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
              <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 51, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 10, boxShadow: "var(--sh-lg)", padding: 12, width: 200 }}>
                <label className="row gap-8" style={{ cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={soloActivos} onChange={(e) => setSoloActivos(e.target.checked)} />
                  Solo lotes activos
                </label>
              </div>
            </>
          )}
        </div>
        <div className="col gap-14">
          {lotesEstados.length === 0 && (
            <div className="mc-empty" style={{ padding: 28 }}>
              <div className="mc-empty__icon"><Icon name="sprout" size={20} /></div>
              <div className="mc-empty__text">{soloActivos ? "No hay lotes con cultivo activo." : "Sin lotes. Creá lotes en el tab Lotes y asignales un cultivo."}</div>
            </div>
          )}
          {lotesEstados.map((l, i) => (
            <div key={i} style={{ border: `1.5px solid ${l.color}40`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: l.color, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="row gap-12" style={{ alignItems: "center" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.22)", display: "grid", placeItems: "center", fontSize: 22 }}>
                    <Icon name={l.cultivo === "Maíz" ? "wheat" : "sprout"} size={22} />
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: 16, fontFamily: "var(--ff-display)", lineHeight: 1.2, display: "flex", alignItems: "center", gap: 4 }}>{l.id} ({l.cultivo}) <Icon name="alert" size={14} /></div>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 }}>{l.has} Has | Activo</div>
                  </div>
                </div>
                <button className="mc-btn mc-btn--sm" style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1.5px solid rgba(255,255,255,0.35)", fontSize: 11 }} onClick={() => onNuevaTarea(l.id)}>
                  <Icon name="plus" size={10} />Nueva Tarea
                </button>
              </div>
              <div style={{ height: 4, background: `${l.color}25` }}></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", background: l.bg }}>
                <SeccionLote color={l.color} icon="sprout" titulo="Siembra">
                  <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{l.siembra}</div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                    <Pill label="Semilla" value={l.semilla} />
                    <Pill label="Densidad" value={l.densidad} />
                    <Pill label="Inversión" value={l.inversion} color={l.color} />
                  </div>
                </SeccionLote>
                <SeccionLote
                  color={l.color}
                  icon="activity"
                  titulo="Proceso"
                  extra={<span className="font-mono" style={{ marginLeft: "auto", color: l.color, fontWeight: 700, fontSize: 13 }}>{l.progress}%</span>}
                >
                  <div className="mc-prog" style={{ height: 8, borderRadius: 4, marginBottom: 12 }}>
                    <div className="mc-prog__bar" style={{ width: `${l.progress}%`, background: l.color, borderRadius: 4 }}></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <Pill label="Estadio" value={l.estadio} />
                    <Pill label="Agua acum." value={<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="droplet" size={12} /> {l.agua} | <Icon name="sun" size={12} /> {l.gdd}</span>} />
                  </div>
                </SeccionLote>
                <SeccionLote color={l.color} icon="wrench" titulo="Cosecha">
                  <div className="text-xs text-muted">{l.cosechaFecha}</div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ padding: "8px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 7 }}>
                      <div className="text-xs text-muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>Rinde (IA) <IABadge /></div>
                      <div className="font-semi" style={{ color: l.color, fontSize: 16, marginTop: 2 }}>{l.rinde}</div>
                    </div>
                    <Pill label="Destino" value={l.destino} />
                  </div>
                </SeccionLote>
                <SeccionLote color={l.color} icon="calendar" titulo="Tareas" last>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ padding: "8px 10px", background: `${l.color}10`, borderRadius: 8, borderLeft: `3px solid ${l.color}60` }}>
                      <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Última</div>
                      <div className="font-semi text-xs" style={{ color: "var(--mc-ink)", display: "flex", alignItems: "center", gap: 4 }}><Icon name="alert" size={12} /> {l.fertilizacion}</div>
                    </div>
                    <div style={{ padding: "8px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 8, border: `1px dashed ${l.color}50` }}>
                      <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Próxima</div>
                      <div className="font-semi text-xs" style={{ color: l.color, display: "flex", alignItems: "center", gap: 4 }}><Icon name="alert" size={12} /> {l.monitoreo}</div>
                    </div>
                  </div>
                </SeccionLote>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mc-card">
        <div className="mc-card__head">
          <div>
            <div className="mc-card__eyebrow">Distribución de cultivos</div>
            <div className="mc-card__title mt-2">Resumen:</div>
          </div>
          <span className={`mc-badge ${distribucion.length ? "mc-badge--green" : "mc-badge--neutral"}`} style={{ fontSize: 11 }}>{distribucion.length} activos</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
          <DonutResumen data={distribucion} />
        </div>
        {distribucion.length === 0 ? (
          <div className="text-xs text-muted" style={{ textAlign: "center", padding: "10px 0 4px" }}>
            Sin cultivos sembrados. Cargá una siembra en tus lotes y la distribución se completa sola.
          </div>
        ) : (
          <div className="col gap-10 mt-12">
            {distribucion.map((d) => (
              <div key={d.nombre} style={{ padding: "10px 12px", background: `${d.color}0d`, borderRadius: 10, border: `1px solid ${d.color}25` }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div className="row gap-8" style={{ alignItems: "center" }}>
                    <CropImg cultivo={d.nombre} style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }} />
                    <div>
                      <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13 }}>{d.nombre}</div>
                      <div className="text-xs text-muted">{d.ha} Ha</div>
                    </div>
                  </div>
                  <div className="col" style={{ alignItems: "flex-end", gap: 1 }}>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 800, color: d.color }}>{d.pct}%</div>
                  </div>
                </div>
                <div style={{ height: 4, background: `${d.color}20`, borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${d.pct}%`, background: d.color, borderRadius: 999 }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SeccionLote({ color, icon, titulo, extra, last, children }: { color: string; icon: string; titulo: string; extra?: React.ReactNode; last?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ padding: "14px 18px", borderRight: last ? "none" : `1px solid ${color}25` }}>
      <div className="row gap-6" style={{ alignItems: "center", marginBottom: 10 }}>
        <div style={{ width: 20, height: 20, borderRadius: 6, background: color, display: "grid", placeItems: "center" }}>
          <Icon name={icon} size={11} style={{ color: "white" }} />
        </div>
        <span style={{ color, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{titulo}</span>
        {extra}
      </div>
      {children}
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.7)", borderRadius: 7, fontSize: 11 }}>
      <span className="text-muted">{label}:</span> <span className="font-semi" style={color ? { color } : undefined}>{value}</span>
    </div>
  );
}

function DonutResumen({ data }: { data: DistCultivo[] }) {
  const cx = 130, cy = 130, r = 88, sw = 26, gap = 5;
  const totalHa = data.reduce((s, d) => s + d.ha, 0);
  const vacio = data.length === 0;
  let cumPct = 0;
  const seg = data.map((d) => {
    const startDeg = cumPct * 3.6 - 90;
    cumPct += d.pct;
    const endDeg = cumPct * 3.6 - 90;
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const gapRad = (gap / (2 * Math.PI * r)) * Math.PI * 2;
    return {
      ...d,
      x1: cx + r * Math.cos(startRad + gapRad / 2),
      y1: cy + r * Math.sin(startRad + gapRad / 2),
      x2: cx + r * Math.cos(endRad - gapRad / 2),
      y2: cy + r * Math.sin(endRad - gapRad / 2),
      large: d.pct > 50 ? 1 : 0,
    };
  });
  const ticks = Array.from({ length: 20 }).map((_, i) => {
    const a = ((i * 18 - 90) * Math.PI) / 180;
    const ri = r + sw / 2 + 6;
    const ro = r + sw / 2 + (i % 5 === 0 ? 12 : 9);
    return { x1: cx + ri * Math.cos(a), y1: cy + ri * Math.sin(a), x2: cx + ro * Math.cos(a), y2: cy + ro * Math.sin(a), major: i % 5 === 0 };
  });

  return (
    <svg width="260" height="260" viewBox="0 0 260 260">
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.major ? "var(--mc-line)" : "var(--mc-surface-2)"} strokeWidth={t.major ? 1.5 : 1} opacity="0.7" />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--mc-surface-3)" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--mc-line)" strokeWidth="1" opacity="0.6" />
      {!vacio && seg.map((s, i) => (
        <path key={i} d={`M ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2}`} stroke={s.color} strokeWidth={sw} fill="none" strokeLinecap="round" />
      ))}
      <circle cx={cx} cy={cy} r={r - sw / 2 - 4} fill="var(--mc-surface)" />
      <circle cx={cx} cy={cy} r={r - sw / 2 - 4} fill="none" stroke="var(--mc-line)" strokeWidth="1" opacity="0.5" />
      <text x={cx} y={cy - 18} textAnchor="middle" fontSize="11" fontFamily="var(--ff-ui)" fontWeight="700" fill="var(--mc-text-3)" letterSpacing="0.1em">SUPERFICIE</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="42" fontFamily="var(--ff-display)" fontWeight="800" fill={vacio ? "var(--mc-text-3)" : "var(--mc-ink)"}>{totalHa}</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fontSize="11" fontFamily="var(--ff-mono)" fontWeight="600" fill="var(--mc-text-2)">Ha Totales</text>
      {data.slice(0, 5).map((d, i) => (
        <circle key={i} cx={cx + (i - (Math.min(data.length, 5) - 1) / 2) * 10} cy={cy + 44} r="3" fill={d.color} />
      ))}
    </svg>
  );
}

/* ========== PLANIFICADOR IA (Figma CultivosPlanificador) ========== */
function CultivosPlanificador({
  toast, lotes, onEditar,
}: {
  toast: ReturnType<typeof useToast>;
  lotes: { id?: string; nombre: string; ha: number }[];
  onEditar: () => void;
}) {
  const [activos, setActivos] = useState<PlanActivo[]>(demo(PLANES_ACTIVOS_DEMO, []));
  const [recomendados, setRecomendados] = useState<PlanIA[]>(demo(PLANES_IA_DEMO, []));
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    fetch("/api/planes-siembra")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        const colores = ["#d9a538", "#768f44", "#c08a22"];
        const emojis: Record<string, string> = { Maíz: "wheat", Soja: "sprout", Girasol: "sun", Trigo: "wheat", Sorgo: "leaf" };
        setActivos(
          d.slice(0, 6).map((p: { id: string; cultivo: string; hectareas: number; costoEstimado?: number; fechaSiembraRecomendada: string; variedad?: string; lote?: { nombre: string }; estado?: string }, i: number) => ({
            id: p.id,
            titulo: `${p.cultivo} - ${p.lote?.nombre || "Plan"}`,
            emoji: emojis[p.cultivo] || "leaf",
            costo: `$${Math.round(p.costoEstimado || 0).toLocaleString("es-AR")} USD`,
            lotes: p.lote?.nombre || "—",
            ha: `${Math.round(p.hectareas)} Ha`,
            fecha: new Date(p.fechaSiembraRecomendada).toLocaleDateString("es-AR", { day: "numeric", month: "short" }),
            insumo: p.variedad || "A definir",
            densidad: "—",
            steps: p.estado === "Aprobado" ? 4 : 2,
            color: colores[i % 3],
          }))
        );
      })
      .catch(() => {});
  }, []);

  const regenerar = async () => {
    if (generando) return;
    setGenerando(true);
    try {
      const loteReal = lotes.find((l) => l.id);
      if (!loteReal) throw new Error("sin lote");
      const res = await fetch("/api/planes-siembra/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loteId: loteReal.id }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      if (Array.isArray(d.planes) && d.planes.length > 0) {
        const colores = ["#768f44", "#3aa6d9", "#c08a22"];
        setRecomendados(
          d.planes.map((p: { id?: string; cultivo: string; confianza?: number; analisisIA?: string; lote?: { nombre: string } }, i: number) => {
            let analisis: { justificacion?: string; beneficiosRotacion?: string; margenEstimadoPorHa?: number } = {};
            try {
              analisis = JSON.parse(p.analisisIA || "{}");
            } catch {}
            return {
              id: p.id,
              sugerencia: `Siembra de ${p.cultivo}`,
              confianza: p.confianza || 80,
              nivel: (p.confianza || 80) >= 85 ? "Alta" : "Media",
              color: colores[i % 3],
              lotes: p.lote?.nombre || loteReal.nombre,
              razon: analisis.justificacion || "Recomendación basada en rotación e historial del lote.",
              proy: analisis.margenEstimadoPorHa ? `Margen est. $${analisis.margenEstimadoPorHa}/Ha` : "Proyección económica positiva",
              beneficio: analisis.beneficiosRotacion || "Mejora de la rotación y salud del suelo.",
            };
          })
        );
        toast.show(`${d.planes.length} planes generados con IA`);
      }
    } catch {
      toast.show("IA no disponible: mostrando recomendaciones de ejemplo (configurá ANTHROPIC_API_KEY)", "err");
    }
    setGenerando(false);
  };

  const convertir = async (p: PlanIA) => {
    setRecomendados((prev) => prev.filter((x) => x !== p));
    setActivos((prev) => [
      { titulo: p.sugerencia, emoji: "leaf", costo: "A presupuestar", lotes: p.lotes, ha: "—", fecha: "A definir", insumo: "A definir", densidad: "—", steps: 1, color: p.color },
      ...prev,
    ]);
    if (p.id) {
      await fetch(`/api/planes-siembra/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Aprobado" }),
      }).catch(() => {});
    }
    toast.show(`"${p.sugerencia}" convertido en plan activo`);
  };

  const descartar = async (p: PlanIA) => {
    setRecomendados((prev) => prev.filter((x) => x !== p));
    if (p.id) await fetch(`/api/planes-siembra/${p.id}`, { method: "DELETE" }).catch(() => {});
    toast.show("Sugerencia descartada");
  };

  const generarOrden = async (p: PlanActivo) => {
    const loteReal = lotes.find((l) => l.id);
    if (loteReal?.id) {
      await fetch("/api/labores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Siembra", fecha: new Date().toISOString().slice(0, 10), loteId: loteReal.id,
          superficieTrabajada: loteReal.ha, descripcion: `Orden de trabajo: ${p.titulo}`,
          observaciones: `Insumo: ${p.insumo} · Densidad: ${p.densidad} · Inversión: ${p.costo}`,
        }),
      }).catch(() => {});
    }
    setActivos((prev) => prev.map((x) => (x === p ? { ...x, steps: Math.min(4, x.steps + 1) } : x)));
    toast.show(`Orden de trabajo generada para "${p.titulo}"`);
  };

  return (
    <>
      <div className="mc-card ia-card">
        <div className="mc-card__head">
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <div className="mc-card__title">Planes Activos</div>
            <IABadge />
          </div>
          <button className="mc-icon-btn"><Icon name="chevRight" size={13} /></button>
        </div>
        <div className="grid g-cols-3 gap-14">
          {activos.slice(0, 3).map((p, i) => (
            <div key={i} style={{ border: `1.5px solid ${p.color}50`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ background: `${p.color}15`, borderBottom: `1.5px solid ${p.color}30`, padding: "12px 16px" }}>
                <div className="row gap-10" style={{ alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13, lineHeight: 1.3 }}>{p.titulo}</div>
                    <div className="text-xs text-muted mt-2">{p.ha} · Lotes {p.lotes}</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--mc-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Inversión Est.</div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 17, color: p.color, fontWeight: 700 }}>{p.costo}</div>
                </div>
                <div className="mc-divider"></div>
                <div className="row gap-8" style={{ fontSize: 12 }}>
                  <div style={{ flex: 1, padding: "8px 10px", background: "var(--mc-surface-2)", borderRadius: 8 }}>
                    <div className="text-xs text-muted">Fecha Meta</div>
                    <div className="font-semi mt-2" style={{ color: "var(--mc-ink)" }}>{p.fecha}</div>
                  </div>
                  <div style={{ flex: 1, padding: "8px 10px", background: "var(--mc-surface-2)", borderRadius: 8 }}>
                    <div className="text-xs text-muted">Densidad</div>
                    <div className="font-semi mt-2" style={{ color: "var(--mc-ink)" }}>{p.densidad}</div>
                  </div>
                </div>
                <div style={{ padding: "8px 10px", background: "var(--mc-surface-2)", borderRadius: 8, fontSize: 12 }}>
                  <div className="text-xs text-muted">Insumo</div>
                  <div className="font-semi mt-2" style={{ color: "var(--mc-ink)" }}>{p.insumo}</div>
                </div>
                <div className="row gap-2" style={{ alignItems: "center", marginTop: 4 }}>
                  {["Borrador", "Insumos", "Asignación", "Listo"].map((s, j) => (
                    <div key={j} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", height: 4, borderRadius: 2, background: j < p.steps ? p.color : "var(--mc-line)" }}></div>
                      <div style={{ fontSize: 9, color: j < p.steps ? p.color : "var(--mc-text-3)", fontWeight: j < p.steps ? 700 : 400, textAlign: "center" }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="row gap-8" style={{ padding: "10px 16px", borderTop: `1.5px solid ${p.color}20` }}>
                <button className="mc-btn mc-btn--secondary mc-btn--sm flex-1" style={{ fontSize: 11 }} onClick={onEditar}>
                  <Icon name="edit" size={10} />Editar
                </button>
                <button className="mc-btn mc-btn--sm flex-1" style={{ fontSize: 11, background: p.color, color: "white", border: "none" }} onClick={() => generarOrden(p)}>
                  <Icon name="settings" size={11} />Generar Orden de Trabajo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mc-card ia-card">
        <div className="mc-card__head">
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <div className="mc-card__title">Planes Recomendados por IA</div>
            <IABadge />
          </div>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" disabled={generando} onClick={regenerar}>
            {generando ? "Generando con IA..." : <><Icon name="bolt" size={12} /> Regenerar con IA</>}
          </button>
        </div>
        <div className="grid g-cols-3 gap-14">
          {recomendados.slice(0, 3).map((p, i) => (
            <div key={i} style={{ border: "1.5px solid var(--mc-line)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
              <div style={{ position: "absolute", top: 10, right: 12, padding: "3px 8px", background: "linear-gradient(135deg, #FFF8EC, #FFF0DD)", border: "1.5px solid #FF9D00", borderRadius: 999, display: "flex", alignItems: "center", gap: 5, zIndex: 1 }}>
                <IABadge />
                <span style={{ fontSize: 9, fontWeight: 800, color: "#a85f00", letterSpacing: "0.06em", textTransform: "uppercase" }}>IA</span>
              </div>
              <div style={{ padding: "14px 16px 12px", background: `${p.color}10`, borderBottom: "1.5px solid var(--mc-line)", paddingRight: 70 }}>
                <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14, lineHeight: 1.25 }}>Sugerencia: {p.sugerencia}</div>
                <div className="row gap-6 mt-4" style={{ alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 800, color: p.color, lineHeight: 1 }}>{p.confianza}%</span>
                  <span style={{ fontSize: 10, color: p.color, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Confianza IA: {p.nivel}</span>
                </div>
              </div>
              <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12 }}>
                  <div className="text-xs text-muted" style={{ marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}><Icon name="map" size={12} /> Lotes Afectados</div>
                  <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{p.lotes}</div>
                </div>
                <div style={{ padding: "10px 12px", background: "var(--mc-surface-2)", borderRadius: 9, fontSize: 12 }}>
                  <div className="row gap-6 mb-4" style={{ alignItems: "center" }}>
                    <IABadge />
                    <div className="font-semi" style={{ color: "var(--mc-ink)" }}>El Razonamiento (The Why)</div>
                  </div>
                  <div className="text-muted" style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="alert" size={12} /> Detectado: {p.razon}</div>
                </div>
                <div style={{ padding: "10px 12px", background: `${p.color}0d`, borderRadius: 9, fontSize: 12 }}>
                  <div style={{ color: p.color, fontWeight: 700, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><Icon name="chart" size={12} /> Proyección Económica</div>
                  <div className="font-semi" style={{ color: "var(--mc-ink)" }}>{p.proy}</div>
                </div>
                <div style={{ padding: "10px 12px", background: "linear-gradient(to right, #00FF0010, #FF9D0010)", border: "1.5px solid #FF9D0040", borderRadius: 9, fontSize: 12 }}>
                  <div style={{ color: "#a85f00", fontWeight: 700, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><Icon name="check" size={12} /> Beneficio Clave</div>
                  <div style={{ color: "var(--mc-ink)", fontWeight: 600, lineHeight: 1.4 }}>{p.beneficio}</div>
                </div>
              </div>
              <div className="row gap-8" style={{ padding: "10px 16px", borderTop: "1.5px solid var(--mc-line)" }}>
                <button className="mc-btn mc-btn--secondary mc-btn--sm flex-1" style={{ fontSize: 11, color: "var(--mc-red)" }} onClick={() => descartar(p)}>
                  <Icon name="x" size={10} />Descartar
                </button>
                <button className="mc-btn mc-btn--primary mc-btn--sm flex-1" style={{ fontSize: 11 }} onClick={() => convertir(p)}>
                  <Icon name="check" size={11} /> Convertir en Plan
                </button>
              </div>
            </div>
          ))}
          {recomendados.length === 0 && (
            <div className="text-sm text-muted" style={{ gridColumn: "1 / -1", padding: 20, textAlign: "center" }}>
              No hay sugerencias pendientes. Tocá “Regenerar con IA” para obtener nuevas recomendaciones.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ========== ANÁLISIS DE SUELO (Figma CultivosAnalisisSuelo) ========== */
type AnalisisRow = { lote: string; cultivo: string; n: number; p: number; k: number; ph: number; mo: string; phStatus: string; moStatus: string };

function CultivosAnalisisSuelo({ toast, onVerMapa }: { toast: ReturnType<typeof useToast>; onVerMapa: () => void }) {
  const [lotesAnalisis, setLotesAnalisis] = useState<AnalisisRow[]>(demo([
    { lote: "Lote 4 - El Bajo", cultivo: "Maíz Tardío · Hace 2 semanas", n: 60, p: 40, k: 90, ph: 6.2, mo: "2.8%", phStatus: "ok", moStatus: "ok" },
    { lote: "Lote 12 - Norte", cultivo: "Trigo Ciclo Corto · Hace 3 días", n: 95, p: 75, k: 60, ph: 5.2, mo: "1.9%", phStatus: "warn", moStatus: "warn" },
    { lote: "Lote 7 - La Loma", cultivo: "Soja de Primera · Hace 1 mes", n: 30, p: 85, k: 55, ph: 5.8, mo: "3.2%", phStatus: "warn", moStatus: "ok" },
    { lote: "Lote 4 - El Bajo", cultivo: "Maíz Tardío · Hace 2 semanas", n: 60, p: 20, k: 90, ph: 6.2, mo: "2.8%", phStatus: "ok", moStatus: "ok" },
  ], [] as AnalisisRow[]));
  const [receta, setReceta] = useState<AnalisisRow | null>(null);
  const [evolucion, setEvolucion] = useState<{ label: string; ppm: number }[]>([]);

  useEffect(() => {
    fetch("/api/analisis-suelo")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        // Evolución histórica real de Fósforo (ppm) ordenada por fecha
        const pts = [...d]
          .filter((a: { fosforo?: number; fechaAnalisis?: string }) => a.fosforo != null && a.fechaAnalisis)
          .sort((a: { fechaAnalisis: string }, b: { fechaAnalisis: string }) => new Date(a.fechaAnalisis).getTime() - new Date(b.fechaAnalisis).getTime())
          .map((a: { fosforo: number; fechaAnalisis: string }) => ({ label: new Date(a.fechaAnalisis).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }), ppm: Math.round(a.fosforo) }));
        setEvolucion(pts);
        setLotesAnalisis(
          d.slice(0, 4).map((a: { lote?: { nombre: string }; fechaAnalisis: string; nitrogeno?: number; fosforo?: number; potasio?: number; pH?: number; materiaOrganica?: number }) => ({
            lote: a.lote?.nombre || "Lote",
            cultivo: `Análisis · ${new Date(a.fechaAnalisis).toLocaleDateString("es-AR")}`,
            n: Math.min(100, Math.round(a.nitrogeno || 50)),
            p: Math.min(100, Math.round((a.fosforo || 40) * 2.5)),
            k: Math.min(100, Math.round((a.potasio || 60) / 3)),
            ph: a.pH || 6.2,
            mo: `${a.materiaOrganica ?? 2.6}%`,
            phStatus: (a.pH || 6.2) >= 6 && (a.pH || 6.2) <= 7 ? "ok" : "warn",
            moStatus: (a.materiaOrganica ?? 2.6) >= 2.5 ? "ok" : "warn",
          }))
        );
      })
      .catch(() => {});
  }, []);

  const labResults = demo([
    { fecha: "15/10/2025", lote: "Lote Norte", prof: "0-20", p: "8 ppm", pWarn: true, n: 45, ph: "5.5", phWarn: true, estado: "Crítico", estadoColor: "red" },
    { fecha: "14/10/2025", lote: "Lote Sur", prof: "0-20", p: "18 ppm", pWarn: false, n: 60, ph: "6.2", phWarn: false, estado: "Alerta", estadoColor: "amber" },
    { fecha: "12/10/2025", lote: "Lote Este", prof: "0-20", p: "25 ppm", pWarn: false, n: 75, ph: "6.8", phWarn: false, estado: "Óptimo", estadoColor: "green" },
    { fecha: "10/10/2025", lote: "Lote Oeste", prof: "20-40", p: "12 ppm", pWarn: true, n: 50, ph: "6.0", phWarn: false, estado: "Alerta", estadoColor: "amber" },
  ], [] as { fecha: string; lote: string; prof: string; p: string; pWarn: boolean; n: number; ph: string; phWarn: boolean; estado: string; estadoColor: string }[]);

  const descargarPDF = async (titulo: string, lineas: string[]) => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`MiCampo — ${titulo}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 28);
    let y = 40;
    lineas.forEach((l) => {
      doc.text(l, 14, y);
      y += 7;
    });
    doc.save(`micampo-${titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
    toast.show("PDF descargado");
  };

  const recomendacion = (a: AnalisisRow) => {
    const recs: string[] = [];
    if (a.n < 50) recs.push(`Urea 46-0-0: ${Math.round((60 - a.n) * 2.6)} kg/Ha (déficit de Nitrógeno)`);
    if (a.p < 50) recs.push(`Fosfato diamónico: ${Math.round((55 - a.p) * 1.8)} kg/Ha (déficit de Fósforo)`);
    if (a.k < 50) recs.push(`Cloruro de potasio: ${Math.round((60 - a.k) * 1.4)} kg/Ha (déficit de Potasio)`);
    if (a.ph < 6) recs.push(`Enmienda calcárea: 800-1200 kg/Ha (pH ${a.ph} por debajo del óptimo)`);
    if (recs.length === 0) recs.push("Sin correcciones necesarias: mantener plan de fertilización actual.");
    return recs;
  };

  return (
    <>
      <Modal
        open={!!receta}
        onClose={() => setReceta(null)}
        title={`Receta de fertilización — ${receta?.lote || ""}`}
        subtitle="Recomendación generada a partir del análisis N/P/K, pH y MO del lote."
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setReceta(null)}>Cerrar</button>
            <button
              className="mc-btn mc-btn--primary"
              onClick={() =>
                receta &&
                descargarPDF(`Receta ${receta.lote}`, [
                  `Lote: ${receta.lote}`,
                  `N: ${receta.n}% · P: ${receta.p}% · K: ${receta.k}% · pH ${receta.ph} · MO ${receta.mo}`,
                  "",
                  "Recomendaciones:",
                  ...recomendacion(receta).map((r) => `- ${r}`),
                ])
              }
            >
              <Icon name="download" size={13} />Descargar PDF
            </button>
          </>
        }
      >
        {receta && (
          <div className="col gap-10">
            <div className="row gap-16 text-sm">
              <span><b>N:</b> {receta.n}%</span>
              <span><b>P:</b> {receta.p}%</span>
              <span><b>K:</b> {receta.k}%</span>
              <span><b>pH:</b> {receta.ph}</span>
              <span><b>MO:</b> {receta.mo}</span>
            </div>
            <div className="col gap-8">
              {recomendacion(receta).map((r, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "var(--mc-green-50)", border: "1px solid var(--mc-green-200)", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="sprout" size={13} /> {r}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <div className="mc-card ia-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Analisis del Suelo</div>
          <IABadge />
        </div>
        <div className="grid g-cols-2 gap-12">
          {lotesAnalisis.map((l, i) => (
            <div key={i} style={{ padding: 14, border: "1px solid var(--mc-line)", borderRadius: 10, display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr auto", gap: 14, alignItems: "center" }}>
              <div>
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Identity</div>
                <div className="font-semi text-sm mt-4" style={{ color: "var(--mc-ink)", display: "flex", alignItems: "center", gap: 4 }}><Icon name="wheat" size={13} /> {l.lote}</div>
                <div className="text-xs text-muted mt-2">{l.cultivo}</div>
              </div>
              <div>
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Macro Nutrients</div>
                <div className="col gap-4 mt-4">
                  <NutBar letter="N" value={l.n} />
                  <NutBar letter="P" value={l.p} />
                  <NutBar letter="K" value={l.k} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>Soil Health</div>
                <div className="row gap-4 mt-4" style={{ alignItems: "center", fontSize: 12 }}>
                  <span className="mc-badge mc-badge--neutral">
                    pH {l.ph} <span style={{ color: l.phStatus === "ok" ? "var(--mc-green-600)" : "var(--mc-amber)" }}>●</span>
                  </span>
                </div>
                <div className="row gap-4 mt-4" style={{ alignItems: "center", fontSize: 12 }}>
                  <span className="mc-badge mc-badge--neutral" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>MO {l.mo} <Icon name="sprout" size={12} /></span>
                </div>
              </div>
              <div className="col gap-4" style={{ minWidth: 110 }}>
                <div className="row gap-4">
                  <button className="mc-icon-btn" style={{ width: 28, height: 28 }} title="Ver en mapa" onClick={onVerMapa}>
                    <Icon name="map" size={13} />
                  </button>
                  <button
                    className="mc-icon-btn"
                    style={{ width: 28, height: 28 }}
                    title="Descargar PDF"
                    onClick={() => descargarPDF(`Analisis ${l.lote}`, [`Lote: ${l.lote}`, l.cultivo, `N ${l.n}% · P ${l.p}% · K ${l.k}%`, `pH ${l.ph} · MO ${l.mo}`])}
                  >
                    <Icon name="download" size={13} />
                  </button>
                </div>
                <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ padding: "5px 8px", fontSize: 11, justifyContent: "center", gap: 5 }} onClick={() => setReceta(l)}>
                  Receta <Icon name="pen" size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid g-cols-2 gap-16">
        <div className="mc-card">
          <div className="mc-card__head"><div className="mc-card__title">Últimos Resultados de Laboratorio</div></div>
          <table className="mc-table">
            <thead>
              <tr><th>Fecha</th><th>Lote</th><th>Prof. (cm)</th><th>P (ppm)</th><th>N (kg/ha)</th><th>pH</th><th>Estado</th><th>PDF</th></tr>
            </thead>
            <tbody>
              {labResults.map((r, i) => (
                <tr key={i}>
                  <td className="mc-cell--mono">{r.fecha}</td>
                  <td>{r.lote}</td>
                  <td className="mc-cell--mono">{r.prof}</td>
                  <td><span style={{ color: r.pWarn ? "var(--mc-red)" : "var(--mc-ink)", fontWeight: r.pWarn ? 700 : 500, display: "inline-flex", alignItems: "center", gap: 3 }}>{r.p} {r.pWarn && <Icon name="alert" size={12} />}</span></td>
                  <td className="mc-cell--mono">{r.n}</td>
                  <td><span style={{ color: r.phWarn ? "var(--mc-red)" : "var(--mc-ink)", display: "inline-flex", alignItems: "center", gap: 3 }}>{r.ph} {r.phWarn && <Icon name="alert" size={12} />}</span></td>
                  <td><span className={`mc-badge mc-badge--${r.estadoColor}`}>{r.estado}</span></td>
                  <td>
                    <button
                      className="mc-icon-btn"
                      style={{ width: 22, height: 22, border: "none" }}
                      onClick={() =>
                        descargarPDF(`Laboratorio ${r.lote} ${r.fecha.replace(/\//g, "-")}`, [
                          `Lote: ${r.lote}`,
                          `Fecha: ${r.fecha} · Profundidad: ${r.prof} cm`,
                          `P: ${r.p} · N: ${r.n} kg/ha · pH: ${r.ph}`,
                          `Estado: ${r.estado}`,
                        ])
                      }
                    >
                      <Icon name="download" size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Evolución histórica de Fósforo</div>
            <span className="text-xs text-muted">ppm · por análisis</span>
          </div>
          {evolucion.length === 0 ? (
            <div className="mc-empty">
              <div className="mc-empty__icon"><Icon name="chart" size={22} /></div>
              Sin análisis históricos todavía. Cargá análisis de suelo y la evolución del fósforo se grafica acá.
            </div>
          ) : (() => {
            const W = 400, H = 220, padL = 40, padR = 12, padT = 14, padB = 22;
            const maxPpm = Math.max(40, ...evolucion.map((e) => e.ppm));
            const n = evolucion.length;
            const X = (i: number) => padL + (n === 1 ? 0.5 : i / (n - 1)) * (W - padL - padR);
            const Y = (v: number) => H - padB - (v / maxPpm) * (H - padT - padB);
            const yThr = Y(15);
            const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(maxPpm * p));
            return (
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
                {ticks.map((v, i) => {
                  const y = Y(v);
                  return (
                    <g key={i}>
                      <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--mc-line)" strokeDasharray="2,3" />
                      <text x={padL - 8} y={y + 3} fontSize="9" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">{v}</text>
                    </g>
                  );
                })}
                <text x="18" y={H / 2} fontSize="9" fontFamily="var(--ff-ui)" fill="var(--mc-text-3)" textAnchor="middle" transform={`rotate(-90, 18, ${H / 2})`}>ppm</text>
                <line x1={padL} y1={yThr} x2={W - padR} y2={yThr} stroke="var(--mc-red)" strokeDasharray="4,3" opacity="0.6" />
                <text x={W - padR} y={yThr - 4} fontSize="9" fill="var(--mc-red)" textAnchor="end">Umbral Crítico (15 ppm)</text>
                <polyline points={evolucion.map((e, i) => `${X(i)},${Y(e.ppm)}`).join(" ")} fill="none" stroke="var(--mc-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {evolucion.map((e, i) => (
                  <g key={i}>
                    <circle cx={X(i)} cy={Y(e.ppm)} r="3.5" fill={e.ppm < 15 ? "var(--mc-red)" : "var(--mc-blue)"} stroke="#fff" strokeWidth="1.5" />
                    <text x={X(i)} y={H - 6} fontSize="9" fontFamily="var(--ff-ui)" fill="var(--mc-text-2)" textAnchor="middle">{e.label}</text>
                  </g>
                ))}
              </svg>
            );
          })()}
        </div>
      </div>
    </>
  );
}

function NutBar({ letter, value }: { letter: string; value: number }) {
  const color = value < 35 ? "var(--mc-red)" : value < 65 ? "var(--mc-amber)" : "var(--mc-green-500)";
  return (
    <div className="row gap-4" style={{ alignItems: "center", fontSize: 11 }}>
      <span style={{ width: 14, fontWeight: 700, color: "var(--mc-ink)" }}>{letter}</span>
      {value < 35 && <Icon name="alert" size={12} style={{ color: "var(--mc-red)" }} />}
      <div className="mc-prog" style={{ flex: 1, height: 6 }}>
        <div className="mc-prog__bar" style={{ width: `${value}%`, background: color }}></div>
      </div>
      <span className="font-mono" style={{ width: 32, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

/* ========== MODAL NUEVO ANÁLISIS DE SUELO ========== */
function NuevoAnalisisModal({
  open, onClose, lotes, toast,
}: {
  open: boolean;
  onClose: () => void;
  lotes: { id?: string; nombre: string }[];
  toast: ReturnType<typeof useToast>;
}) {
  const [form, setForm] = useState({ loteIdx: 0, fecha: new Date().toISOString().slice(0, 10), ph: "6.2", mo: "2.6", n: "45", p: "18", k: "180" });

  const guardar = async () => {
    const l = lotes[form.loteIdx];
    try {
      if (l?.id) {
        await fetch("/api/analisis-suelo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loteId: l.id, fechaAnalisis: form.fecha,
            pH: parseFloat(form.ph), materiaOrganica: parseFloat(form.mo),
            nitrogeno: parseFloat(form.n), fosforo: parseFloat(form.p), potasio: parseFloat(form.k),
          }),
        }).catch(() => {});
      }
      toast.show(`Análisis de suelo de ${l?.nombre || "lote"} registrado`);
      onClose();
    } catch {
      toast.show("No se pudo registrar el análisis", "err");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo Análisis de Suelo"
      subtitle="Cargá los resultados de laboratorio para el lote."
      footer={
        <>
          <button className="mc-btn mc-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" onClick={guardar}><Icon name="check" size={13} />Registrar análisis</button>
        </>
      }
    >
      <div className="grid g-cols-2 gap-12">
        <Field label="Lote">
          <select className="mc-select" value={form.loteIdx} onChange={(e) => setForm({ ...form, loteIdx: Number(e.target.value) })}>
            {lotes.map((l, i) => <option key={i} value={i}>{l.nombre}</option>)}
          </select>
        </Field>
        <Field label="Fecha de análisis">
          <input type="date" className="mc-input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
        </Field>
      </div>
      <div className="grid g-cols-2 gap-12">
        <Field label="pH"><input className="mc-input" value={form.ph} onChange={(e) => setForm({ ...form, ph: e.target.value })} /></Field>
        <Field label="Materia Orgánica (%)"><input className="mc-input" value={form.mo} onChange={(e) => setForm({ ...form, mo: e.target.value })} /></Field>
      </div>
      <div className="grid g-cols-3 gap-12">
        <Field label="N (kg/ha)"><input className="mc-input" value={form.n} onChange={(e) => setForm({ ...form, n: e.target.value })} /></Field>
        <Field label="P (ppm)"><input className="mc-input" value={form.p} onChange={(e) => setForm({ ...form, p: e.target.value })} /></Field>
        <Field label="K (ppm)"><input className="mc-input" value={form.k} onChange={(e) => setForm({ ...form, k: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
