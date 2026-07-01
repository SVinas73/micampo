"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, KPI, PageHeader, useToast } from "@/components/mc";
import { useLoteScope } from "@/components/LoteScope";

type Producto = { nombre: string; principioActivo?: string | null; dosis: string; metodo?: string | null };
type Registro = {
  fecha: string; lote: string; tipo: string; detalle: string; productos: Producto[];
  responsable?: string | null; maquinaria?: string | null; superficie?: number | null;
};

export default function CuadernoCampoPage() {
  const toast = useToast();
  const { lotes: scopeLotes } = useLoteScope();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [loteFiltro, setLoteFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");

  // IDs de lotes del establecimiento activo (alcance del sidebar). Estable para deps.
  const scopeIds = useMemo(() => scopeLotes.map((l) => l.id).join(","), [scopeLotes]);

  // Si el lote filtrado deja de estar en el alcance (cambió el establecimiento), se limpia.
  useEffect(() => {
    if (loteFiltro && !scopeLotes.some((l) => l.id === loteFiltro)) setLoteFiltro("");
  }, [scopeLotes, loteFiltro]);

  useEffect(() => {
    setCargando(true);
    // Sin lote puntual → se restringe a los lotes del establecimiento activo.
    const q = loteFiltro ? `?loteId=${loteFiltro}` : `?loteIds=${scopeIds}`;
    fetch(`/api/cuaderno-campo${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.registros) setRegistros(d.registros); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [loteFiltro, scopeIds]);

  const tipos = useMemo(() => ["Todos", ...Array.from(new Set(registros.map((r) => r.tipo)))], [registros]);
  const visibles = useMemo(() => registros.filter((r) => tipoFiltro === "Todos" || r.tipo === tipoFiltro), [registros, tipoFiltro]);
  const aplicaciones = registros.reduce((s, r) => s + r.productos.length, 0);
  const lotesUnicos = new Set(registros.map((r) => r.lote)).size;

  const fmt = (iso: string) => new Date(iso).toLocaleDateString("es-AR");

  const exportarPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const W = 196;
      doc.setFontSize(17); doc.setTextColor(34, 60, 30); doc.text("MiCampo — Cuaderno de Campo", 14, 18);
      doc.setFontSize(9); doc.setTextColor(110, 110, 110);
      doc.text(`Registro de trazabilidad · Generado ${new Date().toLocaleString("es-AR")}`, 14, 24);
      const loteNom = loteFiltro ? scopeLotes.find((l) => l.id === loteFiltro)?.nombre : "Todos los lotes";
      doc.text(`Lote: ${loteNom || "—"} · Registros: ${visibles.length} · Aplicaciones: ${aplicaciones}`, 14, 29);
      doc.setDrawColor(220, 220, 220); doc.line(14, 32, 14 + W, 32);
      let y = 40;
      doc.setTextColor(30, 30, 30);
      visibles.forEach((r) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(11); doc.setFont(undefined as any, "bold");
        doc.text(`${fmt(r.fecha)}  ·  ${r.tipo}  ·  ${r.lote}`, 14, y); y += 6;
        doc.setFont(undefined as any, "normal"); doc.setFontSize(9.5); doc.setTextColor(70, 70, 70);
        if (r.detalle) { doc.splitTextToSize(r.detalle, W).forEach((l: string) => { doc.text(l, 16, y); y += 5; }); }
        r.productos.forEach((p) => {
          doc.text(`• ${p.nombre}${p.principioActivo ? ` (${p.principioActivo})` : ""} — ${p.dosis}${p.metodo ? ` · ${p.metodo}` : ""}`, 18, y); y += 5;
        });
        const meta = [r.responsable && `Responsable: ${r.responsable}`, r.maquinaria && `Equipo: ${r.maquinaria}`, r.superficie && `${Math.round(r.superficie)} ha`].filter(Boolean).join("  ·  ");
        if (meta) { doc.setTextColor(130, 130, 130); doc.text(meta, 16, y); y += 5; }
        doc.setTextColor(70, 70, 70); y += 3;
      });
      doc.setFontSize(7.5); doc.setTextColor(150, 150, 150);
      doc.text("Documento generado por MiCampo. Apto como base de trazabilidad para certificaciones (EUDR / GlobalGAP).", 14, 288);
      doc.save(`micampo-cuaderno-${(loteNom || "campo").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
      toast.show("Cuaderno exportado a PDF");
    } catch { toast.show("No se pudo generar el PDF", "err"); }
  };

  return (
    <div className="col gap-20">
      {toast.node}
      <PageHeader
        crumbs={["Agronomía", "Cuaderno de Campo"]}
        title="Cuaderno de Campo"
        subtitle="Registro de trazabilidad por lote: labores, aplicaciones de productos, siembras y cosechas. Exportable para certificaciones."
      />

      <div className="grid g-cols-3">
        <KPI label="Registros" value={String(registros.length)} delta="Labores, siembras, cosechas" trend="up" icon="list" accent />
        <KPI label="Aplicaciones de producto" value={String(aplicaciones)} delta="Con principio activo y dosis" trend="up" icon="droplet" />
        <KPI label="Lotes con registro" value={String(lotesUnicos)} delta="Trazabilidad" trend="up" icon="map" />
      </div>

      {/* Acción del submódulo, debajo de los KPIs (alineada a la derecha) */}
      <div className="row gap-8" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={exportarPDF} disabled={visibles.length === 0}><Icon name="download" size={13} />Exportar PDF</button>
      </div>

      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderBottom: "1px solid var(--mc-line)" }}>
          <div className="mc-card__title" style={{ marginRight: "auto" }}>Registro cronológico</div>
          <select className="mc-select" style={{ minWidth: 160 }} value={loteFiltro} onChange={(e) => setLoteFiltro(e.target.value)}>
            <option value="">Todos los lotes</option>
            {scopeLotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
          <select className="mc-select" style={{ minWidth: 130 }} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            {tipos.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        {cargando ? (
          <div className="text-sm text-muted" style={{ padding: 24 }}>Cargando registros…</div>
        ) : visibles.length === 0 ? (
          <div className="mc-empty" style={{ padding: 32 }}>
            <div className="mc-empty__icon"><Icon name="list" size={20} /></div>
            <div className="mc-empty__text">Sin registros. Las labores con productos, siembras y cosechas que cargues aparecen acá para trazabilidad.</div>
          </div>
        ) : (
          <div className="col" style={{ padding: 4 }}>
            {visibles.map((r, i) => (
              <div key={i} style={{ padding: "12px 16px", borderBottom: i < visibles.length - 1 ? "1px solid var(--mc-line)" : "none" }}>
                <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
                  <span className="mc-cell--mono text-xs" style={{ color: "var(--mc-text-3)", width: 84 }}>{fmt(r.fecha)}</span>
                  <span className="mc-badge mc-badge--neutral" style={{ fontSize: 10 }}>{r.tipo}</span>
                  <span className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{r.lote}</span>
                  {r.superficie ? <span className="text-xs text-muted">{Math.round(r.superficie)} ha</span> : null}
                </div>
                {r.detalle && <div className="text-sm text-muted" style={{ marginTop: 4, marginLeft: 92 }}>{r.detalle}</div>}
                {r.productos.length > 0 && (
                  <div className="col gap-4" style={{ marginTop: 6, marginLeft: 92 }}>
                    {r.productos.map((p, j) => (
                      <div key={j} className="row gap-6" style={{ alignItems: "center", fontSize: 12.5 }}>
                        <Icon name="droplet" size={12} style={{ color: "var(--mc-blue)" }} />
                        <span className="font-semi" style={{ color: "var(--mc-ink)" }}>{p.nombre}</span>
                        {p.principioActivo && <span className="text-muted">({p.principioActivo})</span>}
                        <span className="text-muted">· {p.dosis}{p.metodo ? ` · ${p.metodo}` : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(r.responsable || r.maquinaria) && (
                  <div className="text-xs text-muted" style={{ marginTop: 5, marginLeft: 92 }}>
                    {[r.responsable && `Responsable: ${r.responsable}`, r.maquinaria && `Equipo: ${r.maquinaria}`].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
