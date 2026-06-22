"use client";

import React, { useState } from "react";
import { Icon, IABadge } from "@/components/mc";
import type { SugerenciaIA } from "./BalanceHidrico";

export type RegistroRiego = {
  mm: number;
  fecha: string;
  hora: string;
  metodo: string;
  lotes: string[];
  observaciones: string;
  fuente: "ia" | "manual";
};

const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #c0c5ce", background: "#fff", color: "var(--mc-ink)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em", display: "block" };
const bigNum: React.CSSProperties = { fontSize: 52, fontWeight: 800, color: "#2c82c9", lineHeight: 1, textAlign: "center" };

const pivotOptions = [
  { value: "pivot1", label: "Pivot Central 1" },
  { value: "goteo", label: "Goteo" },
  { value: "aspersion", label: "Aspersión Manual" },
];

type LoteOpt = { id: string; nombre: string; cultivo?: string | null; hectareas?: number | null };

function Section({ title, icon, right, children }: { title: string; icon: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, display: "grid", placeItems: "center" }}><Icon name={icon} size={14} /></span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        {right}
      </div>
      {children}
    </div>
  );
}

export default function RegistrarRiegoModal({
  open,
  onClose,
  sugerencias,
  onRegistrar,
  lotes: lotesProp = [],
  loteActivoId,
}: {
  open: boolean;
  onClose: () => void;
  sugerencias: SugerenciaIA[];
  onRegistrar: (r: RegistroRiego) => Promise<void> | void;
  lotes?: LoteOpt[];
  loteActivoId?: string | null;
}) {
  const hoyISO = new Date().toISOString().slice(0, 10);
  const [modo, setModo] = useState<"ia" | "manual">("ia");
  const [fecha, setFecha] = useState(hoyISO);
  const [hora, setHora] = useState("05:00");
  const [mm, setMm] = useState(15);
  const [metodo, setMetodo] = useState("pivot1");
  const [lotes, setLotes] = useState<Record<string, boolean>>({});
  const [obs, setObs] = useState("");
  const [iaSel, setIaSel] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [guardando, setGuardando] = useState(false);

  // Lotes reales del usuario; preselecciona el activo (o el primero)
  const lotesOptions = React.useMemo(
    () => lotesProp.map((l) => ({ key: l.id, label: `${l.nombre}${l.cultivo ? ` — ${l.cultivo}` : ""}`, has: l.hectareas ? `${Math.round(l.hectareas)} Ha` : "—", nombre: l.nombre })),
    [lotesProp]
  );
  React.useEffect(() => {
    if (!open) return;
    setLotes((prev) => {
      if (Object.keys(prev).length) return prev;
      const init: Record<string, boolean> = {};
      const def = loteActivoId || lotesOptions[0]?.key;
      lotesOptions.forEach((o) => { init[o.key] = o.key === def; });
      return init;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lotesOptions]);

  if (!open) return null;

  const toggleLote = (k: string) => setLotes((p) => ({ ...p, [k]: !p[k] }));
  const selectedCount = Object.values(lotes).filter(Boolean).length;
  const lotesSel = lotesOptions.filter((o) => lotes[o.key]).map((o) => o.nombre);
  const metodoLabel = pivotOptions.find((p) => p.value === metodo)?.label || "Pivot Central 1";

  const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 };
  const modal: React.CSSProperties = { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 660, maxHeight: "92vh", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column" };

  const submitIA = async () => {
    const elegidas = sugerencias.filter((_, i) => iaSel[i]);
    if (elegidas.length === 0) return;
    setGuardando(true);
    for (const s of elegidas) {
      await onRegistrar({
        mm: s.mm,
        fecha: s.fecha,
        hora: "05:00",
        metodo: metodoLabel,
        lotes: lotesSel,
        observaciones: s.motivo,
        fuente: "ia",
      });
    }
    setGuardando(false);
    onClose();
  };

  const submitManual = async () => {
    setGuardando(true);
    await onRegistrar({ mm, fecha, hora, metodo: metodoLabel, lotes: lotesSel, observaciones: obs, fuente: "manual" });
    setGuardando(false);
    onClose();
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#2c82c9 0%,#1a5fa0 100%)", padding: "22px 28px 20px", color: "#fff", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>Agronomía · Plan de Riego</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26, display: "grid", placeItems: "center" }}><Icon name="droplet" size={26} /></span> Registrar Evento de Riego
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Confirmá una sugerencia IA o ingresá un riego manual.</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "#fff", width: 34, height: 34, fontSize: 17, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <button
              onClick={() => setModo("ia")}
              style={{ flex: 1, padding: "10px 14px", border: `2px solid ${modo === "ia" ? "#2c82c9" : "#c0c5ce"}`, borderRadius: 10, background: modo === "ia" ? "#eff6ff" : "#fff", color: modo === "ia" ? "#1e40af" : "var(--mc-ink)", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <IABadge /> Confirmar Sugerencia IA <span style={{ background: "#2c82c9", color: "#fff", borderRadius: 99, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{sugerencias.length}</span>
            </button>
            <button
              onClick={() => setModo("manual")}
              style={{ flex: 1, padding: "10px 14px", border: `2px solid ${modo === "manual" ? "#475569" : "#c0c5ce"}`, borderRadius: 10, background: modo === "manual" ? "#f1f5f9" : "#fff", color: modo === "manual" ? "#1e293b" : "var(--mc-ink)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Registro Manual
            </button>
          </div>

          {modo === "ia" ? (
            <>
              <Section title="Sugerencias IA — esta semana" icon="bolt" right={<span style={{ fontSize: 11, color: "#2c82c9", fontWeight: 600 }}>{sugerencias.length} detectadas</span>}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {sugerencias.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => setIaSel((p) => ({ ...p, [i]: !p[i] }))}
                      style={{ background: "#eff6ff", border: `1.5px solid ${iaSel[i] ? "#2c82c9" : "#bfdbfe"}`, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${iaSel[i] ? "#2c82c9" : "#c0c5ce"}`, background: iaSel[i] ? "#2c82c9" : "#fff", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>
                            {iaSel[i] && <svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f" }}>Riego Sugerido #{i + 1}</div>
                            <div style={{ fontSize: 13, color: "#2c82c9", fontWeight: 600 }}>{s.fecha} · 05:00</div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{lotesSel.join(" + ") || "Elegí lotes abajo"}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 26, fontWeight: 800, color: "#2c82c9", lineHeight: 1 }}>{s.mm} mm</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>recomendados</div>
                        </div>
                      </div>
                      <div style={{ background: "#dbeafe", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#1e40af", display: "flex", gap: 6, alignItems: "center" }}>
                        <IABadge /> Evita estrés severo · {s.motivo}
                        <span style={{ marginLeft: "auto", color: "#5e7733", fontWeight: 700, whiteSpace: "nowrap" }}>${s.costoUSD} USD</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Detalle del Evento" icon="map">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={lbl}>Fecha</label>
                    <input value="Según sugerencia IA" readOnly style={{ ...inp, background: "#f1f5f9", color: "#64748b" }} />
                  </div>
                  <div>
                    <label style={lbl}>Método</label>
                    <select value={metodo} onChange={(e) => setMetodo(e.target.value)} style={inp}>
                      {pivotOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </Section>

              <Section title="Ubicación Objetivo (según plan)" icon="wheat" right={<span style={{ fontSize: 11, color: "#2c82c9", fontWeight: 600 }}>{selectedCount} seleccionados</span>}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {lotesOptions.map((o) => (
                    <div key={o.key} onClick={() => toggleLote(o.key)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: `2px solid ${lotes[o.key] ? "#2c82c9" : "#c0c5ce"}`, background: lotes[o.key] ? "#eff6ff" : "#fff", cursor: "pointer" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${lotes[o.key] ? "#2c82c9" : "#c0c5ce"}`, background: lotes[o.key] ? "#2c82c9" : "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        {lotes[o.key] && <svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{o.label}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{o.has}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <button className="mc-btn mc-btn--block" style={{ background: "var(--mc-green-700)", color: "#fff" }} onClick={submitIA} disabled={guardando}>
                <Icon name="check" size={13} /> Confirmar Riego IA
              </button>
            </>
          ) : (
            <>
              <Section title="Cantidad de Agua" icon="droplet">
                <div style={{ display: "flex", alignItems: "stretch", gap: 14 }}>
                  <div style={{ flex: "0 0 160px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "#eff6ff", borderRadius: 12, padding: "14px 12px", border: "1.5px solid #bfdbfe" }}>
                    <div style={bigNum}>{mm}</div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>milímetros</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                      <button onClick={() => setMm((m) => Math.max(0, m - 5))} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #c0c5ce", background: "#fff", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>−</button>
                      <button onClick={() => setMm((m) => m + 5)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "#2c82c9", color: "#fff", fontSize: 16, cursor: "pointer", fontWeight: 700 }}>+</button>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
                    <div>
                      <label style={lbl}>Fecha</label>
                      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Hora de inicio</label>
                      <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={inp} />
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Ubicación y Sistema" icon="map">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={lbl}>Método</label>
                    <select value={metodo} onChange={(e) => setMetodo(e.target.value)} style={inp}>
                      {pivotOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Duración estimada</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input type="number" defaultValue={4} min={0} style={{ ...inp, width: 70 }} />
                      <select style={{ ...inp, flex: 1 }}>
                        <option>horas</option>
                        <option>minutos</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Lotes Incluidos" icon="wheat" right={<span style={{ fontSize: 11, color: "#2c82c9", fontWeight: 600 }}>{selectedCount} seleccionados</span>}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {lotesOptions.map((o) => (
                    <div key={o.key} onClick={() => toggleLote(o.key)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: `2px solid ${lotes[o.key] ? "#2c82c9" : "#c0c5ce"}`, background: lotes[o.key] ? "#eff6ff" : "#fff", cursor: "pointer" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${lotes[o.key] ? "#2c82c9" : "#c0c5ce"}`, background: lotes[o.key] ? "#2c82c9" : "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        {lotes[o.key] && <svg width="12" height="12" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{o.label}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{o.has}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Observaciones (opcional)" icon="pen">
                <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} placeholder="Ej: Riego complementario post-lluvia · Verificar caudal de pivot 1..." style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />
              </Section>

              <button className="mc-btn mc-btn--block" style={{ background: "var(--mc-green-700)", color: "#fff" }} onClick={submitManual} disabled={guardando}>
                <Icon name="check" size={13} /> Guardar Registro Manual
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
