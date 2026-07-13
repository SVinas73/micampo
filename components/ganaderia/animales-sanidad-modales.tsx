"use client";

// Sanidad (Hospital Digital): diagrama anatómico interactivo, diagnóstico
// asistido por IA (/api/sanidad-ia/diagnosticar), registro de tratamientos con
// seguimiento multi-dosis y confirmación de dosis. Sin datos demo: las zonas
// del heatmap se calculan de los tratamientos reales.

import React, { useState } from "react";
import { Icon, IABadge } from "@/components/mc";
import { AnimalRow, TratamientoAPI } from "./tipos";
import { SecNum } from "./animales-modales";

/* ============ Config de zonas anatómicas (dominio veterinario) ============ */

export const ZONA_INFO_SANIDAD: Record<string, { label: string; chips: string[]; diags: string[] }> = {
  cabeza: { label: "Cabeza / Ojos", chips: ["Fiebre", "Secreción nasal", "Ojos llorosos"], diags: ["Queratoconjuntivitis", "Rinotraqueítis Infecciosa", "Fiebre de Leche"] },
  cuello: { label: "Cuello / Papada", chips: ["Ganglios inflamados", "Rigidez", "Herida"], diags: ["Actinobacilosis", "Absceso", "Linfadenitis"] },
  costillas: { label: "Costillas / Tórax", chips: ["Dificultad respiratoria", "Tos", "Pérdida de peso"], diags: ["Neumonía", "Timpanismo", "Pleuresía"] },
  columna: { label: "Columna / Lomo", chips: ["Postura anormal", "Dolor al tacto", "Rigidez"], diags: ["Hipocalcemia", "Lesión Medular", "Distocia Previa"] },
  cadera: { label: "Cadera / Anca", chips: ["Dificultad para levantarse", "Cojera", "Hinchazón"], diags: ["Paresia Puerperal", "Luxación de Cadera", "Miopatía"] },
  ubre: { label: "Ubre", chips: ["Inflamación", "Leche anormal", "Dolor al tacto"], diags: ["Mastitis Clínica", "Mastitis Subclínica", "Edema de Ubre"] },
  patas: { label: "Pezuñas / Patas", chips: ["Cojera", "Hinchazón", "Herida visible"], diags: ["Pietín", "Laminitis", "Absceso Podal"] },
  cola: { label: "Cola", chips: ["Suciedad / Diarrea", "Herida", "Parásitos"], diags: ["Diarrea Infecciosa", "Parasitosis", "Dermatitis"] },
};
export const MARCA_ZONAS_SANIDAD = [
  { id: "columna", label: "Lomo" },
  { id: "cola", label: "Cola" },
  { id: "patas", label: "Patas" },
  { id: "cabeza", label: "Cabeza" },
];
export const MARCA_COLORES_SANIDAD = ["#dc2626", "#f59e0b", "#2563eb", "#16a34a", "#7c3aed", "#111827"];

export function MarcasFisicasSanidad({
  marcaZonas,
  toggleMarcaZona,
  marcaColor,
  setMarcaColor,
}: {
  marcaZonas: string[];
  toggleMarcaZona: (z: string) => void;
  marcaColor: string;
  setMarcaColor: (c: string) => void;
}) {
  return (
    <div style={{ background: "var(--mc-bg)", border: "1px solid var(--mc-line)", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Marcas físicas visuales</div>
      <div className="col gap-10">
        <div>
          <label className="mc-label">Ubicación</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {MARCA_ZONAS_SANIDAD.map((z) => (
              <button key={z.id} type="button" onClick={() => toggleMarcaZona(z.id)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: marcaZonas.includes(z.id) ? "1.5px solid var(--mc-green-500)" : "1px solid var(--mc-line-2)", background: marcaZonas.includes(z.id) ? "var(--mc-green-50)" : "var(--mc-surface)", color: marcaZonas.includes(z.id) ? "var(--mc-green-700)" : "var(--mc-text-2)" }}>{z.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="mc-label">Color</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {MARCA_COLORES_SANIDAD.map((c) => (
              <button key={c} type="button" onClick={() => setMarcaColor(c)} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: marcaColor === c ? "3px solid var(--mc-ink)" : "2px solid var(--mc-surface)", boxShadow: marcaColor === c ? "0 0 0 2px " + c : "0 0 0 1px var(--mc-line-2)", cursor: "pointer" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ CowHeatmap — diagrama anatómico interactivo ============ */

export type ZonaStat = { zona: string; casos: number; pct: number; cond: string };

/** Calcula estadísticas por zona a partir de tratamientos reales. */
export function zonasDesdeTratamientos(tratamientos: TratamientoAPI[], totalAnimales: number): ZonaStat[] {
  const porZona = new Map<string, { casos: number; conds: Map<string, number> }>();
  for (const t of tratamientos) {
    const z = t.zona || "";
    if (!ZONA_INFO_SANIDAD[z]) continue;
    const e = porZona.get(z) || { casos: 0, conds: new Map() };
    e.casos += 1;
    e.conds.set(t.diagnostico, (e.conds.get(t.diagnostico) || 0) + 1);
    porZona.set(z, e);
  }
  const base = Math.max(1, totalAnimales);
  return Array.from(porZona.entries()).map(([zona, e]) => ({
    zona,
    casos: e.casos,
    pct: Math.round((e.casos / base) * 1000) / 10,
    cond: Array.from(e.conds.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "—",
  }));
}

const ZONA_POS: Record<string, { cx: number; cy: number }> = {
  ubre: { cx: 210, cy: 152 },
  patas: { cx: 110, cy: 185 },
  cuello: { cx: 72, cy: 85 },
  columna: { cx: 185, cy: 60 },
  cabeza: { cx: 32, cy: 88 },
  costillas: { cx: 150, cy: 98 },
  cadera: { cx: 252, cy: 102 },
  cola: { cx: 292, cy: 96 },
};

export function CowHeatmap({
  selectable = false,
  selected = null,
  onSelect,
  stats = [],
}: {
  selectable?: boolean;
  selected?: string | null;
  onSelect?: (zona: string) => void;
  stats?: ZonaStat[];
}) {
  const [hov, setHov] = useState<string | null>(null);
  const heatColor = (pct: number) => (pct >= 10 ? "#dc2626" : pct >= 6 ? "#ea580c" : pct >= 3 ? "#f59e0b" : "#65a30d");
  const heatLabel = (pct: number) => (pct >= 10 ? "Crítica" : pct >= 6 ? "Alta" : pct >= 3 ? "Media" : "Baja");

  // En modo seleccionable mostramos TODAS las zonas (aunque no tengan casos)
  // para que se pueda elegir cualquiera; en modo lectura solo las que tienen casos.
  const statMap = new Map(stats.map((s) => [s.zona, s]));
  const zonaIds = selectable ? Object.keys(ZONA_INFO_SANIDAD) : stats.map((s) => s.zona);
  const zonas = zonaIds
    .filter((z) => ZONA_POS[z])
    .map((z) => {
      const s = statMap.get(z);
      const pct = s?.pct ?? 0;
      return {
        id: z,
        zona: z,
        label: ZONA_INFO_SANIDAD[z]?.label || z,
        pct,
        casos: s?.casos ?? 0,
        cond: s?.cond || "Sin casos",
        color: s ? heatColor(pct) : "#65a30d",
        r: 9 + Math.min(12, pct * 0.75),
        ...ZONA_POS[z],
      };
    });
  const hovZ = zonas.find((z) => z.id === hov);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 340 220" width="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id="cowBodyGradH" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef2ee" />
            <stop offset="100%" stopColor="#dde4dd" />
          </linearGradient>
          <linearGradient id="cowLegGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8dfd8" />
            <stop offset="100%" stopColor="#c4ccc4" />
          </linearGradient>
          <filter id="cowShadow" x="-5%" y="-5%" width="110%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1e293b" floodOpacity="0.08" />
          </filter>
          {zonas.map((z) => (
            <radialGradient key={z.id + "g"} id={"czg" + z.id}>
              <stop offset="0%" stopColor={z.color} stopOpacity="0.9" />
              <stop offset="70%" stopColor={z.color} stopOpacity="0.45" />
              <stop offset="100%" stopColor={z.color} stopOpacity="0.05" />
            </radialGradient>
          ))}
        </defs>

        {/* Cola */}
        <path d="M280,78 Q310,55 308,72 Q306,90 294,105 Q286,115 282,112" fill="none" stroke="#b8c8b8" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="282" cy="114" rx="8" ry="5" fill="#cdd8cd" stroke="#b8c8b8" strokeWidth="1" />

        {/* Cuerpo */}
        <path d="M88,70 C 108,50 165,42 225,48 C 262,52 283,70 282,98 C 281,124 260,142 230,148 Q 205,154 175,154 Q 148,154 128,148 C 100,140 80,122 78,104 C 76,86 82,74 88,70 Z" fill="url(#cowBodyGradH)" stroke="#c0cec0" strokeWidth="1.5" filter="url(#cowShadow)" />
        <path d="M88,104 Q130,148 175,154 Q205,154 230,148" fill="none" stroke="#c8d4c8" strokeWidth="0.8" />

        {/* Ubre */}
        <path d="M170,150 Q175,164 182,168 Q192,172 202,168 Q212,162 214,150" fill="#f5b8c8" stroke="#e8a0b8" strokeWidth="1" opacity="0.85" />
        {[178, 188, 198, 208].map((tx, i) => (
          <rect key={i} x={tx - 2} y={166} width="4" height="7" rx="2" fill="#f0a0b8" stroke="#e090a8" strokeWidth="0.5" />
        ))}

        {/* Patas delanteras */}
        <path d="M 98,146 L 96,148 L 96,196 L 106,196 L 108,148 Z" fill="url(#cowLegGrad)" stroke="#b8c8b8" strokeWidth="1" />
        <rect x="96" y="188" width="12" height="8" rx="3" fill="#8fa08f" />
        <path d="M 115,146 L 113,148 L 112,196 L 122,196 L 124,148 Z" fill="#d0d8d0" stroke="#b8c8b8" strokeWidth="1" />
        <rect x="112" y="188" width="12" height="8" rx="3" fill="#849484" />

        {/* Patas traseras */}
        <path d="M 215,148 L 213,150 L 212,196 L 222,196 L 224,150 Z" fill="url(#cowLegGrad)" stroke="#b8c8b8" strokeWidth="1" />
        <rect x="212" y="188" width="12" height="8" rx="3" fill="#8fa08f" />
        <path d="M 232,148 L 230,150 L 229,196 L 239,196 L 242,150 Z" fill="#d0d8d0" stroke="#b8c8b8" strokeWidth="1" />
        <rect x="229" y="188" width="12" height="8" rx="3" fill="#849484" />

        {/* Cuello + cabeza */}
        <path d="M 58,80 Q 68,64 88,66 Q 92,68 90,78 Q 88,88 78,92 Q 64,96 56,88 Q 50,82 58,80 Z" fill="url(#cowBodyGradH)" stroke="#c0cec0" strokeWidth="1.2" />
        <path d="M 14,90 Q 8,82 10,70 Q 12,58 24,54 Q 38,50 50,56 Q 62,62 60,76 Q 58,90 46,98 Q 32,106 20,100 Q 12,96 14,90 Z" fill="url(#cowBodyGradH)" stroke="#c0cec0" strokeWidth="1.4" />
        <ellipse cx="38" cy="50" rx="10" ry="6" fill="#d8e0d8" stroke="#c0cec0" strokeWidth="1" transform="rotate(-15,38,50)" />
        <ellipse cx="38" cy="50" rx="6" ry="3.5" fill="#e8d0c8" opacity="0.7" transform="rotate(-15,38,50)" />
        <ellipse cx="12" cy="88" rx="11" ry="8" fill="#ddd0c4" stroke="#c4b8b0" strokeWidth="1" />
        <ellipse cx="8" cy="88" rx="2.5" ry="2" fill="#b8a898" opacity="0.6" transform="rotate(-10,8,88)" />
        <ellipse cx="15" cy="90" rx="2.5" ry="2" fill="#b8a898" opacity="0.6" transform="rotate(10,15,90)" />
        <path d="M 30,52 Q 24,42 32,38" fill="none" stroke="#c8b878" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="36" cy="68" rx="4" ry="3.5" fill="white" stroke="#8a9a8a" strokeWidth="0.8" />
        <ellipse cx="36" cy="68" rx="2" ry="2.5" fill="#2d3a2d" opacity="0.85" />
        <circle cx="37" cy="67" r="0.8" fill="white" opacity="0.8" />

        {/* Manchas Holstein */}
        <path d="M140,62 Q152,56 160,64 Q165,72 155,78 Q143,82 136,74 Q130,66 140,62Z" fill="#2d3a2d" opacity="0.08" />
        <path d="M195,72 Q205,68 210,76 Q212,84 202,86 Q192,86 192,78 Q190,72 195,72Z" fill="#2d3a2d" opacity="0.07" />

        {/* Zonas de calor */}
        {zonas.map((z) => (
          <g key={z.id}>
            <circle
              cx={z.cx}
              cy={z.cy}
              r={z.r * 1.6}
              fill={"url(#czg" + z.id + ")"}
              opacity={hov && hov !== z.id ? 0.2 : 0.7}
              style={{ transition: "opacity 0.18s", cursor: selectable ? "pointer" : "default" }}
              onMouseEnter={() => setHov(z.id)}
              onMouseLeave={() => setHov(null)}
              onClick={() => selectable && onSelect && onSelect(z.zona)}
            />
            <circle
              cx={z.cx}
              cy={z.cy}
              r={z.r * 0.65}
              fill={z.color}
              stroke="white"
              strokeWidth={hov === z.id ? 2 : 1}
              opacity={hov && hov !== z.id ? 0.3 : 0.92}
              style={{ cursor: selectable ? "pointer" : "default", transition: "all 0.18s", transform: hov === z.id ? "scale(1.2)" : "scale(1)", transformOrigin: `${z.cx}px ${z.cy}px` }}
              onMouseEnter={() => setHov(z.id)}
              onMouseLeave={() => setHov(null)}
              onClick={() => selectable && onSelect && onSelect(z.zona)}
            />
            {selectable && selected === z.zona && (
              <circle cx={z.cx} cy={z.cy} r={z.r * 1.6 + 5} fill="none" stroke="var(--mc-green-600)" strokeWidth="2.5" style={{ pointerEvents: "none" }} />
            )}
          </g>
        ))}

        {/* Tooltip */}
        {hovZ && (() => {
          const tx = Math.min(Math.max(hovZ.cx, 55), 290);
          const ty = hovZ.cy - hovZ.r * 1.6 - 6;
          const label = hovZ.casos > 0 ? `${hovZ.label}: ${hovZ.pct}% · ${hovZ.cond}` : `${hovZ.label}: sin casos`;
          const w = label.length * 4.8 + 16;
          return (
            <g style={{ pointerEvents: "none" }}>
              <rect x={tx - w / 2} y={ty - 14} width={w} height={16} rx="4" fill="#1e293b" opacity="0.93" />
              <text x={tx} y={ty - 3} textAnchor="middle" fontSize="7" fill="white" fontWeight="600" fontFamily="system-ui">{label}</text>
            </g>
          );
        })()}
      </svg>

      {stats.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--mc-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Intensidad:</span>
            {[1, 3, 6, 10].map((p) => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: heatColor(p) }} />
                <span style={{ fontSize: 10, color: "var(--mc-muted)" }}>{heatLabel(p)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 10px", marginTop: 4 }}>
            {zonas.filter((z) => z.casos > 0).map((z) => (
              <div
                key={z.id}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, cursor: "pointer", opacity: hov && hov !== z.id ? 0.35 : 1, transition: "opacity 0.15s" }}
                onMouseEnter={() => setHov(z.id)}
                onMouseLeave={() => setHov(null)}
              >
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: z.color, flexShrink: 0 }} />
                <span style={{ color: "var(--mc-muted)" }}>{z.label}</span>
                <span style={{ fontWeight: 700, color: z.color }}>{z.pct}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============ CowProfileSVG (avatar de perfil, timeline) ============ */

export function CowProfileSVG({
  sexo = "H",
  enLactancia = true,
  estados,
  width = 60,
  height = 60,
}: {
  sexo?: "H" | "M";
  enLactancia?: boolean;
  estados?: Record<string, { color: string; obs: string }>;
  width?: number;
  height?: number;
}) {
  const defaultEstados: Record<string, { color: string; obs: string }> = {
    cabeza: { color: "#16a34a", obs: "Ojos claros, alerta normal" },
    cuello: { color: "#16a34a", obs: "Papada sin alteraciones" },
    costillas: { color: "#16a34a", obs: "Condición corporal adecuada" },
    columna: { color: "#16a34a", obs: "Línea dorsal recta, sin cifosis" },
    cadera: { color: "#16a34a", obs: "Cobertura de anca adecuada" },
    ubre: { color: "#16a34a", obs: "Simetría y turgencia normales" },
    patas: { color: "#16a34a", obs: "Sin signos de cojera" },
    cola: { color: "#16a34a", obs: "Higiene y consistencia normales" },
  };
  const est = { ...defaultEstados, ...(estados || {}) };
  const showUdder = sexo === "H" && enLactancia;

  // Helper que devuelve un elemento (no un componente) para evitar crear
  // componentes durante el render; cierra sobre `est`.
  const point = (x: number, y: number, zona: string, label: string) => (
    <circle cx={x} cy={y} r="3.1" fill={est[zona].color} stroke="#fff" strokeWidth="1" style={{ cursor: "pointer" }}>
      <title>{`${label}: ${est[zona].obs}`}</title>
    </circle>
  );

  return (
    <svg width={width} height={height} viewBox="0 0 130 84" fill="none">
      <path d="M32 38 Q18 48 20 66 Q21 74 24 80" stroke="#4ade80" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="25" cy="80" rx="4" ry="3.2" fill="#86efac" stroke="#4ade80" strokeWidth="1" />
      <rect x="36" y="58" width="7" height="20" rx="3" fill="#f0fdf4" stroke="#4ade80" strokeWidth="1.2" />
      <rect x="50" y="60" width="7" height="18" rx="3" fill="#f0fdf4" stroke="#4ade80" strokeWidth="1.2" />
      <ellipse cx="68" cy="44" rx="38" ry="19" fill="#e9f5e9" stroke="#4ade80" strokeWidth="1.4" />
      <rect x="84" y="60" width="7" height="18" rx="3" fill="#f0fdf4" stroke="#4ade80" strokeWidth="1.2" />
      <rect x="98" y="58" width="7" height="20" rx="3" fill="#f0fdf4" stroke="#4ade80" strokeWidth="1.2" />
      {showUdder && <ellipse cx="58" cy="62" rx="9" ry="6" fill="#fecaca" stroke="#f87171" strokeWidth="1" />}
      <ellipse cx="110" cy="30" rx="15" ry="13" fill="#f0fdf4" stroke="#4ade80" strokeWidth="1.4" />
      <ellipse cx="97" cy="20" rx="5" ry="3.3" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1" />
      <path d="M101 12 Q97 5 100 1" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M108 10 Q108 3 111 0" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="123" cy="34" rx="6.5" ry="5" fill="#fecaca" stroke="#4ade80" strokeWidth="0.9" />
      <circle cx="121" cy="34" r="1" fill="#f87171" opacity="0.7" />
      <circle cx="126" cy="34" r="1" fill="#f87171" opacity="0.7" />
      <circle cx="116" cy="25" r="1.9" fill="#1e3a1e" />
      <circle cx="116.6" cy="24.3" r="0.6" fill="white" />
      {point(116, 25, "cabeza", "Cabeza / Ojos")}
      {point(97, 37, "cuello", "Cuello / Papada")}
      {point(80, 36, "costillas", "Costillas / Tórax")}
      {point(68, 26, "columna", "Columna / Lomo")}
      {point(42, 36, "cadera", "Cadera / Anca")}
      {showUdder && point(58, 68, "ubre", "Ubre")}
      {point(53, 78, "patas", "Pezuñas / Patas")}
      {point(24, 68, "cola", "Cola")}
    </svg>
  );
}

/* ============ DIAGNOSTICAR ANIMAL (2 pasos, IA real) ============ */

type ProtocoloIA = {
  id: string;
  nombre: string;
  badge?: string | null;
  medicamento: string;
  tasaExito: number;
  stock: boolean;
  retiroHoras: number;
  costo: number;
};

export function ModalDiagnosticarAnimal({
  pacientes,
  onClose,
  onGuardado,
}: {
  pacientes: AnimalRow[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const pool = pacientes || [];
  const [paso, setPaso] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [animalSel, setAnimalSel] = useState<AnimalRow | null>(null);
  const [zonaSel, setZonaSel] = useState<string | null>(null);
  const [sintomasZona, setSintomasZona] = useState<string[]>([]);
  const [diagPresuntivo, setDiagPresuntivo] = useState("");
  const [severidad, setSeveridad] = useState("Leve");
  const [notas, setNotas] = useState("");
  const [marcaZonas, setMarcaZonas] = useState<string[]>([]);
  const [marcaColor, setMarcaColor] = useState(MARCA_COLORES_SANIDAD[0]);
  const [treatmentSel, setTreatmentSel] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [medManual, setMedManual] = useState("");
  const [dosisManual, setDosisManual] = useState("");
  const [viaManual, setViaManual] = useState("Intramuscular");
  const [retiroManual, setRetiroManual] = useState("");
  const [decision, setDecision] = useState<string | null>(null);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [analisisIA, setAnalisisIA] = useState<string>("");
  const [protocolos, setProtocolos] = useState<ProtocoloIA[]>([]);
  const [fuenteIA, setFuenteIA] = useState<string>("");
  const [guardando, setGuardando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const resultados = q === "" ? pool : pool.filter((a) => a.id.toLowerCase().includes(q) || a.cat.toLowerCase().includes(q));
  const zonaInfo = zonaSel ? ZONA_INFO_SANIDAD[zonaSel] : null;
  const toggleSintomaZona = (s: string) => setSintomasZona((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));
  const toggleMarcaZona = (z: string) => setMarcaZonas((list) => (list.includes(z) ? list.filter((x) => x !== z) : [...list, z]));
  const selectZona = (z: string) => { setZonaSel(z); setSintomasZona([]); setDiagPresuntivo(""); };

  const irAPaso2 = async () => {
    setPaso(2);
    setCargandoIA(true);
    try {
      const res = await fetch("/api/sanidad-ia/diagnosticar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: animalSel?.dbId,
          zona: zonaSel,
          zonaLabel: zonaInfo?.label,
          sintomas: sintomasZona,
          diagnostico: diagPresuntivo,
          severidad,
          notas,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setAnalisisIA(d.analisis || "");
        setProtocolos(d.protocolos || []);
        setFuenteIA(d.fuente || "");
      }
    } catch {
      setAnalisisIA("No se pudo generar el análisis IA. Podés cargar el tratamiento manualmente.");
    } finally {
      setCargandoIA(false);
    }
  };

  const confirmar = async () => {
    if (!animalSel || !treatmentSel || !decision) return;
    setGuardando(true);
    try {
      const proto = treatmentSel === "manual" ? null : protocolos.find((p) => p.id === treatmentSel) || null;
      await fetch("/api/tratamientos-sanitarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: animalSel.dbId,
          tipo: "Tratamiento",
          diagnostico: diagPresuntivo || zonaInfo?.label || "Diagnóstico sanitario",
          zona: zonaSel,
          sintomas: sintomasZona,
          severidad,
          notas,
          medicamento: proto ? proto.medicamento : medManual || null,
          dosis: treatmentSel === "manual" ? dosisManual : null,
          via: treatmentSel === "manual" ? viaManual : null,
          retiroHoras: proto ? proto.retiroHoras : parseInt(retiroManual) || 0,
          dosisTotales: 1,
          aplicarPrimeraAhora: decision === "aplicado",
          marcaZonas,
          marcaColor,
          costo: proto ? proto.costo : null,
          origenIA: !!proto,
          protocolo: proto,
        }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  const StepDots = () => (
    <div className="row gap-6" style={{ alignItems: "center" }}>
      {[1, 2].map((n) => (
        <React.Fragment key={n}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, background: paso >= n ? "var(--mc-green-600)" : "var(--mc-surface)", border: paso >= n ? "2px solid var(--mc-green-600)" : "2px solid var(--mc-line-2)", color: paso >= n ? "#fff" : "var(--mc-text-3)" }}>
            {paso > n ? <Icon name="check" size={11} /> : n}
          </div>
          {n < 2 && <div style={{ width: 26, height: 2, background: paso > n ? "var(--mc-green-600)" : "var(--mc-line-2)" }} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(600px,96vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-red)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Sanidad</div>
              <div className="mc-modal__title" style={{ fontSize: 20 }}>{paso === 1 ? "Diagnosticar Animal" : "Plan de Tratamiento Sugerido"}</div>
              {paso === 2 && <div style={{ fontSize: 12, color: "var(--mc-text-3)", marginTop: 2 }}>Diagnóstico: {diagPresuntivo || "—"} ({animalSel ? animalSel.id : "—"})</div>}
            </div>
            <div className="col" style={{ alignItems: "flex-end", gap: 10 }}>
              <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
              <StepDots />
            </div>
          </div>
        </div>

        {paso === 1 && (
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <SecNum n={1} title="Animal" />
              <div className="row" style={{ background: "var(--mc-surface-2)", border: "1px solid var(--mc-line-2)", borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
                <Icon name="search" size={14} style={{ color: "var(--mc-text-3)" }} />
                <input value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setAnimalSel(null); }} placeholder="Buscar por ID o categoría (o escribir ID manual)…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "inherit" }} />
              </div>
              {animalSel ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, border: "2px solid var(--mc-green-500)", background: "var(--mc-green-50)" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{animalSel.id}</span>
                    <span style={{ fontSize: 11.5, color: "var(--mc-text-3)", marginLeft: 8 }}>{animalSel.cat} · {animalSel.lote}</span>
                  </div>
                  <Icon name="check" size={14} style={{ color: "var(--mc-green-600)" }} />
                </div>
              ) : busqueda ? (
                <div className="col gap-6" style={{ maxHeight: 140, overflowY: "auto" }}>
                  {resultados.map((a) => (
                    <div key={a.dbId} onClick={() => setAnimalSel(a)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, cursor: "pointer", border: "1px solid var(--mc-line)", background: "var(--mc-surface)" }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{a.id}</span>
                        <span style={{ fontSize: 11.5, color: "var(--mc-text-3)", marginLeft: 8 }}>{a.cat} · {a.lote}</span>
                      </div>
                    </div>
                  ))}
                  {resultados.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin resultados.</div>}
                </div>
              ) : null}
            </div>

            <div>
              <SecNum n={2} title="¿Dónde está el problema?" />
              <div className="row gap-16" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ width: 300, flexShrink: 0, background: "var(--mc-surface-2)", borderRadius: 12, border: "1px solid var(--mc-line)", padding: "14px 16px 10px" }}>
                  <CowHeatmap selectable selected={zonaSel} onSelect={selectZona} />
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  {zonaInfo ? (
                    <div className="col gap-10">
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-green-700)" }}>{zonaInfo.label}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {zonaInfo.chips.map((s) => (
                          <button key={s} onClick={() => toggleSintomaZona(s)} type="button" style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: sintomasZona.includes(s) ? "1.5px solid var(--mc-red)" : "1px solid var(--mc-line-2)", background: sintomasZona.includes(s) ? "var(--mc-red-bg)" : "var(--mc-surface)", color: sintomasZona.includes(s) ? "var(--mc-red)" : "var(--mc-text-2)" }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: "var(--mc-text-3)", paddingTop: 8 }}>Hacé clic en un punto del cuerpo para elegir la zona afectada.</div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <SecNum n={3} title="Diagnóstico presuntivo" />
              <input className="mc-input" list="diagZonaOpts" value={diagPresuntivo} onChange={(e) => setDiagPresuntivo(e.target.value)} placeholder={zonaInfo ? "Ej: " + zonaInfo.diags[0] : "Seleccioná una zona para ver sugerencias…"} />
              <datalist id="diagZonaOpts">
                {(zonaInfo ? zonaInfo.diags : []).map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>

            <div>
              <SecNum n={4} title="Severidad y notas" />
              <div className="col gap-12">
                <div style={{ display: "flex", background: "var(--mc-surface-2)", border: "1.5px solid var(--mc-line-2)", borderRadius: 10, padding: 3, gap: 2 }}>
                  {["Leve", "Moderada", "Grave"].map((o) => (
                    <button key={o} onClick={() => setSeveridad(o)} type="button" style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", fontSize: 11.5, fontWeight: severidad === o ? 700 : 500, cursor: "pointer", background: severidad === o ? "var(--mc-red)" : "transparent", color: severidad === o ? "#fff" : "var(--mc-text-2)" }}>{o}</button>
                  ))}
                </div>
                <textarea className="mc-textarea" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones adicionales…" />
              </div>
            </div>

            <MarcasFisicasSanidad marcaZonas={marcaZonas} toggleMarcaZona={toggleMarcaZona} marcaColor={marcaColor} setMarcaColor={setMarcaColor} />
          </div>
        )}

        {paso === 2 && (
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="ia-card" style={{ borderRadius: 14, padding: "14px 16px", position: "relative" }}>
              <div style={{ position: "absolute", top: 10, right: 12 }}><IABadge /></div>
              <div className="row gap-8" style={{ alignItems: "flex-start" }}>
                <Icon name="brain" size={20} style={{ color: "#a85f00", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 4 }}>
                    Análisis IA{fuenteIA === "reglas" ? " (modo reglas — configurá ANTHROPIC_API_KEY para IA completa)" : ""}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--mc-text-2)", lineHeight: 1.5 }}>
                    {cargandoIA ? "Analizando el caso con el historial del rodeo…" : analisisIA || "Sin análisis disponible."}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SecNum n={1} title="Opciones de tratamiento" />
              {cargandoIA ? (
                <div className="mc-empty" style={{ padding: 24 }}>Generando protocolos sugeridos…</div>
              ) : (
                <div className="col gap-10">
                  {protocolos.map((p) => {
                    const sel = treatmentSel === p.id;
                    return (
                      <div key={p.id} onClick={() => setTreatmentSel(p.id)} style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer", border: sel ? "2px solid var(--mc-green-500)" : "1px solid var(--mc-line)", background: sel ? "var(--mc-green-50)" : "var(--mc-surface)" }}>
                        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--mc-ink)" }}>{p.nombre}</span>
                          {p.badge && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: "linear-gradient(135deg,#FFF8EC,#FFF0DD)", border: "1.5px solid #FF9D00", color: "#a85f00" }}>{p.badge}</span>}
                          {sel && !p.badge && <Icon name="check" size={16} style={{ color: "var(--mc-green-600)" }} />}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--mc-text-2)", marginBottom: 8 }}>Medicamento: {p.medicamento}</div>
                        <div className="grid g-cols-4 gap-8">
                          <div>
                            <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>Tasa de éxito</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-green-600)" }}>{p.tasaExito}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>Stock</div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: p.stock ? "var(--mc-green-600)" : "var(--mc-red)" }}>{p.stock ? "Disponible" : "No disponible"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>Retiro</div>
                            <div className="row gap-4" style={{ alignItems: "center" }}>
                              {p.retiroHoras >= 72 && <Icon name="alert" size={11} style={{ color: "var(--mc-amber)" }} />}
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: p.retiroHoras <= 24 ? "var(--mc-green-600)" : "var(--mc-ink)" }}>{p.retiroHoras} hs</span>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--mc-text-3)" }}>Costo</div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: p.id === "economico" ? "var(--mc-green-600)" : "var(--mc-ink)" }}>${p.costo} USD</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ background: "var(--mc-bg)", border: "1px solid var(--mc-line)", borderRadius: 12, padding: "14px 16px" }}>
              <div onClick={() => { setManualOpen((o) => !o); setTreatmentSel("manual"); }} className="row" style={{ justifyContent: "space-between", cursor: "pointer" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: treatmentSel === "manual" ? "var(--mc-green-700)" : "var(--mc-ink)", textTransform: "uppercase", letterSpacing: ".04em" }}>Ingresar tratamiento manualmente</span>
                <Icon name={manualOpen ? "chevUp" : "chevDown"} size={14} style={{ color: "var(--mc-text-3)" }} />
              </div>
              {manualOpen && (
                <div className="grid g-cols-2 gap-10" style={{ marginTop: 12 }}>
                  <div className="mc-field">
                    <label className="mc-label">Medicamento</label>
                    <select className="mc-select" value={medManual} onChange={(e) => setMedManual(e.target.value)}>
                      <option value="">Seleccionar…</option>
                      {["Oxitetraciclina 20%", "Penicilina/Estreptomicina", "Ceftiofur", "Vitamina AD3E"].map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="mc-field">
                    <label className="mc-label">Dosis (ml)</label>
                    <input type="number" className="mc-input" value={dosisManual} onChange={(e) => setDosisManual(e.target.value)} placeholder="0" />
                  </div>
                  <div className="mc-field">
                    <label className="mc-label">Vía</label>
                    <select className="mc-select" value={viaManual} onChange={(e) => setViaManual(e.target.value)}>
                      {["Intramuscular", "Subcutánea", "Endovenosa", "Oral"].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="mc-field">
                    <label className="mc-label">Período de Retiro (hs)</label>
                    <input type="number" className="mc-input" value={retiroManual} onChange={(e) => setRetiroManual(e.target.value)} placeholder="0" />
                  </div>
                </div>
              )}
            </div>

            <div className="row gap-10">
              <button type="button" onClick={() => setDecision("aplicado")} className="mc-btn" style={{ flex: 1, justifyContent: "center", background: decision === "aplicado" ? "var(--mc-green-600)" : "var(--mc-surface)", color: decision === "aplicado" ? "#fff" : "var(--mc-text-2)", border: decision === "aplicado" ? "none" : "1px solid var(--mc-line-2)" }}>
                <Icon name="check" size={14} /> Aplicado Ahora
              </button>
              <button type="button" onClick={() => setDecision("pendiente")} className="mc-btn mc-btn--ghost" style={{ flex: 1, justifyContent: "center", background: decision === "pendiente" ? "var(--mc-surface-3)" : "transparent" }}>
                Dejar Pendiente
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          {paso === 1 ? (
            <>
              <button onClick={onClose} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
              <button onClick={irAPaso2} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }} disabled={!animalSel}>
                Siguiente <Icon name="sparkles" size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPaso(1)} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>← Anterior</button>
              <button onClick={confirmar} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }} disabled={!treatmentSel || !decision || guardando}>
                {treatmentSel === "recomendado" && <Icon name="sparkles" size={14} />}
                <Icon name="check" size={14} /> {guardando ? "Guardando…" : "Confirmar y Guardar"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ REGISTRAR TRATAMIENTO CON SEGUIMIENTO (5 pasos) ============ */

const TIPOS_TRATAMIENTO_SANIDAD = [
  { id: "Tratamiento", emoji: "💊" },
  { id: "Vacunación", emoji: "💉" },
  { id: "Control", emoji: "🔍" },
  { id: "Otro", emoji: "➕" },
];

export function ModalRegistrarTratamientoSanitario({
  pacientes,
  onClose,
  onGuardado,
}: {
  pacientes: AnimalRow[];
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const pool = pacientes || [];
  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState("Tratamiento");
  const [busqueda, setBusqueda] = useState("");
  const [animalSel, setAnimalSel] = useState<AnimalRow | null>(null);
  const [medicamento, setMedicamento] = useState("");
  const [dosis, setDosis] = useState("");
  const [via, setVia] = useState("Intramuscular");
  const [retiroHoras, setRetiroHoras] = useState("");
  const [vacunaNombre, setVacunaNombre] = useState("");
  const [proximoRefuerzo, setProximoRefuerzo] = useState("");
  const [resultadoControl, setResultadoControl] = useState("Normal");
  const [proximoControl, setProximoControl] = useState("");
  const [descripcionEvento, setDescripcionEvento] = useState("");
  const [marcaZonas, setMarcaZonas] = useState<string[]>([]);
  const [marcaColor, setMarcaColor] = useState(MARCA_COLORES_SANIDAD[0]);
  const [cantidadDosis, setCantidadDosis] = useState("1");
  const [aplicarAhora, setAplicarAhora] = useState(true);
  const [fecha, setFecha] = useState("");
  const [responsable, setResponsable] = useState("");
  const [guardando, setGuardando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const resultados = q === "" ? [] : pool.filter((a) => a.id.toLowerCase().includes(q) || (a.cat || "").toLowerCase().includes(q));
  const toggleMarcaZona = (z: string) => setMarcaZonas((list) => (list.includes(z) ? list.filter((x) => x !== z) : [...list, z]));
  const totalN = Math.max(1, parseInt(cantidadDosis) || 1);
  const doneCount = totalN === 1 ? 1 : aplicarAhora ? 1 : 0;

  const usaCantidadDosis = tipo === "Tratamiento" || tipo === "Vacunación";
  const totalPasos = usaCantidadDosis ? 5 : 4;
  const pasoDisplay = usaCantidadDosis ? paso : paso === 5 ? 4 : paso;
  const siguientePaso = () => setPaso((p) => (p === 3 && !usaCantidadDosis ? 5 : p + 1));
  const anteriorPaso = () => setPaso((p) => (p === 5 && !usaCantidadDosis ? 3 : p - 1));

  const confirmar = async () => {
    if (!animalSel) return;
    setGuardando(true);
    try {
      const diagnostico =
        tipo === "Tratamiento" ? medicamento || "Tratamiento sanitario" :
        tipo === "Vacunación" ? `Vacunación ${vacunaNombre || ""}`.trim() :
        tipo === "Control" ? `Control sanitario (${resultadoControl})` :
        descripcionEvento || "Evento sanitario";
      await fetch("/api/tratamientos-sanitarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: animalSel.dbId,
          tipo,
          diagnostico,
          medicamento: tipo === "Vacunación" ? vacunaNombre || null : medicamento || null,
          dosis: dosis || null,
          via: tipo === "Tratamiento" ? via : null,
          retiroHoras: parseInt(retiroHoras) || 0,
          dosisTotales: usaCantidadDosis ? totalN : 1,
          aplicarPrimeraAhora: usaCantidadDosis ? aplicarAhora : true,
          proximaDosis: tipo === "Vacunación" && proximoRefuerzo ? proximoRefuerzo : null,
          proximoControl: tipo === "Control" && proximoControl ? proximoControl : null,
          marcaZonas,
          marcaColor,
          fechaInicio: fecha || null,
          responsable: responsable || null,
          notas: tipo === "Otro" ? descripcionEvento : null,
        }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  const StepDots5 = () => (
    <div className="row gap-4" style={{ alignItems: "center" }}>
      {Array.from({ length: totalPasos }, (_, i) => i + 1).map((n) => (
        <React.Fragment key={n}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, background: pasoDisplay >= n ? "var(--mc-red)" : "var(--mc-surface)", border: pasoDisplay >= n ? "2px solid var(--mc-red)" : "2px solid var(--mc-line-2)", color: pasoDisplay >= n ? "#fff" : "var(--mc-text-3)" }}>
            {pasoDisplay > n ? <Icon name="check" size={10} /> : n}
          </div>
          {n < totalPasos && <div style={{ width: 14, height: 2, background: pasoDisplay > n ? "var(--mc-red)" : "var(--mc-line-2)" }} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(580px,96vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-red)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Sanidad · Hospital Digital</div>
              <div className="mc-modal__title" style={{ fontSize: 20 }}>Registrar Tratamiento con Seguimiento</div>
            </div>
            <div className="col" style={{ alignItems: "flex-end", gap: 10 }}>
              <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
              <StepDots5 />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {paso === 1 && (
            <div>
              <SecNum n={1} title="Tipo de evento sanitario" />
              <div className="grid g-cols-2 gap-8">
                {TIPOS_TRATAMIENTO_SANIDAD.map((t) => {
                  const sel = tipo === t.id;
                  return (
                    <div key={t.id} onClick={() => setTipo(t.id)} style={{ position: "relative", padding: "16px 10px", borderRadius: "var(--r-md)", cursor: "pointer", textAlign: "center", border: `1.5px solid ${sel ? "var(--mc-red)" : "var(--mc-line-2)"}`, background: sel ? "var(--mc-red-bg)" : "var(--mc-surface)", transition: "0.15s" }}>
                      {sel && <span style={{ position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: "50%", background: "var(--mc-red)", display: "grid", placeItems: "center" }}><Icon name="check" size={10} style={{ color: "#fff" }} /></span>}
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{t.emoji}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: sel ? "var(--mc-red)" : "var(--mc-ink)" }}>{t.id}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {paso === 2 && (
            <div>
              <SecNum n={2} title="Animal" />
              <div className="row" style={{ background: "var(--mc-surface-2)", border: "1px solid var(--mc-line-2)", borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
                <Icon name="search" size={14} style={{ color: "var(--mc-text-3)" }} />
                <input value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setAnimalSel(null); }} placeholder="Buscar por ID o categoría…" style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: 13, fontFamily: "inherit" }} />
              </div>
              {animalSel ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, border: "2px solid var(--mc-green-500)", background: "var(--mc-green-50)" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{animalSel.id}</span>
                    <span style={{ fontSize: 11.5, color: "var(--mc-text-3)", marginLeft: 8 }}>{animalSel.cat} · {animalSel.lote}</span>
                  </div>
                  <Icon name="check" size={14} style={{ color: "var(--mc-green-600)" }} />
                </div>
              ) : busqueda ? (
                <div className="col gap-4" style={{ maxHeight: 120, overflowY: "auto" }}>
                  {resultados.map((a) => (
                    <div key={a.dbId} onClick={() => setAnimalSel(a)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, cursor: "pointer", border: "1px solid var(--mc-line)", background: "var(--mc-surface)" }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mc-ink)" }}>{a.id}</span>
                        <span style={{ fontSize: 11.5, color: "var(--mc-text-3)", marginLeft: 8 }}>{a.cat} · {a.lote}</span>
                      </div>
                    </div>
                  ))}
                  {resultados.length === 0 && <div style={{ fontSize: 12, color: "var(--mc-text-3)" }}>Sin resultados.</div>}
                </div>
              ) : null}
            </div>
          )}

          {paso === 3 && (
            <div className="col" style={{ gap: 18 }}>
              <div>
                <SecNum n={3} title={tipo === "Tratamiento" ? "Medicamento y dosis" : tipo === "Vacunación" ? "Datos de la vacunación" : tipo === "Control" ? "Resultado del control" : "Descripción del evento"} />

                {tipo === "Tratamiento" && (
                  <>
                    <div className="grid g-cols-2">
                      <div className="mc-field">
                        <label className="mc-label">Medicamento</label>
                        <select className="mc-select" value={medicamento} onChange={(e) => setMedicamento(e.target.value)}>
                          <option value="">Seleccionar…</option>
                          {["Oxitetraciclina 20%", "Penicilina/Estreptomicina", "Ceftiofur", "Vitamina AD3E", "Ivermectina Plus 3.15%"].map((m) => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="mc-field">
                        <label className="mc-label">Dosis (ml)</label>
                        <input type="number" className="mc-input" value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="0" />
                      </div>
                      <div className="mc-field">
                        <label className="mc-label">Vía</label>
                        <select className="mc-select" value={via} onChange={(e) => setVia(e.target.value)}>
                          {["Intramuscular", "Subcutánea", "Endovenosa", "Oral"].map((v) => <option key={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="mc-field">
                        <label className="mc-label">Período de Retiro (hs)</label>
                        <input type="number" className="mc-input" value={retiroHoras} onChange={(e) => setRetiroHoras(e.target.value)} placeholder="0" />
                      </div>
                    </div>
                    {parseFloat(retiroHoras) > 0 && (
                      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "var(--mc-amber-bg)", border: "1px solid rgba(196,132,16,0.3)" }}>
                        <Icon name="alert" size={14} style={{ color: "var(--mc-amber)", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#7a5010" }}>Este animal no podrá venderse ni ordeñarse durante <strong>{retiroHoras} hs</strong> tras la aplicación.</span>
                      </div>
                    )}
                  </>
                )}

                {tipo === "Vacunación" && (
                  <div className="grid g-cols-2">
                    <div className="mc-field">
                      <label className="mc-label">Vacuna aplicada</label>
                      <select className="mc-select" value={vacunaNombre} onChange={(e) => setVacunaNombre(e.target.value)}>
                        <option value="">Seleccionar…</option>
                        {["Aftosa", "Brucelosis", "Clostridial (Triple/Quíntuple)", "IBR/DVB Reproductiva", "Rabia Paresiante", "Carbunclo"].map((v) => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="mc-field">
                      <label className="mc-label">Dosis (ml)</label>
                      <input type="number" className="mc-input" value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="0" />
                    </div>
                    <div className="mc-field" style={{ gridColumn: "1 / -1" }}>
                      <label className="mc-label">Próxima dosis de refuerzo (opcional)</label>
                      <input type="date" className="mc-input" value={proximoRefuerzo} onChange={(e) => setProximoRefuerzo(e.target.value)} />
                    </div>
                  </div>
                )}

                {tipo === "Control" && (
                  <div className="col gap-12">
                    <div className="mc-field">
                      <label className="mc-label">Resultado del control</label>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["Normal", "Anormal"].map((o) => (
                          <button key={o} type="button" onClick={() => setResultadoControl(o)} style={{ flex: 1, padding: "9px 4px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: resultadoControl === o ? `2px solid ${o === "Anormal" ? "var(--mc-red)" : "var(--mc-green-500)"}` : "1px solid var(--mc-line-2)", background: resultadoControl === o ? (o === "Anormal" ? "var(--mc-red-bg)" : "var(--mc-green-50)") : "var(--mc-surface)", color: resultadoControl === o ? (o === "Anormal" ? "var(--mc-red)" : "var(--mc-green-700)") : "var(--mc-text-2)" }}>{o}</button>
                        ))}
                      </div>
                    </div>
                    <div className="mc-field">
                      <label className="mc-label">Próximo control programado (opcional)</label>
                      <input type="date" className="mc-input" value={proximoControl} onChange={(e) => setProximoControl(e.target.value)} />
                    </div>
                  </div>
                )}

                {tipo === "Otro" && (
                  <div className="mc-field">
                    <label className="mc-label">Descripción del evento</label>
                    <textarea className="mc-textarea" value={descripcionEvento} onChange={(e) => setDescripcionEvento(e.target.value)} placeholder="Detallá qué se hizo…" />
                  </div>
                )}
              </div>

              <MarcasFisicasSanidad marcaZonas={marcaZonas} toggleMarcaZona={toggleMarcaZona} marcaColor={marcaColor} setMarcaColor={setMarcaColor} />
            </div>
          )}

          {paso === 4 && (
            <div>
              <SecNum n={4} title="Cantidad total de dosis" />
              <div className="mc-field">
                <label className="mc-label">¿Cuántas dosis tiene este tratamiento?</label>
                <input type="number" min="1" className="mc-input" value={cantidadDosis} onChange={(e) => setCantidadDosis(e.target.value)} placeholder="1" />
              </div>
              {totalN > 1 && (
                <div className="row gap-8" style={{ marginTop: 12 }}>
                  <button type="button" onClick={() => setAplicarAhora(true)} className="mc-btn mc-btn--sm" style={{ flex: 1, justifyContent: "center", background: aplicarAhora ? "var(--mc-green-600)" : "var(--mc-surface)", color: aplicarAhora ? "#fff" : "var(--mc-text-2)", border: aplicarAhora ? "none" : "1px solid var(--mc-line-2)" }}>Aplicar 1ª dosis ahora</button>
                  <button type="button" onClick={() => setAplicarAhora(false)} className="mc-btn mc-btn--sm" style={{ flex: 1, justifyContent: "center", background: !aplicarAhora ? "var(--mc-surface-3)" : "transparent", color: "var(--mc-text-2)", border: "1px solid var(--mc-line-2)" }}>Programar para después</button>
                </div>
              )}
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "var(--mc-bg)", border: "1px solid var(--mc-line)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mc-text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Progreso inicial</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: totalN === 1 ? "var(--mc-green-700)" : "var(--mc-ink)" }}>
                  {totalN === 1 ? "Dosis única · 100% completado" : `${doneCount} de ${totalN} dosis aplicadas`}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--mc-text-3)", marginTop: 2 }}>
                  {totalN === 1 ? "Se marcará como finalizado al guardar." : "Se creará un tratamiento de seguimiento multi-día en el Hospital Digital."}
                </div>
              </div>
            </div>
          )}

          {paso === 5 && (
            <div>
              <SecNum n={5} title="Fecha y responsable" />
              <div className="grid g-cols-2">
                <div className="mc-field">
                  <label className="mc-label">Fecha de aplicación</label>
                  <input type="date" className="mc-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
                <div className="mc-field">
                  <label className="mc-label">Responsable</label>
                  <input className="mc-input" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre del responsable" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={() => (paso === 1 ? onClose() : anteriorPaso())} className="mc-btn mc-btn--secondary" style={{ flex: 1, justifyContent: "center" }}>{paso === 1 ? "Cancelar" : "← Anterior"}</button>
          {paso < 5 ? (
            <button onClick={siguientePaso} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }} disabled={paso === 2 && !animalSel}>
              Siguiente
            </button>
          ) : (
            <button onClick={confirmar} className="mc-btn mc-btn--primary" style={{ flex: 2, justifyContent: "center" }} disabled={!fecha || !responsable || guardando}>
              <Icon name="check" size={14} /> {guardando ? "Guardando…" : "Guardar Tratamiento"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ SEGUIMIENTO DE TRATAMIENTO (aplicar dosis) ============ */

export function ModalSeguimientoTratamiento({
  tratamiento,
  onClose,
  onGuardado,
}: {
  tratamiento: TratamientoAPI;
  onClose: () => void;
  onGuardado?: () => void;
}) {
  const t = tratamiento;
  const doses: string[] = [
    ...Array(t.dosisAplicadas).fill("done"),
    ...(t.dosisAplicadas < t.dosisTotales ? ["active"] : []),
    ...Array(Math.max(0, t.dosisTotales - t.dosisAplicadas - 1)).fill("pending"),
  ];
  const activeIdx = doses.indexOf("active");
  const startIdx = Math.max(0, Math.min(activeIdx - 2, doses.length - 4));
  const ventana = doses.slice(startIdx, startIdx + 4);
  const [evaluacion, setEvaluacion] = useState(1);
  const [confirmado, setConfirmado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const evalLabels = ["Peor", "Igual", "Mejorando"];
  const evalColors = ["var(--mc-red)", "var(--mc-text-3)", "var(--mc-green-600)"];

  const confirmar = async () => {
    setGuardando(true);
    try {
      await fetch(`/api/tratamientos-sanitarios/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "aplicarDosis", evaluacion: evalLabels[evaluacion] }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  const suspender = async () => {
    setGuardando(true);
    try {
      await fetch(`/api/tratamientos-sanitarios/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "cerrar" }),
      });
      onGuardado && onGuardado();
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(480px,95vw)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--mc-line)", flexShrink: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--mc-red)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>
                {t.animal ? `#${t.animal.caravana.replace(/^#/, "")} · ${t.animal.categoria || ""}` : ""}
              </div>
              <div className="mc-modal__title" style={{ fontSize: 19 }}>Tratamiento: {t.diagnostico}</div>
            </div>
            <button onClick={onClose} className="mc-icon-btn"><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <SecNum n={1} title="Contexto de la tarea" />
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
              {ventana.map((d, i) => {
                const dayN = startIdx + i + 1;
                const isActive = d === "active";
                return (
                  <div key={i} className="col" style={{ alignItems: "center", gap: 6, flex: 1 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: d === "done" || isActive ? "var(--mc-green-600)" : "var(--mc-surface)", border: d === "pending" ? "2px solid var(--mc-line-2)" : "2px solid var(--mc-green-600)", color: d === "pending" ? "var(--mc-text-3)" : "#fff", boxShadow: isActive ? "0 0 0 5px rgba(0,167,56,0.22)" : "none" }}>
                      {d === "done" ? <Icon name="check" size={14} /> : isActive ? <Icon name="syringe" size={14} /> : null}
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--mc-green-700)" : "var(--mc-text-3)", textAlign: "center" }}>Dosis {dayN}{isActive ? " — HOY" : ""}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--mc-bg)", border: "1px solid var(--mc-line)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mc-ink)", marginBottom: 6 }}>
                Aplicar {t.dosis ? `${t.dosis} ml` : "dosis"} de {t.medicamento || t.diagnostico}
              </div>
              <span className="mc-badge mc-badge--green">Dosis {t.dosisAplicadas + 1} de {t.dosisTotales}</span>
            </div>
          </div>

          <div>
            <SecNum n={2} title="Evaluación rápida" />
            <label className="mc-label">¿Cómo ves al animal hoy?</label>
            <input type="range" min="0" max="2" step="1" value={evaluacion} onChange={(e) => setEvaluacion(+e.target.value)} style={{ width: "100%", marginTop: 8, accentColor: evalColors[evaluacion], height: 6, borderRadius: 999 }} />
            <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: evalColors[evaluacion], marginTop: 4 }}>{evalLabels[evaluacion]}</div>
          </div>

          <div style={{ background: "var(--mc-bg)", border: "1px solid var(--mc-line)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--mc-ink)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Verificación de seguridad</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--mc-text-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} style={{ width: 15, height: 15, accentColor: "var(--mc-green-600)" }} />
              Confirmo que he aplicado la medicación correctamente
            </label>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--mc-line)", background: "var(--mc-surface-2)", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <button onClick={confirmar} className="mc-btn mc-btn--primary" style={{ justifyContent: "center" }} disabled={!confirmado || guardando}>
            <Icon name="check" size={14} /> {guardando ? "Guardando…" : "Confirmar Dosis y Seguir"}
          </button>
          <button onClick={suspender} disabled={guardando} className="mc-btn mc-btn--ghost mc-btn--sm" style={{ justifyContent: "center", color: "var(--mc-red)" }}>Saltar dosis / Suspender tratamiento</button>
        </div>
      </div>
    </div>
  );
}
