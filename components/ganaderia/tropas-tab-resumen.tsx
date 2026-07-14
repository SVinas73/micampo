"use client";

// Pestaña Resumen de Mov. de Tropas: Panel de Gestión con mapa satelital REAL
// (polígonos de lotes con capas de ocupación/cantidades/descanso/raza/ruta del
// día), hoja de ruta del día y ventana óptima de arreo. Todo derivado de la API.

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Icon, useToast } from "@/components/mc";
import type { LoteMapaSat, RutaMapaSat } from "./tropas-mapa-sat";

// Mapa satelital real (Leaflet + Esri); se carga solo en cliente.
const TropasMapaSat = dynamic(() => import("./tropas-mapa-sat"), {
  ssr: false,
  loading: () => <div style={{ height: 440, display: "grid", placeItems: "center", color: "var(--mc-text-3)", fontSize: 12 }}>Cargando mapa satelital…</div>,
});

import { AnimalRow } from "./tipos";
import {
  LoteGeoAPI,
  MovTropaAPI,
  RutinaAPI,
  TropaAPI,
  centroDeLote,
  diasDescansoLote,
  fechaStrMov,
  mapaColoresTropas,
  movAtrasado,
  razaPredominante,
  toDateStr,
} from "./tropas-tipos";
import { FichaTropaCard, KpiMovCard, MovVentanaOptima } from "./tropas-ui";
import {
  ModalAsignarAnimal,
  ModalDetalleTropa,
  ModalEliminarTropa,
  ModalMoverTropa,
  ModalNuevoTraslado,
  ModalPlanificarMovimiento,
} from "./tropas-modales";

type Capa = "ocupacion" | "cantidades" | "descanso" | "raza" | "rutaDia";

export function MovResumen({
  tropas,
  rutinas,
  movimientos,
  lotes,
  animales,
  onRefresh,
  onGoToGestion,
}: {
  tropas: TropaAPI[];
  rutinas: RutinaAPI[];
  movimientos: MovTropaAPI[];
  lotes: LoteGeoAPI[];
  animales: AnimalRow[];
  onRefresh: () => void;
  onGoToGestion?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selTropaId, setSelTropaId] = useState<string | null>(null);
  const [fichaVisible, setFichaVisible] = useState(false);
  const [capa, setCapa] = useState<Capa>("ocupacion");
  const [loteRutaSel, setLoteRutaSel] = useState<string | null>(null);
  const [modalPlanif, setModalPlanif] = useState(false);
  const [modalTraslado, setModalTraslado] = useState(false);
  const [tropaDetalle, setTropaDetalle] = useState<TropaAPI | null>(null);
  const [tropaMover, setTropaMover] = useState<TropaAPI | null>(null);
  const [tropaEliminar, setTropaEliminar] = useState<TropaAPI | null>(null);
  const [animalAsignar, setAnimalAsignar] = useState<AnimalRow | null>(null);
  const [ejecutando, setEjecutando] = useState<string | null>(null);

  const colores = useMemo(() => mapaColoresTropas(tropas), [tropas]);
  const hoyStr = toDateStr(new Date());

  const movsHoy = useMemo(
    () =>
      movimientos
        .filter((m) => fechaStrMov(m.fecha) === hoyStr && m.estado !== "Cancelado")
        .sort((a, b) => (a.horario || "99").localeCompare(b.horario || "99")),
    [movimientos, hoyStr]
  );

  /* KPIs reales */
  const totalCabezas = tropas.reduce((s, t) => s + (t._count?.animales ?? t.animales?.length ?? 0), 0);
  const ejecutadosHoy = movsHoy.filter((m) => m.estado === "Ejecutado").length;
  const enCursoHoy = movsHoy.filter((m) => m.estado === "En curso");
  const cabTransito = enCursoHoy.reduce((s, m) => s + (m.cabezas || 0), 0);
  const atrasados = movimientos.filter((m) => movAtrasado(m));
  const hace30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const movs30 = movimientos.filter((m) => fechaStrMov(m.fecha) >= toDateStr(hace30) && fechaStrMov(m.fecha) <= hoyStr);
  const cerrados30 = movs30.filter((m) => m.estado === "Ejecutado").length;
  const evaluables30 = cerrados30 + movs30.filter((m) => m.estado === "Cancelado" || movAtrasado(m)).length;
  const eficiencia = evaluables30 > 0 ? Math.round((cerrados30 / evaluables30) * 100) : null;

  const tropaEnLote = (nombreLote: string) => tropas.find((t) => t.lote?.nombre === nombreLote);
  const selTropa = tropas.find((t) => t.id === selTropaId) || null;

  /* Ruta del día sobre el satélite: tramos geolocalizados por el centro real de cada lote */
  const centroDeNombre = (nombre?: string | null): [number, number] | null => {
    if (!nombre) return null;
    const l = lotes.find((x) => x.nombre === nombre);
    return l ? centroDeLote(l) : null;
  };

  const ejecutarMov = async (m: MovTropaAPI) => {
    setEjecutando(m.id);
    try {
      const r = await fetch(`/api/movimientos-tropa/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "ejecutar" }),
      });
      if (!r.ok) throw new Error();
      toast.show("Traslado marcado como ejecutado");
      onRefresh();
    } catch {
      toast.show("No se pudo ejecutar el traslado", "err");
    } finally {
      setEjecutando(null);
    }
  };

  const abrirFicha = (t: TropaAPI) => { setSelTropaId(t.id); setFichaVisible(true); };

  const proximoActivoIdx = movsHoy.findIndex((m) => m.estado !== "Ejecutado");

  const capas: { k: Capa; label: string }[] = [
    { k: "ocupacion", label: "Ocupación" },
    { k: "cantidades", label: "Cantidades" },
    { k: "descanso", label: "Descanso" },
    { k: "raza", label: "Raza" },
    { k: "rutaDia", label: "Ruta del Día" },
  ];

  // ── Mapa satelital real: color + etiqueta por lote según la capa activa ──
  const hayGeo = useMemo(() => lotes.some((l) => centroDeLote(l) !== null), [lotes]);
  const colorLoteCapa = (nombre: string): { color: string; label: string; etiqueta: string | null } => {
    const tropaEn = tropaEnLote(nombre);
    const cant = tropaEn ? tropaEn._count?.animales ?? tropaEn.animales?.length ?? 0 : 0;
    const legsLote = movsHoy.filter((m) => m.origenNombre === nombre || m.destinoNombre === nombre).length;
    const descanso = diasDescansoLote(nombre, movimientos, tropas);
    const tc = tropaEn ? colores[tropaEn.id] : null;
    const raza = tropaEn ? razaPredominante(tropaEn) : null;
    let color = "#94a3b8";
    if (capa === "ocupacion" || capa === "cantidades" || capa === "raza") color = tc || "#94a3b8";
    else if (capa === "descanso") color = descanso === null ? "#94a3b8" : descanso >= 21 ? "#16a34a" : descanso >= 7 ? "#d97706" : "#dc2626";
    else if (capa === "rutaDia") color = loteRutaSel === nombre ? "#3b82f6" : legsLote > 0 ? "#f59e0b" : "#94a3b8";
    const label =
      capa === "ocupacion" ? (tropaEn ? `${tropaEn.nombre} · ${cant} cab.` : "Libre") :
      capa === "cantidades" ? (tropaEn ? `${cant} cabezas` : "Sin animales") :
      capa === "descanso" ? (descanso === null ? "Sin registros" : descanso === 0 ? "Ocupado" : `${descanso} días de descanso`) :
      capa === "raza" ? (raza || (tropaEn ? "Sin razas registradas" : "Sin hacienda")) :
      legsLote > 0 ? `${legsLote} movimiento${legsLote === 1 ? "" : "s"} hoy` : "Sin movimientos hoy";
    const etiqueta =
      capa === "ocupacion" || capa === "cantidades" ? (tropaEn ? `${cant} cab.` : null) :
      capa === "descanso" ? (descanso !== null ? `${descanso}d` : null) :
      capa === "raza" ? raza :
      legsLote > 0 ? `${legsLote} mov.` : null;
    return { color, label, etiqueta };
  };
  const lotesMapa: LoteMapaSat[] = lotes.map((l) => {
    const { color, label, etiqueta } = colorLoteCapa(l.nombre);
    return { id: l.id, nombre: l.nombre, coordenadas: l.coordenadas, centroLatitud: l.centroLatitud, centroLongitud: l.centroLongitud, color, label, etiqueta, selected: loteRutaSel === l.nombre, clickable: capa === "rutaDia" || !!tropaEnLote(l.nombre) };
  });
  // Tramos de la Ruta del Día dibujados sobre el satélite (todos, o los del lote seleccionado)
  const legsRuta = capa === "rutaDia" ? (loteRutaSel ? movsHoy.filter((m) => m.origenNombre === loteRutaSel || m.destinoNombre === loteRutaSel) : movsHoy) : [];
  const rutasMapa: RutaMapaSat[] = legsRuta.flatMap((m) => {
    const a = centroDeNombre(m.origenNombre);
    const b = centroDeNombre(m.destinoNombre);
    if (!a || !b || (a[0] === b[0] && a[1] === b[1])) return [];
    return [{ a, b, color: colores[m.tropaId] || "#f59e0b", label: `${m.cabezas || 0} cab.` }];
  });
  const onSelectLoteMapa = (id: string) => {
    const l = lotes.find((x) => x.id === id);
    if (!l) return;
    if (capa === "rutaDia") setLoteRutaSel((p) => (p === l.nombre ? null : l.nombre));
    else {
      const t = tropaEnLote(l.nombre);
      if (t) abrirFicha(t);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {toast.node}
      {modalPlanif && (
        <ModalPlanificarMovimiento tropas={tropas} rutinas={rutinas} lotes={lotes} onClose={() => setModalPlanif(false)} onGuardado={onRefresh} />
      )}
      {modalTraslado && <ModalNuevoTraslado tropas={tropas} lotes={lotes} onClose={() => setModalTraslado(false)} onGuardado={onRefresh} />}
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
        />
      )}
      {tropaEliminar && (
        <ModalEliminarTropa
          tropa={tropaEliminar}
          onClose={() => setTropaEliminar(null)}
          onIrAMover={(t) => { setTropaEliminar(null); setTropaDetalle(t); }}
          onEliminada={() => { setFichaVisible(false); onRefresh(); }}
        />
      )}
      {tropaMover && <ModalMoverTropa tropa={tropaMover} lotes={lotes} onClose={() => setTropaMover(null)} onGuardado={() => { setFichaVisible(false); onRefresh(); }} />}
      {animalAsignar && <ModalAsignarAnimal animal={animalAsignar} tropas={tropas} onClose={() => setAnimalAsignar(null)} onGuardado={onRefresh} />}

      {/* ── KPIs ── */}
      <div className="grid g-cols-5" style={{ gap: 10 }}>
        <KpiMovCard title="Tropas Activas" ico="users" val={String(tropas.length)} sub={`${totalCabezas.toLocaleString("es-AR")} cabezas gestionadas`} />
        <KpiMovCard
          title="Movimientos Hoy"
          ico="route"
          val={String(ejecutadosHoy)}
          valSuffix={`/ ${movsHoy.length}`}
          barPct={movsHoy.length ? (ejecutadosHoy / movsHoy.length) * 100 : 0}
          sub={movsHoy.length ? `de ${movsHoy.length} traslados completados` : "sin traslados programados"}
        />
        <KpiMovCard title="En Tránsito" ico="move-right" val={String(cabTransito)} valSuffix="cab." sub={enCursoHoy.length ? "Animales en arreo ahora" : "Sin arreos en curso"} pulse={cabTransito > 0} />
        <KpiMovCard
          title="Eficiencia Rutina"
          ico="clock"
          val={eficiencia !== null ? `${eficiencia}%` : "—"}
          valColor={eficiencia !== null && eficiencia >= 80 ? "#16a34a" : undefined}
          sub={eficiencia !== null ? "Cumplimiento últimos 30 días" : "Sin movimientos recientes"}
        />
        <KpiMovCard
          title="Alertas"
          ico="alert-triangle"
          val={String(atrasados.length)}
          valSuffix={atrasados.length === 1 ? "Activa" : "Activas"}
          valColor={atrasados.length > 0 ? "#c93434" : "#16a34a"}
          sub={atrasados.length > 0 ? `${atrasados[0].tropa?.nombre || "Tropa"} con traslado atrasado` : "Todos los traslados al día"}
          subColor={atrasados.length > 0 ? "#c93434" : undefined}
        />
      </div>

      {/* ── Acciones ── */}
      <div className="row gap-8" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => router.push("/trazabilidad")}>DT-e</button>
        <button onClick={() => setModalPlanif(true)} className="mc-btn mc-btn--secondary"><Icon name="calendar" size={14} />Planificar Movimiento</button>
        <button onClick={() => setModalTraslado(true)} className="mc-btn mc-btn--primary"><Icon name="plus" size={14} />Nuevo Traslado</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(280px,1fr)", gap: 14, alignItems: "start" }}>
        {/* ══ Mapa ══ */}
        <div className="mc-card" style={{ padding: 0, overflow: "visible" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 10px", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div className="mc-card__title" style={{ marginBottom: 2 }}>Panel de Gestión de Tropas</div>
              <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>Clickeá una tropa para ver su ficha y ventana óptima</div>
            </div>
            <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
              <div className="mc-seg">
                {capas.map((c) => (
                  <button key={c.k} className={capa === c.k ? "is-on" : ""} onClick={() => { setCapa(c.k); setLoteRutaSel(null); }}>{c.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ position: "relative", margin: "0 14px 14px" }}>
            <div style={{ position: "relative", background: "var(--mc-surface-2)", borderRadius: 14, overflow: "hidden", minHeight: 440 }}>
              {lotes.length === 0 ? (
                <div style={{ minHeight: 440, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, textAlign: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="map" size={22} style={{ color: "var(--mc-text-3)" }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>Sin lotes cargados</div>
                  <div style={{ fontSize: 12, color: "var(--mc-text-2)", maxWidth: 320 }}>
                    Creá tus lotes/potreros en el módulo de Lotes para ver el mapa de ocupación de tropas.
                  </div>
                  <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => router.push("/lotes")}>Ir a Lotes <Icon name="arrow-right" size={12} /></button>
                </div>
              ) : (
                <>
                  <TropasMapaSat lotes={lotesMapa} rutas={rutasMapa} onSelect={onSelectLoteMapa} height={440} />
                  {!hayGeo && (
                    <div style={{ position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)", background: "rgba(15,23,42,.85)", color: "#fff", fontSize: 11.5, fontWeight: 600, padding: "8px 14px", borderRadius: 10, zIndex: 20, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                      <Icon name="map-pin" size={13} />
                      Dibujá el contorno de tus lotes en Campo Digital → Lotes para verlos en el mapa
                    </div>
                  )}
                </>
              )}

              {/* Leyenda tropas */}
              {(capa === "cantidades" || capa === "ocupacion") && tropas.length > 0 && (
                <div style={{ position: "absolute", top: 12, right: 12, zIndex: 20, background: "rgba(255,255,255,0.92)", padding: "10px 12px", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.08)", display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
                  {tropas.map((t) => (
                    <div key={t.id} onClick={() => setSelTropaId(t.id)} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", opacity: selTropaId === t.id ? 1 : 0.6, fontWeight: selTropaId === t.id ? 700 : 400 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: colores[t.id], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "#1e293b" }}>{t.nombre} · {t.lote?.nombre || "Sin lote"}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Leyenda descanso */}
              {capa === "descanso" && lotes.length > 0 && (
                <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(255,255,255,0.92)", padding: "8px 12px", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.08)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {([["#16a34a", "≥21d recuperado"], ["#d97706", "7–20d en recuperación"], ["#dc2626", "<7d sobreexigido"]] as const).map(([col, lbl]) => (
                    <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: col + "88", border: `1px solid ${col}`, flexShrink: 0 }} />
                      <span style={{ fontSize: 10.5, color: "#1e293b", fontWeight: 600 }}>{lbl}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Ayuda ruta del día */}
              {capa === "rutaDia" && !loteRutaSel && lotes.length > 0 && (
                <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(255,255,255,0.92)", padding: "8px 12px", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.08)", fontSize: 11, color: "#1e293b", fontWeight: 600, maxWidth: 220 }}>
                  {movsHoy.length === 0 ? "Hoy no hay movimientos programados." : "Clickeá un lote para ver sus movimientos de hoy."}
                </div>
              )}
            </div>

            {fichaVisible && selTropa && (
              <FichaTropaCard
                tropa={selTropa}
                color={colores[selTropa.id] || "#16a34a"}
                movimientos={movimientos}
                tropas={tropas}
                onClose={() => setFichaVisible(false)}
                onVerDetalle={() => { setFichaVisible(false); setTropaDetalle(selTropa); }}
                onMover={() => { setFichaVisible(false); setTropaMover(selTropa); }}
              />
            )}
          </div>
        </div>

        {/* ══ Columna derecha ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {/* Hoja de Ruta del Día */}
          <div className="mc-card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Icon name="clock" size={16} style={{ color: "#16a34a" }} />
              <div>
                <div className="mc-card__title">Hoja de Ruta del Día</div>
                <div className="text-xs text-muted mt-2">Traslados programados, en orden</div>
              </div>
            </div>
            {movsHoy.length === 0 ? (
              <div className="mc-empty" style={{ padding: "18px 0" }}>
                <div className="mc-empty__icon"><Icon name="route" size={20} /></div>
                Sin traslados programados para hoy
                <button className="mc-btn mc-btn--secondary mc-btn--sm" style={{ marginTop: 10 }} onClick={() => setModalPlanif(true)}>
                  <Icon name="calendar" size={12} /> Planificar
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {movsHoy.map((m, i) => {
                  const tc = colores[m.tropaId] || "#16a34a";
                  const done = m.estado === "Ejecutado";
                  const active = i === proximoActivoIdx;
                  return (
                    <div key={m.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: done ? "#94a3b8" : active ? "#16a34a" : "var(--mc-ink)", letterSpacing: "-.01em", lineHeight: 1.2, paddingTop: 2, minWidth: 42 }}>
                          {m.horario || "—"}
                        </div>
                        {i < movsHoy.length - 1 && <div style={{ width: 2, height: 36, background: "var(--mc-line)", margin: "4px 0" }} />}
                      </div>
                      <div
                        style={{
                          flex: 1, marginBottom: i < movsHoy.length - 1 ? 4 : 0, minWidth: 0,
                          background: active ? "#f0fdf4" : done ? "var(--mc-surface-2)" : "var(--mc-surface)",
                          border: active ? "1.5px solid #86efac" : "1.5px solid var(--mc-line)",
                          borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: "var(--mc-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
                            {m.motivo || "Traslado"}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: done ? "#94a3b8" : "var(--mc-ink)" }}>{m.origenNombre || "—"}</span>
                            <Icon name="arrow-right" size={12} style={{ color: "#94a3b8" }} />
                            <span style={{ background: tc, color: "white", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{m.tropa?.nombre || "Tropa"}</span>
                            <Icon name="arrow-right" size={12} style={{ color: "#94a3b8" }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: done ? "#94a3b8" : "var(--mc-ink)" }}>{m.destinoNombre || "—"}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => !done && ejecutarMov(m)}
                          disabled={done || ejecutando === m.id}
                          title={done ? "Ejecutado" : "Marcar como ejecutado"}
                          style={{
                            width: 28, height: 28, borderRadius: "50%",
                            border: done ? "2px solid #94a3b8" : active ? "2px solid #16a34a" : "2px solid var(--mc-line)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            cursor: done ? "default" : "pointer", background: "transparent",
                          }}
                        >
                          <Icon name="check" size={13} style={{ color: done ? "#94a3b8" : active ? "#16a34a" : "var(--mc-line)" }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <MovVentanaOptima tropa={selTropa || tropas[0] || null} />
        </div>
      </div>
    </div>
  );
}
