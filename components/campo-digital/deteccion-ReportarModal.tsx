"use client";

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/mc";
import { buscarPlagas, type CategoriaPlaga, type EntradaPlaga } from "@/lib/catalogo-plagas";

/* ========== MODAL Reportar Plaga o Enfermedad ========== */

// Escala estándar de nivel de daño por incidencia (% de plantas/área afectada).
// Alineada a los umbrales de severidad del sistema (Baja <20, Media 20–49, Alta ≥50).
const BANDAS_DANO = [
  { label: "Traza", min: 1, max: 5, valor: 3, severidad: "Baja", color: "#22a261" },
  { label: "Leve", min: 6, max: 19, valor: 12, severidad: "Baja", color: "#5fae3f" },
  { label: "Moderado", min: 20, max: 49, valor: 35, severidad: "Media", color: "#e59700" },
  { label: "Severo", min: 50, max: 100, valor: 70, severidad: "Alta", color: "#d94040" },
];

export function ReportarPlagaModal({
  lotes,
  onClose,
  onConfirm,
}: {
  lotes: { id?: string; nombre: string; cultivo?: string }[];
  onClose: () => void;
  onConfirm: (data: { loteId?: string; plaga: string; tipo: string; incidencia: number; observaciones: string; imagenUrl?: string | null }) => Promise<void> | void;
}) {
  const lista = lotes;
  const [loteIdx, setLoteIdx] = useState(0);
  const [categoria, setCategoria] = useState<CategoriaPlaga>("Insecto");
  const [busqueda, setBusqueda] = useState("");
  const [foco, setFoco] = useState(false);
  const [seleccion, setSeleccion] = useState<EntradaPlaga | null>(null);
  const [incidencia, setIncidencia] = useState(15);
  const [notas, setNotas] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);

  const incColor = incidencia < 20 ? "#22a261" : incidencia < 50 ? "#e59700" : "#d94040";
  const nivelDano = BANDAS_DANO.find((b) => incidencia >= b.min && incidencia <= b.max) || BANDAS_DANO[0];
  const resultados = useMemo(() => buscarPlagas(categoria, busqueda, 60), [categoria, busqueda]);
  const totalCategoria = useMemo(() => buscarPlagas(categoria, "", 9999).length, [categoria]);

  const elegirCategoria = (c: CategoriaPlaga) => {
    setCategoria(c);
    setSeleccion(null);
    setBusqueda("");
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid var(--mc-line-2)", background: "var(--mc-surface)", color: "var(--mc-ink)", fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--mc-surface)", borderRadius: 16, width: 820, maxWidth: "100%", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>
        <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--mc-ink)", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="bug" size={22} /> Reportar Plaga o Enfermedad
          </div>
          <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={15} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "auto" }}>
          {/* Left */}
          <div style={{ padding: "22px 22px 22px 28px", borderRight: "1px solid var(--mc-line)" }}>
            <Section icon="map" title="Ubicación">
              <select value={loteIdx} onChange={(e) => setLoteIdx(Number(e.target.value))} style={inp}>
                {lista.map((l, i) => <option key={i} value={i}>{l.nombre}{l.cultivo ? ` - ${l.cultivo}` : ""}</option>)}
              </select>
            </Section>

            <Section icon="search" title="Identificación">
              <div className="row gap-6" style={{ marginBottom: 10 }}>
                {(["Insecto", "Enfermedad", "Maleza"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => elegirCategoria(c)}
                    className="mc-btn mc-btn--sm"
                    style={{ flex: 1, background: categoria === c ? "var(--mc-green-600)" : "var(--mc-surface-2)", color: categoria === c ? "white" : "var(--mc-text-2)", border: "1px solid var(--mc-line-2)" }}
                  >
                    <Icon name={c === "Insecto" ? "bug" : c === "Enfermedad" ? "sprout" : "leaf"} size={13} /> {c}
                  </button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onFocus={() => setFoco(true)}
                  onBlur={() => setTimeout(() => setFoco(false), 150)}
                  placeholder={`Buscar entre ${totalCategoria} ${categoria === "Insecto" ? "insectos" : categoria === "Enfermedad" ? "enfermedades" : "malezas"}… (nombre o científico)`}
                  style={inp}
                />
                {foco && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--mc-surface)", border: "1.5px solid var(--mc-line)", borderRadius: 8, zIndex: 10, boxShadow: "var(--sh-lg)", overflowY: "auto", maxHeight: 240, marginTop: 4 }}>
                    {resultados.length === 0 ? (
                      <div style={{ padding: "10px 14px", fontSize: 12.5, color: "var(--mc-text-3)" }}>Sin coincidencias. Probá otro término o cambiá la categoría.</div>
                    ) : (
                      resultados.map((p) => (
                        <div
                          key={`${p.nombre}-${p.cientifico}`}
                          onMouseDown={() => { setSeleccion(p); setBusqueda(""); setFoco(false); }}
                          style={{ padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid var(--mc-surface-2)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mc-surface-2)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{p.nombre}</div>
                          <div className="text-xs text-muted" style={{ fontStyle: "italic" }}>{p.cientifico}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 12, padding: "10px 14px", background: seleccion ? "var(--mc-green-50)" : "var(--mc-surface-2)", borderRadius: 8, border: `1px solid ${seleccion ? "var(--mc-green-200)" : "var(--mc-line)"}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                {seleccion ? (
                  <>
                    <div style={{ minWidth: 0 }}>
                      <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{seleccion.nombre}</div>
                      <div className="text-xs text-muted" style={{ fontStyle: "italic" }}>{seleccion.cientifico} · {categoria}</div>
                    </div>
                    <button onClick={() => setSeleccion(null)} className="mc-icon-btn" title="Quitar selección" style={{ flexShrink: 0 }}><Icon name="x" size={14} /></button>
                  </>
                ) : (
                  <div className="text-xs text-muted">Elegí una {categoria === "Insecto" ? "plaga" : categoria === "Enfermedad" ? "enfermedad" : "maleza"} de la lista.</div>
                )}
              </div>
            </Section>

            <Section icon="chart" title="Nivel de Daño" right={<span style={{ fontSize: 13, fontWeight: 700, color: incColor }}>{nivelDano.label} · {incidencia}%</span>}>
              <div className="row gap-6" style={{ marginBottom: 12 }}>
                {BANDAS_DANO.map((b) => {
                  const activa = incidencia >= b.min && incidencia <= b.max;
                  return (
                    <button
                      key={b.label}
                      onClick={() => setIncidencia(b.valor)}
                      className="mc-btn mc-btn--sm"
                      title={`${b.label}: ${b.min}–${b.max}% de incidencia (severidad ${b.severidad})`}
                      style={{ flex: 1, flexDirection: "column", gap: 1, padding: "6px 4px", background: activa ? b.color : "var(--mc-surface-2)", color: activa ? "white" : "var(--mc-text-2)", border: `1px solid ${activa ? b.color : "var(--mc-line-2)"}` }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{b.label}</span>
                      <span style={{ fontSize: 9, opacity: 0.85 }}>{b.min}–{b.max}%</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ position: "relative", height: 10, borderRadius: 6, background: "linear-gradient(to right,#22a261,#e59700,#d94040)", marginBottom: 10 }}>
                <div style={{ position: "absolute", left: `${incidencia}%`, top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: "#fff", border: `2.5px solid ${incColor}`, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", zIndex: 1 }} />
                <input type="range" min={1} max={100} value={incidencia} onChange={(e) => setIncidencia(+e.target.value)} style={{ width: "100%", opacity: 0, position: "absolute", top: -4, left: 0, height: 18, cursor: "pointer", margin: 0 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--mc-text-3)" }}>
                <span>Traza</span><span>Leve</span><span>Moderado</span><span>Severo</span>
              </div>
              <div className="text-xs text-muted" style={{ marginTop: 8 }}>
                Escala estándar de incidencia (% de plantas/área afectada). Define la severidad de la alerta: <b style={{ color: "var(--mc-ink)" }}>{nivelDano.severidad}</b>.
              </div>
            </Section>
          </div>

          {/* Right */}
          <div style={{ padding: "22px 28px 22px 22px", display: "flex", flexDirection: "column" }}>
            <Section icon="camera" title="Cargar foto">
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
                style={{ display: "block", border: `2px dashed ${dragOver ? "var(--mc-green-600)" : "var(--mc-line-2)"}`, borderRadius: 10, padding: foto ? 0 : "30px 20px", textAlign: "center", background: dragOver ? "var(--mc-green-50)" : "var(--mc-surface-2)", cursor: "pointer", overflow: "hidden" }}
              >
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                {foto ? (
                  <img src={foto} alt="foto" style={{ width: "100%", height: 150, objectFit: "cover" }} />
                ) : (
                  <>
                    <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}><Icon name="camera" size={30} /></div>
                    <div className="font-semi text-sm" style={{ color: "var(--mc-ink)", marginBottom: 4 }}>Arrastrar foto o Capturar</div>
                    <div className="text-xs" style={{ color: "var(--mc-green-700)", textDecoration: "underline" }}>o seleccionar archivo</div>
                  </>
                )}
              </label>
            </Section>

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Icon name="pen" size={14} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Observaciones / Notas de campo</span>
                <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
              </div>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Escriba detalles adicionales aquí..." style={{ flex: 1, minHeight: 120, padding: "11px 13px", borderRadius: 8, border: "1.5px solid var(--mc-line-2)", background: "var(--mc-surface)", color: "var(--mc-ink)", fontSize: 13, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--mc-line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary">Cancelar</button>
          <button
            className="mc-btn"
            style={{ background: lista[loteIdx]?.id && seleccion ? "#c08a22" : "#d8c79a", color: "white", cursor: lista[loteIdx]?.id && seleccion ? "pointer" : "not-allowed" }}
            disabled={!lista[loteIdx]?.id || !seleccion}
            onClick={() => seleccion && onConfirm({ loteId: lista[loteIdx]?.id, plaga: seleccion.nombre, tipo: categoria, incidencia, observaciones: `${seleccion.cientifico}${notas ? " · " + notas : ""}`, imagenUrl: foto })}
          >
            <Icon name="alert" size={14} /> Generar Alerta
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, right, children }: { icon: string; title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon name={icon} size={14} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
        {right}
      </div>
      {children}
    </div>
  );
}
