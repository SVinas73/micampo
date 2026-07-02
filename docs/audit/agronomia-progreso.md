# Auditoría módulo Agronomía — progreso

Tracker durable para reanudar si se corta por tokens. Datos crudos en `agronomia-findings.json`.

**Resumen:** 58 HECHO · 2 DIFERIDO · 54 PENDIENTE (de 114).

## PENDIENTES (por severidad)

| id | sev | cat | archivo:línea | hallazgo |
|----|-----|-----|---------------|----------|
| `71e719d9` | media | bug | app/(dashboard)/calculadora-dosis/page.tsx:171 | Al usar un preestablecido del usuario se arrastra un loteId obsoleto que puede romper el guardado (FK inexistente → 500) |
| `828d47af` | media | inconsistencia | app/(dashboard)/calculadora-dosis/page.tsx:191 | Botón 'Riego + agroquímico' de Inicio abre una calculadora genérica de herbicida, no de fertirriego |
| `37140ed1` | media | bug | app/(dashboard)/campo-digital/page.tsx:36 | Mecanismo de header actions (ActionsProvider/useHeaderActions) es código muerto: ningún tab inyecta acciones |
| `9d281b08` | media | responsive | app/(dashboard)/clima/page.tsx:868 | Filas del histórico de lluvias y de alertas usan grid de columnas fijas sin colapso ni scroll en mobile |
| `62b61ec0` | media | scope | app/api/alertas-climaticas/route.ts:14 | Las alertas climáticas no reaccionan al establecimiento/lote del sidebar |
| `a7546ecc` | media | kpi-datos | components/campo-digital/TabCultivos.tsx:79 | KPI 'Planes Aprobados' y la lista quedan stale tras Convertir/Descartar (no re-fetch) |
| `84ed58ba` | media | bug | components/campo-digital/TabCultivos.tsx:651 | Botón 'Editar' de un Plan Activo abre 'Nueva Siembra' en blanco (no edita el plan) |
| `3ef3ad2f` | media | cross-module | components/campo-digital/TabCultivos.tsx:62 | Selección de un lote individual en el sidebar no filtra Estados ni Distribución |
| `3bf2e284` | media | responsive | components/campo-digital/TabCultivos.tsx:307 | Grillas internas de 4 columnas fijas sin colapso en mobile (overflow) |
| `f180f8eb` | media | cross-module | components/campo-digital/TabDeteccion.tsx:320 | 'Presión pronosticada' no reacciona al alcance Campo/Lote |
| `ae0f4b78` | media | kpi-datos | components/campo-digital/TabDeteccion.tsx:139 | KPIs 'Confianza IA', 'NDVI', 'Riesgo Economico' y 'Monitoreo Semanal' son placeholders sin cálculo real (siempre '—') |
| `fb4edadb` | media | bug | components/campo-digital/TabLotes.tsx:691 | Notas georreferenciadas nuevas no aparecen en el mapa hasta remontar (efecto keyed en lotes.length que no cambia) |
| `05854bf7` | media | scope | components/campo-digital/TabLotes.tsx:67 | El alcance global de LOTE (loteId del sidebar) es ignorado: la pestaña solo reacciona al establecimiento |
| `877739f9` | media | bug | components/campo-digital/TabLotes.tsx:532 | Filtro de cultivo incompleto: no incluye Cebada/Sorgo/Avena/Trébol, imposible aislar esos lotes |
| `57ee955e` | media | kpi-datos | components/campo-digital/TabLotes.tsx:489 | Deltas de KPI con flecha verde 'up' placeholder: no representan tendencia real |
| `ec901cc8` | media | inconsistencia | components/campo-digital/TabLotes.tsx:207 | Estadio fenológico inventado 'Vegetativo' al crear lote con cultivo (inconsistente con el estado tras recargar) |
| `e65d5d31` | media | dato-falso | components/campo-digital/TabLotes.tsx:493 | KPI 'Marcadores' en TabLotes hardcodeada (demo '14'/'0') pese a fetchear marcadores reales |
| `9428ef27` | media | dato-falso | components/campo-digital/TabResumen.tsx:135 | Todas las 'Últimas actividades' se atribuyen al usuario logueado (nombre + foto), ignorando operarios/aplicadoPor reales |
| `a38d99c2` | media | kpi-datos | components/campo-digital/TabResumen.tsx:95 | Con un establecimiento filtrado, los otros campos de la card 'Campos y lotes' muestran 0 ha si no tienen hectareasTotales cargadas |
| `4bc5d742` | media | dato-falso | components/campo-digital/labores-Wizard.tsx:49 | Wizard 'Nueva Orden' lleno de datos hardcodeados presentados como reales |
| `20ffc892` | media | dato-falso | components/campo-digital/lotes-data.ts:158 | Badge 'Saludable' por defecto sin dato: lotes sin NDVI se muestran siempre como saludables |
| `bd614e26` | media | bug | components/clima/RadarReal.tsx:30 | El radar no se re-centra al cambiar de establecimiento/lote (queda en el campo anterior) |
| `c8ed4a6e` | media | kpi-datos | components/plan-riego/AguaUlt30Dias.tsx:35 | '% vs histórico' compara lluvia+riego contra un promedio histórico que es sólo lluvia (comparación inflada) |
| `2c401f1a` | media | inconsistencia | components/plan-riego/BalanceHidrico.tsx:130 | Inconsistencia de 'agua útil': el KPI de la página usa s0% y el card del gráfico usa conRiego[0]% (números distintos en la misma pantalla) |
| `820ee3aa` | media | bug | components/plan-riego/BalanceHidrico.tsx:104 | Las barras IA del gráfico etiquetan mm por orden de barra, no por sugerencia (desalineación posible) |
| `9e326dfc` | media | bug | components/plan-riego/RegistrarRiegoModal.tsx:260 | Input 'Duración estimada' del modal manual es un control muerto (sin estado ni onChange) |
| `3b89d333` | media | bug | components/plan-riego/RegistrarRiegoModal.tsx:66 | Preselección de sugerencias IA hardcodeada a los índices 0 y 1 (asume exactamente 2 sugerencias) |
| `6d6b21d9` | baja | inconsistencia | app/(dashboard)/clima/page.tsx:179 | Inconsistencia en el % de la barra de mm entre registro nuevo y recargado (base 50 vs máximo real) |
| `30dd7e53` | baja | bug | app/(dashboard)/clima/page.tsx:753 | 'Días sin lluvia' puede quedar negativo y el gráfico usa fecha local sobre ISO UTC (riesgo de mes/día corrido) |
| `919ddb05` | baja | kpi-datos | app/(dashboard)/cuaderno-campo/page.tsx:43 | 'Lotes con registro' cuenta por nombre de lote, no por id: nombres duplicados colapsan el conteo |
| `c53e2955` | baja | estetica | app/(dashboard)/cuaderno-campo/page.tsx:90 | Flecha de tendencia verde 'up' en KPIs sin comparación real (delta puramente descriptivo) |
| `a75fb257` | baja | bug | app/(dashboard)/cuaderno-campo/page.tsx:121 | Uso de índice de array como key de React en la lista de registros |
| `49ec018b` | baja | inconsistencia | app/(dashboard)/plan-riego/page.tsx:199 | plan-riego persiste etapaFenologica y tipoSuelo hardcodeados, ignorando la etapa elegida por el usuario |
| `6043e6c5` | baja | inconsistencia | app/(dashboard)/plan-riego/page.tsx:232 | Estados de evento inconsistentes: la UI mezcla 'Programado', 'ejecutado' y 'Reporte manual' pero el timeline sólo formatea 'ejecutado' |
| `d36dee90` | baja | inconsistencia | app/(dashboard)/plan-riego/page.tsx:199 | El plan de riego se crea con etapaFenologica y laminaRiego que ignoran la etapa/estrategia real seleccionada |
| `8112ac2a` | baja | scope | app/api/clima/pronostico/route.ts:20 | Endpoint /api/clima/pronostico (OpenWeather) es código muerto y depende de una API key ausente |
| `5e315662` | baja | dato-falso | app/api/lotes/[id]/prescripcion/route.ts:65 | Mapa de prescripción variable con NDVI sintético cuando Sentinel no está configurado, y ahorro% calculado sobre datos fabricados |
| `10539c84` | baja | scope | app/api/rotaciones-cultivo/route.ts:25 | Endpoint /api/rotaciones-cultivo sin ningún consumidor (feature no cableada) |
| `b1251ec3` | baja | estetica | components/calculadora/calc.ts:3 | El costo se rotula 'USD' pero se formatea con separadores es-AR y se redondea a 0 decimales, perdiendo centavos |
| `b8d826d7` | baja | scope | components/calculadora/presets.ts:79 | HISTORIAL_DEMO y PRESETS son datos demo hardcodeados que quedaron en el bundle (código muerto) |
| `19add1d2` | baja | bug | components/campo-digital/LoteOverlay.tsx:137 | Predicción de rinde (IA): fallo silencioso sin feedback al usuario |
| `36b8b998` | baja | bug | components/campo-digital/TabCultivos.tsx:492 | Doble fetch simultáneo idéntico a /api/planes-siembra al montar el Planificador |
| `05a0822d` | baja | responsive | components/campo-digital/TabCultivos.tsx:879 | Tarjetas de Análisis de Suelo con grid interno fijo de 4 columnas sin colapso en mobile |
| `9136db1a` | baja | dato-falso | components/campo-digital/TabCultivos.tsx:175 | Cosecha de ejemplo (cultivosListos demo) puede filtrar loteIds reales del scope al modal de cosecha |
| `cf051573` | baja | inconsistencia | components/campo-digital/TabCultivos.tsx:554 | Mensaje de error del Planificador engañoso cuando no hay lote seleccionado |
| `1b447fd8` | baja | bug | components/campo-digital/TabCultivos.tsx:81 | Fetch duplicado de /api/planes-siembra en el modo Planificador |
| `0934f9a2` | baja | inconsistencia | components/campo-digital/TabDeteccion.tsx:249 | prob por defecto 60% en Estrategia de Control cuando la alerta viene de la API (riesgo sin %) |
| `15a8348f` | baja | inconsistencia | components/campo-digital/TabDeteccion.tsx:249 | Probabilidad por defecto 60% en Estrategia de Control cuando la alerta viene de la API (riesgo sin %) |
| `b41d4305` | baja | inconsistencia | components/campo-digital/TabLabores.tsx:152 | La prioridad 'baja' nunca se muestra: el mapeo colapsa todo lo no-Urgente a 'media' |
| `de35052d` | baja | estetica | components/campo-digital/TabLotes.tsx:1610 | Modales muestran el ID crudo de base (cuid) del lote en el título |
| `36be3028` | baja | inconsistencia | components/campo-digital/TabResumen.tsx:63 | TabResumen no reacciona al lote activo del sidebar (solo al establecimiento) |
| `c5cce7e2` | baja | inconsistencia | components/campo-digital/TabResumen.tsx:169 | El KPI 'Cultivos distintos' puede mostrar 'Principal: En descanso' (no es un cultivo) |
| `d29dc56f` | baja | estetica | components/campo-digital/TabResumen.tsx:135 | Color de avatar de actividades (#5E8F78) fuera de la paleta oliva |
| `8d9bca8f` | baja | bug | components/campo-digital/cultivos-Modales.tsx:96 | Campo 'Responsable / equipo' del modal Nueva Siembra se captura pero nunca se persiste |

## DIFERIDO

| id | sev | archivo | hallazgo | nota |
|----|-----|---------|----------|------|
| `09b0548f` | alta | components/campo-digital/TabLabores.tsx | El wizard no envía 'productos': los insumos nunca descuentan stock ni crean AplicacionProducto | Requiere selector de inventario/maquinaria reales en el wizard (cambio de UX mayor). Se hará con la API key puesta. |
| `900cea3f` | alta | components/campo-digital/TabLabores.tsx | El wizard no envía maquinaId: el costo de maquinaria nunca se prorratea al lote en Economía | Requiere selector de inventario/maquinaria reales en el wizard (cambio de UX mayor). Se hará con la API key puesta. |

## HECHO

| id | sev | archivo | hallazgo |
|----|-----|---------|----------|
| `219130ba` | critica | app/(dashboard)/clima/page.tsx | Lluvias 'Campo General' (sin lote) se guardan pero desaparecen para siempre al recargar |
| `8f68cdd7` | critica | app/(dashboard)/plan-riego/page.tsx | Los eventos de riego se guardan SIEMPRE con la fecha de hoy, ignorando la fecha sugerida/manual |
| `a0eca093` | critica | app/api/eventos-riego/route.ts | 'Agua últ. 30 días' muestra riegos de TODOS los lotes: eventos-riego no respeta el scope Campo→Lote |
| `f9d7e558` | critica | components/calculadora/calc.ts | porTanque calcula mal el producto por tanque: usa dosis×caldo (dimensionalmente incorrecto) e ignora la capacidad del tanque |
| `d7d9f802` | critica | components/campo-digital/TabCultivos.tsx | Botón 'Nueva Cosecha' es un flujo muerto en producción (lista de cultivos siempre vacía) |
| `e1e18dde` | critica | components/campo-digital/TabCultivos.tsx | Siembras y cosechas registradas NO se propagan a la vista de Estados ni a la Distribución |
| `6e71921a` | critica | components/campo-digital/TabDeteccion.tsx | La lista de Alertas Activas ignora el alcance Campo/Lote (no reacciona al sidebar) |
| `8dcdcb33` | critica | components/campo-digital/TabResumen.tsx | El KPI 'atrasadas' y los focos de labores atrasadas casi nunca detectan nada (filtran estado guardado en vez de derivarlo por fecha) |
| `a5a40297` | alta | app/(dashboard)/calculadora-dosis/page.tsx | El historial y los 5 KPIs de Inicio NO reaccionan al alcance Campo→Lote (useLoteScope) del sidebar |
| `d1f9e340` | alta | app/(dashboard)/calculadora-dosis/page.tsx | KPI 'Insumos dosificados' suma litros y kilogramos como si todo fueran litros |
| `01a34e65` | alta | app/(dashboard)/clima/page.tsx | El Registro de Lluvias ignora el lote seleccionado en el sidebar (no reacciona al scope de lote) |
| `73060f04` | alta | app/(dashboard)/cuaderno-campo/page.tsx | Filtro de tipo queda stale al cambiar de scope: la lista muestra vacío teniendo registros |
| `e6d2df5a` | alta | app/(dashboard)/cuaderno-campo/page.tsx | Fechas con off-by-one: se guardan como UTC medianoche y se renderizan en hora local (UTC-3) |
| `85d58cd0` | alta | app/(dashboard)/plan-riego/page.tsx | El fetch de eventos-riego no se re-dispara al cambiar de lote (estado stale) |
| `ddf814f7` | alta | app/(dashboard)/plan-riego/page.tsx | El modal de registro descarta método, hora, duración y selección de lotes: sólo persiste mm y observaciones |
| `c36c9b2b` | alta | app/api/planes-siembra/generar/route.ts | Regenerar con IA persiste planes DEMO fabricados como datos reales en la DB cuando no hay ANTHROPIC_API_KEY |
| `aefb71fe` | alta | app/api/pronostico-climatico/route.ts | Endpoint /api/pronostico-climatico genera datos climáticos ALEATORIOS y los persiste como si fueran reales |
| `8ee7b4dd` | alta | app/api/riego-ia/analizar/route.ts | Endpoint /api/riego-ia/analizar es código muerto con datos demo hardcodeados (fechas 2025, balance fijo) |
| `759f16af` | alta | components/campo-digital/TabCultivos.tsx | El Planificador ignora por completo el scope Campo→Lote: KPIs y planes no reaccionan al sidebar |
| `8b95b7fd` | alta | components/campo-digital/TabCultivos.tsx | KPIs de TabCultivos (Estados y Análisis de Suelo) hardcodeados con demo() ignorando los lotes/análisis reales ya cargados |
| `620f34eb` | alta | components/campo-digital/TabCultivos.tsx | El Planificador de Siembras (IA) ignora el scope global (establecimiento/lote) |
| `6be9be6e` | alta | components/campo-digital/TabCultivos.tsx | Estado stale: cambiar a un establecimiento sin lotes conserva los lotes del anterior |
| `4baf90a8` | alta | components/campo-digital/TabDeteccion.tsx | KPIs de TabDeteccion hardcodeados con demo() → muestran '—' en producción pese a haber datos reales |
| `ea6d914b` | alta | components/campo-digital/TabDeteccion.tsx | El módulo Detección no conecta con Calculadora de Dosis (flujo detección→calculadora-dosis inexistente) |
| `a1bc797f` | alta | components/campo-digital/TabDeteccion.tsx | 'Alertas Activas' muestra también alertas Resueltas/Falsas (no filtra por estado) |
| `2fcb61bb` | alta | components/campo-digital/TabDeteccion.tsx | Detección guardada en Análisis IA no aparece en Información pese a que el toast lo afirma (estado stale) |
| `ddea3e2f` | alta | components/campo-digital/TabLabores.tsx | TabLabores ignora el scope de establecimiento del sidebar (fetch único sin params ni re-fetch) |
| `86819c30` | alta | components/campo-digital/TabLabores.tsx | Deltas de KPI inventados en TabLabores: 'Sin asignar: 2', 'vs 76% mes ant.', '98% a tiempo' |
| `44688718` | alta | components/campo-digital/TabLabores.tsx | Alertas y labores bloqueadas de ejemplo (BLOQUEADAS_DEMO) siempre visibles en 'Labores Bloqueados / Alertas' |
| `b479d20f` | alta | components/campo-digital/TabLabores.tsx | TabLabores ignora el scope de establecimiento del sidebar (solo filtra por lote) |
| `45638865` | alta | components/campo-digital/TabLabores.tsx | El costo total calculado en el wizard no se persiste como CostoLote (queda solo en texto) |
| `e2b29057` | alta | components/campo-digital/TabLabores.tsx | KPIs con deltas y subtextos hardcodeados presentados como datos reales |
| `f7b4060f` | alta | components/campo-digital/TabLabores.tsx | El calendario mensual no aplica offset de día de semana: todas las fechas quedan mal alineadas |
| `649961a7` | alta | components/campo-digital/TabLotes.tsx | KPI 'Marcadores' hardcodeado (14/0) con delta falso 'Pozos, silos, casas' que no existen en el modelo de datos |
| `01accec7` | alta | components/campo-digital/TabResumen.tsx | TabResumen ignora el lote activo del sidebar: no reacciona al scope por lote |
| `dde95ea0` | alta | components/campo-digital/TabResumen.tsx | KPI 'Alertas sanitarias' y 'Focos de atención' cuentan alertas resueltas/falsas (la API no filtra por estado) |
| `db04f09c` | alta | components/campo-digital/lotes-Modales.tsx | EditarLoteModal: lista de cultivos incompleta → lote con cultivo no listado (Sorgo/Cebada/Avena) muestra el campo vacío y puede perder el cultivo |
| `af2a5f96` | alta | components/campo-digital/lotes-data.ts | 'Agua Útil' siempre '—': existe humedad de suelo real (Open-Meteo) pero nunca se conecta al KPI/chip de agua útil |
| `5e8e2f95` | media | app/(dashboard)/clima/page.tsx | Editar lluvia no persiste el cambio de fecha y rompe el round-trip de condiciones |
| `d273d479` | media | app/(dashboard)/cuaderno-campo/page.tsx | KPIs y encabezado del PDF ignoran el filtro de tipo: números inconsistentes con lo mostrado |
| `8333621f` | media | app/(dashboard)/layout.tsx | Entrada 'Campo 3D' del command palette apunta a un tab inexistente y cae en Resumen |
| `a18fc42a` | media | app/api/alertas-plagas/route.ts | Dato IA fabricado: confianza aleatoria persistida como real en alertas-plagas POST (tabla compartida con Detección) |
| `cbcc60d5` | media | components/campo-digital/TabCultivos.tsx | Análisis de Suelo: valores reales en 0 se reemplazan por defaults inventados (N/P/K/pH/MO) |
| `9c6279fa` | media | components/campo-digital/TabCultivos.tsx | Fechas con off-by-one por parseo UTC de fechas date-only (es-AR) |
| `b71af02e` | media | components/campo-digital/TabCultivos.tsx | Tarjetas 'Planes Activos' muestran el texto 'wheat'/'sprout'/'leaf'/'sun' en vez de un ícono |
| `d470d01e` | media | components/campo-digital/TabCultivos.tsx | Nuevo Análisis de Suelo: toast de éxito sin persistir cuando el lote no tiene id |
| `e849ee9c` | media | components/campo-digital/TabCultivos.tsx | Nuevos análisis de suelo no aparecen hasta recargar (estado stale, sin refetch) |
| `571955d3` | media | components/campo-digital/TabCultivos.tsx | Barras de macronutrientes con escalados arbitrarios y defaults inventados presentados como % reales |
| `c7cabc8b` | media | components/campo-digital/TabDeteccion.tsx | TabDeteccion ignora el scope del sidebar: fetch único sin establecimientoId ni re-fetch |
| `425c0815` | media | components/campo-digital/TabDeteccion.tsx | KPI 'Confianza IA' con IABadge doble y valor placeholder '96%' oculto solo por modo demo |
| `58fd33b6` | media | components/campo-digital/TabDeteccion.tsx | 'Agregar a Labores' desde Información crea la labor con superficieTrabajada 0 |
| `4e74914a` | media | components/campo-digital/TabLabores.tsx | KPI 'Completados este mes' / '% Completadas' cuenta TODAS las completadas, sin filtro de mes |
| `0c248557` | media | components/campo-digital/TabLabores.tsx | Calendario mensual de Labores no compensa el día de la semana del día 1 (desalineación de fechas) |
| `683e5b16` | media | components/campo-digital/TabLabores.tsx | Datos de operario/maquinaria inventados en 'Tareas para Hoy' de Labores |
| `8a7143ce` | media | components/campo-digital/TabLabores.tsx | KPI 'Completados este mes' cuenta TODAS las labores completadas (sin filtro de mes) |
| `6d047be4` | media | components/campo-digital/TabLabores.tsx | La columna Cultivo siempre muestra '—': la API no selecciona lote.cultivo |
| `bc39e3ac` | media | components/campo-digital/TabLabores.tsx | Off-by-one en la fecha dd/MM mostrada (Kanban/Tabla) por parsear DateTime UTC en zona negativa |
| `d8fa151b` | baja | components/campo-digital/TabCultivos.tsx | Modal Nueva Cosecha sin cultivos seleccionables en producción (lista demo → vacía) |
