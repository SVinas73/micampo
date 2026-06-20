"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

/**
 * Alcance global Campo (Establecimiento) → Lote, sincronizado en toda la app.
 * - Establecimiento: "todos" o un campo puntual. Filtra qué lotes están en alcance.
 * - Lote: "todos" (los del campo activo) o uno puntual.
 * Los módulos por-lote respetan `loteActivo`; los módulos con datos por-lote pueden
 * filtrar usando `loteIdsEnScope`. Persistido en localStorage.
 */

export type LoteScopeItem = {
  id: string;
  nombre: string;
  cultivo?: string | null;
  centroLatitud?: number | null;
  centroLongitud?: number | null;
  hectareas?: number | null;
  establecimientoId?: string | null;
};

export type EstablecimientoItem = {
  id: string;
  nombre: string;
  lotesCount?: number;
};

type Ctx = {
  // Establecimientos / campos
  establecimientos: EstablecimientoItem[];
  establecimientoId: string; // "todos" | id
  setEstablecimientoId: (id: string) => void;
  establecimientoActivo: EstablecimientoItem | null;
  // Lotes (ya filtrados por el campo activo)
  lotes: LoteScopeItem[];
  todosLosLotes: LoteScopeItem[];
  loteId: string; // "todos" | id
  setLoteId: (id: string) => void;
  loteActivo: LoteScopeItem | null;
  // Conjunto de ids de lote en alcance (para filtrar datos por-lote)
  loteIdsEnScope: string[];
  esTodos: boolean; // sin filtro activo (campo y lote en "todos")
  cargado: boolean;
  recargar: () => void;
};

const LoteScopeContext = createContext<Ctx | null>(null);
const KEY_EST = "micampo:scopeEstablecimiento";
const KEY_LOTE = "micampo:scopeLote";

export function LoteScopeProvider({ children }: { children: React.ReactNode }) {
  const [todosLosLotes, setTodosLosLotes] = useState<LoteScopeItem[]>([]);
  const [establecimientos, setEstablecimientos] = useState<EstablecimientoItem[]>([]);
  const [establecimientoId, setEstIdState] = useState<string>("todos");
  const [loteId, setLoteIdState] = useState<string>("todos");
  const [cargado, setCargado] = useState(false);

  const cargar = useCallback(() => {
    let savedEst: string | null = null;
    let savedLote: string | null = null;
    try {
      savedEst = localStorage.getItem(KEY_EST);
      savedLote = localStorage.getItem(KEY_LOTE);
    } catch {}

    Promise.all([
      fetch("/api/lotes").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/establecimientos").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([ld, ed]) => {
        const lotes: LoteScopeItem[] = Array.isArray(ld)
          ? ld.map((l: any) => ({
              id: l.id,
              nombre: l.nombre,
              cultivo: l.cultivo ?? null,
              centroLatitud: l.centroLatitud ?? null,
              centroLongitud: l.centroLongitud ?? null,
              hectareas: l.hectareas ?? null,
              establecimientoId: l.establecimientoId ?? null,
            }))
          : [];
        const ests: EstablecimientoItem[] = Array.isArray(ed)
          ? ed.map((e: any) => ({ id: e.id, nombre: e.nombre, lotesCount: e.lotesCount }))
          : [];
        setTodosLosLotes(lotes);
        setEstablecimientos(ests);
        if (savedEst && (savedEst === "todos" || ests.some((e) => e.id === savedEst))) setEstIdState(savedEst);
        if (savedLote && (savedLote === "todos" || lotes.some((l) => l.id === savedLote))) setLoteIdState(savedLote);
      })
      .finally(() => setCargado(true));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const setEstablecimientoId = useCallback((id: string) => {
    setEstIdState(id);
    // Al cambiar de campo, resetear el lote (puede no pertenecer al nuevo campo)
    setLoteIdState("todos");
    try {
      localStorage.setItem(KEY_EST, id);
      localStorage.setItem(KEY_LOTE, "todos");
    } catch {}
  }, []);

  const setLoteId = useCallback((id: string) => {
    setLoteIdState(id);
    try {
      localStorage.setItem(KEY_LOTE, id);
    } catch {}
  }, []);

  // Lotes en alcance del campo activo
  const lotes = useMemo(
    () => (establecimientoId === "todos" ? todosLosLotes : todosLosLotes.filter((l) => l.establecimientoId === establecimientoId)),
    [todosLosLotes, establecimientoId]
  );

  const loteActivo = loteId === "todos" ? null : lotes.find((l) => l.id === loteId) || null;
  const establecimientoActivo = establecimientoId === "todos" ? null : establecimientos.find((e) => e.id === establecimientoId) || null;
  const loteIdsEnScope = useMemo(() => (loteActivo ? [loteActivo.id] : lotes.map((l) => l.id)), [loteActivo, lotes]);
  const esTodos = establecimientoId === "todos" && loteId === "todos";

  return (
    <LoteScopeContext.Provider
      value={{
        establecimientos,
        establecimientoId,
        setEstablecimientoId,
        establecimientoActivo,
        lotes,
        todosLosLotes,
        loteId,
        setLoteId,
        loteActivo,
        loteIdsEnScope,
        esTodos,
        cargado,
        recargar: cargar,
      }}
    >
      {children}
    </LoteScopeContext.Provider>
  );
}

export function useLoteScope(): Ctx {
  const ctx = useContext(LoteScopeContext);
  if (!ctx) {
    return {
      establecimientos: [], establecimientoId: "todos", setEstablecimientoId: () => {}, establecimientoActivo: null,
      lotes: [], todosLosLotes: [], loteId: "todos", setLoteId: () => {}, loteActivo: null,
      loteIdsEnScope: [], esTodos: true, cargado: true, recargar: () => {},
    };
  }
  return ctx;
}
