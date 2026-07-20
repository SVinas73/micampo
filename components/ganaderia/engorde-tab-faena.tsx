"use client";

// Pestaña Faena y Venta: corrales listos para faena, programar envío (genera
// DT-e) e historial de faenas (documentos de tránsito de venta). Datos reales.

import React, { useMemo, useState } from "react";
import { KPI, Icon, useToast } from "@/components/mc";
import {
  CorralAPI,
  DTEAPI,
  coma,
  diasAFaena,
  estadoCorral,
  nfEng,
  rendimientoCarcasaReal,
} from "./engorde-tipos";
import { ModalProgramarEnvio } from "./engorde-modales";

export function EngordeFaena({ corrales, documentos, onRefresh }: { corrales: CorralAPI[]; documentos: DTEAPI[]; onRefresh: () => void }) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const activos = useMemo(() => corrales.filter((c) => c.estado !== "Cerrado"), [corrales]);
  const listos = useMemo(() => activos.filter((c) => estadoCorral(c) === "listo" || c.estado === "Listo"), [activos]);
  const listosCab = listos.reduce((s, c) => s + c.cabezas, 0);

  // Historial de faenas = DTE con motivo "Venta"
  const ventas = useMemo(() => documentos.filter((d) => /venta/i.test(d.motivo || "")).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()), [documentos]);

  // Rendimiento carcasa real (de las ventas con peso de carcasa cargado) e
  // ingreso proyectado del próximo envío.
  const rendimiento = useMemo(() => rendimientoCarcasaReal(ventas), [ventas]);
  const proximoCab = listos[0]?.cabezas ?? 0;
  const proximoPeso = listos[0] ? Math.round(listos[0].pesoActual ?? 0) : 0;
  const precioProm = (() => { const ps = ventas.map((v) => v.precioKg).filter((p): p is number => p != null); return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : listos[0]?.precioMercado ?? null; })();
  const ingresoProy = listos[0] && precioProm ? Math.round(proximoCab * proximoPeso * precioProm) : null;

  const exportar = () => {
    const filas = [["Fecha", "N° DT-e", "Destino", "Cabezas", "Peso total (kg)", "Precio/kg", "Importe"], ...ventas.map((v) => [new Date(v.fecha).toLocaleDateString("es-AR"), v.numero, v.destino || "", String(v.cabezas ?? ""), String(v.pesoTotal ?? ""), String(v.precioKg ?? ""), String(v.importe ?? "")])];
    const csv = filas.map((f) => f.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "faenas-engorde.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="col gap-16">
      {toast.node}
      {modalOpen && <ModalProgramarEnvio corrales={activos} onClose={() => setModalOpen(false)} onGuardado={(msg) => { toast.show(msg); onRefresh(); }} />}

      <div className="grid g-cols-5">
        <KPI label="Listos para Faena" value={nfEng.format(listosCab)} delta={`${listos.length} corrales al objetivo`} trend="up" icon="check-circle" accent />
        <KPI label="Próximo Envío" value={listos[0] ? `${proximoCab} cab.` : "—"} delta={listos[0]?.nombre || "sin corrales listos"} icon="truck" />
        <KPI label="Rendimiento Carcasa" value={rendimiento !== null ? `${coma(rendimiento, 1)}%` : "—"} delta={rendimiento !== null ? `promedio real · ${ventas.filter((v) => v.pesoTotal && v.pesoCarcasa).length} faena(s)` : "cargá el peso de carcasa al vender"} icon="target" />
        <KPI label="Precio Promedio" value={precioProm !== null ? `$${coma(precioProm, 2)}/kg` : "—"} delta={ventas.length ? "últimos envíos" : "referencia"} icon="dollar" />
        <KPI label="Ingreso Proyectado" value={ingresoProy !== null ? `$${nfEng.format(ingresoProy)}` : "—"} delta="próximo envío estimado" trend="up" icon="arrowUp" accent />
      </div>

      <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--ghost" onClick={exportar} disabled={ventas.length === 0}><Icon name="download" size={14} />Exportar</button>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalOpen(true)}><Icon name="plus" size={14} />Programar Envío</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(280px,1fr)", gap: 16, alignItems: "start" }}>
        {/* Listos */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 10px" }}>
            <div className="mc-card__title">Corrales Listos para Faena</div>
            <div className="text-xs text-muted mt-2">{listosCab} cabezas alcanzaron el peso objetivo</div>
          </div>
          {listos.length === 0 ? (
            <div className="mc-empty" style={{ padding: "36px 0" }}><div className="mc-empty__icon"><Icon name="check-circle" size={20} /></div>Ningún corral alcanzó el peso objetivo todavía.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="mc-table">
                <thead><tr><th>Corral</th><th className="mc-cell--num">Cabezas</th><th className="mc-cell--num">Peso Prom.</th><th className="mc-cell--num">Estado</th><th>Destino sugerido</th></tr></thead>
                <tbody>
                  {listos.map((c) => {
                    const d = diasAFaena(c);
                    return (
                      <tr key={c.id}>
                        <td className="font-semi" style={{ color: "var(--mc-ink)" }}>{c.nombre}</td>
                        <td className="mc-cell--num">{c.cabezas} cab.</td>
                        <td className="mc-cell--num">{Math.round(c.pesoActual ?? 0)} kg</td>
                        <td className="mc-cell--num">{d === 0 ? "Al objetivo" : `+${Math.abs(d ?? 0)}d`}</td>
                        <td>{ventas[0]?.destino || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 10px" }}>
            <div className="mc-card__title">Historial de Faenas</div>
            <div className="text-xs text-muted mt-2">Últimos envíos (DT-e de venta)</div>
          </div>
          {ventas.length === 0 ? (
            <div className="mc-empty" style={{ padding: "28px 0" }}><div className="mc-empty__icon"><Icon name="truck" size={20} /></div>Sin envíos registrados todavía.</div>
          ) : (
            <div className="col gap-8" style={{ padding: "0 16px 12px" }}>
              {ventas.slice(0, 6).map((h) => (
                <div key={h.id} style={{ padding: "11px 14px", border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{new Date(h.fecha).toLocaleDateString("es-AR")}</div>
                      <div className="text-xs text-muted mt-2">{h.destino || "—"}</div>
                    </div>
                    <span className={`mc-badge ${h.estado === "Vigente" ? "mc-badge--amber" : "mc-badge--green"}`}>{h.estado}</span>
                  </div>
                  <div className="text-xs mt-6" style={{ color: "var(--mc-text-2)" }}>
                    {h.cabezas ?? 0} cab. · {nfEng.format(h.pesoTotal ?? 0)} kg{h.importe ? ` · $${nfEng.format(h.importe)}` : ""}
                  </div>
                  <div className="row gap-6 mt-6" style={{ alignItems: "center" }}>
                    <Icon name="file-text" size={11} style={{ color: "var(--mc-green-700)" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-green-700)", fontFamily: "var(--ff-mono)" }}>DT-e #{h.numero}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
