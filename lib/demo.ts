/**
 * Modo demo del sistema.
 *
 * Con `MODO_DEMO = false` el sistema arranca completamente en 0/vacío:
 * no se muestra ningún dato de ejemplo y la interfaz queda lista para
 * cargar datos reales (las pantallas siguen reemplazando estos valores
 * con lo que devuelven las APIs cuando hay datos en la base).
 *
 * Para volver a mostrar los datos de demostración, poné `MODO_DEMO = true`.
 */
export const MODO_DEMO = false;

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
