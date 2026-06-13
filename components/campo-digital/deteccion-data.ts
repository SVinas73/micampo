/* Tipos y datos de ejemplo (Figma) para el tab Detección de Enfermedades (IA) */

export interface AnalisisLesion {
  etiqueta: string;
  confianza: number; // 0-100
  // coordenadas relativas 0-1
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnalisisRecomendacion {
  producto: string;
  dosis: string;
  ventanaAplicacion: string;
  costoEstimadoHa: string;
}

export interface AnalisisResultado {
  enfermedad: string;
  nombreCientifico: string;
  confianzaGlobal: number; // 0-100
  severidad: "Baja" | "Media" | "Alta";
  lesiones: AnalisisLesion[];
  recomendacion: AnalisisRecomendacion;
  analisis: string;
  simulado?: boolean;
}

export type RiesgoTone = "red" | "amber" | "green";

export interface AlertaRow {
  id?: string;
  loteId?: string;
  lote: string;
  enfermedad: string;
  estadio: string;
  img: string;
  imgBg: string;
  deteccion: string;
  afect: string;
  haAfectadas?: number;
  riesgo: string;
  riesgoColor: RiesgoTone;
  perdida: string;
  proy: string;
  recom: string;
  iaIcon?: boolean;
}

/* ===== Ejemplo del Figma — estado inicial ===== */
export const ALERTAS_FIGMA: AlertaRow[] = [
  { lote: "Lote 4 (Maíz)", enfermedad: "Roya Común (Puccinia)", estadio: "R1 (Floración)", img: "🌽", imgBg: "linear-gradient(135deg,#4f9d52,#3aa6d9)", deteccion: "Detección Satelital NDVI", afect: "15 Ha afectadas · Hace 2h", haAfectadas: 15, riesgo: "ALTA (35%)", riesgoColor: "red", perdida: "$4.500 USD", proy: "Proyección a cosecha", recom: "Aplicar Fungicida (Triazol)", iaIcon: true },
  { lote: "Lote 2 (Maíz)", enfermedad: "Oruga Cogollera", estadio: "V8 (Vegetativo)", img: "🐛", imgBg: "linear-gradient(135deg,#6db870,#4f9d52)", deteccion: "Foto de Monitoreo (Dron)", afect: "8 Ha afectadas · Ayer", haAfectadas: 8, riesgo: "MEDIA (15%)", riesgoColor: "amber", perdida: "$1.200 USD", proy: "Daño foliar progresivo", recom: "Monitoreo + Insecticida" },
  { lote: "Lote 7 (Soja)", enfermedad: "Mancha Marrón", estadio: "R3 (Form. Vainas)", img: "🌱", imgBg: "linear-gradient(135deg,#9ecf8c,#6db870)", deteccion: "Detección Satelital NDVI", afect: "20 Ha afectadas · Hace 5h", haAfectadas: 20, riesgo: "BAJA (5%)", riesgoColor: "green", perdida: "$500 USD", proy: "Impacto leve", recom: "Monitoreo Intensivo", iaIcon: true },
  { lote: "Lote 1 (Trigo)", enfermedad: "Pulgón Verde", estadio: "Z31 (Primer Nudo)", img: "🌾", imgBg: "linear-gradient(135deg,#a88032,#d9a538)", deteccion: "Foto de Campo", afect: "30 Ha afectadas · Hace 1h", haAfectadas: 30, riesgo: "ALTA (40%)", riesgoColor: "red", perdida: "$3.200 USD", proy: "Rápida propagación", recom: "Aplicar Insecticida Sistémico" },
  { lote: "Lote 5 (Girasol)", enfermedad: "Esclerotinia", estadio: "R5 (Llenado Grano)", img: "🌻", imgBg: "linear-gradient(135deg,#e8b94a,#d9a538)", deteccion: "Detección Satelital NDVI", afect: "12 Ha afectadas · Ayer", haAfectadas: 12, riesgo: "MEDIA (20%)", riesgoColor: "amber", perdida: "$2.100 USD", proy: "Riesgo de vuelco", recom: "Evaluar Daño y Cosecha Anticipada", iaIcon: true },
];

/* ===== Resultado demo del análisis (datos del Figma) ===== */
export const DEMO_ANALISIS: AnalisisResultado = {
  enfermedad: "Roya Común",
  nombreCientifico: "Puccinia sorghi",
  confianzaGlobal: 96,
  severidad: "Media",
  lesiones: [
    { etiqueta: "Lesión A (Foco Principal)", confianza: 98, x: 0.25, y: 0.3, w: 0.12, h: 0.08 },
    { etiqueta: "Lesión B (Esporulación)", confianza: 92, x: 0.5, y: 0.25, w: 0.1, h: 0.07 },
    { etiqueta: "Lesión C (Inicial)", confianza: 85, x: 0.35, y: 0.5, w: 0.14, h: 0.1 },
    { etiqueta: "Lesión D", confianza: 81, x: 0.6, y: 0.55, w: 0.12, h: 0.08 },
    { etiqueta: "Lesión E", confianza: 78, x: 0.45, y: 0.7, w: 0.11, h: 0.07 },
    { etiqueta: "Lesión F", confianza: 74, x: 0.7, y: 0.35, w: 0.1, h: 0.07 },
    { etiqueta: "Lesión G", confianza: 69, x: 0.3, y: 0.8, w: 0.13, h: 0.09 },
    { etiqueta: "Lesión H", confianza: 64, x: 0.15, y: 0.6, w: 0.1, h: 0.06 },
  ],
  recomendacion: {
    producto: "Fungicida (Triazol + Estrob.)",
    dosis: "400 cc/Ha",
    ventanaAplicacion: "4 hs",
    costoEstimadoHa: "$28/Ha",
  },
  analisis:
    "Eficacia contra la roya en ensayos de campo. La combinación Triazol + Estrobilurina ofrece control preventivo, curativo y antiestresantes.",
};

/* ===== Catálogo de plagas para el modal ===== */
export interface PlagaCatalogo {
  nombre: string;
  tecnico: string;
  tipo: "Insecto" | "Hongo" | "Maleza";
}

export const CATALOGO_PLAGAS: PlagaCatalogo[] = [
  { nombre: "Oruga Cogollera", tecnico: "Oruga Cogollera (Spodoptera frugiperda)", tipo: "Insecto" },
  { nombre: "Pulgón Verde", tecnico: "Pulgón Verde (Schizaphis graminum)", tipo: "Insecto" },
  { nombre: "Chinche Verde", tecnico: "Chinche Verde (Nezara viridula)", tipo: "Insecto" },
  { nombre: "Roya Común", tecnico: "Roya Común (Puccinia sorghi)", tipo: "Hongo" },
  { nombre: "Tizón del Maíz", tecnico: "Tizón del Maíz (Exserohilum turcicum)", tipo: "Hongo" },
  { nombre: "Mancha Marrón", tecnico: "Mancha Marrón (Septoria glycines)", tipo: "Hongo" },
  { nombre: "Esclerotinia", tecnico: "Esclerotinia (Sclerotinia sclerotiorum)", tipo: "Hongo" },
  { nombre: "Cercospora", tecnico: "Cercospora (Mancha Gris)", tipo: "Hongo" },
  { nombre: "Yuyo Colorado", tecnico: "Yuyo Colorado (Amaranthus quitensis)", tipo: "Maleza" },
  { nombre: "Rama Negra", tecnico: "Rama Negra (Conyza bonariensis)", tipo: "Maleza" },
];

/* ===== Helpers ===== */
export function severidadDesdeIncidencia(incidencia: number): "Baja" | "Media" | "Alta" {
  if (incidencia <= 20) return "Baja";
  if (incidencia <= 50) return "Media";
  return "Alta";
}

export function toneDesdeSeveridad(sev: string): RiesgoTone {
  const s = (sev || "").toLowerCase();
  if (s === "alta" || s === "crítica" || s === "critica") return "red";
  if (s === "media") return "amber";
  return "green";
}

export function tiempoRelativo(fecha: string | Date): string {
  const d = new Date(fecha);
  const diffMs = Date.now() - d.getTime();
  const horas = Math.floor(diffMs / 3600000);
  if (horas < 1) return "Hace minutos";
  if (horas < 24) return `Hace ${horas}h`;
  if (horas < 48) return "Ayer";
  return `Hace ${Math.floor(horas / 24)} días`;
}

const GRADIENTES = [
  "linear-gradient(135deg,#4f9d52,#3aa6d9)",
  "linear-gradient(135deg,#6db870,#4f9d52)",
  "linear-gradient(135deg,#9ecf8c,#6db870)",
  "linear-gradient(135deg,#a88032,#d9a538)",
  "linear-gradient(135deg,#e8b94a,#d9a538)",
];

const EMOJI_TIPO: Record<string, string> = {
  Insecto: "🐛",
  Hongo: "🍂",
  Maleza: "🌱",
  Bacteria: "🦠",
  Virus: "🧬",
};

export interface AlertaApi {
  id: string;
  loteId: string;
  plaga: string;
  tipo: string;
  severidad: string;
  confianza: number;
  fechaDeteccion: string;
  metodoDeteccion: string;
  areaAfectada: number | null;
  recomendacion: string;
  lote?: { nombre: string } | null;
}

export function alertaApiARow(a: AlertaApi, i: number): AlertaRow {
  const ha = a.areaAfectada ?? 0;
  const perdidaUsd = Math.round(ha * 150);
  return {
    id: a.id,
    loteId: a.loteId,
    lote: a.lote?.nombre || "Lote",
    enfermedad: a.plaga,
    estadio: a.tipo,
    img: EMOJI_TIPO[a.tipo] || "🌾",
    imgBg: GRADIENTES[i % GRADIENTES.length],
    deteccion: a.metodoDeteccion?.startsWith("IA") ? "Detección Satelital NDVI" : "Foto de Campo",
    afect: `${ha || "—"} Ha afectadas · ${tiempoRelativo(a.fechaDeteccion)}`,
    haAfectadas: ha,
    riesgo: `${a.severidad.toUpperCase()} (${Math.round(a.confianza)}%)`,
    riesgoColor: toneDesdeSeveridad(a.severidad),
    perdida: `$${perdidaUsd.toLocaleString("es-AR")} USD`,
    proy: "Estimación IA",
    recom: a.recomendacion || "Monitoreo Intensivo",
    iaIcon: a.metodoDeteccion?.startsWith("IA"),
  };
}
