"use client";

// Tab Resumen de Animales: evolución del hato (serie real de altas/bajas),
// calendario sanitario (vencimientos reales) y atención prioritaria
// (tratamientos activos + alertas sanitarias reales).

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/mc";
import { AnimalRow, TratamientoAPI, fmtFecha, nfES } from "./tipos";

type PuntoEvol = {
  m: number;
  y: number;
  total: number;
  categorias: Record<string, number>;
  razas: Record<string, number>;
};

export type AlertaSanitariaAPI = {
  id: string;
  tipo: string;
  severidad: string;
  titulo: string;
  descripcion: string;
  estado: string;
  fechaLimite?: string | null;
  numeroAfectados?: number;
};

const MESES_ABR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_FULL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function AnimResumen({
  animales,
  tratamientos,
  alertas,
  onVerDetalle,
  onVerSanidad,
}: {
  animales: AnimalRow[];
  tratamientos: TratamientoAPI[];
  alertas: AlertaSanitariaAPI[];
  onVerDetalle?: (a: AnimalRow) => void;
  onVerSanidad?: () => void;
}) {
  const [rango, setRango] = useState("12M");
  const [vista, setVista] = useState<"Categoria" | "Raza">("Categoria");
  const [focusSerie, setFocusSerie] = useState<string | null>(null);
  const [hovEvol, setHovEvol] = useState<{ x: number; yTotal: number; d: PuntoEvol; counts: Record<string, number>; pct: number } | null>(null);
  const [serie, setSerie] = useState<PuntoEvol[]>([]);
  const evolRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    fetch("/api/animales/evolucion?meses=24")
      .then((r) => (r.ok ? r.json() : { serie: [] }))
      .then((d) => setSerie(d.serie || []))
      .catch(() => {});
  }, [animales.length]);

  const rangoN = rango === "6M" ? 6 : rango === "12M" ? 12 : 24;
  const evolData = serie.slice(-rangoN);

  // Claves (categorías/razas) más representativas de la serie
  const serieKeys = useMemo(() => {
    const acc = new Map<string, number>();
    for (const p of evolData) {
      const src = vista === "Categoria" ? p.categorias : p.razas;
      for (const [k, v] of Object.entries(src)) acc.set(k, (acc.get(k) || 0) + v);
    }
    return Array.from(acc.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
  }, [evolData, vista]);

  const PALETA = ["var(--mc-green-800)", "var(--mc-green-600)", "var(--mc-green-400)", "var(--mc-green-200)", "var(--mc-orange-500)"];
  const serieColors: Record<string, string> = {};
  serieKeys.forEach((k, i) => (serieColors[k] = PALETA[i % PALETA.length]));

  const breakdownData = evolData.map((p) => {
    const src = vista === "Categoria" ? p.categorias : p.razas;
    const counts: Record<string, number> = {};
    serieKeys.forEach((k) => (counts[k] = src[k] || 0));
    return counts;
  });

  const EW = 580, EH = 210, ePadL = 46, ePadR = 20, ePadT = 20, ePadB = 30;
  const eChartW = EW - ePadL - ePadR;
  const eChartH = EH - ePadT - ePadB;
  // Techo del eje "redondo" con un poco de aire sobre el máximo real. Sin metas
  // inventadas: la escala se adapta al tamaño real del rodeo.
  const totalMax = useMemo(() => {
    const dataMax = Math.max(1, ...evolData.map((d) => d.total));
    const conAire = Math.ceil(dataMax * 1.15);
    if (conAire <= 4) return 4;
    if (conAire <= 10) return Math.ceil(conAire / 2) * 2;
    const step = Math.pow(10, Math.floor(Math.log10(conAire))) / 2;
    return Math.ceil(conAire / step) * step;
  }, [evolData]);
  const exStep = evolData.length > 1 ? eChartW / (evolData.length - 1) : eChartW;
  const ex = (i: number) => ePadL + i * exStep;
  const eyTotal = (v: number) => ePadT + eChartH - (v / totalMax) * eChartH;

  const stacks = breakdownData.map((counts) => {
    let acc = 0;
    return serieKeys.map((k) => {
      acc += counts[k];
      return acc;
    });
  });

  const bandPath = (si: number) => {
    const topPts = evolData.map((d, i) => [ex(i), eyTotal(stacks[i][si])]);
    const botPts = evolData.map((d, i) => [ex(i), si === 0 ? eyTotal(0) : eyTotal(stacks[i][si - 1])]);
    const top = topPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const bot = botPts.slice().reverse().map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    return `${top} ${bot} Z`;
  };

  const totalPath = evolData.map((d, i) => `${i === 0 ? "M" : "L"}${ex(i).toFixed(1)},${eyTotal(d.total).toFixed(1)}`).join(" ");
  const evolLabelStep = Math.max(1, Math.ceil(evolData.length / 8));

  const onEvolMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = evolRef.current;
    if (!svg || evolData.length === 0) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * EW;
    let idx = Math.round((px - ePadL) / exStep);
    idx = Math.max(0, Math.min(evolData.length - 1, idx));
    const d = evolData[idx];
    setHovEvol({ x: ex(idx), yTotal: eyTotal(d.total), d, counts: breakdownData[idx], pct: (ex(idx) / EW) * 100 });
  };

  // ── Calendario sanitario real: alertas con fechaLimite + próximas dosis ──
  const calendarioData = useMemo(() => {
    const items: { evento: string; vence: string; prioridad: string; color: string; fecha: number }[] = [];
    const hoy = new Date().getTime();
    for (const al of alertas) {
      if (al.estado === "Completada") continue;
      const f = al.fechaLimite ? new Date(al.fechaLimite).getTime() : null;
      const dias = f ? Math.ceil((f - hoy) / (24 * 3600 * 1000)) : null;
      items.push({
        evento: al.titulo,
        vence: f ? (dias !== null && dias <= 0 ? "Vencido" : dias === 1 ? "Mañana" : fmtFecha(al.fechaLimite)) : "Sin fecha",
        prioridad: al.severidad === "Crítica" || (dias !== null && dias <= 1) ? "urgente" : al.severidad === "Alta" ? "pendiente" : "programado",
        color: al.severidad === "Crítica" || (dias !== null && dias <= 1) ? "#dc2626" : al.severidad === "Alta" ? "#f59e0b" : "#16a34a",
        fecha: f || Number.MAX_SAFE_INTEGER,
      });
    }
    for (const t of tratamientos) {
      if (t.proximaDosis) {
        items.push({
          evento: `Dosis ${t.medicamento || t.diagnostico} · ${t.animal ? "#" + t.animal.caravana.replace(/^#/, "") : ""}`,
          vence: fmtFecha(t.proximaDosis),
          prioridad: new Date(t.proximaDosis).getTime() < hoy + 24 * 3600 * 1000 ? "urgente" : "pendiente",
          color: new Date(t.proximaDosis).getTime() < hoy + 24 * 3600 * 1000 ? "#dc2626" : "#f59e0b",
          fecha: new Date(t.proximaDosis).getTime(),
        });
      }
    }
    const completados = tratamientos
      .filter((t) => t.estado === "Completado")
      .slice(0, 1)
      .map((t) => ({ evento: `${t.tipo}: ${t.diagnostico}`, vence: "Completado", prioridad: "completado", color: "#6b7280", fecha: Number.MAX_SAFE_INTEGER }));
    return [...items.sort((a, b) => a.fecha - b.fecha).slice(0, 4), ...completados].slice(0, 5);
  }, [alertas, tratamientos]);

  // ── Atención prioritaria real ──
  const atencionData = useMemo(() => {
    const items: { nombre: string; estado: string; color: string; detalle: string; row?: AnimalRow }[] = [];
    for (const t of tratamientos.filter((t) => ["En curso", "En retiro"].includes(t.estado))) {
      const row = animales.find((a) => a.dbId === (t.animal?.id || ""));
      items.push({
        nombre: `Caravana #${(t.animal?.caravana || "").replace(/^#/, "")}`,
        estado: t.severidad === "Grave" ? "Urgente" : t.estado === "En retiro" ? "Retiro" : "Tratam.",
        color: t.severidad === "Grave" ? "#dc2626" : t.estado === "En retiro" ? "#f59e0b" : "#3b82f6",
        detalle: t.diagnostico,
        row,
      });
    }
    for (const al of alertas.filter((a) => a.estado !== "Completada").slice(0, 4)) {
      items.push({
        nombre: al.titulo,
        estado: al.severidad,
        color: al.severidad === "Crítica" ? "#dc2626" : al.severidad === "Alta" ? "#f59e0b" : "#6b7280",
        detalle: al.descripcion?.slice(0, 40) || al.tipo,
      });
    }
    // Nacidos hoy
    for (const a of animales) {
      if (a.fechaNacimiento && new Date().getTime() - new Date(a.fechaNacimiento).getTime() < 24 * 3600 * 1000) {
        items.push({ nombre: `Ternero ${a.id}`, estado: "Nuevo", color: "#16a34a", detalle: "Nacido hoy", row: a });
      }
    }
    return items.slice(0, 9);
  }, [tratamientos, alertas, animales]);

  const criticos = atencionData.filter((a) => a.color === "#dc2626").length;
  const revisar = atencionData.filter((a) => a.color === "#f59e0b").length;
  const seguimiento = atencionData.filter((a) => a.color === "#3b82f6").length;

  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0, 2.8fr) minmax(220px, 1fr)", gap: 12 }}>
      <div className="col gap-16">
        {/* Evolución de Ganado */}
        <div className="mc-card" style={{ padding: 0, overflow: "visible" }}>
          <div className="mc-card__head" style={{ padding: "16px 20px 10px", marginBottom: 0, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div className="mc-card__title">Evolución de Ganado</div>
              <div className="text-xs text-muted mt-4">Inventario histórico por categoría o raza</div>
            </div>
            <div className="row gap-8" style={{ flexWrap: "wrap" }}>
              <div className="mc-seg">
                {(["Categoria", "Raza"] as const).map((v) => (
                  <button key={v} className={vista === v ? "is-on" : ""} onClick={() => { setVista(v); setFocusSerie(null); }}>{v === "Categoria" ? "Por Categoría" : "Por Raza"}</button>
                ))}
              </div>
              <div className="mc-seg">
                {["6M", "12M", "24M"].map((r) => (
                  <button key={r} className={rango === r ? "is-on" : ""} onClick={() => setRango(r)}>{r}</button>
                ))}
              </div>
            </div>
          </div>
          {evolData.length > 1 && evolData.some((d) => d.total > 0) ? (
            <>
              <div style={{ position: "relative", padding: "0 4px 6px" }}>
                <svg ref={evolRef} viewBox={`0 0 ${EW} ${EH}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible", cursor: "crosshair" }} onMouseMove={onEvolMove} onMouseLeave={() => setHovEvol(null)}>
                  {[0, 0.25, 0.5, 0.75, 1].map((f, gi) => {
                    const v = Math.round(totalMax * (1 - f));
                    const y = ePadT + eChartH * f;
                    return (
                      <g key={gi}>
                        <line x1={ePadL} y1={y} x2={EW - ePadR} y2={y} stroke="var(--mc-line)" strokeWidth={f === 1 ? 1.4 : 1} strokeDasharray={f === 1 ? "" : "3,3"} />
                        <text x={ePadL - 6} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="var(--mc-text-3)">{v}</text>
                      </g>
                    );
                  })}

                  {evolData.map((d, i) => (i % evolLabelStep === 0 || i === evolData.length - 1) && (
                    <text key={i} x={ex(i)} y={EH - ePadB + 16} textAnchor="middle" fontSize="9.5" fill={i === evolData.length - 1 ? "var(--mc-green-600)" : "var(--mc-text-3)"} fontWeight={i === evolData.length - 1 ? "700" : "400"}>
                      {i === evolData.length - 1 ? "Hoy" : MESES_ABR[d.m]}
                    </text>
                  ))}

                  {serieKeys.map((k, si) => (
                    <path key={k} d={bandPath(si)} fill={serieColors[k]} opacity={!focusSerie || focusSerie === k ? 0.88 : 0.1} style={{ transition: "opacity 0.2s" }} />
                  ))}

                  <path d={totalPath} fill="none" stroke="var(--mc-green-700)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={ex(evolData.length - 1)} cy={eyTotal(evolData[evolData.length - 1].total)} r="5" fill="var(--mc-green-700)" stroke="white" strokeWidth="2" />

                  {hovEvol && (
                    <g>
                      <line x1={hovEvol.x} y1={ePadT} x2={hovEvol.x} y2={ePadT + eChartH} stroke="var(--mc-ink)" strokeWidth="1" opacity="0.12" />
                      <circle cx={hovEvol.x} cy={hovEvol.yTotal} r="4" fill="var(--mc-green-700)" stroke="white" strokeWidth="1.5" />
                    </g>
                  )}
                </svg>

                {hovEvol && (
                  <div style={{ position: "absolute", top: 6, left: `${Math.min(Math.max(hovEvol.pct, 10), 80)}%`, transform: "translateX(-50%)", background: "var(--mc-ink)", color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 11.5, pointerEvents: "none", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.22)", zIndex: 10 }}>
                    <div style={{ fontWeight: 700 }}>{MESES_FULL[hovEvol.d.m]} {hovEvol.d.y} · Total: {nfES(hovEvol.d.total)} cabezas</div>
                    <div style={{ opacity: 0.85, marginTop: 2 }}>
                      {serieKeys.map((k, i) => (
                        <span key={k}>{k}: {nfES(hovEvol.counts[k] || 0)}{i < serieKeys.length - 1 ? " · " : ""}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="row gap-10 mt-4" style={{ flexWrap: "wrap", padding: "0 20px 14px", alignItems: "center" }}>
                {serieKeys.map((k) => {
                  const current = breakdownData[breakdownData.length - 1]?.[k] || 0;
                  const active = !focusSerie || focusSerie === k;
                  return (
                    <button key={k} type="button" onClick={() => setFocusSerie((f) => (f === k ? null : k))} className="row gap-6" style={{ alignItems: "center", fontSize: 11, background: "none", border: "none", cursor: "pointer", padding: "3px 6px", borderRadius: 6, opacity: active ? 1 : 0.4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: serieColors[k], display: "inline-block", flexShrink: 0 }} />
                      <span style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{k}</span>
                      <span style={{ color: "var(--mc-text-3)" }}>{nfES(current)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="mc-empty" style={{ margin: "0 20px 16px" }}>
              <div className="mc-empty__icon"><Icon name="cow" size={20} /></div>
              <div style={{ fontWeight: 600 }}>Todavía no hay animales registrados</div>
              <div className="text-xs mt-4">Agregá tu primer animal para ver la evolución del hato.</div>
            </div>
          )}
        </div>

        {/* Calendario Sanitario */}
        <div className="mc-card">
          <div className="mc-card__head">
            <div>
              <div className="mc-card__title">Calendario Sanitario</div>
              <div className="text-xs text-muted mt-4">Próximos vencimientos y aplicaciones</div>
            </div>
            <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVerSanidad}><Icon name="calendar" size={13} /> Ver sanidad</button>
          </div>
          {calendarioData.length === 0 ? (
            <div className="mc-empty" style={{ padding: 24 }}>
              <div style={{ fontSize: 12.5 }}>Sin vencimientos sanitarios programados.</div>
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 28 }}>
              <div style={{ position: "absolute", left: 10, top: 12, bottom: 12, width: 2, background: "linear-gradient(to bottom, #dc2626, #16a34a)", borderRadius: 1, opacity: 0.25 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {calendarioData.map((ev, i) => (
                  <div key={i} style={{ position: "relative", paddingBottom: i < calendarioData.length - 1 ? 14 : 0 }}>
                    <div style={{ position: "absolute", left: -23, top: 12, width: 14, height: 14, borderRadius: "50%", background: ev.prioridad === "completado" ? "var(--mc-line)" : ev.color, border: `2px solid ${ev.prioridad === "completado" ? "var(--mc-line-2)" : ev.color}`, boxShadow: ev.prioridad === "urgente" ? `0 0 0 4px ${ev.color}22` : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {ev.prioridad === "completado" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8" }} />}
                      {ev.prioridad === "urgente" && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <div style={{ padding: "11px 14px", background: ev.prioridad === "urgente" ? "#fef2f2" : ev.prioridad === "completado" ? "var(--mc-surface-2)" : "var(--mc-surface)", borderRadius: 10, border: `1px solid ${ev.prioridad === "urgente" ? "#fecaca" : "var(--mc-line)"}`, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: ev.prioridad === "completado" ? "var(--mc-text-3)" : "var(--mc-ink)", textDecoration: ev.prioridad === "completado" ? "line-through" : "none" }}>{ev.evento}</div>
                        <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 2 }}>
                          {ev.prioridad === "completado" ? "Completado" : `Vence: ${ev.vence}`}
                        </div>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: ev.color + "18", color: ev.color, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>{ev.prioridad}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Atención Prioritaria */}
      <div className="mc-card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--mc-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mc-ink)" }}>Atención Prioritaria</div>
            <div style={{ fontSize: 11, color: "var(--mc-text-3)", marginTop: 1 }}>{atencionData.length} ítems · {criticos} críticos</div>
          </div>
          <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVerSanidad}>Ver todos</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {atencionData.length === 0 && (
            <div className="mc-empty" style={{ padding: 20, border: "none" }}>
              <div style={{ fontSize: 12.5 }}>Sin animales que requieran atención.</div>
            </div>
          )}
          {atencionData.map((a, i) => (
            <div
              key={i}
              onClick={() => a.row && onVerDetalle && onVerDetalle(a.row)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: i < 2 ? a.color + "0a" : "var(--mc-surface-2)", borderRadius: 9, border: `1px solid ${i < 2 ? a.color + "30" : "var(--mc-line)"}`, cursor: a.row ? "pointer" : "default", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = a.color + "15"; e.currentTarget.style.borderColor = a.color + "50"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = i < 2 ? a.color + "0a" : "var(--mc-surface-2)"; e.currentTarget.style.borderColor = i < 2 ? a.color + "30" : "var(--mc-line)"; }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: i < 2 ? a.color : "var(--mc-line)", color: i < 2 ? "#fff" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{i + 1}</div>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: a.color + "15", color: a.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="cow" size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mc-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nombre}</div>
                <div style={{ fontSize: 11, color: "var(--mc-text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.detalle}</div>
              </div>
              <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: a.color + "18", color: a.color, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{a.estado}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--mc-line)", display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { n: criticos, l: "críticos", c: "#dc2626" },
            { n: revisar, l: "para revisar", c: "#f59e0b" },
            { n: seguimiento, l: "en seguimiento", c: "#3b82f6" },
          ].map((s) => (
            <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.c }} />
              <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{s.n} {s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
