"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type Accion = { label: string; ruta: string };
type Dataset = { id: string; titulo: string; unidad: string; dimension?: string; temporal?: boolean; datos: Punto3D[] };
type Analisis = { resumen: string; hallazgos: string[]; recomendaciones: string[]; acciones?: Accion[]; simulado?: boolean };
type Correlacion = { r: number; fuerza: string; pares: number; puntos?: { label: string; x: number; y: number }[]; resumen: string; hallazgos?: string[]; recomendacion?: string; simulado?: boolean };

export default function AnaliticaPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activo, setActivo] = useState<string>("");
  const [cargando, setCargando] = useState(true);
  const [analisis, setAnalisis] = useState<Analisis | null>(null);
  const [analizando, setAnalizando] = useState(false);
  // Correlación entre dos variables
  const [corrA, setCorrA] = useState<string>("");
  const [corrB, setCorrB] = useState<string>("");
  const [corr, setCorr] = useState<Correlacion | null>(null);
  const [corrLoading, setCorrLoading] = useState(false);

  // Alcance global Campo → Lote del sidebar. Los datasets se piden ya filtrados
  // por el servidor, así que Analítica IA reacciona al cambiar de establecimiento/lote.
  const { establecimientoId, loteId, establecimientoActivo, loteActivo, esTodos, cargado } = useLoteScope();

  useEffect(() => {
    if (!cargado) return;
    setCargando(true);
    setAnalisis(null);
    setCorr(null);
    const qs = new URLSearchParams({ establecimientoId, loteId }).toString();
    fetch(`/api/analitica/datasets?${qs}`)
      .then((r) => (r.ok ? r.json() : { datasets: [] }))
      .then((d) => {
        const ds: Dataset[] = d.datasets || [];
        setDatasets(ds);
        // Mantener el dataset activo si sigue existiendo; si no, ir al primero.
        setActivo((prev) => (ds.some((x) => x.id === prev) ? prev : ds[0]?.id || ""));
        // Defaults de correlación: dos datasets de la misma dimensión (ideal: lote)
        const porLote = ds.filter((x) => x.dimension === "lote");
        if (porLote.length >= 2) { setCorrA(porLote[0].id); setCorrB(porLote[1].id); }
        else if (ds.length >= 2) { setCorrA(ds[0].id); setCorrB(ds[1].id); }
        else { setCorrA(ds[0]?.id || ""); setCorrB(ds[0]?.id || ""); }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [cargado, establecimientoId, loteId]);

  const ds = useMemo(() => datasets.find((d) => d.id === activo), [datasets, activo]);

  // Texto del alcance activo, para que se vea que Analítica IA respeta el sidebar.
  const scopeLabel = esTodos
    ? "Todos los campos"
    : loteActivo
      ? `Lote ${loteActivo.nombre}${establecimientoActivo ? ` · ${establecimientoActivo.nombre}` : ""}`
      : establecimientoActivo?.nombre || "Alcance activo";

  const analizar = async () => {
    if (!ds) return;
    setAnalizando(true);
    setAnalisis(null);
    try {
      const res = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ds.id, titulo: ds.titulo, unidad: ds.unidad, datos: ds.datos, contexto: scopeLabel }),
      });
      setAnalisis(await res.json());
    } catch {
      setAnalisis({ resumen: "No se pudo analizar en este momento.", hallazgos: [], recomendaciones: [] });
    } finally {
      setAnalizando(false);
    }
  };

  const correlacionar = async () => {
    const a = datasets.find((d) => d.id === corrA);
    const b = datasets.find((d) => d.id === corrB);
    if (!a || !b || a.id === b.id) return;
    setCorrLoading(true); setCorr(null);
    try {
      const res = await fetch("/api/analisis/correlacion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: { titulo: a.titulo, unidad: a.unidad, datos: a.datos }, b: { titulo: b.titulo, unidad: b.unidad, datos: b.datos } }),
      });
      setCorr(await res.json());
    } catch {
      setCorr({ r: 0, fuerza: "—", pares: 0, resumen: "No se pudo calcular la correlación." });
    } finally { setCorrLoading(false); }
  };

  const exportarPDF = async () => {
    if (!ds || !analisis) return;
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(18); doc.setTextColor(34, 60, 30); doc.text("MiCampo — Analítica IA", 14, 20);
      doc.setFontSize(10); doc.setTextColor(90, 90, 90); doc.text(`${ds.titulo} · ${new Date().toLocaleDateString("es-AR")}`, 14, 27);
      doc.setTextColor(30, 30, 30); let y = 40;
      const wrap = (t: string, size = 11) => { doc.setFontSize(size); doc.splitTextToSize(t, 180).forEach((l: string) => { doc.text(l, 14, y); y += 6; }); };
      doc.setFontSize(13); doc.text("Resumen", 14, y); y += 7; wrap(analisis.resumen);
      y += 2; doc.setFontSize(13); doc.text("Hallazgos", 14, y); y += 7;
      (analisis.hallazgos || []).forEach((h) => wrap(`• ${h}`));
      y += 2; doc.setFontSize(13); doc.text("Recomendaciones", 14, y); y += 7;
      (analisis.recomendaciones || []).forEach((r) => wrap(`→ ${r}`));
      doc.save(`micampo-analitica-${ds.id}.pdf`);
    } catch {}
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

      <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <span className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Alcance</span>
        <span className="mc-badge mc-badge--green" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Icon name={esTodos ? "grid" : loteActivo ? "map" : "building"} size={11} />{scopeLabel}
        </span>
        <span className="text-xs text-muted">Los datos y el análisis IA respetan el campo/lote del panel lateral.</span>
      </div>

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
                {d.temporal && <Icon name="activity" size={12} />}{d.titulo}
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
                    <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={exportarPDF}><Icon name="download" size={13} />Exportar PDF</button>
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
                    {analisis.acciones && analisis.acciones.length > 0 && (
                      <div style={{ borderTop: "1px solid var(--mc-line)", paddingTop: 12 }}>
                        <div className="text-xs text-muted" style={{ marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pasá a la acción</div>
                        <div className="row gap-8" style={{ flexWrap: "wrap" }}>
                          {analisis.acciones.map((a, i) => (
                            <button key={i} className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => router.push(a.ruta)}>
                              {a.label} <Icon name="arrowRight" size={13} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Correlación entre dos variables (IA) */}
              <CorrelacionCard
                datasets={datasets} corrA={corrA} corrB={corrB} setCorrA={setCorrA} setCorrB={setCorrB}
                corr={corr} loading={corrLoading} onCorrelacionar={correlacionar}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function CorrelacionCard({
  datasets, corrA, corrB, setCorrA, setCorrB, corr, loading, onCorrelacionar,
}: {
  datasets: Dataset[];
  corrA: string; corrB: string;
  setCorrA: (v: string) => void; setCorrB: (v: string) => void;
  corr: Correlacion | null; loading: boolean; onCorrelacionar: () => void;
}) {
  if (datasets.length < 2) return null;
  const a = datasets.find((d) => d.id === corrA);
  const b = datasets.find((d) => d.id === corrB);
  const rColor = corr ? (Math.abs(corr.r) >= 0.4 ? (corr.r > 0 ? "#5e7733" : "#c93434") : "#64748b") : "#64748b";

  // Scatter simple de los puntos emparejados
  const Scatter = () => {
    const pts = corr?.puntos || [];
    if (pts.length < 2) return null;
    const W = 300, H = 150, pad = 24;
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sx = (v: number) => pad + ((v - minX) / (maxX - minX || 1)) * (W - 2 * pad);
    const sy = (v: number) => H - pad - ((v - minY) / (maxY - minY || 1)) * (H - 2 * pad);
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: "var(--mc-surface-2)", borderRadius: 10, border: "1px solid var(--mc-line)" }}>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--mc-line)" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--mc-line)" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={4} fill={rColor} opacity={0.8} />
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div>
          <div className="mc-card__eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: "#2c6bb8", color: "#fff", display: "grid", placeItems: "center" }}><Icon name="activity" size={11} /></span>
            Correlación entre variables
          </div>
          <div className="mc-card__title mt-4">¿Qué se mueve junto?</div>
        </div>
      </div>
      <div className="row gap-10" style={{ alignItems: "flex-end", flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div className="mc-label" style={{ marginBottom: 4 }}>Variable A</div>
          <select className="mc-select" value={corrA} onChange={(e) => setCorrA(e.target.value)}>
            {datasets.map((d) => <option key={d.id} value={d.id}>{d.titulo}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div className="mc-label" style={{ marginBottom: 4 }}>Variable B</div>
          <select className="mc-select" value={corrB} onChange={(e) => setCorrB(e.target.value)}>
            {datasets.map((d) => <option key={d.id} value={d.id}>{d.titulo}</option>)}
          </select>
        </div>
        <button className="mc-btn mc-btn--primary" onClick={onCorrelacionar} disabled={loading || corrA === corrB}>
          <Icon name="sparkles" size={14} />{loading ? "Calculando…" : "Correlacionar"}
        </button>
      </div>
      {a && b && a.dimension !== b.dimension && (
        <div className="text-xs" style={{ color: "var(--mc-amber)", marginBottom: 10 }}>Estas dos variables no comparten la misma dimensión; la correlación puede no tener puntos en común.</div>
      )}
      {corr && (
        <div className="grid" style={{ gridTemplateColumns: "200px 1fr", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 44, fontWeight: 800, color: rColor, lineHeight: 1 }}>{corr.r > 0 ? "+" : ""}{corr.r.toFixed(2)}</div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>correlación {corr.fuerza}</div>
            <div className="text-xs text-muted">{corr.pares} puntos</div>
            <div style={{ marginTop: 10 }}><Scatter /></div>
          </div>
          <div className="col gap-10">
            <div className="text-sm" style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{corr.resumen}</div>
            {corr.hallazgos && corr.hallazgos.length > 0 && (
              <div className="col gap-6">
                {corr.hallazgos.map((h, i) => (
                  <div key={i} className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                    <Icon name="check" size={14} style={{ color: "#5e7733", marginTop: 2 }} />
                    <span className="text-sm" style={{ color: "var(--mc-text-2)" }}>{h}</span>
                  </div>
                ))}
              </div>
            )}
            {corr.recomendacion && (
              <div className="row" style={{ gap: 8, alignItems: "flex-start", padding: "10px 12px", background: "var(--mc-green-50)", borderRadius: 10, border: "1px solid var(--mc-green-200)" }}>
                <Icon name="arrowRight" size={14} style={{ color: "#d9a538", marginTop: 2 }} />
                <span className="text-sm" style={{ color: "var(--mc-ink)" }}>{corr.recomendacion}</span>
              </div>
            )}
            {corr.simulado && <div className="text-xs text-muted">Cálculo estadístico (Pearson). Con IA, la lectura se afina.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
