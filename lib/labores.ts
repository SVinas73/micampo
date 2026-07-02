/**
 * Estado efectivo de una labor, derivado por fecha.
 * El estado "Atrasada" NO se persiste en la base (Labor.estado default "Programada"),
 * así que se calcula en lectura: una tarea abierta cuya fecha ya pasó está "Atrasada".
 * Se comparte entre TabLabores, TabResumen y el dashboard para no divergir.
 */

// Estados de ciclo de vida que fija el usuario y NO dependen de la fecha.
export const ESTADOS_FIJOS_LABOR = ["Completada", "En curso", "Pausada"];

/** Estado según la fecha para una tarea abierta: vencida→Atrasada, hoy→Hoy, futura→Programada. */
export function estadoPorFechaLabor(fechaISO?: string): "Atrasada" | "Hoy" | "Programada" {
  const solo = (fechaISO || "").slice(0, 10);
  const hoy = new Date().toISOString().slice(0, 10);
  if (!solo) return "Programada";
  return solo < hoy ? "Atrasada" : solo === hoy ? "Hoy" : "Programada";
}

/**
 * Deriva el estado a mostrar: respeta los estados de ciclo (Completada / En curso /
 * Pausada) y recalcula el resto por fecha. Así una tarea "Programada" cuya fecha ya
 * pasó se muestra como "Atrasada" en todas las pantallas.
 */
export function derivarEstadoLabor(estadoGuardado: string | undefined, fechaISO?: string): string {
  if (estadoGuardado && ESTADOS_FIJOS_LABOR.includes(estadoGuardado)) return estadoGuardado;
  if (estadoGuardado === "Bloqueada") return "Atrasada";
  return estadoPorFechaLabor(fechaISO);
}
