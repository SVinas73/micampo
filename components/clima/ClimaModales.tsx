"use client";

import React, { useState } from "react";
import { Icon, IABadge } from "@/components/mc";

export type LoteOpt = { id?: string; nombre: string; ha: number };

/* ---- shared inline styles (Figma fidelity) ---- */
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

function ModalShell({
  headBg,
  eyebrow,
  emoji,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  headBg: string;
  eyebrow: string;
  emoji: string;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,22,36,0.55)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 660,
          maxHeight: "92vh",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: headBg,
            padding: "22px 28px 20px",
            color: "#fff",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>
              {eyebrow}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "grid", placeItems: "center" }}><Icon name={emoji} size={26} /></span> {title}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{subtitle}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              color: "#fff",
              width: 34,
              height: 34,
              fontSize: 17,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ padding: "22px 28px", overflowY: "auto", flex: 1 }}>{children}</div>

        <div style={{ padding: "16px 28px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          {footer}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, display: "grid", placeItems: "center" }}><Icon name={icon} size={14} /></span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        {right}
      </div>
      {children}
    </div>
  );
}

/* Hierarchical campo -> lotes selector */
function LoteSelector({
  lotes,
  selected,
  onToggle,
  onToggleAll,
  accent,
  campoNombre,
}: {
  lotes: LoteOpt[];
  selected: Set<number>;
  onToggle: (i: number) => void;
  onToggleAll: () => void;
  accent: string;
  campoNombre?: string;
}) {
  const all = lotes.length > 0 && selected.size === lotes.length;
  const some = selected.size > 0 && !all;
  return (
    <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
      <div
        onClick={onToggleAll}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          background: some || all ? `${accent}10` : "#f8fafc",
          cursor: "pointer",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            border: `2px solid ${all || some ? accent : "#c0c5ce"}`,
            background: all ? accent : some ? `${accent}55` : "#fff",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {all && (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          )}
          {some && <div style={{ width: 8, height: 2, background: "#fff" }} />}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{campoNombre || "Lotes del campo"}</div>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>{selected.size}/{lotes.length}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 10 }}>
        {lotes.map((o, i) => {
          const on = selected.has(i);
          return (
            <div
              key={i}
              onClick={() => onToggle(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                border: `2px solid ${on ? accent : "#c0c5ce"}`,
                background: on ? `${accent}10` : "#fff",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  border: `2px solid ${on ? accent : "#c0c5ce"}`,
                  background: on ? accent : "#fff",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {on && (
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{o.nombre}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{o.ha} Ha</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= REGISTRAR LLUVIA ================= */
export type LluviaResult = {
  mm: number;
  fecha: string;
  hora: string;
  duracion: string;
  loteIdx: number | null;
  loteId?: string;
  loteNombre: string;
  condiciones: string[];
};

const COND_LLUVIA = [
  { key: "Granizo", color: "#c93434", icon: "droplet" },
  { key: "Viento Fuerte", color: "#c08a22", icon: "wind" },
  { key: "Actividad Eléctrica", color: "#7c3aed", icon: "bolt" },
  { key: "Torrencial / Lavado", color: "#2c82c9", icon: "droplet" },
  { key: "Lluvia Mansa (Efectiva)", color: "#768f44", icon: "cloud" },
  { key: "Caminos Intransitables", color: "#92400e", icon: "truck" },
];

export function RegistrarLluviaModal({
  lotes,
  initial,
  campoNombre,
  onClose,
  onSave,
}: {
  lotes: LoteOpt[];
  initial?: Partial<LluviaResult>;
  campoNombre?: string;
  onClose: () => void;
  onSave: (r: LluviaResult) => void;
}) {
  const [mm, setMm] = useState(initial?.mm ?? 45);
  const [fecha, setFecha] = useState(initial?.fecha ?? new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState(initial?.hora ?? "04:30");
  const [duracion, setDuracion] = useState(initial?.duracion ?? "2");
  const [sel, setSel] = useState<Set<number>>(new Set(lotes.length > 0 ? [0] : []));
  const [conds, setConds] = useState<Set<string>>(new Set(initial?.condiciones ?? []));

  const toggleLote = (i: number) =>
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const toggleAll = () => setSel((prev) => (prev.size === lotes.length ? new Set() : new Set(lotes.map((_, i) => i))));
  const toggleCond = (k: string) =>
    setConds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const guardar = () => {
    const firstIdx = sel.size > 0 ? [...sel][0] : null;
    const lote = firstIdx !== null ? lotes[firstIdx] : undefined;
    onSave({
      mm,
      fecha,
      hora,
      duracion,
      loteIdx: firstIdx,
      loteId: lote?.id,
      loteNombre:
        sel.size === 0
          ? "Campo General"
          : sel.size === lotes.length
            ? "Todos los lotes"
            : [...sel].map((i) => lotes[i].nombre).join(", "),
      condiciones: [...conds],
    });
  };

  return (
    <ModalShell
      headBg="linear-gradient(135deg,#2c82c9 0%,#1a5fa0 100%)"
      eyebrow="Agricultura · Clima · Registro"
      emoji="droplet"
      title="Registrar Evento Pluviométrico"
      subtitle="Cargá la cantidad de lluvia, ubicación y condiciones del evento."
      onClose={onClose}
      footer={
        <>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--blue mc-btn--block" style={{ flex: 1, maxWidth: 240 }} onClick={guardar}>
            <Icon name="droplet" size={14} /> Guardar Registro
          </button>
        </>
      }
    >
      <Section title="Cantidad de Agua" icon="droplet">
        <div style={{ display: "flex", alignItems: "stretch", gap: 14 }}>
          <div
            style={{
              flex: "0 0 180px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              background: "#eff6ff",
              borderRadius: 12,
              padding: "14px 12px",
              border: "1.5px solid #bfdbfe",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <input
                value={mm}
                onChange={(e) => setMm(Math.max(0, parseInt(e.target.value.replace(/\D/g, "")) || 0))}
                style={{
                  width: 90,
                  fontSize: 44,
                  fontWeight: 800,
                  color: "#2c82c9",
                  lineHeight: 1,
                  textAlign: "center",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "inherit",
                }}
              />
              <span style={{ fontSize: 16, color: "#2c82c9", fontWeight: 700 }}>mm</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>milímetros</div>
            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
              <button
                onClick={() => setMm((m) => Math.max(0, m - 5))}
                style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #c0c5ce", background: "#fff", fontSize: 16, cursor: "pointer", fontWeight: 700 }}
              >
                −
              </button>
              <button
                onClick={() => setMm((m) => m + 5)}
                style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "#2c82c9", color: "#fff", fontSize: 16, cursor: "pointer", fontWeight: 700 }}
              >
                +
              </button>
            </div>
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
            <div>
              <label style={lbl}>Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Hora</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={inp} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>Duración (horas)</label>
              <input type="number" value={duracion} min={0} onChange={(e) => setDuracion(e.target.value)} style={inp} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Ubicación" icon="map" right={<span style={{ fontSize: 11, color: "#2c82c9", fontWeight: 600 }}>{sel.size} seleccionados</span>}>
        <LoteSelector lotes={lotes} selected={sel} onToggle={toggleLote} onToggleAll={toggleAll} accent="#2c82c9" campoNombre={campoNombre} />
      </Section>

      <Section title="Condiciones del Evento" icon="bolt">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {COND_LLUVIA.map((c) => {
            const on = conds.has(c.key);
            return (
              <button
                key={c.key}
                onClick={() => toggleCond(c.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 9,
                  border: `2px solid ${on ? c.color : "#c0c5ce"}`,
                  background: on ? `${c.color}14` : "#fff",
                  color: on ? c.color : "#475569",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 16, display: "grid", placeItems: "center" }}><Icon name={c.icon} size={16} /></span>
                {c.key}
              </button>
            );
          })}
        </div>
      </Section>
    </ModalShell>
  );
}

/* ================= REPORTAR ALERTA CLIMÁTICA ================= */
export type AlertaResult = {
  severidad: string;
  tipo: string;
  loteNombre: string;
  loteId?: string;
  fecha: string;
  hora: string;
  duracion: string;
};

const TIPOS_ALERTA = [
  { key: "Granizo", icon: "droplet" },
  { key: "Viento / Voladura", icon: "wind" },
  { key: "Helada", icon: "droplet" },
  { key: "Inundación / Anegamiento", icon: "droplet" },
  { key: "Descarga Eléctrica", icon: "bolt" },
  { key: "Foco de Incendio", icon: "bolt" },
];

export function ReportarAlertaModal({
  lotes,
  campoNombre,
  onClose,
  onSave,
}: {
  lotes: LoteOpt[];
  campoNombre?: string;
  onClose: () => void;
  onSave: (r: AlertaResult) => void;
}) {
  const SEVERIDADES = [
    { key: "Leve", color: "#768f44" },
    { key: "Moderado", color: "#d9a538" },
    { key: "Severo - Daño", color: "#c93434" },
  ];
  const [severidad, setSeveridad] = useState("Moderado");
  const [tipo, setTipo] = useState("Granizo");
  const [sel, setSel] = useState<Set<number>>(new Set(lotes.length > 0 ? [0] : []));
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState(new Date().toTimeString().slice(0, 5));
  const [duracion, setDuracion] = useState("1");

  const toggleLote = (i: number) =>
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const toggleAll = () => setSel((prev) => (prev.size === lotes.length ? new Set() : new Set(lotes.map((_, i) => i))));

  const guardar = () => {
    const firstIdx = sel.size > 0 ? [...sel][0] : null;
    const lote = firstIdx !== null ? lotes[firstIdx] : undefined;
    onSave({
      severidad,
      tipo,
      loteId: lote?.id,
      loteNombre:
        sel.size === 0
          ? "Área General"
          : sel.size === lotes.length
            ? "Todos los lotes"
            : [...sel].map((i) => lotes[i].nombre).join(", "),
      fecha,
      hora,
      duracion,
    });
  };

  const sevColor = SEVERIDADES.find((s) => s.key === severidad)?.color || "#d9a538";

  return (
    <ModalShell
      headBg="linear-gradient(135deg,#c08a22 0%,#b45309 100%)"
      eyebrow="Agricultura · Clima · Alertas"
      emoji="alert"
      title="Reportar Evento Climático"
      subtitle="Documentá un evento climático adverso y los lotes afectados."
      onClose={onClose}
      footer={
        <>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn" style={{ background: "#c08a22", color: "white", flex: 1, maxWidth: 240, justifyContent: "center" }} onClick={guardar}>
            <Icon name="alert" size={14} /> Guardar Alerta
          </button>
        </>
      }
    >
      <Section title="Severidad" icon="scale">
        <div style={{ display: "flex", gap: 8 }}>
          {SEVERIDADES.map((s) => {
            const on = severidad === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSeveridad(s.key)}
                style={{
                  flex: 1,
                  padding: "12px 10px",
                  borderRadius: 10,
                  border: `2px solid ${on ? s.color : "#c0c5ce"}`,
                  background: on ? `${s.color}14` : "#fff",
                  color: on ? s.color : "#475569",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {s.key}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Tipo de Evento" icon="wind">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {TIPOS_ALERTA.map((t) => {
            const on = tipo === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTipo(t.key)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "14px 8px",
                  borderRadius: 10,
                  border: `2px solid ${on ? sevColor : "#c0c5ce"}`,
                  background: on ? `${sevColor}12` : "#fff",
                  color: on ? "#1e293b" : "#475569",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 24, display: "grid", placeItems: "center" }}><Icon name={t.icon} size={24} /></span>
                {t.key}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Lotes Afectados" icon="wheat" right={<span style={{ fontSize: 11, color: "#c08a22", fontWeight: 600 }}>{sel.size} seleccionados</span>}>
        <LoteSelector lotes={lotes} selected={sel} onToggle={toggleLote} onToggleAll={toggleAll} accent="#c08a22" campoNombre={campoNombre} />
      </Section>

      <Section title="Fecha y Hora del Inicio" icon="clock">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <label style={lbl}>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Hora</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Duración aprox. (h)</label>
            <input type="number" value={duracion} min={0} onChange={(e) => setDuracion(e.target.value)} style={inp} />
          </div>
        </div>
      </Section>

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
        <IABadge /> Tip: documentá el evento ni bien ocurra para una trazabilidad precisa de daños.
      </div>
    </ModalShell>
  );
}
