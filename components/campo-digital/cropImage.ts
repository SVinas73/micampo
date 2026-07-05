/**
 * Banco de imágenes de cultivos. Mapea el nombre del cultivo a una imagen en
 * /public/cultivos/{slug}.jpg. Las imágenes las irá agregando el usuario; mientras
 * tanto el componente usa un fallback con gradiente del color del cultivo.
 */
const SLUG: Record<string, string> = {
  Soja: "soja",
  Maíz: "maiz",
  Maiz: "maiz",
  Trigo: "trigo",
  Girasol: "girasol",
  Cebada: "cebada",
  Alfalfa: "alfalfa",
  Sorgo: "sorgo",
  Avena: "avena",
  Trébol: "trebol",
};

export function cropSlug(cultivo?: string | null): string | null {
  if (!cultivo) return null;
  return (
    SLUG[cultivo] ||
    cultivo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function cropImage(cultivo?: string | null): string | null {
  const slug = cropSlug(cultivo);
  return slug ? `/cultivos/${slug}.jpg` : null;
}

// Extensiones soportadas, en orden de preferencia. El componente prueba una a una.
const EXTS = ["jpg", "jpeg", "png", "webp"];

/** Lista de rutas candidatas (varias extensiones) para el cultivo. */
export function cropImageCandidates(cultivo?: string | null): string[] {
  const slug = cropSlug(cultivo);
  if (!slug) return [];
  return EXTS.map((e) => `/cultivos/${slug}.${e}`);
}

// Paleta ÚNICA de cultivos: la misma de la vista "Cultivos" del mapa y los croquis.
import { CULTIVO_COLORES } from "./lotes-data";
export const CULTIVO_COLOR: Record<string, string> = CULTIVO_COLORES;
