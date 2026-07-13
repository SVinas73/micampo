"use client";

// Pestaña Resumen de Mov. de Tropas: panel de gestión con mapa esquemático
// de lotes reales (capas de ocupación/cantidades/descanso/raza/ruta del día),
// hoja de ruta del día y ventana óptima de arreo. Todo derivado de la API.

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, useToast } from "@/components/mc";
import { AnimalRow } from "./tipos";
import {
  LoteGeoAPI,
  LoteSVG,
  MovTropaAPI,
  RutinaAPI,
  TropaAPI,
  diasDescansoLote,
  fechaStrMov,
  mapaColoresTropas,
  movAtrasado,
  proyectarLotes,
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

/** Puntos "1 animal = 1 punto" en espiral alrededor del centroide del lote. */
function dotsDeTropa(l: LoteSVG, cant: number): [number, number][] {
  const pts = l.pts.split(" ").map((s) => s.split(",").map(Number));
  const rMax = Math.max(14, Math.min(...[Math.max(...pts.map((p) => Math.abs(p[0] - l.cx))), Math.max(...pts.map((p) => Math.abs(p[1] - l.cy)))]) * 0.7);
  const n = Math.min(cant, 24);
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const ang = i * 2.399963; // ángulo áureo — distribución pareja sin aleatoriedad
    const r = rMax * Math.sqrt((i + 0.5) / n);
    out.push([l.cx + r * Math.cos(ang), l.cy + r * Math.sin(ang)]);
  }
  return out;
}

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
  const [tooltip, setTooltip] = useState<{ id: string; dato: string; x: number; y: number } | null>(null);
  const [fichaVisible, setFichaVisible] = useState(false);
  const [capa, setCapa] = useState<Capa>("ocupacion");
  const [satelital, setSatelital] = useState(false);
  const [loteRutaSel, setLoteRutaSel] = useState<string | null>(null);
  const [modalPlanif, setModalPlanif] = useState(false);
  const [modalTraslado, setModalTraslado] = useState(false);
  const [tropaDetalle, setTropaDetalle] = useState<TropaAPI | null>(null);
  const [tropaMover, setTropaMover] = useState<TropaAPI | null>(null);
  const [tropaEliminar, setTropaEliminar] = useState<TropaAPI | null>(null);
  const [animalAsignar, setAnimalAsignar] = useState<AnimalRow | null>(null);
  const [ejecutando, setEjecutando] = useState<string | null>(null);

  const colores = useMemo(() => mapaColoresTropas(tropas), [tropas]);
  const lotesSVG = useMemo(() => proyectarLotes(lotes), [lotes]);
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

  /* Ruta del día: tramos del lote seleccionado (o todos si hay pocos) */
  const legsSel = loteRutaSel
    ? movsHoy.filter((m) => m.origenNombre === loteRutaSel || m.destinoNombre === loteRutaSel)
    : [];

  /* Anclas para destinos que no son lotes del mapa (corrales, frigoríficos…) */
  const externos = useMemo(() => {
    const nombres = new Set<string>();
    movsHoy.forEach((m) => {
      [m.origenNombre, m.destinoNombre].forEach((n) => {
        if (n && !lotesSVG.some((l) => l.nombre === n)) nombres.add(n);
      });
    });
    const out: Record<string, { x: number; y: number }> = {};
    Array.from(nombres).forEach((n, i) => { out[n] = { x: 500, y: 90 + i * 44 }; });
    return out;
  }, [movsHoy, lotesSVG]);

  const puntoDeNombre = (nombre?: string | null) => {
    if (!nombre) return null;
    const l = lotesSVG.find((x) => x.nombre === nombre);
    if (l) return { x: l.cx, y: l.cy };
    return externos[nombre] || null;
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
              <button
                className="mc-btn mc-btn--secondary mc-btn--sm"
                style={{ fontSize: 11, padding: "3px 10px", background: satelital ? "#1e293b" : undefined, color: satelital ? "white" : undefined, borderColor: satelital ? "#1e293b" : undefined }}
                onClick={() => setSatelital((s) => !s)}
              >
                <Icon name="map" size={12} /> Vista Satelital
              </button>
            </div>
          </div>

          <div style={{ position: "relative", margin: "0 14px 14px" }}>
            <div style={{ position: "relative", background: satelital ? "linear-gradient(160deg,#2d3b24 0%,#3f4f30 55%,#2d3b24 100%)" : "linear-gradient(160deg,#e8f5e9 0%,#f0f4f8 60%,#e8f0fe 100%)", borderRadius: 14, overflow: "hidden", minHeight: 440 }}>
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
                <svg viewBox="100 40 440 420" style={{ width: "100%", height: 440, display: "block" }}>
                  <defs>
                    <pattern id="gridTropas" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M40 0L0 0 0 40" fill="none" stroke="#cbd5e155" strokeWidth="0.5" />
                    </pattern>
                    <pattern id="satStripesTropas" width="18" height="18" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                      <rect width="18" height="18" fill="#3f5233" />
                      <rect width="9" height="18" fill="#4a5d3a" />
                    </pattern>
                    {legsSel.map((m, i) => (
                      <marker key={i} id={`arrow-ruta-${i}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6 Z" fill={colores[m.tropaId] || "#16a34a"} />
                      </marker>
                    ))}
                  </defs>
                  <rect x="100" y="40" width="440" height="420" fill={satelital ? "url(#satStripesTropas)" : "url(#gridTropas)"} />
                  {satelital && (
                    <text x="320" y="250" textAnchor="middle" fontSize="12" fill="#ffffff99" fontFamily="monospace">VISTA SATELITAL — esquema</text>
                  )}

                  {lotesSVG.map((l) => {
                    const tropaEn = tropaEnLote(l.nombre);
                    const cant = tropaEn ? tropaEn._count?.animales ?? tropaEn.animales?.length ?? 0 : 0;
                    const legsLote = movsHoy.filter((m) => m.origenNombre === l.nombre || m.destinoNombre === l.nombre).length;
                    const descanso = diasDescansoLote(l.nombre, movimientos, tropas);
                    const tc = tropaEn ? colores[tropaEn.id] : null;
                    let fill = "#e2e8f077";
                    if (capa === "ocupacion") fill = tc ? tc + "55" : "#e2e8f077";
                    else if (capa === "cantidades") fill = tc ? tc + "33" : "#e2e8f077";
                    else if (capa === "descanso") fill = descanso === null ? "#e2e8f077" : descanso >= 21 ? "#16a34a55" : descanso >= 7 ? "#d9770655" : "#dc262655";
                    else if (capa === "raza") fill = tc ? tc + "33" : "#e2e8f077";
                    else if (capa === "rutaDia") fill = loteRutaSel === l.nombre ? "#3b82f655" : legsLote > 0 ? "#f59e0b33" : "#e2e8f055";
                    const raza = tropaEn ? razaPredominante(tropaEn) : null;
                    const dato =
                      capa === "ocupacion" ? (tropaEn ? `${tropaEn.nombre} · ${cant} cab.` : "Libre") :
                      capa === "cantidades" ? (tropaEn ? `${cant} cabezas asignadas` : "Sin animales asignados") :
                      capa === "descanso" ? (descanso === null ? "Sin registros de descanso" : descanso === 0 ? "Ocupado" : `${descanso} días de descanso`) :
                      capa === "raza" ? (raza || (tropaEn ? "Sin razas registradas" : "Sin hacienda")) :
                      legsLote > 0 ? `${legsLote} movimiento${legsLote === 1 ? "" : "s"} hoy` : "Sin movimientos hoy";
                    return (
                      <g
                        key={l.id}
                        onMouseEnter={() => setTooltip({ id: l.nombre, dato, x: l.cx, y: l.cy })}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={() => {
                          if (capa === "rutaDia") setLoteRutaSel((p) => (p === l.nombre ? null : l.nombre));
                          else if (tropaEn) abrirFicha(tropaEn);
                        }}
                        style={{ cursor: capa === "rutaDia" || tropaEn ? "pointer" : "default" }}
                      >
                        <polygon points={l.pts} fill={fill} stroke={satelital ? "#ffffffaa" : "#94a3b855"} strokeWidth={loteRutaSel === l.nombre ? 3 : 1.5} />
                        <text x={l.cx} y={l.cy + 4} textAnchor="middle" fontSize="10" fill={satelital ? "#ffffff" : "#475569"} fontWeight="500" opacity={satelital ? 0.9 : 0.7}>{l.nombre}</text>
                        {capa === "ocupacion" && tropaEn && tc && (
                          <g>
                            <rect x={l.cx - 30} y={l.cy - 26} width="60" height="16" rx="8" fill={tc} />
                            <text x={l.cx} y={l.cy - 15} textAnchor="middle" fontSize="8.5" fill="white" fontWeight="700">
                              {tropaEn.nombre.length > 11 ? tropaEn.nombre.slice(0, 10) + "…" : tropaEn.nombre}
                            </text>
                          </g>
                        )}
                        {capa === "cantidades" && tropaEn && (
                          <g>
                            <rect x={l.cx - 28} y={l.cy - 26} width="56" height="16" rx="8" fill="#1e293bdd" />
                            <text x={l.cx} y={l.cy - 15} textAnchor="middle" fontSize="9" fill="white" fontWeight="700">{cant} cab.</text>
                          </g>
                        )}
                        {capa === "descanso" && descanso !== null && (
                          <text x={l.cx} y={l.cy - 12} textAnchor="middle" fontSize="11" fontWeight="800" fill={descanso >= 21 ? "#15803d" : descanso >= 7 ? "#92400e" : "#991b1b"}>{descanso}d</text>
                        )}
                        {capa === "raza" && tropaEn && raza && (
                          <g>
                            <text x={l.cx} y={l.cy - 22} textAnchor="middle" fontSize="14">🐄</text>
                            <text x={l.cx} y={l.cy - 9} textAnchor="middle" fontSize="9" fontWeight="700" fill={satelital ? "#ffffff" : "#1e293b"}>{raza}</text>
                          </g>
                        )}
                        {capa === "rutaDia" && legsLote > 0 && (
                          <text x={l.cx} y={l.cy - 12} textAnchor="middle" fontSize="10" fontWeight="800" fill="#92400e">{legsLote} mov.</text>
                        )}
                      </g>
                    );
                  })}

                  {/* Capa Cantidades: 1 punto ≈ 1 animal */}
                  {capa === "cantidades" &&
                    tropas.map((t) => {
                      const l = t.lote?.nombre ? lotesSVG.find((x) => x.nombre === t.lote?.nombre) : null;
                      if (!l) return null;
                      const cant = t._count?.animales ?? t.animales?.length ?? 0;
                      if (!cant) return null;
                      return (
                        <g key={t.id} onClick={() => abrirFicha(t)} style={{ cursor: "pointer" }}>
                          {dotsDeTropa(l, cant).map((d, i) => (
                            <circle key={i} cx={d[0]} cy={d[1]} r="4" fill={colores[t.id]} stroke={selTropaId === t.id ? "white" : "transparent"} strokeWidth="1.5" opacity={selTropaId === t.id ? 1 : 0.75} />
                          ))}
                        </g>
                      );
                    })}

                  {/* Capa Ruta del Día */}
                  {capa === "rutaDia" && (
                    <g>
                      {Object.entries(externos).map(([nombre, p]) => (
                        <g key={nombre}>
                          <rect x={p.x - 38} y={p.y - 10} width="76" height="20" rx="10" fill="#475569" opacity="0.9" />
                          <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="8.5" fill="white" fontWeight="700">
                            {nombre.length > 15 ? nombre.slice(0, 14) + "…" : nombre}
                          </text>
                        </g>
                      ))}
                      {legsSel.map((m, i) => {
                        const p1 = puntoDeNombre(m.origenNombre);
                        const p2 = puntoDeNombre(m.destinoNombre);
                        if (!p1 || !p2) return null;
                        const col = colores[m.tropaId] || "#16a34a";
                        const done = m.estado === "Ejecutado";
                        return (
                          <g key={i}>
                            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={col} strokeWidth={m.estado === "En curso" ? 3 : 2} strokeDasharray={done ? "0" : "6,4"} opacity={m.estado === "En curso" ? 1 : 0.8} markerEnd={`url(#arrow-ruta-${i})`} />
                            <text x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill={col}>
                              {m.horario || ""} {m.tropa?.nombre || ""}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* Rosa de los vientos */}
                  <g transform="translate(515,65)">
                    <circle cx="0" cy="0" r="16" fill="white" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="0" y="-4" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1e293b">N</text>
                    <polygon points="0,-12 -4,2 0,-1 4,2" fill="#16a34a" />
                  </g>
                  <text x="115" y="450" fontSize="9" fill={satelital ? "#ffffffaa" : "#64748b"} fontStyle="italic">Mapa esquemático de lotes</text>
                </svg>
              )}

              {/* Tooltip */}
              {tooltip && lotes.length > 0 && (
                <div style={{ position: "absolute", left: `${((tooltip.x - 100) / 440) * 100}%`, top: `${((tooltip.y - 40) / 420) * 100}%`, transform: "translate(-50%,-120%)", background: "#1e293b", color: "white", padding: "6px 10px", borderRadius: 8, fontSize: 11, pointerEvents: "none", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(0,0,0,.25)", zIndex: 15 }}>
                  <span style={{ fontWeight: 800 }}>{tooltip.id}</span>
                  <span style={{ opacity: 0.85, marginLeft: 6 }}>{tooltip.dato}</span>
                </div>
              )}

              {/* Leyenda tropas */}
              {(capa === "cantidades" || capa === "ocupacion") && tropas.length > 0 && (
                <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.92)", padding: "10px 12px", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.08)", display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
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
