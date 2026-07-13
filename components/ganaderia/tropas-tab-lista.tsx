"use client";

// Pestaña Tropas: identidad y composición de tropas + animales sin asignar
// (con drag & drop hacia la tabla). Datos reales de /api/tropas y /api/animales.

import React, { useMemo, useState } from "react";
import { Icon, KPI, useToast } from "@/components/mc";
import { AnimalRow } from "./tipos";
import {
  LoteGeoAPI,
  MovTropaAPI,
  TropaAPI,
  codigoTropa,
  fechaStrMov,
  freqLabel,
  mapaColoresTropas,
  pesoPromTropa,
  razaPredominante,
  toDateStr,
} from "./tropas-tipos";
import {
  ModalAsignarAnimal,
  ModalDetalleTropa,
  ModalEditarTropa,
  ModalEliminarTropa,
  ModalNuevaTropa,
} from "./tropas-modales";

export function MovTropasLista({
  tropas,
  movimientos,
  lotes,
  animales,
  onRefresh,
  onGoToGestion,
}: {
  tropas: TropaAPI[];
  movimientos: MovTropaAPI[];
  lotes: LoteGeoAPI[];
  animales: AnimalRow[];
  onRefresh: () => void;
  onGoToGestion?: () => void;
}) {
  const toast = useToast();
  const [modalNueva, setModalNueva] = useState(false);
  const [tropaDetalle, setTropaDetalle] = useState<TropaAPI | null>(null);
  const [tropaEditar, setTropaEditar] = useState<TropaAPI | null>(null);
  const [tropaEliminar, setTropaEliminar] = useState<TropaAPI | null>(null);
  const [animalAsignar, setAnimalAsignar] = useState<AnimalRow | null>(null);
  const [dragOverTropa, setDragOverTropa] = useState<string | null>(null);

  const colores = useMemo(() => mapaColoresTropas(tropas), [tropas]);
  const sinAsignar = useMemo(() => animales.filter((a) => a.activo && !a.tropaId), [animales]);

  const totalCabezas = tropas.reduce((s, t) => s + (t._count?.animales ?? t.animales?.length ?? 0), 0);
  const cab = (t: TropaAPI) => t._count?.animales ?? t.animales?.length ?? 0;
  const tropaMasGrande = tropas.length ? tropas.reduce((max, t) => (cab(t) > cab(max) ? t : max), tropas[0]) : null;
  const promedioTropa = tropas.length ? Math.round(totalCabezas / tropas.length) : 0;
  const mesActual = toDateStr(new Date()).slice(0, 7);
  const movsEsteMes = movimientos.filter((m) => fechaStrMov(m.fecha).startsWith(mesActual)).length;

  const asignarATropa = async (animal: AnimalRow, tropaId: string) => {
    if (animal.tropaId === tropaId) return;
    try {
      const r = await fetch(`/api/tropas/${tropaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agregarAnimalIds: [animal.dbId] }),
      });
      if (!r.ok) throw new Error();
      const destino = tropas.find((t) => t.id === tropaId);
      toast.show(`${animal.id} asignado a ${destino?.nombre || "la tropa"}`);
      onRefresh();
    } catch {
      toast.show("No se pudo asignar el animal", "err");
    }
  };

  const handleDropEnTropa = (e: React.DragEvent, tropaId: string) => {
    e.preventDefault();
    setDragOverTropa(null);
    const dbId = e.dataTransfer.getData("text/plain");
    const animal = sinAsignar.find((a) => a.dbId === dbId) || animales.find((a) => a.dbId === dbId);
    if (animal) asignarATropa(animal, tropaId);
  };

  const exportarCSV = () => {
    const filas = [
      ["Tropa", "Categoría", "Raza predominante", "Lote actual", "Cabezas", "Peso prom. (kg)", "Rutina"],
      ...tropas.map((t) => [
        t.nombre,
        t.categoria || "",
        razaPredominante(t) || "",
        t.lote?.nombre || "",
        String(cab(t)),
        pesoPromTropa(t) !== null ? String(pesoPromTropa(t)) : "",
        t.rutina?.nombre || "",
      ]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `tropas-${toDateStr(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="col gap-16">
      {toast.node}
      {modalNueva && <ModalNuevaTropa lotes={lotes} sinAsignar={sinAsignar} onClose={() => setModalNueva(false)} onGuardado={onRefresh} />}
      {tropaDetalle && (
        <ModalDetalleTropa
          tropa={tropaDetalle}
          color={colores[tropaDetalle.id] || "#16a34a"}
          movimientos={movimientos.filter((m) => m.tropaId === tropaDetalle.id)}
          onClose={() => setTropaDetalle(null)}
          onEliminar={(t) => { setTropaDetalle(null); setTropaEliminar(t); }}
          onMoverAnimal={(dbId, caravana) => {
            const a = animales.find((x) => x.dbId === dbId);
            if (a) { setTropaDetalle(null); setAnimalAsignar(a); }
            else toast.show(`No se encontró el animal ${caravana}`, "err");
          }}
          onGoToGestion={onGoToGestion}
          onEditar={(t) => { setTropaDetalle(null); setTropaEditar(t); }}
        />
      )}
      {tropaEditar && <ModalEditarTropa tropa={tropaEditar} lotes={lotes} onClose={() => setTropaEditar(null)} onGuardado={onRefresh} />}
      {tropaEliminar && (
        <ModalEliminarTropa
          tropa={tropaEliminar}
          onClose={() => setTropaEliminar(null)}
          onIrAMover={(t) => { setTropaEliminar(null); setTropaDetalle(t); }}
          onEliminada={onRefresh}
        />
      )}
      {animalAsignar && <ModalAsignarAnimal animal={animalAsignar} tropas={tropas} onClose={() => setAnimalAsignar(null)} onGuardado={onRefresh} />}

      {/* ── KPIs ── */}
      <div className="grid g-cols-5">
        <KPI label="Total de Tropas" value={String(tropas.length)} icon="route" delta={`${totalCabezas} cabezas totales`} trend="up" />
        <KPI
          label="Cabezas Sin Asignar"
          value={String(sinAsignar.length)}
          icon="alert-triangle"
          delta={sinAsignar.length > 0 ? "requieren asignación" : "todo asignado"}
          trend={sinAsignar.length > 0 ? "warn" : "up"}
          warn={sinAsignar.length > 0}
        />
        <KPI label="Tropa Más Grande" value={tropaMasGrande ? tropaMasGrande.nombre : "—"} icon="users" delta={tropaMasGrande ? `${cab(tropaMasGrande)} cabezas` : "sin tropas"} trend="up" />
        <KPI label="Promedio por Tropa" value={tropas.length ? `${promedioTropa} cab.` : "—"} icon="chart" delta="distribución actual" trend="up" />
        <KPI label="Movimientos Este Mes" value={String(movsEsteMes)} icon="move-right" delta="traslados registrados" trend="up" />
      </div>

      {/* ── Acciones ── */}
      <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--ghost" onClick={exportarCSV} disabled={tropas.length === 0}><Icon name="download" size={14} />Exportar</button>
        <button onClick={() => setModalNueva(true)} className="mc-btn mc-btn--primary"><Icon name="plus" size={14} />Nueva Tropa</button>
      </div>

      {/* ── Layout 65/35 ── */}
      <div className="grid" style={{ gridTemplateColumns: "minmax(0,65fr) minmax(260px,35fr)", gap: 14, alignItems: "start" }}>
        <div className="col gap-12" style={{ minWidth: 0 }}>
          <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="mc-card__head" style={{ padding: "16px 20px 10px", marginBottom: 0 }}>
              <div>
                <div className="mc-card__title">Tropas Activas</div>
                <div className="text-xs text-muted mt-2">Listado completo con lote y rutina asignada · arrastrá un animal sin asignar hasta una fila</div>
              </div>
            </div>
            {tropas.length === 0 ? (
              <div className="mc-empty" style={{ padding: "40px 0" }}>
                <div className="mc-empty__icon"><Icon name="users" size={22} /></div>
                Todavía no creaste tropas
                <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ marginTop: 10 }} onClick={() => setModalNueva(true)}>
                  <Icon name="plus" size={12} /> Crear la primera tropa
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="mc-table">
                  <thead>
                    <tr>
                      <th>Tropa</th>
                      <th>Raza</th>
                      <th>Lote Actual</th>
                      <th className="mc-cell--num">Cabezas</th>
                      <th className="mc-cell--num">Peso Prom.</th>
                      <th>Rutina Asignada</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tropas.map((t, idx) => {
                      const peso = pesoPromTropa(t);
                      return (
                        <tr
                          key={t.id}
                          onDragOver={(e) => { e.preventDefault(); if (dragOverTropa !== t.id) setDragOverTropa(t.id); }}
                          onDragLeave={() => setDragOverTropa((prev) => (prev === t.id ? null : prev))}
                          onDrop={(e) => handleDropEnTropa(e, t.id)}
                          style={dragOverTropa === t.id ? { background: "var(--mc-green-50)", boxShadow: "inset 0 0 0 2px var(--mc-green-500)" } : undefined}
                        >
                          <td>
                            <div className="row gap-8" style={{ alignItems: "center" }}>
                              <span style={{ padding: "2px 8px", borderRadius: 999, background: colores[t.id], color: "#fff", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{codigoTropa(idx)}</span>
                              <span style={{ fontWeight: 700, color: "var(--mc-ink)" }}>{t.nombre}</span>
                            </div>
                          </td>
                          <td>{razaPredominante(t) || "—"}</td>
                          <td className="mc-cell--emph" style={{ fontWeight: 700 }}>{t.lote?.nombre || "Sin lote"}</td>
                          <td className="mc-cell--num">{cab(t)}</td>
                          <td className="mc-cell--num">{peso !== null ? `${peso} kg` : "—"}</td>
                          <td>{t.rutina ? `${t.rutina.nombre} · ${freqLabel(t.rutina)}` : "—"}</td>
                          <td>
                            <div className="row gap-6">
                              <button onClick={() => setTropaDetalle(t)} className="mc-btn mc-btn--secondary mc-btn--sm">Ver Detalle <Icon name="arrow-right" size={12} /></button>
                              <button onClick={() => setTropaEditar(t)} className="mc-icon-btn" title="Editar"><Icon name="edit" size={14} /></button>
                              <button onClick={() => setTropaEliminar(t)} className="mc-icon-btn" style={{ color: "var(--mc-red)" }} title="Eliminar"><Icon name="trash" size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Animales sin asignar ── */}
        <div className="mc-card" style={{ borderColor: sinAsignar.length > 0 ? "rgba(196,132,16,0.35)" : undefined }}>
          <div className="mc-card__head">
            <div>
              <div className="mc-card__title">Animales Sin Asignar</div>
              <div className="text-xs text-muted mt-4">Sin tropa asignada actualmente</div>
            </div>
            <span className={`mc-badge ${sinAsignar.length > 0 ? "mc-badge--amber" : "mc-badge--green"}`}>{sinAsignar.length}</span>
          </div>
          {sinAsignar.length === 0 ? (
            <div className="mc-empty">
              <div className="mc-empty__icon" style={{ background: "var(--mc-green-50)", color: "var(--mc-green-600)" }}>
                <Icon name="check-circle" size={22} />
              </div>
              Todos los animales están asignados
            </div>
          ) : (
            <div className="col gap-8" style={{ maxHeight: 480, overflowY: "auto" }}>
              {sinAsignar.map((a) => (
                <div
                  key={a.dbId}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", a.dbId); e.dataTransfer.effectAllowed = "move"; }}
                  className="row"
                  style={{ justifyContent: "space-between", padding: "9px 10px", borderRadius: 10, border: "1px solid var(--mc-line)", cursor: "grab" }}
                  title="Arrastrá este animal hasta una tropa para asignarlo"
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)" }}>{a.id}</div>
                    <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{a.raza || a.categoria} · {a.edad}</div>
                  </div>
                  <button onClick={() => setAnimalAsignar(a)} className="mc-btn mc-btn--secondary mc-btn--sm" disabled={tropas.length === 0}>
                    Asignar <Icon name="arrow-right" size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
