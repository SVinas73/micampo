// Tipos y helpers del módulo Trazabilidad.
// La configuración regulatoria por país es constante de dominio (organismos,
// sistemas y plazos legales reales), no dato demo. Todo lo demás se deriva de
// datos reales: /api/animales (identificación de terneros), /api/documentos-transito
// y /api/auditorias-trazabilidad.

import { AnimalRow } from "./tipos";

const MS_DIA = 86400000;

export type PaisKey = "uruguay" | "argentina";

export type ConfigPais = {
  pais: string;
  bandera: string;
  organismo: string;
  sistema: string;
  identificadorEstablecimiento: string;
  documentoTransito: string;
  edadLimiteDias: number; // edad a la que un ternero debe estar identificado
  plazoDeclaracionDias: number; // días hábiles para declarar tras aplicar el dispositivo
  tieneCertificadoSanitario: boolean; // CSM / seronegatividad a brucelosis
};

/* ============ CONFIGURACIÓN REGULATORIA POR PAÍS ============ */
export const CONFIG_REGULATORIO: Record<PaisKey, ConfigPais> = {
  uruguay: {
    pais: "Uruguay",
    bandera: "🇺🇾",
    organismo: "MGAP",
    sistema: "SNIG",
    identificadorEstablecimiento: "DICOSE",
    documentoTransito: "Despacho de Tropa",
    edadLimiteDias: 180, // 6 meses
    plazoDeclaracionDias: 7,
    tieneCertificadoSanitario: false,
  },
  argentina: {
    pais: "Argentina",
    bandera: "🇦🇷",
    organismo: "SENASA",
    sistema: "SIGSA",
    identificadorEstablecimiento: "RENSPA",
    documentoTransito: "DT-e",
    edadLimiteDias: 180, // identificación previa al primer movimiento / 6 meses
    plazoDeclaracionDias: 10,
    tieneCertificadoSanitario: true,
  },
};

export const PAISES = Object.keys(CONFIG_REGULATORIO) as PaisKey[];

/* Badge de urgencia por días restantes (compartido entre Resumen e Identificación) */
export function badgeDias(dias: number): { label: string; tone: "red" | "amber" | "green" } {
  if (dias < 0) return { label: `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}`, tone: "red" };
  if (dias === 0) return { label: "Vence hoy", tone: "red" };
  if (dias <= 5) return { label: `${dias} día${dias === 1 ? "" : "s"} restantes`, tone: "amber" };
  return { label: `${dias} días restantes`, tone: "green" };
}

export function fmtDDMMYYYY(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/* ============ TERNEROS PENDIENTES DE IDENTIFICAR (datos reales) ============ */
export type TernPend = {
  animal: AnimalRow;
  id: string; // caravana visible
  cat: string;
  nacimiento: string; // dd/mm/yyyy o "—"
  edadDias: number | null;
  dias: number; // días restantes hasta el límite de edad
  razon: string | null;
  estado: "Vencido" | "Urgente" | "Pendiente";
};

/** Terneros activos sin dispositivo RFID, con días restantes hasta el límite de edad del país. */
export function ternerosPendientes(animales: AnimalRow[], cfg: ConfigPais): TernPend[] {
  const hoy = Date.now();
  return animales
    .filter((a) => a.activo && !a.rfid && /ternero|ternera/i.test(`${a.categoria} ${a.cat}`))
    .map((a) => {
      const nac = a.fechaNacimiento ? new Date(a.fechaNacimiento) : null;
      let dias = 9999;
      let razon: string | null = null;
      let nacStr = "—";
      let edadDias: number | null = null;
      if (nac && !isNaN(nac.getTime())) {
        edadDias = Math.floor((hoy - nac.getTime()) / MS_DIA);
        const limite = new Date(nac);
        limite.setDate(limite.getDate() + cfg.edadLimiteDias);
        dias = Math.round((limite.getTime() - hoy) / MS_DIA);
        razon = `Límite: ${cfg.edadLimiteDias} días de edad`;
        nacStr = fmtDDMMYYYY(nac);
      }
      const estado: TernPend["estado"] = dias < 0 ? "Vencido" : dias < 3 ? "Urgente" : "Pendiente";
      return { animal: a, id: a.id, cat: a.categoria, nacimiento: nacStr, edadDias, dias, razon, estado };
    })
    .sort((x, y) => x.dias - y.dias);
}

/* ============ DOCUMENTOS DE TRÁNSITO (datos reales) ============ */
export type DTEApi = {
  id: string;
  numero: string;
  fecha: string;
  origen?: string | null;
  destino?: string | null;
  motivo?: string | null;
  categoria?: string | null;
  cabezas?: number | null;
  pesoTotal?: number | null;
  precioKg?: number | null;
  importe?: number | null;
  transporte?: string | null;
  vencimiento?: string | null;
  estado: string; // Vigente, Usado, Vencido, Anulado
  notas?: string | null;
};

export const dteAbierto = (d: DTEApi) => d.estado === "Vigente";

export function dteEstadoView(estado: string): { label: string; tone: "green" | "blue" | "red" | "neutral" } {
  if (estado === "Vigente") return { label: "Abierto", tone: "blue" };
  if (estado === "Usado") return { label: "Cerrado", tone: "green" };
  if (estado === "Vencido") return { label: "Vencido", tone: "red" };
  return { label: estado, tone: "neutral" };
}

export function esMismoMes(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

/* ============ AUDITORÍAS (datos reales) ============ */
export type AuditoriaApi = {
  id: string;
  fecha: string;
  tipo: string;
  organismo?: string | null;
  alcance?: string | null;
  resultado?: string | null;
  observaciones?: string | null;
  proximaFecha?: string | null;
};

export function resultadoTone(r?: string | null): "green" | "red" | "amber" {
  if (!r) return "amber";
  if (/aprobad/i.test(r) && !/observ/i.test(r)) return "green";
  if (/rechaz|no aprob/i.test(r)) return "red";
  return "amber";
}

/* ============ INCUMPLIMIENTOS (derivados de datos reales) ============ */
export type Incumpl = {
  sev: "red" | "amber";
  tipo: string;
  ref: string;
  estado: "Pendiente" | "Resuelto";
  diasAbierto?: number;
};

/** Incumplimientos derivados: terneros vencidos/urgentes de identificar + DTE vencidos sin cerrar. */
export function incumplimientos(terneros: TernPend[], dtes: DTEApi[]): Incumpl[] {
  const list: Incumpl[] = [];
  for (const t of terneros.filter((t) => t.dias < 0)) {
    list.push({ sev: "red", tipo: "Identificación vencida sin declarar", ref: `Animal ${t.id}`, estado: "Pendiente", diasAbierto: Math.abs(t.dias) });
  }
  const hoy = Date.now();
  for (const d of dtes.filter((d) => d.estado === "Vencido")) {
    const dd = Math.max(0, Math.round((hoy - new Date(d.vencimiento || d.fecha).getTime()) / MS_DIA));
    list.push({ sev: "red", tipo: "Documento de tránsito vencido sin cerrar", ref: `N° ${d.numero}`, estado: "Pendiente", diasAbierto: dd });
  }
  for (const t of terneros.filter((t) => t.dias >= 0 && t.dias < 3)) {
    list.push({ sev: "amber", tipo: "Identificación próxima a vencer", ref: `Animal ${t.id}`, estado: "Pendiente", diasAbierto: Math.max(0, t.dias) });
  }
  return list;
}

/* ============ ACTIVIDAD RECIENTE (derivada de datos reales) ============ */
export type ActItem = { fecha: string; accion: string; tipo: string; ts: number };

export function actividadReciente(dtes: DTEApi[], auditorias: AuditoriaApi[]): ActItem[] {
  const items: ActItem[] = [];
  const fmt = (iso: string) => {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  for (const d of dtes) {
    const v = dteEstadoView(d.estado);
    items.push({
      fecha: fmt(d.fecha),
      accion: `${d.numero} — ${v.label}${d.destino ? ` · ${d.destino}` : ""}${d.cabezas ? ` (${d.cabezas} cab.)` : ""}`,
      tipo: "route",
      ts: new Date(d.fecha).getTime(),
    });
  }
  for (const a of auditorias) {
    items.push({
      fecha: fmt(a.fecha),
      accion: `Auditoría ${a.organismo || a.tipo}${a.resultado ? ` — ${a.resultado}` : ""}`,
      tipo: "shieldCheck",
      ts: new Date(a.fecha).getTime(),
    });
  }
  return items.sort((a, b) => b.ts - a.ts).slice(0, 6);
}
