"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

/**
 * Alcance de lote global y sincronizado en toda la app.
 * - "todos" = ver el establecimiento completo (todos los lotes).
 * - un id de lote = enfocar ese lote; los módulos por-lote (plan de riego, clima,
 *   análisis, etc.) respetan esta selección.
 * Persistido en localStorage para que se mantenga al navegar entre módulos.
 */

export type LoteScopeItem = {
  id: string;
  nombre: string;
  cultivo?: string | null;
  centroLatitud?: number | null;
  centroLongitud?: number | null;
  hectareas?: number | null;
};

type Ctx = {
  lotes: LoteScopeItem[];
  loteId: string; // "todos" | id
  setLoteId: (id: string) => void;
  loteActivo: LoteScopeItem | null; // null si "todos"
  esTodos: boolean;
  cargado: boolean;
};

const LoteScopeContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "micampo:loteScope";

export function LoteScopeProvider({ children }: { children: React.ReactNode }) {
  const [lotes, setLotes] = useState<LoteScopeItem[]>([]);
  const [loteId, setLoteIdState] = useState<string>("todos");
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {}
    fetch("/api/lotes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const items: LoteScopeItem[] = Array.isArray(d)
          ? d.map((l: any) => ({
              id: l.id,
              nombre: l.nombre,
              cultivo: l.cultivo ?? null,
              centroLatitud: l.centroLatitud ?? null,
              centroLongitud: l.centroLongitud ?? null,
              hectareas: l.hectareas ?? null,
            }))
          : [];
        setLotes(items);
        if (saved && (saved === "todos" || items.some((l) => l.id === saved))) {
          setLoteIdState(saved);
        }
      })
      .catch(() => {})
      .finally(() => setCargado(true));
  }, []);

  const setLoteId = useCallback((id: string) => {
    setLoteIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }, []);

  const loteActivo = loteId === "todos" ? null : lotes.find((l) => l.id === loteId) || null;

  return (
    <LoteScopeContext.Provider value={{ lotes, loteId, setLoteId, loteActivo, esTodos: loteId === "todos", cargado }}>
      {children}
    </LoteScopeContext.Provider>
  );
}

export function useLoteScope(): Ctx {
  const ctx = useContext(LoteScopeContext);
  if (!ctx) {
    // Fallback seguro si algún componente queda fuera del provider
    return { lotes: [], loteId: "todos", setLoteId: () => {}, loteActivo: null, esTodos: true, cargado: true };
  }
  return ctx;
}
