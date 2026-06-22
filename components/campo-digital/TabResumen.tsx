"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Icon, KPI } from "@/components/mc";
import { CULTIVO_COLORES } from "./lotes-data";

/* ========== TAB RESUMEN — 100% datos reales ========== */

type LoteApi = { hectareas?: number; cultivo?: string | null; establecimientoId?: string | null };
type EstApi = { id: string; nombre: string; ciudad?: string | null; provincia?: string | null; lotesCount?: number };
type LaborApi = {
  tipo?: string;
  fecha?: string;
  estado?: string;
  descripcion?: string;
  createdAt?: string;
  lote?: { nombre?: string } | null;
};
type AlertaApi = {
  plaga?: string;
  severidad?: string;
  areaAfectada?: number;
  recomendacion?: string;
  metodoDeteccion?: string;
  lote?: { nombre?: string; cultivo?: string } | null;
};

type Plantacion = { nombre: string; ha: number; lotes: number; color: string };
type Actividad = { inicial: string; color: string; quien: string; verb: string; obj: string; lote: string; icon: string; time: string };
type Foco = { nivel: "red" | "orange" | "amber" | "blue"; titulo: string; lote: string; detail: string; icon: string; tab: string };

const COLOR_DESCANSO = "#d5d9d2";
const COLOR_VACIO = "#e8e6e0";

function tiempoRelativo(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const min = Math.round((Date.now() - d) / 60000);
  if (min < 1) return "Recién";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const dias = Math.round(h / 24);
  if (dias === 1) return "Ayer";
  if (dias < 30) return `Hace ${dias} días`;
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

const ICONO_LABOR: Record<string, string> = {
  Siembra: "sprout", Pulverización: "droplet", Fertilización: "leaf", Cosecha: "wheat",
  Labranza: "wrench", Riego: "droplet", Monitoreo: "search",
};

export default function TabResumen({ onNavigateTab }: { onNavigateTab?: (t: string) => void }) {
  const [lotes, setLotes] = useState<LoteApi[]>([]);
  const [labores, setLabores] = useState<LaborApi[]>([]);
  const [alertas, setAlertas] = useState<AlertaApi[]>([]);
  const [ests, setEsts] = useState<EstApi[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/lotes").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/labores").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/deteccion-enfermedades").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/establecimientos").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([l, lab, al, es]) => {
      if (Array.isArray(l)) setLotes(l);
      if (Array.isArray(lab)) setLabores(lab);
      if (Array.isArray(al)) setAlertas(al);
      if (Array.isArray(es)) setEsts(es);
      setCargando(false);
    });
  }, []);

  // ---- Campos (establecimientos) con su superficie real ----
  const campos = useMemo(() => {
    return ests.map((e) => {
      const ls = lotes.filter((l) => l.establecimientoId === e.id);
      return { ...e, lotes: ls.length, ha: Math.round(ls.reduce((s, l) => s + (l.hectareas || 0), 0)) };
    });
  }, [ests, lotes]);
  const lotesSinCampo = lotes.filter((l) => !l.establecimientoId);
  const haSinCampo = Math.round(lotesSinCampo.reduce((s, l) => s + (l.hectareas || 0), 0));

  // ---- KPIs reales ----
  const totalHa = lotes.reduce((s, l) => s + (l.hectareas || 0), 0);
  const sembHa = lotes.filter((l) => l.cultivo).reduce((s, l) => s + (l.hectareas || 0), 0);
  const ocupacion = totalHa > 0 ? Math.round((sembHa / totalHa) * 100) : 0;
  const laboresPend = labores.filter((l) => l.estado !== "Completada").length;
  const laboresAtras = labores.filter((l) => l.estado === "Atrasada").length;
  const alertasActivas = alertas.length;
  const alertasCriticas = alertas.filter((a) => a.severidad === "Alta" || a.severidad === "Crítica").length;

  // ---- Distribución de plantaciones (real) ----
  const plantaciones = useMemo<Plantacion[]>(() => {
    const map = new Map<string, { ha: number; lotes: number }>();
    lotes.forEach((l) => {
      const key = l.cultivo || "En descanso";
      const prev = map.get(key) || { ha: 0, lotes: 0 };
      map.set(key, { ha: prev.ha + (l.hectareas || 0), lotes: prev.lotes + 1 });
    });
    return Array.from(map.entries())
      .map(([nombre, v]) => ({
        nombre, ha: Math.round(v.ha), lotes: v.lotes,
        color: nombre === "En descanso" ? COLOR_DESCANSO : nombre === "Vacío" ? COLOR_VACIO : CULTIVO_COLORES[nombre] || "#5e7733",
      }))
      .sort((a, b) => b.ha - a.ha);
  }, [lotes]);

  // ---- Últimas actividades (de labores reales) ----
  const actividades = useMemo<Actividad[]>(() => {
    return [...labores]
      .sort((a, b) => new Date(b.createdAt || b.fecha || 0).getTime() - new Date(a.createdAt || a.fecha || 0).getTime())
      .slice(0, 5)
      .map((l) => {
        const verb = l.estado === "Completada" ? "completó" : l.estado === "En curso" ? "está en" : "programó";
        return {
          inicial: (l.tipo || "L").charAt(0).toUpperCase(),
          color: "#5E8F78", quien: "Equipo", verb, obj: l.tipo || "Labor",
          lote: l.lote?.nombre || "campo", icon: ICONO_LABOR[l.tipo || ""] || "wrench",
          time: tiempoRelativo(l.createdAt || l.fecha),
        };
      });
  }, [labores]);

  // ---- Focos de atención (de alertas + labores atrasadas) ----
  const focos = useMemo<Foco[]>(() => {
    const out: Foco[] = [];
    alertas.slice(0, 4).forEach((a) => {
      const nivel: Foco["nivel"] = a.severidad === "Alta" || a.severidad === "Crítica" ? "red" : a.severidad === "Media" ? "amber" : "blue";
      out.push({
        nivel, titulo: a.plaga || "Alerta sanitaria",
        lote: `${a.lote?.nombre || "Lote"}${a.lote?.cultivo ? ` · ${a.lote.cultivo}` : ""}`,
        detail: a.recomendacion || `${a.metodoDeteccion || "Detección"} · ${a.severidad || "—"}`,
        icon: "leaf", tab: "Detección de Enfermedades (IA)",
      });
    });
    labores.filter((l) => l.estado === "Atrasada").slice(0, 3).forEach((l) => {
      out.push({
        nivel: "amber", titulo: `Labor atrasada: ${l.tipo || "—"}`,
        lote: l.lote?.nombre || "campo", detail: l.descripcion || "Reprogramar o ejecutar",
        icon: "wrench", tab: "Labores",
      });
    });
    return out.slice(0, 6);
  }, [alertas, labores]);

  return (
    <>
      <div className="grid g-cols-5">
        <KPI label="Hectáreas totales" value={`${Math.round(totalHa)} Ha`} delta={cargando ? "Cargando…" : `${lotes.length} lotes`} trend="up" icon="map" accent />
        <KPI label="Hectáreas sembradas" value={`${Math.round(sembHa)} / ${Math.round(totalHa)}`} delta={`${ocupacion}% de ocupación`} trend="up" icon="sprout" />
        <KPI label="Cultivos distintos" value={String(plantaciones.filter((p) => p.nombre !== "En descanso" && p.nombre !== "Vacío").length)} delta={plantaciones[0] ? `Principal: ${plantaciones[0].nombre}` : "—"} trend="up" icon="leaf" />
        <KPI label="Labores próximas" value={String(laboresPend)} delta={`${laboresAtras} atrasadas`} trend={laboresAtras > 0 ? "warn" : "up"} icon="wrench" />
        <KPI label="Alertas sanitarias" value={String(alertasActivas)} delta={alertasCriticas > 0 ? `${alertasCriticas} críticas` : "Sin críticas"} trend="warn" icon="alert" warn={alertasCriticas > 0} />
      </div>

      <CamposCard campos={campos} lotesSinCampo={lotesSinCampo.length} haSinCampo={haSinCampo} cargando={cargando} />

      <PlantacionesCard plantaciones={plantaciones} totalHa={Math.round(totalHa)} cargando={cargando} />

      <div className="grid" style={{ gridTemplateColumns: "1.1fr 1fr", gap: 14 }}>
        <UltimasActividadesCard actividades={actividades} cargando={cargando} onVerTodo={() => onNavigateTab?.("Labores")} />
        <div className="mc-card">
          <div className="mc-card__head">
            <div className="mc-card__title">Focos de atención</div>
            {focos.length > 0 && <span className="mc-badge mc-badge--orange">{focos.length}</span>}
          </div>
          <div className="col gap-8">
            {cargando ? (
              <SkeletonRows n={3} />
            ) : focos.length === 0 ? (
              <EmptyState icon="check" title="Todo en orden" sub="No hay alertas sanitarias ni labores atrasadas." />
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

function CamposCard({ campos, lotesSinCampo, haSinCampo, cargando }: { campos: { id: string; nombre: string; ciudad?: string | null; provincia?: string | null; lotes: number; ha: number }[]; lotesSinCampo: number; haSinCampo: number; cargando: boolean }) {
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div>
          <div className="mc-card__eyebrow">Estructura del productor</div>
          <div className="mc-card__title mt-4">Campos y lotes</div>
        </div>
        {campos.length > 0 && <span className="mc-badge mc-badge--neutral"><span className="mc-badge__dot" />{campos.length} campos</span>}
      </div>
      {cargando ? (
        <SkeletonRows n={2} />
      ) : campos.length === 0 && lotesSinCampo === 0 ? (
        <EmptyState icon="building" title="Sin campos ni lotes" sub="Creá un establecimiento en la sección Establecimientos y dibujá tus lotes en el mapa." />
      ) : (
        <div className="grid g-cols-3 gap-12">
          {campos.map((c) => (
            <div key={c.id} style={{ border: "1px solid var(--mc-line)", borderRadius: 12, padding: 14 }}>
              <div className="row gap-8" style={{ alignItems: "center" }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="building" size={16} /></span>
                <div style={{ minWidth: 0 }}>
                  <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nombre}</div>
                  <div className="text-xs text-muted">{[c.ciudad, c.provincia].filter(Boolean).join(", ") || "Sin ubicación"}</div>
                </div>
              </div>
              <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
                <div><div style={{ fontFamily: "var(--ff-display)", fontSize: 20, color: "var(--mc-ink)" }}>{c.lotes}</div><div className="text-xs text-muted">lotes</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontFamily: "var(--ff-display)", fontSize: 20, color: "var(--mc-ink)" }}>{c.ha}</div><div className="text-xs text-muted">ha</div></div>
              </div>
            </div>
          ))}
          {lotesSinCampo > 0 && (
            <div style={{ border: "1px dashed var(--mc-line)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div className="row gap-8" style={{ alignItems: "center" }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--mc-amber-bg)", color: "var(--mc-amber)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="alert" size={16} /></span>
                <div>
                  <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>Sin asignar</div>
                  <div className="text-xs text-muted">{lotesSinCampo} lotes · {haSinCampo} ha</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlantacionesCard({ plantaciones, totalHa, cargando }: { plantaciones: Plantacion[]; totalHa: number; cargando: boolean }) {
  const [mode, setMode] = useState<"ha" | "lotes" | "pct">("ha");
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div>
          <div className="mc-card__eyebrow">Distribución del campo</div>
          <div className="mc-card__title mt-4">Tipos de plantaciones</div>
        </div>
        <div className="row gap-12">
          <div style={{ textAlign: "right" }}>
            <div className="text-xs text-muted">Total productivo</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)" }}>{totalHa} Ha</div>
          </div>
          <div className="mc-seg">
            <button className={mode === "ha" ? "is-on" : ""} onClick={() => setMode("ha")}>Hectáreas</button>
            <button className={mode === "lotes" ? "is-on" : ""} onClick={() => setMode("lotes")}>Lotes</button>
            <button className={mode === "pct" ? "is-on" : ""} onClick={() => setMode("pct")}>%</button>
          </div>
        </div>
      </div>
      {cargando ? (
        <div style={{ height: 200 }}><SkeletonRows n={4} /></div>
      ) : plantaciones.length === 0 ? (
        <EmptyState icon="sprout" title="Sin lotes cargados" sub="Dibujá o creá lotes con cultivo para ver la distribución del campo." />
      ) : (
        <BarChartPlantaciones data={plantaciones} mode={mode} totalHa={Math.max(1, totalHa)} />
      )}
    </div>
  );
}

function BarChartPlantaciones({ data, mode, totalHa }: { data: Plantacion[]; mode: "ha" | "lotes" | "pct"; totalHa: number }) {
  const getValue = (d: Plantacion) => (mode === "ha" ? d.ha : mode === "lotes" ? d.lotes : Math.round((d.ha / totalHa) * 100));
  const getLabel = (d: Plantacion) => (mode === "ha" ? String(d.ha) : mode === "lotes" ? String(d.lotes) : `${Math.round((d.ha / totalHa) * 100)}%`);
  const maxVal = Math.max(1, ...data.map(getValue));
  // Escala "linda" para los ticks del eje Y
  const niceMax = Math.ceil(maxVal / 4) * 4 || 4;
  const yticks = [0, niceMax / 4, niceMax / 2, (niceMax * 3) / 4, niceMax].map((v) => Math.round(v));
  const axisLabel = mode === "ha" ? "Hectáreas" : mode === "lotes" ? "Lotes" : "% del campo";
  const W = 1400, H = 260, padL = 50, padR = 16, padT = 16, padB = 50;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const groupW = innerW / data.length;
  const barW = Math.min(groupW * 0.55, 90);

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
          const y = padT + innerH * (1 - v / niceMax);
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
          const bh = v > 0 ? (v / niceMax) * innerH : 0;
          const by = padT + innerH - bh;
          return (
            <g key={d.nombre}>
              {v > 0 && (
                <>
                  <rect x={bx} y={by} width={barW} height={bh} fill={`url(#bg${i})`} rx="6" ry="6" />
                  <text x={bx + barW / 2} y={by - 8} fontSize="13" fontFamily="var(--ff-display)" fontWeight="700" fill="var(--mc-ink)" textAnchor="middle">{getLabel(d)}</text>
                </>
              )}
              <text x={gx + groupW / 2} y={H - 24} fontSize="13" fontFamily="var(--ff-ui)" fontWeight="600" fill="var(--mc-text)" textAnchor="middle">{d.nombre}</text>
              <text x={gx + groupW / 2} y={H - 8} fontSize="11" fontFamily="var(--ff-mono)" fill="var(--mc-text-3)" textAnchor="middle">{`${Math.round((d.ha / totalHa) * 100)}%`}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function UltimasActividadesCard({ actividades, cargando, onVerTodo }: { actividades: Actividad[]; cargando: boolean; onVerTodo: () => void }) {
  return (
    <div className="mc-card">
      <div className="mc-card__head">
        <div className="mc-card__title">Últimas actividades</div>
        <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onVerTodo} title="Ver labores">
          Ver todo <Icon name="chevRight" size={13} />
        </button>
      </div>
      <div className="mc-actividades">
        {cargando ? (
          <SkeletonRows n={4} />
        ) : actividades.length === 0 ? (
          <EmptyState icon="activity" title="Sin actividad reciente" sub="Las labores que registres aparecerán acá automáticamente." />
        ) : (
          actividades.map((a, i) => (
            <div key={i} className="mc-act-row">
              <div className="mc-act-row__avatar" style={{ background: a.color }}>{a.inicial}</div>
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

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ padding: "28px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center" }}>
        <Icon name={icon} size={20} />
      </div>
      <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>{title}</div>
      <div className="text-xs text-muted" style={{ maxWidth: 280 }}>{sub}</div>
    </div>
  );
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <div className="col gap-8" style={{ padding: "8px 0" }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ height: 38, borderRadius: 8, background: "linear-gradient(90deg, var(--mc-surface-2) 25%, var(--mc-line) 50%, var(--mc-surface-2) 75%)", backgroundSize: "200% 100%", animation: "mc-shimmer 1.3s infinite" }} />
      ))}
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
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); }}
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
