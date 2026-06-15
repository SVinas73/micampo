"use client";

import React, { useState } from "react";
import { Icon } from "@/components/mc";
import type { LoteUI } from "./lotes-data";

const inp: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1.5px solid #c0c5ce",
  background: "#fff",
  color: "var(--mc-ink)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
const lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: ".04em",
  display: "block",
};

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon name={icon} size={14} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      </div>
      {children}
    </div>
  );
}

/* ========== AGREGAR CAMPO / NUEVO LOTE (Figma: Crear Nuevo Establecimiento) ========== */
export interface AgregarCampoData {
  nombre: string;
  ubicacion: string;
  hectareas: number;
  tenencia: "propio" | "arrendado";
  valor?: string;
  moneda?: string;
  frecuencia?: string;
}

export function AgregarCampoModal({
  titulo = "Crear Nuevo Establecimiento",
  onClose,
  onConfirm,
}: {
  titulo?: string;
  onClose: () => void;
  onConfirm: (data: AgregarCampoData) => Promise<void> | void;
}) {
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [hectareas, setHectareas] = useState("100");
  const [tenencia, setTenencia] = useState<"propio" | "arrendado">("propio");
  const [valor, setValor] = useState("");
  const [moneda, setMoneda] = useState("USD/Ha");
  const [frecuencia, setFrecuencia] = useState("Anual");
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (!nombre.trim() || saving) return;
    setSaving(true);
    await onConfirm({ nombre: nombre.trim(), ubicacion, hectareas: parseFloat(hectareas) || 0, tenencia, valor, moneda, frecuencia });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: 620, maxWidth: "100%", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "22px 28px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Agricultura · Campo Digital · Lotes</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--mc-ink)" }}>{titulo}</h3>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#64748b", fontSize: 17, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px", overflowY: "auto", flex: 1 }}>
          <Section icon="pen" title="Datos del Establecimiento">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={lbl}>Nombre</label>
                  <input style={inp} placeholder="Ej: Campo La Arboleda" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Ubicación</label>
                  <input style={inp} placeholder="Ej: Ruta 5, Km 40" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Hectáreas</label>
                  <input style={inp} type="number" placeholder="Ej: 120" value={hectareas} onChange={(e) => setHectareas(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={lbl}>Vista previa</label>
                <div style={{ height: 86, borderRadius: 8, border: "1.5px solid #c0c5ce", background: "linear-gradient(135deg, #d4e8d4 0%, #b8d9b8 40%, #9ecfa0 100%)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={`h${i}`} style={{ position: "absolute", left: 0, right: 0, top: `${i * 33}%`, height: 1, background: "#4f9d52" }} />
                    ))}
                    {[0, 1, 2, 3].map((i) => (
                      <div key={`v${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${i * 33}%`, width: 1, background: "#4f9d52" }} />
                    ))}
                  </div>
                  <div style={{ width: 20, height: 20, background: "#475569", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", border: "3px solid white", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
            </div>
          </Section>

          <Section icon="users" title="Régimen de Tenencia">
            <div style={{ display: "flex", gap: 8 }}>
              {([["propio", "Propio"], ["arrendado", "Arrendado"]] as const).map(([val, label]) => {
                const sel = tenencia === val;
                return (
                  <button
                    key={val}
                    onClick={() => setTenencia(val)}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: sel ? "2px solid var(--mc-green-600)" : "1.5px solid #c0c5ce", background: sel ? "rgba(34,162,97,0.08)" : "#fff", color: sel ? "var(--mc-green-600)" : "var(--mc-ink)", fontWeight: sel ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    {sel && <Icon name="check" size={12} />} {label}
                  </button>
                );
              })}
            </div>
          </Section>

          {tenencia === "arrendado" && (
            <Section icon="book" title="Condiciones del Contrato (opcional)">
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...inp, width: 100, flexShrink: 0 }} type="number" placeholder="180" value={valor} onChange={(e) => setValor(e.target.value)} />
                <select style={{ ...inp, flex: 1 }} value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                  {["USD/Ha", "UYU/Ha", "ARS/Ha", "USD total", "UYU total", "ARS total"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <select style={{ ...inp, flex: 1 }} value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
                  {["Anual", "Semestral", "Mensual"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" style={{ gap: 6 }} disabled={!nombre.trim() || saving} onClick={guardar}>
            <Icon name="map" size={14} />{saving ? "Guardando..." : "Guardar y Dibujar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== ELIMINAR CAMPO (destructivo) ========== */
export function EliminarCampoModal({
  campos,
  onClose,
  onConfirm,
}: {
  campos: { nombre: string; lotes: number }[];
  onClose: () => void;
  onConfirm: (campo: string) => Promise<void> | void;
}) {
  const [campo, setCampo] = useState(campos[0]?.nombre ?? "");
  const [confirmado, setConfirmado] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const seleccionado = campos.find((c) => c.nombre === campo) || campos[0];

  const eliminar = async () => {
    if (!confirmado || borrando || !campo) return;
    setBorrando(true);
    await onConfirm(campo);
    setBorrando(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: 500, maxWidth: "100%", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header gradiente peligro */}
        <div style={{ background: "linear-gradient(135deg,#dc2626 0%,#7f1d1d 100%)", padding: "22px 28px 20px", color: "#fff", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>Acción irreversible</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="alert" size={26} /> Eliminar Establecimiento
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Esta acción borrará todos los datos asociados</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#fff", fontSize: 17, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px", overflowY: "auto", flex: 1 }}>
          <Section icon="map" title="Establecimiento">
            <label style={lbl}>Seleccione el campo a eliminar</label>
            <select value={campo} onChange={(e) => { setCampo(e.target.value); setConfirmado(false); }} style={inp}>
              {campos.map((c) => (
                <option key={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </Section>

          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Icon name="alert" size={18} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#b91c1c", marginBottom: 4 }}>¡Acción irreversible!</div>
              <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.5 }}>
                Al eliminar <strong>{campo}</strong>, se borrarán también sus{" "}
                <strong>{seleccionado?.lotes ?? 0} Lotes</strong>, el historial de lluvias y los registros de cosecha.
              </div>
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--mc-ink)", padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
            <input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#dc2626", cursor: "pointer" }} />
            Soy consciente de que perderé los datos
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button
            disabled={!confirmado || borrando}
            onClick={eliminar}
            className="mc-btn"
            style={{ background: confirmado ? "#dc2626" : "#fca5a5", color: "#fff", border: "none", cursor: confirmado ? "pointer" : "not-allowed" }}
          >
            <Icon name="trash" size={14} />{borrando ? "Eliminando..." : "Eliminar Definitivamente"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== EDITAR LOTE ========== */
export interface EditarLoteData {
  nombre: string;
  hectareas: number;
  cultivo: string;
}

export function EditarLoteModal({
  lote,
  onClose,
  onConfirm,
}: {
  lote: LoteUI;
  onClose: () => void;
  onConfirm: (data: EditarLoteData) => Promise<void> | void;
}) {
  const [nombre, setNombre] = useState(lote.name);
  const [hectareas, setHectareas] = useState(String(lote.ha));
  const [cultivo, setCultivo] = useState(lote.cultivo ?? "");
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (!nombre.trim() || saving) return;
    setSaving(true);
    await onConfirm({ nombre: nombre.trim(), hectareas: parseFloat(hectareas) || lote.ha, cultivo });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: 460, maxWidth: "100%", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Campo Digital · Lotes</div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--mc-ink)" }}>Editar Lote {lote.id}</h3>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748b", display: "grid", placeItems: "center" }}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={lbl}>Nombre</label>
            <input style={inp} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Hectáreas</label>
              <input style={inp} type="number" value={hectareas} onChange={(e) => setHectareas(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Cultivo</label>
              <select style={inp} value={cultivo} onChange={(e) => setCultivo(e.target.value)}>
                <option value="">Sin asignar</option>
                {["Soja", "Maíz", "Trigo", "Alfalfa", "Girasol", "Trébol"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" disabled={!nombre.trim() || saving} onClick={guardar}>
            <Icon name="check" size={14} />{saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== NUEVA TAREA (labor simple) ========== */
export interface NuevaTareaData {
  tipo: string;
  fecha: string; // yyyy-mm-dd
  descripcion: string;
}

export function NuevaTareaModal({
  lote,
  onClose,
  onConfirm,
}: {
  lote: LoteUI;
  onClose: () => void;
  onConfirm: (data: NuevaTareaData) => Promise<void> | void;
}) {
  const [tipo, setTipo] = useState("Pulverización");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (saving) return;
    setSaving(true);
    await onConfirm({ tipo, fecha, descripcion: descripcion.trim() || `${tipo} en ${lote.name}` });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: 460, maxWidth: "100%", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Campo Digital · Labores</div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--mc-ink)" }}>Nueva Tarea · {lote.id} {lote.name}</h3>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748b", display: "grid", placeItems: "center" }}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Tipo de labor</label>
              <select style={inp} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {["Siembra", "Cosecha", "Pulverización", "Fertilización", "Labranza", "Riego", "Monitoreo"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Fecha</label>
              <input style={inp} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Descripción</label>
            <input style={inp} placeholder={`Ej: ${tipo} programada en ${lote.name}`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div style={{ padding: "8px 12px", background: "var(--mc-surface-2)", borderRadius: 8, fontSize: 12, color: "var(--mc-text-2)" }}>
            Superficie a trabajar: <strong style={{ color: "var(--mc-ink)" }}>{lote.ha} Ha</strong> (total del lote)
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" disabled={saving} onClick={guardar}>
            <Icon name="plus" size={14} />{saving ? "Creando..." : "Crear Tarea"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== TIMELINE DEL LOTE (modal Historial) ========== */
export function TimelineLoteModal({
  lote,
  eventos,
  onClose,
}: {
  lote: LoteUI;
  eventos?: { fecha: string; tipo: string; detail: string; color: string; icon: string }[];
  onClose: () => void;
}) {
  const evs =
    eventos && eventos.length > 0
      ? eventos
      : [
          { fecha: "18/Abr", tipo: "Pulverización", detail: "Glifosato 3 L/Ha · J. Pérez", color: "var(--mc-orange-500)", icon: "flask" },
          { fecha: "10/Abr", tipo: "Fertilización", detail: "Urea 120 kg/Ha", color: "var(--mc-amber)", icon: "leaf" },
          { fecha: "22/Mar", tipo: "Siembra", detail: `${lote.variety || "Var. estándar"} · 80 kpa`, color: "var(--mc-green-500)", icon: "sprout" },
          { fecha: "15/Mar", tipo: "Análisis suelo", detail: "pH 6.2 · MO 2.8%", color: "var(--mc-blue)", icon: "activity" },
          { fecha: "02/Mar", tipo: "Labranza", detail: "Cincel vibratorio · 25 cm", color: "var(--mc-text-2)", icon: "wrench" },
        ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div style={{ background: "var(--mc-surface)", borderRadius: 14, padding: 24, width: 420, maxWidth: "90vw", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div className="mc-card__eyebrow">Timeline del Lote</div>
            <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 16, marginTop: 2 }}>{lote.id} · {lote.name}</div>
          </div>
          <button className="mc-icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div style={{ position: "relative", paddingLeft: 22 }}>
          <div style={{ position: "absolute", left: 9, top: 4, bottom: 4, width: 2, background: "var(--mc-line)" }}></div>
          {evs.map((ev, i) => (
            <div key={i} style={{ position: "relative", paddingBottom: i < evs.length - 1 ? 14 : 0, paddingLeft: 8 }}>
              <div style={{ position: "absolute", left: -13, top: 2, width: 20, height: 20, borderRadius: "50%", background: ev.color, color: "white", display: "grid", placeItems: "center", border: "2px solid var(--mc-surface)" }}>
                <Icon name={ev.icon} size={10} />
              </div>
              <div className="font-mono text-xs" style={{ color: "var(--mc-text-3)" }}>{ev.fecha}</div>
              <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{ev.tipo}</div>
              <div className="text-xs text-muted">{ev.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== FILTROS ========== */
export interface FiltrosLotes {
  campo: string;
  cultivo: string;
  estado: string;
}

export function FiltrosPopover({
  filtros,
  campos,
  onChange,
  onClose,
}: {
  filtros: FiltrosLotes;
  campos: string[];
  onChange: (f: FiltrosLotes) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<FiltrosLotes>(filtros);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.3)", zIndex: 9000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 140 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 12, width: 380, maxWidth: "92vw", padding: 20, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 15 }}>
            <Icon name="filter" size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />Filtros
          </div>
          <button className="mc-icon-btn" onClick={onClose}><Icon name="x" size={13} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={lbl}>Campo</label>
            <select style={inp} value={local.campo} onChange={(e) => setLocal({ ...local, campo: e.target.value })}>
              <option>Todos</option>
              {campos.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Cultivo</label>
            <select style={inp} value={local.cultivo} onChange={(e) => setLocal({ ...local, cultivo: e.target.value })}>
              {["Todos", "Soja", "Maíz", "Trigo", "Alfalfa", "Girasol", "Sin asignar"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <select style={inp} value={local.estado} onChange={(e) => setLocal({ ...local, estado: e.target.value })}>
              {["Todos", "Saludable", "Atención"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => { onChange({ campo: "Todos", cultivo: "Todos", estado: "Todos" }); onClose(); }}>Limpiar</button>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => { onChange(local); onClose(); }}>Aplicar</button>
        </div>
      </div>
    </div>
  );
}
