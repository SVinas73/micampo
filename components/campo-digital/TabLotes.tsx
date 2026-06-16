"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon, KPI, useToast } from "@/components/mc";
import { demo } from "@/lib/demo";
import { useSetHeaderActions } from "./ActionsContext";
import {
  LOTES_GEO, GEO_METRICAS, LOTES_INICIALES, LISTA_EXTRAS, mapLotesApi, fechaCorta,
  type LoteUI,
} from "./lotes-data";
import {
  AgregarCampoModal, EliminarCampoModal, EditarLoteModal, NuevaTareaModal,
  type AgregarCampoData, type EditarLoteData, type NuevaTareaData,
} from "./lotes-Modales";

/* ========== TAB LOTES (Figma CDLotes) ========== */
export default function TabLotes() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [lotes, setLotes] = useState<LoteUI[]>(demo(LOTES_INICIALES, []));
  const [selected, setSelected] = useState<LoteUI | null>(null);
  const [view, setView] = useState<"mapa" | "lista">("mapa");
  const [layer, setLayer] = useState("NDVI");
  const [campoFiltro, setCampoFiltro] = useState("Todos");
  const [zoom, setZoom] = useState(1);
  const [showAgregar, setShowAgregar] = useState(searchParams.get("modal") === "nuevo");
  const [showEliminar, setShowEliminar] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroCultivo, setFiltroCultivo] = useState("Todos");
  const [editLote, setEditLote] = useState<LoteUI | null>(null);
  const [tareaLote, setTareaLote] = useState<LoteUI | null>(null);
  const [notaLote, setNotaLote] = useState<LoteUI | null>(null);
  const [comentarioGeneral, setComentarioGeneral] = useState(false);

  useEffect(() => {
    fetch("/api/lotes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) setLotes(mapLotesApi(d));
      })
      .catch(() => {});
  }, []);

  /* ---- Acciones de header (Figma: Eliminar Campo / Nuevo Campo) ---- */
  useSetHeaderActions(
    <>
      <button className="mc-btn mc-btn--red" onClick={() => setShowEliminar(true)}>
        Eliminar Campo
      </button>
      <button className="mc-btn mc-btn--primary" onClick={() => setShowAgregar(true)}>
        Nuevo Campo
      </button>
    </>,
    []
  );

  const campos = useMemo(() => {
    const m = new Map<string, number>();
    lotes.forEach((l) => m.set(l.campo, (m.get(l.campo) || 0) + 1));
    return Array.from(m.entries()).map(([nombre, n]) => ({ nombre, lotes: n }));
  }, [lotes]);

  const visibles = useMemo(
    () =>
      lotes.filter(
        (l) =>
          (campoFiltro === "Todos" || l.campo === campoFiltro) &&
          (filtroCultivo === "Todos" || l.cultivo === filtroCultivo)
      ),
    [lotes, campoFiltro, filtroCultivo]
  );

  const totalHa = lotes.reduce((s, l) => s + l.ha, 0);
  const sembradas = lotes.filter((l) => !l.vacio).reduce((s, l) => s + l.ha, 0);
  const sinAsignar = lotes.filter((l) => l.vacio);

  /* ---- Acciones conectadas ---- */
  const crearCampo = async (data: AgregarCampoData) => {
    try {
      const res = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: data.nombre, hectareas: data.hectareas, cultivo: null }),
      });
      const code = LOTES_GEO[lotes.length % LOTES_GEO.length].id;
      const met = GEO_METRICAS[code];
      let dbId: string | undefined;
      if (res.ok) dbId = (await res.json()).id;
      setLotes((prev) => [
        ...prev,
        {
          id: code, dbId, name: data.nombre, campo: data.nombre, ha: data.hectareas,
          cultivo: null, estadio: "—", ndvi: met.ndvi, aguaUtil: met.hum, sano: true, vacio: true, comentarios: [],
        },
      ]);
      toast.show(`Establecimiento "${data.nombre}" creado`);
      setShowAgregar(false);
    } catch {
      toast.show("No se pudo crear el establecimiento", "err");
    }
  };

  const eliminarCampo = async (campo: string) => {
    const afectados = lotes.filter((l) => l.campo === campo);
    for (const l of afectados) {
      if (l.dbId) await fetch(`/api/lotes/${l.dbId}`, { method: "DELETE" }).catch(() => {});
    }
    setLotes((prev) => prev.filter((l) => l.campo !== campo));
    setSelected(null);
    toast.show(`Campo "${campo}" eliminado definitivamente`);
    setShowEliminar(false);
  };

  const guardarEdicion = async (data: EditarLoteData) => {
    if (!editLote) return;
    if (editLote.dbId) {
      await fetch(`/api/lotes/${editLote.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: data.nombre, hectareas: data.hectareas, cultivo: data.cultivo || null }),
      }).catch(() => {});
    }
    setLotes((prev) =>
      prev.map((l) =>
        l.id === editLote.id ? { ...l, name: data.nombre, ha: data.hectareas, cultivo: data.cultivo || null, vacio: !data.cultivo } : l
      )
    );
    setSelected((s) => (s && s.id === editLote.id ? { ...s, name: data.nombre, ha: data.hectareas, cultivo: data.cultivo || null } : s));
    toast.show("Lote actualizado");
    setEditLote(null);
  };

  const crearTarea = async (data: NuevaTareaData) => {
    if (!tareaLote) return;
    try {
      if (tareaLote.dbId) {
        const res = await fetch("/api/labores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: data.tipo, fecha: data.fecha, loteId: tareaLote.dbId,
            descripcion: data.descripcion || data.tipo, superficieTrabajada: tareaLote.ha,
          }),
        });
        if (!res.ok) throw new Error();
      }
      toast.show(`Tarea "${data.tipo}" creada para ${tareaLote.name}`);
      setTareaLote(null);
    } catch {
      toast.show("No se pudo crear la tarea", "err");
    }
  };

  const agregarNota = (lote: LoteUI, texto: string) => {
    const nota = { texto, autor: "Vos", fecha: fechaCorta(new Date()) };
    setLotes((prev) => prev.map((l) => (l.id === lote.id ? { ...l, comentarios: [nota, ...l.comentarios] } : l)));
    setSelected((s) => (s && s.id === lote.id ? { ...s, comentarios: [nota, ...s.comentarios] } : s));
    toast.show("Comentario georreferenciado agregado");
    setNotaLote(null);
    setComentarioGeneral(false);
  };

  return (
    <>
      {toast.node}
      {showAgregar && <AgregarCampoModal onClose={() => setShowAgregar(false)} onConfirm={crearCampo} />}
      {showEliminar && <EliminarCampoModal campos={campos} onClose={() => setShowEliminar(false)} onConfirm={eliminarCampo} />}
      {editLote && <EditarLoteModal lote={editLote} onClose={() => setEditLote(null)} onConfirm={guardarEdicion} />}
      {tareaLote && <NuevaTareaModal lote={tareaLote} onClose={() => setTareaLote(null)} onConfirm={crearTarea} />}
      {(notaLote || comentarioGeneral) && (
        <NotaModal
          lote={notaLote || selected || visibles[0]}
          onClose={() => { setNotaLote(null); setComentarioGeneral(false); }}
          onConfirm={agregarNota}
        />
      )}

      <div className="grid g-cols-5">
        <KPI label="Total de campos" value={String(campos.length)} delta={campos.map((c) => c.nombre).slice(0, 2).join(" + ") || "—"} trend="up" icon="map" accent />
        <KPI label="Total de lotes" value={String(lotes.length)} delta={demo("+2 esta campaña", "—")} trend="up" icon="sprout" />
        <KPI label="Total de hectáreas" value={`${Math.round(totalHa)} Ha`} delta={`${Math.round(sembradas)} sembradas`} trend="up" icon="activity" />
        <KPI label="Lotes sin asignar" value={String(sinAsignar.length)} delta={sinAsignar.map((l) => l.name).slice(0, 2).join(" + ") || "Ninguno"} trend="warn" icon="alert" />
        <KPI label="Marcadores" value={demo("14", "0")} delta="Pozos, silos, casas" trend="up" icon="target" />
      </div>

      <div className="row gap-8" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="row gap-8">
          <div className="mc-seg">
            <button className={view === "mapa" ? "is-on" : ""} onClick={() => { setSelected(null); setView("mapa"); }}>
              <Icon name="map" size={13} /> Vista Mapa
            </button>
            <button className={view === "lista" ? "is-on" : ""} onClick={() => { setSelected(null); setView("lista"); }}>
              <Icon name="list" size={13} /> Vista Lista
            </button>
          </div>
          <div className="mc-seg">
            {["Todos", ...campos.map((c) => c.nombre)].map((c) => (
              <button key={c} className={campoFiltro === c ? "is-on" : ""} onClick={() => setCampoFiltro(c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="row gap-8" style={{ position: "relative" }}>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setShowFiltros(!showFiltros)}>
            <Icon name="filter" size={13} />Filtros
          </button>
          {showFiltros && (
            <>
              <div onClick={() => setShowFiltros(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
              <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, width: 220, zIndex: 51, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 12, boxShadow: "var(--sh-lg)", padding: 12 }}>
                <div className="mc-label" style={{ marginBottom: 6 }}>Cultivo</div>
                <select className="mc-select" value={filtroCultivo} onChange={(e) => setFiltroCultivo(e.target.value)}>
                  {["Todos", "Soja", "Maíz", "Trigo", "Alfalfa", "Girasol"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}
          <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ color: "var(--mc-red)" }} onClick={() => setShowEliminar(true)}>
            <Icon name="trash" size={13} />Eliminar campo
          </button>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setShowAgregar(true)}>
            <Icon name="plus" size={13} />Agregar campo
          </button>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={() => setComentarioGeneral(true)}>
            <Icon name="pen" size={13} />Agregar Comentario
          </button>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setShowAgregar(true)}>
            <Icon name="plus" size={13} />Nuevo lote
          </button>
        </div>
      </div>

      {view === "mapa" && (
        <LotesMapa
          lotes={visibles}
          selected={selected}
          onSelect={setSelected}
          layer={layer}
          onLayerChange={setLayer}
          zoom={zoom}
          onZoom={setZoom}
          onNota={(l) => setNotaLote(l)}
          onEditar={(l) => setEditLote(l)}
          onTarea={(l) => setTareaLote(l)}
        />
      )}
      {view === "lista" && (
        <LotesListaDetallada
          lotes={visibles}
          onVer={(l) => { setSelected(l); setView("mapa"); }}
          onTarea={(l) => setTareaLote(l)}
        />
      )}
    </>
  );
}

/* ========== MAPA (Figma LotesMapa) ========== */
function LotesMapa({
  lotes, selected, onSelect, layer, onLayerChange, zoom, onZoom, onNota, onEditar, onTarea,
}: {
  lotes: LoteUI[];
  selected: LoteUI | null;
  onSelect: (l: LoteUI | null) => void;
  layer: string;
  onLayerChange: (l: string) => void;
  zoom: number;
  onZoom: (z: number) => void;
  onNota: (l: LoteUI) => void;
  onEditar: (l: LoteUI) => void;
  onTarea: (l: LoteUI) => void;
}) {
  const ndviScale = (v: number) => (v >= 0.75 ? "#1f6e2a" : v >= 0.65 ? "#768f44" : v >= 0.55 ? "#a8d09c" : v >= 0.45 ? "#e1c069" : "#cf7a3a");
  const humScale = (v: number) => (v >= 80 ? "#1d4ed8" : v >= 65 ? "#2c6bb8" : v >= 50 ? "#7ab4f0" : v >= 35 ? "#bcd9f4" : "#e8e6e0");
  const topoScale = (v: number) => (v >= 220 ? "#5b3b1a" : v >= 180 ? "#8a5a2a" : v >= 140 ? "#b88c50" : v >= 110 ? "#d8b380" : "#ecd9b8");

  const fillFor = (code: string) => {
    const m = GEO_METRICAS[code];
    if (!m) return "#e8e6e0";
    if (layer === "Cultivos") return m.vacio ? "url(#hatchVacio)" : m.cultivoColor || "url(#hatchVacio)";
    if (layer === "NDVI") return ndviScale(m.ndvi);
    if (layer === "Humedad") return humScale(m.hum);
    if (layer === "Topografía") return topoScale(m.topo);
    return m.cultivoColor || "url(#hatchVacio)";
  };

  const legendByLayer: Record<string, { color: string; label: string }[]> = {
    Cultivos: [
      { color: "#768f44", label: "Soja" },
      { color: "#d9a538", label: "Maíz" },
      { color: "#a88032", label: "Trigo" },
      { color: "#aabd76", label: "Alfalfa" },
      { color: "rgba(10,61,26,0.18)", label: "En descanso" },
    ],
    NDVI: [
      { color: "#1f6e2a", label: "Muy alto (≥0.75)" },
      { color: "#768f44", label: "Alto" },
      { color: "#a8d09c", label: "Medio" },
      { color: "#e1c069", label: "Bajo" },
      { color: "#cf7a3a", label: "Crítico (<0.45)" },
    ],
    Humedad: [
      { color: "#1d4ed8", label: "Saturado (≥80%)" },
      { color: "#2c6bb8", label: "Alto" },
      { color: "#7ab4f0", label: "Óptimo" },
      { color: "#bcd9f4", label: "Bajo" },
      { color: "#e8e6e0", label: "Seco (<35%)" },
    ],
    Topografía: [
      { color: "#5b3b1a", label: "≥220 m" },
      { color: "#8a5a2a", label: "180–220" },
      { color: "#b88c50", label: "140–180" },
      { color: "#d8b380", label: "110–140" },
      { color: "#ecd9b8", label: "<110 m" },
    ],
  };
  const legend = legendByLayer[layer] || legendByLayer.Cultivos;
  const codesVisibles = new Set(lotes.map((l) => l.id));
  const vb = 1 / zoom;
  const viewBox = `${(800 - 800 * vb) / 2} ${(600 - 600 * vb) / 2} ${800 * vb} ${600 * vb}`;

  return (
    <div className="grid" style={{ gridTemplateColumns: selected ? "360px 1fr" : "1fr", gap: 14, alignItems: "stretch" }}>
      {selected && (
        <LoteFichaTecnica
          lote={selected}
          onClose={() => onSelect(null)}
          onNota={() => onNota(selected)}
          onEditar={() => onEditar(selected)}
          onTarea={() => onTarea(selected)}
        />
      )}

      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mc-line)" }}>
          <div className="row gap-8">
            <div className="mc-seg">
              {["NDVI", "Cultivos", "Humedad", "Topografía"].map((l) => (
                <button key={l} className={layer === l ? "is-on" : ""} onClick={() => onLayerChange(l)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="row gap-4">
            <button className="mc-icon-btn" title="Ver primer lote" onClick={() => onSelect(lotes[0] || null)}>
              <Icon name="search" size={14} />
            </button>
            <button
              className="mc-icon-btn"
              title="Exportar mapa"
              onClick={() => {
                const svg = document.getElementById("mc-mapa-lotes");
                if (!svg) return;
                const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `micampo-mapa-${layer.toLowerCase()}.svg`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Icon name="download" size={14} />
            </button>
          </div>
        </div>
        <div className="mc-map" style={{ borderRadius: 0, border: "none", height: 600, position: "relative" }}>
          <div className="mc-map__grid"></div>
          <svg id="mc-mapa-lotes" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox={viewBox} preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="hatchVacio" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#38491f" strokeWidth="1" opacity="0.18" />
              </pattern>
            </defs>
            {LOTES_GEO.map((p) => {
              const lote = lotes.find((l) => l.id === p.id);
              const isSel = selected?.id === p.id;
              const visible = codesVisibles.has(p.id);
              const met = GEO_METRICAS[p.id];
              return (
                <g key={p.id} style={{ cursor: visible ? "pointer" : "default" }} onClick={() => lote && onSelect(lote)}>
                  <polygon
                    points={p.points}
                    fill={fillFor(p.id)}
                    stroke={isSel ? "#475569" : met?.vacio ? "#38491f" : "#4a5e29"}
                    strokeWidth={isSel ? 4 : 1.5}
                    opacity={visible ? (isSel ? 1 : 0.92) : 0.25}
                  />
                  <text x={p.labelX} y={p.labelY} fontSize="13" fill={p.labelFill} fontWeight="700" fontFamily="var(--ff-ui)" style={{ pointerEvents: "none" }}>
                    {lote?.name || p.id}
                  </text>
                </g>
              );
            })}
            <circle cx="200" cy="180" r="8" fill="#475569" stroke="white" strokeWidth="2.5" />
            <text x="215" y="184" fontSize="10" fill="#38491f" fontWeight="600">Pozo 1</text>
            <circle cx="500" cy="280" r="8" fill="#2c6bb8" stroke="white" strokeWidth="2.5" />
            <text x="515" y="284" fontSize="10" fill="#38491f" fontWeight="600">Silo</text>
            <rect x="680" y="60" width="14" height="14" fill="#1a1f1c" stroke="white" strokeWidth="2" />
            <text x="700" y="72" fontSize="10" fill="#38491f" fontWeight="600">Casa</text>
          </svg>

          <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(255,255,255,0.95)", padding: "10px 14px", borderRadius: 10, fontSize: 12, display: "flex", gap: 14, flexWrap: "wrap", boxShadow: "var(--sh-md)" }}>
            {legend.map((l) => (
              <div key={l.label} className="row gap-4">
                <span style={{ width: 12, height: 12, background: l.color, borderRadius: 3 }}></span>
                {l.label}
              </div>
            ))}
          </div>

          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            <button className="mc-icon-btn" style={{ background: "white", boxShadow: "var(--sh-sm)" }} title="Acercar" onClick={() => onZoom(Math.min(2.5, zoom + 0.25))}>
              <Icon name="plus" size={16} />
            </button>
            <button className="mc-icon-btn" style={{ background: "white", boxShadow: "var(--sh-sm)" }} title="Alejar" onClick={() => onZoom(Math.max(1, zoom - 0.25))}>
              <Icon name="minus" size={16} />
            </button>
            <button className="mc-icon-btn" style={{ background: "white", boxShadow: "var(--sh-sm)" }} title="Centrar" onClick={() => onZoom(1)}>
              <Icon name="target" size={16} />
            </button>
          </div>

          {!selected && (
            <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,31,28,0.85)", color: "white", padding: "8px 14px", borderRadius: 8, fontSize: 12 }}>
              Click en un lote para ver su ficha técnica
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== FICHA TÉCNICA (Figma LoteFichaTecnica) ========== */
function LoteFichaTecnica({
  lote, onClose, onNota, onEditar, onTarea,
}: {
  lote: LoteUI;
  onClose: () => void;
  onNota: () => void;
  onEditar: () => void;
  onTarea: () => void;
}) {
  const [innerTab, setInnerTab] = useState("Resumen");
  const lluviasDays = [12, 25, 38, 28, 18, 14, 22];
  const maxLl = Math.max(...lluviasDays);
  const comentario = lote.comentarios[0];

  return (
    <div className="mc-card" style={{ padding: 16, overflow: "hidden", display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
      <button onClick={onClose} className="mc-icon-btn" style={{ position: "absolute", top: 10, right: 10, border: "none" }}>
        <Icon name="x" size={14} />
      </button>
      <div>
        <div className="mc-card__eyebrow" style={{ fontSize: 12 }}>Ficha Técnica del Lote</div>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)", marginTop: 8 }}>
          {lote.id} · {lote.name.toUpperCase()}
        </div>
        <div className="row gap-8 mt-8 text-xs text-muted" style={{ alignItems: "center" }}>
          <span>{lote.ha} Has</span>
          <span>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="sprout" size={13} /> {lote.cultivo || "Sin cultivo"} {lote.variety || ""}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexShrink: 0 }}>
            <span className={`mc-badge mc-badge--${lote.sano ? "green" : "orange"}`}>
              {lote.sano ? <Icon name="check" size={11} /> : <Icon name="alert" size={11} />} {lote.sano ? "Saludable" : "Atención"}
            </span>
            <span className="mc-badge mc-badge--neutral"><Icon name="map" size={10} />Propio</span>
          </div>
        </div>
      </div>

      <div className="row gap-2" style={{ borderBottom: "1px solid var(--mc-line)", padding: 0 }}>
        {["Resumen", "Historial", "Suelo", "Labores"].map((t) => (
          <button
            key={t}
            onClick={() => setInnerTab(t)}
            style={{
              padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: innerTab === t ? "var(--mc-green-700)" : "var(--mc-text-3)",
              borderBottom: innerTab === t ? "2px solid var(--mc-green-600)" : "2px solid transparent", marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {innerTab === "Resumen" && (
        <>
          <div className="grid g-cols-3 gap-8">
            <FichaChip icon="leaf" label="NDVI" value={lote.ndvi.toFixed(2)} arrow="up" />
            <FichaChip icon="droplet" label="Agua Útil" value={`${lote.aguaUtil}%`} arrow="droplet" />
            <FichaChip icon="sprout" label="Estadio" value={lote.estadio || "V6 (Veg)"} small />
          </div>

          <div style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>Clima Local (7 días)</div>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-ink)", marginTop: 2 }}>45mm</div>
                <div className="text-xs text-muted">Acumulados</div>
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 56 }}>
                {lluviasDays.map((v, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ width: 10, height: (v / maxLl) * 50, background: "var(--mc-blue)", borderRadius: 2 }}></div>
                    <div style={{ fontSize: 9, color: "var(--mc-text-3)" }}>{["L", "M", "M", "J", "V", "S", "D"][i]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {comentario && (
            <div style={{ padding: "10px 12px", background: "var(--mc-blue-bg)", border: "1px solid var(--mc-blue)", borderRadius: 10 }}>
              <div className="row gap-8">
                <Icon name="map" size={14} style={{ color: "var(--mc-blue)" }} />
                <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>Comentario Georreferenciado</div>
              </div>
              <div className="text-xs text-muted mt-4">
                {comentario.texto} — {comentario.autor}, {comentario.fecha}
              </div>
            </div>
          )}

          {!lote.sano && (
            <div style={{ padding: "10px 12px", background: "var(--mc-red-bg)", border: "1px solid var(--mc-red)", borderRadius: 10 }}>
              <div className="row gap-8">
                <Icon name="alert" size={14} style={{ color: "var(--mc-red)" }} />
                <div className="font-semi text-sm" style={{ color: "var(--mc-red)" }}>Oruga Bolillera detectada</div>
                <span className="text-xs text-muted" style={{ marginLeft: "auto" }}>(Hace 2 días)</span>
              </div>
            </div>
          )}
        </>
      )}

      {innerTab === "Historial" && (
        <div className="col gap-8">
          <HistRow fecha="14/Abr" tipo="Pulverización" detail="Glifosato 3 L/Ha" />
          <HistRow fecha="08/Abr" tipo="Fertilización" detail="Urea 120 kg/Ha" />
          <HistRow fecha="22/Mar" tipo="Siembra" detail={`${lote.variety || "Var. estándar"} · 80 kpa`} />
          <HistRow fecha="15/Mar" tipo="Análisis suelo" detail="pH 6.2 · MO 2.8%" />
        </div>
      )}

      {innerTab === "Suelo" && (
        <div className="col gap-8">
          <SoilBar label="Nitrógeno (N)" value={60} color="var(--mc-amber)" />
          <SoilBar label="Fósforo (P)" value={45} color="var(--mc-red)" />
          <SoilBar label="Potasio (K)" value={80} color="var(--mc-green-500)" />
          <div className="row gap-8 mt-8" style={{ fontSize: 13 }}>
            <div style={{ flex: 1, padding: 8, background: "var(--mc-surface-2)", borderRadius: 8 }}>
              <div className="text-xs text-muted">pH</div>
              <div className="font-semi">6.2</div>
            </div>
            <div style={{ flex: 1, padding: 8, background: "var(--mc-surface-2)", borderRadius: 8 }}>
              <div className="text-xs text-muted">MO</div>
              <div className="font-semi">2.8%</div>
            </div>
          </div>
        </div>
      )}

      {innerTab === "Labores" && (
        <div className="col gap-8">
          <HistRow fecha="22/Abr" tipo="Pulverización" detail="Programada · Cipermetrina" />
          <HistRow fecha="28/Abr" tipo="Monitoreo" detail="Programado · Drone" />
          <HistRow fecha="05/May" tipo="Cosecha est." detail={`${lote.name} · ${lote.cultivo || "—"}`} />
        </div>
      )}

      <div className="row gap-8" style={{ marginTop: "auto" }}>
        <button className="mc-btn mc-btn--secondary mc-btn--sm flex-1" onClick={onNota}>
          <Icon name="pen" size={13} />Nota
        </button>
        <button className="mc-btn mc-btn--secondary mc-btn--sm flex-1" onClick={onEditar}>
          <Icon name="edit" size={13} />Editar
        </button>
        <button className="mc-btn mc-btn--primary mc-btn--sm flex-1" onClick={onTarea}>
          <Icon name="plus" size={13} />Nueva Tarea
        </button>
      </div>
    </div>
  );
}

function FichaChip({ icon, label, value, arrow, small }: { icon: string; label: string; value: string; arrow?: string; small?: boolean }) {
  return (
    <div style={{ padding: 10, background: "var(--mc-surface-2)", borderRadius: 10, border: "1px solid var(--mc-line)" }}>
      <div className="row gap-4 text-xs text-muted" style={{ alignItems: "center" }}>
        <Icon name={icon} size={11} />{label}:
      </div>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: small ? 13 : 16 }}>{value}</span>
        {arrow === "up" && <Icon name="arrowUp" size={12} style={{ color: "var(--mc-green-700)" }} />}
        {arrow === "droplet" && <Icon name="droplet" size={12} style={{ color: "var(--mc-blue)" }} />}
        {small && (
          <span style={{ display: "flex", gap: 2 }}>
            <span style={{ width: 14, height: 4, background: "var(--mc-green-500)", borderRadius: 2 }}></span>
            <span style={{ width: 14, height: 4, background: "var(--mc-green-500)", borderRadius: 2 }}></span>
            <span style={{ width: 14, height: 4, background: "var(--mc-line)", borderRadius: 2 }}></span>
          </span>
        )}
      </div>
    </div>
  );
}

function HistRow({ fecha, tipo, detail }: { fecha: string; tipo: string; detail: string }) {
  return (
    <div className="row gap-12" style={{ padding: "8px 10px", border: "1px solid var(--mc-line)", borderRadius: 8 }}>
      <div className="font-mono text-xs text-muted" style={{ width: 50 }}>{fecha}</div>
      <div style={{ flex: 1 }}>
        <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{tipo}</div>
        <div className="text-xs text-muted">{detail}</div>
      </div>
    </div>
  );
}

function SoilBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", fontSize: 12 }}>
        <span className="text-muted">{label}</span>
        <span className="font-mono font-semi">{value}%</span>
      </div>
      <div className="mc-prog mt-4">
        <div className="mc-prog__bar" style={{ width: `${value}%`, background: color }}></div>
      </div>
    </div>
  );
}

/* ========== VISTA LISTA (Figma LotesListaDetallada) ========== */
function LotesListaDetallada({
  lotes, onVer, onTarea,
}: {
  lotes: LoteUI[];
  onVer: (l: LoteUI) => void;
  onTarea: (l: LoteUI) => void;
}) {
  const [histLote, setHistLote] = useState<{ lote: string; genetica: string } | null>(null);

  const rows = lotes.map((l, i) => ({ lote: l, x: LISTA_EXTRAS[i % LISTA_EXTRAS.length] }));

  return (
    <>
      {histLote && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "grid", placeItems: "center" }} onClick={() => setHistLote(null)}>
          <div style={{ background: "var(--mc-surface)", borderRadius: 14, padding: 24, width: 420, maxWidth: "90vw", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div className="mc-card__eyebrow">Timeline del Lote</div>
                <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 16, marginTop: 2 }}>{histLote.lote}</div>
              </div>
              <button className="mc-icon-btn" onClick={() => setHistLote(null)}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <div style={{ position: "relative", paddingLeft: 22 }}>
              <div style={{ position: "absolute", left: 9, top: 4, bottom: 4, width: 2, background: "var(--mc-line)" }}></div>
              {[
                { fecha: "18/Abr", tipo: "Pulverización", detail: "Glifosato 3 L/Ha · J. Pérez", color: "var(--mc-orange-500)", icon: "flask" },
                { fecha: "10/Abr", tipo: "Fertilización", detail: "Urea 120 kg/Ha", color: "var(--mc-amber)", icon: "leaf" },
                { fecha: "22/Mar", tipo: "Siembra", detail: `${histLote.genetica} · 80 kpa`, color: "var(--mc-green-500)", icon: "sprout" },
                { fecha: "15/Mar", tipo: "Análisis suelo", detail: "pH 6.2 · MO 2.8%", color: "var(--mc-blue)", icon: "activity" },
                { fecha: "02/Mar", tipo: "Labranza", detail: "Cincel vibratorio · 25 cm", color: "var(--mc-text-2)", icon: "wrench" },
              ].map((ev, i) => (
                <div key={i} style={{ position: "relative", paddingBottom: i < 4 ? 14 : 0, paddingLeft: 8 }}>
                  <div style={{ position: "absolute", left: -13, top: 2, width: 20, height: 20, borderRadius: "50%", background: ev.color, color: "white", display: "grid", placeItems: "center", border: "2px solid var(--mc-surface)" }}>
                    <Icon name={ev.icon} size={10} />
                  </div>
                  <div className="font-mono text-xs" style={{ color: "var(--mc-text-3)" }}>{ev.fecha}</div>
                  <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{ev.tipo}</div>
                  <div className="text-xs text-muted">{ev.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="mc-card" style={{ padding: 0, overflow: "auto" }}>
        <div className="mc-lotes-list">
          <div className="mc-lotes-list__head">
            <div>Identidad</div>
            <div>Cultivo</div>
            <div>Finanzas</div>
            <div>Salud</div>
            <div>Monitoreo</div>
            <div>Proyección</div>
            <div>Acciones</div>
          </div>
          {rows.map(({ lote: l, x }, i) => {
            const cultivo = l.cultivo || "Sin cultivo";
            const cropEmoji = cultivo.includes("Maíz") ? "wheat" : cultivo.includes("Soja") ? "sprout" : cultivo.includes("Trigo") ? "wheat" : cultivo.includes("Girasol") ? "sun" : "leaf";
            return (
              <div key={i} className="mc-lotes-list__row" onClick={() => onVer(l)}>
                <div>
                  <div className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>{l.campo}</div>
                  <div className="row gap-4 mt-4" style={{ alignItems: "center" }}>
                    <Icon name="map" size={14} style={{ color: "var(--mc-red)" }} />
                    <span className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>{l.id.replace("L-0", "Lote ")} - {l.name}</span>
                  </div>
                  <div className="text-xs text-muted mt-4">{l.ha} Hectáreas</div>
                </div>
                <div>
                  <div className="row gap-4" style={{ alignItems: "center" }}>
                    <Icon name={cropEmoji} size={16} />
                    <span className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{cultivo}</span>
                  </div>
                  <span className="mc-badge mc-badge--neutral mt-4" style={{ fontSize: 10 }}>[ {l.estadio || "—"} ]</span>
                  <div className="text-xs text-muted mt-4" style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="activity" size={12} /> Genética: {l.variety || x.genetica}</div>
                </div>
                <div>
                  <div className="row" style={{ justifyContent: "flex-end", fontSize: 11, color: "var(--mc-text-3)" }}>{x.finPct}%</div>
                  <div className="mc-prog" style={{ marginTop: 2 }}>
                    <div className="mc-prog__bar" style={{ width: `${x.finPct}%`, background: "var(--mc-blue)" }}></div>
                  </div>
                  <div className="text-xs mt-4" style={{ color: "var(--mc-ink)", fontWeight: 500 }}>{x.finUSD}</div>
                  <div className="text-xs" style={{ color: "var(--mc-green-700)", fontWeight: 600, marginTop: 2 }}>Disp: {x.finDisp}</div>
                </div>
                <div>
                  <div className="row gap-4" style={{ alignItems: "center", fontSize: 12 }}>
                    <Icon name="check" size={11} style={{ color: "var(--mc-green-700)" }} />
                    <span className="font-semi" style={{ color: "var(--mc-ink)" }}>NDVI {x.ndviLabel}</span>
                    {x.ndviTrend === "up" && <Icon name="arrowUp" size={10} style={{ color: "var(--mc-green-700)" }} />}
                    {x.ndviTrend === "down" && <Icon name="arrowDown" size={10} style={{ color: "var(--mc-red)" }} />}
                  </div>
                  <div className="row gap-4 mt-4" style={{ alignItems: "center", fontSize: 12 }}>
                    <Icon name="droplet" size={11} style={{ color: "var(--mc-blue)" }} />
                    <span className="text-muted">Agua: {l.aguaUtil}%</span>
                  </div>
                  <div className="text-xs text-muted mt-4" style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="calendar" size={12} /> Visita: {x.visita}</div>
                </div>
                <div>
                  <div className="row gap-4" style={{ alignItems: "center", fontSize: 12 }}>
                    <Icon name="bug" size={12} />
                    <span className="font-semi text-xs" style={{ color: "var(--mc-ink)" }}>{x.plaga}</span>
                  </div>
                  <div className="row gap-4 mt-4" style={{ alignItems: "center", fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: x.riesgoColor === "red" ? "var(--mc-red)" : x.riesgoColor === "amber" ? "var(--mc-amber)" : "var(--mc-green-500)" }}></span>
                    <span className="font-semi text-xs" style={{ color: x.riesgoColor === "red" ? "var(--mc-red)" : x.riesgoColor === "amber" ? "var(--mc-amber)" : "var(--mc-green-700)" }}>
                      {x.riesgo} ({x.riesgoVal})
                    </span>
                  </div>
                  <span className={`mc-badge mt-4 ${x.monitor.includes("OK") ? "mc-badge--green" : x.monitor.includes("Vigilancia") || x.monitor.includes("Pendiente") ? "mc-badge--amber" : "mc-badge--red"}`} style={{ fontSize: 10 }}>
                    <Icon name={x.monitor.includes("OK") ? "check" : "alert"} size={11} /> {x.monitor}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, color: "var(--mc-ink)" }}>{x.proy}</div>
                  <div className="text-xs" style={{ color: x.neg ? "var(--mc-red)" : "var(--mc-green-700)", fontWeight: 600, marginTop: 2 }}>
                    {x.neg ? <Icon name="arrowDown" size={10} /> : <Icon name="arrowUp" size={10} />} {x.proyDelta}
                  </div>
                  <div className="text-xs text-muted mt-4" style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="calendar" size={12} /> Est: {x.proyFecha}</div>
                </div>
                <div className="col gap-4" onClick={(e) => e.stopPropagation()}>
                  <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => onTarea(l)}>
                    <Icon name="plus" size={11} />Tarea
                  </button>
                  <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 10px", fontSize: 11, justifyContent: "flex-start" }} onClick={() => setHistLote({ lote: l.name, genetica: l.variety || x.genetica })}>
                    <Icon name="activity" size={11} />Historial
                  </button>
                  <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 10px", fontSize: 11, justifyContent: "flex-start", color: "var(--mc-green-700)" }} onClick={() => onVer(l)}>
                    <Icon name="arrowRight" size={11} /> Ver
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ========== MODAL NOTA GEORREFERENCIADA ========== */
function NotaModal({
  lote, onClose, onConfirm,
}: {
  lote: LoteUI | undefined;
  onClose: () => void;
  onConfirm: (lote: LoteUI, texto: string) => void;
}) {
  const [texto, setTexto] = useState("");
  if (!lote) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "var(--mc-surface)", borderRadius: 16, width: 460, maxWidth: "100%", boxShadow: "var(--sh-lg)", padding: 22 }} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div className="mc-card__eyebrow">Comentario Georreferenciado</div>
            <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 16, marginTop: 2 }}>{lote.id} · {lote.name}</div>
          </div>
          <button className="mc-icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <textarea
          className="mc-textarea"
          placeholder="Ej: Sector bajo con encharcamiento tras la lluvia. Revisar drenaje."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoFocus
        />
        <div className="row gap-8 mt-12" style={{ justifyContent: "flex-end" }}>
          <button className="mc-btn mc-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" disabled={!texto.trim()} onClick={() => onConfirm(lote, texto.trim())}>
            <Icon name="pen" size={13} />Guardar nota
          </button>
        </div>
      </div>
    </div>
  );
}
