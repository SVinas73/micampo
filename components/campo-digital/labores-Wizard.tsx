"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/mc";

/* ============================================================
   Wizard "Nueva Orden de Labor" — 6 pasos, fiel al Figma:
   1 Selección de Actividad · 2 Lote y Superficie · 3 Maquinaria y RRHH
   4 Configuración Técnica · 5 Insumos · 6 Resumen y Costos
   ============================================================ */

export interface OrdenLabor {
  actividad: string;
  categoria: string;
  prioridad: "Normal" | "Urgente";
  lotes: { id?: string; nombre: string; ha: number }[];
  haNetas: number;
  operario: string;
  tractor: string;
  implemento: string;
  parametros: Record<string, string>;
  insumos: { nombre: string; dosis: string; unidad: string }[];
  costoTotal: number;
}

const ACTIVIDADES: { categoria: string; icon: string; items: string[] }[] = [
  { categoria: "Siembra & Plantación", icon: "sprout", items: ["Directa Fina", "Directa Gruesa", "Voleo/Cobertura", "Re-siembra"] },
  { categoria: "Labranza", icon: "wrench", items: ["Arado", "Rastrillado", "Subsolado", "Nivelación"] },
  { categoria: "Forrajes y Reservas", icon: "leaf", items: ["Corte/Segado", "Enfardado Prism.", "Enrollado", "Picado/Silaje"] },
  { categoria: "Protección & Nutrición", icon: "shieldCheck", items: ["Pulverización", "Fertilización", "Riego", "Bioestimulante"] },
];

const STEPS = ["Selección de Actividad", "Lote y Superficie", "Maquinaria y RRHH", "Configuración Técnica", "Insumos", "Resumen y Costos"];

const INSUMOS_CATALOGO = [
  { nombre: "Urea Granulada", stock: 25000, unidad: "kg" },
  { nombre: "Urea Líquida (UAN)", stock: 0, unidad: "kg" },
  { nombre: "Maíz Híbrido DK-7272", stock: 120, unidad: "bolsas" },
  { nombre: "Starter Fosforado", stock: 180, unidad: "L" },
  { nombre: "Glifosato 48%", stock: 850, unidad: "L" },
  { nombre: "Semilla Soja SY 5x1", stock: 320, unidad: "bolsas" },
  { nombre: "Inoculante", stock: 12, unidad: "L" },
];

export function NuevaOrdenLaborModal({
  lotesDisponibles,
  onClose,
  onEmitir,
  onBorrador,
}: {
  lotesDisponibles: { id?: string; nombre: string; ha: number; tag?: string }[];
  onClose: () => void;
  onEmitir: (orden: OrdenLabor) => Promise<void> | void;
  onBorrador: (orden: OrdenLabor) => void;
}) {
  const [step, setStep] = useState(0);
  const [prioridad, setPrioridad] = useState<"Normal" | "Urgente">("Normal");
  const [busqueda, setBusqueda] = useState("");
  const [actividad, setActividad] = useState("");
  const [categoria, setCategoria] = useState("");
  const [lotesSel, setLotesSel] = useState<Set<number>>(new Set());
  const [operario, setOperario] = useState("Marcos Gonzalez");
  const [tractor, setTractor] = useState("John Deere 7230R");
  const [implemento, setImplemento] = useState("Sembradora Pla STC");
  const [parametros, setParametros] = useState<Record<string, string>>({});
  const [insumos, setInsumos] = useState<{ nombre: string; dosis: string; unidad: string; stock: number }[]>([]);
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [emitiendo, setEmitiendo] = useState(false);

  // Cargar configuración por defecto según actividad
  useEffect(() => {
    if (actividad === "Enrollado" || actividad === "Enfardado Prism.") {
      setParametros({ "Presión Hidráulica (bar)": "140", "Diámetro Rollo (m)": "1.50", "Núcleo": "Blando", "Sistema de Atado": "Red (Malla)", "Vueltas de Red": "2.5", "Número de Red": "20", "Picado (Cutter)": "ON", "Cuchillas Activas": "12" });
    } else if (actividad === "Pulverización" || actividad === "Bioestimulante") {
      setParametros({ "Presión de trabajo (bar)": "3.0", "Caudal (L/Ha)": "80", "Velocidad (km/h)": "18", "Tipo de boquilla": "Abanico plano", "Ancho de banda (m)": "28" });
    } else if (categoria === "Siembra & Plantación") {
      setParametros({ "Densidad (sem/Ha)": "80000", "Profundidad (cm)": "5", "Distancia entre líneas (cm)": "52" });
    } else if (actividad === "Fertilización") {
      setParametros({ "Dosis (kg/Ha)": "120", "Forma": "Sólida" });
    } else if (actividad === "Riego") {
      setParametros({ "Lámina objetivo (mm)": "15", "Caudal sistema (m³/h)": "220" });
    } else if (categoria === "Labranza") {
      setParametros({ "Profundidad de trabajo (cm)": "25", "Velocidad (km/h)": "9", "Ancho de labor (m)": "4.2" });
    }
  }, [actividad, categoria]);

  const haNetas = useMemo(() => {
    const bruta = Array.from(lotesSel).reduce((s, i) => s + (lotesDisponibles[i]?.ha || 0), 0);
    return Math.max(0, bruta - (lotesSel.size > 1 ? 5 : 0));
  }, [lotesSel, lotesDisponibles]);
  const haBrutas = Array.from(lotesSel).reduce((s, i) => s + (lotesDisponibles[i]?.ha || 0), 0);

  const costoTotal = useMemo(() => {
    const base = actividad.includes("Pulver") ? 18 : categoria === "Siembra & Plantación" ? 45 : 33.2;
    const insumosCosto = insumos.length * 6.5;
    return Math.round((base + insumosCosto) * haNetas);
  }, [actividad, categoria, insumos, haNetas]);

  const puedeAvanzar =
    step === 0 ? !!actividad : step === 1 ? lotesSel.size > 0 : true;

  const armarOrden = (): OrdenLabor => ({
    actividad, categoria, prioridad,
    lotes: Array.from(lotesSel).map((i) => lotesDisponibles[i]),
    haNetas, operario, tractor, implemento, parametros,
    insumos: insumos.map(({ nombre, dosis, unidad }) => ({ nombre, dosis, unidad })),
    costoTotal,
  });

  const emitir = async () => {
    if (emitiendo) return;
    setEmitiendo(true);
    await onEmitir(armarOrden());
    setEmitiendo(false);
  };

  const insumosFiltrados = busquedaInsumo.trim()
    ? INSUMOS_CATALOGO.filter((i) => i.nombre.toLowerCase().includes(busquedaInsumo.toLowerCase()))
    : [];

  const inputS: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid var(--mc-line-2)", fontSize: 13.5, background: "var(--mc-surface)", color: "var(--mc-ink)" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--mc-surface)", borderRadius: 16, width: 1060, maxWidth: "98vw", maxHeight: "94vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)" }}>Nueva Orden de Labor #4030</div>
          <div className="row gap-10">
            <span className="text-sm text-muted">Prioridad:</span>
            <div className="mc-seg">
              <button className={prioridad === "Normal" ? "is-on" : ""} onClick={() => setPrioridad("Normal")}>[ Normal ]</button>
              <button
                className={prioridad === "Urgente" ? "is-on" : ""}
                style={prioridad === "Urgente" ? { background: "#e7892b", color: "white" } : undefined}
                onClick={() => setPrioridad("Urgente")}
              >
                [ 🔥 Urgente ]
              </button>
            </div>
            <button className="mc-icon-btn" onClick={onClose}><Icon name="x" size={15} /></button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", flex: 1, minHeight: 0 }}>
          {/* Sidebar de pasos */}
          <div style={{ borderRight: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", padding: "14px 0", overflowY: "auto" }}>
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div
                  key={s}
                  onClick={() => done && setStep(i)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", cursor: done ? "pointer" : "default",
                    borderLeft: active ? "3px solid var(--mc-green-600)" : "3px solid transparent",
                    background: active ? "var(--mc-green-50)" : "transparent",
                  }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1, background: done ? "var(--mc-green-600)" : active ? "var(--mc-green-100)" : "var(--mc-surface-3)", color: done ? "white" : active ? "var(--mc-green-800)" : "var(--mc-text-3)" }}>
                    {done ? <Icon name="check" size={11} /> : i + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "var(--mc-ink)" : done ? "var(--mc-green-700)" : "var(--mc-text-3)" }}>{s}</div>
                    {done && <div style={{ fontSize: 10, color: "var(--mc-green-600)", fontWeight: 600 }}>✓ Completed</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contenido del paso */}
          <div style={{ padding: "20px 24px", overflowY: "auto" }}>
            {/* PASO 1: Selección de Actividad */}
            {step === 0 && (
              <div className="col gap-16">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="mc-card__title" style={{ fontSize: 18 }}>Seleccione la Actividad a Realizar</div>
                  <div style={{ position: "relative", width: 240 }}>
                    <Icon name="search" size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--mc-text-3)" }} />
                    <input style={{ ...inputS, paddingLeft: 32 }} placeholder="Buscar tarea..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                  </div>
                </div>
                {ACTIVIDADES.map((cat) => {
                  const items = cat.items.filter((it) => !busqueda.trim() || it.toLowerCase().includes(busqueda.toLowerCase()));
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.categoria}>
                      <div className="row gap-8" style={{ marginBottom: 10 }}>
                        <Icon name={cat.icon} size={15} style={{ color: "var(--mc-text-2)" }} />
                        <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 15 }}>{cat.categoria}</span>
                      </div>
                      <div className="grid g-cols-4 gap-8">
                        {items.map((it) => {
                          const sel = actividad === it;
                          return (
                            <button
                              key={it}
                              onClick={() => { setActividad(it); setCategoria(cat.categoria); }}
                              style={{
                                padding: "16px 12px", borderRadius: 12, cursor: "pointer", position: "relative", textAlign: "center",
                                border: sel ? "2px solid var(--mc-green-600)" : "1px solid var(--mc-line-2)",
                                background: sel ? "var(--mc-green-50)" : "var(--mc-surface)",
                              }}
                            >
                              {sel && (
                                <span style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: "var(--mc-green-600)", color: "white", display: "grid", placeItems: "center" }}>
                                  <Icon name="check" size={11} />
                                </span>
                              )}
                              <div style={{ display: "grid", placeItems: "center", marginBottom: 8 }}>
                                <Icon name={cat.icon} size={22} style={{ color: sel ? "var(--mc-green-700)" : "var(--mc-text-2)" }} />
                              </div>
                              <div className="text-sm font-semi" style={{ color: "var(--mc-ink)" }}>[{it}]</div>
                            </button>
                          );
                        })}
                        {cat.categoria === "Forrajes y Reservas" && (
                          <button
                            onClick={() => { setActividad("Labor personalizada"); setCategoria(cat.categoria); }}
                            style={{ padding: "16px 12px", borderRadius: 12, cursor: "pointer", textAlign: "center", border: "1px dashed var(--mc-line-2)", background: "transparent", color: "var(--mc-text-3)" }}
                          >
                            <div style={{ display: "grid", placeItems: "center", marginBottom: 8 }}><Icon name="plus" size={22} /></div>
                            <div className="text-sm">Crear Nuevo Tipo de Labor</div>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PASO 2: Lote y Superficie */}
            {step === 1 && (
              <div className="col gap-14">
                <div>
                  <div className="mc-card__title" style={{ fontSize: 18 }}>Selección de Lotes Objetivo</div>
                  <div className="text-sm text-muted mt-4">Superficie Total Seleccionada: <b style={{ color: "var(--mc-ink)" }}>{haNetas} Has</b></div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: "320px 1fr", gap: 14 }}>
                  <div className="col gap-8">
                    {lotesDisponibles.map((l, i) => {
                      const sel = lotesSel.has(i);
                      return (
                        <label
                          key={i}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, cursor: "pointer", border: sel ? "2px solid var(--mc-green-600)" : "1px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)" }}
                        >
                          <input
                            type="checkbox"
                            checked={sel}
                            onChange={(e) => {
                              const next = new Set(lotesSel);
                              if (e.target.checked) next.add(i);
                              else next.delete(i);
                              setLotesSel(next);
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{l.nombre} ({l.ha} Ha)</div>
                            {l.tag && <span className="mc-badge mc-badge--green mt-4" style={{ fontSize: 10 }}>{l.tag}</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mc-map" style={{ minHeight: 320, position: "relative" }}>
                    <div className="mc-map__grid"></div>
                    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 500 360" preserveAspectRatio="xMidYMid slice">
                      {lotesDisponibles.slice(0, 4).map((l, i) => {
                        const sel = lotesSel.has(i);
                        const polys = ["60,60 240,50 260,170 70,180", "260,170 70,180 80,300 270,310", "260,60 430,70 445,190 280,180", "445,190 280,180 275,300 440,315"];
                        return (
                          <g key={i}>
                            <polygon points={polys[i % 4]} fill={sel ? "#4f9d52" : "#d5d9d2"} opacity={sel ? 0.85 : 0.5} stroke={sel ? "#0a5a24" : "#8a938d"} strokeWidth={sel ? 3 : 1.5} />
                            <text x={polys[i % 4].split(" ")[0].split(",")[0]} y={polys[i % 4].split(" ")[0].split(",")[1]} dx="30" dy="60" fontSize="12" fontWeight="700" fill={sel ? "white" : "#58645c"}>{l.nombre}</text>
                          </g>
                        );
                      })}
                      <ellipse cx="330" cy="270" rx="28" ry="16" fill="#7a4a2a" opacity="0.75" stroke="#c93434" strokeWidth="2" />
                    </svg>
                    <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.96)", padding: "12px 16px", borderRadius: 10, fontSize: 12.5, boxShadow: "var(--sh-md)" }}>
                      <div className="row" style={{ justifyContent: "space-between", gap: 20 }}><span>Área Bruta:</span><b>{haBrutas} Ha</b></div>
                      <div className="row" style={{ justifyContent: "space-between", gap: 20, color: "var(--mc-red)" }}><span>Exclusiones:</span><b>-{haBrutas - haNetas} Ha</b></div>
                      <div className="mc-divider"></div>
                      <div className="row" style={{ justifyContent: "space-between", gap: 20, fontSize: 13.5 }}><span className="font-semi">Área Neta Laborable:</span><b>{haNetas} Ha</b></div>
                    </div>
                    {lotesSel.size > 1 && (
                      <div style={{ position: "absolute", bottom: 12, right: 12, background: "var(--mc-red-bg)", color: "var(--mc-red)", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                        Zona de Exclusión (Laguna)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: Maquinaria y RRHH */}
            {step === 2 && (
              <div className="col gap-14">
                <div className="mc-card__title" style={{ fontSize: 18 }}>Asignación de Recursos y Personal</div>
                <div className="grid g-cols-3 gap-12">
                  <div className="mc-card" style={{ padding: 16 }}>
                    <div className="font-semi" style={{ marginBottom: 10 }}>1. Operario</div>
                    <div className="row gap-10" style={{ marginBottom: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#5E8F78", color: "white", display: "grid", placeItems: "center", fontWeight: 700 }}>
                        {operario.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-semi text-sm">{operario}</div>
                        <span className="mc-badge mc-badge--green" style={{ fontSize: 10 }}>Licencia: Vigente ✓</span>
                      </div>
                    </div>
                    <select style={inputS} value={operario} onChange={(e) => setOperario(e.target.value)}>
                      {["Marcos Gonzalez", "Juan Pérez", "M. Gómez", "C. López"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                    {operario === "Marcos Gonzalez" && (
                      <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--mc-amber-bg)", borderRadius: 8, fontSize: 11.5, color: "var(--mc-amber)" }}>
                        ⚠ Turno doble acumulado · lleva 6.5h en turno actual
                      </div>
                    )}
                  </div>
                  <div className="mc-card" style={{ padding: 16 }}>
                    <div className="font-semi" style={{ marginBottom: 10 }}>2. Equipo de Tracción</div>
                    <select style={inputS} value={tractor} onChange={(e) => setTractor(e.target.value)}>
                      {["John Deere 7230R", "John Deere 7R 330", "Case Puma 200", "New Holland T7"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <div className="grid g-cols-2 gap-8 mt-12">
                      <div style={{ padding: 10, border: "1px solid var(--mc-line)", borderRadius: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>Combustible</div>
                        <div className="font-semi" style={{ fontSize: 16, color: "var(--mc-green-700)" }}>80%</div>
                      </div>
                      <div style={{ padding: 10, border: "1px solid var(--mc-line)", borderRadius: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>Horas Motor</div>
                        <div className="font-semi" style={{ fontSize: 16, color: "var(--mc-amber)" }}>4200h</div>
                      </div>
                    </div>
                    <span className="mc-badge mc-badge--green mt-12"><span className="mc-badge__dot"></span>Disponible</span>
                  </div>
                  <div className="mc-card" style={{ padding: 16 }}>
                    <div className="font-semi" style={{ marginBottom: 10 }}>3. Implemento</div>
                    <select style={inputS} value={implemento} onChange={(e) => setImplemento(e.target.value)}>
                      {["Sembradora Pla STC", "Rotoenfardadora Mainero", "Pulverizador Metalfor", "Fertilizadora Altina"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <div style={{ marginTop: 12, padding: "8px 10px", background: "var(--mc-surface-2)", borderRadius: 8, fontSize: 12 }}>
                      ⚙ Config: 16 líneas a 52cm
                    </div>
                    <span className="mc-badge mc-badge--green mt-12"><Icon name="check" size={10} />Compatible con Tractor</span>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4: Configuración Técnica */}
            {step === 3 && (
              <div className="col gap-14">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="mc-card__title" style={{ fontSize: 18 }}>Configuración Técnica: {actividad || "Labor"}</div>
                  <div className="text-sm text-muted">{tractor} + {implemento}</div>
                </div>
                <button
                  className="mc-btn mc-btn--secondary mc-btn--sm"
                  style={{ alignSelf: "flex-start", color: "var(--mc-blue)", borderColor: "var(--mc-blue)" }}
                  onClick={() => setParametros((p) => ({ ...p }))}
                >
                  ⚡ Cargar Configuración Predefinida
                </button>
                <div className="grid g-cols-3 gap-12">
                  {Object.entries(parametros).map(([k, v]) => (
                    <div key={k} className="mc-field">
                      <label className="mc-label">{k}</label>
                      {k === "Núcleo" ? (
                        <select style={inputS} value={v} onChange={(e) => setParametros({ ...parametros, [k]: e.target.value })}>
                          {["Blando", "Duro", "Mixto"].map((o) => <option key={o}>[{o}]</option>)}
                        </select>
                      ) : k === "Sistema de Atado" ? (
                        <div className="mc-seg">
                          {["Red (Malla)", "Hilo"].map((o) => (
                            <button key={o} className={v === o ? "is-on" : ""} onClick={() => setParametros({ ...parametros, [k]: o })}>[{o}]</button>
                          ))}
                        </div>
                      ) : k === "Picado (Cutter)" ? (
                        <button
                          className={`mc-btn mc-btn--sm ${v === "ON" ? "mc-btn--primary" : "mc-btn--secondary"}`}
                          style={{ alignSelf: "flex-start" }}
                          onClick={() => setParametros({ ...parametros, [k]: v === "ON" ? "OFF" : "ON" })}
                        >
                          {v === "ON" ? "ON ●" : "○ OFF"}
                        </button>
                      ) : k === "Forma" ? (
                        <select style={inputS} value={v} onChange={(e) => setParametros({ ...parametros, [k]: e.target.value })}>
                          {["Sólida", "Líquida", "Foliar"].map((o) => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input style={inputS} value={v} onChange={(e) => setParametros({ ...parametros, [k]: e.target.value })} />
                      )}
                    </div>
                  ))}
                  {Object.keys(parametros).length === 0 && (
                    <div className="text-sm text-muted">Esta actividad no requiere parámetros técnicos adicionales.</div>
                  )}
                </div>
                <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ alignSelf: "flex-start", color: "var(--mc-blue)", borderColor: "var(--mc-blue)" }}>
                  📡 Crear mapeo de telemetría
                </button>
              </div>
            )}

            {/* PASO 5: Insumos */}
            {step === 4 && (
              <div className="col gap-14">
                <div className="mc-card__title" style={{ fontSize: 18 }}>Planificación de Insumos y Materiales</div>
                <div style={{ position: "relative" }}>
                  <Icon name="search" size={14} style={{ position: "absolute", left: 12, top: 13, color: "var(--mc-text-3)" }} />
                  <input
                    style={{ ...inputS, paddingLeft: 34, border: "2px solid var(--mc-green-500)" }}
                    placeholder="Agregar Insumo a la Mezcla"
                    value={busquedaInsumo}
                    onChange={(e) => setBusquedaInsumo(e.target.value)}
                  />
                  {insumosFiltrados.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 10, boxShadow: "var(--sh-lg)", zIndex: 20, overflow: "hidden" }}>
                      {insumosFiltrados.map((ins) => (
                        <button
                          key={ins.nombre}
                          disabled={ins.stock === 0}
                          onClick={() => {
                            setInsumos((prev) => [...prev, { nombre: ins.nombre, dosis: "100", unidad: ins.unidad === "bolsas" ? "Sem/Ha" : `${ins.unidad === "L" ? "Lt" : "Kg"}/Ha`, stock: ins.stock }]);
                            setBusquedaInsumo("");
                          }}
                          style={{ width: "100%", padding: "10px 14px", display: "flex", justifyContent: "space-between", cursor: ins.stock === 0 ? "not-allowed" : "pointer", background: ins.stock > 0 ? "var(--mc-green-50)" : "transparent", borderBottom: "1px solid var(--mc-line)", opacity: ins.stock === 0 ? 0.6 : 1 }}
                        >
                          <span className="font-semi text-sm">{ins.nombre}</span>
                          <span className="text-xs" style={{ color: ins.stock > 0 ? "var(--mc-green-700)" : "var(--mc-red)" }}>
                            Stock: {ins.stock.toLocaleString("es-AR")} {ins.unidad} · {ins.stock > 0 ? "● Disp." : "● Sin Stock"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="font-semi text-sm">Insumos Agregados ({insumos.length})</div>
                <div className="col gap-10">
                  {insumos.map((ins, i) => {
                    const pct = Math.min(100, (ins.stock / 200) * 100);
                    return (
                      <div key={i} style={{ padding: 14, border: "1px solid var(--mc-line)", borderRadius: 12, display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center" }}>
                          <Icon name={ins.nombre.includes("Maíz") || ins.nombre.includes("Semilla") ? "sprout" : "flask"} size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="font-semi text-sm">{ins.nombre}</div>
                          <div className="mc-prog mt-4" style={{ maxWidth: 180 }}>
                            <div className={`mc-prog__bar ${pct < 40 ? "mc-prog__bar--orange" : ""}`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <div className="text-xs mt-2" style={{ color: pct < 40 ? "var(--mc-orange-700)" : "var(--mc-green-700)" }}>
                            {pct < 40 ? "Stock Crítico" : `En Galpón: ${ins.stock.toLocaleString("es-AR")}`}
                          </div>
                        </div>
                        <div className="mc-field" style={{ width: 160 }}>
                          <label className="mc-label">Dosis</label>
                          <div className="row gap-4">
                            <input style={inputS} value={ins.dosis} onChange={(e) => setInsumos((prev) => prev.map((x, j) => (j === i ? { ...x, dosis: e.target.value } : x)))} />
                            <span className="text-xs text-muted" style={{ whiteSpace: "nowrap" }}>{ins.unidad}</span>
                          </div>
                        </div>
                        <button className="mc-icon-btn" style={{ color: "var(--mc-red)" }} onClick={() => setInsumos((prev) => prev.filter((_, j) => j !== i))}>
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    );
                  })}
                  {insumos.length === 0 && <div className="text-sm text-muted">Buscá un insumo arriba para agregarlo a la orden (ej: “Urea”).</div>}
                </div>
              </div>
            )}

            {/* PASO 6: Resumen y Costos */}
            {step === 5 && (
              <div className="grid" style={{ gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
                <div className="col gap-10">
                  <div className="mc-card__title" style={{ fontSize: 18 }}>Revisión de Orden de Trabajo</div>
                  <ResumenCard icon="map" title="Objetivo y Ubicación">
                    <div className="font-semi text-sm">{Array.from(lotesSel).map((i) => lotesDisponibles[i]?.nombre).join(" y ") || "—"}</div>
                    <div className="text-xs text-muted mt-2">Superficie Neta: {haNetas} Has | Actividad: {actividad || "—"}</div>
                  </ResumenCard>
                  <ResumenCard icon="users" title="Equipo Asignado">
                    <div className="font-semi text-sm">{operario} (Maquinista)</div>
                    <div className="text-xs text-muted mt-2">{tractor} + {implemento}</div>
                  </ResumenCard>
                  <ResumenCard icon="settings" title="Parámetros Técnicos">
                    <div className="font-semi text-sm">{actividad}</div>
                    <div className="text-xs text-muted mt-2">
                      {Object.entries(parametros).slice(0, 4).map(([k, v]) => `${k.split(" (")[0]}: ${v}`).join(" | ") || "Sin parámetros"}
                    </div>
                  </ResumenCard>
                  <ResumenCard icon="box" title="Insumos a Utilizar">
                    <div className="text-sm">{insumos.length ? insumos.map((i) => `${i.nombre} (${i.dosis} ${i.unidad})`).join(" + ") : "Sin insumos"}</div>
                  </ResumenCard>
                </div>
                <div className="col gap-12">
                  <div>
                    <div className="font-semi" style={{ marginBottom: 8 }}>A. Presupuesto Estimado</div>
                    <div style={{ padding: 18, borderRadius: 12, background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)", textAlign: "center" }}>
                      <div className="text-sm text-muted">Costo Total del Evento 📊</div>
                      <div style={{ fontFamily: "var(--ff-display)", fontSize: 34, color: "var(--mc-ink)", marginTop: 4 }}>${costoTotal.toLocaleString("es-AR")} USD</div>
                      <div className="text-xs text-muted mt-2">(${haNetas > 0 ? (costoTotal / haNetas).toFixed(2) : "0"} / Ha)</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-semi" style={{ marginBottom: 8 }}>B. Validaciones (Alerts)</div>
                    <div style={{ padding: 14, borderRadius: 12, background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)" }} className="col gap-10">
                      <ValidRow ok label="Clima" sub="Viento < 15 km/h, sin lluvia próxima" />
                      <ValidRow ok label="Maquinaria" sub="Disponible" />
                      <ValidRow ok={insumos.every((i) => i.stock > 50)} label="Stock" sub={insumos.every((i) => i.stock > 50) ? "Insumos disponibles" : "Insumo crítico (confirmar stock)"} />
                      {operario === "Marcos Gonzalez" && <ValidRow ok={false} label="Operario" sub="Turno > 6h — supervisar" />}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--mc-line)", display: "flex", justifyContent: "space-between", background: "var(--mc-surface-2)" }}>
          <div className="row gap-8">
            {step === 5 && (
              <button className="mc-btn mc-btn--secondary" onClick={() => { onBorrador(armarOrden()); }}>
                Guardar Borrador
              </button>
            )}
            {step > 0 && (
              <button className="mc-btn mc-btn--ghost" onClick={() => setStep(step - 1)}>
                <Icon name="arrowLeft" size={13} />Anterior
              </button>
            )}
          </div>
          {step < 5 ? (
            <button className="mc-btn mc-btn--primary" disabled={!puedeAvanzar} onClick={() => setStep(step + 1)}>
              Siguiente: {STEPS[step + 1].split(" y ")[0]} <Icon name="arrowRight" size={13} />
            </button>
          ) : (
            <button className="mc-btn mc-btn--primary mc-btn--lg" disabled={emitiendo} onClick={emitir}>
              🚀 {emitiendo ? "Emitiendo..." : "Emitir y Notificar Orden"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ResumenCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 14, border: "1px solid var(--mc-line)", borderRadius: 12 }}>
      <div className="row gap-8" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--mc-line)" }}>
        <Icon name={icon} size={14} style={{ color: "var(--mc-text-2)" }} />
        <span className="font-semi text-sm">{title}</span>
      </div>
      {children}
    </div>
  );
}

function ValidRow({ ok, label, sub }: { ok: boolean; label: string; sub: string }) {
  return (
    <div className="row gap-8" style={{ alignItems: "flex-start" }}>
      <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: "grid", placeItems: "center", background: ok ? "var(--mc-green-600)" : "var(--mc-amber)", color: "white", marginTop: 1 }}>
        <Icon name={ok ? "check" : "alert"} size={11} />
      </span>
      <div>
        <div className="font-semi text-sm">{label}</div>
        <div className="text-xs text-muted">{sub}</div>
      </div>
    </div>
  );
}
