"use client";

// Pestaña Ordeñe: gestión de turnos del día (iniciar / finalizar / registrar),
// comparativo hoy vs ayer y última boleta de retiro. Datos reales.

import React, { useMemo, useState } from "react";
import { Icon, useToast } from "@/components/mc";
import {
  BoletaAPI,
  RegLecheroAPI,
  TurnoDef,
  VacaLechera,
  estadoTurno,
  fechaStrDe,
  hoyStr,
  nfLt,
  setTurnosPendientes,
  turnosIniciados,
  turnosPendientes,
} from "./lechera-tipos";
import { PLKpiCard } from "./lechera-ui";
import {
  PLModalAddTurno,
  PLModalBoleta,
  PLModalFinalizarTurno,
  PLModalOrdene,
  PLModalVacaManual,
  PLRetiroCard,
  PLTurnoRow,
} from "./lechera-modales";

export function PLOrdene({
  vacas,
  registros,
  boletas,
  turnos,
  onRefresh,
}: {
  vacas: VacaLechera[];
  registros: RegLecheroAPI[];
  boletas: BoletaAPI[];
  turnos: TurnoDef[];
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [modalOrdene, setModalOrdene] = useState(false);
  const [modalVaca, setModalVaca] = useState(false);
  const [modalBoleta, setModalBoleta] = useState(false);
  const [modalAddTurno, setModalAddTurno] = useState(false);
  const [modalFinalizar, setModalFinalizar] = useState<TurnoDef | null>(null);
  const [tick, setTick] = useState(0); // fuerza recomputar estados locales (localStorage)

  const hoy = hoyStr();
  const ayer = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const registrosHoy = useMemo(() => registros.filter((r) => fechaStrDe(r.fecha) === hoy), [registros, hoy]);
  const registrosAyer = useMemo(() => registros.filter((r) => fechaStrDe(r.fecha) === ayer), [registros, ayer]);
  // Estado local de turnos (localStorage): recomputado cuando cambia `tick`.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const iniciados = useMemo(() => turnosIniciados(), [tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pendientes = useMemo(() => turnosPendientes(), [tick]);

  const estados = turnos.map((t) => estadoTurno(t, registrosHoy, iniciados, pendientes));
  const litrosHoy = registrosHoy.reduce((s, r) => s + r.litros, 0);
  const t1 = estados.find((_, i) => turnos[i].nombre.includes("1er"));
  const t2 = estados.find((_, i) => turnos[i].nombre.includes("2do"));
  const enOrdenne = vacas.filter((v) => v.enOrdenne).length;
  const ordenadasHoy = new Set(registrosHoy.map((r) => r.animalId)).size;
  const saltadas = Math.max(0, enOrdenne - ordenadasHoy);
  const primerLote = vacas.find((v) => v.enOrdenne)?.lote || "";

  // Comparativo por turno (hoy vs ayer)
  const comparativo = turnos.map((t) => {
    const hoyLt = registrosHoy.filter((r) => (r.turno || "") === t.turnoKey).reduce((s, r) => s + r.litros, 0);
    const ayerLt = registrosAyer.filter((r) => (r.turno || "") === t.turnoKey).reduce((s, r) => s + r.litros, 0);
    return { turno: t.nombre, ayer: ayerLt, hoy: hoyLt };
  });
  const maxComp = Math.max(...comparativo.flatMap((c) => [c.ayer, c.hoy]), 1);
  const totalAyer = registrosAyer.reduce((s, r) => s + r.litros, 0);

  const ultimaBoleta = useMemo(() => {
    const retiros = boletas.filter((b) => b.tipo !== "calidad");
    return retiros.length ? retiros[0] : null;
  }, [boletas]);

  const finalizarSinProd = (nombre: string) => {
    const cur = turnosPendientes();
    if (!cur.includes(nombre)) setTurnosPendientes([...cur, nombre]);
    setModalFinalizar(null);
    setTick((t) => t + 1);
    toast.show(`${nombre} cerrado sin producción`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {toast.node}
      {modalOrdene && (
        <PLModalOrdene
          vacas={vacas}
          turnos={turnos}
          registrosHoy={registrosHoy}
          pendientes={pendientes}
          onRemovePendiente={(n) => setTurnosPendientes(turnosPendientes().filter((x) => x !== n))}
          onClose={() => setModalOrdene(false)}
          onGuardado={() => { toast.show("Ordeñe registrado"); setTick((t) => t + 1); onRefresh(); }}
        />
      )}
      {modalVaca && (
        <PLModalVacaManual vacas={vacas} loteDestino={primerLote} onClose={() => setModalVaca(false)} onGuardado={() => { toast.show("Vaca agregada al turno"); onRefresh(); }} />
      )}
      {modalBoleta && <PLModalBoleta litrosOrdenadosHoy={litrosHoy} onClose={() => setModalBoleta(false)} onGuardado={() => { toast.show("Boleta guardada"); onRefresh(); }} />}
      {modalAddTurno && <PLModalAddTurno onClose={() => setModalAddTurno(false)} onGuardado={() => { toast.show("Turno extra agregado"); setTick((t) => t + 1); }} />}
      {modalFinalizar && (
        <PLModalFinalizarTurno
          turno={modalFinalizar}
          vacas={vacas}
          onClose={() => setModalFinalizar(null)}
          onFinalizarSinProd={finalizarSinProd}
          onRegistrar={() => { setModalFinalizar(null); setModalOrdene(true); }}
        />
      )}

      {/* KPIs */}
      <div className="grid g-cols-5" style={{ gap: 10 }}>
        <PLKpiCard title="1er Ordeñe" ico="sun" val={t1 && t1.litros > 0 ? `${nfLt.format(Math.round(t1.litros))} lt` : "—"} sub={`${turnos.find((t) => t.nombre.includes("1er"))?.hora || "06:00"} hs · ${t1?.cerradoSinProd ? "Cerrado" : t1?.estado || "Pendiente"}`} color={t1?.estado === "Completado" && !t1?.cerradoSinProd ? "#00A738" : undefined} />
        <PLKpiCard title="2do Ordeñe" ico="clock" val={t2 && t2.litros > 0 ? `${nfLt.format(Math.round(t2.litros))} lt` : "—"} sub={`${turnos.find((t) => t.nombre.includes("2do"))?.hora || "13:00"} hs · ${t2?.cerradoSinProd ? "Cerrado" : t2?.estado || "Pendiente"}`} color={t2?.estado === "En Curso" ? "#c48410" : undefined} />
        <PLKpiCard title="Total del Día" ico="droplets" val={`${nfLt.format(Math.round(litrosHoy))} lt`} sub="acumulado hasta ahora" />
        <PLKpiCard title="Vacas Ordeñadas" ico="check-circle" val={String(ordenadasHoy)} sub={`de ${enOrdenne} habilitadas hoy`} />
        <PLKpiCard title="Vacas Saltadas" ico="alert-circle" val={String(saltadas)} sub="sin registro en ningún turno" color={saltadas > 0 ? "#c93434" : undefined} />
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setModalBoleta(true)}
          style={{ padding: "8px 16px", border: "none", borderRadius: 10, background: "#FF9D00", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e68a00")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FF9D00")}
        >
          <Icon name="truck" size={14} style={{ color: "white" }} />Cargar Boleta de Camión
        </button>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalOrdene(true)}><Icon name="plus" size={14} />Registrar Ordeñe</button>
      </div>

      {/* Layout 65/35 */}
      <div className="grid" style={{ gridTemplateColumns: "minmax(0,65fr) minmax(280px,35fr)", gap: 14, alignItems: "start" }}>
        {/* Turnos */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--mc-line)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>
              Turnos — {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase())}
            </div>
            <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>
              {turnos.length} turnos configurados · {estados.filter((e) => e.estado === "Completado").length} completado(s) · {estados.filter((e) => e.estado === "En Curso").length} en curso
            </div>
          </div>
          {turnos.map((t) => {
            const st = estadoTurno(t, registrosHoy, iniciados, pendientes);
            return (
              <PLTurnoRow
                key={t.nombre}
                turno={t}
                registrosHoy={registrosHoy}
                pendientes={pendientes}
                defaultOpen={st.estado === "En Curso"}
                onVacaManual={() => setModalVaca(true)}
                onFinalizar={(turno) => setModalFinalizar(turno)}
                onIniciado={() => setTick((x) => x + 1)}
              />
            );
          })}
          <div style={{ padding: "12px 18px", borderTop: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--mc-text-3)" }}>¿Necesitás agregar un turno extra?</span>
            <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => setModalAddTurno(true)}><Icon name="plus" size={12} />Turno</button>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Comparativo */}
          <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>Comparativo</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-text-3)" }}>Hoy vs Ayer</span>
            </div>
            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {comparativo.every((c) => c.ayer === 0 && c.hoy === 0) ? (
                <div style={{ fontSize: 12, color: "var(--mc-text-3)", textAlign: "center", padding: "8px 0" }}>Sin registros para comparar todavía.</div>
              ) : (
                comparativo.map((c, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-text-3)", marginBottom: 5 }}>{c.turno}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: "var(--mc-text-3)", width: 32, flexShrink: 0 }}>Ayer</span>
                        <div style={{ flex: 1, height: 8, background: "var(--mc-line)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: `${(c.ayer / maxComp) * 100}%`, height: "100%", background: "#d9d6cc", borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", minWidth: 56, textAlign: "right" }}>{c.ayer > 0 ? `${nfLt.format(Math.round(c.ayer))} lt` : "—"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: "var(--mc-text-3)", width: 32, flexShrink: 0 }}>Hoy</span>
                        <div style={{ flex: 1, height: 8, background: "var(--mc-line)", borderRadius: 999, overflow: "hidden", border: c.hoy === 0 ? "1.5px dashed #d9d6cc" : undefined }}>
                          {c.hoy > 0 && <div style={{ width: `${(c.hoy / maxComp) * 100}%`, height: "100%", background: "var(--mc-green-600)", borderRadius: 999 }} />}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.hoy > 0 ? "var(--mc-green-600)" : "var(--mc-text-3)", minWidth: 56, textAlign: "right" }}>{c.hoy > 0 ? `${nfLt.format(Math.round(c.hoy))} lt` : "—"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div style={{ borderTop: "1px solid var(--mc-line)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>
                  Total: <strong style={{ color: "var(--mc-ink)" }}>{nfLt.format(Math.round(totalAyer))} lt</strong> → <strong style={{ color: "var(--mc-green-600)" }}>{nfLt.format(Math.round(litrosHoy))} lt</strong>
                </div>
                {estados.some((e) => e.estado !== "Completado") && <span style={{ fontSize: 10, color: "var(--mc-text-3)", fontStyle: "italic" }}>Parcial — faltan turnos</span>}
              </div>
            </div>
          </div>

          {/* Boleta */}
          <PLRetiroCard boleta={ultimaBoleta} litrosHoy={litrosHoy} onCargar={() => setModalBoleta(true)} />
        </div>
      </div>
    </div>
  );
}
