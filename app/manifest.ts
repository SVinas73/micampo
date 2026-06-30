import type { MetadataRoute } from "next";

/**
 * Manifest PWA — permite "instalar" MiCampo en el celular como app y habilita
 * el modo standalone (pantalla completa, sin barra del navegador), clave para
 * el uso en el campo. Íconos PNG dedicados 192/512 (any) + maskable (con safe zone
 * y fondo de marca) para que se vea prolijo instalado en Android e iOS.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MiCampo — Gestión Agropecuaria",
    short_name: "MiCampo",
    description: "El sistema nervioso central del agro moderno: agricultura, ganadería, maquinaria, clima y finanzas con IA.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#324428",
    theme_color: "#324428",
    orientation: "any",
    lang: "es",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
