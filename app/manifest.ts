import type { MetadataRoute } from "next";

/**
 * Manifest PWA — permite "instalar" MiCampo en el celular como app y habilita
 * el modo standalone (pantalla completa, sin barra del navegador), clave para
 * el uso en el campo. Para instalación completa en Android conviene agregar
 * íconos PNG 192x192 y 512x512 dedicados (hoy usa el logo).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MiCampo — Gestión Agropecuaria",
    short_name: "MiCampo",
    description: "El sistema nervioso central del agro moderno: agricultura, ganadería, maquinaria, clima y finanzas con IA.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f1612",
    theme_color: "#5e7733",
    orientation: "any",
    lang: "es",
    icons: [
      { src: "/logo.jpeg", sizes: "192x192", type: "image/jpeg", purpose: "any" },
      { src: "/logo.jpeg", sizes: "512x512", type: "image/jpeg", purpose: "any" },
    ],
  };
}
