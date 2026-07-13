"use client";

// Tab Ganado: tabla completa del rodeo con filtros por tropa reales,
// filtro activos/inactivos, paginación, exportación CSV y vista Resumen
// con distribuciones (raza, categoría, edades, pesos) calculadas de los
// datos reales del hato.

import React, { useMemo, useState } from "react";
import { Icon, IABadge } from "@/components/mc";
import { AnimalRow, BajaInfo, TropaLite, nfES } from "./tipos";
import { ModalDarDeBaja } from "./animales-modales";

/* ============ Vista Resumen (distribuciones) ============ */

export function AnimGanadoResumen({ animales }: { animales: AnimalRow[] }) {
  const [hoveredRaza, setHoveredRaza] = useState<number | null>(null);
  const activos = animales.filter((a) => a.activo);
  const total = activos.length;

  // Distribución por raza (top 4 + Otros)
  const razas = useMemo(() => {
    const PALETA = [
      { color: "#0a5a24", light: "#22c55e" },
      { color: "#16a34a", light: "#4ade80" },
      { color: "#047857", light: "#34d399" },
      { color: "#475569", light: "#94a3b8" },
      { color: "#94a3b8", light: "#cbd5e1" },
    ];
    const acc = new Map<string, number>();
    activos.forEach((a) => acc.set(a.raza, (acc.get(a.raza) || 0) + 1));
    const sorted = Array.from(acc.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 4);
    const otros = sorted.slice(4).reduce((s, [, n]) => s + n, 0);
    const list = [...top, ...(otros > 0 ? ([["Otros", otros]] as [string, number][]) : [])];
    return list.map(([label, n], i) => ({
      label,
      n,
      pct: total > 0 ? Math.round((n / total) * 100) : 0,
      ...PALETA[i % PALETA.length],
    }));
  }, [activos, total]);

  // Distribución por categoría
  const categorias = useMemo(() => {
    const CFG: Record<string, { color: string; icon: string }> = {
      Vaca: { color: "#0a5a24", icon: "cow" },
      Novillo: { color: "#475569", icon: "beef" },
      Ternero: { color: "#84cc16", icon: "cow" },
      Ternera: { color: "#84cc16", icon: "cow" },
      Vaquillona: { color: "#16a34a", icon: "cow" },
      Toro: { color: "#1e3a5f", icon: "beef" },
    };
    const acc = new Map<string, number>();
    activos.forEach((a) => acc.set(a.categoria, (acc.get(a.categoria) || 0) + 1));
    return Array.from(acc.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, n]) => ({
        label: label === "Vaca" ? "Vacas en Producción" : label + "s",
        n,
        pct: total > 0 ? Math.round((n / total) * 1000) / 10 : 0,
        color: CFG[label]?.color || "#94a3b8",
        icon: CFG[label]?.icon || "cow",
      }));
  }, [activos, total]);
  const totalCat = categorias.reduce((s, c) => s + c.n, 0);

  // Distribución de edades
  const edades = useMemo(() => {
    const buckets = [
      { label: "< 1 año", min: 0, max: 12, color: "#84cc16" },
      { label: "1–2 años", min: 12, max: 24, color: "#4ade80" },
      { label: "2–4 años", min: 24, max: 48, color: "#16a34a" },
      { label: "4–7 años", min: 48, max: 84, color: "#0a5a24" },
      { label: "> 7 años", min: 84, max: Infinity, color: "#64748b" },
    ];
    return buckets.map((b) => ({
      ...b,
      n: activos.filter((a) => a.edadMeses !== null && a.edadMeses >= b.min && a.edadMeses < b.max).length,
    }));
  }, [activos]);
  const totalE = edades.reduce((s, e) => s + e.n, 0);
  const maxE = Math.max(1, ...edades.map((e) => e.n));
  const edadPromAnios = useMemo(() => {
    const con = activos.filter((a) => a.edadMeses !== null);
    if (con.length === 0) return null;
    return Math.round((con.reduce((s, a) => s + (a.edadMeses || 0), 0) / con.length / 12) * 10) / 10;
  }, [activos]);

  // Distribución de pesos
  const pesos = useMemo(() => {
    const buckets = [
      { label: "< 200", min: 0, max: 200, ideal: false },
      { label: "200–300", min: 200, max: 300, ideal: false },
      { label: "300–400", min: 300, max: 400, ideal: true },
      { label: "400–500", min: 400, max: 500, ideal: true },
      { label: "500–600", min: 500, max: 600, ideal: true },
      { label: "> 600", min: 600, max: Infinity, ideal: false },
    ];
    return buckets.map((b) => ({
      ...b,
      n: activos.filter((a) => a.pesoNum !== null && a.pesoNum >= b.min && a.pesoNum < b.max).length,
    }));
  }, [activos]);
  const maxP = Math.max(1, ...pesos.map((p) => p.n));
  const pesoProm = useMemo(() => {
    const con = activos.filter((a) => a.pesoNum !== null);
    if (con.length === 0) return null;
    return Math.round(con.reduce((s, a) => s + (a.pesoNum || 0), 0) / con.length);
  }, [activos]);
  const picoEdad = edades.reduce((best, e) => (e.n > best.n ? e : best), edades[0]);

  // Donut geometry
  const CX = 104, CY = 104, R_OUT = 90, R_IN = 56;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let cumDeg = -90;
  const arcs = razas
    .filter((rz) => rz.n > 0)
    .map((rz, idx) => {
      const deg = total > 0 ? (rz.n / total) * 360 : 0;
      const start = cumDeg;
      cumDeg += deg;
      const end = cumDeg - 0.6;
      const [x1, y1] = [CX + R_OUT * Math.cos(toRad(start)), CY + R_OUT * Math.sin(toRad(start))];
      const [x2, y2] = [CX + R_OUT * Math.cos(toRad(end)), CY + R_OUT * Math.sin(toRad(end))];
      const [xi1, yi1] = [CX + R_IN * Math.cos(toRad(start)), CY + R_IN * Math.sin(toRad(start))];
      const [xi2, yi2] = [CX + R_IN * Math.cos(toRad(end)), CY + R_IN * Math.sin(toRad(end))];
      const large = deg > 180 ? 1 : 0;
      const d = `M${x1.toFixed(2)},${y1.toFixed(2)} A${R_OUT},${R_OUT} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi2.toFixed(2)},${yi2.toFixed(2)} A${R_IN},${R_IN} 0 ${large},0 ${xi1.toFixed(2)},${yi1.toFixed(2)} Z`;
      return { ...rz, d, idx };
    });

  // Pesos histogram geometry
  const PW = 360, PHh = 148;
  const pPadL = 8, pPadR = 8, pPadT = 24, pPadB = 36;
  const pcW = PW - pPadL - pPadR;
  const pcH = PHh - pPadT - pPadB;
  const pBarGroup = pcW / pesos.length;
  const pBarW = pBarGroup * 0.58;
  const pbx = (i: number) => pPadL + i * pBarGroup + (pBarGroup - pBarW) / 2;
  const pbh = (n: number) => (n / maxP) * pcH;
  const pby = (n: number) => pPadT + pcH - pbh(n);
  const bellPts = pesos.map((p, i) => `${(pPadL + i * pBarGroup + pBarGroup / 2).toFixed(1)},${pby(p.n).toFixed(1)}`);
  const bellArea = `M${(pPadL + pBarGroup / 2).toFixed(1)},${pPadT + pcH} L${bellPts.join(" L")} L${(pPadL + (pesos.length - 0.5) * pBarGroup).toFixed(1)},${pPadT + pcH} Z`;

  if (total === 0) {
    return (
      <div className="mc-empty">
        <div className="mc-empty__icon"><Icon name="cow" size={20} /></div>
        <div style={{ fontWeight: 600 }}>Sin animales activos</div>
        <div className="text-xs mt-4">Registrá animales para ver la composición del rodeo.</div>
      </div>
    );
  }

  return (
    <div className="grid g-cols-2" style={{ gap: 16 }}>
      {/* 1. Raza */}
      <div className="mc-card" style={{ padding: 20 }}>
        <div className="mc-card__head" style={{ marginBottom: 16 }}>
          <div>
            <div className="mc-card__title">Distribución por Raza</div>
            <div className="text-xs text-muted mt-4">Composición racial del rodeo activo</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--mc-text-3)", fontWeight: 500 }}>{nfES(total)} animales</span>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flexShrink: 0 }}>
            <svg width={208} height={208} style={{ display: "block" }}>
              <defs>
                {arcs.map((a) => (
                  <linearGradient key={a.idx} id={`rz-g-${a.idx}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={a.color} />
                    <stop offset="100%" stopColor={a.light} stopOpacity="0.8" />
                  </linearGradient>
                ))}
                <filter id="seg-glow">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0a5a24" floodOpacity="0.35" />
                </filter>
              </defs>
              {arcs.map((a) => (
                <path
                  key={a.idx}
                  d={a.d}
                  fill={`url(#rz-g-${a.idx})`}
                  style={{ filter: hoveredRaza === a.idx || a.idx === 0 ? "url(#seg-glow)" : "none", transform: hoveredRaza === a.idx ? "scale(1.04)" : "scale(1)", transformOrigin: `${CX}px ${CY}px`, transition: "transform 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredRaza(a.idx)}
                  onMouseLeave={() => setHoveredRaza(null)}
                />
              ))}
              <circle cx={CX} cy={CY} r={R_IN - 4} fill="none" stroke="var(--mc-line)" strokeWidth="1" strokeDasharray="4,6" />
              <text x={CX} y={CY - 14} textAnchor="middle" fontSize="30" fontWeight="800" fill="var(--mc-ink)">{nfES(total)}</text>
              <text x={CX} y={CY + 7} textAnchor="middle" fontSize="10" fontWeight="700" fill="#94a3b8" letterSpacing="0.09em">CABEZAS</text>
              <text x={CX} y={CY + 23} textAnchor="middle" fontSize="9.5" fill="#b4bdb7">inventario activo</text>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 10 }}>
            {razas.map((rz, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: 8, background: hoveredRaza === i ? "var(--mc-green-50)" : "transparent", transition: "background 0.15s", cursor: "default" }} onMouseEnter={() => setHoveredRaza(i)} onMouseLeave={() => setHoveredRaza(null)}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: rz.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, flex: 1, color: "var(--mc-ink)", fontWeight: 500 }}>{rz.label}</span>
                <div style={{ width: 60, height: 5, borderRadius: 3, background: "var(--mc-line)", overflow: "hidden" }}>
                  <div style={{ width: `${rz.pct}%`, height: "100%", background: `linear-gradient(to right, ${rz.color}, ${rz.light})`, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: rz.color, minWidth: 30, textAlign: "right" }}>{rz.pct}%</span>
                <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 32, textAlign: "right" }}>{rz.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Categoría */}
      <div className="mc-card" style={{ padding: 20 }}>
        <div className="mc-card__head" style={{ marginBottom: 16 }}>
          <div>
            <div className="mc-card__title">Distribución por Categoría</div>
            <div className="text-xs text-muted mt-4">Cabezas por etapa productiva</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-ink)" }}>{nfES(totalCat)} cab.</span>
        </div>
        <div style={{ display: "flex", height: 36, borderRadius: 10, overflow: "hidden", gap: 2, marginBottom: 18 }}>
          {categorias.map((c, i) => (
            <div key={i} title={`${c.label}: ${c.n}`} style={{ flex: c.n, background: `linear-gradient(160deg, ${c.color}dd, ${c.color})`, minWidth: 6, cursor: "default", position: "relative" }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {categorias.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 22, display: "grid", placeItems: "center", color: c.color }}><Icon name={c.icon} size={18} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mc-ink)" }}>{c.label}</span>
                  <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{c.pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "var(--mc-line)", overflow: "hidden" }}>
                  <div style={{ width: `${totalCat > 0 ? (c.n / totalCat) * 100 : 0}%`, height: "100%", background: c.color, borderRadius: 3 }} />
                </div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: c.color, minWidth: 36, textAlign: "right" }}>{c.n}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: "9px 12px", background: "var(--mc-surface-2)", borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--mc-line)" }}>
          <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>Total inventario</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--mc-ink)" }}>{nfES(totalCat)} cabezas</span>
        </div>
      </div>

      {/* 3. Edades */}
      <div className="mc-card" style={{ padding: 20 }}>
        <div className="mc-card__head" style={{ marginBottom: 14 }}>
          <div>
            <div className="mc-card__title">Distribución de Edades</div>
            <div className="text-xs text-muted mt-4">Perfil etario del rodeo</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--mc-text-3)", fontWeight: 500 }}>{edadPromAnios !== null ? `Prom: ${edadPromAnios} años` : "Sin fechas de nacimiento"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {edades.map((e, i) => {
            const pct = totalE > 0 ? ((e.n / totalE) * 100).toFixed(1) : "0";
            const w = (e.n / maxE) * 100;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 62, fontSize: 11, color: "var(--mc-text-3)", flexShrink: 0, textAlign: "right", fontWeight: 500 }}>{e.label}</div>
                <div style={{ flex: 1, height: 26, background: "var(--mc-surface-3)", borderRadius: 7, overflow: "hidden", position: "relative" }}>
                  <div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg, ${e.color}bb, ${e.color})`, borderRadius: 7, display: "flex", alignItems: "center", paddingLeft: 10 }}>
                    {w > 25 && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>{e.n}</span>}
                  </div>
                  {w <= 25 && <span style={{ position: "absolute", left: `${w}%`, top: "50%", transform: "translate(6px,-50%)", fontSize: 11, fontWeight: 700, color: "var(--mc-ink)" }}>{e.n}</span>}
                </div>
                <span style={{ fontSize: 11, color: "var(--mc-text-3)", width: 36, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
        </div>
        {edadPromAnios !== null && (
          <div style={{ marginTop: 14, padding: "8px 14px", background: "var(--mc-green-50)", borderRadius: 9, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#16a34a", display: "grid", placeItems: "center" }}><Icon name="chart" size={20} /></span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{edadPromAnios} años</span>
              <span style={{ fontSize: 11, color: "var(--mc-text-3)", marginLeft: 6 }}>edad promedio · </span>
              <span style={{ fontSize: 11, color: edadPromAnios >= 4 && edadPromAnios <= 6 ? "#16a34a" : "var(--mc-amber)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>Objetivo 4–6 años {edadPromAnios >= 4 && edadPromAnios <= 6 && <Icon name="check" size={11} />}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>Rango dominante</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)" }}>{picoEdad.label} ({picoEdad.n})</div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Pesos */}
      <div className="mc-card" style={{ padding: 20 }}>
        <div className="mc-card__head" style={{ marginBottom: 10 }}>
          <div>
            <div className="mc-card__title">Distribución de Pesos</div>
            <div className="text-xs text-muted mt-4">Rangos de peso vivo actuales</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--mc-text-3)", fontWeight: 500 }}>{pesoProm !== null ? `Prom. ${pesoProm} kg` : "Sin pesadas"}</span>
        </div>
        {pesos.some((p) => p.n > 0) ? (
          <>
            <svg viewBox={`0 0 ${PW} ${PHh}`} width="100%" height={PHh} style={{ display: "block", overflow: "visible" }}>
              <defs>
                {pesos.map((p, i) => (
                  <linearGradient key={i} id={`pw-g-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={p.ideal ? "#0a5a24" : "#94a3b8"} stopOpacity="1" />
                    <stop offset="100%" stopColor={p.ideal ? "#16a34a" : "#cbd5e1"} stopOpacity="0.45" />
                  </linearGradient>
                ))}
              </defs>
              {[0, 0.33, 0.67, 1].map((f, gi) => (
                <line key={gi} x1={pPadL} y1={pPadT + pcH * f} x2={PW - pPadR} y2={pPadT + pcH * f} stroke={f === 1 ? "var(--mc-line-2)" : "var(--mc-line)"} strokeWidth={f === 1 ? 1.5 : 1} strokeDasharray={f === 0 || f === 1 ? "" : "3,4"} />
              ))}
              <path d={bellArea} fill="#0a5a24" fillOpacity="0.07" />
              {pesos.map((p, i) => {
                const x = pbx(i), y = pby(p.n), h = pbh(p.n), w = pBarW;
                const r = 4;
                const path = `M${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} L${x},${y + h} Z`;
                return (
                  <g key={i}>
                    <path d={path} fill={`url(#pw-g-${i})`} />
                    <text x={(pbx(i) + pBarW / 2).toFixed(1)} y={(pby(p.n) - 5).toFixed(1)} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={p.ideal ? "#0a5a24" : "#94a3b8"}>{p.n}</text>
                  </g>
                );
              })}
              <polyline points={bellPts.join(" ")} fill="none" stroke="#0a5a24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x={pbx(2)} y={pPadT} width={pbx(4) + pBarW - pbx(2)} height={pcH} fill="#0a5a24" fillOpacity="0.05" rx="3" />
              {pesos.map((p, i) => (
                <text key={i} x={(pPadL + i * pBarGroup + pBarGroup / 2).toFixed(1)} y={pPadT + pcH + 18} textAnchor="middle" fontSize="10" fill="#94a3b8">{p.label}</text>
              ))}
            </svg>
            <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "#0a5a24", display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>Rango óptimo (300–600 kg)</span>
              </div>
              {pesoProm !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 18, height: 2, background: "#c48410", borderRadius: 1 }} />
                  <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>Promedio rodeo: Ø {pesoProm} kg</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mc-empty" style={{ padding: 20 }}>
            <div style={{ fontSize: 12.5 }}>Registrá pesadas para ver la distribución de pesos.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ Tabla Ganado ============ */

const PAGE_SIZE = 10;

export function AnimGanado({
  animales,
  tropas,
  onVerDetalle,
  onAgregar,
  onDarDeBaja,
  onReactivar,
  onRecomendacionIA,
}: {
  animales: AnimalRow[];
  tropas: TropaLite[];
  onVerDetalle?: (a: AnimalRow) => void;
  onAgregar?: () => void;
  onDarDeBaja?: (dbId: string, datos: BajaInfo) => void;
  onReactivar?: (dbId: string) => void;
  onRecomendacionIA?: (a: AnimalRow) => void;
}) {
  const [vista, setVista] = useState<"Resumen" | "Tabla">("Tabla");
  const [filtroTropa, setFiltroTropa] = useState("Todos");
  const [filtroActivo, setFiltroActivo] = useState("Activos");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [bajaTarget, setBajaTarget] = useState<AnimalRow | null>(null);

  const filtrados = useMemo(() => {
    let list = animales;
    if (filtroActivo !== "Todos") list = list.filter((a) => (filtroActivo === "Activos" ? a.activo : !a.activo));
    if (filtroTropa !== "Todos") list = list.filter((a) => a.tropaId === filtroTropa);
    const q = filtroTexto.trim().toLowerCase();
    if (q) list = list.filter((a) => a.id.toLowerCase().includes(q) || (a.nombre || "").toLowerCase().includes(q) || a.categoria.toLowerCase().includes(q) || a.raza.toLowerCase().includes(q) || a.lote.toLowerCase().includes(q));
    return list;
  }, [animales, filtroActivo, filtroTropa, filtroTexto]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  const badgeColor: Record<string, string> = { green: "#16a34a", red: "#dc2626", amber: "#f59e0b", blue: "#3b82f6" };

  const exportar = () => {
    const head = "Caravana,Nombre,Categoría,Raza,Sexo,Edad,Peso,Producción,Estado,Lote\n";
    const rows = filtrados
      .map((a) => [a.id, a.nombre || "", a.categoria, a.raza, a.sexo, a.edad, a.peso, a.prod, a.estado, a.lote].join(","))
      .join("\n");
    const blob = new Blob([head + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "animales.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Chips de tropas: Todos + tropas reales (máx 3 visibles + selector)
  const tropaChips = tropas.slice(0, 3);
  const tropasExtra = tropas.slice(3);

  return (
    <>
      <div className="row gap-8" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="row gap-8" style={{ flexWrap: "wrap" }}>
          <div className="mc-seg">
            <button onClick={() => setVista("Resumen")} className={vista === "Resumen" ? "is-on" : ""}>Resumen</button>
            <button onClick={() => setVista("Tabla")} className={vista === "Tabla" ? "is-on" : ""}>Tabla</button>
          </div>
          {vista === "Tabla" && (
            <div className="mc-seg">
              <button onClick={() => { setFiltroTropa("Todos"); setPagina(1); }} className={filtroTropa === "Todos" ? "is-on" : ""}>Todos</button>
              {tropaChips.map((t) => (
                <button key={t.id} onClick={() => { setFiltroTropa(t.id); setPagina(1); }} className={filtroTropa === t.id ? "is-on" : ""}>{t.nombre}</button>
              ))}
              {tropasExtra.length > 0 && (
                <select
                  value={tropasExtra.some((t) => t.id === filtroTropa) ? filtroTropa : ""}
                  onChange={(e) => { if (e.target.value) { setFiltroTropa(e.target.value); setPagina(1); } }}
                  style={{ border: "none", background: "transparent", fontSize: 12.5, color: "var(--mc-text-2)", padding: "0 8px", cursor: "pointer" }}
                >
                  <option value="">Más…</option>
                  {tropasExtra.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              )}
            </div>
          )}
        </div>
        <div className="row gap-8" style={{ flexWrap: "wrap" }}>
          <div className="mc-seg">
            {["Activos", "Inactivos", "Todos"].map((f) => (
              <button key={f} onClick={() => { setFiltroActivo(f); setPagina(1); }} className={filtroActivo === f ? "is-on" : ""}>{f}</button>
            ))}
          </div>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setFiltrosOpen((o) => !o)}><Icon name="filter" size={13} />Filtros</button>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={exportar}><Icon name="download" size={13} />Exportar</button>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={onAgregar}><Icon name="plus" size={13} />Agregar</button>
        </div>
      </div>

      {filtrosOpen && vista === "Tabla" && (
        <div className="row" style={{ background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)", borderRadius: 10, padding: "8px 12px" }}>
          <Icon name="search" size={14} style={{ color: "var(--mc-text-3)" }} />
          <input value={filtroTexto} onChange={(e) => { setFiltroTexto(e.target.value); setPagina(1); }} placeholder="Buscar por caravana, nombre, categoría, raza o lote…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "inherit" }} />
          {filtroTexto && <button className="mc-icon-btn" style={{ width: 24, height: 24, border: "none" }} onClick={() => setFiltroTexto("")}><Icon name="x" size={12} /></button>}
        </div>
      )}

      {vista === "Resumen" && <AnimGanadoResumen animales={animales} />}
      {vista === "Tabla" && (
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="mc-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th style={{ minWidth: 60 }}>ID</th>
                  <th style={{ minWidth: 90 }}>Categoría</th>
                  <th style={{ minWidth: 80 }}>Raza</th>
                  <th style={{ width: 46, textAlign: "center" }}>Sexo</th>
                  <th style={{ width: 52 }}>Edad</th>
                  <th className="mc-cell--num" style={{ minWidth: 70 }}>Peso</th>
                  <th style={{ minWidth: 80 }}>Prod.</th>
                  <th style={{ minWidth: 100 }}>Estado</th>
                  <th style={{ minWidth: 90 }}>Lote</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={11}>
                      <div className="mc-empty" style={{ border: "none", margin: 10 }}>
                        <div style={{ fontWeight: 600 }}>Sin animales para mostrar</div>
                        <div className="text-xs mt-4">{animales.length === 0 ? "Agregá tu primer animal con el botón «Agregar»." : "Ajustá los filtros para ver resultados."}</div>
                      </div>
                    </td>
                  </tr>
                )}
                {visibles.map((a) => (
                  <tr key={a.dbId} style={{ opacity: a.activo === false ? 0.55 : 1 }}>
                    <td>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: a.ok ? "#dcfce7" : "#fee2e2", display: "grid", placeItems: "center" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.ok ? "#16a34a" : "#dc2626" }}></div>
                      </div>
                    </td>
                    <td className="mc-cell--mono" style={{ fontWeight: 600, color: "var(--mc-ink)" }}>{a.id}</td>
                    <td className="mc-cell--emph">{a.categoria}</td>
                    <td>{a.raza}</td>
                    <td style={{ textAlign: "center" }}>
                      {a.sexo === "M" ? <span title="Macho" style={{ color: "#3b82f6", fontWeight: 700, fontSize: 12 }}>M</span> : <span title="Hembra" style={{ color: "#ec4899", fontWeight: 700, fontSize: 12 }}>H</span>}
                    </td>
                    <td>{a.edad}</td>
                    <td className="mc-cell--num">{a.peso !== "N/A" ? `${a.peso} kg` : "N/A"}</td>
                    <td style={{ color: a.prod !== "—" ? "var(--mc-ink)" : "#9ca3af", fontSize: 12 }}>{a.prod}</td>
                    <td>
                      {a.activo === false ? (
                        <span style={{ padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "var(--mc-line)", color: "var(--mc-text-2)" }}>Baja</span>
                      ) : (
                        <span style={{ padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: badgeColor[a.estadoC] + "18", color: badgeColor[a.estadoC] }}>{a.estado}</span>
                      )}
                    </td>
                    <td style={{ color: "#6b7280", fontSize: 12 }}>{a.lote}</td>
                    <td>
                      <div className="row gap-6">
                        <button className="mc-icon-btn" title="Ver detalle" onClick={() => onVerDetalle && onVerDetalle(a)} style={{ width: 28, height: 28, border: "1px solid var(--mc-line)", borderRadius: 7 }}>
                          <Icon name="eye" size={13} />
                        </button>
                        {a.activo === false ? (
                          <button className="mc-icon-btn" title="Reactivar" onClick={() => onReactivar && onReactivar(a.dbId)} style={{ width: 28, height: 28, border: "1px solid #16a34a", borderRadius: 7, color: "#16a34a", background: "transparent" }}>
                            <Icon name="refresh" size={13} />
                          </button>
                        ) : (
                          <button className="mc-icon-btn" title="Dar de baja" onClick={() => setBajaTarget(a)} style={{ width: 28, height: 28, border: "1px solid #dc2626", borderRadius: 7, color: "#dc2626", background: "transparent" }}>
                            <Icon name="trash" size={13} />
                          </button>
                        )}
                        <div title="Diagnóstico IA" onClick={() => onRecomendacionIA && onRecomendacionIA(a)} style={{ width: 28, height: 28, borderRadius: 8, padding: 2, background: "linear-gradient(135deg,#FF9D00,#00FF00)", cursor: "pointer" }}>
                          <div style={{ width: "100%", height: "100%", borderRadius: 6, background: "var(--mc-surface)", display: "grid", placeItems: "center" }}>
                            <IABadge />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)" }} className="row">
            <div className="text-xs text-muted">Mostrando {visibles.length} de {nfES(filtrados.length)}</div>
            <div style={{ flex: 1 }}></div>
            {totalPaginas > 1 && (
              <div className="mc-seg">
                <button onClick={() => setPagina((p) => Math.max(1, p - 1))}>&lt;</button>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const start = Math.max(1, Math.min(paginaActual - 2, totalPaginas - 4));
                  const n = start + i;
                  if (n > totalPaginas) return null;
                  return (
                    <button key={n} className={n === paginaActual ? "is-on" : ""} onClick={() => setPagina(n)}>{n}</button>
                  );
                })}
                <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}>&gt;</button>
              </div>
            )}
          </div>
        </div>
      )}
      {bajaTarget && (
        <ModalDarDeBaja
          animal={bajaTarget}
          onClose={() => setBajaTarget(null)}
          onConfirmar={(datosBaja) => {
            onDarDeBaja && onDarDeBaja(bajaTarget.dbId, datosBaja);
            setBajaTarget(null);
          }}
        />
      )}
    </>
  );
}
