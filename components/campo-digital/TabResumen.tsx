"use client";

import React, { useEffect, useState } from "react";
import { Icon, KPI } from "@/components/mc";
import { demo } from "@/lib/demo";

/* ========== TAB RESUMEN (Figma CDResumen) ========== */
export default function TabResumen({ onNavigateTab }: { onNavigateTab?: (t: string) => void }) {
  const [kpis, setKpis] = useState(
    demo(
      { ha: "558 Ha", sembradas: "426 / 558", labores: "17", atrasadas: "3 atrasadas" },
      { ha: "0 Ha", sembradas: "0 / 0", labores: "0", atrasadas: "0 atrasadas" }
    )
  );

  useEffect(() => {
    fetch("/api/lotes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        const total = d.reduce((s: number, l: { hectareas?: number }) => s + (l.hectareas || 0), 0);
        const semb = d.filter((l: { cultivo?: string }) => l.cultivo).reduce((s: number, l: { hectareas?: number }) => s + (l.hectareas || 0), 0);
        setKpis((p) => ({ ...p, ha: `${Math.round(total)} Ha`, sembradas: `${Math.round(semb)} / ${Math.round(total)}` }));
      })
      .catch(() => {});
    fetch("/api/labores")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        const pend = d.filter((l: { estado?: string }) => l.estado !== "Completada").length;
        const atr = d.filter((l: { estado?: string }) => l.estado === "Atrasada").length;
        setKpis((p) => ({ ...p, labores: String(pend), atrasadas: `${atr} atrasadas` }));
      })
      .catch(() => {});
  }, []);

  const focos = demo(
    [
      { nivel: "red" as const, titulo: "Plaga: chinche verde", lote: "Lote Norte 1 · Soja", detail: "Sup. umbral · acción inmediata", icon: "alert", tab: "Detección de Enfermedades (IA)" },
      { nivel: "orange" as const, titulo: "Stress hídrico", lote: "Lote Este 1 · Maíz", detail: "NDVI -8% en 7d · agua útil 42%", icon: "droplet", tab: "Lotes" },
      { nivel: "amber" as const, titulo: "Enfermedad detectada", lote: "Lote Sur 1 · Trigo", detail: "Mancha foliar · IA 81% conf.", icon: "leaf", tab: "Detección de Enfermedades (IA)" },
      { nivel: "amber" as const, titulo: "Labor atrasada", lote: "Lote Sur 2", detail: "Fertilización · 2d de atraso", icon: "wrench", tab: "Labores" },
      { nivel: "blue" as const, titulo: "Cosecha lista", lote: "Lote Este 1 · Maíz", detail: "Humedad 14.5% · ventana óptima", icon: "check", tab: "Cultivos" },
    ],
    [] as { nivel: "red" | "orange" | "amber" | "blue"; titulo: string; lote: string; detail: string; icon: string; tab: string }[]
  );

  return (
    <>
      <div className="grid g-cols-5">
        <KPI label="Hectáreas totales" value={kpis.ha} delta={demo("+3.2% vs campaña ant.", "—")} trend="up" icon="map" accent />
        <KPI label="Hectáreas sembradas" value={kpis.sembradas} delta={demo("76% de ocupación", "—")} trend="up" icon="sprout" />
        <KPI label="Siembras programadas" value={demo("3", "0")} delta={demo("Próx. 22 abr · Trigo", "—")} trend="up" icon="calendar" />
        <KPI label="Labores próximas" value={kpis.labores} delta={kpis.atrasadas} trend="warn" icon="wrench" />
        <KPI label="Alertas sanitarias" value={demo("2", "0")} delta={demo("Chinche + mancha", "—")} trend="warn" icon="alert" warn />
      </div>

      <PlantacionesCard />

      <div className="grid" style={{ gridTemplateColumns: "1.1fr 1fr", gap: 14 }}>
        <UltimasActividadesCard onVerTodo={() => onNavigateTab?.("Labores")} />
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Focos de atención</div>
            <span className="mc-badge mc-badge--orange">{focos.length}</span>
          </div>
          <div className="col gap-8">
            {focos.length === 0 ? (
              <div className="text-sm text-muted" style={{ padding: "18px 4px" }}>Sin focos de atención.</div>
            ) : (
              focos.map((f, i) => (
                <FocoRow key={i} nivel={f.nivel} titulo={f.titulo} lote={f.lote} detail={f.detail} icon={f.icon} onClick={() => onNavigateTab?.(f.tab)} />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PlantacionesCard() {
  const [mode, setMode] = useState<"ha" | "lotes" | "pct">("ha");
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div>
          <div className="mc-card__eyebrow">Distribución del campo · campaña 25/26</div>
          <div className="mc-card__title mt-4">Tipos de plantaciones</div>
        </div>
        <div className="row gap-12">
          <div style={{ textAlign: "right" }}>
            <div className="text-xs text-muted">Total productivo</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)" }}>{demo("558 Ha", "0 Ha")}</div>
          </div>
          <div className="mc-seg">
            <button className={mode === "ha" ? "is-on" : ""} onClick={() => setMode("ha")}>Hectáreas</button>
            <button className={mode === "lotes" ? "is-on" : ""} onClick={() => setMode("lotes")}>Lotes</button>
            <button className={mode === "pct" ? "is-on" : ""} onClick={() => setMode("pct")}>%</button>
          </div>
        </div>
      </div>
      <BarChartPlantaciones mode={mode} />
    </div>
  );
}

function BarChartPlantaciones({ mode }: { mode: "ha" | "lotes" | "pct" }) {
  const data = demo(
    [
      { nombre: "Maíz", ha: 205, lotes: 8, color: "#d9a538" },
      { nombre: "Soja", ha: 157, lotes: 6, color: "#768f44" },
      { nombre: "Trigo", ha: 64, lotes: 3, color: "#a88032" },
      { nombre: "Alfalfa", ha: 42, lotes: 2, color: "#aabd76" },
      { nombre: "Girasol", ha: 0, lotes: 0, color: "#e8b94a" },
      { nombre: "Trébol", ha: 0, lotes: 0, color: "#7bc77e" },
      { nombre: "En descanso", ha: 60, lotes: 2, color: "#d5d9d2" },
      { nombre: "Vacío", ha: 30, lotes: 1, color: "#e8e6e0" },
    ],
    [] as { nombre: string; ha: number; lotes: number; color: string }[]
  );
  const totalHa = demo(558, 1);
  const getValue = (d: (typeof data)[0]) => (mode === "ha" ? d.ha : mode === "lotes" ? d.lotes : Math.round((d.ha / totalHa) * 100));
  const getLabel = (d: (typeof data)[0]) => (mode === "ha" ? String(d.ha) : mode === "lotes" ? String(d.lotes) : `${Math.round((d.ha / totalHa) * 100)}%`);
  const ytConfig = {
    ha: { ticks: [0, 60, 120, 180, 240], max: 240, label: "Hectáreas" },
    lotes: { ticks: [0, 2, 4, 6, 8, 10], max: 10, label: "Lotes" },
    pct: { ticks: [0, 10, 20, 30, 40], max: 40, label: "% del campo" },
  };
  const { ticks: yticks, max, label: axisLabel } = ytConfig[mode];
  const W = 1400, H = 260, padL = 50, padR = 16, padT = 16, padB = 50;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  if (data.length === 0) {
    return (
      <div style={{ padding: "40px 4px", textAlign: "center" }} className="text-sm text-muted">
        Sin plantaciones registradas.
      </div>
    );
  }

  const groupW = innerW / data.length;
  const barW = groupW * 0.55;

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        <defs>
          {data.map((d, i) => (
            <linearGradient key={i} id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={d.color} stopOpacity="1" />
              <stop offset="100%" stopColor={d.color} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>
        {yticks.map((v, i) => {
          const y = padT + innerH * (1 - v / max);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--mc-line)" strokeDasharray={i === 0 ? "0" : "3,4"} />
              <text x={padL - 10} y={y + 4} fontSize="11" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="end">{v}</text>
            </g>
          );
        })}
        <text x={padL - 36} y={padT + innerH / 2} fontSize="11" fontFamily="var(--ff-ui)" fill="var(--mc-text-3)" textAnchor="middle" transform={`rotate(-90, ${padL - 36}, ${padT + innerH / 2})`}>{axisLabel}</text>

        {data.map((d, i) => {
          const v = getValue(d);
          const gx = padL + i * groupW;
          const bx = gx + (groupW - barW) / 2;
          const bh = v > 0 ? (v / max) * innerH : 0;
          const by = padT + innerH - bh;
          return (
            <g key={d.nombre}>
              {v > 0 && (
                <>
                  <rect x={bx} y={by} width={barW} height={bh} fill={`url(#bg${i})`} rx="6" ry="6" />
                  <rect x={bx} y={by} width={barW} height={4} fill={d.color} rx="6" ry="6" opacity="0.8" />
                  <text x={bx + barW / 2} y={by - 8} fontSize="13" fontFamily="var(--ff-display)" fontWeight="700" fill="var(--mc-ink)" textAnchor="middle">{getLabel(d)}</text>
                </>
              )}
              {v === 0 && (
                <text x={bx + barW / 2} y={padT + innerH - 8} fontSize="11" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="middle">—</text>
              )}
              <text x={gx + groupW / 2} y={H - 24} fontSize="13" fontFamily="var(--ff-ui)" fontWeight="600" fill="var(--mc-text)" textAnchor="middle">{d.nombre}</text>
              <text x={gx + groupW / 2} y={H - 8} fontSize="11" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="middle">{d.ha > 0 ? `${Math.round((d.ha / 558) * 100)}%` : "0%"}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function UltimasActividadesCard({ onVerTodo }: { onVerTodo: () => void }) {
  const activs = demo(
    [
      { inicial: "S", color: "#5E8F78", quien: "Santiago", verb: "registró", obj: "20mm de lluvia", lote: "Lote 2", icon: "droplet", time: "Hace 2 horas" },
      { inicial: "J", color: "#d9a538", quien: "Joaquin", verb: "finalizó", obj: "Siembra", lote: "Lote 1", icon: "sprout", time: "Hace 5 horas" },
      { sistema: true, inicial: "", color: "#3f4443", quien: "Sistema", verb: "detectó", obj: "Alerta de Isoca", lote: "Lote 3", icon: "bug", time: "Ayer" },
      { inicial: "S", color: "#5E8F78", quien: "Santiago", verb: "cargó", obj: "Foto de Cultivo", lote: "Lote 4", icon: "camera", time: "Ayer" },
      { inicial: "M", color: "#e7892b", quien: "Manuel", verb: "aplicó", obj: "Pulverización", lote: "Lote N1", icon: "droplet", time: "Hace 2 días" },
    ],
    [] as { inicial: string; color: string; quien: string; verb: string; obj: string; lote: string; icon: string; time: string; sistema?: boolean }[]
  );
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div className="mc-card__title">Ultimas Actividades</div>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVerTodo} title="Ver labores">
          Ver todo <Icon name="chevRight" size={13} />
        </button>
      </div>
      <div className="mc-actividades">
        {activs.length === 0 ? (
          <div className="text-sm text-muted" style={{ padding: "18px 4px" }}>Sin actividades recientes.</div>
        ) : (
          activs.map((a, i) => (
            <div key={i} className="mc-act-row">
              <div className="mc-act-row__avatar" style={{ background: a.color }}>
                {a.sistema ? <Icon name="bolt" size={14} /> : a.inicial}
              </div>
              <div className="mc-act-row__content">
                <div className="mc-act-row__text">
                  <span style={{ color: "var(--mc-ink)", fontWeight: 500 }}>{a.quien}</span> {a.verb}{" "}
                  <span style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{a.obj}</span> en{" "}
                  <span style={{ color: "var(--mc-ink)", fontWeight: 600 }}>{a.lote}</span>
                  <Icon name={a.icon} size={13} style={{ marginLeft: 6, verticalAlign: "middle", color: "var(--mc-text-3)" }} />
                </div>
              </div>
              <div className="mc-act-row__time">{a.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FocoRow({
  nivel, titulo, lote, detail, icon, onClick,
}: {
  nivel: "red" | "orange" | "amber" | "blue";
  titulo: string;
  lote: string;
  detail: string;
  icon: string;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const colors = {
    red: { bg: "var(--mc-red-bg)", fg: "var(--mc-red)" },
    orange: { bg: "var(--mc-orange-100)", fg: "var(--mc-orange-700)" },
    amber: { bg: "var(--mc-amber-bg)", fg: "var(--mc-amber)" },
    blue: { bg: "var(--mc-blue-bg)", fg: "var(--mc-blue)" },
  };
  const c = colors[nivel];
  return (
    <div
      className="row gap-10"
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        padding: "10px 12px",
        border: `1px solid ${hover ? c.fg : "var(--mc-line)"}`,
        borderRadius: 10,
        background: hover ? c.bg : "transparent",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, color: c.fg, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
        <Icon name={icon} size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13 }}>{titulo}</div>
        <div className="text-xs text-muted">{lote}</div>
        <div className="text-xs" style={{ color: c.fg, marginTop: 2 }}>{detail}</div>
      </div>
      <Icon name="chevRight" size={16} />
    </div>
  );
}
