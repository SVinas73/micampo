"use client";

import { useEffect } from "react";

/**
 * Registra el Service Worker que cachea tiles del mapa (resiliencia en campo
 * con mala señal). Sólo en producción y si el navegador lo soporta. Falla en
 * silencio: si no se puede registrar, la app funciona igual (online).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
