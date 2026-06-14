# Fondos temáticos por módulo

Colocá aquí las 5 imágenes de fondo, con EXACTAMENTE estos nombres (todas .jpg):

| Archivo                        | Imagen                          | Módulos donde se muestra                                              |
|--------------------------------|---------------------------------|----------------------------------------------------------------------|
| `personal.jpg`                 | manos en la tierra (gente)      | Personal                                                             |
| `finanzas.jpg`                 | monedas con plantas             | Finanzas, Costos, Conciliación, Comercialización, Arrendamientos    |
| `agronomia.jpg`                | tractor en el maizal            | Campo Digital, Calculadora de Dosis, Clima, Plan de Riego           |
| `ganaderia.jpg`                | vacas en la pastura             | Animales, Mov. de Tropas, Prod. Lechera, Genética, Trazabilidad     |
| `general.jpg`                  | campo de cultivo (hileras)      | Inicio, Logística, Maquinaria, Sostenibilidad, Calendario           |

El mapeo ruta → imagen vive en `app/(dashboard)/layout.tsx` (función `moduloDeRuta`)
y los estilos en `app/globals.css` (selectores `.mc-main[data-modulo="..."]`).

Mientras falte algún archivo, el módulo simplemente muestra el lienzo normal
(sin imagen rota). Una capa del color del lienzo al 90–92 % se superpone para
mantener legibles títulos, tablas, KPIs y formularios.
