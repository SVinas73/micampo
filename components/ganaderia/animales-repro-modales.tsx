"use client";

// Modales del ciclo reproductivo (AnimRepro): celo, servicio/inseminación,
// diagnóstico de gestación, pérdida, tratamiento durante gestación, parto y
// detalle del ciclo. Conectados a /api/eventos-reproductivos,
// /api/tratamientos-sanitarios y /api/animales — sin datos demo.

import React, { useState } from "react";
import { Icon } from "@/components/mc";
import { AnimalRow, fmtFechaCorta } from "./tipos";
import { SecNum } from "./animales-modales";

/* ============ REGISTRAR CELO ============ */

export function ModalRegistrarCelo({
  animales,
  onClose,
  onGuardado,
}: {
  animales: AnimalRow[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const pool = (animales || []).filter((a) => a.sexo === "H" && a.activo);
  const [busqueda, setBusqueda] = useState("");
  const [animalSel, setAnimalSel] = useState<AnimalRow | null>(null);
  const [momento, setMomento] = useState("Mañana");
  const [fechaCustom, setFechaCustom] = useState("");
  const [horaCustom, setHoraCustom] = useState("");
  const [signos, setSignos] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const resultados = q === "" ? [] : pool.filter((a) => a.id.toLowerCase().includes(q) || (a.nombre || "").toLowerCase().includes(q));
  const signosOpts = [
    { id: "Monta", label: "Monta", icon: "cow" },
    { id: "Flujo/Moco", label: "Flujo / Moco", icon: "droplet" },
    { id: "Bramido/Inquietud", label: "Bramido / Inquietud", icon: "bell" },
  ];
  const toggleSigno = (s: string) => setSignos((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));

  const confirmar = async () => {
    if (!animalSel) return;
    setGuardando(true);
    try {
      let fecha = new Date();
      if (momento === "Fecha personalizada" && fechaCustom) {
        fecha = new Date(`${fechaCustom}T${horaCustom || "08:00"}`);
      } else if (momento === "Mañana") {
        fecha.setHours(7, 0, 0, 0);
      } else if (momento === "Tarde") {
        fecha.setHours(17, 0, 0, 0);
      }
      await fetch("/api/eventos-reproductivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Celo",
          fecha: fecha.toISOString(),
          animalId: animalSel.dbId,
          observaciones: signos.length > 0 ? `Signos: ${signos.join(", ")}` : null,
        }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(480px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="row gap-10" style={{ alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--mc-green-50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="heart" size={18} style={{ color: "var(--mc-green-700)" }} />
              </div>
              <div className="mc-modal__title" style={{ fontSize: 20 }}>Registrar Celo</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <SecNum n={1} title="Animal" />
            <div className="row" style={{ background: "var(--mc-surface-2)", border: "1px solid var(--mc-line-2)", borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
              <Icon name="search" size={14} style={{ color: "var(--mc-text-3)" }} />
              <input value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setAnimalSel(null); }} placeholder="Buscar por caravana (ej. #4092)…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "inherit" }} />
            </div>
            {animalSel && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, border: "2px solid var(--mc-green-500)", background: "var(--mc-green-50)", marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0 }}>🐄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{animalSel.nombre || animalSel.id}</div>
                  <div style={{ fontSize: 11.5, color: "var(--mc-text-3)" }}>{animalSel.id} · {animalSel.raza !== "—" ? animalSel.raza : animalSel.categoria}</div>
                </div>
                <Icon name="check" size={14} style={{ color: "var(--mc-green-600)" }} />
              </div>
            )}
            {busqueda && !animalSel && (
              <div className="col gap-6" style={{ maxHeight: 160, overflowY: "auto" }}>
                {resultados.map((a) => (
                  <div key={a.dbId} onClick={() => setAnimalSel(a)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--mc-line)", background: "var(--mc-surface)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0 }}>🐄</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{a.nombre || a.id}</div>
                      <div style={{ fontSize: 11.5, color: "var(--mc-text-3)" }}>{a.id} · {a.raza !== "—" ? a.raza : a.categoria}</div>
                    </div>
                  </div>
                ))}
                {resultados.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin resultados.</div>}
              </div>
            )}
          </div>

          <div>
            <SecNum n={2} title="¿Cuándo se detectó?" />
            <div style={{ display: "flex", background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line-2)", borderRadius: 999, padding: 3, gap: 2 }}>
              {["Mañana", "Tarde", "Ahora", "Fecha personalizada"].map((o) => (
                <button key={o} type="button" onClick={() => setMomento(o)} style={{ flex: 1, padding: "8px 4px", borderRadius: 999, border: "none", fontSize: 11, fontWeight: momento === o ? 700 : 500, cursor: "pointer", background: momento === o ? "var(--mc-green-600)" : "transparent", color: momento === o ? "#fff" : "var(--mc-text-2)", whiteSpace: "nowrap" }}>{o}</button>
              ))}
            </div>
            {momento === "Fecha personalizada" && (
              <div className="grid g-cols-2 gap-8" style={{ marginTop: 10 }}>
                <div className="mc-field">
                  <label className="mc-label">Fecha</label>
                  <input type="date" className="mc-input" value={fechaCustom} onChange={(e) => setFechaCustom(e.target.value)} />
                </div>
                <div className="mc-field">
                  <label className="mc-label">Hora</label>
                  <input type="time" className="mc-input" value={horaCustom} onChange={(e) => setHoraCustom(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div style={{ background: "var(--mc-bg)", border: "1px solid var(--mc-line)", borderRadius: 12, padding: "14px 16px" }}>
            <SecNum n={3} title="Signos observados" />
            <div className="grid g-cols-3 gap-8">
              {signosOpts.map((s) => {
                const sel = signos.includes(s.id);
                return (
                  <button key={s.id} type="button" onClick={() => toggleSigno(s.id)} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 6px", borderRadius: 12, cursor: "pointer", border: sel ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
                    {sel && <Icon name="check" size={12} style={{ position: "absolute", top: 6, right: 6, color: "var(--mc-green-600)" }} />}
                    <Icon name={s.icon} size={18} style={{ color: sel ? "var(--mc-green-700)" : "var(--mc-text-2)" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: sel ? "var(--mc-green-700)" : "var(--mc-text-2)", textAlign: "center" }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }} disabled={!animalSel || guardando}>
            <Icon name="check" size={14} /> {guardando ? "Guardando…" : "Guardar Registro"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ REGISTRAR SERVICIO / INSEMINACIÓN ============ */

export function ModalRegistrarInseminacion({
  animales,
  animalPrefill,
  onClose,
  onGuardado,
}: {
  animales: AnimalRow[];
  animalPrefill?: AnimalRow | null;
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const pool = animales || [];
  const celoRecientes = pool.filter((a) => a.cicloEstado === "celo" && a.activo);
  const torosRodeo = pool.filter((a) => a.sexo === "M" && a.activo && (a.categoria === "Toro" || (a.edadMeses ?? 0) >= 24));
  const [animalSel, setAnimalSel] = useState<AnimalRow | null>(animalPrefill || null);
  const [manualId, setManualId] = useState("");
  const [tipo, setTipo] = useState<"IA" | "Monta natural">("IA");
  const [semenId, setSemenId] = useState("");
  const [toroSel, setToroSel] = useState<string>("");
  const [responsable, setResponsable] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const animalFinal =
    animalSel ||
    (manualId.trim()
      ? pool.find((a) => a.id.replace(/^#/, "").toLowerCase() === manualId.trim().replace(/^#/, "").toLowerCase()) || null
      : null);

  const confirmar = async () => {
    if (!animalFinal) return;
    if (tipo === "IA" && !semenId.trim()) {
      setError("Indicá la partida de semen / toro donante");
      return;
    }
    if (tipo === "Monta natural" && !toroSel) {
      setError("Seleccioná el toro del rodeo");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await fetch("/api/eventos-reproductivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Servicio",
          fecha: new Date().toISOString(),
          animalId: animalFinal.dbId,
          tipoServicio: tipo === "IA" ? "IA" : "Natural",
          semenId: tipo === "IA" ? semenId.trim() : null,
          toroId: tipo === "Monta natural" ? toroSel : null,
          observaciones: responsable.trim() ? `Responsable: ${responsable.trim()}` : null,
        }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(520px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="row gap-10" style={{ alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--mc-green-50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="star" size={18} style={{ color: "var(--mc-green-700)" }} />
              </div>
              <div className="mc-modal__title" style={{ fontSize: 20 }}>Registrar Servicio</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <SecNum n={1} title="Selección de hembra" />
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {celoRecientes.map((a) => {
                const sel = animalSel && animalSel.dbId === a.dbId;
                return (
                  <div key={a.dbId} onClick={() => { setAnimalSel(a); setManualId(""); }} style={{ flexShrink: 0, width: 112, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 8px", borderRadius: 12, cursor: "pointer", border: sel ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", fontSize: 16 }}>🐄</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)", textAlign: "center" }}>{a.id}</div>
                    <span className="mc-badge mc-badge--amber" style={{ fontSize: 9.5 }}>Celo: {a.celoDesde || "—"}</span>
                  </div>
                );
              })}
              {celoRecientes.length === 0 && !animalPrefill && <div style={{ fontSize: 12, color: "var(--mc-text-3)", padding: "8px 0" }}>Sin celos recientes registrados.</div>}
              {animalPrefill && !celoRecientes.some((c) => c.dbId === animalPrefill.dbId) && (
                <div style={{ flexShrink: 0, width: 112, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 8px", borderRadius: 12, border: "2px solid var(--mc-green-500)", background: "var(--mc-green-50)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", fontSize: 16 }}>🐄</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)", textAlign: "center" }}>{animalPrefill.id}</div>
                  <span className="mc-badge mc-badge--green" style={{ fontSize: 9.5 }}>Seleccionada</span>
                </div>
              )}
            </div>
            <input value={manualId} onChange={(e) => { setManualId(e.target.value); setAnimalSel(null); }} placeholder="O escribir caravana manual…" className="mc-input" style={{ marginTop: 8 }} />
            {manualId.trim() && !animalFinal && <div style={{ fontSize: 11, color: "var(--mc-red)", marginTop: 4 }}>No se encontró esa caravana en el rodeo.</div>}
          </div>

          <div>
            <SecNum n={2} title="Tipo de servicio" />
            <div style={{ display: "flex", background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line-2)", borderRadius: 10, padding: 3, gap: 2 }}>
              {(["IA", "Monta natural"] as const).map((o) => (
                <button key={o} onClick={() => setTipo(o)} type="button" style={{ flex: 1, padding: "9px 6px", borderRadius: 8, border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12.5, fontWeight: tipo === o ? 700 : 500, cursor: "pointer", background: tipo === o ? "var(--mc-green-600)" : "transparent", color: tipo === o ? "#fff" : "var(--mc-text-2)" }}>
                  {tipo === o && <Icon name="check" size={13} />}
                  {o === "IA" ? "Inseminación Artificial" : "Monta Natural / Toro"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SecNum n={3} title={tipo === "IA" ? "Toro / Semen (partida)" : "Seleccionar Toro del Rodeo"} />
            {tipo === "IA" ? (
              <input className="mc-input" value={semenId} onChange={(e) => setSemenId(e.target.value)} placeholder="Ej: AFTOSA-5 — Angus · partida 2214" />
            ) : (
              <div className="col gap-6">
                {torosRodeo.map((t) => {
                  const sel = toroSel === t.dbId;
                  return (
                    <div key={t.dbId} onClick={() => setToroSel(t.dbId)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, cursor: "pointer", border: sel ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
                      <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "var(--mc-ink)" }}>Toro {t.id}{t.raza !== "—" ? ` — ${t.raza}` : ""}</div>
                      {sel && <Icon name="check" size={14} style={{ color: "var(--mc-green-600)" }} />}
                    </div>
                  );
                })}
                {torosRodeo.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>No hay toros registrados en el rodeo.</div>}
              </div>
            )}
          </div>

          <div>
            <SecNum n={4} title="Responsable" />
            <input className="mc-input" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre del responsable" />
          </div>
          {error && <div style={{ fontSize: 12, color: "var(--mc-red)" }}>{error}</div>}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }} disabled={!animalFinal || guardando}>
            <Icon name="check" size={14} /> {guardando ? "Guardando…" : "Confirmar Servicio"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ DIAGNÓSTICO DE GESTACIÓN ============ */

export function ModalDiagnosticoGestacion({
  animal,
  onClose,
  onGuardado,
}: {
  animal: AnimalRow;
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const a = animal;
  const [metodo, setMetodo] = useState("Ecografía");
  const [resultado, setResultado] = useState<"Preñada" | "Vacía" | "Dudoso" | null>(null);
  const [edadGest, setEdadGest] = useState(35);
  const [sexado, setSexado] = useState("No visible");
  const [guardando, setGuardando] = useState(false);

  const fechaProbableParto = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (283 - edadGest));
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  })();

  const footerCfg: Record<string, { label: string; bg: string; color: string; border: string }> = {
    Preñada: { label: "Confirmar Preñez", bg: "var(--mc-green-600)", color: "#fff", border: "none" },
    Vacía: { label: "Confirmar Vacía", bg: "transparent", color: "var(--mc-red)", border: "1.5px solid var(--mc-red)" },
    Dudoso: { label: "Guardar como Dudoso", bg: "transparent", color: "var(--mc-text-2)", border: "1.5px solid var(--mc-line-2)" },
  };
  const cfg = resultado ? footerCfg[resultado] : null;

  const confirmar = async () => {
    if (!resultado) return;
    setGuardando(true);
    try {
      await fetch("/api/eventos-reproductivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Diagnostico",
          fecha: new Date().toISOString(),
          animalId: a.dbId,
          resultado,
          diasGestacion: resultado === "Preñada" ? edadGest : null,
          observaciones: [`Método: ${metodo}`, resultado === "Preñada" && sexado !== "No visible" ? `Sexado: ${sexado}` : null]
            .filter(Boolean)
            .join(" · "),
        }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(520px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 24px 16px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="row gap-10" style={{ alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>🐄</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>{a.nombre || a.id} <span style={{ fontWeight: 500, color: "var(--mc-text-3)", fontSize: 12.5 }}>{a.id}{a.raza !== "—" ? " · " + a.raza : ""}</span></div>
                <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>{a.fechaServicio ? `Servida el ${a.fechaServicio}` : "Sin servicio registrado"}</div>
              </div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
          <span className="mc-badge mc-badge--blue" style={{ marginTop: 10, display: "inline-flex" }}>Esperando Diagnóstico</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="row gap-10" style={{ background: "var(--mc-blue-bg)", border: "1px solid rgba(44,107,184,0.25)", borderRadius: 12, padding: "12px 14px", alignItems: "center" }}>
            <Icon name="activity" size={18} style={{ color: "var(--mc-blue)" }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--mc-blue)" }}>Diagnóstico de Gestación</span>
          </div>

          <div>
            <SecNum n={1} title="Resultado del diagnóstico" />
            <div className="col gap-12">
              <div style={{ display: "flex", background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line-2)", borderRadius: 10, padding: 3, gap: 2 }}>
                {["Tacto Rectal", "Ecografía"].map((o) => (
                  <button key={o} type="button" onClick={() => setMetodo(o)} style={{ flex: 1, padding: "8px 6px", borderRadius: 8, border: "none", fontSize: 12.5, fontWeight: metodo === o ? 700 : 500, cursor: "pointer", background: metodo === o ? "var(--mc-green-600)" : "transparent", color: metodo === o ? "#fff" : "var(--mc-text-2)" }}>{o}</button>
                ))}
              </div>
              <div className="grid g-cols-3 gap-8">
                <button type="button" onClick={() => setResultado("Preñada")} style={{ padding: "12px 6px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12.5, border: resultado === "Preñada" ? "none" : "1.5px solid var(--mc-line-2)", background: resultado === "Preñada" ? "var(--mc-green-600)" : "var(--mc-surface)", color: resultado === "Preñada" ? "#fff" : "var(--mc-text-2)" }}>
                  <Icon name="check" size={14} /> PREÑADA
                </button>
                <button type="button" onClick={() => setResultado("Vacía")} style={{ padding: "12px 6px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12.5, background: "var(--mc-surface)", border: resultado === "Vacía" ? "2px solid var(--mc-red)" : "1.5px solid var(--mc-line-2)", color: "var(--mc-red)" }}>
                  <Icon name="x" size={14} /> VACÍA
                </button>
                <button type="button" onClick={() => setResultado("Dudoso")} style={{ padding: "12px 6px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12.5, background: "var(--mc-surface)", border: resultado === "Dudoso" ? "2px solid var(--mc-text-2)" : "1.5px solid var(--mc-line-2)", color: "var(--mc-text-2)" }}>
                  ? DUDOSO
                </button>
              </div>
            </div>
          </div>

          {resultado === "Preñada" && (
            <div style={{ background: "var(--mc-bg)", border: "1px solid var(--mc-line)", borderRadius: 12, padding: "14px 16px" }}>
              <SecNum n={2} title="Detalles de la preñez" />
              <div className="col gap-14">
                <div>
                  <label className="mc-label">Edad Gestacional Estimada</label>
                  <input type="range" min="1" max="283" value={edadGest} onChange={(e) => setEdadGest(+e.target.value)} style={{ width: "100%", accentColor: "var(--mc-green-600)" }} />
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--mc-ink)", marginTop: 4 }}>{edadGest} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--mc-text-3)" }}>días</span></div>
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--mc-blue-bg)", border: "1px solid rgba(44,107,184,0.25)", fontSize: 12.5, color: "var(--mc-blue)", fontWeight: 600 }}>
                  Fecha probable de parto: {fechaProbableParto}
                </div>
                <div>
                  <label className="mc-label">Sexado (si aplica)</label>
                  <div style={{ display: "flex", background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line-2)", borderRadius: 10, padding: 3, gap: 2, marginTop: 6 }}>
                    {["Macho", "Hembra", "No visible"].map((o) => (
                      <button key={o} type="button" onClick={() => setSexado(o)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", fontSize: 11.5, fontWeight: sexado === o ? 700 : 500, cursor: "pointer", background: sexado === o ? "var(--mc-green-600)" : "transparent", color: sexado === o ? "#fff" : "var(--mc-text-2)" }}>{o}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} className="mc-btn" style={{ flex: 2, justifyContent: "center", background: cfg ? cfg.bg : "var(--mc-line)", color: cfg ? cfg.color : "var(--mc-text-3)", border: cfg ? cfg.border : "none" }} disabled={!resultado || guardando}>
            <Icon name="check" size={14} /> {guardando ? "Guardando…" : cfg ? cfg.label : "Confirmar Diagnóstico"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ PÉRDIDA GESTACIONAL ============ */

export function ModalPerdidaGestacion({
  animal,
  onClose,
  onGuardado,
}: {
  animal: AnimalRow;
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const a = animal;
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [tipoDeteccion, setTipoDeteccion] = useState("Reabsorción");
  const [causa, setCausa] = useState("Traumática");
  const [muestraLab, setMuestraLab] = useState(false);
  const [estadoMadre, setEstadoMadre] = useState("Viva");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  const confirmar = async () => {
    setGuardando(true);
    try {
      await fetch("/api/eventos-reproductivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Aborto",
          fecha: fecha || new Date().toISOString(),
          animalId: a.dbId,
          observaciones: [
            `Detección: ${tipoDeteccion}`,
            `Causa presuntiva: ${causa}`,
            muestraLab ? "Muestra enviada a laboratorio" : null,
            `Madre: ${estadoMadre}`,
            observaciones.trim() || null,
          ]
            .filter(Boolean)
            .join(" · "),
        }),
      });
      // Si la madre murió, dar de baja el animal
      if (estadoMadre === "Muerta") {
        await fetch(`/api/animales/${a.dbId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accion: "baja", motivoBaja: "Muerte", fechaBaja: fecha, observacionesBaja: "Distocia grave / pérdida gestacional" }),
        });
      }
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(520px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 24px 16px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="row gap-10" style={{ alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>🐄</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>{a.nombre || a.id} <span style={{ fontWeight: 500, color: "var(--mc-text-3)", fontSize: 12.5 }}>{a.id}</span></div>
                <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>Estaba Preñada</div>
              </div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--mc-red)", marginTop: 12 }} />
          <div style={{ fontSize: 11, color: "var(--mc-red)", fontWeight: 700, marginTop: 6 }}>Interrupción de Gestación</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="row gap-10" style={{ background: "var(--mc-red-bg)", border: "1px solid rgba(201,52,52,0.25)", borderRadius: 12, padding: "12px 14px", alignItems: "center" }}>
            <Icon name="alert" size={18} style={{ color: "var(--mc-red)" }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--mc-red)" }}>Registro de Aborto / Merma</span>
          </div>

          <div>
            <SecNum n={1} title="Evidencia y tipo" />
            <div className="col gap-12">
              <div className="mc-field">
                <label className="mc-label">Fecha estimada</label>
                <input type="date" className="mc-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="col gap-8">
                {[["Reabsorción", "Vaca vacía al tacto (Reabsorción)"], ["Expulsión", "Feto encontrado (Expulsión)"]].map(([id, label]) => (
                  <div key={id} onClick={() => setTipoDeteccion(id)} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: tipoDeteccion === id ? "2px solid var(--mc-red)" : "1px solid var(--mc-line)", background: tipoDeteccion === id ? "var(--mc-red-bg)" : "var(--mc-surface)", fontSize: 12.5, fontWeight: 600, color: tipoDeteccion === id ? "var(--mc-red)" : "var(--mc-ink)" }}>{label}</div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <SecNum n={2} title="Diagnóstico presuntivo (causa)" />
            <div className="col gap-10">
              <select className="mc-select" value={causa} onChange={(e) => setCausa(e.target.value)}>
                {["Traumática", "Infecciosa (Leptospirosis)", "Nutricional", "Desconocida"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--mc-text-2)", cursor: "pointer" }}>
                <input type="checkbox" checked={muestraLab} onChange={(e) => setMuestraLab(e.target.checked)} style={{ width: 15, height: 15, accentColor: "var(--mc-green-600)" }} />
                Se tomó muestra del feto/placenta para laboratorio
              </label>
            </div>
          </div>

          <div>
            <SecNum n={3} title="Estado de la madre" />
            <div className="col gap-12">
              <div style={{ display: "flex", gap: 6 }}>
                {["Viva", "Muerta"].map((o) => (
                  <button key={o} type="button" onClick={() => setEstadoMadre(o)} style={{ flex: 1, padding: "9px 6px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: estadoMadre === o ? (o === "Muerta" ? "2px solid var(--mc-red)" : "2px solid var(--mc-green-500)") : "1px solid var(--mc-line-2)", background: estadoMadre === o ? (o === "Muerta" ? "var(--mc-red-bg)" : "var(--mc-green-50)") : "var(--mc-surface)", color: estadoMadre === o ? (o === "Muerta" ? "var(--mc-red)" : "var(--mc-green-700)") : "var(--mc-text-2)" }}>{o === "Viva" ? "Madre Viva" : "Madre Muerta — Distocia grave"}</button>
                ))}
              </div>
              <div className="mc-field">
                <label className="mc-label">Observaciones veterinarias</label>
                <textarea className="mc-textarea" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones veterinarias…" />
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <button onClick={confirmar} disabled={guardando} className="mc-btn mc-btn--red" style={{ justifyContent: "center" }}>
            <Icon name="check" size={14} /> {guardando ? "Guardando…" : "Registrar Pérdida"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ TRATAMIENTO DURANTE GESTACIÓN ============ */

export function ModalTratamientoGestacion({
  animal,
  onClose,
  onGuardado,
}: {
  animal: AnimalRow;
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const a = animal;
  const [diagnostico, setDiagnostico] = useState("");
  const [gravedad, setGravedad] = useState(0);
  const [producto, setProducto] = useState("Oxitetraciclina 20%");
  const [dosis, setDosis] = useState("");
  const [via, setVia] = useState("Intramuscular");
  const [retiroHoras, setRetiroHoras] = useState(72);
  const [cintaRoja, setCintaRoja] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const gravedadLabels = ["Leve", "Moderada", "Grave"];
  const gravedadColors = ["var(--mc-green-600)", "var(--mc-amber)", "var(--mc-red)"];

  const liberaLeche = (() => {
    const d = new Date();
    d.setHours(d.getHours() + retiroHoras);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  })();

  const confirmar = async () => {
    if (!diagnostico.trim()) return;
    setGuardando(true);
    try {
      await fetch("/api/tratamientos-sanitarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: a.dbId,
          tipo: "Tratamiento",
          diagnostico: diagnostico.trim(),
          severidad: gravedadLabels[gravedad],
          medicamento: producto,
          dosis,
          via,
          dosisTotales: 1,
          aplicarPrimeraAhora: true,
          retiroHoras,
          marcaZonas: cintaRoja ? ["cola"] : [],
          marcaColor: cintaRoja ? "#dc2626" : null,
          notas: "Tratamiento durante gestación",
        }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(520px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 24px 16px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="row gap-10" style={{ alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>🐄</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>{a.nombre || a.id} <span style={{ fontWeight: 500, color: "var(--mc-text-3)", fontSize: 12.5 }}>{a.id}</span></div>
                <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>{a.cicloEstado === "prenada" ? "Preñada" : a.estado}</div>
              </div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "#FF9D00", marginTop: 12 }} />
          <div style={{ fontSize: 11, color: "#a85f00", fontWeight: 700, marginTop: 6 }}>Gestación en Curso</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="row gap-10" style={{ background: "#FF9D00", borderRadius: 12, padding: "12px 14px", alignItems: "center" }}>
            <Icon name="syringe" size={18} style={{ color: "#fff" }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Tratamiento Sanitario</span>
          </div>

          <div>
            <SecNum n={1} title="¿Qué estamos tratando?" />
            <div className="col gap-14">
              <div className="mc-field">
                <label className="mc-label">Diagnóstico</label>
                <input className="mc-input" list="dxOpts" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} placeholder="Ej: Pietín, Queratoconjuntivitis, Mastitis…" />
                <datalist id="dxOpts">
                  <option value="Pietín" /><option value="Queratoconjuntivitis" /><option value="Mastitis" />
                </datalist>
              </div>
              <div>
                <label className="mc-label">Gravedad</label>
                <input type="range" min="0" max="2" step="1" value={gravedad} onChange={(e) => setGravedad(+e.target.value)}
                  style={{ width: "100%", accentColor: gravedadColors[gravedad], marginTop: 6, height: 6, borderRadius: 999 }} />
                <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: gravedadColors[gravedad], marginTop: 4 }}>{gravedadLabels[gravedad]}</div>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--mc-bg)", border: "1px solid var(--mc-line)", borderRadius: 12, padding: "14px 16px" }}>
            <SecNum n={2} title="Aplicación" />
            <div className="col gap-12">
              <div className="mc-field">
                <label className="mc-label">Producto</label>
                <select className="mc-select" value={producto} onChange={(e) => setProducto(e.target.value)}>
                  {["Oxitetraciclina 20%", "Penicilina/Estreptomicina", "Vitamina AD3E", "Antiinflamatorio (Flunixin)"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="grid g-cols-2">
                <div className="mc-field">
                  <label className="mc-label">Dosis (ml)</label>
                  <input type="number" className="mc-input" value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="0" />
                </div>
                <div className="mc-field">
                  <label className="mc-label">Vía</label>
                  <div style={{ display: "flex", background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line-2)", borderRadius: 10, padding: 3, gap: 2 }}>
                    {["Intramuscular", "Subcutánea", "Local"].map((o) => (
                      <button key={o} type="button" onClick={() => setVia(o)} style={{ flex: 1, padding: "7px 3px", borderRadius: 8, border: "none", fontSize: 10.5, fontWeight: via === o ? 700 : 500, cursor: "pointer", background: via === o ? "var(--mc-green-600)" : "transparent", color: via === o ? "#fff" : "var(--mc-text-2)" }}>{o}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--mc-amber-bg)", border: "1px solid rgba(196,132,16,0.3)", borderRadius: 12, padding: "14px 16px" }}>
            <div className="row gap-8" style={{ marginBottom: 10, alignItems: "center" }}>
              <Icon name="alert" size={16} style={{ color: "var(--mc-amber)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-amber)", textTransform: "uppercase", letterSpacing: ".04em" }}>Restricción / Carencia</span>
            </div>
            <div className="col gap-10">
              <div className="mc-field">
                <label className="mc-label">Período de retiro (horas)</label>
                <input type="number" className="mc-input" value={retiroHoras} onChange={(e) => setRetiroHoras(+e.target.value || 0)} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--mc-amber)", fontWeight: 600 }}>Liberar leche el: {liberaLeche}</div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--mc-text-2)", cursor: "pointer" }}>
                <input type="checkbox" checked={cintaRoja} onChange={(e) => setCintaRoja(e.target.checked)} style={{ width: 15, height: 15, accentColor: "var(--mc-amber)" }} />
                Marcar animal con cinta roja
              </label>
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} disabled={!diagnostico.trim() || guardando} className="mc-btn" style={{ flex: 2, justifyContent: "center", background: "#FF9D00", color: "#fff", border: "none", fontWeight: 700 }}>
            <Icon name="check" size={14} /> {guardando ? "Guardando…" : "Guardar Tratamiento"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ REGISTRO DE PARTO ============ */

export function ModalPartoRegistro({
  animal,
  onClose,
  onGuardado,
}: {
  animal: AnimalRow;
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const a = animal;
  const [tLabor, setTLabor] = useState("");
  const [tBolsa, setTBolsa] = useState("");
  const [tNacimiento, setTNacimiento] = useState("");
  const [dificultad, setDificultad] = useState("Normal");
  const [presentacion, setPresentacion] = useState("Anterior — Normal");
  const [criaEstado, setCriaEstado] = useState("Vivo");
  const [sexoCria, setSexoCria] = useState("Hembra");
  const [pesoCria, setPesoCria] = useState("");
  const [idCria, setIdCria] = useState(`${a.id || "#0000"}-H`);
  const [vigor, setVigor] = useState("Normal");
  const [calostro, setCalostro] = useState(false);
  const [horaCalostro, setHoraCalostro] = useState("");
  const [placenta, setPlacenta] = useState(false);
  const [dteNumero, setDteNumero] = useState("");
  const [guardando, setGuardando] = useState(false);

  const dificultadOpts = [
    { id: "Normal", label: "Normal / Sola", color: "var(--mc-green-600)", bg: "var(--mc-green-50)" },
    { id: "Asistido", label: "Ayuda Manual Leve", color: "var(--mc-amber)", bg: "var(--mc-amber-bg)" },
    { id: "Extractor", label: "Extractor Mecánico", color: "#a85f00", bg: "#FFF3E0" },
    { id: "Cesárea", label: "Cesárea Vet.", color: "var(--mc-red)", bg: "var(--mc-red-bg)" },
  ];

  const steps = [
    { id: "labor", label: "Inicio Labor/Inquieta", icon: "activity", val: tLabor, set: setTLabor },
    { id: "bolsa", label: "Ruptura Bolsa/Aguas", icon: "droplet", val: tBolsa, set: setTBolsa },
    { id: "nace", label: "Expulsión/Nacimiento", icon: "cow", val: tNacimiento, set: setTNacimiento },
  ];

  const confirmar = async () => {
    setGuardando(true);
    try {
      const idProvisorio = (idCria && idCria.trim()) || `${a.id}-C${Date.now() % 1000}`;
      // 1. Evento reproductivo Parto (actualiza historial)
      await fetch("/api/eventos-reproductivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "Parto",
          fecha: new Date().toISOString(),
          animalId: a.dbId,
          numCrias: 1,
          condicionParto: dificultad,
          crias: criaEstado === "Vivo" ? idProvisorio : null,
          observaciones: [
            `Presentación: ${presentacion}`,
            `Cría: ${criaEstado} (${sexoCria})`,
            vigor !== "Normal" ? `Vigor: ${vigor}` : null,
            calostro ? `Calostro 1ra hora${horaCalostro ? ` (${horaCalostro})` : ""}` : null,
            placenta ? "Placenta expulsada" : null,
            tLabor ? `Labor: ${tLabor}` : null,
            tNacimiento ? `Nacimiento: ${tNacimiento}` : null,
            dteNumero.trim() ? `Doc: ${dteNumero.trim()}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
        }),
      });
      // 2. Alta de la cría si nació viva
      if (criaEstado === "Vivo") {
        await fetch("/api/animales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caravana: idProvisorio.replace(/^#/, ""),
            tipo: a.tipo || "Bovino",
            categoria: sexoCria === "Hembra" ? "Ternera" : "Ternero",
            raza: a.raza !== "—" ? a.raza : null,
            sexo: sexoCria,
            fechaNacimiento: new Date().toISOString(),
            pesoNacimiento: pesoCria || null,
            madre: a.id,
            origen: "Nacimiento",
            condicionNacimiento: dificultad === "Normal" ? "Normal" : dificultad === "Cesárea" ? "Cesárea" : "Distócico",
            ubicacion: a.lote !== "—" ? a.lote : null,
            tropaId: a.tropaId,
          }),
        });
      }
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(560px,96vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 24px 16px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="row gap-10" style={{ alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>🐄</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>{a.nombre || a.id} <span style={{ fontWeight: 500, color: "var(--mc-text-3)", fontSize: 12.5 }}>{a.id}</span></div>
                <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>{a.dia >= 268 ? "A Término" : `Día ${a.dia} de gestación`}</div>
              </div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--mc-green-600)", marginTop: 12 }} />
          <div style={{ fontSize: 11, color: "var(--mc-green-700)", fontWeight: 700, marginTop: 6 }}>Gestación Finalizada (9 meses)</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="row gap-10" style={{ background: "var(--mc-green-50)", border: "1px solid var(--mc-green-200)", borderRadius: 12, padding: "12px 14px", alignItems: "center" }}>
            <Icon name="cow" size={18} style={{ color: "var(--mc-green-700)" }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--mc-green-700)" }}>Registrando Parto</span>
          </div>

          <div>
            <SecNum n={1} title="Línea de tiempo del proceso" />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
              {steps.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: "1 1 0" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: s.val ? "var(--mc-green-600)" : "var(--mc-surface)", border: s.val ? "2px solid var(--mc-green-600)" : "2px solid var(--mc-line-2)", color: s.val ? "#fff" : "var(--mc-text-3)" }}>
                      <Icon name={s.val ? "check" : s.icon} size={14} />
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--mc-text-2)", textAlign: "center", lineHeight: 1.3 }}>{s.label}</div>
                    <input type="time" value={s.val} onChange={(e) => s.set(e.target.value)} className="mc-input" style={{ padding: "6px 8px", fontSize: 11.5, textAlign: "center" }} />
                  </div>
                  {i < steps.length - 1 && <div style={{ flex: "0 0 24px", height: 2, background: steps[i + 1].val || s.val ? "var(--mc-green-600)" : "var(--mc-line-2)", marginTop: 15 }} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div>
            <SecNum n={2} title="Detalles de la expulsión" />
            <div className="col gap-12">
              <div className="grid g-cols-4 gap-8">
                {dificultadOpts.map((o) => {
                  const sel = dificultad === o.id;
                  return (
                    <button key={o.id} type="button" onClick={() => setDificultad(o.id)} style={{ padding: "10px 4px", borderRadius: 10, cursor: "pointer", fontSize: 10.5, fontWeight: 700, textAlign: "center", border: sel ? `2px solid ${o.color}` : "1px solid var(--mc-line-2)", background: sel ? o.bg : "var(--mc-surface)", color: sel ? o.color : "var(--mc-text-2)" }}>{o.label}</button>
                  );
                })}
              </div>
              <div className="mc-field">
                <label className="mc-label">Presentación</label>
                <select className="mc-select" value={presentacion} onChange={(e) => setPresentacion(e.target.value)}>
                  {["Anterior — Normal", "Podálica", "Distócica", "Transversal"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--mc-bg)", border: "1px solid var(--mc-line)", borderRadius: 12, padding: "14px 16px" }}>
            <SecNum n={3} title="La cría y post-parto inmediato" />
            <div className="col gap-12">
              <div className="grid g-cols-2">
                <div className="mc-field">
                  <label className="mc-label">Cría</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["Vivo", "Muerto"].map((o) => (
                      <button key={o} type="button" onClick={() => setCriaEstado(o)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: "pointer", border: criaEstado === o ? (o === "Muerto" ? "2px solid var(--mc-red)" : "2px solid var(--mc-green-500)") : "1px solid var(--mc-line-2)", background: criaEstado === o ? (o === "Muerto" ? "var(--mc-red-bg)" : "var(--mc-green-50)") : "var(--mc-surface)", color: criaEstado === o ? (o === "Muerto" ? "var(--mc-red)" : "var(--mc-green-700)") : "var(--mc-text-2)" }}>{o}</button>
                    ))}
                  </div>
                </div>
                <div className="mc-field">
                  <label className="mc-label">Sexo</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["Macho", "Hembra"].map((o) => (
                      <button key={o} type="button" onClick={() => { setSexoCria(o); setIdCria(`${a.id || "#0000"}-${o === "Hembra" ? "H" : "M"}`); }} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11.5, fontWeight: sexoCria === o ? 700 : 500, cursor: "pointer", border: sexoCria === o ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line-2)", background: sexoCria === o ? "var(--mc-green-50)" : "var(--mc-surface)", color: sexoCria === o ? "var(--mc-green-700)" : "var(--mc-text-2)" }}>{o}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid g-cols-2">
                <div className="mc-field">
                  <label className="mc-label">Peso (kg)</label>
                  <input type="number" className="mc-input" value={pesoCria} onChange={(e) => setPesoCria(e.target.value)} placeholder="Ej: 34" />
                </div>
                <div className="mc-field">
                  <label className="mc-label">ID Cría (sugerido)</label>
                  <input className="mc-input" value={idCria} onChange={(e) => setIdCria(e.target.value)} />
                </div>
              </div>
              <div className="mc-field">
                <label className="mc-label">Vigor de la cría</label>
                <div style={{ display: "flex", background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line-2)", borderRadius: 10, padding: 3, gap: 2 }}>
                  {["Débil", "Normal", "Vigoroso"].map((o) => (
                    <button key={o} type="button" onClick={() => setVigor(o)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", fontSize: 11.5, fontWeight: vigor === o ? 700 : 500, cursor: "pointer", background: vigor === o ? "var(--mc-green-600)" : "transparent", color: vigor === o ? "#fff" : "var(--mc-text-2)" }}>{o}</button>
                  ))}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--mc-text-2)", cursor: "pointer" }}>
                <input type="checkbox" checked={calostro} onChange={(e) => setCalostro(e.target.checked)} style={{ width: 15, height: 15, accentColor: "var(--mc-green-600)" }} />
                Toma de calostro (1ra hora)
              </label>
              {calostro && (
                <input type="time" className="mc-input" value={horaCalostro} onChange={(e) => setHoraCalostro(e.target.value)} style={{ maxWidth: 160 }} />
              )}
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--mc-text-2)", cursor: "pointer" }}>
                <input type="checkbox" checked={placenta} onChange={(e) => setPlacenta(e.target.checked)} style={{ width: 15, height: 15, accentColor: "var(--mc-green-600)" }} />
                Placenta expulsada
              </label>
            </div>
          </div>

          <div className="mc-field">
            <label className="mc-label">Identificación (opcional)</label>
            <input className="mc-input" value={dteNumero} onChange={(e) => setDteNumero(e.target.value)} placeholder="Nº de documento de tránsito si ya lo generaste, o dejalo vacío" />
            <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 6 }}>Si no lo completás ahora, vas a poder declararlo después desde Trazabilidad.</div>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} disabled={guardando} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }}>
            <Icon name="check" size={14} /> {guardando ? "Guardando…" : "Finalizar Parto y Guardar Cría"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ DETALLE DEL CICLO REPRODUCTIVO ============ */

export function ModalDetalleCicloReproductivo({
  animal,
  badge,
  onClose,
}: {
  animal: AnimalRow;
  badge?: { label: string; bg: string; text: string };
  onClose: () => void;
}) {
  const a = animal;
  const dia = a.dia || 0;
  const prog = Math.round((dia / 283) * 100);
  const sm = badge || { label: a.cicloEstado, bg: "#f1f5f9", text: "#475569" };

  const eventos: { fecha: string; tipo: string; badge: string; detalle: string }[] = [];
  if (a.fechaCelo) eventos.push({ fecha: a.fechaCelo, tipo: "Celo detectado", badge: "neutral", detalle: "Signos de celo confirmados" });
  if (a.fechaServicio) eventos.push({ fecha: a.fechaServicio, tipo: "Servicio / Inseminación", badge: "blue", detalle: a.toro || "Servicio natural" });
  if (a.fechaDiagnostico) eventos.push({ fecha: a.fechaDiagnostico, tipo: "Diagnóstico", badge: a.resultadoDiagnostico === "Preñada" ? "green" : "neutral", detalle: a.resultadoDiagnostico === "Preñada" ? "Preñez confirmada" : `Diagnóstico: ${a.resultadoDiagnostico || "—"}` });
  a.tratamientosActivos.forEach((t) => eventos.push({ fecha: fmtFechaCorta(t.fechaInicio), tipo: "Tratamiento", badge: "amber", detalle: `${t.diagnostico}${t.medicamento ? ` · ${t.medicamento}` : ""}` }));
  if (a.cicloEstado === "prenada" && 283 - dia <= 15) eventos.push({ fecha: "Estimado", tipo: "Parto próximo", badge: "amber", detalle: `Fecha probable: ${a.parto}` });
  if (a.cicloEstado === "perdida") eventos.push({ fecha: a.fechaPerdida || "—", tipo: "Pérdida gestacional", badge: "red", detalle: "Pérdida registrada durante la gestación" });

  const stats = [
    { label: "Fecha de Celo", value: a.fechaCelo || "—" },
    { label: "Fecha de Servicio", value: a.fechaServicio || "—" },
    { label: "Resultado Diagnóstico", value: a.resultadoDiagnostico || "Pendiente" },
    { label: "Días de Gestación", value: a.cicloEstado === "prenada" ? `${dia} / 283` : "—" },
    { label: "Fecha Probable de Parto", value: a.cicloEstado === "prenada" ? a.parto : "—" },
  ];

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(740px,96vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="row gap-10" style={{ alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e8f5e9", display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0 }}>🐄</div>
              <div>
                <div className="mc-modal__title" style={{ fontSize: 19 }}>{a.nombre || a.id}</div>
                <div style={{ fontSize: 11.5, color: "var(--mc-text-3)" }}>{a.id} · {a.raza !== "—" ? a.raza : a.categoria}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sm.bg, color: sm.text, marginLeft: 8, whiteSpace: "nowrap" }}>{sm.label}</span>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {stats.map((s) => {
              const weight = Math.max(s.label.length, String(s.value).length, 10);
              return (
                <div key={s.label} style={{ flex: `${weight} 1 128px`, minWidth: 128, padding: "10px 14px", background: "var(--mc-surface-2)", borderRadius: 10, border: "1px solid var(--mc-line)" }}>
                  <div style={{ fontSize: 9.5, color: "var(--mc-text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>{s.value}</div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: "14px 16px", background: a.cicloEstado === "prenada" ? "linear-gradient(90deg,#f0fdf4,var(--mc-surface))" : "var(--mc-surface-2)", borderRadius: 10, border: a.cicloEstado === "prenada" ? "1px solid #bbf7d0" : "1px solid var(--mc-line)" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Progreso de Gestación</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>{a.cicloEstado === "prenada" ? `Día ${dia} / 283` : "No aplica"}</span>
            </div>
            <div style={{ height: 10, borderRadius: 6, background: "#e2e8f0", overflow: "hidden", position: "relative" }}>
              <div style={{ height: "100%", width: `${prog}%`, borderRadius: 6, background: "linear-gradient(90deg,#166534,#22c55e)" }} />
              {a.cicloEstado === "prenada" && <div style={{ position: "absolute", left: `${prog}%`, top: "50%", transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: "#fff", border: "3px solid #16a34a" }} />}
            </div>
            <div className="row" style={{ justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 9, color: "var(--mc-muted)" }}>0 días</span>
              <span style={{ fontSize: 9, color: "var(--mc-muted)" }}>283 días</span>
            </div>
          </div>

          <div style={{ padding: "14px 16px", background: "var(--mc-surface-2)", borderRadius: 10, border: "1px solid var(--mc-line)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Timeline del Ciclo</div>
            <div className="mc-timeline" style={{ paddingLeft: 12 }}>
              {eventos.map((e, i) => (
                <div key={i} className="mc-tl-item" style={{ gridTemplateColumns: "24px 1fr", paddingLeft: 0 }}>
                  <div className={"mc-tl-item__dot" + (e.badge !== "green" ? " mc-tl-item__dot--" + e.badge : "")} />
                  <div style={{ minWidth: 0, paddingBottom: i < eventos.length - 1 ? 6 : 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", marginBottom: 2 }}>{e.fecha}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mc-ink)" }}>{e.tipo}</div>
                    <div style={{ fontSize: 11.5, color: "var(--mc-text-3)", marginTop: 1 }}>{e.detalle}</div>
                  </div>
                </div>
              ))}
              {eventos.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin eventos registrados todavía.</div>}
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--ghost">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
