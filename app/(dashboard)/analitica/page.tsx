"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Icon, KPI, PageHeader } from "@/components/mc";
import { useLoteScope } from "@/components/LoteScope";
import type { Punto3D } from "@/components/Grafica3D";

const Grafica3D = dynamic(() => import("@/components/Grafica3D"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 440, display: "grid", placeItems: "center", border: "1px solid var(--mc-line)", borderRadius: 14, background: "var(--mc-surface-2)" }}>
      <div className="text-sm text-muted">Cargando gráfica 3D…</div>
    </div>
  ),
});

type Dataset = { id: string; titulo: string; unidad: string; datos: Punto3D[] };
type Analisis = { resumen: string; hallazgos: string[]; recomendaciones: string[]; simulado?: boolean };

export default function AnaliticaPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activo, setActivo] = useState<string>("");
  const [cargando, setCargando] = useState(true);
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [analizando, setAnalizando] = useState(false);

  useEffect(() => {
    fetch("/api/analitica/datasets")
      .then((r) => (r.ok ? r.json() : { datasets: [] }))
      .then((d) => {
        setDatasets(d.datasets || []);
        if (d.datasets?.[0]) setActivo(d.datasets[0].id);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const { lotes: scopeLotes, esTodos } = useLoteScope();
  // El dataset por-lote (margen) respeta el alcance global de campo/lote
  const ds = useMemo(() => {
    const base = datasets.find((d) => d.id === activo);
    if (!base) return undefined;
    if (base.id === "margenPorLote" && !esTodos) {
      const nombres = new Set(scopeLotes.map((l) => l.nombre));
      return { ...base, datos: base.datos.filter((p) => nombres.has(p.label)) };
    }
    return base;
  }, [datasets, activo, scopeLotes, esTodos]);

  const analizar = async () => {
    if (!ds) return;
    setAnalizando(true);
    setAnalisis(null);
    try {
      const res = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: ds.titulo, unidad: ds.unidad, datos: ds.datos }),
      });
      setAnalisis(await res.json());
    } catch {
      setAnalisis({ resumen: "No se pudo analizar en este momento.", hallazgos: [], recomendaciones: [] });
    } finally {
      setAnalizando(false);
    }
  };

  // Cambiar dataset limpia el análisis
  useEffect(() => setAnalisis(null), [activo]);

  const valores = ds?.datos.map((d) => d.value) || [];
  const prom = valores.length ? Math.round(valores.reduce((s, v) => s + v, 0) / valores.length) : 0;
  const maxP = ds?.datos.reduce((a, b) => (b.value > a.value ? b : a), ds.datos[0]);

  return (
    <div className="col gap-20">
      <PageHeader
        crumbs={["MiCampo", "Analítica IA"]}
        title="Analítica con IA"
        subtitle="Explorá tus datos en gráficas 3D y dejá que la IA encuentre lo que importa."
      />

      {cargando ? (
        <div className="mc-card"><div className="text-sm text-muted">Cargando datos…</div></div>
      ) : datasets.length === 0 ? (
        <div className="mc-card">
          <div className="mc-empty">
            <div className="mc-empty__icon"><Icon name="chart" size={22} /></div>
            <div className="mc-empty__title">Todavía no hay datos para analizar</div>
            <div className="mc-empty__text">Cargá lotes, costos, márgenes o producción y vas a poder explorarlos en 3D con análisis de IA.</div>
          </div>
        </div>
      ) : (
        <>
          {/* Selector de dataset */}
          <div className="row gap-8" style={{ flexWrap: "wrap" }}>
            {datasets.map((d) => (
              <button
                key={d.id}
                onClick={() => setActivo(d.id)}
                className={activo === d.id ? "mc-btn mc-btn--primary mc-btn--sm" : "mc-btn mc-btn--secondary mc-btn--sm"}
              >
                {d.titulo}
              </button>
            ))}
          </div>

          {ds && (
            <>
              <div className="grid g-cols-3">
                <KPI label="Series" value={String(ds.datos.length)} delta={ds.titulo} trend="up" icon="chart" accent />
                <KPI label="Promedio" value={`${prom.toLocaleString("es-AR")}`} delta={ds.unidad} trend="up" icon="activity" />
                <KPI label="Máximo" value={maxP ? `${maxP.value.toLocaleString("es-AR")}` : "—"} delta={maxP?.label || ""} trend="up" icon="target" />
              </div>

              <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="mc-card__head" style={{ padding: "16px 20px 12px" }}>
                  <div>
                    <div className="mc-card__eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Icon name="chart" size={13} /> Visualización 3D
                    </div>
                    <div className="mc-card__title mt-4">{ds.titulo} <span className="text-xs text-muted">· {ds.unidad}</span></div>
                  </div>
                  <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={analizar} disabled={analizando}>
                    <Icon name="sparkles" size={14} />{analizando ? "Analizando…" : "Analizar con IA"}
                  </button>
                </div>
                <div style={{ padding: "0 20px 20px" }}>
                  <Grafica3D datos={ds.datos} unidad={ds.unidad} />
                </div>
              </div>

              {analisis && (
                <div className="mc-card">
                  <div className="mc-card__head">
                    <div>
                      <div className="mc-card__eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 18, height: 18, borderRadius: 5, background: "#5e7733", color: "#fff", display: "grid", placeItems: "center" }}>
                          <Icon name="sparkles" size={11} />
                        </span>
                        Análisis IA{analisis.simulado ? " · sin clave (estimado)" : ""}
                      </div>
                      <div className="mc-card__title mt-4">Lo que encontró la IA</div>
                    </div>
                  </div>
                  <div className="col gap-12">
                    <div className="text-sm" style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{analisis.resumen}</div>
                    {analisis.hallazgos?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted" style={{ marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Hallazgos</div>
                        <div className="col gap-6">
                          {analisis.hallazgos.map((h, i) => (
                            <div key={i} className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                              <Icon name="check" size={14} style={{ color: "#5e7733", marginTop: 2 }} />
                              <span className="text-sm" style={{ color: "var(--mc-text-2)" }}>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analisis.recomendaciones?.length > 0 && (
                      <div>
                        <div className="text-xs text-muted" style={{ marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recomendaciones</div>
                        <div className="col gap-6">
                          {analisis.recomendaciones.map((r, i) => (
                            <div key={i} className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                              <Icon name="arrowRight" size={14} style={{ color: "#d9a538", marginTop: 2 }} />
                              <span className="text-sm" style={{ color: "var(--mc-text-2)" }}>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
