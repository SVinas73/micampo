# Agronomía — eliminación de datos demo/hardcodeados del bundle

Objetivo: que en producción NO se muestre ningún dato demo/hardcodeado (ya garantizado
por lib/demo.ts en prod) Y además quitar el andamiaje demo del bundle de Agronomía.
Estado verificado antes de empezar: prod ya no muestra datos falsos (todos los demo()
tienen fallback honesto []/0/"—"; sin Math.random en APIs; sin defaults fabricados).

## Checklist (marcar HECHO al terminar cada archivo)
- [ ] components/campo-digital/TabLotes.tsx — demo(LOTES_INICIALES, [])
- [ ] components/campo-digital/TabLabores.tsx — DEMO_LABORES, BLOQUEADAS_DEMO, lotes demo, cronos demo
- [ ] components/campo-digital/TabDeteccion.tsx — ALERTAS_DEMO
- [ ] components/campo-digital/TabCultivos.tsx — PLANES_ACTIVOS_DEMO, PLANES_IA_DEMO, lotesAnalisis demo
- [ ] app/(dashboard)/clima/page.tsx — DEMO_LOTES, DEMO_LLUVIAS, DEMO_ALERTAS
- [x] components/campo-digital/TabCultivos.tsx — KPIs Análisis de Suelo → reales (HECHO)
- [x] components/campo-digital/deteccion-ReportarModal.tsx — lote demo (HECHO)

Regla al reanudar: por cada archivo, reemplazar demo(CONST, vacio) por `vacio`, borrar la
constante CONST y el import demo si queda sin uso; correr tsc+build+test; commitear.
