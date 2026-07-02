import type { ConfigCalculo, ProductoMezcla } from "./types";

export function fmtUSD(n: number): string {
  // USD con separador de miles en-US (1,250) y sin decimales para montos agronómicos.
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function num(v: string | number | undefined): number {
  const n = typeof v === "number" ? v : parseFloat(v || "");
  return isNaN(n) ? 0 : n;
}

export function caldoTotal(c: ConfigCalculo): number {
  return num(c.caldo) * num(c.area);
}

export function cargas(c: ConfigCalculo): number {
  const t = num(c.tanque);
  if (t <= 0) return 0;
  return Math.ceil(caldoTotal(c) / t);
}

// Total de producto necesario para cubrir el área (en su unidad sin "/Ha").
export function totalProducto(p: ProductoMezcla, area: number): number {
  return num(p.dosis) * num(area);
}

// Producto por tanque = dosis (unidad/Ha) x hectáreas que cubre un tanque (tanque L ÷ caldo L/Ha).
export function porTanque(p: ProductoMezcla, caldo: number, tanque: number): number {
  const c = num(caldo);
  if (c <= 0) return 0;
  return num(p.dosis) * (num(tanque) / c);
}

// Costo por hectárea de un producto = dosis (Lt/Ha) x costo unitario (USD/Lt).
export function costoPorHa(p: ProductoMezcla): number {
  return num(p.dosis) * num(p.costoUnitario);
}

// Costo total de un producto para todo el área.
export function costoTotalProducto(p: ProductoMezcla, area: number): number {
  return costoPorHa(p) * num(area);
}

export function costoPorHaMezcla(c: ConfigCalculo): number {
  return c.productos.reduce((s, p) => s + costoPorHa(p), 0);
}

export function costoTotalMezcla(c: ConfigCalculo): number {
  return costoPorHaMezcla(c) * num(c.area);
}

// Logística: litros totales y bidones de 20L aproximados.
export function logistica(dosis: number, area: number) {
  const litros = dosis * area;
  const bidones = Math.ceil(litros / 20);
  return { litros, bidones };
}
