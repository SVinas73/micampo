# Mejoras módulo Agronomía + Inicio (lote julio) — tracker durable

Si se corta por tokens: retomar por el primer `[ ]` pendiente. Cada ítem se commitea al completarse.

## Campo Digital / Lotes
- [x] 1. Vista plana por defecto al entrar a Lotes (la 3D carga lenta)
- [x] 2. Eliminar selector de LOTE del sidebar; el lote se elige con "Elegí un lote…" en Lotes (conectado al scope global)
- [x] 3. Eliminar selector de ESTABLECIMIENTO del submódulo Lotes (se rige por el sidebar)
- [x] 4. Notas: el punto aparece en la COORDENADA marcada (no en el centroide); color por prioridad (Crítica=rojo, Moderada=amarillo, No urgente=verde); prioridad elegible al crear la nota
- [x] 5. Ficha completa: quitar scrollbar decorativa (scroll con rueda) + ensanchar drawer (la palabra "Prescripción" queda cortada)
- [x] 6. Dibujo de lote: quitar campo "ubicación" del modal; la cruz NO debe perderse al pasar sobre otro lote; lupita de aumento junto a la cruz; poder mover/ajustar puntos ya delimitados
- [x] 7. Card flotante del lote seleccionado: la X afuera del card (al lado)

## Labores
- [x] 8. Wizard: quitar paréntesis rectos de actividades y de Normal/Urgente
- [x] 9. Wizard: "Lote y Superficie" primero, "Selección de Actividad" segundo; agregar fecha y hora de la labor (se persiste y el módulo la lee)

## Cultivos
- [x] 10. Nueva Siembra: "Block A/B/C…" → "Paso 1/2/3…"; quitar buscador de cultivo; círculo "…" junto a girasol con catálogo grande de cultivos; quitar paréntesis de Silo/Puerto/Acopio
- [x] 11. Análisis de suelo: subir PDF en "Nuevo análisis" (columna PDF lo descarga) — requiere migración
- [x] 12. Intercambiar pestañas: Planificador de Siembras (IA) a la izquierda de Detección de Enfermedades (IA)

## Calculadora de Dosis
- [x] 13. "Recomendación IA de dosis" por lote — seteado para ANTHROPIC_API_KEY (mensaje honesto sin key)

## Plan de Riego
- [x] 14. Eliminar card "Estadio fenológico" (la etapa se sigue calculando sola por fecha de siembra)
- [x] 15. Balance Hídrico: mostrar las barras IA de riego sugerido (como el diseño); dejar seteado para IA

## Cuaderno de Campo
- [x] 16. Eliminar submódulo (página + navegación)

## Inicio
- [x] 17. Campanita, Reporte semanal y Cargar por voz debajo de los KPIs, alineados a la derecha

## Vistas del mapa (complejo)
- [x] 18. Renombrar capa "NDVI"→"Satélite"; nueva capa NDVI REAL (Sentinel Hub si hay key; fallback NASA GIBS MODIS NDVI, gratuito y real) con leyenda tipo rampa
- [x] 19. Vista Cultivos: tonalidad fuerte propia por cultivo; lote vacío blanquecino
- [x] 20. Croquis en vista lista con el color del cultivo actual

## Prescripción
- [x] 21. Mapa de prescripción estilo agronómico (zonas coloreadas rojo→verde con dosis numérica por zona, contorno del lote) + brújula (N/S)

## Respuesta (no código)
- [x] 22. Análisis de QGIS (github.com/qgis/QGIS): qué es, si sirve, costo, cómo conectarlo a futuro
