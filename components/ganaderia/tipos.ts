// Tipos y helpers compartidos del módulo Ganadería.
// La UI trabaja con AnimalRow (derivado del shape real de /api/animales).

export type TropaLite = { id: string; nombre: string };

export type RegistroPesoAPI = {
  id: string;
  fecha: string;
  peso: number;
  gananciaPromedioDiaria?: number | null;
};

export type RegistroLecheroAPI = {
  id: string;
  fecha: string;
  litros: number;
  turno?: string | null;
};

export type HistorialReproAPI = {
  estadoActual: string;
  totalPartos: number;
  totalCriasNacidas: number;
  totalCriasVivas: number;
  ultimoParto?: string | null;
  ultimoServicio?: string | null;
  ultimoDiagnostico?: string | null;
  fechaEsperadaParto?: string | null;
} | null;

export type TratamientoAPI = {
  id: string;
  tipo: string;
  diagnostico: string;
  zona?: string | null;
  sintomas?: string | null;
  severidad?: string | null;
  medicamento?: string | null;
  dosis?: string | null;
  via?: string | null;
  dosisTotales: number;
  dosisAplicadas: number;
  proximaDosis?: string | null;
  proximoControl?: string | null;
  retiroHoras?: number | null;
  finRetiro?: string | null;
  marcaZonas?: string | null;
  marcaColor?: string | null;
  estado: string;
  fechaInicio: string;
  fechaFin?: string | null;
  responsable?: string | null;
  costo?: number | null;
  origenIA?: boolean;
  animal?: {
    id: string;
    caravana: string;
    nombre?: string | null;
    categoria?: string | null;
    raza?: string | null;
    ubicacion?: string | null;
    foto?: string | null;
    tropa?: { nombre: string } | null;
  };
};

export type EventoReproAPI = {
  id: string;
  tipo: string;
  fecha: string;
  tipoServicio?: string | null;
  toroId?: string | null;
  semenId?: string | null;
  resultado?: string | null;
  diasGestacion?: number | null;
  numCrias?: number | null;
  condicionParto?: string | null;
  observaciones?: string | null;
};

export type AnimalAPI = {
  id: string;
  caravana: string;
  nombre?: string | null;
  tipo: string;
  categoria?: string | null;
  raza?: string | null;
  sexo: string;
  fechaNacimiento?: string | null;
  pesoNacimiento?: number | null;
  madre?: string | null;
  padre?: string | null;
  estado: string;
  rfid?: string | null;
  origen?: string | null;
  condicionNacimiento?: string | null;
  foto?: string | null;
  ubicacion?: string | null;
  fechaBaja?: string | null;
  motivoBaja?: string | null;
  tropaId?: string | null;
  tropa?: TropaLite | null;
  registrosPeso?: RegistroPesoAPI[];
  registrosLecheros?: RegistroLecheroAPI[];
  historialReproductivo?: HistorialReproAPI;
  tratamientos?: TratamientoAPI[];
  eventosReproductivos?: EventoReproAPI[];
  createdAt?: string;
};

export type BajaInfo = {
  tipo: string;
  subcausa?: string | null;
  fecha: string;
  notas?: string;
};

export type AnimalRow = {
  dbId: string;
  id: string; // caravana visible (ej "#4092")
  nombre: string | null;
  tipo: string;
  categoria: string;
  raza: string;
  sexo: "M" | "H";
  edad: string;
  edadMeses: number | null;
  peso: string; // "480" | "N/A"
  pesoNum: number | null;
  prod: string; // "22 lt/día" | "—"
  prodNum: number | null;
  estado: string;
  estadoC: "green" | "red" | "amber" | "blue";
  lote: string;
  tags: string[];
  ok: boolean;
  activo: boolean;
  baja: BajaInfo | null;
  tropaId: string | null;
  rfid: string | null;
  madre: string | null;
  padre: string | null;
  fechaNacimiento: string | null;
  // Ciclo reproductivo (para AnimRepro)
  cicloEstado: "prenada" | "celo" | "inseminada" | "vacia" | "perdida" | "sin-datos";
  dia: number; // días de gestación
  parto: string; // fecha probable de parto formateada
  fechaCelo: string | null;
  fechaServicio: string | null;
  fechaDiagnostico: string | null;
  resultadoDiagnostico: string | null;
  fechaPerdida: string | null;
  perdidaHace: number | null;
  celoDesde: string | null;
  toro: string | null;
  cat: string; // alias de categoria (la referencia usa .cat en sanidad)
  tratamientosActivos: TratamientoAPI[];
  api: AnimalAPI;
};

const MS_DIA = 24 * 3600 * 1000;

export function fmtFecha(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtFechaCorta(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function calcEdad(fechaNacimiento: string | null | undefined): { label: string; meses: number | null } {
  if (!fechaNacimiento) return { label: "—", meses: null };
  const nac = new Date(fechaNacimiento);
  if (isNaN(nac.getTime())) return { label: "—", meses: null };
  const meses = Math.max(0, Math.floor((Date.now() - nac.getTime()) / (30.44 * MS_DIA)));
  if (meses < 12) return { label: `${meses}m`, meses };
  const anios = Math.floor(meses / 12);
  return { label: `${anios}a`, meses };
}

export function haceCuanto(fecha: string | Date | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const dias = Math.floor((Date.now() - d.getTime()) / MS_DIA);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 30) return `hace ${dias} días`;
  return fmtFecha(d);
}

/** Días de gestación estimados hoy (a partir del último diagnóstico Preñada). */
function diasGestacionHoy(h: HistorialReproAPI, eventos: EventoReproAPI[]): number {
  if (!h?.fechaEsperadaParto) return 0;
  const restantes = Math.round((new Date(h.fechaEsperadaParto).getTime() - Date.now()) / MS_DIA);
  return Math.max(1, Math.min(283, 283 - restantes));
}

export function mapAnimal(a: AnimalAPI): AnimalRow {
  const edad = calcEdad(a.fechaNacimiento);
  const ultimoPeso = a.registrosPeso?.[0]?.peso ?? null;
  const ultimaLeche = a.registrosLecheros?.[0] ?? null;
  const lecheReciente =
    ultimaLeche && Date.now() - new Date(ultimaLeche.fecha).getTime() < 45 * MS_DIA
      ? ultimaLeche.litros
      : null;
  const tratActivos = (a.tratamientos || []).filter((t) =>
    ["En curso", "En retiro"].includes(t.estado)
  );
  const activo = !["Vendido", "Muerto", "Baja"].includes(a.estado);
  const h = a.historialReproductivo || null;
  const eventos = a.eventosReproductivos || [];

  // Estado visible + color, derivado de datos reales
  let estado = "Saludable";
  let estadoC: AnimalRow["estadoC"] = "green";
  const tags: string[] = [];
  if (tratActivos.length > 0) {
    estado = tratActivos[0].diagnostico;
    estadoC = tratActivos[0].estado === "En retiro" ? "amber" : "red";
    tags.push(tratActivos[0].diagnostico.toUpperCase().slice(0, 14));
  } else if (h?.estadoActual === "Preñada") {
    estado = "Preñada";
    estadoC = "green";
  } else if (h?.estadoActual === "En Servicio") {
    estado = "En servicio";
    estadoC = "blue";
  } else if (h?.estadoActual === "En Celo") {
    estado = "En celo";
    estadoC = "amber";
  } else if (lecheReciente !== null) {
    estado = "Lactante";
    estadoC = "green";
    tags.push("LACTANTE");
  }
  if (tratActivos.some((t) => t.finRetiro && new Date(t.finRetiro) > new Date())) {
    tags.push("RETIRO");
  }

  // Ciclo reproductivo (para AnimRepro)
  const ultimoEvento = eventos[0] || null;
  let cicloEstado: AnimalRow["cicloEstado"] = "sin-datos";
  let fechaPerdida: string | null = null;
  let perdidaHace: number | null = null;
  if (h?.estadoActual === "Preñada") cicloEstado = "prenada";
  else if (h?.estadoActual === "En Servicio") cicloEstado = "inseminada";
  else if (h?.estadoActual === "En Celo") cicloEstado = "celo";
  else if (h?.estadoActual === "Vacía") cicloEstado = "vacia";
  const evAborto = eventos.find((e) => e.tipo === "Aborto");
  if (evAborto && h?.estadoActual === "Vacía") {
    const dias = Math.floor((Date.now() - new Date(evAborto.fecha).getTime()) / MS_DIA);
    if (dias <= 7) {
      cicloEstado = "perdida";
      fechaPerdida = fmtFecha(evAborto.fecha);
      perdidaHace = dias;
    }
  }

  const evCelo = eventos.find((e) => e.tipo === "Celo");
  const evServicio = eventos.find((e) => e.tipo === "Servicio");
  const evDiag = eventos.find((e) => e.tipo === "Diagnostico");

  return {
    dbId: a.id,
    id: a.caravana.startsWith("#") ? a.caravana : `#${a.caravana}`,
    nombre: a.nombre || null,
    tipo: a.tipo,
    categoria: a.categoria || a.tipo || "—",
    raza: a.raza || "—",
    sexo: a.sexo === "Macho" || a.sexo === "M" ? "M" : "H",
    edad: edad.label,
    edadMeses: edad.meses,
    peso: ultimoPeso !== null ? String(Math.round(ultimoPeso)) : "N/A",
    pesoNum: ultimoPeso,
    prod: lecheReciente !== null ? `${Math.round(lecheReciente)} lt/día` : "—",
    prodNum: lecheReciente,
    estado,
    estadoC,
    lote: a.tropa?.nombre || a.ubicacion || "—",
    tags,
    ok: tratActivos.length === 0,
    activo,
    baja: activo
      ? null
      : {
          tipo: a.motivoBaja || a.estado,
          fecha: a.fechaBaja || "",
          notas: "",
        },
    tropaId: a.tropaId || null,
    rfid: a.rfid || null,
    madre: a.madre || null,
    padre: a.padre || null,
    fechaNacimiento: a.fechaNacimiento || null,
    cicloEstado,
    dia: diasGestacionHoy(h, eventos),
    parto: h?.fechaEsperadaParto ? fmtFecha(h.fechaEsperadaParto) : "—",
    fechaCelo: evCelo ? fmtFecha(evCelo.fecha) : null,
    fechaServicio: evServicio ? fmtFecha(evServicio.fecha) : null,
    fechaDiagnostico: evDiag ? fmtFecha(evDiag.fecha) : null,
    resultadoDiagnostico: evDiag?.resultado || null,
    fechaPerdida,
    perdidaHace,
    celoDesde: cicloEstado === "celo" && evCelo ? haceCuanto(evCelo.fecha) : null,
    toro: evServicio ? evServicio.semenId || evServicio.toroId || null : null,
    cat: a.categoria || a.tipo || "—",
    tratamientosActivos: tratActivos,
    api: a,
  };
}

/** Unidades animal (EV) aproximadas por categoría, para carga animal. */
export function unidadesAnimal(categoria: string | null | undefined): number {
  switch ((categoria || "").toLowerCase()) {
    case "vaca":
      return 1;
    case "toro":
      return 1.3;
    case "novillo":
      return 0.7;
    case "vaquillona":
      return 0.7;
    case "ternero":
    case "ternera":
      return 0.35;
    default:
      return 0.8;
  }
}

export const nfES = (n: number, dec = 0) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
