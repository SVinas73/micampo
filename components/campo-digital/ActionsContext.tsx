"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Permite que cada tab de Campo Digital inyecte sus botones de acción
 * en el PageHeader compartido (fiel al Figma: las acciones del header
 * cambian según el tab activo).
 */
const ActionsContext = createContext<{
  actions: React.ReactNode;
  setActions: (n: React.ReactNode) => void;
}>({ actions: null, setActions: () => {} });

export function ActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<React.ReactNode>(null);
  return <ActionsContext.Provider value={{ actions, setActions }}>{children}</ActionsContext.Provider>;
}

export function useHeaderActions() {
  return useContext(ActionsContext);
}

/** Hook de conveniencia: registra las acciones del header mientras el tab está montado. */
export function useSetHeaderActions(node: React.ReactNode, deps: React.DependencyList = []) {
  const { setActions } = useContext(ActionsContext);
  useEffect(() => {
    setActions(node);
    return () => setActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
