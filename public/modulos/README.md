# Fondos temáticos por módulo

Colocá aquí las imágenes de fondo, con EXACTAMENTE estos nombres (todas .jpg):

| Archivo                | Imagen                       | Módulos donde se muestra                                          |
|------------------------|------------------------------|------------------------------------------------------------------|
| `inicio.jpg`           | vista aérea del campo        | Inicio (dashboard)                                               |
| `agricultura.jpg`      | tractor en el maizal         | Campo Digital, Calculadora de Dosis, Clima, Plan de Riego        |
| `ganaderia.jpg`        | vacas en la pastura          | Animales, Mov. de Tropas, Prod. Lechera, Genética, Trazabilidad  |
| `maquinaria.jpg`       | maquinaria                   | Maquinaria y MTM                                                  |
| `finanzas.jpg`         | monedas con plantas          | Finanzas, Costos, Conciliación, Comercialización, Arrendamientos |
| `gente.jpg`            | manos en la tierra (gente)   | Personal                                                         |
| `sostenibilidad.jpg`   | sostenibilidad               | Sostenibilidad                                                   |
| `logistica.jpg`        | logística                    | Logística e Inventario                                           |

Calendario no lleva imagen temática (lienzo normal); si querés agregarle
una, mandá el archivo y se suma al mapeo.

El mapeo ruta → imagen vive en `app/(dashboard)/layout.tsx` (función `moduloDeRuta`)
y los estilos en `app/globals.css` (selectores `.mc-main[data-modulo="..."]`).

Mientras falte algún archivo, el módulo simplemente muestra el lienzo normal
(sin imagen rota). Una capa del color del lienzo al 90–92 % se superpone para
mantener legibles títulos, tablas, KPIs y formularios.
