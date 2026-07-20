"use client";

// Pestaña Nutrición y Conversión: eficiencia alimenticia y costo por kg ganado
// por corral (tabla ordenable con tendencia), raciones activas de engorde.

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KPI, Icon } from "@/components/mc";
import {
  CorralAPI,
  conversion,
  costoPorKg,
  coma,
  gdpReal,
} from "./engorde-tipos";
import { EngSparkline } from "./engorde-ui";

type RacionLite = { id: string; nombre: string; etapaProductiva?: string | null; animalObjetivo?: string | null; costoTotal?: number | null; consumoDiario?: number | null; proteinaTotal?: number | null };

function conversionColor(v: number | null): string {
  if (v == null) return "var(--mc-text-3)";
  return v < 6.0 ? "#16a34a" : v <= 7.0 ? "#c48410" : "#dc2626";
}

export function EngordeConversion({ corrales, raciones }: { corrales: CorralAPI[]; raciones: RacionLite[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const activos = useMemo(() => corrales.filter((c) => c.estado !== "Cerrado"), [corrales]);
  const racionesEngorde = raciones.filter((r) => /engorde|termin|crecim/i.test(r.etapaProductiva || "") || /novillo|vaquil|ternero/i.test(r.animalObjetivo || ""));

  // Derivar filas de conversión
  const filas = useMemo(
    () =>
      activos.map((c) => {
        const conv = conversion(c);
        const consumo = c.consumoDiario ?? c.racion?.consumoDiario ?? null;
        const ganancia = gdpReal(c) ?? c.gdpObjetivo ?? null;
        const cKg = costoPorKg(c);
        // spark = evolución de gdp de las últimas pesadas (proxy de tendencia de conversión)
        const spark = (c.pesadas || [])
          .slice()
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
          .map((p) => (p.gdp && p.gdp > 0 && consumo ? consumo / p.gdp : null))
          .filter((x): x is number => x !== null);
        return { corral: c, nombre: c.nombre, consumo, ganancia, conversion: conv, costoKg: cKg, spark };
      }),
    [activos]
  );

  const rows = useMemo(() => {
    if (!sortKey) return filas;
    type Fila = (typeof filas)[number];
    const val = (f: Fila): string | number => {
      if (sortKey === "corral") return f.nombre;
      if (sortKey === "tendencia") return f.spark.length ? f.spark[f.spark.length - 1] - f.spark[0] : 0;
      if (sortKey === "consumo") return f.consumo ?? 0;
      if (sortKey === "ganancia") return f.ganancia ?? 0;
      if (sortKey === "conversion") return f.conversion ?? 0;
      if (sortKey === "costoKg") return f.costoKg ?? 0;
      return 0;
    };
    const arr = [...filas].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (typeof va === "string") return va.localeCompare(vb as string);
      return (va as number) - (vb as number);
    });
    return sortDir === "asc" ? arr : arr.reverse();
  }, [filas, sortKey, sortDir]);

  const toggleSort = (k: string) => { if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc")); else { setSortKey(k); setSortDir("asc"); } };

  // KPIs
  const convs = filas.map((f) => f.conversion).filter((x): x is number => x !== null);
  const convProm = convs.length ? convs.reduce((a, b) => a + b, 0) / convs.length : null;
  const consumoTotal = activos.reduce((s, c) => s + (c.consumoDiario ?? c.racion?.consumoDiario ?? 0) * c.cabezas, 0);
  const costoTotal = activos.reduce((s, c) => s + (c.costoDiario ?? c.racion?.costoTotal ?? 0) * c.cabezas, 0);

  const columns = [
    { key: "corral", label: "Corral" },
    { key: "consumo", label: "Consumo (kg MS/cab/d)" },
    { key: "ganancia", label: "Ganancia (kg/d)" },
    { key: "conversion", label: "Conversión" },
    { key: "costoKg", label: "Costo/kg ganado" },
    { key: "tendencia", label: "Tendencia" },
  ];

  const NUTRI_COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#0891b2"];

  return (
    <div className="col gap-16">
      <div className="grid g-cols-5">
        <KPI label="Conversión Alimenticia" value={convProm !== null ? `${coma(convProm, 1)}:1` : "—"} delta="kg alimento / kg ganado" icon="activity" warn={convProm !== null && convProm > 6.5} />
        <KPI label="Consumo Diario" value={consumoTotal > 0 ? `${coma(consumoTotal / 1000, 1)} tn MS` : "—"} delta="alimento seco, hato completo" icon="truck" />
        <KPI label="Costo Diario Alimentación" value={costoTotal > 0 ? `$${Math.round(costoTotal).toLocaleString("es-AR")}` : "—"} delta="USD · todos los corrales" icon="dollar" />
        <KPI label="Raciones de Engorde" value={String(racionesEngorde.length)} delta="formuladas en Nutrición" icon="leaf" />
        <KPI label="Corrales con Ración" value={String(activos.filter((c) => c.racionId).length)} delta={`de ${activos.length} corrales`} icon="check" accent />
      </div>

      <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--ghost" onClick={() => router.push("/ganaderia-avanzada")}>Ir a Nutrición <Icon name="arrow-right" size={14} /></button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(280px,1fr)", gap: 16, alignItems: "start" }}>
        {/* Conversión por corral */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 10px" }}>
            <div className="mc-card__title">Conversión por Corral</div>
            <div className="text-xs text-muted mt-2">Eficiencia alimenticia y costo por kg ganado</div>
          </div>
          {activos.length === 0 ? (
            <div className="mc-empty" style={{ padding: "36px 0" }}><div className="mc-empty__icon"><Icon name="activity" size={20} /></div>Sin corrales para analizar la conversión.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--mc-surface-2)" }}>
                    {columns.map((col) => (
                      <th key={col.key} onClick={() => toggleSort(col.key)} style={{ padding: "8px 10px", textAlign: col.key === "corral" ? "left" : "center", fontSize: 11, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none" }}>
                        {col.label}{sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const cc = conversionColor(r.conversion);
                    const peor = r.conversion !== null && r.conversion > 7.0;
                    return (
                      <tr key={r.corral.id} style={{ background: peor ? "var(--mc-red-bg)" : "transparent", borderTop: "1px solid var(--mc-line)" }}>
                        <td style={{ padding: "10px 10px", fontWeight: peor ? 700 : 500, color: peor ? "var(--mc-red)" : "var(--mc-ink)" }}>{r.nombre}</td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>{r.consumo != null ? `${coma(r.consumo, 1)} kg` : "—"}</td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>{r.ganancia != null ? `${coma(r.ganancia, 2)} kg/d` : "—"}</td>
                        <td style={{ padding: "10px 10px", textAlign: "center", fontWeight: 700, color: cc }}>{r.conversion != null ? `${coma(r.conversion, 1)}:1` : "—"}</td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>{r.costoKg != null ? `$${coma(r.costoKg, 2)}` : "—"}</td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}><EngSparkline data={r.spark} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {convProm !== null && (
            <div style={{ padding: "10px 18px", borderTop: "1px solid var(--mc-line)", fontSize: 12, fontWeight: 600, color: "var(--mc-text-2)", textAlign: "right" }}>Promedio: {coma(convProm, 1)}:1</div>
          )}
        </div>

        {/* Raciones activas */}
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 10px" }}>
            <div className="mc-card__title">Raciones de Engorde</div>
            <div className="text-xs text-muted mt-2">Desde Nutrición › Gestión de Raciones</div>
          </div>
          {racionesEngorde.length === 0 ? (
            <div className="mc-empty" style={{ padding: "28px 0" }}><div className="mc-empty__icon"><Icon name="leaf" size={20} /></div>Sin raciones de engorde formuladas.</div>
          ) : (
            <div className="col gap-8" style={{ padding: "0 16px 12px" }}>
              {racionesEngorde.map((r, idx) => {
                const corralesAsig = activos.filter((c) => c.racionId === r.id);
                return (
                  <div key={r.id} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--mc-line)" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--mc-ink)", marginBottom: 6 }}>{r.nombre}</div>
                    {corralesAsig.length > 0 && (
                      <div className="row gap-4" style={{ flexWrap: "wrap", marginBottom: 8 }}>
                        {corralesAsig.map((c) => <span key={c.id} className="mc-badge mc-badge--neutral" style={{ fontSize: 10.5 }}>{c.nombre}</span>)}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                      <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>
                        {r.proteinaTotal != null ? `${coma(r.proteinaTotal, 1)}% PB` : ""}{r.consumoDiario != null ? ` · ${coma(r.consumoDiario, 1)} kg MS` : ""}
                      </div>
                      {r.costoTotal != null && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-green-700)" }}>${coma(r.costoTotal, 2)}/cab/día</span>}
                    </div>
                    <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: "var(--mc-line)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "100%", background: NUTRI_COLORS[idx % NUTRI_COLORS.length], opacity: 0.5 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--mc-line)" }}>
            <button className="mc-btn mc-btn--ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/ganaderia-avanzada")}>
              <Icon name="leaf" size={14} />Gestionar raciones en Nutrición
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
