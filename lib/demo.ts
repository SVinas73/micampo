/**
 * Modo demo del sistema.
 *
 * Por defecto el sistema arranca en 0/vacío: no se muestra ningún dato de
 * ejemplo y la interfaz queda lista para datos reales (las pantallas reemplazan
 * estos valores con lo que devuelven las APIs cuando hay datos en la base).
 *
 * Robustez: el modo demo SOLO puede activarse fuera de producción y de forma
 * explícita (NEXT_PUBLIC_DEMO_MODE="true"). Aunque alguien deje la flag activa
 * por error, en producción NUNCA se renderizan datos de ejemplo. Esto protege
 * la regla "dato real o en 0" frente a un cliente.
 */
const flagDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const MODO_DEMO = flagDemo && process.env.NODE_ENV !== "production";

/**
 * Devuelve el valor de ejemplo cuando el modo demo está activo,
 * o el valor "vacío" (0, [], "—", etc.) cuando está desactivado.
 *
 *   useState(demo(DEMO_EMPLEADOS, []))   // [] con MODO_DEMO=false
 *   useState(demo(648, 0))               // 0  con MODO_DEMO=false
 */
export function demo<T>(ejemplo: T, vacio: T): T {
  return MODO_DEMO ? ejemplo : vacio;
}
