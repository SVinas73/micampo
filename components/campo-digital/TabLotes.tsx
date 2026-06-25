"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon, KPI, useToast } from "@/components/mc";
import { demo } from "@/lib/demo";
import { useLoteScope } from "@/components/LoteScope";
import { useSetHeaderActions } from "./ActionsContext";
import {
  LOTES_INICIALES, mapLotesApi, fechaCorta, CULTIVO_COLORES,
  type LoteUI,
} from "./lotes-data";

// Mapa satelital con terreno 3D (MapLibre GL) — solo en cliente
const Mapa3D = dynamic(() => import("./MapaLibre"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--mc-text-3)", fontSize: 13 }}>
      Cargando mapa 3D…
    </div>
  ),
});
// Mapa clásico (Leaflet) — vista 2D con NDVI satelital
const MapaClasico = dynamic(() => import("./MapaNDVI"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--mc-text-3)", fontSize: 13 }}>
      Cargando mapa…
    </div>
  ),
});

type DibujoLote = { geojson: { type: "Polygon"; coordinates: number[][][] }; hectareas: number; centro: { lat: number; lng: number }; perimetro: number };
import {
  AgregarCampoModal, EliminarCampoModal, EliminarCampoEstModal, EditarLoteModal, NuevaTareaModal,
  type AgregarCampoData, type EditarLoteData, type NuevaTareaData,
} from "./lotes-Modales";
import { LoteOverlay, CropImg } from "./LoteOverlay";
import { cuadradoDesdeCentro } from "@/lib/geo";
import BuscadorLugar from "./BuscadorLugar";

/* ========== TAB LOTES (Figma CDLotes) ========== */
export default function TabLotes() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { loteIdsEnScope, esTodos, recargar, establecimientos, establecimientoActivo, establecimientoId, setEstablecimientoId } = useLoteScope();
  // Modo "delimitar establecimiento": llega desde el card de Establecimientos.
  const delimitarId = searchParams.get("delimitar");
  const estDelimitar = delimitarId ? establecimientos.find((e) => e.id === delimitarId) || null : null;
  const [volarA, setVolarA] = useState<{ lat: number; lng: number; nonce: number } | null>(null);
  const [lotes, setLotes] = useState<LoteUI[]>(demo(LOTES_INICIALES, []));
  const [selected, setSelected] = useState<LoteUI | null>(null);
  const [view, setView] = useState<"mapa" | "lista">("mapa");
  const [layer, setLayer] = useState("NDVI");
  const [showAgregar, setShowAgregar] = useState(searchParams.get("modal") === "nuevo");
  const [showEliminar, setShowEliminar] = useState(false);
  const [showEliminarCampo, setShowEliminarCampo] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroCultivo, setFiltroCultivo] = useState("Todos");
  const [editLote, setEditLote] = useState<LoteUI | null>(null);
  const [tareaLote, setTareaLote] = useState<LoteUI | null>(null);
  const [notaLote, setNotaLote] = useState<LoteUI | null>(null);
  const [comentarioGeneral, setComentarioGeneral] = useState(false);
  const [dibujado, setDibujado] = useState<DibujoLote | null>(null);
  const [drawArmed, setDrawArmed] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const r = await fetch("/api/lotes");
        const d = r.ok ? await r.json() : [];
        if (!Array.isArray(d) || d.length === 0 || cancelado) return;
        const base = mapLotesApi(d);
        setLotes(base);

        // NDVI real (Sentinel Hub Statistics API) para los lotes con geometría
        const conGeo = base.filter((l) => l.geojson?.coordinates?.[0]?.length && l.dbId);
        if (conGeo.length === 0) return;
        const resp = await fetch("/api/lotes/ndvi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lotes: conGeo.map((l) => ({ id: l.dbId, geojson: l.geojson })) }),
        }).catch(() => null);
        if (!resp || !resp.ok || cancelado) return;
        const { resultados } = (await resp.json()) as {
          resultados?: Record<string, { ndvi: number; fecha: string | null }>;
        };
        if (!resultados || cancelado) return;
        setLotes((prev) =>
          prev.map((l) => {
            const m = l.dbId ? resultados[l.dbId] : undefined;
            if (!m || typeof m.ndvi !== "number") return l;
            return { ...l, ndvi: m.ndvi, sano: m.ndvi === 0 ? l.sano : m.ndvi >= 0.5 };
          })
        );
      } catch {
        /* sin datos: el sistema sigue con NDVI en 0 */
      }
    })();
    return () => { cancelado = true; };
  }, []);

  /* ---- Acción de header. El lote se crea dibujándolo en el mapa ("Dibujar lote"). ---- */
  useSetHeaderActions(
    <button className="mc-btn mc-btn--red" onClick={() => setShowEliminarCampo(true)}>
      <Icon name="trash" size={14} />Eliminar campo
    </button>,
    []
  );

  // Lotes dentro del alcance global (establecimiento + lote)
  const enScope = useMemo(
    () => (esTodos ? lotes : lotes.filter((l) => loteIdsEnScope.includes(l.dbId || l.id))),
    [lotes, loteIdsEnScope, esTodos]
  );

  const visibles = useMemo(
    () => enScope.filter((l) => filtroCultivo === "Todos" || l.cultivo === filtroCultivo),
    [enScope, filtroCultivo]
  );

  const totalHa = enScope.reduce((s, l) => s + l.ha, 0);
  const sembradas = enScope.filter((l) => !l.vacio).reduce((s, l) => s + l.ha, 0);
  const sinAsignar = enScope.filter((l) => l.vacio);

  /* ---- Acciones conectadas ---- */
  const crearCampo = async (data: AgregarCampoData) => {
    try {
      // Geometría: 1) polígono dibujado a mano, 2) cuadrado generado desde
      // coordenadas/búsqueda + hectáreas, 3) sin geometría.
      const geom = dibujado ?? (data.centro ? cuadradoDesdeCentro(data.centro, data.hectareas) : null);
      const res = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.nombre,
          hectareas: data.hectareas,
          cultivo: data.cultivo,
          coordenadas: geom?.geojson ?? null,
          centroLatitud: geom?.centro.lat ?? null,
          centroLongitud: geom?.centro.lng ?? null,
          perimetro: geom?.perimetro ?? null,
          establecimientoId: data.establecimientoId ?? establecimientoActivo?.id ?? null,
        }),
      });
      let dbId: string | undefined;
      if (res.ok) dbId = (await res.json()).id;
      setLotes((prev) => [
        ...prev,
        {
          id: dbId || `L-${prev.length + 1}`, dbId, name: data.nombre, campo: data.nombre, ha: data.hectareas,
          cultivo: data.cultivo, estadio: data.cultivo ? "Vegetativo" : "—", ndvi: 0, aguaUtil: 0, sano: true, vacio: !data.cultivo, comentarios: [],
          geojson: geom?.geojson ?? null, cultivoColor: data.cultivo ? (CULTIVO_COLORES[data.cultivo] || "#5e7733") : null,
          establecimientoId: data.establecimientoId ?? establecimientoActivo?.id ?? null,
        },
      ]);
      setDibujado(null);
      toast.show(geom ? `Lote "${data.nombre}" agregado al mapa` : `Lote "${data.nombre}" creado`);
      setShowAgregar(false);
      recargar(); // refresca el selector global de lotes
    } catch {
      toast.show("No se pudo crear el lote", "err");
    }
  };

  // Guarda el límite dibujado del establecimiento (modo "delimitar").
  const guardarLimite = async (d: DibujoLote) => {
    if (!delimitarId) return;
    try {
      const res = await fetch(`/api/establecimientos/${delimitarId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coordenadas: d.geojson,
          centroLatitud: d.centro.lat,
          centroLongitud: d.centro.lng,
          perimetro: d.perimetro,
          hectareasTotales: d.hectareas,
        }),
      });
      if (!res.ok) throw new Error();
      toast.show(`Límite de "${estDelimitar?.nombre || "establecimiento"}" guardado (${Math.round(d.hectareas)} ha)`);
      recargar();
      router.replace("/campo-digital?tab=Lotes", { scroll: false });
    } catch {
      toast.show("No se pudo guardar el límite", "err");
    }
  };

  // Al entrar en modo "delimitar": ir al mapa, armar el dibujo y, si el campo ya
  // tiene centro, volar ahí (si no, el usuario busca el lugar).
  useEffect(() => {
    if (!estDelimitar) return;
    setSelected(null);
    setView("mapa");
    setDrawArmed(true);
    if (estDelimitar.centroLatitud != null && estDelimitar.centroLongitud != null) {
      setVolarA({ lat: estDelimitar.centroLatitud, lng: estDelimitar.centroLongitud, nonce: Date.now() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delimitarId, estDelimitar?.id]);

  // Al activar un establecimiento (selector global), centrar el mapa en él para
  // que encontrarlo y crear lotes adentro sea fácil.
  useEffect(() => {
    if (delimitarId) return;
    if (establecimientoActivo?.centroLatitud != null && establecimientoActivo?.centroLongitud != null) {
      setVolarA({ lat: establecimientoActivo.centroLatitud, lng: establecimientoActivo.centroLongitud, nonce: Date.now() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establecimientoActivo?.id]);

  const eliminarLote = async (id: string) => {
    const lote = lotes.find((l) => (l.dbId || l.id) === id);
    if (lote?.dbId) {
      const res = await fetch(`/api/lotes/${lote.dbId}`, { method: "DELETE" }).catch(() => null);
      if (!res || !res.ok) { toast.show("No se pudo eliminar el lote", "err"); return; }
    }
    setLotes((prev) => prev.filter((l) => (l.dbId || l.id) !== id));
    setSelected((s) => (s && (s.dbId || s.id) === id ? null : s));
    toast.show(`Lote "${lote?.name || ""}" eliminado definitivamente`);
    setShowEliminar(false);
    recargar(); // refresca el selector global
  };

  const eliminarCampoEst = async (id: string) => {
    const camp = establecimientos.find((e) => e.id === id);
    const res = await fetch(`/api/establecimientos/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) { toast.show("No se pudo eliminar el campo", "err"); return; }
    const d = await res.json().catch(() => ({}));
    toast.show(d.lotesLiberados ? `Campo "${camp?.nombre || ""}" eliminado · ${d.lotesLiberados} lote(s) sin asignar` : `Campo "${camp?.nombre || ""}" eliminado`);
    setShowEliminarCampo(false);
    recargar();
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

  const agregarNota = async (lote: LoteUI, texto: string) => {
    const nota = { texto, autor: "Vos", fecha: fechaCorta(new Date()) };
    setLotes((prev) => prev.map((l) => (l.id === lote.id ? { ...l, comentarios: [nota, ...l.comentarios] } : l)));
    setSelected((s) => (s && s.id === lote.id ? { ...s, comentarios: [nota, ...s.comentarios] } : s));
    setNotaLote(null);
    setComentarioGeneral(false);
    // Persiste como marcador georreferenciado (tipo Observación) en el centro del lote
    if (lote.dbId) {
      const c = centroLote(lote);
      const res = await fetch("/api/marcadores-geo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loteId: lote.dbId, latitud: c.lat, longitud: c.lng, tipo: "Observación", titulo: "Nota", descripcion: texto, responsable: "Vos" }),
      }).catch(() => null);
      toast.show(res && res.ok ? "Comentario guardado en el lote" : "Comentario agregado (no se pudo guardar en la base)", res && res.ok ? "ok" : "err");
    } else {
      toast.show("Comentario agregado");
    }
  };

  return (
    <>
      {toast.node}
      {showAgregar && <AgregarCampoModal onClose={() => { setShowAgregar(false); setDibujado(null); }} onConfirm={crearCampo} onDibujar={() => { setShowAgregar(false); setSelected(null); setView("mapa"); setDrawArmed(true); }} defaultHectareas={dibujado?.hectareas} dibujadoEnMapa={!!dibujado} centro={dibujado?.centro} establecimientos={establecimientos} establecimientoActivoId={establecimientoActivo?.id ?? null} />}
      {showEliminar && (
        <EliminarCampoModal
          lotes={enScope.map((l) => ({ id: l.dbId || l.id, nombre: l.name, ha: l.ha, cultivo: l.cultivo }))}
          initialId={selected ? selected.dbId || selected.id : undefined}
          onClose={() => setShowEliminar(false)}
          onConfirm={eliminarLote}
        />
      )}
      {showEliminarCampo && (
        <EliminarCampoEstModal
          campos={establecimientos.map((e) => ({ id: e.id, nombre: e.nombre, lotesCount: lotes.filter((l) => l.establecimientoId === e.id).length }))}
          onClose={() => setShowEliminarCampo(false)}
          onConfirm={eliminarCampoEst}
        />
      )}
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
        <KPI label="Establecimientos" value={String(establecimientos.length)} delta={establecimientoActivo ? establecimientoActivo.nombre : "Todos"} trend="up" icon="building" accent />
        <KPI label="Lotes en vista" value={String(enScope.length)} delta={esTodos ? `${lotes.length} en total` : "Filtrado"} trend="up" icon="sprout" />
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
          {establecimientos.length > 0 && (
            <div className="mc-seg" style={{ alignSelf: "center", display: "flex", alignItems: "center", paddingLeft: 8 }} title="Cambiar de establecimiento">
              <Icon name="building" size={13} style={{ color: "var(--mc-green-700)" }} />
              <select
                value={establecimientoId}
                onChange={(e) => setEstablecimientoId(e.target.value)}
                style={{ border: "none", background: "transparent", fontWeight: 600, fontSize: 13, color: "var(--mc-ink)", cursor: "pointer", outline: "none", padding: "6px 8px", maxWidth: 220 }}
              >
                <option value="todos">Todos los establecimientos</option>
                {establecimientos.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}{e.lotesCount != null ? ` (${e.lotesCount})` : ""}</option>
                ))}
              </select>
            </div>
          )}
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
          <button className="mc-btn mc-btn--red mc-btn--sm" onClick={() => setShowEliminar(true)}>
            <Icon name="trash" size={13} />Eliminar lote
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
          onNota={(l) => setNotaLote(l)}
          onEditar={(l) => setEditLote(l)}
          onTarea={(l) => setTareaLote(l)}
          onDrawn={(d) => { if (delimitarId) { guardarLimite(d); } else { setDibujado(d); setShowAgregar(true); } }}
          armarDibujo={drawArmed}
          onDibujoIniciado={() => setDrawArmed(false)}
          volarA={volarA}
          onBuscar={(p) => setVolarA({ lat: p.lat, lng: p.lng, nonce: Date.now() })}
          delimitandoNombre={estDelimitar?.nombre ?? null}
          delimitando={!!delimitarId}
          onReArmar={() => setDrawArmed(true)}
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
  lotes, selected, onSelect, layer, onLayerChange, onNota, onEditar, onTarea, onDrawn, armarDibujo, onDibujoIniciado, volarA, onBuscar, delimitandoNombre, delimitando, onReArmar,
}: {
  lotes: LoteUI[];
  selected: LoteUI | null;
  onSelect: (l: LoteUI | null) => void;
  layer: string;
  onLayerChange: (l: string) => void;
  onNota: (l: LoteUI) => void;
  onEditar: (l: LoteUI) => void;
  onTarea: (l: LoteUI) => void;
  onDrawn: (d: { geojson: { type: "Polygon"; coordinates: number[][][] }; hectareas: number; centro: { lat: number; lng: number }; perimetro: number }) => void;
  armarDibujo?: boolean;
  onDibujoIniciado?: () => void;
  volarA?: { lat: number; lng: number; nonce: number } | null;
  onBuscar?: (p: { lat: number; lng: number; nombre: string }) => void;
  delimitandoNombre?: string | null;
  delimitando?: boolean;
  onReArmar?: () => void;
}) {
  const legendByLayer: Record<string, { color: string; label: string }[]> = {
    NDVI: [
      { color: "#1f6e2a", label: "Muy alto (≥0.75)" },
      { color: "#5e7733", label: "Alto" },
      { color: "#8ea65a", label: "Medio" },
      { color: "#d9a538", label: "Bajo" },
      { color: "#9aa39a", label: "Sin medición" },
    ],
    Cultivos: [
      { color: "#8ea65a", label: "Soja" },
      { color: "#c08a22", label: "Maíz" },
      { color: "#d9a538", label: "Trigo" },
      { color: "#aabd76", label: "Alfalfa" },
      { color: "#9aa39a", label: "En descanso" },
    ],
    "Satélite": [],
  };
  const legend = legendByLayer[layer] || [];
  const { establecimientos } = useLoteScope();
  const nombreEst = (id?: string | null) => (id ? establecimientos.find((e) => e.id === id)?.nombre ?? null : null);
  const lotesGeo = lotes.map((l) => ({ id: l.id, name: l.name, ndvi: l.ndvi, vacio: l.vacio, cultivoColor: l.cultivoColor ?? null, geojson: l.geojson ?? null, establecimientoId: l.establecimientoId ?? null, establecimientoNombre: nombreEst(l.establecimientoId) }));
  // Contornos de establecimientos con límite dibujado, para que se vean en el mapa.
  const establecimientosGeo = establecimientos.map((e) => ({ id: e.id, nombre: e.nombre, coordenadas: e.coordenadas ?? null }));
  // Para delimitar conviene la vista clásica (2D, cenital): más cómodo para dibujar.
  const [vista, setVista] = useState<"3d" | "clasico">(delimitando ? "clasico" : "3d");
  // Al cambiar de vista se desmonta/monta otro mapa; si estábamos delimitando hay
  // que re-armar el dibujo para no perder el cursor (queda en modo "mover" si no).
  const cambiarVista = (v: "3d" | "clasico") => {
    setVista(v);
    if (delimitando) onReArmar?.();
  };
  const [fichaOpen, setFichaOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const MapaActivo = vista === "3d" ? Mapa3D : MapaClasico;

  // Estado de conexión: avisa cuándo el mapa está mostrando tiles cacheados.
  useEffect(() => {
    const actualizar = () => setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mc-line)", gap: 12, flexWrap: "wrap" }}>
        <div className="row gap-10" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <div className="mc-seg">
            <button className={vista === "3d" ? "is-on" : ""} onClick={() => cambiarVista("3d")}><Icon name="map" size={12} /> 3D</button>
            <button className={vista === "clasico" ? "is-on" : ""} onClick={() => cambiarVista("clasico")}>Clásico</button>
          </div>
          <div className="mc-seg">
            {["NDVI", "Satélite", "Cultivos"].map((l) => (
              <button key={l} className={layer === l ? "is-on" : ""} onClick={() => onLayerChange(l)}>{l}</button>
            ))}
          </div>
          {lotes.length > 0 && (
            <div className="mc-seg" style={{ display: "flex", alignItems: "center", paddingLeft: 8 }} title="Elegir lote">
              <Icon name="map" size={13} style={{ color: "var(--mc-green-700)" }} />
              <select
                value={selected?.id ?? ""}
                onChange={(e) => onSelect(lotes.find((l) => l.id === e.target.value) || null)}
                style={{ border: "none", background: "transparent", fontWeight: 600, fontSize: 13, color: "var(--mc-ink)", cursor: "pointer", outline: "none", padding: "6px 8px", maxWidth: 200 }}
              >
                <option value="">Elegí un lote…</option>
                {lotes.map((l) => <option key={l.id} value={l.id}>{l.name}{l.cultivo ? ` · ${l.cultivo}` : ""}</option>)}
              </select>
            </div>
          )}
        </div>
        {onBuscar && (
          <BuscadorLugar
            onElegir={(p) => { onBuscar(p); if (delimitando) onReArmar?.(); }}
            placeholder="Buscar lugar en el mapa…"
            width={250}
          />
        )}
      </div>
      <div className="mc-mapwrap" style={{ height: 640, position: "relative" }}>
        <MapaActivo
          lotes={lotesGeo}
          selectedId={selected?.id ?? null}
          layer={layer}
          onSelect={(id: string) => onSelect(lotes.find((l) => l.id === id) || null)}
          onDrawn={onDrawn}
          armarDibujo={armarDibujo}
          onDibujoIniciado={onDibujoIniciado}
          volarA={volarA}
          establecimientos={establecimientosGeo}
        />

        {delimitandoNombre && (
          <div className="mc-glass" style={{ position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 561, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: "var(--mc-ink)", maxWidth: "90%" }}>
            <Icon name="pen" size={14} style={{ color: "var(--mc-green-700)", flexShrink: 0 }} />
            Delimitando <b style={{ margin: "0 2px" }}>{delimitandoNombre}</b> · buscá la ubicación y dibujá el contorno (doble click para cerrar)
          </div>
        )}

        {!online && (
          <div className="mc-glass" style={{ position: "absolute", top: 14, left: 14, zIndex: 560, display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "var(--mc-ink)" }}>
            <Icon name="alert" size={13} style={{ color: "var(--mc-amber)" }} />
            Sin conexión · mostrando mapa en caché
          </div>
        )}


        {selected && (
          <LoteOverlay
            lote={selected}
            vista={vista}
            onClose={() => onSelect(null)}
            onNota={() => onNota(selected)}
            onEditar={() => onEditar(selected)}
            onTarea={() => onTarea(selected)}
            onFicha={() => setFichaOpen(true)}
          />
        )}

        {/* Drawer: ficha técnica completa del lote */}
        {selected && fichaOpen && (
          <div style={{ position: "absolute", inset: 0, zIndex: 800, display: "flex", justifyContent: "flex-end", pointerEvents: "auto" }}>
            <div onClick={() => setFichaOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(15,22,18,0.32)", backdropFilter: "blur(1.5px)" }} />
            <div className="mc-drawer-in" style={{ position: "relative", width: 420, maxWidth: "92%", height: "100%", overflowY: "auto", background: "var(--mc-surface)", boxShadow: "-12px 0 40px rgba(0,0,0,0.25)" }}>
              <LoteFichaTecnica
                lote={selected}
                onClose={() => setFichaOpen(false)}
                onNota={() => { setFichaOpen(false); onNota(selected); }}
                onEditar={() => { setFichaOpen(false); onEditar(selected); }}
                onTarea={() => { setFichaOpen(false); onTarea(selected); }}
              />
            </div>
          </div>
        )}
        {legend.length > 0 && !selected && (
          <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 500, background: "rgba(255,255,255,0.95)", padding: "10px 14px", borderRadius: 10, fontSize: 12, display: "flex", gap: 14, flexWrap: "wrap", boxShadow: "var(--sh-md)" }}>
            {legend.map((l) => (
              <div key={l.label} className="row gap-4">
                <span style={{ width: 12, height: 12, background: l.color, borderRadius: 3 }}></span>
                {l.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== FICHA TÉCNICA (Figma LoteFichaTecnica) ========== */
type HistItem = { fechaMs: number; fecha: string; tipo: string; detail: string };

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
  const [cargando, setCargando] = useState(true);
  const [historial, setHistorial] = useState<HistItem[]>([]);
  const [laboresProg, setLaboresProg] = useState<HistItem[]>([]);
  const [suelo, setSuelo] = useState<{ n: number | null; p: number | null; k: number | null; ph: number | null; mo: number | null; fecha: string } | null>(null);
  const [lluvia, setLluvia] = useState<{ dias: { d: string; mm: number }[]; total: number } | null>(null);
  const [alerta, setAlerta] = useState<{ plaga: string; severidad: string; fecha: string } | null>(null);
  const [notas, setNotas] = useState<{ texto: string; autor: string; fecha: string }[]>([]);
  const [timeline, setTimeline] = useState<{ fecha: string; categoria: string; titulo: string; detalle: string; icono: string; color: string }[] | null>(null);
  const comentario = notas[0] || lote.comentarios[0];

  useEffect(() => {
    const dbId = lote.dbId;
    if (!dbId) { setCargando(false); return; }
    let cancel = false;
    const fmt = (iso?: string) => (iso ? fechaCorta(new Date(iso)) : "—");

    // Historia completa del lote (timeline unificado)
    setTimeline(null);
    fetch(`/api/lotes/${dbId}/timeline`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (!cancel && Array.isArray(d?.eventos)) setTimeline(d.eventos); }).catch(() => {});

    Promise.all([
      fetch(`/api/lotes/${dbId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/labores").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/deteccion-enfermedades").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      lote.geojson ? fetch(`/api/clima?lat=${centroLote(lote).lat}&lon=${centroLote(lote).lng}`).then((r) => (r.ok ? r.json() : null)).catch(() => null) : Promise.resolve(null),
      fetch(`/api/marcadores-geo?loteId=${dbId}`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([detalle, labores, alertas, clima, marcadores]) => {
      if (cancel) return;

      // ----- Notas / comentarios reales (marcadores georreferenciados) -----
      const obs = (Array.isArray(marcadores) ? marcadores : []);
      setNotas(obs.map((m: any) => ({ texto: m.descripcion || m.titulo, autor: m.responsable || "Vos", fecha: fmt(m.fecha) })));

      // ----- Historial (eventos pasados, real) -----
      const hist: HistItem[] = [];
      (detalle?.siembras ?? []).forEach((s: any) => hist.push({ fechaMs: new Date(s.fechaSiembra).getTime(), fecha: fmt(s.fechaSiembra), tipo: "Siembra", detail: `${s.cultivo}${s.variedad ? ` · ${s.variedad}` : ""} · ${Math.round(s.hectareas)} ha` }));
      (detalle?.cosechas ?? []).forEach((c: any) => hist.push({ fechaMs: new Date(c.fechaCosecha).getTime(), fecha: fmt(c.fechaCosecha), tipo: "Cosecha", detail: `${Math.round(c.rendimiento)} kg/ha${c.calidad ? ` · ${c.calidad}` : ""}` }));
      (detalle?.analisisSuelo ?? []).forEach((a: any) => hist.push({ fechaMs: new Date(a.fechaAnalisis).getTime(), fecha: fmt(a.fechaAnalisis), tipo: "Análisis de suelo", detail: `pH ${a.pH ?? "—"}${a.materiaOrganica != null ? ` · MO ${a.materiaOrganica}%` : ""}` }));
      const laboresLote = (Array.isArray(labores) ? labores : []).filter((l: any) => l.loteId === dbId);
      laboresLote.filter((l: any) => l.estado === "Completada").forEach((l: any) => hist.push({ fechaMs: new Date(l.fecha).getTime(), fecha: fmt(l.fecha), tipo: l.tipo || "Labor", detail: l.descripcion || l.observaciones || "—" }));
      hist.sort((a, b) => b.fechaMs - a.fechaMs);
      setHistorial(hist);

      // ----- Labores programadas -----
      const prog = laboresLote
        .filter((l: any) => l.estado !== "Completada")
        .map((l: any) => ({ fechaMs: new Date(l.fecha).getTime(), fecha: fmt(l.fecha), tipo: l.tipo || "Labor", detail: `${l.estado || "Programada"}${l.descripcion ? ` · ${l.descripcion}` : ""}` }))
        .sort((a: HistItem, b: HistItem) => a.fechaMs - b.fechaMs);
      setLaboresProg(prog);

      // ----- Suelo (último análisis) -----
      const ult = (detalle?.analisisSuelo ?? [])[0];
      if (ult) setSuelo({ n: ult.nitrogeno ?? null, p: ult.fosforo ?? null, k: ult.potasio ?? null, ph: ult.pH ?? null, mo: ult.materiaOrganica ?? null, fecha: fmt(ult.fechaAnalisis) });

      // ----- Alerta sanitaria real del lote -----
      const al = (Array.isArray(alertas) ? alertas : []).find((a: any) => a.loteId === dbId && a.estado !== "Resuelta");
      if (al) setAlerta({ plaga: al.plaga, severidad: al.severidad, fecha: fmt(al.fechaDeteccion) });

      // ----- Clima local 7 días (lluvia real) -----
      if (clima?.dias?.length) {
        const dias = clima.dias.slice(0, 7).map((d: any) => ({ d: (d.nombre || "").slice(0, 1).toUpperCase(), mm: Math.round(d.mm || 0) }));
        setLluvia({ dias, total: dias.reduce((s: number, x: any) => s + x.mm, 0) });
      }
      setCargando(false);
    });
    return () => { cancel = true; };
  }, [lote.dbId]);

  const maxLl = lluvia ? Math.max(1, ...lluvia.dias.map((d) => d.mm)) : 1;

  return (
    <div className="mc-card" style={{ padding: 16, overflow: "hidden", display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
      <button onClick={onClose} aria-label="Cerrar ficha" className="mc-icon-btn" style={{ position: "absolute", top: 10, right: 10, border: "none" }}>
        <Icon name="x" size={14} />
      </button>
      <div>
        <div className="mc-card__eyebrow" style={{ fontSize: 12 }}>Ficha Técnica del Lote</div>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--mc-ink)", marginTop: 8 }}>
          {lote.name.toUpperCase()}
        </div>
        <div className="row gap-8 mt-8 text-xs text-muted" style={{ alignItems: "center" }}>
          <span>{lote.ha} Has</span>
          <span>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="sprout" size={13} /> {lote.cultivo || "Sin cultivo"} {lote.variety || ""}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexShrink: 0 }}>
            <span className={`mc-badge mc-badge--${lote.sano ? "green" : "orange"}`}>
              {lote.sano ? <Icon name="check" size={11} /> : <Icon name="alert" size={11} />} {lote.sano ? "Saludable" : "Atención"}
            </span>
          </div>
        </div>
      </div>

      <div className="row gap-2" style={{ borderBottom: "1px solid var(--mc-line)", padding: 0, overflowX: "auto", flexWrap: "nowrap" }}>
        {["Resumen", "Historia", "Suelo", "Labores", "Prescripción"].map((t) => (
          <button
            key={t}
            onClick={() => setInnerTab(t)}
            style={{
              padding: "8px 9px", border: "none", background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
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
            <FichaChip icon="leaf" label="NDVI" value={lote.ndvi > 0 ? lote.ndvi.toFixed(2) : "—"} arrow="up" />
            <FichaChip icon="droplet" label="Agua Útil" value={lote.aguaUtil > 0 ? `${lote.aguaUtil}%` : "—"} arrow="droplet" />
            <FichaChip icon="sprout" label="Estadio" value={lote.estadio && lote.estadio !== "—" ? lote.estadio : "—"} small />
          </div>

          {lluvia ? (
            <div style={{ padding: 12, border: "1px solid var(--mc-line)", borderRadius: 10 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>Clima local (7 días)</div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--mc-ink)", marginTop: 2 }}>{lluvia.total}mm</div>
                  <div className="text-xs text-muted">Lluvia pronosticada</div>
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 56 }}>
                  {lluvia.dias.map((v, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ width: 10, height: Math.max(2, (v.mm / maxLl) * 50), background: "var(--mc-blue)", borderRadius: 2 }}></div>
                      <div style={{ fontSize: 9, color: "var(--mc-text-3)" }}>{v.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : !cargando && (
            <div className="text-xs text-muted" style={{ padding: "8px 2px" }}>Dibujá el lote en el mapa para ver el clima local.</div>
          )}

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

          {alerta && (
            <div style={{ padding: "10px 12px", background: "var(--mc-red-bg)", border: "1px solid var(--mc-red)", borderRadius: 10 }}>
              <div className="row gap-8">
                <Icon name="alert" size={14} style={{ color: "var(--mc-red)" }} />
                <div className="font-semi text-sm" style={{ color: "var(--mc-red)" }}>{alerta.plaga} · {alerta.severidad}</div>
                <span className="text-xs text-muted" style={{ marginLeft: "auto" }}>{alerta.fecha}</span>
              </div>
            </div>
          )}
        </>
      )}

      {innerTab === "Historia" && (
        <div>
          {timeline === null ? <div className="text-xs text-muted">Cargando la historia del lote…</div>
            : timeline.length === 0 ? <FichaVacio texto="Sin historia todavía. Siembras, cosechas, labores, lluvias, riegos, análisis, detecciones y notas aparecen acá en orden cronológico." />
            : <LoteTimeline eventos={timeline} />}
        </div>
      )}

      {innerTab === "Suelo" && (
        <div className="col gap-8">
          {cargando ? <div className="text-xs text-muted">Cargando…</div>
            : !suelo ? <FichaVacio texto="Sin análisis de suelo. Cargá uno en Cultivos → Análisis de Suelo." />
            : (
              <>
                <div className="text-xs text-muted">Último análisis · {suelo.fecha}</div>
                <SoilBar label="Nitrógeno (N) ppm" value={suelo.n != null ? Math.min(100, Math.round(suelo.n)) : 0} color="var(--mc-amber)" />
                <SoilBar label="Fósforo (P) ppm" value={suelo.p != null ? Math.min(100, Math.round(suelo.p * 2.5)) : 0} color="var(--mc-red)" />
                <SoilBar label="Potasio (K) ppm" value={suelo.k != null ? Math.min(100, Math.round(suelo.k / 3)) : 0} color="var(--mc-green-500)" />
                <div className="row gap-8 mt-8" style={{ fontSize: 13 }}>
                  <div style={{ flex: 1, padding: 8, background: "var(--mc-surface-2)", borderRadius: 8 }}>
                    <div className="text-xs text-muted">pH</div>
                    <div className="font-semi">{suelo.ph ?? "—"}</div>
                  </div>
                  <div style={{ flex: 1, padding: 8, background: "var(--mc-surface-2)", borderRadius: 8 }}>
                    <div className="text-xs text-muted">MO</div>
                    <div className="font-semi">{suelo.mo != null ? `${suelo.mo}%` : "—"}</div>
                  </div>
                </div>
              </>
            )}
        </div>
      )}

      {innerTab === "Labores" && (
        <div className="col gap-8">
          {cargando ? <div className="text-xs text-muted">Cargando…</div>
            : laboresProg.length === 0 ? <FichaVacio texto="Sin labores programadas. Creá una con “Nueva Tarea”." />
            : laboresProg.map((h, i) => <HistRow key={i} fecha={h.fecha} tipo={h.tipo} detail={h.detail} />)}
        </div>
      )}

      {innerTab === "Prescripción" && (
        lote.dbId && lote.geojson ? <VRTPanel loteId={lote.dbId} loteName={lote.name} />
          : <FichaVacio texto="Dibujá el lote en el mapa para generar un mapa de prescripción variable." />
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

type Prescripcion = {
  producto: string; dosisBase: number; estrategia: string; fuente: string; areaHa: number;
  resumen: { celdas: number; prodTotal: number; prodUniforme: number; ahorroPct: number; zonas: { zona: string; dosis: number; ha: number; color: string }[] };
  geojson: { type: "FeatureCollection"; features: { geometry: { type: "Polygon"; coordinates: number[][][] }; properties: { ndvi: number; zona: string; dosis: number; color: string } }[] };
};

function VRTPanel({ loteId, loteName }: { loteId: string; loteName: string }) {
  const [producto, setProducto] = useState("Urea");
  const [dosisBase, setDosisBase] = useState("120");
  const [estrategia, setEstrategia] = useState<"compensar" | "potenciar">("compensar");
  const [res, setRes] = useState<Prescripcion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generar = () => {
    setCargando(true); setError(null); setRes(null);
    fetch(`/api/lotes/${loteId}/prescripcion`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producto, dosisBase: Number(dosisBase), estrategia }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setRes(d); })
      .catch(() => setError("No se pudo generar la prescripción"))
      .finally(() => setCargando(false));
  };

  const descargar = () => {
    if (!res) return;
    const blob = new Blob([JSON.stringify(res.geojson, null, 2)], { type: "application/geo+json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `prescripcion-${loteName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.geojson`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  // SVG del mapa zonificado
  const Mapa = () => {
    if (!res?.geojson.features.length) return null;
    const all = res.geojson.features.flatMap((f) => f.geometry.coordinates[0]);
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const W = 360, H = 220, pad = 8;
    const sc = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1));
    const ox = (W - (maxX - minX) * sc) / 2, oy = (H - (maxY - minY) * sc) / 2;
    const proj = (p: number[]) => `${(ox + (p[0] - minX) * sc).toFixed(1)},${(oy + (maxY - p[1]) * sc).toFixed(1)}`;
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ borderRadius: 10, background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)" }}>
        {res.geojson.features.map((f, i) => (
          <polygon key={i} points={f.geometry.coordinates[0].map(proj).join(" ")} fill={f.properties.color} fillOpacity={0.78} stroke="#fff" strokeWidth={0.7}>
            <title>{f.properties.zona} · NDVI {f.properties.ndvi} · {f.properties.dosis} kg/ha</title>
          </polygon>
        ))}
      </svg>
    );
  };

  return (
    <div className="col gap-12">
      <div className="text-xs text-muted">Zonifica el lote por vigor (NDVI) y asigna dosis variable por zona. Descargá el mapa para la maquinaria.</div>
      <div className="grid g-cols-2 gap-8">
        <div><div className="mc-label" style={{ marginBottom: 4 }}>Producto</div><input className="mc-input" value={producto} onChange={(e) => setProducto(e.target.value)} /></div>
        <div><div className="mc-label" style={{ marginBottom: 4 }}>Dosis base (kg/ha)</div><input className="mc-input" type="number" value={dosisBase} onChange={(e) => setDosisBase(e.target.value)} /></div>
      </div>
      <div>
        <div className="mc-label" style={{ marginBottom: 4 }}>Estrategia</div>
        <div className="mc-seg">
          <button className={estrategia === "compensar" ? "is-on" : ""} onClick={() => setEstrategia("compensar")}>Compensar (más donde rinde poco)</button>
          <button className={estrategia === "potenciar" ? "is-on" : ""} onClick={() => setEstrategia("potenciar")}>Potenciar (más donde rinde más)</button>
        </div>
      </div>
      <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={generar} disabled={cargando}>
        <Icon name="map" size={13} />{cargando ? "Generando zonas…" : "Generar mapa de prescripción"}
      </button>
      {error && <div className="text-xs" style={{ color: "var(--mc-red)" }}>{error}</div>}
      {res && (
        <div className="col gap-10">
          <Mapa />
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span className="text-xs text-muted">{res.resumen.celdas} zonas · fuente {res.fuente}</span>
            {res.resumen.ahorroPct !== 0 && (
              <span className="mc-badge mc-badge--green" style={{ fontSize: 10.5 }}>{res.resumen.ahorroPct > 0 ? `−${res.resumen.ahorroPct}% insumo` : `+${-res.resumen.ahorroPct}% insumo`} vs dosis fija</span>
            )}
          </div>
          <div className="col gap-6">
            {res.resumen.zonas.map((z) => (
              <div key={z.zona} className="row gap-8" style={{ alignItems: "center", fontSize: 12.5 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: z.color }} />
                <span className="font-semi" style={{ color: "var(--mc-ink)" }}>Vigor {z.zona}</span>
                <span className="text-muted">{z.dosis} kg/ha · {z.ha} ha</span>
              </div>
            ))}
          </div>
          <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={descargar}><Icon name="download" size={13} />Descargar GeoJSON (para maquinaria)</button>
        </div>
      )}
    </div>
  );
}

function LoteTimeline({ eventos }: { eventos: { fecha: string; categoria: string; titulo: string; detalle: string; icono: string; color: string }[] }) {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "2-digit" });
  return (
    <div style={{ position: "relative", paddingLeft: 6 }}>
      {/* Rail vertical */}
      <div style={{ position: "absolute", left: 16, top: 6, bottom: 6, width: 2, background: "var(--mc-line)" }} />
      <div className="col gap-2">
        {eventos.map((e, i) => (
          <div key={i} className="row" style={{ gap: 12, alignItems: "flex-start", padding: "8px 0", position: "relative" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${e.color}1a`, color: e.color, display: "grid", placeItems: "center", flexShrink: 0, zIndex: 1, border: "2px solid var(--mc-surface)" }}>
              <Icon name={e.icono} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
              <div className="row gap-6" style={{ alignItems: "center", flexWrap: "wrap" }}>
                <span className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{e.titulo}</span>
                <span className="mc-badge mc-badge--neutral" style={{ fontSize: 9.5 }}>{e.categoria}</span>
              </div>
              {e.detalle && <div className="text-xs text-muted" style={{ marginTop: 2 }}>{e.detalle}</div>}
              <div className="text-xs" style={{ color: "var(--mc-text-3)", marginTop: 2, fontFamily: "var(--ff-mono)" }}>{fmt(e.fecha)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FichaVacio({ texto }: { texto: string }) {
  return (
    <div style={{ padding: "20px 12px", textAlign: "center", color: "var(--mc-text-3)", fontSize: 12.5, lineHeight: 1.5 }}>
      {texto}
    </div>
  );
}

function centroLote(lote: LoteUI): { lat: number; lng: number } {
  const ring = lote.geojson?.coordinates?.[0];
  if (!ring || !ring.length) return { lat: -32.8, lng: -56.0 };
  const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const lng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  return { lat, lng };
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
/* ========== VISTA LISTA (prolija, con datos reales) ========== */
const REF_RINDE: Record<string, number> = { Soja: 2800, Maíz: 7000, Trigo: 3500, Cebada: 3800, Girasol: 1800, Sorgo: 5000, Alfalfa: 12000, Avena: 3000, Trébol: 9000 };
function ndviColorList(v: number) {
  if (!v || v <= 0) return "var(--mc-text-3)";
  if (v >= 0.7) return "var(--mc-green-700)";
  if (v >= 0.55) return "#8ea65a";
  if (v >= 0.45) return "#d9a538";
  return "#c08a22";
}
function proyeccionTn(l: LoteUI): number | null {
  if (!l.cultivo) return null;
  const base = REF_RINDE[l.cultivo] || 3000;
  const f = l.ndvi > 0 ? Math.min(1.25, Math.max(0.7, 1 + (l.ndvi - 0.7) * 0.8)) : 1;
  return Math.round((base * f) / 100) / 10; // t/ha (1 decimal)
}

/** Croquis: dibuja la forma real del lote (su polígono) normalizado. */
function LoteCroquis({ lote }: { lote: LoteUI }) {
  const ring = lote.geojson?.coordinates?.[0];
  const color = lote.cultivoColor || ndviColorList(lote.ndvi);
  if (!ring || ring.length < 3) {
    return (
      <div className="row gap-6" style={{ alignItems: "center", color: "var(--mc-text-3)", fontSize: 11.5 }}>
        <span style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px dashed var(--mc-line)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="map" size={13} /></span>
        Sin geometría
      </div>
    );
  }
  const xs = ring.map((p) => p[0]); const ys = ring.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX || 1, h = maxY - minY || 1;
  const W = 116, H = 56, pad = 7;
  const sc = Math.min((W - 2 * pad) / w, (H - 2 * pad) / h);
  const ox = (W - w * sc) / 2, oy = (H - h * sc) / 2;
  const pts = ring.map((p) => `${(ox + (p[0] - minX) * sc).toFixed(1)},${(oy + (maxY - p[1]) * sc).toFixed(1)}`).join(" ");
  const cLat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const cLng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const perim = lote.perimetro ? (lote.perimetro >= 1000 ? `${(lote.perimetro / 1000).toFixed(1)} km` : `${Math.round(lote.perimetro)} m`) : null;
  return (
    <div className="row gap-10" style={{ alignItems: "center" }}>
      <svg width={W} height={H} style={{ flexShrink: 0, borderRadius: 8, background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)" }}>
        <polygon points={pts} fill={`${color}33`} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      </svg>
      <div style={{ minWidth: 0, fontSize: 11.5 }}>
        <div className="row gap-4" style={{ alignItems: "center", color: "var(--mc-text-2)", fontWeight: 600 }}><Icon name="map" size={11} />{cLat.toFixed(4)}°, {cLng.toFixed(4)}°</div>
        {perim && <div className="row gap-4 mt-2" style={{ alignItems: "center", color: "var(--mc-text-3)" }}><Icon name="activity" size={11} />Perímetro {perim}</div>}
        <div className="row gap-4 mt-2" style={{ alignItems: "center" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: lote.vacio ? "#b8b2a3" : "#7ec47f" }} />
          <span style={{ color: "var(--mc-text-3)" }}>{lote.vacio ? "Sin sembrar" : "Activo"}</span>
        </div>
      </div>
    </div>
  );
}

type EcoLote = { margenPorHa: number; costoPorHa: number; porcentajeMargen: number; fuente: string };
type AlertaLote = { plaga: string; severidad: string };

function LotesListaDetallada({
  lotes, onVer, onTarea,
}: {
  lotes: LoteUI[];
  onVer: (l: LoteUI) => void;
  onTarea: (l: LoteUI) => void;
}) {
  const { establecimientos } = useLoteScope();
  const [economia, setEconomia] = useState<Record<string, EcoLote>>({});
  const [alertas, setAlertas] = useState<Record<string, AlertaLote>>({});

  useEffect(() => {
    fetch("/api/economia/lotes").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d?.lotes) return;
      const m: Record<string, EcoLote> = {};
      d.lotes.forEach((l: any) => { m[l.loteId] = { margenPorHa: l.margenPorHa, costoPorHa: l.costoPorHa, porcentajeMargen: l.porcentajeMargen, fuente: l.fuente }; });
      setEconomia(m);
    }).catch(() => {});
    fetch("/api/deteccion-enfermedades").then((r) => (r.ok ? r.json() : [])).then((d) => {
      if (!Array.isArray(d)) return;
      const m: Record<string, AlertaLote> = {};
      d.forEach((a: any) => { if (a.loteId && a.estado !== "Resuelta" && !m[a.loteId]) m[a.loteId] = { plaga: a.plaga, severidad: a.severidad }; });
      setAlertas(m);
    }).catch(() => {});
  }, []);

  const nombreEst = (id?: string | null) => (id ? establecimientos.find((e) => e.id === id)?.nombre : null);

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "auto" }}>
      <div className="mc-lotes-list">
        <div className="mc-lotes-list__head">
          <div>Identidad</div>
          <div>Cultivo</div>
          <div>Finanzas</div>
          <div>Salud</div>
          <div>Monitoreo</div>
          <div>Proyección</div>
          <div>Croquis</div>
          <div>Acciones</div>
        </div>
        {lotes.length === 0 && (
          <div style={{ padding: 28, textAlign: "center", color: "var(--mc-text-3)", fontSize: 13 }}>
            Sin lotes. Creá uno con “Nuevo lote” o dibujándolo en el mapa.
          </div>
        )}
        {lotes.map((l, i) => {
          const eco = l.dbId ? economia[l.dbId] : undefined;
          const conEco = eco && eco.fuente !== "sin-datos";
          const alerta = l.dbId ? alertas[l.dbId] : undefined;
          const proy = proyeccionTn(l);
          const est = nombreEst(l.establecimientoId);
          const sevColor = alerta ? (alerta.severidad === "Alta" || alerta.severidad === "Crítica" ? "var(--mc-red)" : alerta.severidad === "Media" ? "var(--mc-amber)" : "var(--mc-green-700)") : "var(--mc-green-700)";
          return (
            <div key={l.dbId || l.id || i} className="mc-lotes-list__row" onClick={() => onVer(l)} style={{ cursor: "pointer" }}>
              {/* Identidad */}
              <div className="row gap-10" style={{ alignItems: "center" }}>
                <CropImg cultivo={l.cultivo} style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
                  <div className="text-xs text-muted">Lote {i + 1} · {Math.round(l.ha)} ha</div>
                  {est && <div className="text-xs" style={{ color: "var(--mc-green-700)", display: "flex", alignItems: "center", gap: 3 }}><Icon name="building" size={10} />{est}</div>}
                </div>
              </div>
              {/* Cultivo */}
              <div>
                <div className="row gap-4" style={{ alignItems: "center" }}>
                  <Icon name="sprout" size={15} style={{ color: l.cultivo ? "var(--mc-green-700)" : "var(--mc-text-3)" }} />
                  <span className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{l.cultivo || "Sin cultivo"}</span>
                </div>
                <span className="mc-badge mc-badge--neutral mt-4" style={{ fontSize: 10 }}>{l.estadio && l.estadio !== "—" ? l.estadio : "Sin estadio"}</span>
              </div>
              {/* Finanzas */}
              <div>
                {conEco ? (
                  <>
                    <div className="font-semi text-sm" style={{ color: eco!.margenPorHa >= 0 ? "var(--mc-green-700)" : "var(--mc-red)" }}>
                      {eco!.margenPorHa >= 0 ? "+" : ""}${Math.round(eco!.margenPorHa).toLocaleString("es-AR")}/ha
                    </div>
                    <div className="mc-prog" style={{ marginTop: 4 }}>
                      <div className="mc-prog__bar" style={{ width: `${Math.max(4, Math.min(100, Math.abs(eco!.porcentajeMargen)))}%`, background: eco!.margenPorHa >= 0 ? "var(--mc-green-500)" : "var(--mc-red)" }}></div>
                    </div>
                    <div className="text-xs text-muted mt-4">Costo ${Math.round(eco!.costoPorHa).toLocaleString("es-AR")}/ha</div>
                  </>
                ) : (
                  <span className="text-xs text-muted">Sin datos de costos</span>
                )}
              </div>
              {/* Salud */}
              <div>
                <div className="row gap-4" style={{ alignItems: "center", fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: ndviColorList(l.ndvi) }} />
                  <span className="font-semi" style={{ color: "var(--mc-ink)" }}>NDVI {l.ndvi > 0 ? l.ndvi.toFixed(2) : "—"}</span>
                </div>
                <div className="row gap-4 mt-4" style={{ alignItems: "center", fontSize: 12 }}>
                  <Icon name="droplet" size={11} style={{ color: "var(--mc-blue)" }} />
                  <span className="text-muted">Agua {l.aguaUtil > 0 ? `${l.aguaUtil}%` : "—"}</span>
                </div>
              </div>
              {/* Monitoreo */}
              <div>
                {alerta ? (
                  <>
                    <div className="row gap-4" style={{ alignItems: "center", fontSize: 12 }}>
                      <Icon name="bug" size={12} style={{ color: sevColor }} />
                      <span className="font-semi text-xs" style={{ color: "var(--mc-ink)" }}>{alerta.plaga}</span>
                    </div>
                    <span className="mc-badge mt-4" style={{ fontSize: 10, background: `${sevColor}1a`, color: sevColor }}><Icon name="alert" size={10} />{alerta.severidad}</span>
                  </>
                ) : (
                  <span className="mc-badge mc-badge--green" style={{ fontSize: 10 }}><Icon name="check" size={10} />Sin alertas</span>
                )}
              </div>
              {/* Proyección */}
              <div>
                {proy != null ? (
                  <>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, color: "var(--mc-ink)" }}>{proy} <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>t/ha</span></div>
                    <div className="text-xs text-muted">estimado{l.ndvi > 0 ? " · ajustado NDVI" : " · referencia"}</div>
                  </>
                ) : (
                  <span className="text-xs text-muted">Sin cultivo</span>
                )}
              </div>
              {/* Croquis */}
              <div><LoteCroquis lote={l} /></div>
              {/* Acciones */}
              <div className="col gap-4" onClick={(e) => e.stopPropagation()}>
                <button className="mc-btn mc-btn--primary mc-btn--sm" style={{ padding: "4px 10px", fontSize: 11, justifyContent: "center" }} onClick={() => onTarea(l)}>
                  <Icon name="plus" size={11} />Tarea
                </button>
                <button className="mc-btn mc-btn--ghost mc-btn--sm" style={{ padding: "4px 10px", fontSize: 11, justifyContent: "flex-start", color: "var(--mc-green-700)" }} onClick={() => onVer(l)}>
                  <Icon name="arrowRight" size={11} />Ver ficha
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
