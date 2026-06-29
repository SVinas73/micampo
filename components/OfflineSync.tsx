"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/mc/Icon";
import { contarPendientes, sincronizar, onCambioCola } from "@/lib/offline";

/**
 * Indicador y motor de sincronización offline.
 * - Sincroniza la cola al cargar y cada vez que vuelve la conexión.
 * - Muestra una píldora discreta solo cuando hay algo para mostrar:
 *   "Sin conexión" (con N pendientes) o "Sincronizando…".
 * Invisible cuando hay red y no hay pendientes.
 */
export default function OfflineSync() {
  const [online, setOnline] = useState(true);
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const refrescar = async () => setPendientes(await contarPendientes());

    const flush = async () => {
      setSincronizando(true);
      await sincronizar();
      await refrescar();
      setSincronizando(false);
    };

    const handleOnline = () => { setOnline(true); flush(); };
    const handleOffline = () => setOnline(false);

    refrescar();
    if (navigator.onLine) flush();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const off = onCambioCola(refrescar);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      off();
    };
  }, []);

  // Nada para mostrar: con conexión y sin pendientes.
  if (online && pendientes === 0 && !sincronizando) return null;

  const sinRed = !online;
  const bg = sinRed ? "#7a4a2a" : "#5e7733";
  const texto = sinRed
    ? (pendientes > 0 ? `Sin conexión · ${pendientes} para sincronizar` : "Sin conexión · se guarda local")
    : (sincronizando ? "Sincronizando…" : `${pendientes} pendiente${pendientes === 1 ? "" : "s"} de sincronizar`);

  return (
    <div
      role="status"
      style={{
        position: "fixed", left: 16, bottom: 16, zIndex: 8000,
        display: "inline-flex", alignItems: "center", gap: 8,
        background: bg, color: "#fff", padding: "8px 13px", borderRadius: 999,
        fontSize: 12.5, fontWeight: 600, boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
      }}
    >
      <Icon name={sinRed ? "cloud" : "activity"} size={14} />
      {texto}
      {sincronizando && <span className="mc-copilot-orb__pulse" style={{ background: "rgba(255,255,255,0.45)" }} />}
    </div>
  );
}
