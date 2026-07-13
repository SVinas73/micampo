"use client";

// Modales de Mov. de Tropas: creación/edición de tropas, asignación de
// animales, traslados inmediatos, planificación de movimientos y rutinas
// de pastoreo con constructor de ruta. Conectados a las APIs reales.

import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/mc";
import { AnimalRow } from "./tipos";
import {
  ESTADO_COLOR_TROPA,
  LoteGeoAPI,
  MovTropaAPI,
  RutinaAPI,
  RutinaConfig,
  TropaAPI,
  colorDeTropa,
  estadoAnimalTropa,
  fmtFechaLarga,
  freqLabel,
  parseRutinaConfig,
  pesoPromTropa,
  rutaDeRutina,
} from "./tropas-tipos";

/* ============ NUEVA TROPA ============ */

export function ModalNuevaTropa({
  lotes,
  sinAsignar,
  onClose,
  onGuardado,
}: {
  lotes: LoteGeoAPI[];
  sinAsignar: AnimalRow[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("Cría");
  const [loteId, setLoteId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const disponibles = sinAsignar.filter((a) => q === "" || a.id.toLowerCase().includes(q) || a.raza.toLowerCase().includes(q));
  const toggle = (id: string) => setSeleccionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const crear = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      await fetch("/api/tropas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), categoria, loteId: loteId || null, animalIds: seleccionados }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(560px,96vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-green-600)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Mov. de Tropas</div>
              <div className="mc-modal__title" style={{ fontSize: 21 }}>Nueva Tropa</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-2)", marginTop: 3 }}>Creá una tropa y sumale animales sin asignar.</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div className="row gap-8" style={{ marginBottom: 12, alignItems: "center" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>1</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", textTransform: "uppercase", letterSpacing: ".04em" }}>Datos de la tropa</span>
            </div>
            <div className="col gap-12">
              <div className="mc-field">
                <label className="mc-label">Nombre</label>
                <input className="mc-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Novillos Export" />
              </div>
              <div className="grid g-cols-2">
                <div className="mc-field">
                  <label className="mc-label">Categoría / tipo</label>
                  <select className="mc-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    {["Cría", "Recría", "Invernada", "Tambo", "Engorde", "Guachera", "Cabaña"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="mc-field">
                  <label className="mc-label">Ubicación / Lote inicial</label>
                  <select className="mc-select" value={loteId} onChange={(e) => setLoteId(e.target.value)}>
                    <option value="">Sin lote asignado</option>
                    {lotes.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="row gap-8" style={{ marginBottom: 12, alignItems: "center" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>2</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", textTransform: "uppercase", letterSpacing: ".04em" }}>Animales iniciales</span>
              <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>(opcional)</span>
            </div>
            <div className="row" style={{ background: "var(--mc-surface-2)", border: "1px solid var(--mc-line-2)", borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>
              <Icon name="search" size={14} style={{ color: "var(--mc-text-3)" }} />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar animal sin asignar por caravana o raza…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "inherit" }} />
            </div>
            {disponibles.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--mc-text-3)", padding: "10px 0" }}>No hay animales sin asignar que coincidan. Podés dejar la tropa vacía y poblarla después.</div>
            ) : (
              <div className="col gap-6" style={{ maxHeight: 180, overflowY: "auto" }}>
                {disponibles.map((a) => (
                  <div key={a.dbId} onClick={() => toggle(a.dbId)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, cursor: "pointer", border: seleccionados.includes(a.dbId) ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)", background: seleccionados.includes(a.dbId) ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{a.id}</span>
                      <span style={{ fontSize: 11.5, color: "var(--mc-text-3)", marginLeft: 8 }}>{a.raza} · {a.edad}</span>
                    </div>
                    {seleccionados.includes(a.dbId) && <Icon name="check" size={14} style={{ color: "var(--mc-green-600)" }} />}
                  </div>
                ))}
              </div>
            )}
            {seleccionados.length > 0 && <div style={{ fontSize: 12, color: "var(--mc-green-700)", fontWeight: 600, marginTop: 8 }}>{seleccionados.length} animal(es) seleccionado(s)</div>}
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={crear} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }} disabled={!nombre.trim() || guardando}>
            <Icon name="check" size={14} /> {guardando ? "Creando…" : "Crear Tropa"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ ASIGNAR ANIMAL A TROPA ============ */

export function ModalAsignarAnimal({
  animal,
  tropas,
  onClose,
  onGuardado,
}: {
  animal: AnimalRow;
  tropas: TropaAPI[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const tropaOrigen = tropas.find((t) => t.id === animal.tropaId);
  const opciones = tropas.filter((t) => t.id !== animal.tropaId);
  const [destino, setDestino] = useState(opciones[0]?.id || "");
  const [confirmado, setConfirmado] = useState(false);

  const confirmar = async () => {
    if (!destino) return;
    await fetch(`/api/tropas/${destino}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agregarAnimalIds: [animal.dbId] }),
    });
    setConfirmado(true);
    onGuardado && onGuardado();
    setTimeout(onClose, 700);
  };

  const destinoObj = tropas.find((t) => t.id === destino);

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(480px,95vw)", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--mc-line)", background: "linear-gradient(135deg,var(--mc-green-50),var(--mc-surface))" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="row gap-12">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--mc-surface-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="cow" size={20} style={{ color: "var(--mc-green-700)" }} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "var(--mc-ink)" }}>{animal.id}</div>
                <div style={{ fontSize: 12, color: "var(--mc-text-2)" }}>{animal.raza} · {animal.sexo === "M" ? "Macho" : "Hembra"} · {animal.edad}</div>
              </div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="row gap-8" style={{ fontSize: 13, color: "var(--mc-text-2)" }}>
            <span>De: <strong style={{ color: "var(--mc-ink)" }}>{tropaOrigen ? tropaOrigen.nombre : "Sin asignar"}</strong></span>
            <Icon name="arrow-right" size={13} />
            <span>A: <strong style={{ color: "var(--mc-green-700)" }}>{destinoObj?.nombre || "—"}</strong></span>
          </div>
          <div className="mc-field">
            <label className="mc-label">Tropa destino</label>
            <select className="mc-select" value={destino} onChange={(e) => setDestino(e.target.value)}>
              {opciones.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t._count?.animales ?? t.animales?.length ?? 0} cab.)</option>)}
            </select>
            {opciones.length === 0 && <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 4 }}>Creá una tropa primero.</div>}
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} disabled={!destino} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }}>
            <Icon name="check" size={14} /> {confirmado ? "¡Movimiento registrado!" : "Confirmar Movimiento"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ ELIMINAR TROPA ============ */

export function ModalEliminarTropa({
  tropa,
  onClose,
  onIrAMover,
  onEliminada,
}: {
  tropa: TropaAPI;
  onClose: () => void;
  onIrAMover: (t: TropaAPI) => void;
  onEliminada?: () => void;
}) {
  const cant = tropa._count?.animales ?? tropa.animales?.length ?? 0;
  const vacia = cant === 0;
  const [borrando, setBorrando] = useState(false);

  const eliminar = async () => {
    setBorrando(true);
    try {
      await fetch(`/api/tropas/${tropa.id}`, { method: "DELETE" });
      onEliminada && onEliminada();
      onClose();
    } finally {
      setBorrando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(440px,95vw)", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--mc-line)" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="mc-modal__title" style={{ fontSize: 19 }}>Eliminar Tropa</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-2)", marginTop: 3 }}>{tropa.nombre}</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ padding: "18px 22px" }}>
          {!vacia ? (
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--mc-amber-bg)", border: "1px solid rgba(196,132,16,0.3)", display: "flex", gap: 10 }}>
              <Icon name="alert-triangle" size={18} style={{ color: "var(--mc-amber)", flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: "var(--mc-ink)", lineHeight: 1.5 }}>
                Esta tropa tiene <strong>{cant} animales</strong>. Reasigná o movelos antes de eliminar.
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: "var(--mc-ink)" }}>¿Confirmás que querés eliminar <strong>{tropa.nombre}</strong>? Esta acción no se puede deshacer.</div>
          )}
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          {!vacia ? (
            <button onClick={() => onIrAMover(tropa)} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }}>Ir a mover animales <Icon name="arrow-right" size={13} /></button>
          ) : (
            <button onClick={eliminar} disabled={borrando} className="mc-btn mc-btn--red" style={{ flex: 2, justifyContent: "center" }}><Icon name="trash" size={13} /> {borrando ? "Eliminando…" : "Sí, eliminar"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ DETALLE DE TROPA ============ */

export function ModalDetalleTropa({
  tropa,
  color,
  movimientos,
  onClose,
  onEliminar,
  onMoverAnimal,
  onGoToGestion,
  onEditar,
}: {
  tropa: TropaAPI;
  color: string;
  movimientos: MovTropaAPI[];
  onClose: () => void;
  onEliminar: (t: TropaAPI) => void;
  onMoverAnimal: (a: AnimalRow["dbId"], caravana: string) => void;
  onGoToGestion?: () => void;
  onEditar?: (t: TropaAPI) => void;
}) {
  const animales = tropa.animales || [];
  const estados: Record<string, number> = {};
  animales.forEach((a) => {
    const e = estadoAnimalTropa(a);
    estados[e] = (estados[e] || 0) + 1;
  });
  const segsData = Object.keys(estados).map((k) => ({ lbl: k, n: estados[k], color: ESTADO_COLOR_TROPA[k] || "#94a3b8" }));
  const totalSeg = animales.length || 1;

  const CX = 70, CY = 70, RO = 58, RI = 36, TWO_PI = 2 * Math.PI;
  const makeSeg = (sa: number, ea: number) => {
    const s1 = sa - Math.PI / 2, e1 = ea - Math.PI / 2;
    const ox1 = (CX + RO * Math.cos(s1)).toFixed(2), oy1 = (CY + RO * Math.sin(s1)).toFixed(2);
    const ox2 = (CX + RO * Math.cos(e1)).toFixed(2), oy2 = (CY + RO * Math.sin(e1)).toFixed(2);
    const ix1 = (CX + RI * Math.cos(e1)).toFixed(2), iy1 = (CY + RI * Math.sin(e1)).toFixed(2);
    const ix2 = (CX + RI * Math.cos(s1)).toFixed(2), iy2 = (CY + RI * Math.sin(s1)).toFixed(2);
    const lg = ea - sa > Math.PI ? 1 : 0;
    return `M${ox1},${oy1} A${RO},${RO} 0 ${lg} 1 ${ox2},${oy2} L${ix1},${iy1} A${RI},${RI} 0 ${lg} 0 ${ix2},${iy2} Z`;
  };
  let cum = 0;
  const paths = segsData.map((s) => {
    const ang = (s.n / totalSeg) * TWO_PI;
    const p = { ...s, d: makeSeg(cum, cum + ang) };
    cum += ang;
    return p;
  });

  const movsTropa = movimientos.filter((m) => m.tropaId === tropa.id).slice(0, 5);
  const peso = pesoPromTropa(tropa);

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(860px,96vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)", background: `linear-gradient(135deg, ${color}14, var(--mc-surface))`, flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="row gap-12">
              <span style={{ padding: "4px 11px", borderRadius: 999, background: color, color: "#fff", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{tropa.nombre.slice(0, 2).toUpperCase()}</span>
              <div>
                <div style={{ fontSize: 21, fontWeight: 900, color: "var(--mc-ink)", letterSpacing: "-.02em" }}>{tropa.nombre}</div>
                <div style={{ fontSize: 12, color: "var(--mc-text-2)" }}>{tropa.categoria || "Sin categoría"}</div>
              </div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>

        <div className="mc-modal__body" style={{ overflowY: "auto", overflowX: "hidden", display: "grid", gridTemplateColumns: "minmax(0,38%) minmax(0,62%)", gap: 16, alignItems: "start" }}>
          <div className="col gap-14">
            {/* Resumen */}
            <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="mc-card__head" style={{ padding: "14px 16px 10px", marginBottom: 0 }}>
                <div>
                  <div className="mc-card__title">Resumen</div>
                  <div className="text-xs text-muted mt-4">Datos generales de la tropa</div>
                </div>
                <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => onEditar && onEditar(tropa)}><Icon name="edit" size={12} />Editar datos</button>
              </div>
              <div style={{ padding: "4px 16px 14px" }}>
                {([
                  ["Nombre", tropa.nombre],
                  ["Categoría", tropa.categoria || "—"],
                  ["Lote / Ubicación", tropa.lote?.nombre || "Sin lote"],
                  ["Cabezas", String(animales.length)],
                  ["Peso promedio", peso !== null ? `${peso} kg` : "Sin pesadas"],
                  ["Rutina", tropa.rutina?.nombre || "Sin rutina"],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="mc-stat-row">
                    <span className="mc-stat-row__label">{l}</span>
                    <span className="mc-stat-row__value">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Composición */}
            <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="mc-card__head" style={{ padding: "14px 16px 10px", marginBottom: 0 }}>
                <div>
                  <div className="mc-card__title">Composición del Rodeo</div>
                  <div className="text-xs text-muted mt-4">Distribución por estado sanitario</div>
                </div>
              </div>
              <div style={{ padding: "14px 16px 18px" }}>
                {animales.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin animales asignados.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <svg width={140} height={140}>
                      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
                      <text x={CX} y={CY - 6} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--mc-ink)">{animales.length}</text>
                      <text x={CX} y={CY + 10} textAnchor="middle" fontSize={9} fill="var(--mc-text-3)">animales</text>
                    </svg>
                    <div className="col gap-4" style={{ width: "100%", marginTop: 10 }}>
                      {segsData.map((s) => (
                        <div key={s.lbl} className="row" style={{ justifyContent: "space-between" }}>
                          <div className="row gap-6"><div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} /><span style={{ fontSize: 11, color: "var(--mc-text-2)" }}>{s.lbl}</span></div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-ink)" }}>{s.n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col gap-14">
            {/* Animales */}
            <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="mc-card__head" style={{ padding: "14px 16px 10px", marginBottom: 0 }}>
                <div>
                  <div className="mc-card__title">Animales de la Tropa ({animales.length})</div>
                  <div className="text-xs text-muted mt-4">Detalle individual de cada cabeza</div>
                </div>
              </div>
              <div style={{ overflowX: "auto", maxHeight: 300, overflowY: "auto" }}>
                <table className="mc-table">
                  <thead>
                    <tr><th>ID</th><th>Raza</th><th>Sexo</th><th>Peso</th><th>Estado</th><th></th></tr>
                  </thead>
                  <tbody>
                    {animales.map((a) => (
                      <tr key={a.id}>
                        <td className="mc-cell--emph">#{a.caravana.replace(/^#/, "")}</td>
                        <td>{a.raza || "—"}</td>
                        <td>{a.sexo === "Macho" || a.sexo === "M" ? "M" : "H"}</td>
                        <td>{a.registrosPeso?.[0]?.peso ? `${Math.round(a.registrosPeso[0].peso)} kg` : "—"}</td>
                        <td><span className="mc-badge mc-badge--neutral">{estadoAnimalTropa(a)}</span></td>
                        <td><button onClick={() => onMoverAnimal(a.id, a.caravana)} className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "3px 8px" }}><Icon name="move-right" size={11} />Mover</button></td>
                      </tr>
                    ))}
                    {animales.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: "18px 8px", textAlign: "center", color: "var(--mc-text-3)", fontSize: 12 }}>Esta tropa no tiene animales asignados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Movimientos recientes */}
            <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="mc-card__head" style={{ padding: "14px 16px 10px", marginBottom: 0 }}>
                <div>
                  <div className="mc-card__title">Movimientos Recientes</div>
                  <div className="text-xs text-muted mt-4">Últimos traslados de la tropa</div>
                </div>
              </div>
              <div style={{ padding: "14px 16px 18px" }}>
                {movsTropa.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin movimientos registrados.</div>
                ) : (
                  <div style={{ borderLeft: "2px solid var(--mc-line)", marginLeft: 4 }}>
                    {movsTropa.map((m) => (
                      <div key={m.id} style={{ position: "relative", padding: "0 0 12px 16px" }}>
                        <div style={{ position: "absolute", left: -5, top: 2, width: 8, height: 8, borderRadius: "50%", background: m.estado === "Ejecutado" ? "#4ade80" : m.estado === "Cancelado" ? "#94a3b8" : "#f59e0b" }} />
                        <div style={{ fontSize: 10.5, color: "var(--mc-text-3)", fontWeight: 700 }}>{fmtFechaLarga(m.fecha)}{m.horario ? ` · ${m.horario}` : ""}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)", margin: "2px 0" }}>{m.motivo || "Traslado"}</div>
                        <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{m.origenNombre || "—"} → {m.destinoNombre || "—"} · {m.cabezas ?? animales.length} cab.</div>
                        <span style={{ display: "inline-block", marginTop: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: m.estado === "Ejecutado" ? "#dcfce7" : m.estado === "Cancelado" ? "#f1f5f9" : "#fef3c7", color: m.estado === "Ejecutado" ? "#16a34a" : m.estado === "Cancelado" ? "#475569" : "#d97706" }}>{m.estado}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mc-modal__foot" style={{ justifyContent: "space-between" }}>
          <button onClick={() => onEliminar(tropa)} className="mc-btn mc-btn--danger">Eliminar Tropa</button>
          <div className="row gap-8">
            <button onClick={onClose} className="mc-btn mc-btn--secondary">Cerrar</button>
            <button onClick={() => { onClose(); onGoToGestion && onGoToGestion(); }} className="mc-btn mc-btn--primary">Ir a Gestión <Icon name="arrow-right" size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ EDITAR TROPA (datos) ============ */

export function ModalEditarTropa({
  tropa,
  lotes,
  onClose,
  onGuardado,
}: {
  tropa: TropaAPI;
  lotes: LoteGeoAPI[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [nombre, setNombre] = useState(tropa.nombre);
  const [categoria, setCategoria] = useState(tropa.categoria || "");
  const [loteId, setLoteId] = useState(tropa.loteId || "");
  const [color, setColor] = useState(tropa.color || "");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await fetch(`/api/tropas/${tropa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, categoria, loteId: loteId || null, color: color || null }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" style={{ zIndex: 10001 }} onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(440px,95vw)", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--mc-line)" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="mc-modal__title" style={{ fontSize: 19 }}>Editar Tropa</div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mc-field">
            <label className="mc-label">Nombre</label>
            <input className="mc-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="grid g-cols-2 gap-8">
            <div className="mc-field">
              <label className="mc-label">Categoría</label>
              <select className="mc-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">—</option>
                {["Cría", "Recría", "Invernada", "Tambo", "Engorde", "Guachera", "Cabaña"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="mc-field">
              <label className="mc-label">Lote</label>
              <select className="mc-select" value={loteId} onChange={(e) => setLoteId(e.target.value)}>
                <option value="">Sin lote</option>
                {lotes.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="mc-field">
            <label className="mc-label">Color de identificación</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["#16a34a", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#0891b2", "#ec4899"].map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: color === c ? "3px solid var(--mc-ink)" : "2px solid var(--mc-surface)", boxShadow: "0 0 0 1px var(--mc-line-2)", cursor: "pointer" }} />
              ))}
            </div>
          </div>
        </div>
        <div className="mc-modal__foot">
          <button onClick={onClose} className="mc-btn mc-btn--secondary">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !nombre.trim()} className="mc-btn mc-btn--primary"><Icon name="check" size={13} />{guardando ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============ NUEVO TRASLADO INMEDIATO ============ */

export function ModalNuevoTraslado({
  tropas,
  lotes,
  onClose,
  onGuardado,
}: {
  tropas: TropaAPI[];
  lotes: LoteGeoAPI[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [tropaId, setTropaId] = useState("");
  const [destTipo, setDestTipo] = useState<"lote" | "tropa">("lote");
  const [destLote, setDestLote] = useState("");
  const [destTropa, setDestTropa] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const tropaObj = tropas.find((t) => t.id === tropaId);

  const ejecutar = async () => {
    if (!tropaId) return;
    setGuardando(true);
    try {
      if (destTipo === "lote") {
        if (!destLote) return;
        const now = new Date();
        await fetch("/api/movimientos-tropa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tropaId,
            fecha: now.toISOString(),
            horario: now.toTimeString().slice(0, 5),
            origenNombre: tropaObj?.lote?.nombre || null,
            destinoNombre: destLote,
            motivo: motivo || "Traslado inmediato",
            estado: "Ejecutado",
          }),
        });
      } else {
        if (!destTropa) return;
        // Fusionar: mover todos los animales a la tropa destino
        const ids = (tropaObj?.animales || []).map((a) => a.id);
        await fetch(`/api/tropas/${destTropa}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agregarAnimalIds: ids }),
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
      <div className="mc-modal" style={{ width: "min(500px,96vw)", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--mc-line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="alert-triangle" size={20} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 900, color: "var(--mc-ink)", letterSpacing: "-.02em" }}>Nuevo Traslado Inmediato</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Ejecutará el movimiento en tiempo real.</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={13} /></button>
          </div>
        </div>

        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "70vh", overflowY: "auto" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>Tropa de Origen</div>
            <select className="mc-select" value={tropaId} onChange={(e) => setTropaId(e.target.value)} style={{ fontWeight: tropaId ? 700 : 400 }}>
              <option value="">Seleccioná una tropa...</option>
              {tropas.map((t) => <option key={t.id} value={t.id}>{t.nombre} · {t.lote?.nombre || "sin lote"} ({t._count?.animales ?? t.animales?.length ?? 0} cab.)</option>)}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>Destino</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {([{ id: "lote", label: "Lote / Potrero" }, { id: "tropa", label: "Otra Tropa" }] as const).map((opt) => (
                <button key={opt.id} onClick={() => setDestTipo(opt.id)} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, border: destTipo === opt.id ? "2px solid #16a34a" : "1.5px solid var(--mc-line-2)", background: destTipo === opt.id ? "var(--mc-green-50)" : "var(--mc-surface)", color: destTipo === opt.id ? "#16a34a" : "#64748b" }}>{opt.label}</button>
              ))}
            </div>
            {destTipo === "lote" ? (
              <select className="mc-select" value={destLote} onChange={(e) => setDestLote(e.target.value)}>
                <option value="">Seleccioná un lote o potrero...</option>
                {lotes.map((l) => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
              </select>
            ) : (
              <select className="mc-select" value={destTropa} onChange={(e) => setDestTropa(e.target.value)}>
                <option value="">Seleccioná la tropa destino...</option>
                {tropas.filter((t) => t.id !== tropaId).map((t) => <option key={t.id} value={t.id}>{t.nombre} · {t.lote?.nombre || "sin lote"} ({t._count?.animales ?? 0} cab.)</option>)}
              </select>
            )}
          </div>

          {tropaObj && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)", fontSize: 12, color: "var(--mc-text-2)" }}>
              Se trasladará <strong style={{ color: "var(--mc-ink)" }}>toda la tropa</strong>: {tropaObj._count?.animales ?? tropaObj.animales?.length ?? 0} cabezas.
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>Motivo <span style={{ fontWeight: 400, color: "#94a3b8", textTransform: "none" }}>(Opcional)</span></div>
            <input className="mc-input" placeholder="Ingresá un motivo..." value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ fontSize: 13 }} />
          </div>
        </div>

        <div style={{ padding: "12px 22px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary">Cancelar</button>
          <button onClick={ejecutar} disabled={guardando || !tropaId || (destTipo === "lote" ? !destLote : !destTropa)} className="mc-btn mc-btn--primary">
            {guardando ? "Ejecutando…" : "Ejecutar Traslado Ahora →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ PLANIFICAR MOVIMIENTO (3 pasos) ============ */

export function ModalPlanificarMovimiento({
  tropas,
  rutinas,
  lotes,
  fechaInicial,
  rutinaInicial,
  onClose,
  onGuardado,
}: {
  tropas: TropaAPI[];
  rutinas: RutinaAPI[];
  lotes: LoteGeoAPI[];
  fechaInicial?: string;
  rutinaInicial?: string;
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [paso, setPaso] = useState(1);
  const [rutinaSel, setRutinaSel] = useState<string | null>(rutinaInicial || null);
  const [tropaSel, setTropaSel] = useState<string>("");
  const [mFreq, setMFreq] = useState("Una vez");
  const [mFreqDias, setMFreqDias] = useState(21);
  const [mFecha, setMFecha] = useState(fechaInicial || new Date().toISOString().slice(0, 10));
  const [mHora, setMHora] = useState("08:30");
  const [mLote, setMLote] = useState("");
  const [mResp, setMResp] = useState("");
  const [mNotas, setMNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const rutinasActivas = rutinas.filter((r) => r.estado !== "Pausada");
  const rutinaObj = rutinas.find((r) => r.id === rutinaSel) || null;
  const ruta = rutaDeRutina(rutinaObj);
  const tropaDeRutina = rutinaObj?.tropas?.[0]?.id || "";

  useEffect(() => {
    if (tropaDeRutina && !tropaSel) setTropaSel(tropaDeRutina);
  }, [tropaDeRutina, tropaSel]);

  const confirmar = async () => {
    const tId = tropaSel || tropaDeRutina || tropas[0]?.id;
    if (!tId) return;
    setGuardando(true);
    try {
      const origen = ruta[0] || tropas.find((t) => t.id === tId)?.lote?.nombre || null;
      const destino = mLote || ruta[ruta.length - 1] || null;
      await fetch("/api/movimientos-tropa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tropaId: tId,
          fecha: `${mFecha}T${mHora || "08:00"}:00`,
          horario: mHora,
          origenNombre: origen,
          destinoNombre: destino,
          motivo: rutinaObj ? `Rutina: ${rutinaObj.nombre}` : "Movimiento planificado",
          estado: "Planificado",
          responsable: mResp || null,
          notas: [mNotas, mFreq !== "Una vez" ? `Frecuencia: ${mFreq === "Cada X días" ? `cada ${mFreqDias} días` : mFreq}` : null].filter(Boolean).join(" · ") || null,
          rutinaId: rutinaSel,
        }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  const previewTxt = () => {
    const fd = new Date(mFecha + "T00:00:00");
    const dNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const mN = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const dLabel = `${dNames[fd.getDay()]} ${fd.getDate()} ${mN[fd.getMonth()]}`;
    const t = tropas.find((x) => x.id === (tropaSel || tropaDeRutina));
    return `${dLabel}  ·  ${mHora}  ·  ${t?.nombre || "—"}${rutinaObj ? ` · ${rutinaObj.nombre}` : ""}\n${ruta.length > 0 ? ruta.join(" → ") : `→ ${mLote || "—"}`}  ·  ${mResp || "sin responsable"}`;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--mc-surface)", borderRadius: 20, width: "min(600px,92vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--mc-ink)", letterSpacing: "-.01em" }}>Planificar Movimiento</div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            {[{ n: 1, l: "Elegir Rutina" }, { n: 2, l: "Frecuencia" }, { n: 3, l: "Configurar" }].map((s, i, arr) => {
              const done = paso > s.n, active = paso === s.n;
              return (
                <React.Fragment key={s.n}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 21, height: 21, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: done || active ? "#16a34a" : "#e2e8f0", color: done || active ? "white" : "#94a3b8" }}>{done ? <Icon name="check" size={12} /> : s.n}</div>
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "var(--mc-ink)" : done ? "#16a34a" : "#94a3b8" }}>{s.l}</span>
                  </div>
                  {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {paso === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em" }}>Seleccioná una rutina</div>
              {rutinasActivas.length === 0 && (
                <div className="mc-empty" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12.5 }}>No hay rutinas activas — creá una desde la pestaña «Rutinas», o continuá sin rutina.</div>
                </div>
              )}
              {rutinasActivas.map((r) => {
                const sel = rutinaSel === r.id;
                const rr = rutaDeRutina(r);
                return (
                  <div key={r.id} onClick={() => setRutinaSel(sel ? null : r.id)} style={{ padding: "13px 15px", borderRadius: 12, cursor: "pointer", border: sel ? "2px solid #16a34a" : "1.5px solid var(--mc-line-2)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)", transition: "all .14s", display: "flex", alignItems: "center", gap: 13, position: "relative" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--mc-green-50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                      <Icon name="repeat" size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: sel ? "#16a34a" : "var(--mc-ink)" }}>{r.nombre}</span>
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#dcfce7", color: "#15803d", fontWeight: 600 }}>{r.estado}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>{freqLabel(r)}{r.tropas && r.tropas.length > 0 ? ` · ${r.tropas.map((t) => t.nombre).join(", ")}` : ""}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        {rr.map((l, i, arr) => (
                          <React.Fragment key={i}>
                            <span style={{ padding: "2px 6px", borderRadius: 4, background: sel ? "var(--mc-green-50)" : "var(--mc-surface-3)", border: "1px solid var(--mc-line)", fontSize: 10, fontWeight: 600, color: sel ? "#15803d" : "#64748b" }}>{l}</span>
                            {i < arr.length - 1 && <span style={{ fontSize: 11, color: "#94a3b8" }}>→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    {sel && <div style={{ position: "absolute", top: 10, right: 11, width: 19, height: 19, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={10} style={{ color: "white" }} /></div>}
                  </div>
                );
              })}
              <div className="mc-field" style={{ marginTop: 6 }}>
                <label className="mc-label">Tropa {rutinaSel ? "(de la rutina)" : ""}</label>
                <select className="mc-select" value={tropaSel} onChange={(e) => setTropaSel(e.target.value)}>
                  <option value="">Seleccionar tropa…</option>
                  {tropas.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t._count?.animales ?? 0} cab.)</option>)}
                </select>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {rutinaObj && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "var(--mc-green-50)", border: "1px solid #86efac" }}>
                  <Icon name="repeat" size={16} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{rutinaObj.nombre}</span>
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>¿Con qué frecuencia?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Una vez", "Diaria", "Semanal", "Mensual", "Cada X días"].map((f) => {
                  const sel = mFreq === f;
                  return (
                    <button key={f} onClick={() => setMFreq(f)} style={{ padding: "7px 16px", borderRadius: 999, border: sel ? "2px solid #16a34a" : "1.5px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)", color: sel ? "#16a34a" : "var(--mc-text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all .15s" }}>{f}</button>
                  );
                })}
              </div>
              {mFreq === "Cada X días" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "var(--mc-bg)", border: "1px solid var(--mc-line)", marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Repetir cada</span>
                  <button onClick={() => setMFreqDias((d) => Math.max(1, d - 1))} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ fontSize: 15, fontWeight: 800, minWidth: 28, textAlign: "center", color: "var(--mc-ink)" }}>{mFreqDias}</span>
                  <button onClick={() => setMFreqDias((d) => d + 1)} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>días</span>
                </div>
              )}
            </div>
          )}

          {paso === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {rutinaObj && (
                <div style={{ padding: "11px 15px", borderRadius: 10, background: "var(--mc-green-50)", border: "1px solid #86efac", display: "flex", alignItems: "center", gap: 11 }}>
                  <Icon name="repeat" size={16} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#15803d" }}>{rutinaObj.nombre}</span>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "var(--mc-surface)", border: "1px solid #86efac", color: "#15803d", fontWeight: 600, whiteSpace: "nowrap" }}>{mFreq === "Cada X días" ? "Cada " + mFreqDias + "d" : mFreq}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                      {ruta.map((l, i, arr) => (
                        <React.Fragment key={i}>
                          <span style={{ padding: "2px 6px", borderRadius: 4, background: "var(--mc-surface)", border: "1px solid #86efac", fontSize: 10, fontWeight: 600, color: "#15803d" }}>{l}</span>
                          {i < arr.length - 1 && <span style={{ fontSize: 11, color: "#86efac" }}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5, display: "block" }}>Fecha de ejecución</label>
                    <input type="date" className="mc-input" value={mFecha} onChange={(e) => setMFecha(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5, display: "block" }}>Hora de inicio</label>
                    <input type="time" className="mc-input" value={mHora} onChange={(e) => setMHora(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5, display: "block" }}>Lote destino</label>
                    <select className="mc-select" value={mLote} onChange={(e) => setMLote(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                      <option value="">{ruta.length > 0 ? `Según rutina (${ruta[ruta.length - 1]})` : "Seleccionar…"}</option>
                      {lotes.map((l) => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5, display: "block" }}>Responsable</label>
                    <input className="mc-input" value={mResp} onChange={(e) => setMResp(e.target.value)} placeholder="Nombre…" style={{ width: "100%", boxSizing: "border-box" }} />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5, display: "block" }}>Notas</label>
                <textarea className="mc-textarea" value={mNotas} onChange={(e) => setMNotas(e.target.value)} placeholder="Observaciones del movimiento..." rows={2} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ padding: "11px 15px", borderRadius: 10, background: "var(--mc-bg)", border: "1px solid var(--mc-line)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Vista previa</div>
                <div style={{ fontSize: 12, color: "var(--mc-ink)", lineHeight: 1.8, whiteSpace: "pre-line", fontWeight: 500 }}>{previewTxt()}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "13px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => (paso === 1 ? onClose() : setPaso((p) => p - 1))}>
            {paso === 1 ? "Cancelar" : "← Anterior"}
          </button>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>Paso {paso} de 3</span>
          <button
            className="mc-btn mc-btn--primary mc-btn--sm"
            disabled={guardando || (paso === 3 && !tropaSel && !tropaDeRutina && tropas.length === 0)}
            onClick={() => {
              if (paso < 3) setPaso((p) => p + 1);
              else confirmar();
            }}
          >
            {paso < 3 ? "Siguiente →" : guardando ? "Guardando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ ROUTE BUILDER (constructor de ruta) ============ */

export function RouteBuilder({
  nodes,
  setNodes,
  lugares,
  readOnly,
}: {
  nodes: { lugar: string }[];
  setNodes: (n: { lugar: string }[]) => void;
  lugares: string[];
  readOnly?: boolean;
}) {
  const set = (i: number, lugar: string) => setNodes(nodes.map((n, j) => (j === i ? { lugar } : n)));
  const add = () => setNodes([...nodes, { lugar: "" }]);
  const remove = (i: number) => setNodes(nodes.filter((_, j) => j !== i));

  return (
    <div style={{ background: "var(--mc-bg)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {nodes.map((n, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "#16a34a" : i === nodes.length - 1 ? "#3b82f6" : "var(--mc-surface-3)", color: i === 0 || i === nodes.length - 1 ? "#fff" : "var(--mc-text-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
            <select className="mc-select" value={n.lugar} disabled={readOnly} onChange={(e) => set(i, e.target.value)} style={{ flex: 1 }}>
              <option value="">{i === 0 ? "Origen…" : i === nodes.length - 1 ? "Destino…" : `Paso ${i + 1}…`}</option>
              {lugares.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            {!readOnly && nodes.length > 2 && (
              <button onClick={() => remove(i)} className="mc-icon-btn" style={{ width: 28, height: 28, color: "var(--mc-red)" }}><Icon name="x" size={12} /></button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <button onClick={add} className="mc-btn mc-btn--ghost mc-btn--sm" style={{ marginTop: 10 }}><Icon name="plus" size={12} />Agregar paso</button>
      )}
    </div>
  );
}

/* ============ NUEVA / EDITAR RUTINA (4 pasos) ============ */

const TIPOS_RUTINA = [
  { id: "rotacion", icon: "repeat", name: "Rotación de Pasturas", desc: "Movimiento entre potreros" },
  { id: "sanidad", icon: "shield", name: "Control Sanitario", desc: "Vacunas y chequeos" },
  { id: "descanso", icon: "building", name: "Descanso en Corral", desc: "Períodos de reposo" },
  { id: "fija", icon: "map-pin", name: "Fija / Siempre", desc: "Se repite indefinidamente o en un rango de fechas" },
];

export function ModalNuevaRutina({
  rutina,
  lotes,
  tropas,
  onClose,
  onGuardado,
  initialPaso = 1,
}: {
  rutina?: RutinaAPI | null;
  lotes: LoteGeoAPI[];
  tropas: TropaAPI[];
  onClose: () => void;
  onGuardado?: () => void;
  initialPaso?: number;
}) {
  const cfgInicial: RutinaConfig = rutina ? parseRutinaConfig(rutina) : {};
  const [paso, setPaso] = useState(initialPaso);
  const [nombre, setNombre] = useState(rutina?.nombre || "");
  const [tipo, setTipo] = useState<string | null>(rutina?.tipo || null);
  const [freq, setFreq] = useState<string | null>(cfgInicial.freq || null);
  const [freqDias, setFreqDias] = useState(cfgInicial.freqDias || 21);
  const [fijaModo, setFijaModo] = useState<"siempre" | "rango">(cfgInicial.modo || "siempre");
  const [fijaDesde, setFijaDesde] = useState(cfgInicial.desde || "");
  const [fijaHasta, setFijaHasta] = useState(cfgInicial.hasta || "");
  const [tropaIds, setTropaIds] = useState<string[]>(rutina?.tropas?.map((t) => t.id) || []);
  const [nodes, setNodes] = useState<{ lugar: string }[]>(
    cfgInicial.secuencia && cfgInicial.secuencia.length > 0
      ? cfgInicial.secuencia.map((s) => ({ lugar: s.lugar }))
      : [{ lugar: "" }, { lugar: "" }]
  );
  const [horarios, setHorarios] = useState<{ inicio: string; fin: string }[]>(
    Array(9).fill(null).map((_, i) => ({
      inicio: cfgInicial.secuencia?.[i]?.inicio || "",
      fin: cfgInicial.secuencia?.[i]?.fin || "",
    }))
  );
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lugares = lotes.map((l) => l.nombre);
  const FREQS = ["Una vez", "Diaria", "Cada X días", "Semanal", "Mensual"];
  const subs = ["¿Qué tipo de rutina necesitás?", "Definí la ruta de movimiento", "Frecuencia y horarios", "Revisá y confirmá"];
  const tipoNombre = (id: string | null) => TIPOS_RUTINA.find((t) => t.id === id)?.name || "—";
  const activeNodes = nodes.filter((n) => n.lugar);

  const guardar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      const config: RutinaConfig = {
        secuencia: activeNodes.map((n, i) => ({ lugar: n.lugar, inicio: horarios[i]?.inicio || undefined, fin: horarios[i]?.fin || undefined })),
        freq: freq || undefined,
        freqDias: freq === "Cada X días" ? freqDias : undefined,
        modo: tipo === "fija" ? fijaModo : undefined,
        desde: tipo === "fija" && fijaModo === "rango" ? fijaDesde : undefined,
        hasta: tipo === "fija" && fijaModo === "rango" ? fijaHasta : undefined,
      };
      const body = { nombre: nombre.trim(), tipo: tipo || "rotacion", config, tropaIds };
      if (rutina) {
        await fetch(`/api/rutinas-tropa/${rutina.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch("/api/rutinas-tropa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(680px,97vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "94vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Ganadería · Mov. de Tropas · Rutinas</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--mc-ink)", letterSpacing: "-.02em" }}>{rutina ? "Editar Rutina" : "Nueva Rutina"}</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 3 }}>{subs[paso - 1]}</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={13} /></button>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {[1, 2, 3, 4].map((n, i) => {
              const done = paso > n, active = paso === n;
              return (
                <React.Fragment key={n}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, background: done || active ? "#16a34a" : "#e2e8f0", color: done || active ? "white" : "#94a3b8", border: active ? "3px solid #bbf7d0" : "none" }}>
                    {done ? <Icon name="check" size={12} /> : n}
                  </div>
                  {i < 3 && <div style={{ flex: 1, height: 2, background: paso > n ? "#16a34a" : "#e2e8f0", margin: "0 8px" }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {paso === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div className="mc-field">
                <label className="mc-label">Nombre de la rutina</label>
                <input className="mc-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Rotación Tambo Norte" style={{ fontSize: 15 }} />
              </div>
              <div>
                <label className="mc-label" style={{ display: "block", marginBottom: 12 }}>Tipo de rutina</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {TIPOS_RUTINA.map((t) => {
                    const sel = tipo === t.id;
                    const pal: Record<string, { bg: string; bdr: string; ibg: string; ic: string }> = {
                      rotacion: { bg: "#f0fdf4", bdr: "#16a34a", ibg: "#dcfce7", ic: "#15803d" },
                      sanidad: { bg: "#eff6ff", bdr: "#3b82f6", ibg: "#dbeafe", ic: "#1d4ed8" },
                      descanso: { bg: "#faf5ff", bdr: "#a855f7", ibg: "#ede9fe", ic: "#7c3aed" },
                      fija: { bg: "#fff7ed", bdr: "#f97316", ibg: "#ffedd5", ic: "#c2410c" },
                    };
                    const p = pal[t.id] || pal.rotacion;
                    return (
                      <div key={t.id} onClick={() => setTipo(t.id)} style={{ border: sel ? `2px solid ${p.bdr}` : "1.5px solid var(--mc-line)", background: sel ? p.bg : "var(--mc-surface)", borderRadius: 14, padding: "16px 14px", cursor: "pointer", position: "relative", transition: "all .18s", boxShadow: sel ? `0 4px 16px ${p.bdr}25` : "none" }}>
                        {sel && <div style={{ position: "absolute", top: 10, right: 10, width: 19, height: 19, borderRadius: "50%", background: p.bdr, color: "white", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}><Icon name="check" size={11} /></div>}
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: sel ? p.ibg : "var(--mc-surface-3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, transition: "background .18s" }}>
                          <Icon name={t.icon} size={22} style={{ color: sel ? p.ic : "var(--mc-text-2)" }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: sel ? p.ic : "var(--mc-ink)", marginBottom: 3 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: "var(--mc-text-3)", lineHeight: 1.4 }}>{t.desc}</div>
                        {sel && t.id === "fija" && (
                          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 10 }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: fijaModo === "rango" ? 8 : 0 }}>
                              <button type="button" onClick={() => setFijaModo("siempre")} style={{ padding: "6px 12px", borderRadius: 8, border: fijaModo === "siempre" ? "2px solid #16a34a" : "1px solid #e2e8f0", background: fijaModo === "siempre" ? "#f0fdf4" : "white", color: fijaModo === "siempre" ? "#16a34a" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Siempre</button>
                              <button type="button" onClick={() => setFijaModo("rango")} style={{ padding: "6px 12px", borderRadius: 8, border: fijaModo === "rango" ? "2px solid #16a34a" : "1px solid #e2e8f0", background: fijaModo === "rango" ? "#f0fdf4" : "white", color: fijaModo === "rango" ? "#16a34a" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Rango personalizado</button>
                            </div>
                            {fijaModo === "rango" && (
                              <div style={{ display: "flex", gap: 8 }}>
                                <input type="date" value={fijaDesde} onChange={(e) => setFijaDesde(e.target.value)} className="mc-input" style={{ flex: 1, fontSize: 12 }} />
                                <input type="date" value={fijaHasta} onChange={(e) => setFijaHasta(e.target.value)} className="mc-input" style={{ flex: 1, fontSize: 12 }} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mc-field">
                <label className="mc-label">Tropas asignadas (opcional)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {tropas.map((t) => {
                    const sel = tropaIds.includes(t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => setTropaIds((p) => (sel ? p.filter((x) => x !== t.id) : [...p, t.id]))} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: sel ? "1.5px solid var(--mc-green-500)" : "1px solid var(--mc-line-2)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)", color: sel ? "var(--mc-green-700)" : "var(--mc-text-2)" }}>{t.nombre}</button>
                    );
                  })}
                  {tropas.length === 0 && <span style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin tropas creadas todavía.</span>}
                </div>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div>
              <label className="mc-label" style={{ display: "block", marginBottom: 10 }}>Constructor de ruta</label>
              <RouteBuilder nodes={nodes} setNodes={setNodes} lugares={lugares} />
              {lugares.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 8 }}>No hay lotes con nombre — crealos en Campo Digital.</div>}
            </div>
          )}

          {paso === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label className="mc-label" style={{ display: "block", marginBottom: 10 }}>Frecuencia</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {FREQS.map((f) => {
                    const sel = freq === f;
                    return (
                      <button key={f} onClick={() => setFreq(f)} style={{ padding: "7px 16px", borderRadius: 999, border: sel ? "2px solid #16a34a" : "1.5px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)", color: sel ? "#16a34a" : "var(--mc-text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{f}</button>
                    );
                  })}
                </div>
                {freq === "Cada X días" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "var(--mc-bg)", border: "1px solid var(--mc-line)", marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Repetir cada</span>
                    <button onClick={() => setFreqDias((d) => Math.max(1, d - 1))} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", fontWeight: 800 }}>−</button>
                    <span style={{ fontSize: 15, fontWeight: 800, minWidth: 28, textAlign: "center", color: "var(--mc-ink)" }}>{freqDias}</span>
                    <button onClick={() => setFreqDias((d) => d + 1)} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--mc-line)", background: "var(--mc-surface)", cursor: "pointer", fontWeight: 800 }}>+</button>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>días</span>
                  </div>
                )}
              </div>
              <div>
                <label className="mc-label" style={{ display: "block", marginBottom: 10 }}>Horario por paso</label>
                <div style={{ background: "var(--mc-bg)", borderRadius: 12, padding: 20, overflowX: "auto" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", minWidth: "fit-content" }}>
                    {activeNodes.map((nd, i, arr) => (
                      <React.Fragment key={i}>
                        <div style={{ background: "var(--mc-surface)", border: "1.5px solid var(--mc-line)", borderRadius: 10, padding: "12px 14px", minWidth: 158 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                            {i === 0 ? "Origen" : i === arr.length - 1 ? "Destino" : `Paso ${i + 1}`}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 9 }}>{nd.lugar}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {(["inicio", "fin"] as const).map((campo) => (
                              <div key={campo}>
                                <div style={{ fontSize: 10, color: "var(--mc-text-3)", marginBottom: 3 }}>{campo === "inicio" ? "Entrada" : "Salida"}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid var(--mc-line)", borderRadius: 7, padding: "4px 8px" }}>
                                  <Icon name="clock" size={10} style={{ color: "var(--mc-text-3)" }} />
                                  <input type="time" value={horarios[i]?.[campo] || ""} onChange={(e) => setHorarios((h) => h.map((x, j) => (j === i ? { ...x, [campo]: e.target.value } : x)))} style={{ border: "none", outline: "none", fontSize: 12, flex: 1, fontFamily: "inherit", background: "transparent" }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {i < arr.length - 1 && (
                          <div style={{ display: "flex", alignItems: "center", padding: "0 8px", paddingTop: 54 }}>
                            <span style={{ fontSize: 18, color: "var(--mc-text-3)", lineHeight: 1 }}>→</span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                    {activeNodes.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Definí la ruta en el paso anterior.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {paso === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px #16a34a44" }}>
                  <Icon name="check" size={22} style={{ color: "white" }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#15803d", letterSpacing: "-.01em" }}>¡Rutina lista para {rutina ? "guardar" : "activar"}!</div>
                  <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>Revisá los datos y confirmá</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Resumen</div>
                <div style={{ border: "1px solid var(--mc-line)", borderRadius: 12, overflow: "hidden" }}>
                  {[
                    { icon: "tag", label: "Nombre", value: nombre || "—" },
                    { icon: "grid", label: "Tipo", value: tipoNombre(tipo) },
                    { icon: "map-pin", label: "Ruta", value: activeNodes.map((n) => n.lugar).join(" → ") || "—" },
                    { icon: "repeat", label: "Frecuencia", value: freq === "Cada X días" ? `Cada ${freqDias} días` : freq || "Sin definir" },
                    { icon: "clock", label: "Horarios", value: activeNodes.map((n, i) => { const h = horarios[i]; return n.lugar + (h?.inicio ? ` ${h.inicio}${h.fin ? "–" + h.fin : ""}` : " —"); }).join(" | ") || "Sin definir" },
                    { icon: "cow", label: "Tropas", value: tropas.filter((t) => tropaIds.includes(t.id)).map((t) => t.nombre).join(", ") || "Sin asignar" },
                  ].map(({ icon, label, value }, i, arr) => (
                    <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: i % 2 === 0 ? "var(--mc-surface)" : "var(--mc-surface-2)", borderBottom: i < arr.length - 1 ? "1px solid var(--mc-line)" : "none" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mc-green-50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <Icon name={icon} size={13} style={{ color: "#16a34a" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mc-ink)", lineHeight: 1.4 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button onClick={() => paso > 1 && setPaso(paso - 1)} disabled={paso === 1} className="mc-btn mc-btn--secondary" style={{ opacity: paso === 1 ? 0.4 : 1 }}>← Anterior</button>
          <span style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Paso {paso} de 4</span>
          <button
            onClick={() => (paso < 4 ? setPaso(paso + 1) : guardar())}
            disabled={guardando || (paso === 1 && !nombre.trim())}
            className="mc-btn mc-btn--primary"
          >
            {paso === 4 ? (guardando ? "Guardando…" : rutina ? "Guardar Cambios" : "Crear Rutina") : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ VER RUTINA (drawer) ============ */

export function DrawerVerRutina({
  rutina,
  movimientos,
  onClose,
  onEdit,
}: {
  rutina: RutinaAPI;
  movimientos: MovTropaAPI[];
  onClose: () => void;
  onEdit: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cfg = parseRutinaConfig(rutina);
  const ruta = rutaDeRutina(rutina);
  const hist = movimientos.filter((m) => m.rutinaId === rutina.id).slice(0, 8);

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(520px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--mc-line)", background: "linear-gradient(135deg,var(--mc-green-50),var(--mc-surface))" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Rutina · {rutina.tipo}</div>
              <div className="mc-modal__title" style={{ fontSize: 20 }}>{rutina.nombre}</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-2)", marginTop: 3 }}>{freqLabel(rutina)} · {rutina.estado}</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Ruta</div>
            <div style={{ background: "var(--mc-surface-2)", borderRadius: 10, padding: "12px 14px" }}>
              {(cfg.secuencia || []).map((s, j, arr) => (
                <React.Fragment key={j}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#15803d", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)", flex: 1 }}>{s.lugar}</span>
                    {s.inicio && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-text-3)", fontFamily: "var(--ff-mono)", flexShrink: 0 }}>{s.inicio}{s.fin ? `–${s.fin}` : ""}</span>}
                  </div>
                  {j < arr.length - 1 && (
                    <div style={{ display: "flex", alignItems: "stretch", padding: "3px 0 3px 3px" }}>
                      <div style={{ width: 1, background: "var(--mc-line)", margin: "0 3px", minHeight: 10 }} />
                      <span style={{ fontSize: 9, color: "var(--mc-text-3)", paddingLeft: 6, lineHeight: "14px" }}>↓ traslado</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
              {ruta.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin ruta definida.</div>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Tropas asignadas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(rutina.tropas || []).map((t) => (
                <span key={t.id} className="mc-badge mc-badge--green">{t.nombre}</span>
              ))}
              {(rutina.tropas || []).length === 0 && <span style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Ninguna tropa asignada.</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Historial de ejecuciones</div>
            {hist.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Todavía no se ejecutó esta rutina.</div>
            ) : (
              <div className="col gap-6">
                {hist.map((m) => (
                  <div key={m.id} className="row" style={{ justifyContent: "space-between", padding: "8px 10px", borderRadius: 9, border: "1px solid var(--mc-line)", background: "var(--mc-surface)" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>{fmtFechaLarga(m.fecha)}</div>
                      <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{m.origenNombre || "—"} → {m.destinoNombre || "—"}{m.responsable ? ` · ${m.responsable}` : ""}</div>
                    </div>
                    <span className={`mc-badge ${m.estado === "Ejecutado" ? "mc-badge--green" : m.estado === "Cancelado" ? "mc-badge--neutral" : "mc-badge--amber"}`}>{m.estado}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mc-modal__foot" style={{ justifyContent: "space-between" }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary">Cerrar</button>
          <button onClick={onEdit} className="mc-btn mc-btn--primary"><Icon name="edit" size={13} /> Editar Rutina</button>
        </div>
      </div>
    </div>
  );
}

/* ============ ASIGNAR RUTINA A TROPA ============ */

export function ModalAsignarRutina({
  tropa,
  rutinas,
  onClose,
  onGuardado,
}: {
  tropa: TropaAPI;
  rutinas: RutinaAPI[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [rutinaId, setRutinaId] = useState(tropa.rutinaId || "");
  const [guardando, setGuardando] = useState(false);

  const confirmar = async () => {
    setGuardando(true);
    try {
      await fetch(`/api/tropas/${tropa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rutinaId: rutinaId || null }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(460px,95vw)", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--mc-line)" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="mc-modal__title" style={{ fontSize: 19 }}>Asignar Rutina</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-2)", marginTop: 2 }}>Tropa: {tropa.nombre}</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 8, maxHeight: "60vh", overflowY: "auto" }}>
          <div onClick={() => setRutinaId("")} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: rutinaId === "" ? "2px solid var(--mc-line-2)" : "1px solid var(--mc-line)", background: "var(--mc-surface)", fontSize: 12.5, color: "var(--mc-text-2)", fontWeight: 600 }}>Sin rutina</div>
          {rutinas.map((r) => {
            const sel = rutinaId === r.id;
            return (
              <div key={r.id} onClick={() => setRutinaId(r.id)} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: sel ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)", display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="repeat" size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{r.nombre}</div>
                  <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{freqLabel(r)} · {rutaDeRutina(r).join(" → ") || "sin ruta"}</div>
                </div>
                {sel && <Icon name="check" size={14} style={{ color: "var(--mc-green-600)" }} />}
              </div>
            );
          })}
          {rutinas.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>No hay rutinas creadas — usá la pestaña «Rutinas».</div>}
        </div>
        <div className="mc-modal__foot">
          <button onClick={onClose} className="mc-btn mc-btn--secondary">Cancelar</button>
          <button onClick={confirmar} disabled={guardando} className="mc-btn mc-btn--primary"><Icon name="check" size={13} />{guardando ? "Guardando…" : "Asignar"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============ MOVER TROPA (rápido) ============ */

export function ModalMoverTropa({
  tropa,
  lotes,
  onClose,
  onGuardado,
}: {
  tropa: TropaAPI;
  lotes: LoteGeoAPI[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [destino, setDestino] = useState("");
  const [guardando, setGuardando] = useState(false);

  const confirmar = async () => {
    if (!destino) return;
    setGuardando(true);
    try {
      const now = new Date();
      await fetch("/api/movimientos-tropa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tropaId: tropa.id,
          fecha: now.toISOString(),
          horario: now.toTimeString().slice(0, 5),
          origenNombre: tropa.lote?.nombre || null,
          destinoNombre: destino,
          motivo: "Movimiento manual",
          estado: "Ejecutado",
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
      <div className="mc-modal" style={{ width: "min(420px,95vw)", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--mc-line)" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="mc-modal__title" style={{ fontSize: 19 }}>Mover Tropa</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-2)", marginTop: 2 }}>{tropa.nombre} · hoy, ahora</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="row gap-8" style={{ fontSize: 13, color: "var(--mc-text-2)" }}>
            <span>De: <strong style={{ color: "var(--mc-ink)" }}>{tropa.lote?.nombre || "Sin lote"}</strong></span>
            <Icon name="arrow-right" size={13} />
            <span>A: <strong style={{ color: "var(--mc-green-700)" }}>{destino || "—"}</strong></span>
          </div>
          <div className="mc-field">
            <label className="mc-label">Lote destino</label>
            <select className="mc-select" value={destino} onChange={(e) => setDestino(e.target.value)}>
              <option value="">Seleccionar…</option>
              {lotes.filter((l) => l.nombre !== tropa.lote?.nombre).map((l) => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="mc-modal__foot">
          <button onClick={onClose} className="mc-btn mc-btn--secondary">Cancelar</button>
          <button onClick={confirmar} disabled={!destino || guardando} className="mc-btn mc-btn--primary"><Icon name="move-right" size={13} />{guardando ? "Moviendo…" : "Mover Ahora"}</button>
        </div>
      </div>
    </div>
  );
}
