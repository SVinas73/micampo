"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, KPI, PageHeader, IABadge } from "@/components/mc";

type Prioridad = "alta" | "media" | "baja";
type Decision = {
  id: string; categoria: string; titulo: string; detalle: string; lote?: string;
  prioridad: Prioridad; impacto: string; ruta: string; icono: string; color: string;
};

const ORDEN: Prioridad[] = ["alta", "media", "baja"];
const LABEL: Record<Prioridad, string> = { alta: "Hacé ahora", media: "Esta semana", baja: "Para tener en cuenta" };

// Alertas predictivas (IA): riesgos detectados cruzando lotes, hacienda, sanidad,
// producción y costos. Se generan y persisten vía /api/alertas-predictivas.
type AlertaPred = {
  id: string; tipo: string; severidad: string; titulo: string; descripcion: string;
  recomendacion: string; entidad?: string | null; entidadNombre?: string | null;
  fechaDeteccion: string; estado: string; metadata?: string | null;
};
const SEV_COLOR: Record<string, string> = { "Crítica": "#b91c1c", Alta: "#c93434", Media: "#d9a538", Baja: "#5e7733" };
const TIPO_ICON: Record<string, string> = { Enfermedad: "bug", Clima: "cloud", "Nutrición": "sprout", "Reproducción": "heart", Financiero: "dollar" };
const confianzaDe = (m?: string | null): number | null => { try { return m ? (JSON.parse(m).confianza ?? null) : null; } catch { return null; } };

export default function DecisionesPage() {
  const router = useRouter();
  const [decisiones, setDecisiones] = useState<Decision[]>([]);
  const [cargando, setCargando] = useState(true);
  const [generado, setGenerado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<AlertaPred[]>([]);
  const [cargandoAlertas, setCargandoAlertas] = useState(true);
  const [generandoAlertas, setGenerandoAlertas] = useState(false);
  const [avisoAlertas, setAvisoAlertas] = useState<string | null>(null);

  const enviarAlTelefono = async () => {
    setEnviando(true);
    setAviso(null);
    try {
      const r = await fetch("/api/alertas/enviar", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const d = await r.json();
      if (d.sinAlertas) setAviso("Sin alertas urgentes para enviar hoy.");
      else if (d.enviado) setAviso("Alertas enviadas a tu WhatsApp ✓");
      else if (!d.configurado) setAviso("WhatsApp aún no configurado: cargá el número para recibir las alertas en el teléfono.");
      else setAviso("No se pudo enviar. Revisá la configuración de WhatsApp.");
    } catch {
      setAviso("No se pudo enviar el resumen.");
    } finally {
      setEnviando(false);
    }
  };

  const cargar = () => {
    setCargando(true);
    fetch("/api/decisiones")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setDecisiones(d.decisiones || []); setGenerado(d.generado || null); } })
      .catch(() => {})
      .finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, []);

  const cargarAlertas = () => {
    setCargandoAlertas(true);
    fetch("/api/alertas-predictivas?estado=Activa")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAlertas(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setCargandoAlertas(false));
  };
  useEffect(() => { cargarAlertas(); }, []);

  const generarAlertas = async () => {
    setGenerandoAlertas(true);
    setAvisoAlertas(null);
    try {
      const r = await fetch("/api/alertas-predictivas/generar", { method: "POST" });
      const d = await r.json();
      if (r.ok) {
        setAvisoAlertas(d.mensaje || "Análisis completado.");
        cargarAlertas();
      } else if (d.simulado) {
        setAvisoAlertas("Las alertas predictivas requieren configurar ANTHROPIC_API_KEY.");
      } else {
        setAvisoAlertas(d.error || "No se pudieron generar las alertas.");
      }
    } catch {
      setAvisoAlertas("No se pudieron generar las alertas en este momento.");
    } finally {
      setGenerandoAlertas(false);
    }
  };

  // Resolver / ignorar: actualiza el estado (optimista) y persiste vía PATCH.
  const cambiarEstadoAlerta = async (id: string, estado: string) => {
    setAlertas((a) => a.filter((x) => x.id !== id));
    try {
      await fetch(`/api/alertas-predictivas/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }),
      });
    } catch {
      cargarAlertas();
    }
  };

  const porPrioridad = useMemo(() => {
    const g: Record<Prioridad, Decision[]> = { alta: [], media: [], baja: [] };
    decisiones.forEach((d) => g[d.prioridad].push(d));
    return g;
  }, [decisiones]);

  const total = decisiones.length;
  const altas = porPrioridad.alta.length;
  const categorias = new Set(decisiones.map((d) => d.categoria)).size;

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["MiCampo", "Decisiones del día"]}
        title="Decisiones del día"
        subtitle="Una sola lista priorizada: clima, satélite, sanidad, riego y economía cruzados para decirte qué hacer hoy."
        actions={<>
          <button className="mc-btn mc-btn--secondary" onClick={cargar}><Icon name="activity" size={14} />Actualizar</button>
          <button className="mc-btn mc-btn--secondary" onClick={generarAlertas} disabled={generandoAlertas}><Icon name="sparkles" size={14} />{generandoAlertas ? "Analizando…" : "Generar alertas (IA)"}</button>
          <button className="mc-btn mc-btn--primary" onClick={enviarAlTelefono} disabled={enviando || total === 0}><Icon name="send" size={14} />{enviando ? "Enviando…" : "Enviar a mi WhatsApp"}</button>
        </>}
      />

      {aviso && (
        <div className="mc-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderLeft: "3px solid var(--mc-green-600)" }}>
          <Icon name="send" size={14} style={{ color: "var(--mc-green-700)" }} />
          <span className="text-sm" style={{ color: "var(--mc-ink)" }}>{aviso}</span>
        </div>
      )}

      <div className="grid g-cols-3">
        <KPI label="Decisiones de hoy" value={String(total)} delta={generado ? `Actualizado ${new Date(generado).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : "—"} trend="up" icon="sparkles" accent />
        <KPI label="Prioritarias" value={String(altas)} delta={altas > 0 ? "Requieren acción ya" : "Nada urgente"} trend={altas > 0 ? "warn" : "up"} icon="alert" warn={altas > 0} />
        <KPI label="Fuentes cruzadas" value={String(categorias)} delta="Clima · NDVI · Sanidad · Riego · $" trend="up" icon="activity" />
      </div>

      {cargando ? (
        <div className="mc-card"><div className="text-sm text-muted">Cruzando tus datos…</div></div>
      ) : total === 0 ? (
        <div className="mc-card">
          <div className="mc-empty">
            <div className="mc-empty__icon"><Icon name="check" size={22} /></div>
            <div className="mc-empty__title">Todo en orden por hoy</div>
            <div className="mc-empty__text">No hay decisiones urgentes según el clima, el satélite y tus lotes. Cargá lotes con cultivo y coordenadas para recibir recomendaciones diarias.</div>
          </div>
        </div>
      ) : (
        ORDEN.filter((p) => porPrioridad[p].length > 0).map((p) => (
          <div key={p} className="col gap-10">
            <div className="row gap-8" style={{ alignItems: "center" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: p === "alta" ? "var(--mc-red)" : p === "media" ? "var(--mc-amber)" : "var(--mc-green-600)" }} />
              <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>{LABEL[p]}</span>
              <span className="mc-badge mc-badge--neutral">{porPrioridad[p].length}</span>
            </div>
            <div className="col gap-10">
              {porPrioridad[p].map((d) => (
                <div key={d.id} className="mc-card" style={{ padding: 0, overflow: "hidden", display: "flex", borderLeft: `4px solid ${d.color}` }}>
                  <div style={{ flex: 1, padding: "14px 16px", display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: `${d.color}1a`, color: d.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon name={d.icono} size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
                        <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14.5 }}>{d.titulo}</span>
                        <span className="mc-badge mc-badge--neutral" style={{ fontSize: 10 }}>{d.categoria}</span>
                        {d.lote && <span className="text-xs" style={{ color: "var(--mc-green-700)", display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="map" size={11} />{d.lote}</span>}
                      </div>
                      <div className="text-sm text-muted" style={{ marginTop: 3 }}>{d.detalle}</div>
                      <div className="text-xs" style={{ color: d.color, fontWeight: 700, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="target" size={11} />{d.impacto}</div>
                    </div>
                    <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ flexShrink: 0 }} onClick={() => router.push(d.ruta)}>
                      Resolver <Icon name="arrowRight" size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Alertas predictivas (IA): riesgos detectados en lotes, hacienda, sanidad y finanzas */}
      <div className="col gap-10">
        <div className="row gap-8" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--mc-green-600)", color: "#fff", display: "grid", placeItems: "center" }}><Icon name="sparkles" size={15} /></span>
            <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>Alertas predictivas (IA)</span>
            {alertas.length > 0 && <span className="mc-badge mc-badge--neutral">{alertas.length}</span>}
          </div>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={generarAlertas} disabled={generandoAlertas}>
            <Icon name="sparkles" size={13} />{generandoAlertas ? "Analizando…" : "Generar alertas (IA)"}
          </button>
        </div>

        {avisoAlertas && (
          <div className="mc-card" style={{ padding: "9px 13px", borderLeft: "3px solid var(--mc-green-600)" }}>
            <span className="text-sm" style={{ color: "var(--mc-ink)" }}>{avisoAlertas}</span>
          </div>
        )}

        {cargandoAlertas ? (
          <div className="mc-card"><div className="text-sm text-muted">Cargando alertas…</div></div>
        ) : alertas.length === 0 ? (
          <div className="mc-card">
            <div className="text-sm text-muted">Sin alertas predictivas activas. Generá un análisis con IA para detectar riesgos y anomalías en lotes, hacienda, sanidad, producción y finanzas.</div>
          </div>
        ) : (
          <div className="col gap-10">
            {alertas.map((a) => {
              const color = SEV_COLOR[a.severidad] || "#5e7733";
              const conf = confianzaDe(a.metadata);
              return (
                <div key={a.id} className="mc-card" style={{ padding: 0, overflow: "hidden", display: "flex", borderLeft: `4px solid ${color}` }}>
                  <div style={{ flex: 1, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}1a`, color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon name={TIPO_ICON[a.tipo] || "alert"} size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
                        <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14.5 }}>{a.titulo}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: `${color}1a`, color }}>{a.severidad}</span>
                        <span className="mc-badge mc-badge--neutral" style={{ fontSize: 10 }}>{a.tipo}</span>
                        {a.entidadNombre && <span className="text-xs" style={{ color: "var(--mc-green-700)", display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="map" size={11} />{a.entidadNombre}</span>}
                        {conf != null && <span className="text-xs text-muted">{conf}% conf.</span>}
                      </div>
                      <div className="text-sm text-muted" style={{ marginTop: 3 }}>{a.descripcion}</div>
                      <div className="text-xs" style={{ color, fontWeight: 700, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="target" size={11} />{a.recomendacion}</div>
                    </div>
                    <div className="col gap-6" style={{ flexShrink: 0 }}>
                      <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => cambiarEstadoAlerta(a.id, "Resuelta")}><Icon name="check" size={13} />Resolver</button>
                      <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => cambiarEstadoAlerta(a.id, "Ignorada")}><Icon name="x" size={13} />Ignorar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <IABadge /> Las decisiones cruzan datos reales de Open-Meteo, NDVI satelital, sanidad, lluvia y precios. Se afinan con IA cuando hay clave configurada.
      </div>
    </div>
  );
}
