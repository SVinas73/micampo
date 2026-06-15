// Datos compartidos de la pantalla Inicio (fieles al Figma, usados como fallback)

export interface KpiConfig {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "warn";
  icon: string;
  accent?: boolean;
  warn?: boolean;
}

export const ALL_KPIS: Record<string, KpiConfig> = {
  hectareas: { label: "Hectáreas productivas", value: "558 Ha", delta: "+3.2% vs campaña ant.", trend: "up", icon: "map", accent: true },
  cabezas: { label: "Cabezas de ganado", value: "1,284", delta: "+24 últ. 30d", trend: "up", icon: "cow" },
  ingresosMes: { label: "Ingresos del mes", value: "$8.6M", delta: "+12% vs marzo", trend: "up", icon: "dollar" },
  labores: { label: "Labores pendientes", value: "17", delta: "3 atrasadas", trend: "warn", icon: "wrench", warn: true },
  litros: { label: "Litros prom. diario", value: "4,820 L", delta: "+180L vs ayer", trend: "up", icon: "droplet" },
  margen: { label: "Margen bruto est.", value: "$2.8M", delta: "+0.4M ajuste", trend: "up", icon: "activity" },
  preñez: { label: "Preñez rodeo", value: "78%", delta: "Tacto parcial", trend: "up", icon: "heart" },
  agua: { label: "Reserva agua útil", value: "62%", delta: "-4 pts vs ayer", trend: "down", icon: "droplet" },
  ingresosProy: { label: "Ingresos proy. campaña", value: "$48.2M", delta: "+18% est.", trend: "up", icon: "dollar" },
  hectareasSemb: { label: "Hectáreas sembradas", value: "426 Ha", delta: "76% del campo", trend: "up", icon: "sprout" },
  alertas: { label: "Alertas activas", value: "5", delta: "2 críticas", trend: "warn", icon: "alert" },
  rinde: { label: "Rinde promedio est.", value: "6.6 t/Ha", delta: "+0.4 vs ant.", trend: "up", icon: "activity" },
};

export const DEFAULT_KPI_ORDER = ["hectareas", "cabezas", "ingresosMes", "labores", "litros"];

export const KPIS_STORAGE_KEY = "micampo:kpis";
export const ATAJOS_STORAGE_KEY = "micampo:atajos";

export interface WeatherDay {
  ic: string;
  max: number;
  min: number;
  mm: number;
  wind: string;
}

// Fallback del Figma
export const FALLBACK_WEATHER: WeatherDay[] = [
  { ic: "cloud", max: 22, min: 14, mm: 0, wind: "12 km/h ↘ SE" },
  { ic: "sun", max: 24, min: 15, mm: 0, wind: "15 km/h → E" },
  { ic: "droplet", max: 20, min: 12, mm: 25, wind: "18 km/h ↙ SO" },
  { ic: "cloud", max: 21, min: 13, mm: 15, wind: "10 km/h ↓ S" },
  { ic: "cloud", max: 23, min: 14, mm: 0, wind: "8 km/h ↗ NE" },
  { ic: "sun", max: 26, min: 16, mm: 0, wind: "12 km/h ↑ N" },
  { ic: "cloud", max: 22, min: 13, mm: 8, wind: "20 km/h ↙ SO" },
];

export interface GanttEvent {
  titulo: string;
  inicio: number; // índice de día (0..6)
  dur: number; // duración en días
  color: string;
  icon: string;
}

export const FALLBACK_EVENTS: GanttEvent[] = [
  { titulo: "Siembra Lote 3", inicio: 0, dur: 2, color: "#4f9d52", icon: "sprout" },
  { titulo: "Pulverización N1", inicio: 0, dur: 1, color: "#e7892b", icon: "flask" },
  { titulo: "Retira Conaprole", inicio: 1, dur: 1, color: "#2c7ad9", icon: "truck" },
  { titulo: "Riego Sector A", inicio: 2, dur: 4, color: "#3aa6d9", icon: "droplet" },
  { titulo: "Vacunación Aftosa", inicio: 3, dur: 1, color: "#c14a3a", icon: "syringe" },
  { titulo: "Cosecha Maíz E1", inicio: 5, dur: 2, color: "#d9a538", icon: "wrench" },
];

export const LABOR_COLORS: Record<string, { color: string; icon: string }> = {
  Siembra: { color: "#4f9d52", icon: "sprout" },
  Cosecha: { color: "#d9a538", icon: "wrench" },
  Pulverización: { color: "#e7892b", icon: "flask" },
  Fertilización: { color: "#8a6dbb", icon: "leaf" },
  Labranza: { color: "#a06b42", icon: "wrench" },
  Riego: { color: "#3aa6d9", icon: "droplet" },
};

export interface AlertaItem {
  nivel: "red" | "orange" | "amber" | "blue";
  title: string;
  body: string;
}

export const ALERTAS_ACTIVAS: AlertaItem[] = [
  { nivel: "red", title: "Plaga detectada", body: "Chinches verdes en Lote Norte 1 · superó umbral" },
  { nivel: "orange", title: "Ventana de pulverización cerrada", body: "Viento >20km/h las próximas 12hs" },
  { nivel: "amber", title: "Stock bajo", body: "Urea · quedan 4 días de consumo" },
  { nivel: "blue", title: "Cosecha lista", body: "Maíz Lote Este 1 · humedad 14.5%" },
  { nivel: "amber", title: "Animales sin pesar", body: "Tropa C · 38 días sin registro" },
];

export const FALLBACK_BALANCE = {
  months: ["Nov", "Dic", "Ene", "Feb", "Mar", "Abr"],
  ingresos: [4.2, 5.8, 6.4, 7.1, 7.6, 8.6],
  gastos: [3.1, 3.4, 4.0, 4.2, 5.1, 5.8],
  chipIngresos: { value: "$8.6M", delta: "+12% vs marzo" },
  chipGastos: { value: "$5.8M", delta: "+14% vs marzo" },
};

export function weatherIcon(condicion: string, mm: number): string {
  if (mm > 10 || condicion === "lluvia") return "droplet";
  if (mm > 0) return "cloud";
  if (condicion === "nublado") return "cloud";
  return "sun";
}
