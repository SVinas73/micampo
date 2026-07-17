"use client";

// Modales de Producción Lechera: registro de ordeñe (2 pasos), fila de turno,
// finalizar turno, vaca manual, turno extra, boleta de retiro y análisis de
// calidad. Todos escriben en las APIs reales.

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/mc";
import {
  BoletaAPI,
  RegLecheroAPI,
  TurnoDef,
  VacaLechera,
  agregarTurnoExtra,
  estadoTurno,
  hoyStr,
  marcarTurnoIniciado,
  nfLt,
  turnosIniciados,
} from "./lechera-tipos";

const inp: React.CSSProperties = { border: "1px solid var(--mc-line)", borderRadius: 10, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", width: "100%", outline: "none", color: "var(--mc-ink)", background: "var(--mc-surface)", boxSizing: "border-box" };

/* ============ REGISTRAR ORDEÑE (2 pasos) ============ */

export function PLModalOrdene({
  vacas,
  turnos,
  registrosHoy,
  pendientes = [],
  onRemovePendiente,
  onClose,
  onGuardado,
}: {
  vacas: VacaLechera[];
  turnos: TurnoDef[];
  registrosHoy: RegLecheroAPI[];
  pendientes?: string[];
  onRemovePendiente?: (n: string) => void;
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [paso, setPaso] = useState(1);
  const iniciados = useMemo(() => turnosIniciados(), []);
  const estados = useMemo(() => turnos.map((t) => estadoTurno(t, registrosHoy, iniciados, pendientes)), [turnos, registrosHoy, iniciados, pendientes]);
  const primeraPendiente = turnos.findIndex((_, i) => estados[i].estado !== "Completado");
  const [turnoSel, setTurnoSel] = useState(primeraPendiente >= 0 ? primeraPendiente : 0);

  // Lotes reales = agrupación de vacas en ordeñe por lote
  const lotes = useMemo(() => {
    const m = new Map<string, VacaLechera[]>();
    vacas.filter((v) => v.enOrdenne || v.serie.length > 0 || v.del !== null).forEach((v) => {
      if (!m.has(v.lote)) m.set(v.lote, []);
      m.get(v.lote)!.push(v);
    });
    return Array.from(m.entries()).map(([nombre, vs]) => ({ nombre, vacas: vs }));
  }, [vacas]);
  const [lotesSel, setLotesSel] = useState<Record<string, boolean>>(() => Object.fromEntries(lotes.map((l, i) => [l.nombre, i === 0])));
  const toggleLote = (k: string) => setLotesSel((p) => ({ ...p, [k]: !p[k] }));

  const [modoCarga, setModoCarga] = useState<"total" | "individual">("total");
  const [litros, setLitros] = useState("");
  const [porVaca, setPorVaca] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const vacasSeleccionadas = lotes.filter((l) => lotesSel[l.nombre]).flatMap((l) => l.vacas);
  const totalVacas = vacasSeleccionadas.length;
  const turno = turnos[turnoSel];

  const totalIndividual = Object.values(porVaca).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  const registrar = async () => {
    if (!turno || totalVacas === 0) return;
    setGuardando(true);
    setError("");
    try {
      const fecha = hoyStr();
      let registros: { animalId: string; fecha: string; litros: number; turno: string; observaciones?: string }[] = [];
      if (modoCarga === "total") {
        const total = parseFloat(litros);
        if (!total || total <= 0) { setError("Ingresá los litros totales del turno."); setGuardando(false); return; }
        const porCabeza = total / totalVacas;
        registros = vacasSeleccionadas.map((v) => ({
          animalId: v.dbId,
          fecha,
          litros: Math.round(porCabeza * 100) / 100,
          turno: turno.turnoKey,
          observaciones: `Carga total del turno (${nfLt.format(total)} lt / ${totalVacas} vacas)`,
        }));
      } else {
        registros = vacasSeleccionadas
          .filter((v) => parseFloat(porVaca[v.dbId] || "") > 0)
          .map((v) => ({ animalId: v.dbId, fecha, litros: parseFloat(porVaca[v.dbId]), turno: turno.turnoKey }));
        if (registros.length === 0) { setError("Cargá litros para al menos una vaca."); setGuardando(false); return; }
      }
      const r = await fetch("/api/registros-lecheros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registros }),
      });
      if (!r.ok) throw new Error();
      onRemovePendiente && onRemovePendiente(turno.nombre);
      onGuardado && onGuardado();
      onClose();
    } catch {
      setError("No se pudo registrar el ordeñe.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,12,.45)", zIndex: 9000, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div style={{ width: 600, maxWidth: "95vw", background: "var(--mc-surface)", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        {/* Header con pasos */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--mc-ink)" }}>Registrar Ordeñe</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: paso >= s ? "var(--mc-green-600)" : "var(--mc-surface)", border: paso >= s ? "2px solid var(--mc-green-600)" : "2px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: paso >= s ? "white" : "var(--mc-text-3)", transition: "all .2s" }}>
                    {paso > s ? <Icon name="check" size={11} /> : s}
                  </div>
                  <span style={{ fontSize: 11, color: paso === s ? "var(--mc-ink)" : "var(--mc-text-3)", fontWeight: paso === s ? 700 : 400 }}>{s === 1 ? "Configurar Turno" : "Registrar Producción"}</span>
                  {s < 2 && <div style={{ width: 28, height: 2, background: paso > 1 ? "var(--mc-green-600)" : "var(--mc-line)", borderRadius: 2, transition: "background .3s" }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={13} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          {paso === 1 && (
            <>
              {/* Pendientes */}
              <div style={{ borderRadius: 12, border: "2px solid #FF9D00", background: "#fff8ee", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#b36200", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Pendientes de registro de producción</div>
                {pendientes.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--mc-text-3)", fontStyle: "italic" }}>No hay turnos pendientes. Los turnos finalizados sin producción aparecerán aquí.</div>
                ) : (
                  pendientes.map((nombre) => (
                    <div key={nombre} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--mc-surface)", borderRadius: 8, border: "1px solid rgba(255,157,0,.3)" }}>
                      <Icon name="alert" size={14} style={{ color: "#FF9D00", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--mc-ink)" }}>{nombre} — sin producción registrada</span>
                      <button
                        onClick={() => {
                          const idx = turnos.findIndex((t) => t.nombre === nombre);
                          if (idx >= 0) setTurnoSel(idx);
                          setPaso(2);
                        }}
                        style={{ padding: "4px 12px", borderRadius: 8, border: "none", background: "var(--mc-green-600)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Registrar →
                      </button>
                    </div>
                  ))
                )}
              </div>
              {/* Turno */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Seleccionar turno</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {turnos.map((t, i) => {
                    const done = estados[i].estado === "Completado";
                    const ico = i === 0 ? "sun" : i === 1 ? "clock" : "cloud";
                    return (
                      <div
                        key={t.nombre}
                        onClick={() => !done && setTurnoSel(i)}
                        style={{ flex: 1, minWidth: 120, padding: "14px 12px", borderRadius: 12, border: turnoSel === i ? "2px solid var(--mc-green-600)" : "2px solid var(--mc-line)", background: done ? "var(--mc-surface-2)" : turnoSel === i ? "#f0fdf4" : "var(--mc-surface)", cursor: done ? "not-allowed" : "pointer", opacity: done ? 0.6 : 1, textAlign: "center", transition: "all .15s" }}
                      >
                        <Icon name={ico} size={18} style={{ color: turnoSel === i ? "var(--mc-green-600)" : "var(--mc-text-3)", marginBottom: 6 }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>{t.nombre}</div>
                        <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{t.hora}</div>
                        {done && <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 700, marginTop: 4 }}>Completado</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Lotes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Seleccionar lotes</div>
                {lotes.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--mc-text-3)", padding: "8px 0" }}>
                    No hay vacas lecheras registradas. Cargá vacas con partos en el módulo Animales para empezar a registrar ordeñes.
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {lotes.map((l) => (
                        <label key={l.nombre} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: lotesSel[l.nombre] ? "1.5px solid var(--mc-green-600)" : "1.5px solid var(--mc-line)", background: lotesSel[l.nombre] ? "#f0fdf4" : "var(--mc-surface)", cursor: "pointer", transition: "all .15s" }}>
                          <input type="checkbox" checked={!!lotesSel[l.nombre]} onChange={() => toggleLote(l.nombre)} style={{ accentColor: "#00A738", width: 14, height: 14 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mc-ink)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.nombre}</span>
                          <span style={{ fontSize: 11, color: "var(--mc-text-3)", flexShrink: 0 }}>{l.vacas.length} vacas</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 8, fontWeight: 600 }}>
                      Total seleccionado: <span style={{ color: "var(--mc-ink)", fontWeight: 800 }}>{totalVacas} vacas</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {paso === 2 && (
            <>
              <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, fontSize: 13, color: "#166534", fontWeight: 600 }}>
                {turno?.nombre} · {turno?.hora} hs · {lotes.filter((l) => lotesSel[l.nombre]).map((l) => l.nombre).join(" + ") || "sin lotes"} · {totalVacas} vacas
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Modo de carga</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {([["total", "chart", "Carga Total", "ingresar litros totales del turno"], ["individual", "cow", "Carga Individual", "litros por vaca"]] as const).map(([id, ico, label, desc]) => (
                    <div
                      key={id}
                      onClick={() => setModoCarga(id)}
                      style={{ flex: 1, padding: 14, borderRadius: 12, border: modoCarga === id ? "2px solid var(--mc-green-600)" : "2px solid var(--mc-line)", background: modoCarga === id ? "#f0fdf4" : "var(--mc-surface)", cursor: "pointer", transition: "all .15s" }}
                    >
                      <Icon name={ico} size={18} style={{ color: modoCarga === id ? "var(--mc-green-600)" : "var(--mc-text-3)", marginBottom: 6, display: "block" }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 2 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              {modoCarga === "total" ? (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Total de litros del turno</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "var(--mc-surface-2)", borderRadius: 14, padding: "10px 16px" }}>
                    <button onClick={() => setLitros((v) => String(Math.max(0, (parseInt(v) || 0) - 10)))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>−</button>
                    <input type="number" value={litros} onChange={(e) => setLitros(e.target.value)} placeholder="0" style={{ width: 120, fontSize: 36, fontWeight: 800, border: "none", background: "transparent", textAlign: "center", outline: "none", color: "var(--mc-ink)", fontFamily: "inherit" }} />
                    <button onClick={() => setLitros((v) => String((parseInt(v) || 0) + 10))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>+</button>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 8 }}>Se distribuirá automáticamente entre las {totalVacas} vacas del turno.</div>
                </div>
              ) : (
                <div>
                  <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "var(--mc-surface-2)", position: "sticky", top: 0 }}>
                          {["ID Vaca", "Lote", "Litros"].map((h) => (
                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--mc-line)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vacasSeleccionadas.map((v) => (
                          <tr key={v.dbId} style={{ borderBottom: "1px solid var(--mc-line)" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 700, fontFamily: "var(--ff-mono)" }}>#{v.caravana}</td>
                            <td style={{ padding: "8px 12px", color: "var(--mc-text-3)" }}>{v.lote}</td>
                            <td style={{ padding: "8px 12px" }}>
                              <input
                                type="number"
                                value={porVaca[v.dbId] || ""}
                                onChange={(e) => setPorVaca((p) => ({ ...p, [v.dbId]: e.target.value }))}
                                placeholder={v.prom7 !== null ? String(v.prom7) : "0"}
                                style={{ width: 70, border: "1px solid var(--mc-line)", borderRadius: 6, padding: "4px 8px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 8, textAlign: "right" }}>
                    Total ingresado: <strong style={{ color: "var(--mc-ink)" }}>{nfLt.format(totalIndividual)} lt</strong> · {Object.values(porVaca).filter((v) => parseFloat(v) > 0).length} de {totalVacas} vacas cargadas
                  </div>
                </div>
              )}
              {error && <div style={{ fontSize: 12, color: "var(--mc-red)", fontWeight: 600 }}>{error}</div>}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 22px", borderTop: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button className="mc-btn mc-btn--ghost" onClick={paso === 1 ? onClose : () => setPaso(1)}>{paso === 1 ? "Cancelar" : "← Anterior"}</button>
          <span style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Paso {paso} de 2</span>
          <button className="mc-btn mc-btn--primary" disabled={guardando || (paso === 1 && totalVacas === 0)} onClick={paso === 1 ? () => setPaso(2) : registrar}>
            {paso === 1 ? "Siguiente →" : <><Icon name="check" size={14} />{guardando ? "Guardando…" : "Registrar Turno"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ FILA DE TURNO (Ordeñe) ============ */

export function PLTurnoRow({
  turno,
  registrosHoy,
  pendientes = [],
  defaultOpen,
  onVacaManual,
  onFinalizar,
  onIniciado,
}: {
  turno: TurnoDef;
  registrosHoy: RegLecheroAPI[];
  pendientes?: string[];
  defaultOpen?: boolean;
  onVacaManual: () => void;
  onFinalizar: (t: TurnoDef) => void;
  onIniciado?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen || false);
  const iniciados = turnosIniciados();
  const { estado, litros, vacas, cerradoSinProd } = estadoTurno(turno, registrosHoy, iniciados, pendientes);
  const estadoLabel = cerradoSinProd ? "Cerrado" : estado;
  const horaIni = iniciados[turno.nombre] ? `${turno.hora} hs (inicio: ${iniciados[turno.nombre]})` : `${turno.hora} hs`;
  const badge = cerradoSinProd
    ? { bg: "var(--mc-surface-3)", c: "var(--mc-text-2)" }
    : estado === "Completado" ? { bg: "#dcfce7", c: "#166534" } : estado === "En Curso" ? { bg: "#fef3c7", c: "#92400e" } : { bg: "var(--mc-surface-3)", c: "var(--mc-text-2)" };
  const ico = turno.nombre.includes("1er") ? "sun" : turno.nombre.includes("2do") ? "clock" : "cloud";
  const icoColor = turno.nombre.includes("1er") ? "#c48410" : turno.nombre.includes("2do") ? "var(--mc-blue)" : "#7c3aed";
  const ultimas = registrosHoy.filter((r) => (r.turno || "") === turno.turnoKey).slice(0, 5);

  const handleIniciar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    marcarTurnoIniciado(turno.nombre, `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setOpen(true);
    onIniciado && onIniciado();
  };

  return (
    <div style={{ borderBottom: "1px solid var(--mc-line)" }}>
      <div
        onClick={() => setOpen((p) => !p)}
        style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: open ? "var(--mc-surface-2)" : "var(--mc-surface)", transition: "background .15s", flexWrap: "wrap" }}
      >
        <Icon name={open ? "chevDown" : "chevRight"} size={14} style={{ color: "var(--mc-text-3)", flexShrink: 0 }} />
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--mc-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={ico} size={17} style={{ color: icoColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>{turno.nombre}</span>
            <span style={{ fontSize: 12, color: "var(--mc-text-3)" }}>· {horaIni}</span>
            {litros > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)", marginLeft: 4 }}>{nfLt.format(litros)} lt</span>}
          </div>
          {vacas > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ padding: "1px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--mc-surface-3)", border: "1px solid var(--mc-line)", color: "var(--mc-text-2)" }}>{vacas} vacas registradas</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {estado === "Pendiente" && (
            <button onClick={handleIniciar} style={{ padding: "5px 12px", border: "2px solid var(--mc-green-600)", borderRadius: 8, background: "transparent", color: "var(--mc-green-700)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>▶ Iniciar Turno</button>
          )}
          {estado === "En Curso" && (
            <button onClick={(e) => { e.stopPropagation(); onFinalizar(turno); }} style={{ padding: "5px 12px", border: "2px solid var(--mc-amber)", borderRadius: 8, background: "transparent", color: "var(--mc-amber)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>■ Finalizar Turno</button>
          )}
          <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.c, animation: estado === "En Curso" ? "pulse-val 2s infinite" : undefined, flexShrink: 0 }}>{estadoLabel}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 18px 16px", background: "var(--mc-surface-2)", display: "flex", flexDirection: "column", gap: 12 }}>
          {estado === "En Curso" && (
            <>
              <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ alignSelf: "flex-start", marginTop: 10 }} onClick={(e) => { e.stopPropagation(); onVacaManual(); }}>+ Agregar Vaca Manual</button>
              <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>
                El turno está en curso. Registrá la producción con “Finalizar Turno” o desde “Registrar Ordeñe”.
              </div>
            </>
          )}
          {estado === "Completado" && cerradoSinProd && (
            <div style={{ background: "var(--mc-surface)", borderRadius: 10, border: "1px solid var(--mc-line)", padding: "12px 14px", marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="check" size={15} style={{ color: "var(--mc-text-3)", flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: "var(--mc-text-2)" }}>
                Turno <strong style={{ color: "var(--mc-ink)" }}>cerrado sin producción</strong>. Podés registrar la producción luego desde “Registrar Ordeñe”.
              </div>
            </div>
          )}
          {estado === "Completado" && !cerradoSinProd && (
            <div style={{ background: "var(--mc-surface)", borderRadius: 10, border: "1px solid var(--mc-line)", overflow: "hidden", marginTop: 10 }}>
              <div style={{ padding: "8px 12px", background: "var(--mc-surface-2)", fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Últimas vacas cargadas</div>
              {ultimas.map((r, i) => (
                <div key={r.id} style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between", borderBottom: i < ultimas.length - 1 ? "1px solid var(--mc-line)" : "none" }}>
                  <span style={{ fontSize: 13, fontFamily: "var(--ff-mono)", fontWeight: 700 }}>#{r.animal?.caravana?.replace(/^#/, "") || "—"}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>{Math.round(r.litros * 10) / 10} lt</span>
                </div>
              ))}
            </div>
          )}
          {estado === "Pendiente" && <div style={{ fontSize: 12, color: "var(--mc-text-3)", padding: "10px 0 0" }}>Turno no iniciado · Comenzará a las {turno.hora} hs</div>}
        </div>
      )}
    </div>
  );
}

/* ============ FINALIZAR TURNO ============ */

export function PLModalFinalizarTurno({
  turno,
  vacas,
  onClose,
  onFinalizarSinProd,
  onRegistrar,
}: {
  turno: TurnoDef;
  vacas: VacaLechera[];
  onClose: () => void;
  onFinalizarSinProd: (nombre: string) => void;
  onRegistrar: () => void;
}) {
  const [tieneProd, setTieneProd] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,12,.45)", zIndex: 9100, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div style={{ width: 540, maxWidth: "95vw", background: "var(--mc-surface)", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", maxHeight: "88vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 22px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--mc-ink)" }}>Finalizar Turno</div>
            <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>{turno.nombre} · {turno.hora} hs</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--mc-line)", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mc-text-2)" }}><Icon name="x" size={13} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: "10px 14px", background: "var(--mc-green-50)", border: "1px solid var(--mc-green-200)", borderRadius: 10, fontSize: 13, color: "var(--mc-green-700)", fontWeight: 600 }}>
            {turno.nombre} · {turno.hora} hs · {vacas.filter((v) => v.enOrdenne).length || vacas.length} vacas en ordeñe
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 10, border: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="flask" size={15} style={{ color: "var(--mc-green-600)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mc-ink)" }}>¿Tenés la producción del turno?</span>
            </div>
            <div style={{ display: "flex", background: "var(--mc-line)", borderRadius: 999, padding: 3, gap: 2 }}>
              <button onClick={() => setTieneProd(false)} style={{ padding: "4px 12px", borderRadius: 999, border: "none", background: !tieneProd ? "var(--mc-surface)" : "transparent", color: !tieneProd ? "var(--mc-ink)" : "var(--mc-text-3)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>No</button>
              <button onClick={() => setTieneProd(true)} style={{ padding: "4px 12px", borderRadius: 999, border: "none", background: tieneProd ? "var(--mc-green-600)" : "transparent", color: tieneProd ? "white" : "var(--mc-text-3)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>Sí</button>
            </div>
          </div>
          {!tieneProd ? (
            <div style={{ padding: "22px 18px", background: "var(--mc-surface-2)", borderRadius: 12, border: "1px solid var(--mc-line)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
              <Icon name="truck" size={28} style={{ color: "var(--mc-text-3)" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 4 }}>La producción quedará registrada al cargar la boleta del camión.</div>
                <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Podés cerrar el turno ahora y registrarlo luego desde “Registrar Ordeñe”.</div>
              </div>
              <button className="mc-btn mc-btn--primary" style={{ alignSelf: "stretch", justifyContent: "center" }} onClick={() => onFinalizarSinProd(turno.nombre)}>
                <Icon name="check" size={14} />Cerrar Turno Sin Producción
              </button>
            </div>
          ) : (
            <div style={{ padding: "22px 18px", background: "var(--mc-green-50)", borderRadius: 12, border: "1px solid var(--mc-green-200)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
              <Icon name="droplets" size={28} style={{ color: "var(--mc-green-600)" }} />
              <div style={{ fontSize: 13, color: "var(--mc-green-700)", fontWeight: 600 }}>Perfecto — registrá la producción del turno con carga total o individual.</div>
              <button className="mc-btn mc-btn--primary" style={{ alignSelf: "stretch", justifyContent: "center" }} onClick={onRegistrar}>
                <Icon name="plus" size={14} />Registrar Producción
              </button>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 22px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ============ AGREGAR VACA MANUAL ============ */

export function PLModalVacaManual({ vacas, loteDestino, onClose, onGuardado }: { vacas: VacaLechera[]; loteDestino?: string; onClose: () => void; onGuardado?: () => void }) {
  const [q, setQ] = useState("");
  const [modo, setModo] = useState<"solo" | "mover">("solo");
  const [litros, setLitros] = useState("");
  const [guardando, setGuardando] = useState(false);

  const encontrada = q.trim()
    ? vacas.find((v) => v.caravana.toLowerCase().includes(q.trim().replace(/^#/, "").toLowerCase()))
    : undefined;

  const confirmar = async () => {
    if (!encontrada) return;
    setGuardando(true);
    try {
      if (parseFloat(litros) > 0) {
        await fetch("/api/registros-lecheros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animalId: encontrada.dbId, fecha: hoyStr(), litros: parseFloat(litros), turno: "Manual", observaciones: "Agregada manualmente al turno" }),
        });
      }
      if (modo === "mover" && loteDestino) {
        await fetch(`/api/animales/${encontrada.dbId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ubicacion: loteDestino }),
        });
      }
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,12,.45)", zIndex: 9100, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div style={{ width: 480, maxWidth: "94vw", background: "var(--mc-surface)", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", maxHeight: "85vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: "var(--mc-ink)" }}>Agregar Vaca al Turno</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={13} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--mc-text-3)", pointerEvents: "none" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por caravana..." autoFocus style={{ ...inp, paddingLeft: 38 }} />
          </div>
          {encontrada && (
            <>
              <div style={{ border: "1px solid var(--mc-line)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: "var(--mc-surface-2)" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--mc-green-50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--mc-green-700)", flexShrink: 0 }}>
                  #{encontrada.caravana.slice(-2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>Vaca #{encontrada.caravana}</div>
                  <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>{encontrada.raza}{encontrada.del !== null ? ` · ${encontrada.del} DEL` : ""}</div>
                </div>
                <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#fef3c7", color: "#92400e" }}>{encontrada.lote}</span>
              </div>
              <div className="mc-field">
                <label className="mc-label">Litros de este ordeñe (opcional)</label>
                <input type="number" className="mc-input" value={litros} onChange={(e) => setLitros(e.target.value)} placeholder={encontrada.prom7 !== null ? String(encontrada.prom7) : "0"} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>¿Cómo querés agregarla?</div>
                {([
                  { id: "solo" as const, ico: "refresh", title: "Solo este ordeñe", desc: `Participará únicamente en este turno. Mantiene su lote actual (${encontrada.lote}).`, rec: true },
                  { id: "mover" as const, ico: "box", title: "Agregar al lote del turno", desc: `Se moverá permanentemente a ${loteDestino || "el lote del turno"}. Esto actualizará su ubicación en Animales.`, warn: true },
                ]).map((op) => (
                  <div key={op.id} onClick={() => setModo(op.id)} style={{ padding: "14px 16px", borderRadius: 12, border: modo === op.id ? "2px solid var(--mc-green-600)" : "2px solid var(--mc-line)", background: modo === op.id ? "#f0fdf4" : "var(--mc-surface)", cursor: "pointer", transition: "all .15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <Icon name={op.ico} size={15} style={{ color: modo === op.id ? "var(--mc-green-600)" : "var(--mc-text-3)" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>{op.title}</span>
                      {op.rec && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: "#dcfce7", color: "#166534", fontWeight: 700 }}>Recomendado</span>}
                      {op.warn && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: "#fef3c7", color: "#92400e", fontWeight: 700 }}>Cambio permanente</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--mc-text-3)", lineHeight: 1.5, paddingLeft: 25 }}>{op.desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {!q && <div style={{ textAlign: "center", padding: "24px 0", color: "var(--mc-text-3)", fontSize: 13 }}>Escribí la caravana de la vaca para buscarla</div>}
          {q && !encontrada && <div style={{ textAlign: "center", padding: "24px 0", color: "var(--mc-text-3)", fontSize: 13 }}>No se encontró ninguna vaca con esa caravana.</div>}
        </div>
        <div style={{ padding: "12px 22px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="mc-btn mc-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" disabled={!encontrada || guardando} onClick={confirmar} style={{ opacity: encontrada ? 1 : 0.4 }}>
            <Icon name="check" size={14} />Confirmar Agregado
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ TURNO EXTRA ============ */

export function PLModalAddTurno({ onClose, onGuardado }: { onClose: () => void; onGuardado?: () => void }) {
  const [nombre, setNombre] = useState("");
  const [hora, setHora] = useState("22:00");
  const [nota, setNota] = useState("");

  const guardar = () => {
    if (!nombre.trim()) return;
    agregarTurnoExtra({ nombre: nombre.trim(), hora, turnoKey: nombre.trim(), nota: nota || undefined });
    onGuardado && onGuardado();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,12,.45)", zIndex: 9100, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div style={{ width: 480, maxWidth: "95vw", background: "var(--mc-surface)", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", maxHeight: "88vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="plus" size={18} style={{ color: "#FF9D00" }} />
            <span style={{ fontSize: 17, fontWeight: 800, color: "var(--mc-ink)" }}>Agregar Turno Extra</span>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--mc-line)", background: "transparent", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mc-text-2)" }}><Icon name="x" size={13} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Nombre del turno</div>
            <input type="text" placeholder="Ej: 4to Ordeñe · Ordeñe de emergencia" style={inp} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Hora planificada</div>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={{ ...inp, width: "auto" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Nota / motivo <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--mc-text-3)" }}>(opcional)</span></div>
            <textarea placeholder="Ej: Turno extra por alta producción" style={{ ...inp, minHeight: 70, resize: "vertical" }} value={nota} onChange={(e) => setNota(e.target.value)} />
          </div>
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--mc-surface-2)", fontSize: 12, color: "var(--mc-text-3)", lineHeight: 1.5 }}>
            Este turno se agrega solo para hoy. Los registros de producción que cargues quedan guardados con el nombre del turno.
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button
            onClick={guardar}
            disabled={!nombre.trim()}
            style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "#FF9D00", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, opacity: nombre.trim() ? 1 : 0.5 }}
          >
            <Icon name="plus" size={14} style={{ color: "white" }} />Agregar Turno
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ BOLETA DE RETIRO ============ */

export function PLModalBoleta({ litrosOrdenadosHoy, onClose, onGuardado }: { litrosOrdenadosHoy: number; onClose: () => void; onGuardado?: () => void }) {
  const [fecha, setFecha] = useState(hoyStr());
  const [hora, setHora] = useState("08:00");
  const [industria, setIndustria] = useState("");
  const [litros, setLitros] = useState("");
  const [temp, setTemp] = useState("");
  const [nro, setNro] = useState("");
  const [guardando, setGuardando] = useState(false);

  const retirado = parseFloat(litros) || 0;
  const merma = litrosOrdenadosHoy - retirado;
  const mermaPct = litrosOrdenadosHoy > 0 && retirado > 0 ? (merma / litrosOrdenadosHoy) * 100 : 0;

  const guardar = async () => {
    setGuardando(true);
    try {
      const r = await fetch("/api/boletas-lecheras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, hora, tipo: "retiro", numero: nro, industria, litros, temperatura: temp }),
      });
      if (!r.ok) throw new Error();
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,12,.45)", zIndex: 9000, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div style={{ width: 520, maxWidth: "94vw", background: "var(--mc-surface)", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", maxHeight: "88vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="truck" size={18} style={{ color: "var(--mc-green-600)" }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--mc-ink)" }}>Boleta de Retiro</span>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={13} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Fecha de retiro</div>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Hora de retiro</div>
                <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Empresa recolectora</div>
                <input type="text" value={industria} onChange={(e) => setIndustria(e.target.value)} placeholder="Ej: La Láctea, Conaprole…" style={inp} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Litros retirados</div>
                <input type="number" value={litros} onChange={(e) => setLitros(e.target.value)} placeholder="0" style={{ ...inp, fontSize: 22, fontWeight: 800 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Temperatura (°C)</div>
                <input type="number" value={temp} onChange={(e) => setTemp(e.target.value)} step="0.1" placeholder="4.0" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Número de boleta</div>
                <input type="text" value={nro} onChange={(e) => setNro(e.target.value)} placeholder={`RT-${hoyStr().replace(/-/g, "")}`} style={inp} />
              </div>
            </div>
          </div>
          <div style={{ background: "var(--mc-surface-2)", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: "var(--mc-text-2)", lineHeight: 1.8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="droplets" size={13} /> Ordeñado hoy: <strong>{nfLt.format(Math.round(litrosOrdenadosHoy))} lt</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="truck" size={13} /> Retirado: <strong>{nfLt.format(retirado)} lt</strong></div>
              {litrosOrdenadosHoy > 0 && retirado > 0 && (
                <div style={{ color: mermaPct > 5 ? "#c93434" : "var(--mc-text-2)" }}>
                  <Icon name="chart" size={13} /> Merma: <strong>{merma > 0 ? nfLt.format(Math.round(merma)) : 0} lt ({mermaPct.toFixed(1)}%)</strong>
                </div>
              )}
            </div>
            {mermaPct > 5 && <div style={{ marginTop: 8, fontSize: 11, color: "#c93434", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Icon name="alert-triangle" size={11} /> Merma inusualmente alta — verificar registros de ordeñe</div>}
          </div>
        </div>
        <div style={{ padding: "12px 22px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="mc-btn mc-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" onClick={guardar} disabled={guardando || !litros}><Icon name="save" size={14} />Guardar Boleta</button>
        </div>
      </div>
    </div>
  );
}

/* ============ REGISTRAR ANÁLISIS DE CALIDAD ============ */

export function PLModalCalidad({ onClose, onGuardado }: { onClose: () => void; onGuardado?: () => void }) {
  const [vals, setVals] = useState({ rcs: "", gr: "", pr: "", temp: "" });
  const [fecha, setFecha] = useState(hoyStr());
  const [lab, setLab] = useState("");
  const [nro, setNro] = useState("");
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof typeof vals, v: string) => setVals((p) => ({ ...p, [k]: v }));

  const inRange: Record<string, boolean | null> = {
    rcs: vals.rcs === "" ? null : parseFloat(vals.rcs) < 200,
    gr: vals.gr === "" ? null : parseFloat(vals.gr) >= 3.5,
    pr: vals.pr === "" ? null : parseFloat(vals.pr) >= 3.0,
    temp: vals.temp === "" ? null : parseFloat(vals.temp) <= 6,
  };
  const allFilled = vals.rcs && vals.gr && vals.pr && vals.temp;
  const allOk = allFilled && inRange.rcs && inRange.gr && inRange.pr && inRange.temp;

  const metrics = [
    { label: "Células Somáticas (RCS)", sub: "Ingresá en miles · ej: 185", key: "rcs" as const, ph: "185", unit: "k cél/ml", ico: "microscope", ok: "< 200k — En rango", err: "≥ 200k — Fuera de rango" },
    { label: "Grasa", sub: "Porcentaje en leche · ej: 3.8", key: "gr" as const, ph: "3.8", unit: "%", ico: "droplets", ok: "≥ 3,5% — En rango", err: "< 3,5% — Fuera de rango" },
    { label: "Proteína", sub: "Porcentaje en leche · ej: 3.2", key: "pr" as const, ph: "3.2", unit: "%", ico: "bolt", ok: "≥ 3,0% — En rango", err: "< 3,0% — Fuera de rango" },
    { label: "Temperatura del Tanque", sub: "Temperatura de conservación", key: "temp" as const, ph: "4.2", unit: "°C", ico: "thermometer", ok: "≤ 6°C — En rango", err: "> 6°C — Fuera de rango" },
  ];

  const guardar = async () => {
    setGuardando(true);
    try {
      const r = await fetch("/api/boletas-lecheras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          tipo: "calidad",
          numero: nro,
          industria: lab,
          ccs: vals.rcs,
          grasa: vals.gr,
          proteina: vals.pr,
          temperatura: vals.temp,
        }),
      });
      if (!r.ok) throw new Error();
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  const SectionHead = ({ n, title, sub }: { n: string; title: string; sub?: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--mc-green-600)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{n}</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,12,.50)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "min(620px,97vw)", background: "var(--mc-surface)", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,.30)", display: "flex", flexDirection: "column", maxHeight: "92vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ height: 3, background: "linear-gradient(90deg,var(--mc-green-700),var(--mc-green-400))", borderRadius: "18px 18px 0 0", flexShrink: 0 }} />
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--mc-green-50)", border: "1px solid var(--mc-green-200)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="microscope" size={20} style={{ color: "var(--mc-green-600)" }} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--mc-ink)" }}>Registrar Análisis de Calidad</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 1 }}>Ingresá los resultados del laboratorio</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid var(--mc-line)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mc-text-2)", flexShrink: 0 }}><Icon name="x" size={14} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "var(--mc-surface-2)", borderRadius: 14, padding: 16, border: "1px solid var(--mc-line)" }}>
            <SectionHead n="1" title="Datos generales" sub="Fecha, laboratorio y número de informe" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-text-3)", marginBottom: 5 }}>Fecha</div>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-text-3)", marginBottom: 5 }}>Laboratorio</div>
                <input type="text" value={lab} onChange={(e) => setLab(e.target.value)} placeholder="Ej: La Láctea" style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-text-3)", marginBottom: 5 }}>Nº informe <span style={{ color: "var(--mc-text-3)", fontWeight: 400 }}>(opc.)</span></div>
                <input type="text" value={nro} onChange={(e) => setNro(e.target.value)} placeholder="LAB-…" style={inp} />
              </div>
            </div>
          </div>
          <div style={{ background: "var(--mc-surface-2)", borderRadius: 14, padding: 16, border: "1px solid var(--mc-line)" }}>
            <SectionHead n="2" title="Parámetros de calidad" sub="Los valores se validan automáticamente contra los rangos permitidos" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {metrics.map((m) => {
                const st = inRange[m.key];
                const bc = st === true ? "var(--mc-green-500)" : st === false ? "var(--mc-red)" : "var(--mc-line)";
                const bg = st === true ? "var(--mc-green-50)" : st === false ? "var(--mc-red-bg)" : "var(--mc-surface)";
                return (
                  <div key={m.key} style={{ background: bg, borderRadius: 12, padding: 12, border: `1.5px solid ${bc}`, transition: "all .15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                      <Icon name={m.ico} size={14} style={{ color: "var(--mc-text-3)", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>{m.label}</div>
                        <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>{m.sub}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="number" step="any" placeholder={m.ph} value={vals[m.key]} onChange={(e) => set(m.key, e.target.value)} style={{ ...inp, border: `1.5px solid ${bc}`, flex: 1, fontSize: 16, padding: "8px 10px", fontWeight: 600 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mc-text-3)", flexShrink: 0, minWidth: 40 }}>{m.unit}</span>
                    </div>
                    {st !== null && (
                      <div style={{ fontSize: 10, marginTop: 7, fontWeight: 700, color: st ? "var(--mc-green-700)" : "var(--mc-red)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon name={st ? "check" : "alert"} size={11} />{st ? m.ok : m.err}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {allFilled && (
            <div style={{ padding: "14px 16px", borderRadius: 14, background: allOk ? "var(--mc-green-50)" : "var(--mc-red-bg)", border: `1.5px solid ${allOk ? "var(--mc-green-200)" : "rgba(201,52,52,.3)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: allOk ? "var(--mc-green-600)" : "var(--mc-red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={allOk ? "check" : "alert"} size={14} style={{ color: "white" }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: allOk ? "var(--mc-green-700)" : "var(--mc-red)" }}>
                  {allOk ? "Calidad Aprobada — todos los parámetros en rango" : "Calidad Observada — revisá los valores marcados"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {([["RCS", `${vals.rcs}k`, inRange.rcs], ["Grasa", `${vals.gr}%`, inRange.gr], ["Proteína", `${vals.pr}%`, inRange.pr], ["Temp", `${vals.temp}°C`, inRange.temp]] as const).map(([k, v, ok]) => (
                  <span key={k} style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: ok ? "var(--mc-surface)" : "rgba(201,52,52,.1)", color: ok ? "var(--mc-green-700)" : "var(--mc-red)", border: `1px solid ${ok ? "var(--mc-green-200)" : "rgba(201,52,52,.3)"}` }}>
                    {ok ? <Icon name="check" size={11} /> : <Icon name="x" size={11} />} {k} {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0, background: "var(--mc-surface-2)" }}>
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" onClick={guardar} disabled={guardando || !allFilled}><Icon name="check" size={14} />Guardar Análisis</button>
        </div>
      </div>
    </div>
  );
}

/** Última boleta de retiro (card lateral en Ordeñe). */
export function PLRetiroCard({ boleta, litrosHoy, onCargar }: { boleta: BoletaAPI | null; litrosHoy: number; onCargar: () => void }) {
  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="truck" size={15} style={{ color: "var(--mc-green-600)" }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>Retiro de Leche</span>
      </div>
      {boleta ? (
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["calendar", new Date(boleta.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) + " · " + new Date(boleta.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " hs"],
            ["droplets", `${nfLt.format(Math.round(boleta.litros || 0))} lt retirados`],
            ...(boleta.temperatura != null ? [["thermometer", `${boleta.temperatura}°C temperatura`]] : []),
            ...(litrosHoy > 0 && boleta.litros ? [["chart", `Merma: ${nfLt.format(Math.max(0, Math.round(litrosHoy - boleta.litros)))} lt (${litrosHoy > 0 ? (((litrosHoy - boleta.litros) / litrosHoy) * 100).toFixed(1) : 0}% de lo ordeñado)`]] : []),
          ].map(([ico, txt], i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Icon name={ico} size={14} style={{ color: "var(--mc-text-3)" }} />
              <span style={{ fontSize: 13, color: "var(--mc-text-2)" }}>{txt}</span>
            </div>
          ))}
          {boleta.numero && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="pdf" size={14} style={{ color: "var(--mc-green-600)" }} />
              <span style={{ fontSize: 13, color: "var(--mc-green-600)", fontWeight: 600 }}>Boleta #{boleta.numero}</span>
            </div>
          )}
          <div style={{ marginTop: 4 }}>
            <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#166534" }}>Boleta cargada</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: "20px 18px", textAlign: "center" }}>
          <Icon name="truck" size={24} style={{ color: "var(--mc-text-3)", marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mc-text-2)", marginBottom: 10 }}>Todavía no cargaste boletas de retiro.</div>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={onCargar}>Cargar Boleta de Camión</button>
        </div>
      )}
    </div>
  );
}
