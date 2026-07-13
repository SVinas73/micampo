"use client";

// Tab Sanidad: Hospital Digital & Seguimiento (tratamientos reales con
// progreso de dosis), Análisis Corporal (heatmap con casos reales por zona)
// y Farmacia & Stock Veterinario (stock real de insumos).

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/mc";
import { AnimalRow, TratamientoAPI, fmtFechaCorta } from "./tipos";
import {
  CowHeatmap,
  ModalDiagnosticarAnimal,
  ModalRegistrarTratamientoSanitario,
  ModalSeguimientoTratamiento,
  ZONA_INFO_SANIDAD,
  zonasDesdeTratamientos,
} from "./animales-sanidad-modales";
import { VerDetalleAnimalModal } from "./animales-modales";

export type StockInsumoAPI = {
  id: string;
  nombre: string;
  categoria: string;
  subcategoria?: string | null;
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number | null;
  unidadMedida: string;
  lotes?: { fechaVencimiento?: string | null }[];
};

const FARMA_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f43f5e"];

export function AnimSanidad({
  animales,
  tratamientos,
  stockVet,
  onGuardado,
}: {
  animales: AnimalRow[];
  tratamientos: TratamientoAPI[];
  stockVet: StockInsumoAPI[];
  onGuardado?: () => void;
}) {
  const [modalDiagnostico, setModalDiagnostico] = useState(false);
  const [modalSeguimiento, setModalSeguimiento] = useState<TratamientoAPI | null>(null);
  const [modalTratamiento, setModalTratamiento] = useState(false);
  const [verAnimal, setVerAnimal] = useState<AnimalRow | null>(null);
  const [filtroHosp, setFiltroHosp] = useState<"activos" | "todos">("activos");

  const activos = animales.filter((a) => a.activo);

  const hospData = useMemo(() => {
    const list = filtroHosp === "activos" ? tratamientos.filter((t) => ["En curso", "En retiro"].includes(t.estado)) : tratamientos;
    const PALETA = ["#dc2626", "#d97706", "#2563eb", "#7c3aed", "#059669", "#0891b2"];
    const colorPorDiag = new Map<string, string>();
    return list.map((t) => {
      if (!colorPorDiag.has(t.diagnostico)) colorPorDiag.set(t.diagnostico, PALETA[colorPorDiag.size % PALETA.length]);
      const doses: string[] = [
        ...Array(t.dosisAplicadas).fill("done"),
        ...(t.dosisAplicadas < t.dosisTotales ? ["active"] : []),
        ...Array(Math.max(0, t.dosisTotales - t.dosisAplicadas - 1)).fill("pending"),
      ];
      const enRetiro = t.finRetiro && new Date(t.finRetiro) > new Date();
      const horasRetiro = enRetiro ? Math.ceil((new Date(t.finRetiro!).getTime() - new Date().getTime()) / 3600000) : 0;
      return {
        t,
        doses,
        retiro: enRetiro ? `${horasRetiro} hs` : t.retiroHoras ? "Liberado" : "—",
        color: colorPorDiag.get(t.diagnostico)!,
      };
    });
  }, [tratamientos, filtroHosp]);

  const zonaStats = useMemo(
    () => zonasDesdeTratamientos(tratamientos.filter((t) => ["En curso", "En retiro"].includes(t.estado)), activos.length),
    [tratamientos, activos.length]
  );
  const zonasTop = [...zonaStats].sort((a, b) => b.pct - a.pct).slice(0, 3);
  const maxZonaPct = Math.max(1, ...zonasTop.map((z) => z.pct));

  const farmaData = useMemo(() => {
    return stockVet.map((s, i) => {
      const max = s.stockMaximo && s.stockMaximo > 0 ? s.stockMaximo : Math.max(s.stockActual, s.stockMinimo * 3, 1);
      const pct = Math.min(100, Math.round((s.stockActual / max) * 100));
      const estado = s.stockActual <= s.stockMinimo * 0.5 ? "low" : s.stockActual <= s.stockMinimo ? "warn" : "ok";
      const venc = s.lotes?.map((l) => l.fechaVencimiento).filter(Boolean).sort()[0];
      return {
        color: FARMA_COLORS[i % FARMA_COLORS.length],
        name: s.nombre,
        vol: `${s.stockActual} ${s.unidadMedida}`,
        pct,
        estado,
        venc: venc ? fmtFechaCorta(venc) + "/" + new Date(venc as string).getFullYear() : "—",
      };
    });
  }, [stockVet]);
  const alertasFarma = farmaData.filter((f) => f.estado !== "ok").length;

  const doseColor: Record<string, string> = { done: "#16a34a", active: "#f59e0b", pending: "#d1d5db" };
  const stateMap: Record<string, { bg: string; text: string; label: string }> = {
    ok: { bg: "#dcfce7", text: "#166534", label: "OK" },
    warn: { bg: "#fef3c7", text: "#92400e", label: "Bajo" },
    low: { bg: "#fee2e2", text: "#991b1b", label: "Crítico" },
  };

  const enEnfermeria = new Set(tratamientos.filter((t) => ["En curso", "En retiro"].includes(t.estado)).map((t) => t.animal?.id)).size;

  return (
    <div className="col gap-16">
      {modalDiagnostico && <ModalDiagnosticarAnimal pacientes={activos} onClose={() => setModalDiagnostico(false)} onGuardado={onGuardado} />}
      {modalSeguimiento && <ModalSeguimientoTratamiento tratamiento={modalSeguimiento} onClose={() => setModalSeguimiento(null)} onGuardado={onGuardado} />}
      {modalTratamiento && <ModalRegistrarTratamientoSanitario pacientes={activos} onClose={() => setModalTratamiento(false)} onGuardado={onGuardado} />}
      {verAnimal && <VerDetalleAnimalModal animal={verAnimal} onClose={() => setVerAnimal(null)} onEditado={onGuardado} />}

      {/* Botones de acción */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setModalDiagnostico(true)} className="mc-btn mc-btn--primary"><Icon name="search" size={14} />Diagnosticar Animal</button>
        <button onClick={() => setModalTratamiento(true)} className="mc-btn mc-btn--primary"><Icon name="plus" size={14} />Registrar Evento</button>
      </div>

      {/* Hospital (65) | Análisis + Farmacia (35) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 65fr) minmax(240px, 35fr)", gap: 16, alignItems: "start" }}>
        {/* Hospital Digital */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px 12px", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mc-line)" }}>
            <div style={{ minWidth: 0, flex: "1 1 220px" }}>
              <div className="mc-card__title" style={{ display: "flex", alignItems: "center", gap: 7 }}><Icon name="heart" size={16} /> Hospital Digital & Seguimiento</div>
              <div style={{ fontSize: 11, color: "var(--mc-muted)", marginTop: 2 }}>Tratamientos activos en curso</div>
            </div>
            <div className="mc-seg">
              <button className={filtroHosp === "activos" ? "is-on" : ""} onClick={() => setFiltroHosp("activos")}>Activos</button>
              <button className={filtroHosp === "todos" ? "is-on" : ""} onClick={() => setFiltroHosp("todos")}>Historial</button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="mc-table">
              <thead>
                <tr>
                  <th>Paciente</th><th>Lote</th><th>Diagnóstico</th>
                  <th>Progreso (Dosis)</th><th>Retiro/Carencia</th><th></th>
                </tr>
              </thead>
              <tbody>
                {hospData.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="mc-empty" style={{ border: "none", margin: 10 }}>
                        <div style={{ fontWeight: 600 }}>Sin tratamientos {filtroHosp === "activos" ? "activos" : "registrados"}</div>
                        <div className="text-xs mt-4">Usá «Diagnosticar Animal» o «Registrar Evento» para cargar el primero.</div>
                      </div>
                    </td>
                  </tr>
                )}
                {hospData.map(({ t, doses, retiro, color }) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, border: `1.5px solid ${color}35`, flexShrink: 0 }}><Icon name="cow" size={16} /></div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>#{(t.animal?.caravana || "").replace(/^#/, "")}</div>
                          <div style={{ fontSize: 11, color: "var(--mc-muted)" }}>{t.animal?.categoria || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 12, color: "var(--mc-muted)" }}>{t.animal?.tropa?.nombre || t.animal?.ubicacion || "—"}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{t.diagnostico}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        {doses.map((d, j) => (
                          <div key={j} style={{ width: d === "active" ? 13 : 9, height: d === "active" ? 13 : 9, borderRadius: "50%", background: doseColor[d], flexShrink: 0, boxShadow: d === "active" ? `0 0 0 3px ${doseColor[d]}38` : "none" }} />
                        ))}
                        <span style={{ fontSize: 10, color: "var(--mc-muted)", marginLeft: 4 }}>
                          {t.dosisAplicadas}/{t.dosisTotales}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: retiro === "Liberado" ? "#dcfce7" : retiro === "—" ? "var(--mc-surface-3)" : "#fef3c7", color: retiro === "Liberado" ? "#166534" : retiro === "—" ? "var(--mc-text-3)" : "#92400e" }}>{retiro}</span>
                    </td>
                    <td>
                      <div className="row gap-6">
                        <button
                          className="mc-icon-btn"
                          style={{ width: 28, height: 28 }}
                          title="Ver animal"
                          onClick={() => {
                            const row = animales.find((a) => a.dbId === t.animal?.id);
                            if (row) setVerAnimal(row);
                          }}
                        >
                          <Icon name="eye" size={14} />
                        </button>
                        {t.dosisAplicadas < t.dosisTotales && (
                          <button onClick={() => setModalSeguimiento(t)} className="mc-btn mc-btn--secondary mc-btn--sm" style={{ padding: "4px 9px", fontSize: 11 }}>Seguimiento</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="col gap-16">
          {/* Análisis Corporal */}
          <div className="mc-card col gap-10">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="mc-card__title">Análisis Corporal</div>
                <div style={{ fontSize: 11, color: "var(--mc-muted)", marginTop: 2 }}>Bovina · Enfermería activa</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: enEnfermeria > 0 ? "#dc2626" : "#16a34a", background: enEnfermeria > 0 ? "#fef2f2" : "#f0fdf4", padding: "3px 8px", borderRadius: 20 }}>{enEnfermeria} en Enf.</span>
            </div>
            <CowHeatmap stats={zonaStats} />
            <div style={{ borderTop: "1px solid var(--mc-line)", paddingTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--mc-muted)", marginBottom: 7 }}>Zonas más afectadas</div>
              {zonasTop.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin casos activos por zona.</div>}
              {zonasTop.map((z, i) => {
                const color = z.pct >= 10 ? "#dc2626" : z.pct >= 6 ? "#d97706" : "#f59e0b";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12 }}>{ZONA_INFO_SANIDAD[z.zona]?.label || z.zona}</span>
                    <div style={{ width: 60, height: 4, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(z.pct * 100) / maxZonaPct}%`, background: color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color, width: 28, textAlign: "right" }}>{z.pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Farmacia & Stock Vet */}
          <div className="mc-card col gap-12">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="mc-card__title">Farmacia & Stock Vet.</div>
                <div style={{ fontSize: 11, color: "var(--mc-muted)", marginTop: 2 }}>{farmaData.length} productos · {alertasFarma} alertas</div>
              </div>
              <a href="/logistica-inventario" className="mc-btn mc-btn--primary mc-btn--sm" style={{ textDecoration: "none" }}><Icon name="plus" size={12} />Agregar</a>
            </div>
            {farmaData.length === 0 ? (
              <div className="mc-empty" style={{ padding: 20 }}>
                <div style={{ fontSize: 12 }}>Sin productos veterinarios en stock.</div>
                <div className="text-xs mt-4">Cargalos desde Logística e Inventario con categoría «Veterinaria».</div>
              </div>
            ) : (
              <div className="col" style={{ gap: 7 }}>
                {farmaData.map((f, i) => {
                  const sc = stateMap[f.estado];
                  return (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line)", transition: "border-color 0.15s, box-shadow 0.15s", cursor: "default" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.boxShadow = `0 2px 8px ${f.color}22`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--mc-line)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ width: 4, height: 38, borderRadius: 4, background: f.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 115 }}>{f.name}</span>
                          <span style={{ fontSize: 10, color: "var(--mc-muted)", flexShrink: 0, marginLeft: 4 }}>{f.vol}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: f.pct + "%", background: `linear-gradient(90deg, ${f.color}cc, ${f.color})`, borderRadius: 99 }} />
                        </div>
                        <div style={{ fontSize: 10, color: "var(--mc-muted)", marginTop: 3 }}>{f.pct}% disponible · Venc: {f.venc}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
                        <a href="/logistica-inventario" title="Reponer stock" style={{ width: 26, height: 26, borderRadius: 7, border: "1.5px solid var(--mc-line-2)", background: "var(--mc-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}><Icon name="box" size={13} /></a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
