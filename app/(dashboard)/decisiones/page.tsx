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

export default function DecisionesPage() {
  const router = useRouter();
  const [decisiones, setDecisiones] = useState<Decision[]>([]);
  const [cargando, setCargando] = useState(true);
  const [generado, setGenerado] = useState<string | null>(null);

  const cargar = () => {
    setCargando(true);
    fetch("/api/decisiones")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setDecisiones(d.decisiones || []); setGenerado(d.generado || null); } })
      .catch(() => {})
      .finally(() => setCargando(false));
  };
  useEffect(() => { cargar(); }, []);

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
        actions={<button className="mc-btn mc-btn--secondary" onClick={cargar}><Icon name="activity" size={14} />Actualizar</button>}
      />

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

      <div className="text-xs text-muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <IABadge /> Las decisiones cruzan datos reales de Open-Meteo, NDVI satelital, sanidad, lluvia y precios. Se afinan con IA cuando hay clave configurada.
      </div>
    </div>
  );
}
