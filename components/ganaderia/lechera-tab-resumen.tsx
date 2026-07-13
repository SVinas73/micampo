"use client";

// Pestaña Resumen de Producción Lechera: KPIs del día, gráfico de producción,
// alertas de caída brusca, turnos de hoy y ración del tambo. Datos reales.

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, useToast } from "@/components/mc";
import {
  RegLecheroAPI,
  TurnoDef,
  VacaLechera,
  WoodParams,
  estadoTurno,
  fechaStrDe,
  hoyStr,
  nfLt,
  turnosIniciados,
} from "./lechera-tipos";
import { PLBarChart, PLKpiCard, PLVacaDrawer } from "./lechera-ui";
import { PLModalBoleta, PLModalOrdene } from "./lechera-modales";

type RacionAPI = {
  id: string;
  nombre: string;
  animalObjetivo?: string | null;
  etapaProductiva?: string | null;
  consumoDiario?: number | null;
  costoTotal?: number | null;
  updatedAt?: string;
};

export function PLResumen({
  vacas,
  registros,
  turnos,
  esperada,
  onRefresh,
  onGoToOrdene,
}: {
  vacas: VacaLechera[];
  registros: RegLecheroAPI[];
  turnos: TurnoDef[];
  esperada: WoodParams;
  onRefresh: () => void;
  onGoToOrdene?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [drawerVaca, setDrawerVaca] = useState<VacaLechera | null>(null);
  const [modalOrdene, setModalOrdene] = useState(false);
  const [modalBoleta, setModalBoleta] = useState(false);
  const [period, setPeriod] = useState("Día");
  const [raciones, setRaciones] = useState<RacionAPI[]>([]);

  useEffect(() => {
    fetch("/api/raciones")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRaciones(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Ración del tambo: preferimos una de lactancia / vaca lechera, si no la más reciente
  const racionTambo = useMemo(() => {
    const lechera = raciones.find(
      (r) => /lact/i.test(r.etapaProductiva || "") || /leche|tambo|vaca/i.test(r.animalObjetivo || "")
    );
    return lechera || raciones[0] || null;
  }, [raciones]);

  const hoy = hoyStr();
  const ayer = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const registrosHoy = useMemo(() => registros.filter((r) => fechaStrDe(r.fecha) === hoy), [registros, hoy]);
  const litrosHoy = registrosHoy.reduce((s, r) => s + r.litros, 0);
  const litrosAyer = registros.filter((r) => fechaStrDe(r.fecha) === ayer).reduce((s, r) => s + r.litros, 0);
  const vsAyer = litrosAyer > 0 ? Math.round(((litrosHoy - litrosAyer) / litrosAyer) * 100) : null;

  const enOrdenne = vacas.filter((v) => v.enOrdenne);
  const promPorVaca = enOrdenne.length
    ? enOrdenne.reduce((s, v) => s + (v.prom7 || 0), 0) / enOrdenne.filter((v) => v.prom7 !== null).length || 0
    : 0;
  const ordenadasHoy = new Set(registrosHoy.map((r) => r.animalId)).size;
  const eficiencia = enOrdenne.length > 0 ? Math.round((ordenadasHoy / enOrdenne.length) * 100) : null;

  // Alertas: vacas con caída brusca (último día < 75% de su promedio 7d)
  const alertas = useMemo(
    () =>
      enOrdenne
        .filter((v) => v.hoy !== null && v.prom7 !== null && v.prom7 > 0 && v.hoy < v.prom7 * 0.75)
        .sort((a, b) => (a.hoy! / a.prom7!) - (b.hoy! / b.prom7!)),
    [enOrdenne]
  );

  const iniciados = useMemo(() => turnosIniciados(), []);
  const fechaLarga = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase());

  const exportarCSV = () => {
    const filas = [
      ["Fecha", "Caravana", "Litros", "Turno", "Observaciones"],
      ...registros.slice(0, 2000).map((r) => [fechaStrDe(r.fecha), r.animal?.caravana || "", String(r.litros), r.turno || "", r.observaciones || ""]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `produccion-lechera-${hoy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {toast.node}
      {drawerVaca && <PLVacaDrawer vaca={drawerVaca} esperada={esperada} onClose={() => setDrawerVaca(null)} />}
      {modalOrdene && (
        <PLModalOrdene
          vacas={vacas}
          turnos={turnos}
          registrosHoy={registrosHoy}
          onClose={() => setModalOrdene(false)}
          onGuardado={() => { toast.show("Ordeñe registrado"); onRefresh(); }}
        />
      )}
      {modalBoleta && (
        <PLModalBoleta litrosOrdenadosHoy={litrosHoy} onClose={() => setModalBoleta(false)} onGuardado={() => { toast.show("Boleta guardada"); onRefresh(); }} />
      )}

      {/* KPIs */}
      <div className="grid g-cols-5" style={{ gap: 10 }}>
        <PLKpiCard title="Producción Hoy" ico="droplets" val={`${nfLt.format(Math.round(litrosHoy))} lt`} sub={vsAyer !== null ? `${vsAyer >= 0 ? "+" : ""}${vsAyer}% vs ayer` : "sin registros de ayer"} />
        <PLKpiCard title="Promedio por Vaca" ico="chart" val={promPorVaca > 0 ? `${(Math.round(promPorVaca * 10) / 10).toLocaleString("es-AR")} lt` : "—"} sub="últimos 7 días · rodeo en ordeñe" />
        <PLKpiCard title="Vacas en Ordeñe" ico="users" val={String(enOrdenne.length)} sub={`de ${vacas.length} vacas en rodeo lechero`} />
        <PLKpiCard title="Eficiencia" ico="check-circle" val={eficiencia !== null ? `${eficiencia}%` : "—"} sub="vacas ordeñadas hoy vs habilitadas" color={eficiencia !== null && eficiencia >= 90 ? "#00A738" : undefined} />
        <PLKpiCard title="Alertas del Día" ico="alert-triangle" val={String(alertas.length)} sub={alertas.length ? "vacas con caída brusca" : "sin caídas bruscas"} color={alertas.length > 0 ? "#c93434" : undefined} />
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={exportarCSV} disabled={registros.length === 0}><Icon name="download" size={13} />Exportar</button>
        <button
          onClick={() => setModalBoleta(true)}
          style={{ padding: "8px 16px", border: "none", borderRadius: 10, background: "#FF9D00", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, transition: "background .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e68a00")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FF9D00")}
        >
          <Icon name="truck" size={14} style={{ color: "white" }} />Cargar Boleta de Camión
        </button>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalOrdene(true)}><Icon name="plus" size={14} />Registrar Ordeñe</button>
      </div>

      {/* Chart */}
      <PLBarChart registros={registros} period={period} setPeriod={setPeriod} />

      {/* 50/50 */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        {/* Alertas */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="alert-triangle" size={15} style={{ color: alertas.length ? "#c93434" : "var(--mc-text-3)" }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>Alertas del Día</span>
              {alertas.length > 0 && <span style={{ padding: "1px 8px", borderRadius: 999, background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 800 }}>{alertas.length}</span>}
            </div>
          </div>
          <div style={{ padding: "8px 0" }}>
            {alertas.length === 0 && (
              <div className="mc-empty" style={{ padding: "28px 0" }}>
                <div className="mc-empty__icon" style={{ background: "var(--mc-green-50)", color: "var(--mc-green-600)" }}><Icon name="check-circle" size={20} /></div>
                Sin caídas bruscas de producción hoy
              </div>
            )}
            {alertas.slice(0, 4).map((v, i) => {
              const pct = v.prom7 && v.prom7 > 0 ? Math.round(((v.hoy || 0) / v.prom7) * 100) : 0;
              const desvio = `${pct - 100}%`;
              const isActive = drawerVaca?.dbId === v.dbId;
              return (
                <div
                  key={v.dbId}
                  style={{ padding: "12px 18px", background: isActive ? "#f0fdf4" : "transparent", borderLeft: isActive ? "3px solid #16a34a" : "3px solid transparent", transition: "background .1s", borderBottom: i < Math.min(alertas.length, 4) - 1 ? "1px solid var(--mc-line)" : "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#991b1b", flexShrink: 0 }}>
                        #{v.caravana.slice(-2)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>Vaca #{v.caravana}</div>
                        <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>({v.lote})</div>
                      </div>
                    </div>
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "#fee2e2", color: "#991b1b", flexShrink: 0 }}>Caída Brusca</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--mc-text-3)", marginBottom: 3 }}>
                      <span>Promedio 7d: {v.prom7} lt</span>
                      <span style={{ color: "#c93434", fontWeight: 700 }}>Último: {Math.round(v.hoy || 0)} lt ({desvio})</span>
                    </div>
                    <div style={{ height: 6, background: "var(--mc-surface-3)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: "#c93434", borderRadius: 999 }} />
                    </div>
                  </div>
                  <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => setDrawerVaca(isActive ? null : v)}>Ver ficha →</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Turnos + Ración */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--mc-line)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mc-ink)" }}>Turnos de Hoy</div>
              <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 1 }}>{fechaLarga}</div>
            </div>
            <div style={{ padding: "8px 0" }}>
              {turnos.map((t, i) => {
                const st = estadoTurno(t, registrosHoy, iniciados);
                const badge = st.estado === "Completado" ? { bg: "#dcfce7", c: "#166534" } : st.estado === "En Curso" ? { bg: "#fef3c7", c: "#92400e" } : { bg: "var(--mc-surface-3)", c: "var(--mc-text-2)" };
                return (
                  <div key={t.nombre} style={{ padding: "14px 18px", borderBottom: i < turnos.length - 1 ? "1px solid var(--mc-line)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 6, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>{t.nombre}</div>
                        <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 1 }}>{t.hora} hs</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.c, animation: st.estado === "En Curso" ? "pulse-val 2s infinite" : undefined }}>{st.estado}</span>
                        {st.litros > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>{nfLt.format(Math.round(st.litros))} lt</span>}
                      </div>
                    </div>
                    {st.vacas > 0 && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--mc-surface-3)", border: "1px solid var(--mc-line)", color: "var(--mc-text-2)" }}>{st.vacas} vacas</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {onGoToOrdene && (
              <div style={{ padding: "10px 18px", borderTop: "1px solid var(--mc-line)", textAlign: "center" }}>
                <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ fontSize: 12, color: "var(--mc-text-2)" }} onClick={onGoToOrdene}>Ir a Ordeñe →</button>
              </div>
            )}
          </div>

          {/* Ración del Tambo */}
          <div className="mc-card" style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8a938d", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Ración del Tambo</div>
            {racionTambo ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--mc-ink)" }}>{racionTambo.nombre}</div>
                <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                  {racionTambo.costoTotal != null && (
                    <div>
                      <div style={{ fontSize: 10, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Costo/cab/día</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-green-700)" }}>${racionTambo.costoTotal.toFixed(2)}</div>
                    </div>
                  )}
                  {racionTambo.consumoDiario != null && (
                    <div>
                      <div style={{ fontSize: 10, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Consumo</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>{racionTambo.consumoDiario} kg MS</div>
                    </div>
                  )}
                </div>
                <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ marginTop: 10, fontSize: 12, color: "var(--mc-text-2)" }} onClick={() => router.push("/nutricion-ganadera")}>Ver en Nutrición →</button>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Todavía no hay una ración formulada para el tambo.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
