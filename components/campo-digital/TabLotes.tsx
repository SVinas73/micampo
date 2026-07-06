"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon, KPI, useToast } from "@/components/mc";
import { useLoteScope } from "@/components/LoteScope";
import {
  mapLotesApi, fechaCorta, CULTIVO_COLORES,
  type LoteUI,
} from "./lotes-data";
import type { RxMapa } from "./MapaLibre";

// Mapa satelital con terreno 3D (MapLibre GL) — solo en cliente
// Vista Clásica: mapa satelital con relieve 3D/plano (MapLibre GL)
const Mapa3D = dynamic(() => import("./MapaLibre"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--mc-text-3)", fontSize: 13 }}>
      Cargando mapa…
    </div>
  ),
});
// Campo 3D: gemelo digital (three.js) — mismo componente que la ex-pestaña
const Campo3D = dynamic(() => import("./Campo3D"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 520, display: "grid", placeItems: "center", color: "var(--mc-text-3)", fontSize: 13 }}>
      Cargando gemelo 3D…
    </div>
  ),
});

type DibujoLote = { geojson: { type: "Polygon"; coordinates: number[][][] }; hectareas: number; centro: { lat: number; lng: number }; perimetro: number };
import {
  AgregarCampoModal, EliminarCampoModal, EliminarCampoEstModal, EditarLoteModal,
  type AgregarCampoData, type EditarLoteData,
} from "./lotes-Modales";
import { LoteOverlay, CropImg } from "./LoteOverlay";
import { cuadradoDesdeCentro, puntoEnPoligono } from "@/lib/geo";
import * as turf from "@turf/turf";
import BuscadorLugar from "./BuscadorLugar";
import { DIVISIONES_POR_PAIS } from "@/lib/divisiones-administrativas";

/** Envolvente (convex hull) de un conjunto de lotes → contorno del campo. */
function hullDeLotes(geojsons: { type: "Polygon"; coordinates: number[][][] }[]): DibujoLote | null {
  const pts = geojsons.flatMap((g) => (g?.coordinates?.[0] || []).map((p) => turf.point(p)));
  if (pts.length < 3) return null;
  try {
    let hull = turf.convex(turf.featureCollection(pts), { concavity: Infinity });
    if (!hull) return null;
    hull = (turf.buffer(hull, 0.05, { units: "kilometers" }) as typeof hull) || hull;
    const ring = (hull.geometry.coordinates as number[][][])[0];
    const c = turf.centroid(hull).geometry.coordinates as [number, number];
    const perim = turf.length(turf.lineString(ring), { units: "kilometers" }) * 1000;
    return { geojson: { type: "Polygon", coordinates: [ring] }, hectareas: Math.round((turf.area(hull) / 10000) * 100) / 100, centro: { lat: c[1], lng: c[0] }, perimetro: Math.round(perim) };
  } catch {
    return null;
  }
}

/* ========== TAB LOTES (Figma CDLotes) ========== */
export default function TabLotes() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { recargar, establecimientos, establecimientoId, setLoteId } = useLoteScope();
  // Modo "delimitar establecimiento": llega desde el card de Establecimientos.
  const delimitarId = searchParams.get("delimitar");
  const estDelimitar = delimitarId ? establecimientos.find((e) => e.id === delimitarId) || null : null;
  const [volarA, setVolarA] = useState<{ lat: number; lng: number; nonce: number } | null>(null);
  const [lotes, setLotes] = useState<LoteUI[]>([]);
  const [selected, setSelected] = useState<LoteUI | null>(null);
  // Selección de lote (desplegable "Elegí un lote…" o click en el mapa): además de
  // resaltarlo, publica el lote al scope GLOBAL para que lo lean los demás módulos.
  const seleccionarLote = useCallback((l: LoteUI | null) => {
    setSelected(l);
    setLoteId(l?.dbId || l?.id || "todos");
  }, [setLoteId]);
  const [view, setView] = useState<"mapa" | "lista">("mapa");
  // Vista por defecto: Satélite (imagen). NDVI es el raster de vigor satelital real.
  const [layer, setLayer] = useState("Satélite");
  const [showAgregar, setShowAgregar] = useState(searchParams.get("modal") === "nuevo");
  const [showEliminar, setShowEliminar] = useState(false);
  const [showEliminarCampo, setShowEliminarCampo] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroCultivo, setFiltroCultivo] = useState("Todos");
  const [editLote, setEditLote] = useState<LoteUI | null>(null);
  const [notaLote, setNotaLote] = useState<LoteUI | null>(null);
  const [comentarioGeneral, setComentarioGeneral] = useState(false);
  const [dibujado, setDibujado] = useState<DibujoLote | null>(null);
  const [drawArmed, setDrawArmed] = useState(false);
  const [modoNota, setModoNota] = useState(false);
  const [notaPunto, setNotaPunto] = useState<{ lat: number; lng: number; loteId?: string; establecimientoId?: string; nombre: string } | null>(null);
  const [notasNonce, setNotasNonce] = useState(0); // se incrementa al guardar una nota para refrescar el mapa
  // Modo "crear establecimiento dibujando lotes"
  const [modoCampoLotes, setModoCampoLotes] = useState(false);
  const [lotesNuevos, setLotesNuevos] = useState<{ id: string; geojson: { type: "Polygon"; coordinates: number[][][] } }[]>([]);
  const [showNuevoEst, setShowNuevoEst] = useState(false);
  const hullNuevo = useMemo(() => (modoCampoLotes && lotesNuevos.length >= 1 ? hullDeLotes(lotesNuevos.map((l) => l.geojson)) : null), [modoCampoLotes, lotesNuevos]);

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


  // Humedad de suelo real (Open-Meteo). Se carga una vez cuando hay lotes con geometría
  // (no solo al activar la capa) para que "Agua útil" muestre un valor real en toda la UI.
  const humedadCargadaRef = useRef(false);
  useEffect(() => {
    if (humedadCargadaRef.current) return;
    const conGeo = lotes.filter((l) => l.geojson?.coordinates?.[0]?.length && l.dbId);
    if (conGeo.length === 0) return;
    humedadCargadaRef.current = true;
    fetch("/api/lotes/humedad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lotes: conGeo.map((l) => ({ id: l.dbId, geojson: l.geojson })) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const resultados = d?.resultados as Record<string, { humedad: number }> | undefined;
        if (!resultados) return;
        // Agua útil (%) = fracción de agua disponible entre punto de marchitez (~0.10) y
        // capacidad de campo (~0.35) del contenido volumétrico de agua (m³/m³).
        const aguaUtilDe = (h: number) => Math.max(0, Math.min(100, Math.round(((h - 0.1) / 0.25) * 100)));
        setLotes((prev) => prev.map((l) => {
          const m = l.dbId ? resultados[l.dbId] : undefined;
          return m && typeof m.humedad === "number" ? { ...l, humedad: m.humedad, aguaUtil: aguaUtilDe(m.humedad) } : l;
        }));
      })
      .catch(() => {});
  }, [lotes]);

  // El submódulo se rige por el ESTABLECIMIENTO del sidebar (sin filtro local propio).
  const localEstId = establecimientoId;
  const localEst = useMemo(
    () => (localEstId === "todos" ? null : establecimientos.find((e) => e.id === localEstId) || null),
    [establecimientos, localEstId]
  );

  // Lotes visibles: todos los del establecimiento activo. El lote elegido se
  // resalta en el mapa y se publica al scope global (para el resto de los módulos),
  // sin ocultar los demás lotes de la vista.
  const enScope = useMemo(
    () => (localEstId === "todos" ? lotes : lotes.filter((l) => (l.establecimientoId || "") === localEstId)),
    [lotes, localEstId]
  );

  const visibles = useMemo(
    () => enScope.filter((l) => filtroCultivo === "Todos" || l.cultivo === filtroCultivo),
    [enScope, filtroCultivo]
  );

  const totalHa = enScope.reduce((s, l) => s + l.ha, 0);
  const sembradas = enScope.filter((l) => !l.vacio).reduce((s, l) => s + l.ha, 0);
  const sinAsignar = enScope.filter((l) => l.vacio);

  // Marcadores reales (notas/puntos georreferenciados) del alcance activo.
  const [marcadores, setMarcadores] = useState<{ loteId?: string | null; establecimientoId?: string | null }[]>([]);
  useEffect(() => {
    fetch("/api/marcadores-geo").then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setMarcadores(d); }).catch(() => {});
  }, [lotes.length, notasNonce]);
  const marcadoresEnScope = useMemo(() => {
    if (localEstId === "todos") return marcadores.length;
    const ids = new Set(enScope.map((l) => l.dbId || l.id));
    return marcadores.filter((m) => (m.loteId && ids.has(m.loteId)) || m.establecimientoId === localEstId).length;
  }, [marcadores, enScope, localEstId]);

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
          establecimientoId: data.establecimientoId ?? localEst?.id ?? null,
        }),
      });
      let dbId: string | undefined;
      if (res.ok) dbId = (await res.json()).id;
      setLotes((prev) => [
        ...prev,
        {
          id: dbId || `L-${prev.length + 1}`, dbId, name: data.nombre, campo: data.nombre, ha: data.hectareas,
          cultivo: data.cultivo, estadio: "—", ndvi: 0, aguaUtil: 0, sano: true, vacio: !data.cultivo, comentarios: [],
          geojson: geom?.geojson ?? null, cultivoColor: data.cultivo ? (CULTIVO_COLORES[data.cultivo] || "#5e7733") : null,
          establecimientoId: data.establecimientoId ?? localEst?.id ?? null,
        },
      ]);
      setDibujado(null);
      setShowAgregar(false);
      // Modo "crear campo con lotes": acumula el lote y rearma el dibujo para el siguiente.
      if (modoCampoLotes && dbId && geom?.geojson) {
        setLotesNuevos((prev) => [...prev, { id: dbId!, geojson: geom.geojson }]);
        toast.show(`Lote "${data.nombre}" agregado · dibujá el próximo o tocá Terminar`);
        setDrawArmed(true);
      } else {
        toast.show(geom ? `Lote "${data.nombre}" agregado al mapa` : `Lote "${data.nombre}" creado`);
      }
      recargar(); // refresca el selector global de lotes
    } catch {
      toast.show("No se pudo crear el lote", "err");
    }
  };

  // Inicia el modo "crear establecimiento dibujando lotes".
  const iniciarCampoConLotes = () => {
    setSelected(null);
    setModoNota(false);
    setLotesNuevos([]);
    setModoCampoLotes(true);
    setView("mapa");
    setDrawArmed(true);
    toast.show("Dibujá los lotes del nuevo campo. Cuando termines, tocá “Terminar”.");
  };

  // Crea el establecimiento con los lotes dibujados y su contorno (hull).
  const terminarCampoConLotes = async (datos: { nombre: string; direccion: string; ciudad: string; provincia: string; pais: string; cuit: string }) => {
    const hull = hullDeLotes(lotesNuevos.map((l) => l.geojson));
    try {
      const res = await fetch("/api/establecimientos", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
      });
      if (!res.ok) throw new Error();
      const est = await res.json();
      // Asignar los lotes al nuevo establecimiento
      await Promise.all(lotesNuevos.map((l) => fetch(`/api/lotes/${l.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ establecimientoId: est.id }),
      }).catch(() => null)));
      // Guardar el contorno del establecimiento (envolvente de sus lotes)
      if (hull) {
        await fetch(`/api/establecimientos/${est.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordenadas: hull.geojson, centroLatitud: hull.centro.lat, centroLongitud: hull.centro.lng, perimetro: hull.perimetro, hectareasTotales: hull.hectareas }),
        }).catch(() => null);
      }
      toast.show(`Campo "${datos.nombre}" creado con ${lotesNuevos.length} lote(s)`);
      setShowNuevoEst(false);
      setModoCampoLotes(false);
      setLotesNuevos([]);
      setDrawArmed(false);
      recargar();
    } catch {
      toast.show("No se pudo crear el campo", "err");
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

  // Lotes del campo que se está delimitando, con polígono dibujado.
  const lotesGeoDelCampo = useMemo(
    () => (delimitarId ? lotes.filter((l) => l.establecimientoId === delimitarId && l.geojson?.coordinates?.[0]?.length) : []),
    [delimitarId, lotes]
  );

  // Delimita el campo AUTOMÁTICAMENTE a partir del contorno de sus lotes dibujados.
  const delimitarConMisLotes = () => {
    const hull = hullDeLotes(lotesGeoDelCampo.map((l) => l.geojson!));
    if (!hull) { toast.show("Este campo todavía no tiene lotes dibujados para calcular el contorno", "err"); return; }
    guardarLimite(hull);
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
    } else {
      // Aún sin delimitar: geocodificar la ubicación cargada (ciudad/provincia/país)
      // y volar directo al lugar, para que el usuario solo tenga que dibujar.
      const q = [estDelimitar.ciudad, estDelimitar.provincia, estDelimitar.pais].filter(Boolean).join(", ");
      if (q.length >= 3) {
        fetch(`/api/geo/search?q=${encodeURIComponent(q)}`)
          .then((r) => (r.ok ? r.json() : { resultados: [] }))
          .then((d) => {
            const r0 = d.resultados?.[0];
            if (r0) setVolarA({ lat: Number(r0.lat), lng: Number(r0.lon), nonce: Date.now() });
          })
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delimitarId, estDelimitar?.id]);

  // Al filtrar por un establecimiento (local), centrar el mapa en él.
  useEffect(() => {
    if (delimitarId || localEstId === "todos") return;
    // 1) centro guardado del establecimiento (si está delimitado)
    if (localEst?.centroLatitud != null && localEst?.centroLongitud != null) {
      setVolarA({ lat: localEst.centroLatitud, lng: localEst.centroLongitud, nonce: Date.now() });
      return;
    }
    // 2) sin centro guardado: volar al promedio de los lotes del campo
    const conGeo = enScope.filter((l) => l.geojson?.coordinates?.[0]?.length);
    if (conGeo.length) {
      let sLat = 0, sLng = 0, n = 0;
      conGeo.forEach((l) => l.geojson!.coordinates[0].forEach((p) => { sLng += p[0]; sLat += p[1]; n++; }));
      if (n) setVolarA({ lat: sLat / n, lng: sLng / n, nonce: Date.now() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localEstId, lotes]);

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
    toast.show(d.lotesEliminados ? `Campo "${camp?.nombre || ""}" y ${d.lotesEliminados} lote(s) eliminados` : `Campo "${camp?.nombre || ""}" eliminado`);
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

  // "Nueva Tarea" de un lote → abre el wizard "Nueva Labor" (pestaña Labores)
  // con el lote preseleccionado. Unifica la creación de labores en un solo flujo.
  const abrirNuevaLabor = (l: LoteUI) =>
    router.push(`/campo-digital?tab=Labores&nuevaLabor=${encodeURIComponent(l.dbId || "1")}`);

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

  // Modo Nota: al tocar un punto, se asigna al lote que lo contiene; si cae fuera,
  // al establecimiento (su contorno, o el activo). Después se escribe la nota.
  const onPuntoNota = (lat: number, lng: number) => {
    setModoNota(false);
    const lote = visibles.find((l) => l.geojson?.coordinates?.[0] && puntoEnPoligono(lng, lat, l.geojson.coordinates[0]));
    if (lote?.dbId) { setNotaPunto({ lat, lng, loteId: lote.dbId, nombre: lote.name }); return; }
    const est = establecimientos.find((e) => e.coordenadas?.coordinates?.[0] && puntoEnPoligono(lng, lat, e.coordenadas.coordinates[0]));
    if (est) { setNotaPunto({ lat, lng, establecimientoId: est.id, nombre: est.nombre }); return; }
    if (localEst) { setNotaPunto({ lat, lng, establecimientoId: localEst.id, nombre: localEst.nombre }); return; }
    toast.show("Marcá un punto dentro de un lote o de un establecimiento delimitado", "err");
  };

  const guardarNotaPunto = async (texto: string, prioridad: string) => {
    if (!notaPunto) return;
    const res = await fetch("/api/marcadores-geo", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loteId: notaPunto.loteId, establecimientoId: notaPunto.establecimientoId,
        latitud: notaPunto.lat, longitud: notaPunto.lng,
        // La prioridad de la nota viaja en `tipo` (Crítica / Moderada / No urgente).
        tipo: prioridad, titulo: "Nota", descripcion: texto, responsable: "Vos",
      }),
    }).catch(() => null);
    toast.show(res && res.ok ? `Nota guardada en ${notaPunto.nombre}` : "No se pudo guardar la nota", res && res.ok ? "ok" : "err");
    if (res && res.ok) setNotasNonce((n) => n + 1); // refresca notas y marcadores en el mapa
    setNotaPunto(null);
  };

  // Elimina una nota georreferenciada (funciona para nuevas y existentes).
  const eliminarNota = async (id: string) => {
    if (!confirm("¿Eliminar esta nota del mapa?")) return;
    const res = await fetch(`/api/marcadores-geo/${id}`, { method: "DELETE" }).catch(() => null);
    if (res && res.ok) {
      toast.show("Nota eliminada");
      setNotasNonce((n) => n + 1);
    } else {
      toast.show("No se pudo eliminar la nota", "err");
    }
  };

  return (
    <>
      {toast.node}
      {showAgregar && <AgregarCampoModal onClose={() => { setShowAgregar(false); setDibujado(null); }} onConfirm={crearCampo} onDibujar={() => { setShowAgregar(false); setSelected(null); setView("mapa"); setDrawArmed(true); }} defaultHectareas={dibujado?.hectareas} dibujadoEnMapa={!!dibujado} centro={dibujado?.centro} establecimientos={establecimientos} establecimientoActivoId={localEst?.id ?? null} />}
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
      {(notaLote || comentarioGeneral) && (
        <NotaModal
          lote={notaLote || selected || visibles[0]}
          onClose={() => { setNotaLote(null); setComentarioGeneral(false); }}
          onConfirm={agregarNota}
        />
      )}
      {notaPunto && (
        <NotaPuntoModal
          nombre={notaPunto.nombre}
          lat={notaPunto.lat}
          lng={notaPunto.lng}
          onClose={() => setNotaPunto(null)}
          onConfirm={guardarNotaPunto}
        />
      )}
      {showNuevoEst && (
        <NuevoEstablecimientoModal
          lotesCount={lotesNuevos.length}
          hectareas={hullNuevo?.hectareas ?? 0}
          onClose={() => setShowNuevoEst(false)}
          onConfirm={terminarCampoConLotes}
        />
      )}

      <div className="grid g-cols-5">
        <KPI label="Establecimientos" value={String(establecimientos.length)} delta={localEst ? localEst.nombre : "Todos"} trend="flat" icon="building" accent />
        <KPI label="Lotes en vista" value={String(enScope.length)} delta={localEstId === "todos" ? `${lotes.length} en total` : "Filtrado por campo"} trend="flat" icon="sprout" />
        <KPI label="Total de hectáreas" value={`${Math.round(totalHa)} Ha`} delta={`${Math.round(sembradas)} sembradas`} trend="flat" icon="activity" />
        <KPI label="Lotes sin asignar" value={String(sinAsignar.length)} delta={sinAsignar.map((l) => l.name).slice(0, 2).join(" + ") || "Ninguno"} trend="warn" icon="alert" />
        <KPI label="Marcadores" value={String(marcadoresEnScope)} delta={marcadoresEnScope ? "Notas y puntos del campo" : "Sin marcadores"} trend="flat" icon="target" />
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
          <button className="mc-btn mc-btn--red mc-btn--sm" onClick={() => setShowEliminarCampo(true)}>
            <Icon name="trash" size={13} />Eliminar campo
          </button>
          <button className="mc-btn mc-btn--red mc-btn--sm" onClick={() => setShowEliminar(true)}>
            <Icon name="trash" size={13} />Eliminar lote
          </button>
        </div>
      </div>

      {delimitarId && (
        <div className="mc-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderLeft: "3px solid var(--mc-green-600)" }}>
          <Icon name="pen" size={16} style={{ color: "var(--mc-green-700)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 13.5 }}>Delimitando “{estDelimitar?.nombre || "campo"}”</div>
            <div className="text-xs text-muted">
              {lotesGeoDelCampo.length > 0
                ? `Tiene ${lotesGeoDelCampo.length} lote(s) dibujado(s): podés generar el contorno automáticamente con ellos, o dibujarlo a mano.`
                : "Dibujá el contorno del campo en el mapa. (No hay lotes dibujados para generarlo automáticamente.)"}
            </div>
          </div>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={delimitarConMisLotes} disabled={lotesGeoDelCampo.length === 0}>
            <Icon name="map" size={13} />Delimitar con mis lotes
          </button>
        </div>
      )}

      {view === "mapa" && visibles.length > 0 && visibles.every((l) => !l.geojson?.coordinates?.[0]?.length) && (
        <div className="mc-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderLeft: "3px solid var(--mc-amber)" }}>
          <Icon name="alert" size={15} style={{ color: "var(--mc-amber)", flexShrink: 0 }} />
          <span className="text-sm" style={{ color: "var(--mc-text-2)" }}>
            Estos lotes todavía no tienen su polígono dibujado, por eso no se ven en el mapa (en la vista 3D aparecen como parcelas en grilla). Dibujá sus contornos con “Dibujar lote” para verlos acá.
          </span>
        </div>
      )}
      {view === "mapa" && (
        <LotesMapa
          lotes={visibles}
          notasNonce={notasNonce}
          selected={selected}
          onSelect={seleccionarLote}
          layer={layer}
          onLayerChange={setLayer}
          onNota={(l) => setNotaLote(l)}
          onEditar={(l) => setEditLote(l)}
          onTarea={(l) => abrirNuevaLabor(l)}
          onDrawn={(d) => { if (delimitarId) { guardarLimite(d); } else { setDibujado(d); setShowAgregar(true); } }}
          armarDibujo={drawArmed}
          onDibujoIniciado={() => setDrawArmed(false)}
          volarA={volarA}
          onBuscar={(p) => setVolarA({ lat: p.lat, lng: p.lng, nonce: Date.now() })}
          delimitandoNombre={estDelimitar?.nombre ?? null}
          delimitando={!!delimitarId}
          onReArmar={() => setDrawArmed(true)}
          modoNota={modoNota}
          onToggleNota={() => setModoNota((v) => !v)}
          onPuntoNota={onPuntoNota}
          onEliminarNota={eliminarNota}
          onCampoConLotes={iniciarCampoConLotes}
          hullPreview={hullNuevo?.geojson ?? null}
          campoConLotesCount={modoCampoLotes ? lotesNuevos.length : null}
          onTerminarCampo={() => setShowNuevoEst(true)}
          onCancelarCampo={() => { setModoCampoLotes(false); setLotesNuevos([]); setDrawArmed(false); }}
        />
      )}
      {view === "lista" && (
        <LotesListaDetallada
          lotes={visibles}
          onVer={(l) => { seleccionarLote(l); setView("mapa"); }}
          onTarea={(l) => abrirNuevaLabor(l)}
        />
      )}
    </>
  );
}

/* ========== MAPA (Figma LotesMapa) ========== */
function LotesMapa({
  lotes, selected, onSelect, layer, onLayerChange, onNota, onEditar, onTarea, onDrawn, armarDibujo, onDibujoIniciado, volarA, onBuscar, delimitandoNombre, delimitando, onReArmar, modoNota, onToggleNota, onPuntoNota, onEliminarNota, onCampoConLotes, hullPreview, campoConLotesCount, onTerminarCampo, onCancelarCampo, notasNonce,
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
  modoNota?: boolean;
  onToggleNota?: () => void;
  onPuntoNota?: (lat: number, lng: number) => void;
  onEliminarNota?: (id: string) => void;
  onCampoConLotes?: () => void;
  hullPreview?: { type: "Polygon"; coordinates: number[][][] } | null;
  campoConLotesCount?: number | null;
  onTerminarCampo?: () => void;
  onCancelarCampo?: () => void;
  notasNonce?: number;
}) {
  // Leyenda de Cultivos: los cultivos presentes en la vista, con su tonalidad real.
  const cultivosEnVista = Array.from(new Set(lotes.filter((l) => l.cultivo).map((l) => l.cultivo as string))).slice(0, 6);
  const legendByLayer: Record<string, { color: string; label: string }[]> = {
    // NDVI: la leyenda con degradado vive DENTRO del mapa (cuadro "Leyenda NDVI",
    // abajo a la derecha, en MapaLibre) — acá no se duplica.
    NDVI: [],
    Cultivos: [
      ...cultivosEnVista.map((c) => ({ color: CULTIVO_COLORES[c] || "#5e7733", label: c })),
      { color: "#f5f2ea", label: "Vacío" },
    ],
    "Satélite": [],
    Topografía: [
      { color: "#7a5230", label: "Relieve / curvas de nivel" },
      { color: "#cdbf9a", label: "Llano" },
    ],
    Relieve: [
      { color: "#8c6b3f", label: "Zona alta" },
      { color: "#d9c48a", label: "Media" },
      { color: "#a9c48a", label: "Baja / llano" },
    ],
    Humedad: [
      { color: "#08519c", label: "Muy húmedo" },
      { color: "#4292c6", label: "Húmedo" },
      { color: "#9ecae1", label: "Medio" },
      { color: "#deebf7", label: "Seco" },
      { color: "#9aa39a", label: "Sin medición" },
    ],
  };
  const legend = legendByLayer[layer] || [];
  const { establecimientos } = useLoteScope();
  const nombreEst = (id?: string | null) => (id ? establecimientos.find((e) => e.id === id)?.nombre ?? null : null);
  // Notas georreferenciadas: cada nota se marca en SU coordenada real (no en el
  // centroide del lote) con color según prioridad (Crítica/Moderada/No urgente).
  const [notasGeo, setNotasGeo] = useState<{ id: string; lat: number; lng: number; texto: string; prioridad: string; loteNombre: string }[]>([]);
  useEffect(() => {
    let cancelado = false;
    fetch("/api/marcadores-geo").then((r) => (r.ok ? r.json() : null)).then((rows) => {
      if (cancelado || !Array.isArray(rows)) return;
      const idsEnVista = new Set(lotes.map((l) => l.dbId || l.id));
      setNotasGeo(
        rows
          .filter((n: { loteId?: string | null; establecimientoId?: string | null }) => (n.loteId && idsEnVista.has(n.loteId)) || !n.loteId)
          .map((n: { id: string; latitud: number; longitud: number; tipo?: string | null; titulo?: string | null; descripcion?: string | null; lote?: { nombre?: string } | null }) => ({
            id: n.id,
            lat: n.latitud,
            lng: n.longitud,
            texto: [n.titulo !== "Nota" ? n.titulo : null, n.descripcion].filter(Boolean).join(" — ") || "Nota",
            prioridad: n.tipo || "",
            loteNombre: n.lote?.nombre || "Campo",
          }))
      );
    }).catch(() => {});
    return () => { cancelado = true; };
  }, [lotes, notasNonce]);
  const lotesGeo = lotes.map((l) => ({ id: l.id, name: l.name, ndvi: l.ndvi, humedad: l.humedad, vacio: l.vacio, cultivoColor: l.cultivoColor ?? null, geojson: l.geojson ?? null, establecimientoId: l.establecimientoId ?? null, establecimientoNombre: nombreEst(l.establecimientoId) }));
  // Contornos de establecimientos con límite dibujado, para que se vean en el mapa.
  const establecimientosGeo = [
    ...establecimientos.map((e) => ({ id: e.id, nombre: e.nombre, coordenadas: e.coordenadas ?? null })),
    ...(hullPreview ? [{ id: "__nuevo__", nombre: "Nuevo campo", coordenadas: hullPreview }] : []),
  ];
  // Dos vistas: "clasica" (mapa satelital MapLibre, con relieve 3D y plano) y
  // "campo3d" (gemelo digital three.js, ex-pestaña Campo 3D).
  const [vista, setVista] = useState<"clasica" | "campo3d">("clasica");
  // Si estábamos delimitando y se cambia de vista, re-armar el dibujo.
  const cambiarVista = (v: "clasica" | "campo3d") => {
    if (v === "campo3d" && delimitando) return; // no se dibuja en el gemelo 3D
    setVista(v);
    if (delimitando) onReArmar?.();
  };
  const [fichaOpen, setFichaOpen] = useState(false);
  // Capa de prescripción (vector + dosis): se activa sola al generar el mapa desde
  // la ficha del lote y se oculta desde su leyenda (abajo a la derecha).
  const [rxOn, setRxOn] = useState(false);
  const [rxMapa, setRxMapa] = useState<RxMapa | null>(null);
  const [online, setOnline] = useState(true);
  // Economía por lote para el gemelo Campo 3D (altura/color por margen/costo).
  const [economia, setEconomia] = useState<Record<string, { margenPorHa: number; costoPorHa: number; margen: number; fuente: string }>>({});
  useEffect(() => {
    if (vista !== "campo3d" || Object.keys(economia).length) return;
    fetch("/api/economia/lotes").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d?.lotes) return;
      const m: Record<string, { margenPorHa: number; costoPorHa: number; margen: number; fuente: string }> = {};
      d.lotes.forEach((l: { loteId: string; margenPorHa: number; costoPorHa: number; margen: number; fuente: string }) => { m[l.loteId] = { margenPorHa: l.margenPorHa, costoPorHa: l.costoPorHa, margen: l.margen, fuente: l.fuente }; });
      setEconomia(m);
    }).catch(() => {});
  }, [vista, economia]);

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
            <button className={vista === "clasica" ? "is-on" : ""} onClick={() => cambiarVista("clasica")}><Icon name="map" size={12} /> Vista Clásica</button>
            <button className={vista === "campo3d" ? "is-on" : ""} onClick={() => cambiarVista("campo3d")} disabled={delimitando} title={delimitando ? "No disponible mientras delimitás" : "Gemelo digital 3D"}><Icon name="grid" size={12} /> Campo 3D</button>
          </div>
          {vista === "clasica" && (
          <div className="mc-seg">
            {["Satélite", "NDVI", "Cultivos", "Topografía", "Relieve", "Humedad"].map((l) => (
              <button key={l} className={layer === l ? "is-on" : ""} onClick={() => onLayerChange(l)}>{l}</button>
            ))}
          </div>
          )}
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
        {vista === "clasica" && (
        <div className="row gap-8" style={{ alignItems: "center" }}>
          {onBuscar && (
            <BuscadorLugar
              onElegir={(p) => { onBuscar(p); if (delimitando) onReArmar?.(); }}
              placeholder="Buscar lugar en el mapa…"
              width={250}
            />
          )}
        </div>
        )}
      </div>
      {vista === "campo3d" ? (
        <div style={{ padding: "0 0 4px" }}>
          {lotes.length === 0 ? (
            <div className="mc-empty" style={{ height: 420 }}>
              <div className="mc-empty__icon"><Icon name="map" size={22} /></div>
              <div className="mc-empty__text">Sin lotes para visualizar. Dibujá tus lotes en Vista Clásica.</div>
            </div>
          ) : (
            <Campo3D lotes={lotes} economia={economia} />
          )}
        </div>
      ) : (
      <div className="mc-mapwrap" style={{ height: 640, position: "relative" }}>
        <Mapa3D
          lotes={lotesGeo}
          notas={notasGeo}
          ndviVisible={layer === "NDVI"}
          rx={rxMapa}
          rxVisible={rxOn}
          onRxCerrar={() => setRxOn(false)}
          selectedId={selected?.id ?? null}
          layer={layer}
          onSelect={(id: string) => onSelect(lotes.find((l) => l.id === id) || null)}
          onDrawn={onDrawn}
          armarDibujo={armarDibujo}
          onDibujoIniciado={onDibujoIniciado}
          volarA={volarA}
          establecimientos={establecimientosGeo}
          modoNota={modoNota}
          onPuntoNota={onPuntoNota}
          onEliminarNota={onEliminarNota}
          onCampoConLotes={onCampoConLotes}
        />

        {campoConLotesCount != null && (
          <div className="mc-glass" style={{ position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 562, display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: "var(--mc-ink)", maxWidth: "92%" }}>
            <Icon name="building" size={14} style={{ color: "var(--mc-green-700)", flexShrink: 0 }} />
            Nuevo campo · {campoConLotesCount} lote(s) dibujado(s)
            <button className="mc-btn mc-btn--primary mc-btn--sm" disabled={!campoConLotesCount} onClick={onTerminarCampo}><Icon name="check" size={12} />Terminar</button>
            <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onCancelarCampo}>Cancelar</button>
          </div>
        )}

        {delimitandoNombre && (
          <div className="mc-glass" style={{ position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 561, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: "var(--mc-ink)", maxWidth: "90%" }}>
            <Icon name="pen" size={14} style={{ color: "var(--mc-green-700)", flexShrink: 0 }} />
            Delimitando <b style={{ margin: "0 2px" }}>{delimitandoNombre}</b> · buscá la ubicación y dibujá el contorno (doble click para cerrar)
          </div>
        )}

        {modoNota && (
          <div className="mc-glass" style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 561, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: "var(--mc-ink)" }}>
            <Icon name="pen" size={14} style={{ color: "var(--mc-green-700)", flexShrink: 0 }} />
            Tocá un punto en el mapa para ubicar la nota
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
            onClose={() => onSelect(null)}
            onEditar={() => onEditar(selected)}
            onTarea={() => onTarea(selected)}
            onNota={onToggleNota}
            notaActiva={modoNota}
            onFicha={() => setFichaOpen(true)}
          />
        )}

        {/* Drawer: ficha técnica completa del lote */}
        {selected && fichaOpen && (
          <div style={{ position: "absolute", inset: 0, zIndex: 800, display: "flex", justifyContent: "flex-end", pointerEvents: "auto" }}>
            <div onClick={() => setFichaOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(15,22,18,0.32)", backdropFilter: "blur(1.5px)" }} />
            <div className="mc-drawer-in mc-noscrollbar" style={{ position: "relative", width: 480, maxWidth: "94%", height: "100%", overflowY: "auto", background: "var(--mc-surface)", boxShadow: "-12px 0 40px rgba(0,0,0,0.25)" }}>
              <LoteFichaTecnica
                lote={selected}
                onClose={() => setFichaOpen(false)}
                onNota={() => { setFichaOpen(false); onNota(selected); }}
                onEditar={() => { setFichaOpen(false); onEditar(selected); }}
                onTarea={() => { setFichaOpen(false); onTarea(selected); }}
                onRxGenerada={(r) => { setRxMapa(r); setRxOn(true); }}
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
      )}
    </div>
  );
}

/* ========== FICHA TÉCNICA (Figma LoteFichaTecnica) ========== */
type HistItem = { fechaMs: number; fecha: string; tipo: string; detail: string };

function LoteFichaTecnica({
  lote, onClose, onNota, onEditar, onTarea, onRxGenerada,
}: {
  lote: LoteUI;
  onClose: () => void;
  onNota: () => void;
  onEditar: () => void;
  onTarea: () => void;
  onRxGenerada?: (rx: RxMapa) => void;
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
            {lote.ndvi > 0 ? (
              <span className={`mc-badge mc-badge--${lote.sano ? "green" : "orange"}`}>
                {lote.sano ? <Icon name="check" size={11} /> : <Icon name="alert" size={11} />} {lote.sano ? "Saludable" : "Atención"}
              </span>
            ) : (
              <span className="mc-badge mc-badge--neutral">Sin datos</span>
            )}
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
        lote.dbId && lote.geojson ? <VRTPanel loteId={lote.dbId} loteName={lote.name} loteGeo={lote.geojson} onRxGenerada={onRxGenerada} />
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
  producto: string; dosisBase: number; estrategia: string; fuente: string; areaHa: number; simulado?: boolean;
  resumen: { celdas: number; prodTotal: number; prodUniforme: number; ahorroPct: number; zonas: { zona: string; dosis: number; ha: number; color: string }[] };
  geojson: { type: "FeatureCollection"; features: { geometry: { type: "Polygon"; coordinates: number[][][] }; properties: { ndvi: number; zona: string; dosis: number; color: string; areaHa?: number } }[] };
};

function VRTPanel({ loteId, loteName, loteGeo, onRxGenerada }: { loteId: string; loteName: string; loteGeo?: { type: "Polygon"; coordinates: number[][][] } | null; onRxGenerada?: (rx: RxMapa) => void }) {
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
      .then((d) => { if (d.error) setError(d.error); else { setRes(d); onRxGenerada?.({ fc: d.geojson, contorno: loteGeo ?? null }); } })
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

  // Mapa de prescripción estilo agronómico: zonas orgánicas coloreadas por dosis
  // SOBRE la imagen satelital real del lote, dosis numérica nítida por zona,
  // contorno rojo del lote, brújula (N) y escala discreta de dosis.
  const Mapa = () => {
    if (!res?.geojson.features.length) return null;
    const feats = res.geojson.features;
    const W = 420, H = 280;

    // Proyección Web Mercator (la misma de la imagen satelital) para que el fondo
    // calce exacto con las zonas, sin deformación.
    const R = 6378137;
    const mx = (lng: number) => R * ((lng * Math.PI) / 180);
    const my = (lat: number) => R * Math.log(Math.tan(Math.PI / 4 + ((lat * Math.PI) / 180) / 2));
    const anillos = [...feats.map((f) => f.geometry.coordinates[0]), ...(loteGeo?.coordinates?.[0]?.length ? [loteGeo.coordinates[0]] : [])];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    anillos.forEach((ring) => ring.forEach((p) => {
      const x = mx(p[0]), y = my(p[1]);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }));
    // Encuadre: margen del 11% y aspecto exacto del lienzo (satélite sin estirar).
    const cx0 = (minX + maxX) / 2, cy0 = (minY + maxY) / 2;
    let spanX = (maxX - minX) * 1.22 || 100, spanY = (maxY - minY) * 1.22 || 100;
    if (spanX / spanY > W / H) spanY = (spanX * H) / W; else spanX = (spanY * W) / H;
    const x0 = cx0 - spanX / 2, y1 = cy0 + spanY / 2;
    const sc = W / spanX;
    const projXY = (p: number[]): [number, number] => [(mx(p[0]) - x0) * sc, (y1 - my(p[1])) * sc];
    const proj = (p: number[]) => { const [x, y] = projXY(p); return `${x.toFixed(1)},${y.toFixed(1)}`; };

    // Imagen satelital REAL del encuadre (Esri World Imagery, misma fuente que el mapa).
    const satUrl =
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export` +
      `?bbox=${x0.toFixed(1)},${(cy0 - spanY / 2).toFixed(1)},${(cx0 + spanX / 2).toFixed(1)},${y1.toFixed(1)}` +
      `&bboxSR=3857&imageSR=3857&size=${W * 2},${H * 2}&format=jpg&f=image`;

    // El color lo define el servidor (rampa discreta por dosis, misma en toda la app).
    const dosisOrdenadas = [...res.resumen.zonas].sort((a, b) => a.dosis - b.dosis);
    const centro = (ring: number[][]): [number, number] => {
      const [sx, sy] = ring.reduce((a, p) => { const [x, y] = projXY(p); return [a[0] + x, a[1] + y]; }, [0, 0]);
      return [sx / ring.length, sy / ring.length];
    };
    // Área en píxeles (shoelace) para etiquetar solo las zonas donde el número entra.
    const areaPx = (ring: number[][]): number => {
      let s = 0;
      for (let i = 0; i < ring.length; i++) {
        const [xa, ya] = projXY(ring[i]);
        const [xb, yb] = projXY(ring[(i + 1) % ring.length]);
        s += xa * yb - xb * ya;
      }
      return Math.abs(s / 2);
    };

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ borderRadius: 10, background: "#dbd6c8", border: "1px solid var(--mc-line)" }}>
        {/* Fondo satelital real (si no carga, queda el fondo neutro del SVG) */}
        <image href={satUrl} x={0} y={0} width={W} height={H} preserveAspectRatio="none" />
        {/* Zonas de manejo coloreadas por dosis */}
        {feats.map((f, i) => (
          <polygon key={i} points={f.geometry.coordinates[0].map(proj).join(" ")} fill={f.properties.color || "#5e7733"} fillOpacity={0.88} stroke="#4a4436" strokeWidth={0.7} strokeLinejoin="round">
            <title>{f.properties.zona} · NDVI {f.properties.ndvi} · {f.properties.dosis} kg/ha</title>
          </polygon>
        ))}
        {/* Contorno del lote en rojo (límite de la prescripción) */}
        {loteGeo?.coordinates?.[0]?.length ? (
          <polygon points={loteGeo.coordinates[0].map(proj).join(" ")} fill="none" stroke="#d92b2b" strokeWidth={2.4} strokeLinejoin="round" />
        ) : null}
        {/* Dosis numérica en el centro de cada zona legible (halo blanco) */}
        {feats.map((f, i) => {
          const ring = f.geometry.coordinates[0];
          if (areaPx(ring) < 360) return null;
          const [cx, cy] = centro(ring);
          return (
            <text key={`t${i}`} x={cx} y={cy + 4} fontSize="13" fontFamily="var(--ff-ui)" fontWeight={800} fill="#1c2417" stroke="#ffffff" strokeWidth={3} paintOrder="stroke" textAnchor="middle">
              {f.properties.dosis}
            </text>
          );
        })}
        {/* Brújula: N arriba (proyección norte-arriba) */}
        <g transform={`translate(${W - 26}, 26)`}>
          <circle r="16" fill="rgba(255,255,255,0.92)" stroke="#5b5244" strokeWidth="1" />
          <path d="M 0 -11 L 4 4 L 0 1.5 L -4 4 Z" fill="#d92b2b" />
          <path d="M 0 11 L 4 4 L 0 6.5 L -4 4 Z" fill="#5b5244" opacity="0.55" />
          <text y="-1.5" x="7.5" fontSize="8.5" fontWeight={800} fill="#1c2417" textAnchor="middle">N</text>
        </g>
        {/* Escala discreta de dosis (kg/ha), una casilla por dosis real */}
        <g transform={`translate(12, ${H - 34})`}>
          <rect x={-6} y={-14} width={dosisOrdenadas.length * 40 + 12} height={42} rx={8} fill="rgba(20,26,16,0.55)" />
          <text x={0} y={-3} fontSize="8.5" fontWeight={800} fill="#ffffff">kg/ha</text>
          {dosisOrdenadas.map((z, i) => (
            <g key={z.zona} transform={`translate(${i * 40}, 2)`}>
              <rect width="40" height="10" fill={z.color} stroke="#ffffff" strokeWidth="0.6" />
              <text x="20" y="21" fontSize="9" fontWeight={800} fill="#ffffff" textAnchor="middle">{z.dosis}</text>
            </g>
          ))}
        </g>
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
            {res.simulado ? (
              <span className="mc-badge mc-badge--neutral" style={{ fontSize: 10.5 }} title="Sin NDVI satelital real (Sentinel), la zonificación es una estimación demostrativa">Demostración · sin NDVI real</span>
            ) : res.resumen.ahorroPct !== 0 && (
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
          <div className="text-xs" style={{ color: "var(--mc-green-700)", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="check" size={12} />La capa <b>Prescripción</b> quedó activa en el mapa (se oculta con la ✕ de su leyenda, abajo a la derecha).
          </div>
          {res.simulado ? (
            <div className="text-xs text-muted" title="La descarga para maquinaria requiere NDVI satelital real (Sentinel)">Descarga no disponible en modo demostración (requiere NDVI satelital real).</div>
          ) : (
            <button className="mc-btn mc-btn--secondary mc-btn--sm" onClick={descargar}><Icon name="download" size={13} />Descargar GeoJSON (para maquinaria)</button>
          )}
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
  // El croquis toma el COLOR DEL CULTIVO actual (misma paleta que la vista Cultivos);
  // lote vacío → blanquecino con borde visible.
  const vacio = lote.vacio || !lote.cultivoColor;
  const color = vacio ? "#b8b2a3" : (lote.cultivoColor as string);
  const fill = vacio ? "#f5f2ea" : `${color}55`;
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
        <polygon points={pts} fill={fill} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
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

type EcoLote = { margenPorHa: number; costoPorHa: number; porcentajeMargen: number; fuente: string; costoMaquinariaPorHa: number };
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
      d.lotes.forEach((l: any) => { m[l.loteId] = { margenPorHa: l.margenPorHa, costoPorHa: l.costoPorHa, porcentajeMargen: l.porcentajeMargen, fuente: l.fuente, costoMaquinariaPorHa: l.costoMaquinariaPorHa || 0 }; });
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
          <div style={{ textAlign: "center" }}>Identidad</div>
          <div>Cultivo</div>
          <div>Finanzas</div>
          <div>Salud</div>
          <div>Monitoreo</div>
          <div>Proyección</div>
          <div style={{ textAlign: "center" }}>Croquis</div>
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
                    {eco!.costoMaquinariaPorHa > 0 && (
                      <div className="text-xs text-muted">Maquinaria ${Math.round(eco!.costoMaquinariaPorHa).toLocaleString("es-AR")}/ha</div>
                    )}
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
              <div style={{ display: "flex", justifyContent: "center" }}><LoteCroquis lote={l} /></div>
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
export const PRIORIDADES_NOTA = [
  { valor: "Crítica", color: "#d13a3a" },
  { valor: "Moderada", color: "#d9a538" },
  { valor: "No urgente", color: "#5e7733" },
] as const;
export function colorPrioridadNota(p?: string | null): string {
  return PRIORIDADES_NOTA.find((x) => x.valor === p)?.color || "#64748b";
}

function NotaPuntoModal({
  nombre, lat, lng, onClose, onConfirm,
}: {
  nombre: string;
  lat: number;
  lng: number;
  onClose: () => void;
  onConfirm: (texto: string, prioridad: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const [prioridad, setPrioridad] = useState<string>("Moderada");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "var(--mc-surface)", borderRadius: 16, width: 460, maxWidth: "100%", boxShadow: "var(--sh-lg)", padding: 22 }} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div className="mc-card__eyebrow">Comentario Georreferenciado</div>
            <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 16, marginTop: 2 }}>{nombre}</div>
            <div className="text-xs text-muted" style={{ fontFamily: "var(--ff-mono)", marginTop: 2 }}>{lat.toFixed(5)}°, {lng.toFixed(5)}°</div>
          </div>
          <button className="mc-icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="mc-label" style={{ marginBottom: 6 }}>Prioridad</div>
        <div className="row gap-8" style={{ marginBottom: 12 }}>
          {PRIORIDADES_NOTA.map((p) => {
            const on = prioridad === p.valor;
            return (
              <button
                key={p.valor}
                onClick={() => setPrioridad(p.valor)}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  border: on ? `2px solid ${p.color}` : "1px solid var(--mc-line-2)",
                  background: on ? `${p.color}18` : "var(--mc-surface)",
                  color: on ? p.color : "var(--mc-text-2)",
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                {p.valor}
              </button>
            );
          })}
        </div>
        <textarea className="mc-textarea" placeholder="Ej: Sector bajo con encharcamiento tras la lluvia. Revisar drenaje." value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus />
        <div className="row gap-8 mt-12" style={{ justifyContent: "flex-end" }}>
          <button className="mc-btn mc-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" disabled={!texto.trim()} onClick={() => onConfirm(texto.trim(), prioridad)}>
            <Icon name="pen" size={13} />Guardar nota
          </button>
        </div>
      </div>
    </div>
  );
}

function NuevoEstablecimientoModal({
  lotesCount, hectareas, onClose, onConfirm,
}: {
  lotesCount: number;
  hectareas: number;
  onClose: () => void;
  onConfirm: (d: { nombre: string; direccion: string; ciudad: string; provincia: string; pais: string; cuit: string }) => void;
}) {
  const [form, setForm] = useState({ nombre: "", direccion: "", ciudad: "", provincia: "", pais: "Uruguay", cuit: "" });
  const [saving, setSaving] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,36,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "var(--mc-surface)", borderRadius: 16, width: 520, maxWidth: "100%", boxShadow: "var(--sh-lg)", padding: 22, maxHeight: "92vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 18 }}>Nuevo establecimiento</div>
          <button className="mc-icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="text-xs text-muted" style={{ marginBottom: 14 }}>Lo creás con <b>{lotesCount} lote(s)</b> dibujados · {Math.round(hectareas)} ha. El contorno se calcula solo a partir de los lotes.</div>
        <div className="col gap-12">
          <div><div className="mc-label" style={{ marginBottom: 4 }}>Nombre *</div><input className="mc-input" placeholder="Ej: Establecimiento Don Ramón" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
          <div><div className="mc-label" style={{ marginBottom: 4 }}>Dirección</div><input className="mc-input" placeholder="Ej: Ruta 5, Km 40" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></div>
          <div className="grid g-cols-2 gap-12">
            <div><div className="mc-label" style={{ marginBottom: 4 }}>País</div>
              <select className="mc-select" value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value, provincia: "" })}>
                {Object.keys(DIVISIONES_POR_PAIS).map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><div className="mc-label" style={{ marginBottom: 4 }}>Provincia / Depto.</div>
              {DIVISIONES_POR_PAIS[form.pais] ? (
                <select className="mc-select" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })}>
                  <option value="">Elegí…</option>
                  {DIVISIONES_POR_PAIS[form.pais].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <input className="mc-input" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} />
              )}
            </div>
          </div>
          <div className="grid g-cols-2 gap-12">
            <div><div className="mc-label" style={{ marginBottom: 4 }}>Ciudad / Localidad</div><input className="mc-input" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} /></div>
            <div><div className="mc-label" style={{ marginBottom: 4 }}>CUIT / RUT</div><input className="mc-input" placeholder="Identificación fiscal" value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} /></div>
          </div>
        </div>
        <div className="row gap-8 mt-12" style={{ justifyContent: "flex-end" }}>
          <button className="mc-btn mc-btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn--primary" disabled={!form.nombre.trim() || saving} onClick={async () => { setSaving(true); await onConfirm(form); setSaving(false); }}>
            <Icon name="check" size={13} />{saving ? "Creando…" : "Crear campo"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
