"use client";

// Piezas compartidas del módulo Mov. de Tropas: KPI card estilo panel,
// radar de condición de tropa, ficha flotante sobre el mapa y la
// ventana óptima de arreo (clima real de /api/clima).

import React, { useEffect, useState } from "react";
import { Icon } from "@/components/mc";
import {
  MovTropaAPI,
  TropaAPI,
  diasDescansoLote,
  diasEnLote,
  estadoAnimalTropa,
  ESTADO_COLOR_TROPA,
  pesoPromTropa,
  razaPredominante,
} from "./tropas-tipos";

/* ============ KPI CARD (estilo panel de gestión) ============ */

export function KpiMovCard({
  title,
  ico,
  val,
  valColor,
  valSuffix,
  sub,
  subColor,
  barPct,
  pulse,
}: {
  title: string;
  ico: string;
  val: React.ReactNode;
  valColor?: string;
  valSuffix?: string;
  sub: React.ReactNode;
  subColor?: string;
  barPct?: number | null;
  pulse?: boolean;
}) {
  // KPI canónico del sistema (mc-kpi) con barra opcional; misma tipografía/tamaño que Agronomía.
  return (
    <div className="mc-kpi">
      <span className="mc-kpi__glyph"><Icon name={ico} size={14} /></span>
      <div className="mc-kpi__label">{title}</div>
      <div className="mc-kpi__value" style={{ color: valColor, animation: pulse ? "pulse-val 2s infinite" : undefined }}>
        {val}
        {valSuffix && <span style={{ fontSize: "0.5em", fontWeight: 500, color: "var(--mc-text-3)", marginLeft: 4 }}>{valSuffix}</span>}
      </div>
      {typeof barPct === "number" && (
        <div style={{ height: 6, background: "var(--mc-line)", borderRadius: 999, marginTop: 2, marginBottom: 2 }}>
          <div style={{ width: `${Math.max(0, Math.min(100, barPct))}%`, height: "100%", background: "var(--mc-green-600)", borderRadius: 999, transition: "width .3s" }} />
        </div>
      )}
      {sub != null && sub !== "" && <div className="mc-kpi__delta" style={subColor ? { color: subColor } : undefined}>{sub}</div>}
    </div>
  );
}

/* ============ RADAR DE CONDICIÓN ============ */

export function TropaRadar({ color, ejes }: { color: string; ejes: { label: string; val: number }[] }) {
  const N = ejes.length;
  const R = 50;
  const vals = ejes.map((e) => Math.max(0, Math.min(1, e.val)));
  const angle = (i: number) => ((Math.PI * 2) / N) * i - Math.PI / 2;
  const ptX = (i: number, s: number) => Math.cos(angle(i)) * R * s;
  const ptY = (i: number, s: number) => Math.sin(angle(i)) * R * s;
  const rings = [0.25, 0.5, 0.75, 1];
  const ringPts = rings.map((s) => ejes.map((_, i) => `${ptX(i, s)},${ptY(i, s)}`).join(" "));
  const dataPts = ejes.map((_, i) => `${ptX(i, 1) * vals[i]},${ptY(i, 1) * vals[i]}`).join(" ");
  return (
    <svg viewBox="-70 -65 140 135" style={{ width: "100%", height: 130, display: "block" }}>
      {ringPts.map((pts, i) => <polygon key={i} points={pts} fill="none" stroke="var(--mc-line)" strokeWidth="0.8" />)}
      {ejes.map((_, i) => <line key={i} x1="0" y1="0" x2={ptX(i, 1)} y2={ptY(i, 1)} stroke="var(--mc-line)" strokeWidth="0.8" />)}
      <polygon points={dataPts} fill={color + "44"} stroke={color} strokeWidth="1.5" />
      {ejes.map((_, i) => <circle key={i} cx={ptX(i, 1) * vals[i]} cy={ptY(i, 1) * vals[i]} r="3" fill={color} />)}
      {ejes.map((a, i) => (
        <text key={i} x={ptX(i, 1.32)} y={ptY(i, 1.32) + 3} textAnchor="middle" fontSize="7" fill="#475569" fontWeight="600">{a.label}</text>
      ))}
    </svg>
  );
}

/* ============ FICHA DE TROPA FLOTANTE (sobre el mapa) ============ */

export function FichaTropaCard({
  tropa,
  color,
  movimientos,
  tropas,
  onClose,
  onVerDetalle,
  onMover,
}: {
  tropa: TropaAPI;
  color: string;
  movimientos: MovTropaAPI[];
  tropas: TropaAPI[];
  onClose: () => void;
  onVerDetalle: () => void;
  onMover: () => void;
}) {
  const animales = tropa.animales || [];
  const totalAnim = animales.length;
  const raza = razaPredominante(tropa);
  const esTambo = /tambo|lecher/i.test(`${tropa.categoria || ""} ${tropa.rutina?.nombre || ""}`);
  const peso = pesoPromTropa(tropa);
  const dias = diasEnLote(tropa, movimientos);
  const descanso = tropa.lote?.nombre ? diasDescansoLote(tropa.lote.nombre, movimientos, tropas.filter((t) => t.id !== tropa.id)) : null;

  const estadoCounts: Record<string, number> = {};
  animales.forEach((a) => {
    const e = estadoAnimalTropa(a);
    estadoCounts[e] = (estadoCounts[e] || 0) + 1;
  });
  const estadoEntries = Object.entries(estadoCounts).sort((a, b) => b[1] - a[1]);
  const estadoDominante = estadoEntries[0]?.[0] || "Sin animales";
  const colorEstado = (e: string) => ESTADO_COLOR_TROPA[e] || "#64748b";
  const pctSaludable = totalAnim ? Math.round(((estadoCounts["Saludable"] || 0) / totalAnim) * 100) : 0;
  const pctPrenada = totalAnim ? (estadoCounts["Preñada"] || 0) / totalAnim : 0;
  const pctTrat = totalAnim ? (estadoCounts["En tratamiento"] || 0) / totalAnim : 0;

  const fichaData = [
    { ico: "map-pin", label: "Ubicación", val: tropa.lote?.nombre || "Sin lote" },
    { ico: "users", label: "Cantidad", val: `${tropa._count?.animales ?? totalAnim} cab.` },
    { ico: "scale", label: "Peso prom.", val: peso ? `${peso} kg` : "—" },
    { ico: "heart", label: "Preñadas", val: String(estadoCounts["Preñada"] || 0) },
    { ico: "activity", label: "En trat.", val: String(estadoCounts["En tratamiento"] || 0) },
    { ico: "clock", label: "Días en lote", val: dias !== null ? `${dias} días` : "—" },
  ];
  const ejesRadar = [
    { label: "Salud", val: pctSaludable / 100 },
    { label: "Peso", val: peso ? Math.min(1, peso / 520) : 0 },
    { label: "Preñez", val: pctPrenada },
    { label: "Sanidad", val: 1 - pctTrat },
    { label: "Rotación", val: dias !== null ? 1 - Math.min(1, Math.abs(dias - 21) / 21) : 0.5 },
  ];

  return (
    <div
      style={{
        position: "absolute", zIndex: 100, width: 340, maxHeight: 520, overflowY: "auto",
        left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        background: "var(--mc-surface)", borderRadius: 20,
        boxShadow: "0 24px 64px rgba(0,0,0,.32)",
        border: `1.5px solid ${color}44`,
      }}
    >
      {/* Header con acento diagonal */}
      <div style={{ background: `linear-gradient(120deg,${color} 0%,${color}bb 65%,${color}88 100%)`, padding: "18px 18px 44px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.12)" }} />
        <div style={{ position: "absolute", bottom: -40, right: 20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.75)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 5 }}>
              {raza || tropa.categoria || "Tropa"} {esTambo ? "· Tambo" : "· Cría/Engorde"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "white", letterSpacing: "-.01em", lineHeight: 1.1 }}>{tropa.nombre}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(255,255,255,.22)", border: "1px solid rgba(255,255,255,.35)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="x" size={13} style={{ color: "white" }} />
          </button>
        </div>
        <div style={{ position: "absolute", bottom: -16, left: 18, display: "flex", gap: 6 }}>
          <span style={{ padding: "5px 11px", borderRadius: 999, background: "white", color, fontSize: 11, fontWeight: 800, boxShadow: "0 3px 10px rgba(0,0,0,.18)", display: "inline-flex", alignItems: "center", gap: 3 }}>
            <Icon name="map-pin" size={10} />{tropa.lote?.nombre || "Sin lote"}
          </span>
          <span style={{ padding: "5px 11px", borderRadius: 999, background: colorEstado(estadoDominante) + "22", color: colorEstado(estadoDominante), fontSize: 11, fontWeight: 800, boxShadow: "0 3px 10px rgba(0,0,0,.1)", border: `1px solid ${colorEstado(estadoDominante)}55` }}>
            {estadoDominante}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: "26px 16px 6px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {fichaData.map((item, i) => (
          <div key={i} style={{ background: "var(--mc-surface-2)", borderRadius: 10, padding: "9px 10px" }}>
            <Icon name={item.ico} size={12} style={{ color, marginBottom: 4, display: "block" }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--mc-ink)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.val}</div>
            <div style={{ fontSize: 9, color: "var(--mc-text-3)", fontWeight: 600, marginTop: 1, textTransform: "uppercase", letterSpacing: ".04em" }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Estado sanitario */}
      {totalAnim > 0 ? (
        <div style={{ padding: "10px 16px 0" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
            Estado de la tropa · {totalAnim} cab.
          </div>
          <div style={{ display: "flex", height: 9, borderRadius: 999, overflow: "hidden", marginBottom: 6 }}>
            {estadoEntries.map(([e, n]) => (
              <div key={e} title={`${e}: ${n}`} style={{ width: `${(n / totalAnim) * 100}%`, background: colorEstado(e) }} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px" }}>
            {estadoEntries.map(([e, n]) => (
              <span key={e} style={{ fontSize: 9.5, color: "var(--mc-text-2)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: colorEstado(e), display: "inline-block" }} />
                {e} · {Math.round((n / totalAnim) * 100)}%
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: "10px 16px 0", fontSize: 11, color: "var(--mc-text-3)" }}>Tropa sin animales asignados.</div>
      )}

      {/* Radar + tipo/descanso */}
      <div style={{ padding: "12px 16px 8px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 10 }}>
        <div style={{ borderTop: "1px solid var(--mc-line)", paddingTop: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-text-3)", textAlign: "center", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".06em" }}>Condición de tropa</div>
          <TropaRadar color={color} ejes={ejesRadar} />
        </div>
        <div style={{ borderTop: "1px solid var(--mc-line)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: esTambo ? "#eff6ff" : "var(--mc-surface-2)", border: esTambo ? "1px solid #bfdbfe" : "none", borderRadius: 10, padding: "10px 10px", flex: 1 }}>
            <Icon name={esTambo ? "droplets" : "cow"} size={14} style={{ color: esTambo ? "#2563eb" : color, marginBottom: 4, display: "block" }} />
            <div style={{ fontSize: 12, fontWeight: 800, color: esTambo ? "#1e3a8a" : "var(--mc-ink)" }}>{esTambo ? "Tambo" : "Cría / Engorde"}</div>
            <div style={{ fontSize: 8.5, color: esTambo ? "#3b82f6" : "var(--mc-text-3)", fontWeight: 600, marginTop: 1, textTransform: "uppercase", letterSpacing: ".03em" }}>Tipo de explotación</div>
          </div>
          <div style={{ background: "var(--mc-surface-2)", borderRadius: 10, padding: "10px 10px", flex: 1 }}>
            <Icon name="leaf" size={14} style={{ color: descanso === null ? "var(--mc-text-3)" : descanso >= 21 ? "#16a34a" : descanso >= 7 ? "#d97706" : "#dc2626", marginBottom: 4, display: "block" }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--mc-ink)" }}>{dias !== null ? `${dias} días` : "—"}</div>
            <div style={{ fontSize: 8.5, color: "var(--mc-text-3)", fontWeight: 600, marginTop: 1, textTransform: "uppercase", letterSpacing: ".03em" }}>Ocupación del lote</div>
          </div>
        </div>
      </div>

      {/* Rutina asignada */}
      <div style={{ padding: "0 16px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--mc-surface-2)", borderRadius: 10, padding: "10px 12px" }}>
          <Icon name="repeat" size={14} style={{ color: tropa.rutina ? "var(--mc-green-600)" : "var(--mc-text-3)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: "var(--mc-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Rutina actual</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--mc-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {tropa.rutina ? tropa.rutina.nombre : "Sin rutina asignada"}
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ padding: "10px 16px 14px", display: "flex", gap: 8, borderTop: "1px solid var(--mc-line)", position: "sticky", bottom: 0, background: "var(--mc-surface)" }}>
        <button
          onClick={onVerDetalle}
          style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: `1.5px solid ${color}`, background: "transparent", color, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}
        >
          <Icon name="eye" size={11} /> Ver Detalle
        </button>
        <button
          onClick={onMover}
          style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: "none", background: color, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 10px ${color}55`, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}
        >
          <Icon name="move-right" size={11} /> Mover
        </button>
      </div>
    </div>
  );
}

/* ============ VENTANA ÓPTIMA DE ARREO (clima real) ============ */

type ClimaVentana = { temperatura: number; humedad: number; max: number };

export function MovVentanaOptima({ tropa }: { tropa: TropaAPI | null }) {
  const [clima, setClima] = useState<ClimaVentana | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    fetch("/api/clima")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo || !d?.actual) return;
        setClima({ temperatura: d.actual.temperatura, humedad: d.actual.humedad, max: d.dias?.[0]?.max ?? d.actual.temperatura });
      })
      .catch(() => {})
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  const horaIni = 8;
  const horaFin = 19;
  const ticks = [8, 10, 12, 14, 16, 18];

  let horaRec = 9;
  let riesgo: { nivel: string; color: string; detalle: string } = { nivel: "Favorable", color: "#16a34a", detalle: "Condiciones aptas la mayor parte del día." };
  if (clima) {
    if (clima.max >= 30) {
      horaRec = 17.5;
      riesgo = { nivel: "Riesgo alto", color: "#dc2626", detalle: "al mediodía. Mover después de las 17:00." };
    } else if (clima.max >= 26) {
      horaRec = 17;
      riesgo = { nivel: "Riesgo moderado", color: "#d97706", detalle: "en horas de calor. Preferir mañana temprano o tarde." };
    } else if (clima.max >= 22) {
      horaRec = 9;
      riesgo = { nivel: "Favorable", color: "#16a34a", detalle: "Mover temprano para aprovechar el fresco." };
    } else {
      horaRec = 10;
      riesgo = { nivel: "Óptimo", color: "#16a34a", detalle: "Sin estrés térmico previsto para el arreo." };
    }
  }
  const posPct = ((horaRec - horaIni) / (horaFin - horaIni)) * 100;
  const horaLabel = `${Math.floor(horaRec)}:${horaRec % 1 ? "30" : "00"}`;

  return (
    <div className="mc-card" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "var(--mc-ink)", letterSpacing: "-.02em", marginBottom: 5 }}>Ventana Óptima de Arreo</div>
          {tropa ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "3px 10px" }}>
              <Icon name="map-pin" size={11} style={{ color: "#3b82f6" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>Tropa: {tropa.nombre} ({tropa.lote?.nombre || "Sin lote"})</span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>Seleccioná una tropa en el mapa</div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--mc-ink)", letterSpacing: "-.02em" }}>{clima ? horaLabel : "—"}</div>
          <div style={{ fontSize: 10, color: "var(--mc-text-3)", fontWeight: 600 }}>Hora recomendada</div>
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ height: 20, borderRadius: 12, background: "linear-gradient(to right, #84cc16 0%, #eab308 30%, #f97316 50%, #ef4444 62%, #eab308 78%, #16a34a 100%)", boxShadow: "0 2px 8px rgba(0,0,0,.12)", position: "relative", opacity: clima ? 1 : 0.35 }}>
          {clima && (
            <div style={{ position: "absolute", left: `${Math.max(2, Math.min(98, posPct))}%`, top: "50%", transform: "translate(-50%,-50%)", width: 22, height: 22, background: "white", borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,.25)", border: "2.5px solid #16a34a" }} />
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          {ticks.map((h) => (
            <span key={h} style={{ fontSize: 10, color: "var(--mc-text-3)", fontWeight: 600 }}>{h}:00</span>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: "var(--mc-line)", margin: "12px 0" }} />

      {clima ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--mc-surface-2)", borderRadius: 10, padding: "8px 12px" }}>
            <Icon name="thermometer" size={16} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--mc-ink)" }}>{clima.max}°C</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--mc-surface-2)", borderRadius: 10, padding: "8px 12px" }}>
            <Icon name="droplet" size={16} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--mc-ink)" }}>{clima.humedad}%</span>
          </div>
          <div style={{ flex: 1, fontSize: 12, color: "var(--mc-text-2)", lineHeight: 1.4, minWidth: 140 }}>
            <span style={{ fontWeight: 800, color: riesgo.color }}>{riesgo.nivel}</span> {riesgo.detalle}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>{cargando ? "Consultando pronóstico…" : "Sin datos de clima disponibles."}</div>
      )}
    </div>
  );
}
