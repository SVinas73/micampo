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

export const CULTIVO_COLOR: Record<string, string> = {
  Soja: "#768f44",
  Maíz: "#d9a538",
  Trigo: "#c08a22",
  Girasol: "#e8b94a",
  Cebada: "#8aa353",
  Alfalfa: "#aabd76",
  Sorgo: "#b5762f",
};
