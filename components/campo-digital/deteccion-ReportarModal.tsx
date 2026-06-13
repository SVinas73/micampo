"use client";

import React, { useState } from "react";
import { Icon } from "@/components/mc";

/* ========== MODAL Reportar Plaga o Enfermedad (Figma) ========== */
const SUGERENCIAS = ["Roya Común (Puccinia)", "Pulgón Verde", "Oruga Cogollera (Spodoptera)", "Mancha Marrón", "Esclerotinia", "Fusarium", "Mildiu", "Carbón"];

export function ReportarPlagaModal({
  lotes,
  onClose,
  onConfirm,
}: {
  lotes: { id?: string; nombre: string; cultivo?: string }[];
  onClose: () => void;
  onConfirm: (data: { loteId?: string; plaga: string; tipo: string; incidencia: number; observaciones: string }) => Promise<void> | void;
}) {
  const lista = lotes.length > 0 ? lotes : [{ id: undefined, nombre: "Lote 4 - Maíz (V6)", cultivo: "Maíz" }];
  const [loteIdx, setLoteIdx] = useState(0);
  const [categoria, setCategoria] = useState<"Insecto" | "Hongo" | "Maleza">("Insecto");
  const [busqueda, setBusqueda] = useState("");
  const [plaga, setPlaga] = useState("Oruga Cogollera (Spodoptera)");
  const [incidencia, setIncidencia] = useState(15);
  const [notas, setNotas] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);

  const incColor = incidencia < 20 ? "#22a261" : incidencia < 50 ? "#e59700" : "#d94040";
  const filtradas = busqueda.length > 1 ? SUGERENCIAS.filter((s) => s.toLowerCase().includes(busqueda.toLowerCase())) : [];

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
            <span style={{ fontSize: 22 }}>🐛</span> Reportar Plaga o Enfermedad
          </div>
          <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={15} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "auto" }}>
          {/* Left */}
          <div style={{ padding: "22px 22px 22px 28px", borderRight: "1px solid var(--mc-line)" }}>
            <Section icon="📍" title="Ubicación">
              <select value={loteIdx} onChange={(e) => setLoteIdx(Number(e.target.value))} style={inp}>
                {lista.map((l, i) => <option key={i} value={i}>{l.nombre}{l.cultivo ? ` - ${l.cultivo}` : ""}</option>)}
              </select>
            </Section>

            <Section icon="🔍" title="Identificación">
              <div className="row gap-6" style={{ marginBottom: 10 }}>
                {(["Insecto", "Hongo", "Maleza"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoria(c)}
                    className="mc-btn mc-btn--sm"
                    style={{ flex: 1, background: categoria === c ? "var(--mc-green-600)" : "var(--mc-surface-2)", color: categoria === c ? "white" : "var(--mc-text-2)", border: "1px solid var(--mc-line-2)" }}
                  >
                    {c === "Insecto" ? "🐛" : c === "Hongo" ? "🍄" : "🌿"} {c}
                  </button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar Plaga o Enfermedad..." style={inp} />
                {filtradas.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--mc-surface)", border: "1.5px solid var(--mc-line)", borderRadius: 8, zIndex: 10, boxShadow: "var(--sh-lg)", overflow: "hidden", marginTop: 4 }}>
                    {filtradas.slice(0, 5).map((s) => (
                      <div key={s} onClick={() => { setPlaga(s); setBusqueda(""); }} style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, color: "var(--mc-ink)" }}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--mc-surface-2)", borderRadius: 8, border: "1px solid var(--mc-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{plaga}</div>
                  <div className="text-xs text-muted" style={{ fontStyle: "italic" }}>{plaga}</div>
                </div>
                <Icon name="alert" size={16} style={{ color: "var(--mc-amber)" }} />
              </div>
            </Section>

            <Section icon="📊" title="Nivel de Daño" right={<span style={{ fontSize: 13, fontWeight: 700, color: incColor }}>Incidencia {incidencia}%</span>}>
              <div style={{ position: "relative", height: 10, borderRadius: 6, background: "linear-gradient(to right,#22a261,#e59700,#d94040)", marginBottom: 10 }}>
                <div style={{ position: "absolute", left: `${incidencia}%`, top: "50%", transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: "#fff", border: `2.5px solid ${incColor}`, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", zIndex: 1 }} />
                <input type="range" min={1} max={100} value={incidencia} onChange={(e) => setIncidencia(+e.target.value)} style={{ width: "100%", opacity: 0, position: "absolute", top: -4, left: 0, height: 18, cursor: "pointer", margin: 0 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--mc-text-3)" }}>
                <span>Bajo</span><span>Moderado</span><span>Alto</span>
              </div>
            </Section>
          </div>

          {/* Right */}
          <div style={{ padding: "22px 28px 22px 22px", display: "flex", flexDirection: "column" }}>
            <Section icon="📷" title="Upload Photo">
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
                    <div style={{ fontSize: 30, marginBottom: 8 }}>📷</div>
                    <div className="font-semi text-sm" style={{ color: "var(--mc-ink)", marginBottom: 4 }}>Arrastrar foto o Capturar</div>
                    <div className="text-xs" style={{ color: "var(--mc-green-700)", textDecoration: "underline" }}>o seleccionar archivo</div>
                  </>
                )}
              </label>
            </Section>

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14 }}>📝</span>
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
            style={{ background: "#e7892b", color: "white" }}
            onClick={() => onConfirm({ loteId: lista[loteIdx]?.id, plaga: plaga.split(" (")[0], tipo: categoria === "Insecto" ? "Insecto" : categoria === "Hongo" ? "Hongo" : "Maleza", incidencia, observaciones: notas })}
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
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
        {right}
      </div>
      {children}
    </div>
  );
}
