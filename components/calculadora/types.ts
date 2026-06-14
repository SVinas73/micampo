export type Categoria = "Herbicida" | "Insecticida" | "Fungicida" | "Nutrición" | "Fertilizante";

export type ProductoMezcla = {
  tipo: Categoria;
  nombre: string;
  costoUnitario: string; // USD / Lt o Kg
  dosis: string; // valor dosis objetivo
  unidad: string; // "Lt/Ha" | "Kg/Ha" | "cc/Ha" | "g/Ha"
  concentracion?: string; // % opcional
  carencia?: string; // días opcional
};

export type ConfigCalculo = {
  loteNombre: string;
  loteId: string | null;
  area: number; // Ha
  caldo: number; // L/Ha
  tanque: number; // L capacidad
  tipoAplicacion: string; // "Terrestre" | "Aérea"
  productos: ProductoMezcla[];
};

export type HistRow = {
  id?: string; // id real de BD (para duplicar / eliminar)
  fecha: string;
  producto: string;
  lote: string;
  ha: number;
  dosis: string;
  total: string;
  costo: string;
  usuario: string;
  config?: ConfigCalculo; // para duplicar con todos los valores
};

export type Preset = {
  nombre: string;
  tipo: string;
  dosis: string;
  caldo: string;
  productos: number;
  color: string;
  config: ConfigCalculo;
};

export const CATEGORIAS: Categoria[] = ["Herbicida", "Insecticida", "Fungicida", "Nutrición"];

export const ICONO_CATEGORIA: Record<string, string> = {
  Herbicida: "leaf",
  Insecticida: "bug",
  Fungicida: "droplet",
  Nutrición: "sprout",
  Fertilizante: "sprout",
};

export const COLOR_CATEGORIA: Record<string, string> = {
  Herbicida: "var(--mc-green-600)",
  Insecticida: "var(--mc-orange-600)",
  Fungicida: "var(--mc-blue)",
  Nutrición: "var(--mc-amber)",
  Fertilizante: "var(--mc-amber)",
};

// Mapea el "tipo de cálculo" de la pantalla Inicio a una categoría de producto inicial.
export const TIPO_A_CATEGORIA: Record<string, Categoria> = {
  Herbicida: "Herbicida",
  Fungicida: "Fungicida",
  Insecticida: "Insecticida",
  Fertilizante: "Nutrición",
  "Mezcla personalizada": "Herbicida",
  "Riego + agroquímico": "Herbicida",
};
