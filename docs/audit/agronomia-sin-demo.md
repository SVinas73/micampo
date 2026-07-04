# Agronomía — eliminación de datos demo/hardcodeados del bundle (COMPLETADO)

Estado: en producción NO se muestra ningún dato demo/hardcodeado, y además se quitó
todo el andamiaje demo del bundle de Agronomía.

## Hecho
- [x] components/campo-digital/TabLotes.tsx — demo(LOTES_INICIALES, []) → []
- [x] components/campo-digital/lotes-data.ts — LOTES_INICIALES, LOTES_GEO, GEO_METRICAS, LISTA_EXTRAS, LABORES_EJEMPLO eliminados (dead)
- [x] components/campo-digital/TabLabores.tsx — DEMO_LABORES, BLOQUEADAS_DEMO, lotes/cronos demo → vacíos; import demo removido
- [x] components/campo-digital/TabDeteccion.tsx — ALERTAS_DEMO → []; import removido
- [x] components/campo-digital/TabCultivos.tsx — PLANES_ACTIVOS_DEMO, PLANES_IA_DEMO, lotesAnalisis demo → vacíos; import removido; KPIs Análisis de Suelo reales
- [x] components/campo-digital/deteccion-ReportarModal.tsx — lote demo → lotes reales; import removido
- [x] app/(dashboard)/clima/page.tsx — DEMO_LOTES, DEMO_LLUVIAS, DEMO_ALERTAS → []; import removido

## Verificado
- Sin Math.random en APIs de Agronomía.
- Sin defaults numéricos fabricados mostrados como reales (solo referencias agronómicas y estilos).
- tsc limpio · build ✓ · 28/28 tests.

## Stragglers encontrados en modales/wizard (2ª pasada)
- [x] components/clima/ClimaModales.tsx — "Campo El Amanecer" hardcodeado (ubicación de lluvia + header del selector) → nombres reales de lote / establecimiento activo.
- [x] app/(dashboard)/clima/page.tsx — histórico de lluvias: lote borrado (loteId nulo) muestra "Campo General", no un nombre de campo obsoleto.
- [x] components/campo-digital/lotes-Modales.tsx — TimelineLoteModal: timeline de ejemplo hardcodeada → solo eventos reales + estado vacío.
- [x] components/campo-digital/labores-Wizard.tsx — validaciones "Clima/Maquinaria/Operario" fabricadas → validaciones reales (maquinaria/stock/operario).
- [x] Verificado: sin Math.random en APIs de Agronomía; tsc/build/28 tests OK.
