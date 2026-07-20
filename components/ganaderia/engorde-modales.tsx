"use client";

// Modales de Engorde: alta/ingreso de corral, registro de pesaje (2 pasos) y
// programación de envío a faena (genera DTE + cierra el corral). Escriben en
// las APIs reales.

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/mc";
import { CATEGORIAS_ENGORDE, CorralAPI, coma, estadoCorral, nfEng } from "./engorde-tipos";

const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid var(--mc-line)", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit", background: "var(--mc-surface)", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: 11, color: "var(--mc-text-2)", marginBottom: 5 };

type RacionLite = { id: string; nombre: string; etapaProductiva?: string | null; animalObjetivo?: string | null };

/* ============ INGRESO / ALTA DE CORRAL ============ */

export function ModalIngresoCorral({ raciones, onClose, onGuardado }: { raciones: RacionLite[]; onClose: () => void; onGuardado?: () => void }) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_ENGORDE[0]);
  const [capacidad, setCapacidad] = useState("");
  const [cabezas, setCabezas] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [pesoIngreso, setPesoIngreso] = useState("");
  const [pesoObjetivo, setPesoObjetivo] = useState("");
  const [gdpObjetivo, setGdpObjetivo] = useState("");
  const [precioMercado, setPrecioMercado] = useState("");
  const [racionId, setRacionId] = useState("");
  const [guardando, setGuardando] = useState(false);

  const racionesEngorde = raciones.filter((r) => /engorde|termin|crecim/i.test(r.etapaProductiva || "") || /novillo|vaquil|ternero/i.test(r.animalObjetivo || ""));
  const puede = !!nombre && !!cabezas;

  const confirmar = async () => {
    if (!puede) return;
    setGuardando(true);
    try {
      const r = await fetch("/api/corrales-engorde", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, categoria, capacidad, cabezas, fechaIngreso: fecha, pesoIngreso, pesoObjetivo, gdpObjetivo, precioMercado, racionId: racionId || null }),
      });
      if (!r.ok) throw new Error();
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(520px,96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Engorde</div>
              <div style={{ fontSize: 21, fontWeight: 900, color: "var(--mc-ink)", letterSpacing: "-0.02em" }}>Ingreso a Corral</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-2)", marginTop: 3 }}>Creá un corral/tropa de engorde con su peso de ingreso.</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={13} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={lbl}>Nombre del corral / tropa</div>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Corral 1 · Terminación" style={inp} />
          </div>
          <div className="grid g-cols-2">
            <div>
              <div style={lbl}>Categoría</div>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="mc-select" style={inp}>
                {CATEGORIAS_ENGORDE.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={lbl}>Fecha de ingreso</div>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={lbl}>Cabezas</div>
              <input type="number" value={cabezas} onChange={(e) => setCabezas(e.target.value)} placeholder="0" style={inp} />
            </div>
            <div>
              <div style={lbl}>Capacidad del corral</div>
              <input type="number" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} placeholder="Ej: 90" style={inp} />
            </div>
            <div>
              <div style={lbl}>Peso de ingreso (kg prom.)</div>
              <input type="number" value={pesoIngreso} onChange={(e) => setPesoIngreso(e.target.value)} placeholder="0.0" style={inp} />
            </div>
            <div>
              <div style={lbl}>Peso objetivo de faena (kg)</div>
              <input type="number" value={pesoObjetivo} onChange={(e) => setPesoObjetivo(e.target.value)} placeholder="Ej: 480" style={inp} />
            </div>
            <div>
              <div style={lbl}>GDP objetivo (kg/día)</div>
              <input type="number" step="0.01" value={gdpObjetivo} onChange={(e) => setGdpObjetivo(e.target.value)} placeholder="Ej: 1.30" style={inp} />
            </div>
            <div>
              <div style={lbl}>Precio mercado ($/kg)</div>
              <input type="number" step="0.01" value={precioMercado} onChange={(e) => setPrecioMercado(e.target.value)} placeholder="Ej: 2.10" style={inp} />
            </div>
          </div>
          <div>
            <div style={lbl}>Ración asignada <span style={{ opacity: 0.6 }}>(opcional)</span></div>
            <select value={racionId} onChange={(e) => setRacionId(e.target.value)} className="mc-select" style={inp}>
              <option value="">Sin ración</option>
              {racionesEngorde.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} disabled={!puede || guardando} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center", opacity: puede ? 1 : 0.5 }}>
            <Icon name="truck" size={14} /> Confirmar Ingreso
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ REGISTRAR PESAJE (2 pasos) ============ */

export function ModalRegistrarPesaje({ corrales, corralInicial, onClose, onGuardado }: { corrales: CorralAPI[]; corralInicial?: string; onClose: () => void; onGuardado?: () => void }) {
  const [step, setStep] = useState(corralInicial ? 2 : 1);
  const [corralSel, setCorralSel] = useState<string | null>(corralInicial || null);
  const [pesoProm, setPesoProm] = useState("");
  const [gdpInput, setGdpInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [consumo, setConsumo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const corral = corrales.find((c) => c.id === corralSel) || null;

  const guardar = async () => {
    if (!corral || !pesoProm) return;
    setGuardando(true);
    try {
      const r = await fetch(`/api/corrales-engorde/${corral.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "pesada", pesoPromedio: pesoProm, gdp: gdpInput || undefined, consumo: consumo || undefined, notas: ccInput ? `CC ${ccInput}/5` : undefined }),
      });
      if (!r.ok) throw new Error();
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(520px,96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--mc-line)", background: "linear-gradient(135deg,var(--mc-green-50),var(--mc-surface))", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Engorde · Corrales</div>
              <div style={{ fontSize: 21, fontWeight: 900, color: "var(--mc-ink)", letterSpacing: "-0.02em" }}>Registrar Pesaje</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-2)", marginTop: 3 }}>Paso {step} de 2 — {step === 1 ? "Seleccioná el corral" : "Cargá el peso promedio"}</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={13} /></button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: step >= 1 ? "#16a34a" : "var(--mc-line)" }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: step >= 2 ? "#16a34a" : "var(--mc-line)" }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {step === 1 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-text-2)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Corral</div>
              {corrales.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--mc-text-3)" }}>No hay corrales de engorde. Creá uno con “Ingreso a Corral”.</div>
              ) : (
                <div className="col gap-8">
                  {corrales.map((c) => (
                    <button key={c.id} onClick={() => setCorralSel(c.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left", border: corralSel === c.id ? "2px solid #16a34a" : "1.5px solid var(--mc-line)", background: corralSel === c.id ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>{c.nombre}</div>
                        <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{c.cabezas} cabezas · {c.pesoActual ?? c.pesoIngreso ?? "—"} kg prom.</div>
                      </div>
                      {corralSel === c.id && <Icon name="check" size={16} style={{ color: "#16a34a" }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && corral && (
            <div className="col gap-8">
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--mc-green-50)", border: "1px solid var(--mc-green-200)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{corral.nombre}</div>
                <div style={{ fontSize: 11, color: "var(--mc-text-2)" }}>{corral.cabezas} cabezas · último {corral.pesoActual ?? corral.pesoIngreso ?? "—"} kg</div>
              </div>
              <div style={{ border: "2px solid #16a34a", borderRadius: 12, padding: "10px 14px", background: "var(--mc-green-50)" }}>
                <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginBottom: 4 }}>Peso promedio pesado (kg)</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <input type="number" value={pesoProm} onChange={(e) => setPesoProm(e.target.value)} placeholder="0.0" autoFocus style={{ flex: 1, border: "none", background: "transparent", fontSize: 28, fontWeight: 900, color: "var(--mc-ink)", outline: "none", fontFamily: "inherit", width: "100%" }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#16a34a" }}>kg</span>
                </div>
              </div>
              {pesoProm && (corral.pesoActual ?? corral.pesoIngreso) != null && (
                <div style={{ fontSize: 12, color: "var(--mc-text-2)" }}>
                  Diferencia vs último: <strong style={{ color: "var(--mc-ink)" }}>{coma(parseFloat(pesoProm) - (corral.pesoActual ?? corral.pesoIngreso ?? 0))} kg</strong>
                </div>
              )}
              <div style={{ borderTop: "1px dashed var(--mc-line)", paddingTop: 12 }}>
                <div className="row gap-8" style={{ alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>Datos adicionales</span>
                  <span className="mc-badge mc-badge--neutral" style={{ fontSize: 10 }}>Opcional</span>
                </div>
                <div className="grid g-cols-3" style={{ gap: 10 }}>
                  <div>
                    <div style={lbl}>GDP (kg/día)</div>
                    <input type="number" step="0.01" value={gdpInput} onChange={(e) => setGdpInput(e.target.value)} placeholder="auto" style={inp} />
                  </div>
                  <div>
                    <div style={lbl}>Consumo (kg MS)</div>
                    <input type="number" step="0.1" value={consumo} onChange={(e) => setConsumo(e.target.value)} placeholder="0" style={inp} />
                  </div>
                  <div>
                    <div style={lbl}>C. Corporal (1–5)</div>
                    <input type="number" min="1" max="5" step="0.5" value={ccInput} onChange={(e) => setCcInput(e.target.value)} placeholder="—" style={inp} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 8 }}>
                  <Icon name="info" size={11} style={{ verticalAlign: "-2px", marginRight: 4 }} />Si no cargás GDP, se calcula automáticamente desde la pesada anterior.
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          {step === 2 && !corralInicial ? (
            <button onClick={() => setStep(1)} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Atrás</button>
          ) : (
            <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          )}
          <button onClick={() => (step === 1 ? setStep(2) : guardar())} disabled={(step === 1 && !corralSel) || (step === 2 && (!pesoProm || guardando))} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center", opacity: step === 1 && !corralSel ? 0.4 : 1 }}>
            <Icon name="check" size={14} /> {step === 1 ? "Continuar" : "Guardar Pesaje"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ PROGRAMAR ENVÍO A FAENA ============ */

type EnvioItem = { corralId?: string; nombre: string; cab: number; peso: number };

export function ModalProgramarEnvio({ corrales, onClose, onGuardado }: { corrales: CorralAPI[]; onClose: () => void; onGuardado?: (msg: string) => void }) {
  const listos = useMemo(() => corrales.filter((c) => estadoCorral(c) === "listo" || c.estado === "Listo"), [corrales]);
  const [items, setItems] = useState<EnvioItem[]>([]);
  const [origenModo, setOrigenModo] = useState<"lote" | "individual">("lote");
  const [corralAAgregar, setCorralAAgregar] = useState("");
  const [caravanaNueva, setCaravanaNueva] = useState("");
  const [pesoNuevo, setPesoNuevo] = useState("");
  const [frigorifico, setFrigorifico] = useState("");
  const [fechaEnvio, setFechaEnvio] = useState(new Date().toISOString().slice(0, 10));
  const [transportista, setTransportista] = useState("");
  const [patente, setPatente] = useState("");
  const [precio, setPrecio] = useState("2.00");
  const [modalidad, setModalidad] = useState<"vivo" | "carcasa">("vivo");
  const [rendPct, setRendPct] = useState("");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  const disponibles = listos.filter((l) => !items.some((a) => a.corralId === l.id));

  const agregarCorral = () => {
    const c = listos.find((x) => x.id === corralAAgregar);
    if (!c) return;
    setItems((p) => [...p, { corralId: c.id, nombre: c.nombre, cab: c.cabezas, peso: Math.round(c.pesoActual ?? c.pesoIngreso ?? 0) }]);
    setCorralAAgregar("");
  };
  const agregarIndividual = () => {
    if (!pesoNuevo) return;
    setItems((p) => [...p, { nombre: `Animal individual · ${caravanaNueva || "s/caravana"}`, cab: 1, peso: Number(pesoNuevo) }]);
    setCaravanaNueva("");
    setPesoNuevo("");
  };
  const quitar = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));

  const totalCab = items.reduce((s, a) => s + Number(a.cab || 0), 0);
  const totalPesoVivo = items.reduce((s, a) => s + Number(a.cab || 0) * Number(a.peso || 0), 0);
  // Rendimiento carcasa ingresado por el usuario (real/estimado del embarque), no un valor fijo.
  const rendNum = parseFloat(rendPct);
  const rendValido = !isNaN(rendNum) && rendNum > 0 && rendNum <= 100;
  const pesoCarcasa = rendValido ? Math.round(totalPesoVivo * (rendNum / 100)) : null;
  const pesoFacturable = modalidad === "carcasa" ? pesoCarcasa ?? 0 : totalPesoVivo;
  const ingreso = Math.round(pesoFacturable * Number(precio || 0));
  const faltaRend = modalidad === "carcasa" && !rendValido;
  const fechaLabel = fechaEnvio ? new Date(fechaEnvio + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : "—";

  const confirmar = async () => {
    if (items.length === 0) return;
    setGuardando(true);
    try {
      // 1) DTE
      const dteRes = await fetch("/api/documentos-transito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fechaEnvio,
          motivo: "Venta",
          destino: frigorifico || "Frigorífico",
          categoria: items.length === 1 ? items[0].nombre : `${items.length} tropas`,
          cabezas: totalCab,
          pesoTotal: totalPesoVivo,
          pesoCarcasa: pesoCarcasa ?? undefined,
          precioKg: Number(precio || 0),
          importe: ingreso,
          transporte: [transportista, patente].filter(Boolean).join(" · ") || null,
          notas: nota || null,
        }),
      });
      const dte = await dteRes.json();
      // 2) Cerrar corrales enviados
      await Promise.all(
        items.filter((a) => a.corralId).map((a) =>
          fetch(`/api/corrales-engorde/${a.corralId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: "Cerrado" }) })
        )
      );
      onGuardado && onGuardado(`Envío confirmado · DT-e #${dte?.numero || ""} generado — pendiente de cierre en Trazabilidad`);
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(640px,95vw)", padding: 0, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--mc-line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div className="row gap-12" style={{ alignItems: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center" }}><Icon name="truck" size={18} /></div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--mc-ink)", letterSpacing: "-0.02em" }}>Programar Envío a Faena</div>
              <div className="text-xs text-muted mt-2">Confirmá los datos del embarque</div>
            </div>
          </div>
          <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={13} /></button>
        </div>

        <div className="col gap-18" style={{ padding: "18px 22px", overflowY: "auto", flex: "1 1 auto" }}>
          {/* ① Animales */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--mc-ink)" }}>① Animales a enviar</div>
            <div className="text-xs text-muted mt-2" style={{ marginBottom: 10 }}>Agregá corrales completos o animales individuales</div>
            {items.length > 0 && (
              <div className="col gap-6" style={{ marginBottom: 12 }}>
                {items.map((a, i) => (
                  <div key={i} className="row gap-8" style={{ alignItems: "center", padding: "6px 8px", border: "1px solid var(--mc-line)", borderRadius: 8 }}>
                    <div style={{ flex: 2, fontSize: 13, fontWeight: 600, color: "var(--mc-ink)" }}>{a.nombre}</div>
                    <span style={{ flex: 1, textAlign: "right", fontSize: 12.5, color: "var(--mc-text-2)" }}>{a.cab} cab.</span>
                    <span style={{ flex: 1, textAlign: "right", fontSize: 12.5, color: "var(--mc-text-2)" }}>{a.peso} kg</span>
                    <button onClick={() => quitar(i)} className="mc-icon-btn" style={{ width: 24, height: 24 }}><Icon name="x" size={13} /></button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ border: "1px dashed var(--mc-line-2)", borderRadius: 10, padding: 12 }}>
              <div className="row gap-8" style={{ background: "var(--mc-surface-3)", borderRadius: 10, padding: 3, marginBottom: 10 }}>
                {(["lote", "individual"] as const).map((m) => (
                  <button key={m} onClick={() => setOrigenModo(m)} style={{ flex: 1, padding: "7px 8px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, background: origenModo === m ? "var(--mc-surface)" : "transparent", color: origenModo === m ? "var(--mc-ink)" : "var(--mc-text-3)", boxShadow: origenModo === m ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>
                    {m === "lote" ? "Corral completo" : "Animal individual"}
                  </button>
                ))}
              </div>
              {origenModo === "lote" ? (
                <div className="row gap-8">
                  <select value={corralAAgregar} onChange={(e) => setCorralAAgregar(e.target.value)} className="mc-select" style={{ flex: 1 }}>
                    <option value="">Seleccionar corral…</option>
                    {disponibles.map((l) => <option key={l.id} value={l.id}>{l.nombre} · {l.cabezas} cab. · {Math.round(l.pesoActual ?? l.pesoIngreso ?? 0)} kg</option>)}
                  </select>
                  <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={agregarCorral} disabled={!corralAAgregar}><Icon name="plus" size={12} />Agregar</button>
                </div>
              ) : (
                <div className="row gap-8">
                  <input value={caravanaNueva} onChange={(e) => setCaravanaNueva(e.target.value)} placeholder="N° caravana / RFID" className="mc-input" style={{ flex: 1.4 }} />
                  <input type="number" value={pesoNuevo} onChange={(e) => setPesoNuevo(e.target.value)} placeholder="Peso (kg)" className="mc-input" style={{ flex: 1 }} />
                  <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={agregarIndividual} disabled={!pesoNuevo}><Icon name="plus" size={12} />Agregar</button>
                </div>
              )}
              {listos.length === 0 && origenModo === "lote" && <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 8 }}>No hay corrales listos para faena. Podés cargar animales individuales.</div>}
            </div>
          </div>

          {/* ② Datos del envío */}
          <div style={{ background: "var(--mc-surface-2)", borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--mc-ink)", marginBottom: 10 }}>② Datos del envío</div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div className="text-xs text-muted mb-4">Frigorífico / destino</div><input value={frigorifico} onChange={(e) => setFrigorifico(e.target.value)} placeholder="Ej: Frigorífico Liniers" className="mc-input" style={{ width: "100%" }} /></div>
              <div><div className="text-xs text-muted mb-4">Fecha de envío</div><input type="date" value={fechaEnvio} onChange={(e) => setFechaEnvio(e.target.value)} className="mc-input" style={{ width: "100%" }} /></div>
              <div><div className="text-xs text-muted mb-4">Transportista</div><input value={transportista} onChange={(e) => setTransportista(e.target.value)} placeholder="Ej: Trans. Don Ceferino" className="mc-input" style={{ width: "100%" }} /></div>
              <div><div className="text-xs text-muted mb-4">Patente del camión</div><input value={patente} onChange={(e) => setPatente(e.target.value)} placeholder="AB123CD" className="mc-input" style={{ width: "100%" }} /></div>
            </div>
          </div>

          {/* ③ Condiciones comerciales */}
          <div style={{ background: "var(--mc-surface-2)", borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--mc-ink)", marginBottom: 10 }}>③ Condiciones comerciales</div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><div className="text-xs text-muted mb-4">Precio acordado USD/kg</div><input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} className="mc-input" style={{ width: "100%" }} /></div>
              <div>
                <div className="text-xs text-muted mb-4">Modalidad</div>
                <div className="mc-seg" style={{ width: "100%" }}>
                  <button className={modalidad === "vivo" ? "is-on" : ""} onClick={() => setModalidad("vivo")} style={{ flex: 1 }}>Por kg vivo</button>
                  <button className={modalidad === "carcasa" ? "is-on" : ""} onClick={() => setModalidad("carcasa")} style={{ flex: 1 }}>Por kg carcasa</button>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="text-xs text-muted mb-4">Rendimiento carcasa (%){modalidad === "carcasa" ? " · requerido para facturar en gancho" : " · opcional — registra el rendimiento real de la faena"}</div>
              <input type="number" step="0.1" min="0" max="100" value={rendPct} onChange={(e) => setRendPct(e.target.value)} placeholder="Ej: 56" className="mc-input" style={{ width: "100%", ...(faltaRend ? { borderColor: "var(--mc-amber)" } : {}) }} />
              {pesoCarcasa !== null ? (
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>Carcasa estimada: <strong>{nfEng.format(pesoCarcasa)} kg</strong> · {nfEng.format(totalPesoVivo)} kg vivo × {coma(rendNum, 1)}%</div>
              ) : faltaRend ? (
                <div className="text-xs" style={{ marginTop: 4, color: "var(--mc-amber)" }}>Ingresá el rendimiento para calcular el peso de carcasa a facturar.</div>
              ) : null}
            </div>
            <div className="text-xs text-muted mb-4">Nota opcional</div>
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Observaciones del envío..." className="mc-input" style={{ width: "100%", minHeight: 60, resize: "vertical" }} />
          </div>

          {/* Preview */}
          <div style={{ background: "var(--mc-green-50)", border: "1px solid var(--mc-green-200)", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.9, color: "var(--mc-green-800)" }}>
            <div><Icon name="box" size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />{totalCab} cabezas · {nfEng.format(totalPesoVivo)} kg vivo estimado</div>
            <div><Icon name="truck" size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />{frigorifico || "Destino a definir"} · {fechaLabel}</div>
            <div><Icon name="dollar" size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />Ingreso proyectado: ${nfEng.format(ingreso)} (a ${Number(precio || 0).toFixed(2)}/kg{modalidad === "carcasa" ? " carcasa" : " vivo"})</div>
          </div>

          <div className="row gap-8" style={{ alignItems: "flex-start", padding: "10px 12px", background: "var(--mc-amber-bg)", borderRadius: 10 }}>
            <Icon name="info" size={14} style={{ color: "var(--mc-amber)", flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 11.5, color: "var(--mc-amber)", lineHeight: 1.5 }}>Al confirmar se genera un DT-e y se cierran los corrales enviados. Podés completar el documento en Trazabilidad.</div>
          </div>
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" onClick={confirmar} disabled={items.length === 0 || guardando || faltaRend}><Icon name="check" size={14} />Confirmar Envío</button>
        </div>
      </div>
    </div>
  );
}
