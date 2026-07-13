"use client";

// Modales base de Animales: ficha completa (Ver Detalle), alta (Nuevo Animal),
// baja, edición rápida y registro de evento. Portados de la referencia de
// diseño y conectados a las APIs reales — sin datos demo.

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/mc";
import {
  AnimalAPI,
  AnimalRow,
  BajaInfo,
  TratamientoAPI,
  TropaLite,
  calcEdad,
  fmtFecha,
  fmtFechaCorta,
} from "./tipos";

/* ============ helpers visuales compartidos ============ */

export function MCard({
  title,
  children,
  style,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}) {
  return (
    <div style={{ background: "var(--mc-surface-2)", border: `1.5px solid ${accent || "var(--mc-line)"}`, borderRadius: 10, padding: "12px 14px", ...style }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: accent || "var(--mc-text-3)", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

export function FilterBar({
  active,
  onChange,
  opts,
}: {
  active: string;
  onChange: (o: string) => void;
  opts: string[];
}) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--mc-surface-3)", borderRadius: 8, padding: 3 }}>
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          style={{
            padding: "3px 10px",
            borderRadius: 6,
            border: "none",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            background: active === o ? "var(--mc-surface)" : "transparent",
            color: active === o ? "var(--mc-green-600)" : "var(--mc-text-2)",
            boxShadow: active === o ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.15s",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export const SecNum = ({ n, title }: { n: React.ReactNode; title: string }) => (
  <div className="row gap-8" style={{ marginBottom: 12, alignItems: "center" }}>
    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{n}</span>
    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", textTransform: "uppercase", letterSpacing: ".04em" }}>{title}</span>
  </div>
);

/** Serie mensual (últimos N meses) a partir de registros con fecha+valor. */
function serieMensual(
  regs: { fecha: string; valor: number }[],
  meses: number
): { mes: string; valor: number }[] {
  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const hoy = new Date();
  const out: { mes: string; valor: number }[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const ini = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 1);
    const enMes = regs.filter((r) => {
      const f = new Date(r.fecha);
      return f >= ini && f < fin;
    });
    if (enMes.length > 0) {
      out.push({
        mes: MESES[ini.getMonth()],
        valor: enMes.reduce((s, r) => s + r.valor, 0) / enMes.length,
      });
    }
  }
  return out;
}

type DetalleAPI = AnimalAPI & {
  eventosVida?: {
    id: string;
    fecha: string;
    tipoEvento: string;
    titulo: string;
    descripcion?: string | null;
  }[];
  eventosSanitarios?: { id: string; tipo: string; fecha: string; descripcion: string }[];
  registroGenetico?: {
    padre?: { caravana: string; raza?: string | null } | null;
    madre?: { caravana: string; raza?: string | null } | null;
    habilidadMaterna?: string | null;
  } | null;
};

/* ============ VER DETALLE (ficha completa) ============ */

export function VerDetalleAnimalModal({
  animal,
  onClose,
  onDarDeBaja,
  onReactivar,
  onVerTimeline,
  onEditado,
}: {
  animal: AnimalRow;
  onClose: () => void;
  onDarDeBaja?: (dbId: string, datos: BajaInfo) => void;
  onReactivar?: (dbId: string) => void;
  onVerTimeline?: (a: AnimalRow) => void;
  onEditado?: () => void;
}) {
  const router = useRouter();
  const [pesoFilter, setPesoFilter] = useState("6M");
  const [prodFilter, setProdFilter] = useState("6M");
  const [modalEvento, setModalEvento] = useState(false);
  const [bajaOpen, setBajaOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detalle, setDetalle] = useState<DetalleAPI | null>(null);

  useEffect(() => {
    let ok = true;
    fetch(`/api/animales/${animal.dbId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => ok && setDetalle(d))
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, [animal.dbId]);

  const mesesDe = (f: string) => (f === "3M" ? 3 : f === "6M" ? 6 : 12);
  const pesoData = useMemo(
    () =>
      serieMensual(
        (detalle?.registrosPeso || []).map((r) => ({ fecha: r.fecha, valor: r.peso })),
        mesesDe(pesoFilter)
      ).map((d) => ({ mes: d.mes, kg: Math.round(d.valor) })),
    [detalle, pesoFilter]
  );
  const prodData = useMemo(
    () =>
      serieMensual(
        (detalle?.registrosLecheros || []).map((r) => ({ fecha: r.fecha, valor: r.litros })),
        mesesDe(prodFilter)
      ).map((d) => ({ mes: d.mes, lt: Math.round(d.valor) })),
    [detalle, prodFilter]
  );

  // Peso SVG helpers (geometría de la referencia)
  const W = 340, H = 130, pL = 36, pR = 12, pT = 14, pB = 26;
  const cW = W - pL - pR, cH = H - pT - pB;
  const pVals = pesoData.map((d) => d.kg);
  const pMin = pVals.length ? Math.min(...pVals) - 15 : 0;
  const pMax = pVals.length ? Math.max(...pVals) + 15 : 100;
  const px = (i: number) => pL + (i / Math.max(1, pesoData.length - 1)) * cW;
  const py = (v: number) => pT + cH - ((v - pMin) / Math.max(1, pMax - pMin)) * cH;
  const pLine = pesoData.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d.kg).toFixed(1)}`).join(" ");
  const pArea = pesoData.length > 1 ? `${pLine} L${px(pesoData.length - 1)},${pT + cH} L${px(0)},${pT + cH} Z` : "";

  const maxLt = prodData.length ? Math.max(...prodData.map((d) => d.lt)) : 1;
  const PH = 130, pbT = 14, pbL = 36, pbR = 12;
  const pcH = PH - pbT - 26, pcW2 = W - pbL - pbR;

  // Tratamientos activos reales
  const tratamientos = (detalle?.tratamientos || []).filter((t) =>
    ["En curso", "En retiro"].includes(t.estado)
  );

  // Historial reproductivo real
  const h = detalle?.historialReproductivo || null;
  const eventosRepro = detalle?.eventosReproductivos || [];
  const reproHistory = eventosRepro.slice(0, 5).map((e) => ({
    fecha: fmtFecha(e.fecha),
    evento: e.tipo === "Servicio" ? `Servicio ${e.tipoServicio || ""}`.trim() : e.tipo,
    resultado:
      e.tipo === "Parto"
        ? `${e.numCrias || 1} cría(s) · ${e.condicionParto || "Normal"}`
        : e.tipo === "Diagnostico"
          ? e.resultado === "Preñada"
            ? "Preñez confirmada"
            : `Diagnóstico: ${e.resultado || "—"}`
          : e.observaciones || e.semenId || e.toroId || "—",
    ok: e.tipo === "Aborto" ? false : e.resultado !== "Vacía",
  }));
  const partos = eventosRepro.filter((e) => e.tipo === "Parto");

  // Calendario del mes actual con eventos reales (próximas dosis / controles / parto probable)
  const hoy = new Date();
  const MESES_FULL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(hoy.getFullYear(), hoy.getMonth(), 1).getDay() + 6) % 7; // lunes=0
  const calEventos: { dia: number; color: "red" | "amber" | "green"; label: string }[] = [];
  for (const t of detalle?.tratamientos || []) {
    for (const [f, lbl, color] of [
      [t.proximaDosis, `Dosis ${t.medicamento || t.diagnostico}`, "red"],
      [t.proximoControl, `Control ${t.diagnostico}`, "amber"],
      [t.finRetiro, `Fin retiro ${t.diagnostico}`, "green"],
    ] as const) {
      if (!f) continue;
      const d = new Date(f);
      if (d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()) {
        calEventos.push({ dia: d.getDate(), color, label: lbl });
      }
    }
  }
  if (h?.fechaEsperadaParto) {
    const d = new Date(h.fechaEsperadaParto);
    if (d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()) {
      calEventos.push({ dia: d.getDate(), color: "green", label: "Parto probable" });
    }
  }
  const calMap: Record<number, "red" | "amber" | "green"> = {};
  calEventos.forEach((e) => (calMap[e.dia] = e.color));
  const calColors = { red: "#dc2626", amber: "#f59e0b", green: "#16a34a" };

  // Genealogía real
  const padreCarav = detalle?.registroGenetico?.padre?.caravana || detalle?.padre || animal.padre;
  const madreCarav = detalle?.registroGenetico?.madre?.caravana || detalle?.madre || animal.madre;
  const padreRaza = detalle?.registroGenetico?.padre?.raza || null;
  const madreRaza = detalle?.registroGenetico?.madre?.raza || null;

  // Estado actual real
  const condCorporal = detalle?.registrosPeso?.length
    ? (detalle.registrosPeso[detalle.registrosPeso.length - 1] as { condicionCorporal?: number | null }).condicionCorporal
    : null;
  const vacunaReciente = (detalle?.eventosSanitarios || []).some(
    (e) => e.tipo === "Vacunación" && Date.now() - new Date(e.fecha).getTime() < 365 * 24 * 3600 * 1000
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {modalEvento && <ModalRegistrarEvento animalPrefill={animal} onClose={() => setModalEvento(false)} />}
      {editOpen && (
        <ModalEditarAnimal
          animal={animal}
          onClose={() => setEditOpen(false)}
          onGuardado={() => {
            setEditOpen(false);
            onEditado && onEditado();
          }}
        />
      )}
      {bajaOpen && (
        <ModalDarDeBaja
          animal={animal}
          onClose={() => setBajaOpen(false)}
          onConfirmar={(datosBaja) => {
            onDarDeBaja && onDarDeBaja(animal.dbId, datosBaja);
            setBajaOpen(false);
          }}
        />
      )}
      <div style={{ background: "var(--mc-surface)", borderRadius: 16, width: "min(1180px, 97vw)", maxHeight: "94vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "0 24px", background: "linear-gradient(135deg, #0a5a24 0%, #16a34a 100%)", color: "#fff", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 4, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: "0.05em" }}>Ganadería / Animales / Ganado</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditOpen(true)} className="mc-btn mc-btn--sm" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
                <Icon name="edit" size={13} /> Editar
              </button>
              <button onClick={() => setModalEvento(true)} className="mc-btn mc-btn--sm" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
                <Icon name="plus" size={13} /> Registrar Evento
              </button>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 16 }}>✕</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 14, marginTop: 6, flexWrap: "wrap" }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "grid", placeItems: "center", fontSize: 26, overflow: "hidden" }}>
              {animal.api.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={animal.api.foto} alt={animal.id} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                "🐄"
              )}
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 800 }}>
                Caravana {animal.id}
                {animal.nombre ? <span style={{ fontWeight: 600, opacity: 0.85 }}> · {animal.nombre}</span> : null}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {[animal.categoria, animal.raza, animal.estado].filter((b) => b && b !== "—").map((b) => (
                  <span key={b as string} style={{ padding: "2px 10px", borderRadius: 12, background: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 600 }}>{b}</span>
                ))}
                {!animal.ok && <span style={{ padding: "2px 10px", borderRadius: 12, background: "rgba(239,68,68,0.7)", fontSize: 11, fontWeight: 700 }}>⚠ Requiere Atención</span>}
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
              {[
                { label: "Edad", value: animal.edad },
                { label: "Peso", value: animal.peso !== "N/A" ? `${animal.peso} kg` : "N/A" },
                { label: "Prod.", value: animal.prod && animal.prod !== "—" ? animal.prod : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{value}</div>
                  <div style={{ fontSize: 10, opacity: 0.75, marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body: 3 columnas */}
        <div style={{ display: "grid", gridTemplateColumns: "220px minmax(300px, 1fr) 250px", gap: 12, padding: "14px 18px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {/* IZQUIERDA: Ficha + Estado + Tratamientos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MCard title="Ficha Biológica">
              {([
                ["Lote", animal.lote],
                ["Raza", animal.raza],
                ["Sexo", animal.sexo === "M" ? "♂ Macho" : "♀ Hembra"],
                ["Origen", animal.api.origen || "—"],
                ["RFID", animal.rfid || "—"],
                ["Cond. Nacimiento", animal.api.condicionNacimiento || "—"],
                ["Edad", animal.edad],
                ["Peso actual", animal.peso !== "N/A" ? `${animal.peso} kg` : "N/A"],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--mc-line)", fontSize: 12 }}>
                  <span style={{ color: "var(--mc-text-3)" }}>{k}</span>
                  <span style={{ fontWeight: 600, color: "var(--mc-ink)", textAlign: "right", maxWidth: "55%" }}>{v}</span>
                </div>
              ))}
            </MCard>

            <MCard title="Estado Actual">
              {([
                ["Condición corporal", condCorporal ? `${condCorporal} / 5` : "—"],
                ["Ciclo reproductivo", h?.estadoActual || "—"],
                ["Vacunas al día", vacunaReciente ? "Sí ✓" : "Sin registro"],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--mc-line)", fontSize: 12 }}>
                  <span style={{ color: "var(--mc-text-3)" }}>{k}</span>
                  <span style={{ fontWeight: 600, color: "var(--mc-ink)" }}>{v}</span>
                </div>
              ))}
            </MCard>

            {tratamientos.length > 0 ? (
              <div style={{ background: "#fee2e2", border: "2px solid #fca5a5", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#dc2626", marginBottom: 8 }}>⚠ Tratamientos Activos</div>
                {tratamientos.map((t) => (
                  <div key={t.id} style={{ padding: "8px 10px", borderRadius: 8, background: "#fff", border: "1px solid #fca5a5", marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#7f1d1d", marginBottom: 3 }}>{t.medicamento || t.diagnostico}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#991b1b" }}>
                      <span>{t.dosis ? `${t.dosis} ml` : ""} {t.via || ""}</span>
                      <span style={{ padding: "1px 8px", borderRadius: 10, background: t.estado === "En retiro" ? "#fef3c7" : "#fee2e2", color: t.estado === "En retiro" ? "#92400e" : "#dc2626", fontWeight: 600 }}>{t.estado}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#b91c1c", marginTop: 3 }}>
                      {fmtFechaCorta(t.fechaInicio)} → dosis {t.dosisAplicadas}/{t.dosisTotales}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "var(--mc-green-50)", border: "1.5px solid var(--mc-green-200)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>Sin Tratamientos Activos</div>
                  <div style={{ fontSize: 11, color: "#16a34a" }}>Animal en buen estado de salud</div>
                </div>
              </div>
            )}
          </div>

          {/* CENTRO: gráficos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Evolución de Peso */}
            <div style={{ background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mc-text-3)" }}>Evolución de Peso</div>
                  <div style={{ fontSize: 10, color: "var(--mc-text-3)", marginTop: 1 }}>
                    {pesoData.length > 0
                      ? `${pesoData[pesoData.length - 1].kg} kg actuales · ${pesoData[pesoData.length - 1].kg - pesoData[0].kg >= 0 ? "+" : ""}${pesoData[pesoData.length - 1].kg - pesoData[0].kg} kg período`
                      : "Sin pesadas registradas en el período"}
                  </div>
                </div>
                <FilterBar active={pesoFilter} onChange={setPesoFilter} opts={["3M", "6M", "1A"]} />
              </div>
              {pesoData.length > 1 ? (
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto", overflow: "visible", display: "block" }}>
                  <defs>
                    <linearGradient id="gPeso2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <g key={f}>
                      <line x1={pL} y1={pT + cH * (1 - f)} x2={pL + cW} y2={pT + cH * (1 - f)} stroke="var(--mc-line)" strokeWidth={1} />
                      <text x={pL - 4} y={pT + cH * (1 - f) + 4} textAnchor="end" fontSize={8} fill="var(--mc-muted)">{Math.round(pMin + (pMax - pMin) * f)}</text>
                    </g>
                  ))}
                  <path d={pArea} fill="url(#gPeso2)" />
                  <path d={pLine} fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                  {pesoData.map((d, i) => (
                    <g key={i}>
                      <circle cx={px(i)} cy={py(d.kg)} r={4} fill="var(--mc-surface)" stroke="#16a34a" strokeWidth={2} />
                      {(i === 0 || i === pesoData.length - 1 || pesoData.length <= 6) && (
                        <text x={px(i)} y={py(d.kg) - 9} textAnchor="middle" fontSize={9} fill="#16a34a" fontWeight={700}>{d.kg}</text>
                      )}
                      {(i === 0 || i === pesoData.length - 1 || pesoData.length <= 8) && (
                        <text x={px(i)} y={pT + cH + 16} textAnchor="middle" fontSize={8} fill="var(--mc-text-3)">{d.mes}</text>
                      )}
                    </g>
                  ))}
                </svg>
              ) : (
                <div className="mc-empty" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12 }}>Registrá pesadas para ver la curva de peso.</div>
                </div>
              )}
            </div>

            {/* Producción Lechera */}
            <div style={{ background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mc-text-3)" }}>Producción Lechera</div>
                  <div style={{ fontSize: 10, color: "var(--mc-text-3)", marginTop: 1 }}>
                    {prodData.length > 0
                      ? `Promedio: ${Math.round(prodData.reduce((a, d) => a + d.lt, 0) / prodData.length)} lt/día · Pico: ${maxLt} lt`
                      : "Sin ordeñes registrados en el período"}
                  </div>
                </div>
                <FilterBar active={prodFilter} onChange={setProdFilter} opts={["3M", "6M", "1A"]} />
              </div>
              {prodData.length > 0 ? (
                <svg width={W} height={PH} viewBox={`0 0 ${W} ${PH}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto", display: "block" }}>
                  <defs>
                    <linearGradient id="gProd2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <line key={f} x1={pbL} y1={pbT + pcH * (1 - f)} x2={pbL + pcW2} y2={pbT + pcH * (1 - f)} stroke="var(--mc-line)" strokeWidth={1} />
                  ))}
                  {prodData.map((d, i) => {
                    const bH = (d.lt / maxLt) * pcH;
                    const slotW = pcW2 / prodData.length;
                    const bX = pbL + i * slotW + slotW * 0.15;
                    const bW = slotW * 0.7;
                    const bY = pbT + pcH - bH;
                    return (
                      <g key={i}>
                        <rect x={bX} y={bY} width={bW} height={bH} rx={4} fill="url(#gProd2)" />
                        {(i === 0 || i === prodData.length - 1 || prodData.length <= 6) && (
                          <text x={bX + bW / 2} y={bY - 4} textAnchor="middle" fontSize={9} fill="#3b82f6" fontWeight={700}>{d.lt}L</text>
                        )}
                        {(i === 0 || i === prodData.length - 1 || prodData.length <= 8) && (
                          <text x={bX + bW / 2} y={pbT + pcH + 15} textAnchor="middle" fontSize={8} fill="var(--mc-text-3)">{d.mes}</text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="mc-empty" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12 }}>Sin registros lecheros para este animal.</div>
                </div>
              )}
            </div>
          </div>

          {/* DERECHA: Genealogía + Historial + Calendario */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MCard title="Genealogía / Pedigree">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#0a5a24,#16a34a)", display: "grid", placeItems: "center", fontSize: 22, boxShadow: "0 2px 8px rgba(22,163,74,0.3)", border: "3px solid var(--mc-surface)" }}>🐄</div>
                  <div style={{ marginTop: 5, textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mc-ink)" }}>{animal.id}</div>
                    <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>{animal.raza}</div>
                  </div>
                </div>
                <div style={{ width: 2, height: 14, background: "var(--mc-line-2)", margin: "6px 0" }} />
                <div style={{ display: "flex", width: "100%", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 2, background: "var(--mc-line-2)" }} />
                  <div style={{ position: "absolute", top: 0, left: "25%", width: 2, height: 14, background: "var(--mc-line-2)" }} />
                  <div style={{ position: "absolute", top: 0, right: "25%", width: 2, height: 14, background: "var(--mc-line-2)" }} />
                </div>
                <div style={{ height: 14 }} />
                <div style={{ display: "flex", gap: 12, width: "100%" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#dbeafe", display: "grid", placeItems: "center", fontSize: 20, border: "2.5px solid #93c5fd" }}>🐂</div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#1d4ed8" }}>{padreCarav ? `Toro ${padreCarav}` : "Sin registro"}</div>
                      {padreRaza && <div style={{ fontSize: 9, color: "var(--mc-text-3)" }}>{padreRaza}</div>}
                      <div style={{ fontSize: 9, color: "#3b82f6", fontWeight: 600 }}>Padre</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fce7f3", display: "grid", placeItems: "center", fontSize: 20, border: "2.5px solid #f9a8d4" }}>🐄</div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#be185d" }}>{madreCarav ? `Vaca ${madreCarav}` : "Sin registro"}</div>
                      {madreRaza && <div style={{ fontSize: 9, color: "var(--mc-text-3)" }}>{madreRaza}</div>}
                      <div style={{ fontSize: 9, color: "#ec4899", fontWeight: 600 }}>Madre</div>
                    </div>
                  </div>
                </div>
              </div>
            </MCard>

            {/* Historial Reproductivo Completo */}
            <div style={{ background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mc-text-3)", marginBottom: 8 }}>Historial Reproductivo Completo</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                {[
                  { label: "Estado Actual", value: h?.estadoActual || "—", color: h?.estadoActual === "Preñada" ? "#16a34a" : "var(--mc-ink)" },
                  { label: "Últ. Parto", value: h?.ultimoParto ? fmtFecha(h.ultimoParto) : "—", color: "var(--mc-ink)" },
                  { label: "Nro. de Partos", value: String(h?.totalPartos ?? 0), color: "var(--mc-ink)" },
                  { label: "Crías Vivas", value: String(h?.totalCriasVivas ?? 0), color: "#16a34a" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: "6px 8px", background: "var(--mc-surface)", borderRadius: 8, border: "1px solid var(--mc-line)" }}>
                    <div style={{ fontSize: 9, color: "var(--mc-text-3)", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>
              {partos.length > 0 && (
                <div style={{ padding: "6px 8px", background: "var(--mc-surface)", borderRadius: 8, border: "1px solid var(--mc-line)", marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: "var(--mc-text-3)", fontWeight: 600, marginBottom: 4 }}>Facilidad de Parto</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {partos.slice(0, 3).map((p, i) => {
                      const v = p.condicionParto || "Normal";
                      const c = v === "Normal" ? "#16a34a" : "#f59e0b";
                      return (
                        <span key={p.id} style={{ padding: "2px 8px", borderRadius: 10, background: c + "18", color: c, fontSize: 10, fontWeight: 600, border: `1px solid ${c}44` }}>
                          Parto {partos.length - i}: {v === "Normal" ? "Sola" : v}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {reproHistory.length === 0 && (
                  <div style={{ fontSize: 11, color: "var(--mc-text-3)" }}>Sin eventos reproductivos registrados.</div>
                )}
                {reproHistory.slice(0, 4).map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, background: r.ok ? "var(--mc-green-50)" : "#fff7ed", border: `1px solid ${r.ok ? "var(--mc-green-200)" : "#fed7aa"}` }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: r.ok ? "#16a34a" : "#f59e0b", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{r.ok ? "✓" : "✗"}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mc-ink)" }}>{r.evento}</div>
                      <div style={{ fontSize: 10, color: "var(--mc-text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.resultado}</div>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--mc-text-3)", flexShrink: 0 }}>{r.fecha}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendario mensual */}
            <MCard title={`Calendario Mensual — ${MESES_FULL[hoy.getMonth()]}`}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                  <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "var(--mc-text-3)", padding: "2px 0" }}>{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((d) => {
                  const evt = calMap[d];
                  return (
                    <div key={d} style={{ textAlign: "center", fontSize: 10, padding: "3px 1px", borderRadius: 5, cursor: evt ? "pointer" : "default", background: evt ? calColors[evt] + "18" : "transparent", color: evt ? calColors[evt] : d === hoy.getDate() ? "var(--mc-green-700)" : "var(--mc-ink)", fontWeight: evt || d === hoy.getDate() ? 700 : 400 }}>
                      {d}
                      {evt && <div style={{ width: 4, height: 4, borderRadius: "50%", background: calColors[evt], margin: "0 auto", marginTop: 1 }} />}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                {calEventos.length === 0 && <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>Sin eventos programados este mes.</div>}
                {calEventos.slice(0, 4).map((ev, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: calColors[ev.color], flexShrink: 0 }} />
                    <span style={{ color: "var(--mc-text-3)" }}>{String(ev.dia).padStart(2, "0")} {MESES_FULL[hoy.getMonth()].slice(0, 3)}</span>
                    <span style={{ color: "var(--mc-ink)", fontWeight: 500 }}>{ev.label}</span>
                  </div>
                ))}
              </div>
            </MCard>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 8, padding: "12px 20px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap" }}>
          <div className="row gap-8">
            {animal.activo === false ? (
              <>
                <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "var(--mc-line)", color: "var(--mc-text-2)", display: "flex", alignItems: "center" }}>Animal Inactivo</span>
                <button className="mc-btn mc-btn--secondary" style={{ color: "#16a34a", borderColor: "#16a34a" }} onClick={() => onReactivar && onReactivar(animal.dbId)}>
                  <Icon name="refresh" size={13} />Reactivar
                </button>
              </>
            ) : (
              <button className="mc-btn mc-btn--ghost" style={{ color: "var(--mc-red)" }} onClick={() => setBajaOpen(true)}>
                <Icon name="trash" size={13} />Dar de Baja
              </button>
            )}
          </div>
          <div className="row gap-8">
            <button className="mc-btn mc-btn--secondary" onClick={() => { onVerTimeline && onVerTimeline(animal); onClose(); }}>
              <Icon name="list" size={13} />Ver Historial Completo
            </button>
            <button className="mc-btn mc-btn--primary" onClick={() => { onClose(); router.push("/mov-tropas"); }}>
              <Icon name="mapPin" size={13} />Ir al Mapa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ EDITAR ANIMAL (rápido) ============ */

export function ModalEditarAnimal({
  animal,
  onClose,
  onGuardado,
}: {
  animal: AnimalRow;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const [nombre, setNombre] = useState(animal.nombre || "");
  const [categoria, setCategoria] = useState(animal.categoria !== "—" ? animal.categoria : "");
  const [raza, setRaza] = useState(animal.raza !== "—" ? animal.raza : "");
  const [ubicacion, setUbicacion] = useState(animal.api.ubicacion || "");
  const [rfid, setRfid] = useState(animal.rfid || "");
  const [tropaId, setTropaId] = useState(animal.tropaId || "");
  const [tropas, setTropas] = useState<TropaLite[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/tropas")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: { id: string; nombre: string }[]) => setTropas(d.map((t) => ({ id: t.id, nombre: t.nombre }))))
      .catch(() => {});
  }, []);

  const guardar = async () => {
    setGuardando(true);
    try {
      await fetch(`/api/animales/${animal.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, categoria, raza, ubicacion, rfid, tropaId: tropaId || null }),
      });
      onGuardado();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" style={{ zIndex: 10001 }} onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(460px,95vw)", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="mc-modal__title" style={{ fontSize: 20 }}>Editar {animal.id}</div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="grid g-cols-2 gap-8">
            <div className="mc-field">
              <label className="mc-label">Nombre</label>
              <input className="mc-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="mc-field">
              <label className="mc-label">Categoría</label>
              <select className="mc-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">—</option>
                {["Vaca", "Vaquillona", "Novillo", "Ternero", "Toro"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="mc-field">
              <label className="mc-label">Raza</label>
              <input className="mc-input" value={raza} onChange={(e) => setRaza(e.target.value)} />
            </div>
            <div className="mc-field">
              <label className="mc-label">RFID</label>
              <input className="mc-input" value={rfid} onChange={(e) => setRfid(e.target.value)} />
            </div>
            <div className="mc-field">
              <label className="mc-label">Tropa</label>
              <select className="mc-select" value={tropaId} onChange={(e) => setTropaId(e.target.value)}>
                <option value="">Sin tropa</option>
                {tropas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="mc-field">
              <label className="mc-label">Ubicación</label>
              <input className="mc-input" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Lote / corral" />
            </div>
          </div>
        </div>
        <div className="mc-modal__foot">
          <button onClick={onClose} className="mc-btn mc-btn--secondary">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="mc-btn mc-btn--primary"><Icon name="check" size={13} />{guardando ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============ NUEVO ANIMAL ============ */

const RAZAS_POR_TIPO: Record<string, string[]> = {
  Bovino: ["Angus", "Hereford", "Holando Argentino", "Cruce Industrial", "Shorthorn", "Limousin", "Braford", "Brangus", "Jersey"],
  Equino: ["Criollo", "Cuarto de Milla", "Árabe", "Polo Argentino", "Frisón"],
  Ovino: ["Corriedale", "Merino", "Romney Marsh", "Suffolk", "Texel"],
  Porcino: ["Duroc", "Hampshire", "Landrace", "Yorkshire", "Pietrain"],
  Caprino: ["Angora", "Boer", "Nubian", "Saanen", "Criollo"],
  Otro: ["Sin raza definida"],
};

export function NuevoAnimalModal({
  onClose,
  onCreado,
}: {
  onClose: () => void;
  onCreado?: () => void;
}) {
  const [tipoAnimal, setTipoAnimal] = useState("Bovino");
  const [sexo, setSexo] = useState("Hembra");
  const [origen, setOrigen] = useState("Nacimiento");
  const [raza, setRaza] = useState("Angus");
  const [categoria, setCategoria] = useState("");
  const [tropaId, setTropaId] = useState("");
  const [caravana, setCaravana] = useState("");
  const [rfid, setRfid] = useState("");
  const [nombre, setNombre] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [pesoInicial, setPesoInicial] = useState("");
  const [loteAsig, setLoteAsig] = useState("");
  const [madre, setMadre] = useState("");
  const [padre, setPadre] = useState("");
  const [condNac, setCondNac] = useState("Normal");
  const [foto, setFoto] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [tropas, setTropas] = useState<TropaLite[]>([]);
  const [lotes, setLotes] = useState<{ id: string; nombre: string }[]>([]);

  useEffect(() => {
    fetch("/api/tropas").then((r) => (r.ok ? r.json() : [])).then((d: { id: string; nombre: string }[]) => setTropas(d)).catch(() => {});
    fetch("/api/lotes").then((r) => (r.ok ? r.json() : [])).then((d: { id: string; nombre: string }[]) => setLotes(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const razas = RAZAS_POR_TIPO[tipoAnimal] || ["Sin raza definida"];

  // Categoría sugerida automáticamente por edad + sexo (bovinos)
  const catSugerida = useMemo(() => {
    const meses = fechaNac ? calcEdad(fechaNac).meses ?? 0 : 0;
    if (tipoAnimal !== "Bovino") return sexo === "Hembra" ? "Hembra" : "Macho";
    if (meses < 12) return sexo === "Hembra" ? "Ternera" : "Ternero";
    if (sexo === "Hembra") return meses < 30 ? "Vaquillona" : "Vaca";
    return meses < 36 ? "Novillo" : "Toro";
  }, [fechaNac, sexo, tipoAnimal]);

  const subirFoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const esc = Math.min(1, 480 / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * esc);
        canvas.height = Math.round(img.height * esc);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFoto(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const guardar = async (yNueva: boolean) => {
    if (!caravana.trim()) {
      setError("La caravana es obligatoria");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const res = await fetch("/api/animales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caravana: caravana.trim(),
          nombre: nombre.trim() || null,
          tipo: tipoAnimal,
          categoria: categoria || catSugerida,
          raza,
          sexo,
          fechaNacimiento: fechaNac || null,
          pesoNacimiento: pesoInicial || null,
          madre: madre.trim() || null,
          padre: padre.trim() || null,
          rfid: rfid.trim() || null,
          origen,
          condicionNacimiento: condNac,
          foto,
          ubicacion: loteAsig || null,
          tropaId: tropaId || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error al guardar");
      }
      onCreado && onCreado();
      if (yNueva) {
        setCaravana("");
        setRfid("");
        setNombre("");
        setFoto(null);
        setPesoInicial("");
      } else {
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const Sec = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: 7, background: "var(--mc-green-600)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{n}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mc-text-3)" }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "var(--mc-line)" }} />
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--mc-text-3)", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );

  const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1.5px solid var(--mc-line-2)", borderRadius: 8, fontSize: 13, outline: "none", background: "var(--mc-surface)" };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--mc-surface)", borderRadius: 16, width: "min(900px, 96vw)", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", overflow: "hidden" }}>
        <div style={{ padding: "18px 28px 16px", background: "linear-gradient(135deg, #0a5a24 0%, #16a34a 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: "0.05em", marginBottom: 2 }}>Ganadería / Animales</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Registro de Nuevo Animal</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20, padding: "20px 28px", overflowY: "auto", flex: 1 }}>
          {/* Col 1: Identidad */}
          <div>
            <Sec n="1" title="Identidad">
              <Field label="Tipo de Animal">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                  {[
                    { label: "🐄 Bovino", val: "Bovino" },
                    { label: "🐴 Equino", val: "Equino" },
                    { label: "🐑 Ovino", val: "Ovino" },
                    { label: "🐷 Porcino", val: "Porcino" },
                    { label: "🐐 Caprino", val: "Caprino" },
                    { label: "➕ Otro", val: "Otro" },
                  ].map(({ label, val }) => (
                    <button
                      key={val}
                      onClick={() => { setTipoAnimal(val); setRaza(RAZAS_POR_TIPO[val][0]); }}
                      style={{
                        padding: "7px 4px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "center",
                        border: `1.5px solid ${tipoAnimal === val ? "var(--mc-green-600)" : "var(--mc-line-2)"}`,
                        background: tipoAnimal === val ? "var(--mc-green-50)" : "var(--mc-surface)",
                        color: tipoAnimal === val ? "var(--mc-green-600)" : "var(--mc-ink)",
                      }}
                    >{label}</button>
                  ))}
                </div>
              </Field>
              <Field label="Sexo">
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ label: "♂ Macho", val: "Macho" }, { label: "♀ Hembra", val: "Hembra" }].map(({ label, val }) => (
                    <button
                      key={val}
                      onClick={() => setSexo(val)}
                      style={{
                        flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        border: `1.5px solid ${sexo === val ? (val === "Macho" ? "#3b82f6" : "#ec4899") : "var(--mc-line-2)"}`,
                        background: sexo === val ? (val === "Macho" ? "#eff6ff" : "#fdf2f8") : "var(--mc-surface)",
                        color: sexo === val ? (val === "Macho" ? "#1d4ed8" : "#be185d") : "var(--mc-ink)",
                      }}
                    >{label}</button>
                  ))}
                </div>
              </Field>
              <Field label="Nro. Caravana *">
                <input style={inp} value={caravana} onChange={(e) => setCaravana(e.target.value)} placeholder="Ej: #3311" />
              </Field>
              <Field label="Nombre (opcional)">
                <input style={inp} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Rosa" />
              </Field>
              <Field label="ID Electrónico / RFID (Opcional)">
                <input style={inp} value={rfid} onChange={(e) => setRfid(e.target.value)} placeholder="Ej: 076 8230 4821 0" />
              </Field>
              <Field label="Raza">
                <select style={inp} value={raza} onChange={(e) => setRaza(e.target.value)}>
                  {razas.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Categoría">
                <select style={inp} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option value="">Automática ({catSugerida})</option>
                  {["Vaca", "Vaquillona", "Novillo", "Ternero", "Toro"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Foto">
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", border: "1.5px dashed var(--mc-line-2)", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "var(--mc-text-3)", background: "var(--mc-surface-2)", overflow: "hidden" }}>
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto} alt="foto" style={{ maxHeight: 80, borderRadius: 6 }} />
                  ) : (
                    <>
                      <span style={{ fontSize: 22 }}>📷</span>
                      <span>Subir foto</span>
                    </>
                  )}
                  <input type="file" style={{ display: "none" }} accept="image/*" onChange={(e) => subirFoto(e.target.files?.[0])} />
                </label>
              </Field>
            </Sec>
          </div>

          {/* Col 2: Origen & Bio */}
          <div>
            <Sec n="2" title="Origen & Bio">
              <Field label="Origen">
                <div style={{ display: "flex", gap: 6 }}>
                  {["Nacimiento", "Compra"].map((o) => (
                    <button
                      key={o}
                      onClick={() => setOrigen(o)}
                      style={{
                        flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        border: `1.5px solid ${origen === o ? "var(--mc-green-600)" : "var(--mc-line-2)"}`,
                        background: origen === o ? "var(--mc-green-600)" : "var(--mc-surface)",
                        color: origen === o ? "#fff" : "var(--mc-ink)",
                      }}
                    >{o}</button>
                  ))}
                </div>
              </Field>
              <Field label="Fecha de Nacimiento">
                <input type="date" style={inp} value={fechaNac} onChange={(e) => setFechaNac(e.target.value)} />
              </Field>
              <Field label="Peso Inicial (kg)">
                <input type="number" style={inp} value={pesoInicial} onChange={(e) => setPesoInicial(e.target.value)} placeholder="Ej: 38" />
              </Field>
              <Field label="Condición al Nacimiento">
                <select style={inp} value={condNac} onChange={(e) => setCondNac(e.target.value)}>
                  {["Normal", "Distócico", "Cesárea", "Gemelar"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mc-text-3)", marginBottom: 8 }}>Genealogía</div>
                <Field label="Madre (Dam)">
                  <input style={inp} value={madre} onChange={(e) => setMadre(e.target.value)} placeholder="Caravana de la madre…" />
                </Field>
                <Field label="Padre / Semen (IA)">
                  <input style={inp} value={padre} onChange={(e) => setPadre(e.target.value)} placeholder="Toro o partida IA…" />
                </Field>
              </div>
            </Sec>
          </div>

          {/* Col 3: Asignación */}
          <div>
            <Sec n="3" title="Asignación">
              <Field label="Asignar a Tropa">
                <select style={inp} value={tropaId} onChange={(e) => setTropaId(e.target.value)}>
                  <option value="">Seleccionar tropa…</option>
                  {tropas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                {tropas.length === 0 && <div style={{ fontSize: 10.5, color: "var(--mc-text-3)", marginTop: 4 }}>Todavía no hay tropas — crealas en Mov. de Tropas.</div>}
              </Field>
              <Field label="Lote">
                <select style={inp} value={loteAsig} onChange={(e) => setLoteAsig(e.target.value)}>
                  <option value="">Seleccionar lote…</option>
                  {lotes.map((l) => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
                </select>
              </Field>
              <Field label="Categoría Sugerida (auto)">
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1.5px solid var(--mc-green-200)", borderRadius: 8, background: "var(--mc-green-50)" }}>
                  <span style={{ fontSize: 18 }}>{tipoAnimal === "Bovino" ? "🐄" : tipoAnimal === "Equino" ? "🐴" : tipoAnimal === "Ovino" ? "🐑" : tipoAnimal === "Porcino" ? "🐷" : "🐐"}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{catSugerida}</div>
                    <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>asignado automáticamente</div>
                  </div>
                </div>
              </Field>
              <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--mc-surface-2)", borderRadius: 10, border: "1px solid var(--mc-line)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resumen</div>
                {([
                  ["Tipo", tipoAnimal],
                  ["Sexo", sexo],
                  ["Caravana", caravana || "—"],
                  ["Raza", raza],
                  ["Origen", origen],
                  ["Tropa", tropas.find((t) => t.id === tropaId)?.nombre || "—"],
                  ["Lote", loteAsig || "—"],
                  ["Madre", madre || "—"],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--mc-line)" }}>
                    <span style={{ color: "var(--mc-text-3)" }}>{k}</span>
                    <span style={{ fontWeight: 600, color: "var(--mc-ink)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </Sec>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, padding: "14px 28px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", justifyContent: "flex-end", alignItems: "center" }}>
          {error && <span style={{ fontSize: 12, color: "var(--mc-red)", marginRight: "auto" }}>{error}</span>}
          <button className="mc-btn mc-btn--secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--secondary" disabled={guardando} onClick={() => guardar(true)}><Icon name="plus" size={13} />Subir y Nueva</button>
          <button className="mc-btn mc-btn--primary" disabled={guardando} onClick={() => guardar(false)}><Icon name="check" size={13} />{guardando ? "Guardando…" : "Guardar Animal"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============ DAR DE BAJA ============ */

export function ModalDarDeBaja({
  animal,
  onClose,
  onConfirmar,
}: {
  animal: AnimalRow;
  onClose: () => void;
  onConfirmar: (datos: BajaInfo) => void;
}) {
  const [tipo, setTipo] = useState<string | null>(null);
  const [subcausa, setSubcausa] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState("");
  const tipos = ["Muerte", "Venta (fuera de circuito)", "Robo o Extravío", "Otro"];
  const subcausas = ["Enfermedad", "Accidente", "Complicación de parto", "Depredación", "Otra"];
  const puedeConfirmar = !!tipo && (tipo !== "Muerte" || !!subcausa);

  const confirmar = () => {
    if (!puedeConfirmar || !tipo) return;
    onConfirmar({ tipo, subcausa: tipo === "Muerte" ? subcausa : null, fecha, notas });
  };

  return (
    <div className="mc-modal-backdrop" style={{ zIndex: 10001 }} onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(500px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="row gap-10" style={{ alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="alert-triangle" size={18} style={{ color: "#c48410" }} />
              </div>
              <div>
                <div className="mc-modal__title" style={{ fontSize: 20 }}>Dar de Baja</div>
                <div style={{ fontSize: 12, color: "var(--mc-text-2)", marginTop: 2 }}>{animal.id} · {animal.categoria}{animal.raza !== "—" ? ` · ${animal.raza}` : ""}</div>
              </div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <SecNum n={1} title="Tipo de baja" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {tipos.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTipo(t); if (t !== "Muerte") setSubcausa(""); }}
                  style={{
                    padding: "8px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", textAlign: "center",
                    border: `1.5px solid ${tipo === t ? "var(--mc-red)" : "var(--mc-line-2)"}`,
                    background: tipo === t ? "var(--mc-red-bg)" : "var(--mc-surface)",
                    color: tipo === t ? "var(--mc-red)" : "var(--mc-ink)",
                  }}
                >{t}</button>
              ))}
            </div>
          </div>

          {tipo === "Muerte" && (
            <div>
              <SecNum n={2} title="Causa" />
              <select value={subcausa} onChange={(e) => setSubcausa(e.target.value)} className="mc-select">
                <option value="">Seleccionar causa…</option>
                {subcausas.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div>
            <SecNum n={tipo === "Muerte" ? 3 : 2} title="Fecha y notas" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mc-input" />
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Detalles adicionales…" rows={3} className="mc-textarea" />
            </div>
          </div>
        </div>
        <div className="mc-modal__foot">
          <button onClick={onClose} className="mc-btn mc-btn--secondary">Cancelar</button>
          <button onClick={confirmar} disabled={!puedeConfirmar} className="mc-btn mc-btn--red" style={{ opacity: puedeConfirmar ? 1 : 0.5, cursor: puedeConfirmar ? "pointer" : "not-allowed" }}>
            <Icon name="trash" size={13} />Confirmar Baja
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ REGISTRAR EVENTO (timeline) ============ */

const TIPOS_EVENTO_ANIMAL = [
  { id: "Sanitario", icon: "heart" },
  { id: "Reproductivo", icon: "star" },
  { id: "Peso", icon: "scale" },
  { id: "Traslado", icon: "move-right" },
  { id: "Alimentación", icon: "leaf" },
  { id: "Otro", icon: "more" },
];

export function ModalRegistrarEvento({
  animalPrefill,
  tipoPrefill,
  animales,
  onClose,
  onGuardado,
}: {
  animalPrefill?: AnimalRow | null;
  tipoPrefill?: string;
  animales?: AnimalRow[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const [tipo, setTipo] = useState(tipoPrefill || "Sanitario");
  const [animalTxt, setAnimalTxt] = useState(animalPrefill ? animalPrefill.nombre || animalPrefill.id : "");
  const [titulo, setTitulo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const confirmar = async () => {
    const pool = animales || (animalPrefill ? [animalPrefill] : []);
    const norm = (v: string) => v.replace(/^#/, "").trim().toLowerCase();
    const encontrado =
      animalPrefill && norm(animalTxt) === norm(animalPrefill.nombre || animalPrefill.id)
        ? animalPrefill
        : pool.find((a) => norm(a.id) === norm(animalTxt) || norm(a.nombre || "") === norm(animalTxt));
    if (!encontrado) {
      setError("Animal no encontrado — usá la caravana exacta");
      return;
    }
    if (!titulo.trim()) {
      setError("Describí el evento");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await fetch("/api/eventos-vida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: encontrado.dbId,
          tipoEvento: tipo,
          titulo: titulo.trim(),
        }),
      });
      onGuardado && onGuardado();
      onClose();
    } catch {
      setError("No se pudo guardar el evento");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" style={{ zIndex: 10001 }} onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(480px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-green-600)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Animales</div>
              <div className="mc-modal__title" style={{ fontSize: 20 }}>Registrar Evento</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="mc-field">
            <label className="mc-label">Animal afectado</label>
            <input className="mc-input" value={animalTxt} onChange={(e) => setAnimalTxt(e.target.value)} placeholder="ID o nombre del animal" />
          </div>

          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 12, display: "block" }}>Tipo de evento</span>
            <div className="grid g-cols-3 gap-8">
              {TIPOS_EVENTO_ANIMAL.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTipo(t.id)}
                  type="button"
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                    border: tipo === t.id ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)",
                    background: tipo === t.id ? "var(--mc-green-50)" : "var(--mc-surface)",
                  }}
                >
                  <Icon name={t.icon} size={18} style={{ color: tipo === t.id ? "var(--mc-green-700)" : "var(--mc-text-2)" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: tipo === t.id ? "var(--mc-green-700)" : "var(--mc-text-2)", textAlign: "center" }}>{t.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mc-field">
            <label className="mc-label">Descripción</label>
            <textarea className="mc-textarea" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Qué pasó / qué se hizo…" />
          </div>
          {error && <div style={{ fontSize: 12, color: "var(--mc-red)" }}>{error}</div>}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} disabled={guardando} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }}>
            <Icon name="check" size={14} /> {guardando ? "Guardando…" : "Registrar Evento"}
          </button>
        </div>
      </div>
    </div>
  );
}
